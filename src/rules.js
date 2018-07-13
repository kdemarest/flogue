let DEPTH_MIN = 0;
let DEPTH_MAX = 19;
let DEPTH_SPAN = (DEPTH_MAX-DEPTH_MIN)+1;

let SCENT_AGE_LIMIT = 100000;

const ARMOR_EFFECT_CHANCE_TO_FIRE = 10;
const ARMOR_EFFECT_DAMAGE_PERCENT = 10;

const WEAPON_EFFECT_CHANCE_TO_FIRE = 10;
const WEAPON_EFFECT_OP_ALWAYS = ['damage'];	// Weapons with this op will ALWAYS fire their special effect
const WEAPON_EFFECT_DAMAGE_PERCENT = 20;	// Damage done is that case should be only x% of regular damage.

function ItemCalc(item,presets,field,op) {
	function calc(piece) {
		let a = piece ? (piece[field] || def) : def;
		if( isNaN(a) ) debugger;
		switch( op ) {
			case '*': n=n*a; break;
			case '+': n=n+a; break;
		};
		if( isNaN(n) ) debugger;
	}

	let def = op=='*' ? 1 : 0;
	let n = def;
	calc(item);
	if( presets ) {
		calc(presets.quality);
		calc(presets.material);
		calc(presets.variety);
		calc(presets.effect);
	}
	return n;
}

function ItemFirstValue(item,presets,field) {
	if( presets && presets.quality && presets.quality[field] !== undefined ) {
		return presets.quality[field];
	}
	if( presets && presets.material && presets.material[field] !== undefined ) {
		return presets.material[field];
	}
	if( presets && presets.variety && presets.variety[field] !== undefined ) {
		return presets.variety[field];
	}
	if( presets && presets.effect && presets.effect[field] !== undefined ) {
		return presets.effect[field];
	}
	if( item && item[field] !== undefined ) {
		return item[field];
	}
	return;	// undefined
}


let Rules = new class {
	constructor() {
		this.DAMAGE_BONUS_FOR_RECHARGE		= 0.05;	// Should reflect that, with 5 slots used, you can do x more damage than a standard weapon
		this.RANGED_WEAPON_DEFAULT_RANGE 	= 7;
		this.DEFAULT_EFFECT_DURATION 		= 10;
		this.PRICE_MULT_BUY  				= 10;
		this.PRICE_MULT_SELL 				= 3;
		this.MONSTER_DARK_VISION 			= 6;
		this.MONSTER_SIGHT_DISTANCE 		= 6;
		this.SPELL_RECHARGE_TIME 			= 10;
		this.EXTRA_RECHARGE_AT_DEPTH_MAX    = 10;
		this.COMBAT_EXPIRATION 				= 6;

	}
	 playerHealth(playerLevel) {
	 	return 90+(10*playerLevel);
	 }
	 playerArmor(playerLevel) {
	 	let armorAtLevelMin = 0.30;
	 	let armorAtLevelMax = 0.80;
	 	let armor = armorAtLevelMin+((playerLevel-1)/DEPTH_SPAN)*(armorAtLevelMax-armorAtLevelMin);
	 	return Math.clamp(armor,0.0,1.0);
	 }
	 playerDamage(playerLevel) {
	 	// Always just 1/10th of the player's hit points at this level. Monster health will scale to it.
	 	let damage = this.playerHealth(playerLevel)/10;
	 	return Math.max(1,Math.floor(damage));
	 }
	 monsterHealth(monsterLevel,hitsToKillMonster=3) {
	 	if( !hitsToKillMonster ) debugger;
	 	return Math.max(1,Math.floor(this.playerDamage(monsterLevel)*hitsToKillMonster));
	 }
	 monsterDamage(monsterLevel,hitsToKillPlayer=10) {
	 	if( !hitsToKillPlayer ) debugger;
	 	let damage = this.playerHealth(monsterLevel)/(hitsToKillPlayer*(1-this.playerArmor(monsterLevel)));
	 	return Math.max(1,Math.floor(damage));
	 }

	pickDamage(level,rechargeTime,item) {
		let h2k = ItemFirstValue(item,item,'hitsToKillPlayer');
		if( h2k !== undefined ) {
			// This just short-circuits everything and cuts to the chase.
			return this.monsterDamage(level,h2k);
		}
		let dm = ItemCalc(item,item,'xDamage','*');
		let mult = (rechargeTime||0)>1 ? 1+(rechargeTime-1)*this.DAMAGE_BONUS_FOR_RECHARGE : 1;
		let damage = this.playerDamage(level) * mult * dm;
		return Math.max(1,Math.floor(damage));
	}

	 effectPriceMultiplierByRarity(rarity) {
		return 1.3 * 1/(rarity||1.0);
	}
};

// ItemBag is the top level item probability and price manager.
// gen = the chance to generate the item. Themes can tweak this number
// eff = the change that the generated item has an effect of some kind. Rises by (area.depth*0.30)
// price = how much you have to pay to buy this thing. Multiplied by the level of the variety/material/quality
// basis = how you calculate the value and rarity
let ItemBag = (function() {
	let raw = {
		// 			cGen 	cEff	price	basis
		key: 	[	 0.0, 	 0.00,	  1.0,	[], ],
		coin: 	[	28.0, 	 0.00,	  1.0,	[], ],
		potion: [	10.0, 	 1.00,	  1.0,	['effect'], ],
		spell: 	[	 1.0, 	 1.00,	  3.0,	['effect'], ],
		ore: 	[	 5.0, 	 0.00,	  0.1,	['variety'], ],
		gem: 	[	 4.0,	 0.30,	  1.5,	['material','quality','effect'], ],
		weapon: [	10.0, 	 0.15,	  4.0,	['material','effect','variety'], ],
		ammo: 	[	 5.0, 	 0.30,	  0.1,	['material','effect','variety'], ],
		shield: [	 3.0, 	 0.25,	  3.0,	['material','effect','variety'], ],
		helm: 	[	 2.5, 	 0.15,	  2.5,	['variety','effect'], ],
		armor: 	[	 7.0, 	 0.10,	  8.0,	['variety','effect'], ],
		cloak: 	[	 3.0, 	 0.20,	  8.0,	['variety','effect'], ],
		bracers:[	 2.0, 	 0.15,	  3.5,	['variety','effect'], ],
		gloves: [	 0.5, 	 0.50,	  1.0,	['variety','effect'], ],
		boots: 	[	 2.0, 	 0.15,	  1.8,	['variety','effect'], ],
		ring: 	[	 1.0, 	 0.50,	  6.0,	['material','effect'], ],
		stuff: 	[	15.0, 	  0.0,	  0.4,	['variety'], ]
	};
	return Object.convert(raw,(row,key) => {
		let a={};
		a[key] = {
			cGen: row[0],
			cEff: row[1],
			xPrice: row[2],
			basis: row[3]
		};
		return a;
	});
})();


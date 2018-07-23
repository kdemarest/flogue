Module.add('rules',function() {

let Rules = new class {
	constructor() {
		Object.assign( this, {
			DEPTH_MIN: 0,
			DEPTH_MAX: 19,
			SCENT_AGE_LIMIT: 100000,
			ARMOR_EFFECT_CHANCE_TO_FIRE: 10,
			ARMOR_EFFECT_CHANCE_TO_FIRE_MAX: 25,
			WEAPON_EFFECT_CHANCE_TO_FIRE: 5,
			WEAPON_EFFECT_CHANCE_TO_FIRE_MAX: 25,
			WEAPON_EFFECT_OP_ALWAYS: ['damage'],	// Weapons with this op will ALWAYS fire their special effect
			WEAPON_EFFECT_DAMAGE_PERCENT: 15,	// Damage done is that case should be only x% of regular damage.
			WEAPON_EFFECT_DAMAGE_PERCENT_MAX: 30
		});
		this.DEPTH_SPAN = (this.DEPTH_MAX-this.DEPTH_MIN)+1;
		this.xLootFrequency 				= 1;
		this.xEffectChance 					= 1;
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
		this.removeScentOfTheDead 			= false;

	}
	 playerHealth(playerLevel) {
	 	return 90+(10*playerLevel);
	 }
	 playerArmor(playerLevel) {
	 	let armorAtLevelMin = 0.30;
	 	let armorAtLevelMax = 0.80;
	 	let armor = armorAtLevelMin+((playerLevel-1)/Rules.DEPTH_SPAN)*(armorAtLevelMax-armorAtLevelMin);
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

	pickDamage(level,rechargeTime,thing) {
		let h2k = calcFirst(thing,thing,'hitsToKillPlayer');
		if( h2k !== undefined ) {
			// This just short-circuits everything and cuts to the chase.
			return this.monsterDamage(level,h2k);
		}
		let dm = xCalc(thing,thing,'xDamage','*');
		let mult = (rechargeTime||0)>1 ? 1+(rechargeTime-1)*this.DAMAGE_BONUS_FOR_RECHARGE : 1;
		let damage = this.playerDamage(level) * mult * dm;
		return Math.max(1,Math.floor(damage));
	}
	effectPriceMultiplierByRarity(rarity) {
		return 1.3 * 1/(rarity||1.0);
	}
	depthRatio(depth) {
		return (depth-this.DEPTH_MIN)/this.DEPTH_MAX;
	}
	calcSpan(level,min,max) {
		return Math.floor(min + (max-min)*this.depthRatio(level));
	}
	weaponChanceToFire(level) {
		return this.calcSpan(
			level,
			this.WEAPON_EFFECT_CHANCE_TO_FIRE,
			this.WEAPON_EFFECT_CHANCE_TO_FIRE_MAX
			);
	}
	armorChanceToFire(level) {
		return this.calcSpan(
			level,
			this.ARMOR_EFFECT_CHANCE_TO_FIRE,
			this.ARMOR_EFFECT_CHANCE_TO_FIRE_MAX
		);
	}
	weaponEffectDamage(level,damage) {
		return damage * this.calcSpan(
			level,
			this.WEAPON_EFFECT_DAMAGE_PERCENT,
			this.WEAPON_EFFECT_DAMAGE_PERCENT_MAX
		) / 100;
	}
	chanceToShatter(level) {
		return 33;
	}

}();

let xCalc = function(item,presets,field,op) {
	function calc(piece) {
		let a = piece ? (piece[field] || def) : def;
		if( (op=='*' || op == '+') && isNaN(a) ) debugger;
		switch( op ) {
			case '*': n=n*a; break;
			case '+': n=n+a; break;
			case '&': n = n + (n&&a?',':'') + a; break;
		};
		if( (op=='*' || op == '+') && isNaN(n) ) debugger;
	}

	let defaultValue = {
		'*': 1,
		'+': 0,
		'&': ''
	}

	let def = defaultValue[op];
	console.assert( def !== undefined );
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

let calcFirst = function(thing,presets,field) {
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
	if( thing && thing[field] !== undefined ) {
		return thing[field];
	}
	return;	// undefined
}


// ItemBag is the top level item probability and price manager.
// gen = the chance to generate the item. Themes can tweak this number
// eff = the change that the generated item has an effect of some kind. Rises by (area.depth*0.30)
// price = how much you have to pay to buy this thing. Multiplied by the level of the variety/material/quality
// basis = how you calculate the value and rarity
Rules.ItemBag = (function() {
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

return {
	Rules: Rules,
	xCalc: xCalc,
	calcFirst: calcFirst,
}

});
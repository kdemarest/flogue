Module.add('rules',function() {

let Rules = new class {
	constructor() {
		Object.assign( this, {
			DEPTH_MIN: 0,
			DEPTH_MAX: 19,
			POWER_MAX: 100,
			SCENT_AGE_LIMIT: 100000,
			ARMOR_EFFECT_CHANCE_TO_FIRE: 10,
			ARMOR_EFFECT_CHANCE_TO_FIRE_MAX: 25,
			WEAPON_EFFECT_CHANCE_TO_FIRE: 5,
			WEAPON_EFFECT_CHANCE_TO_FIRE_MAX: 25,
			WEAPON_EFFECT_OP_ALWAYS: ['damage'],	// Weapons with this op will ALWAYS fire their special effect
			WEAPON_EFFECT_DAMAGE_PERCENT: 15,	// Damage done is that case should be only x% of regular damage.
			WEAPON_EFFECT_DAMAGE_PERCENT_MAX: 30
		});
		// Regulates the span of damage and capabilities
		this.DEPTH_SPAN = (this.DEPTH_MAX-this.DEPTH_MIN)+1;

		this.maxCharacterLevel				= 100;

		// Dial this to make all lootPicks more or less frequent. However, loot with 100% chance to appear is
		// assumed to be mandatory, so it will always appear.
		this.xLootFrequency 				= 1.0;
		this.xGlobalEnemyDensity			= 1.0;
		this.xGlobalFriendDensity			= 1.0;	// For items laying around, not loot.
		this.xGlobalItemDensity				= 1.0;	// For items laying around, not loot.

		// Adjusts how often items that might have effects actually do. See .effectChance in the item data.
		this.xLootEffectChance 				= 1;

		// Things that recharge and can be used again in 5 rounds should do less damage than things that take longer,
		// while things that take a really long time to recharge are allowed to have much more damage.
		this.DAMAGE_BONUS_FOR_RECHARGE		= 0.05;	// Should reflect that, with 5 slots used, you can do x more damage than a standard weapon

		// Unless the weapon specifies otherwise, it gets this range.
		this.RANGED_WEAPON_DEFAULT_RANGE 	= 7;
		this.rangePotion 					= 5;
		this.rangeSpell 					= 6;

		// How long effects last, unless an xDuration is specified
		this.DEFAULT_EFFECT_DURATION 		= 10;

		// This is really a tweak that makes pricing look reasonable to a human being.
		this.PRICE_MULT_BASE  				= 10;

		// When you are selling, you get paid less than when you buy, because you are a loot monster.
		this.PRICE_MULT_SELL 				= 0.3;

		// How far monsters with dark vision see, by default
		this.MONSTER_DARK_VISION 			= 6;
		this.MONSTER_SIGHT_DISTANCE 		= 6;
		this.displayVelocity 				= 10.0;

		// How many turns should an average spell require in order to recharge. Relates to DAMAGE_BONUS_FOR_RECHARGE
		this.SPELL_RECHARGE_TIME 			= 10;
		this.EXTRA_RECHARGE_AT_DEPTH_MAX    = 10;
		this.COMBAT_EXPIRATION 				= 6;
		this.removeScentOfTheDead 			= false;
		this.armorVisualScale 				= 200;
		this.blockVisualScale 				= 100;
		this.tooCloseDefault				= 4;
		this.noticeableLightRatio 			= 0.5;
		this.expectedHitsPerMonster			= 4;
		this.numTypesOfArmor				= 5;
		this.breathLimitToDamage			= 6;
		this.foodAidByLevel					= 2;
		this.narrativeHistoryLength			= 100;

		this.effectShapePriceMult = {
			single: 1.0,
			blast2: 2.0,
			blast3: 3.0,
			blast4: 4.0,
			blast5: 5.0,
			blast6: 6.0
		};
	}
	depthToPower(depth) {
		return Math.floor( (Math.min(depth,this.DEPTH_MAX)/this.DEPTH_MAX) * this.POWER_MAX );
	}
	armorDurability(fightsToLast) {
		return Math.floor( fightsToLast * this.expectedHitsPerMonster / this.numTypesOfArmor );
	}
	weaponDurability(fightsToLast) {
		return Math.floor( fightsToLast * this.expectedHitsPerMonster );
	}
	armorBreakChance(avgFightsToLast) {
		return (100.0/(avgFightsToLast*this.expectedHitsPerMonster)) * this.numTypesOfArmor;
	}
	weaponBreakChance(avgFightsToLast) {
		return (100.0/(avgFightsToLast*this.expectedHitsPerMonster));
	}

	breathDamage(health) {
		return Math.floor(health*0.30) + 2;
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
	 	// There is just one weird case. Items made in the solar temple are made on
	 	// level ZERO, and we need them to be effective on level 1.
	 	playerLevel = Math.max(playerLevel,1);
	 	// Always just 1/10th of the player's hit points at this level. Monster health will scale to it.
	 	let damage = this.playerHealth(playerLevel)/10;
	 	return Math.max(1,Math.floor(damage));
	 }
	 monsterHealth(monsterLevel,hitsToKillMonster=3) {
	 	if( !hitsToKillMonster ) debugger;
	 	// Monsters get twice as tough over the course of the game, because player perks
	 	// typically give them a cumulative 200% advantage
	 	let pct = (monsterLevel-this.DEPTH_MIN)/this.DEPTH_SPAN;
	 	return Math.max(1,Math.floor(this.playerDamage(monsterLevel)*hitsToKillMonster*(1+pct)));
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
	pickRechargeTime(level,item) {
		let xRecharge = xCalc(item,item,'xRecharge','*');
		// This variant recharge causes stacking havoc. We need to separate spells into named
		// variants to clarify the problem.
		return !item.rechargeTime ? 0 : Math.floor(item.rechargeTime*xRecharge+(level/Rules.DEPTH_SPAN)*Rules.EXTRA_RECHARGE_AT_DEPTH_MAX);
	}

	pickArmorRating(level,item) {
		let am = xCalc(item,item,'xArmor','*');
		console.assert(am>=0 && level>=0);

		// Intentionally leave out the effect level, because that is due to the effect.
		//let avgLevel = (level+this.depth)/2;
		let baseArmor = Math.floor( Rules.playerArmor(level /*avgLevel*/)*am * 100000 ) / 100000;
		if( isNaN(baseArmor) ) debugger;
		return baseArmor;
	}
	pickBlockChance(level,item) {
		let mc = xCalc(item, item,'xBlock','+');
		mc += Math.floor( (0.20 * (level/Rules.DEPTH_SPAN))*100 ) / 100;
		mc = Math.clamp(mc,0,0.8);	// I'm arbitrarily capping miss chance at 80%
		console.assert(mc>=0 && level>=0);
		return mc;
	}
	pickCoinCount(level) {
		let base = Math.max(1,level);
		return base;
	}
	priceBase(item) {
		if( item.coinCount ) {
			return item.coinCount;
		}
		let base = item.level*2 + 1;
		let xPrice = xCalc(item,item,'xPrice','*');
		let xDuration = Math.max( 1.0, xCalc(item,item,'xDuration','*') );
		let xDamage = xCalc(item,item,'xDamage','*');
		let xEffectShape = !item.effect ? 1.0 : (this.effectShapePriceMult[item.effect.effectShape] || 1);
		let xChanceOfEffect = !item.effect ? 1.0 : (item.chanceEffectFires === undefined ? 2.0 : (1+item.chanceEffectFires/100));
		// perhaps we should adjust price for the charges and the recharge time in the item... A potion that has 1 use and a spell are quite different.
		return Math.max(1,Math.floor(base * xPrice * xDuration * xDamage * xEffectShape * xChanceOfEffect * Rules.PRICE_MULT_BASE));
	}
	priceWhen(buySell,item) {
		if( item.coinCount ) {
			return item.coinCount;
		}
		return Math.max(1,Math.floor(item.price * (buySell=='sell' ? Rules.PRICE_MULT_SELL : 1)));
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


// WARNING! This must be in the same order as evaluations in dataPicker's item picker.
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
		coin: 	[	23.0, 	 0.00,	  1.0,	[], ],
		potion: [	10.0, 	 1.00,	  1.0,	['effect'], ],
		spell: 	[	 2.0, 	 1.00,	  3.0,	['effect'], ],
		ore: 	[	 3.0, 	 0.00,	  0.1,	['variety'], ],
		gem: 	[	 4.0,	 0.30,	  2.0,	['material','quality','effect'], ],
		weapon: [	10.0, 	 0.15,	  4.0,	['material','effect','variety'], ],
		ammo: 	[	15.0, 	 0.30,	  0.1,	['material','effect','variety'], ],
		shield: [	 3.0, 	 0.25,	  3.0,	['material','effect','variety'], ],
		helm: 	[	 2.5, 	 0.15,	  2.5,	['variety','effect'], ],
		armor: 	[	 7.0, 	 0.10,	  8.0,	['variety','effect'], ],
		cloak: 	[	 3.0, 	 0.20,	  8.0,	['variety','effect'], ],
		bracers:[	 2.0, 	 0.15,	  3.5,	['variety','effect'], ],
		gloves: [	 0.5, 	 0.50,	  1.0,	['variety','effect'], ],
		boots: 	[	 2.0, 	 0.15,	  1.8,	['variety','effect'], ],
		ring: 	[	 2.0, 	 0.50,	  6.0,	['material','effect'], ],
		stuff: 	[	 8.0, 	  0.0,	  0.4,	['variety'], ],
		charm: 	[	 1.0, 	  0.0,	  0.8,	['variety'], ],
		seed: 	[	 0.9, 	  0.0,	  0.1,	['variety'], ],
		vial: 	[	 0.1, 	  0.0,	  0.1,	['variety'], ],
		part: 	[	 0.0, 	  0.0,	  0.4,	['variety'], ],
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
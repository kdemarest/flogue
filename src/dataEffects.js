Module.add('dataEffects',function(extern){

const PickIgnore  		= ['mud','forceField'];
const PickVuln    		= [DamageType.BURN,DamageType.FREEZE,DamageType.SHOCK,DamageType.POISON,DamageType.SMITE,DamageType.ROT];
const PickResist  		= [DamageType.BURN,DamageType.FREEZE,DamageType.SHOCK,DamageType.POISON,DamageType.SMITE,DamageType.ROT];
const PickDeflect 		= [DamageType.CUT,DamageType.STAB,DamageType.CHOP,DamageType.BASH,DamageType.BURN,DamageType.FREEZE,DamageType.SHOCK,DamageType.SMITE,DamageType.ROT];
const PickBlock   		= [DamageType.CUT,DamageType.STAB,DamageType.CHOP,DamageType.BASH];

/**

	power (always zero so as not to tint item calculation)
	isInert
	rarity
	op
	stat
	duration
	value
	xDuration
	isPlayerOnly
	icon

EVENTS

onTargetPosition	- if the victim is moving around, things like burn have effects on the people and
					tiles nearby so we need to know when position has changed.

*/

let makeResist = function( damageType, damageTypeName, inject ) {
	return Object.assign(
		{}, 
		{
			isBuf: 1,
			isHelp: 1,
			rarity: 1.00,
			op: 'add',
			stat: 'resist',
			value: damageType,
			name: 'resist '+damageTypeName+'',
			icon: 'gui/icons/eResist.png',
			about: 'Suffer only half the effect of '+damageTypeName+'.'
		},
		inject
	);
}

let makeImmune = function( damageType, damageTypeName, inject ) {
	return Object.assign(
		{},
		 {
			isBuf: 1,
			isHelp: 1,
			rarity: 0.30,
			op: 'add',
			stat: 'immune',
			value: damageType,
			xDuration: 4.0,
			name: 'immunity to '+damageTypeName,
			icon: 'gui/icons/eImmune.png',
			about: 'Target becomes immune to '+damageTypeName+'.'
		},
		inject
	);
}

let EffectTypeList = {
	eInert: {
		isInert: 1,
		testSkip: true

		// Very important not to have rarity 0
	}, // this is special, used in the picker effect proxy! Do not change!
	eKillLabel: {
		rarity: 1.00,
		op: 'killLabel',
		duration: 0,
		icon: false
	},
//
// Tactical
//=============================================================================
	eLight: {
		isTac: 1,
		rarity: 1.00,
		op: 'max',
		stat: 'light',
		value: 6,
		xDuration: 5.0,
		isPlayerOnly: 1,
		name: 'luminari',
		icon: 'gui/icons/eLight.png',
		about: 'Sheds light over an area.'
	},
	eDark: {
		isTac: 1,
		rarity: 1.00,
		op: 'add',
		stat: 'dark',
		value: 12,
		xDuration: 5.0,
		isPlayerOnly: 1,
		name: 'darkness',
		icon: 'gui/icons/eLight.png',
		about: 'Spreads darkness over an area.'
	},
	eDarkVision: {
		isTac: 1,
		rarity: 1.00,
		op: 'max',
		stat: 'senseDarkVision',
		value: 6,
		xDuration: 5.0,
		isPlayerOnly: 1,
		name: 'dark vision',
		icon: 'gui/icons/eLight.png',
		about: 'Enables seeing in the dark.'
	},
	eSenseTreasure: {
		isTac: 1,
		rarity: 0.50,
		op: 'set',
		stat: 'senseTreasure',
		value: true,
		xDuration: 5.0,
		isPlayerOnly: 1,
		name: 'sense treasure',
		icon: 'gui/icons/eVision.png',
		about: 'Sense distant treasure through obstacles.'
	},
	eSenseLiving: {
		isTac: 1,
		rarity: 0.50,
		op: 'set',
		stat: 'senseLiving',
		value: true,
		xDuration: 5.0,
		isPlayerOnly: 1,
		name: 'sense life',
		icon: 'gui/icons/eVision.png',
		about: 'Sense living creatures through obstacles.'
	},
	eSeeInvisible: {
		isTac: 1,
		rarity: 0.50,
		op: 'set',
		stat: 'senseInvisible',
		value: true,
		xDuration: 5.0,
		isHelp: 1,
		name: 'see invisible',
		icon: 'gui/icons/eVision.png',
		about: 'See invisible things.'
	},
	eSenseXray: {
		isTac: 1,
		rarity: 0.20,
		op: 'set',
		stat: 'senseXray',
		value: 4,
		xDuration: 5.0,
		isPlayerOnly: 1,
		name: 'xray vision',
		icon: 'gui/icons/eVision.png',
		about: 'See through walls.'
	},
	eSenseSmell: {
		isTac: 1,
		rarity: 1.00,
		op: 'set',
		stat: 'senseSmell',
		value: 100,
		isHelp: true,
		name: 'bloodhound',
		icon: 'gui/icons/eFragrance.png',
		about: 'Sharpen your sense of smell.'
	},
	eTeleport: {
		isTac: 1,
		rarity: 1.00,
		op: 'teleport',
		random: true,
		duration: 0,
		xRecharge: 2.0,
		isHelp: true,
		name: 'teleport',
		icon: 'gui/icons/eTeleport.png',
		about: 'Teleport a target to a new location.'
	},
	eBlink: {
		isTac: 1,
		rarity: 1.00,
		op: 'teleport',
		targetMe: true,
		range2: 5,
		random: false,
		duration: 0,
		xRecharge: 2.0,
		isHelp: true,
		name: 'blink',
		icon: 'gui/icons/eTeleport.png',
		about: 'Teleport yourself a short distance.'
	},
	eGate: {
		isTac: 1,
		rarity: 1.00,
		op: 'gate',
		targetMe: true,
		random: false,
		duration: 0,
		xRecharge: 2.0,
		isHelp: true,
		name: 'return',
		icon: 'gui/icons/eTeleport.png',
		about: 'Gate to somewhere else.',
		testSkip: true
	},
	eOdorless: {
		isTac: 1,
		rarity: 1.00,
		op: 'max',
		stat: 'scentReduce',
		value: 100,
		isHelp: true,
		name: 'no scent',
		icon: 'gui/icons/eFragrance.png',
		about: 'Hide your scent from olfactory hunters.'
	},
	eStink: {
		isTac: 1,
		rarity: 1.00,
		op: 'max',
		stat: 'stink',
		value: 0.8,
		isHarm: true,
		name: 'stink',
		icon: 'gui/icons/eFragrance.png',
		about: 'Increase the scent of a target to overwhelming levels, hiding other scents.',
	},
	eMap: {
		isTac: 1,
		rarity: 0.50,
		op: 'custom',
		customFn: () => guiMessage('revealMinimap')
	},
//
// Buffs characters or things
//=============================================================================
	eFlight: {
		isBuf: 1,
		rarity: 1.00,
		op: 'set',
		stat: 'travelMode',
		value: 'fly',
		isHelp: 1,
		requires: e => e.travelMode == e.baseType.travelMode,
		additionalDoneTest: (self) => {
			return self.target.map.tileTypeGet(self.target.x, self.target.y).mayWalk;
		},
		icon: 'gui/icons/eFly.png',
		about: 'Fly above pits and many traps.'
	},
	eJump2: {
		isBuf: 1,
		rarity: 1.0,
		xPrice: 0.2,
		op: 'max',
		stat: 'jumpMax',
		value: 2,
		isHelp: 1,
		icon: 'gui/icons/eHaste.png',
		about: 'Improve your jump distance to 2.'
	},
	eJump3: {
		isBuf: 1,
		rarity: 0.80,
		xPrice: 0.2,
		op: 'max',
		stat: 'jumpMax',
		value: 3,
		isHelp: 1,
		icon: 'gui/icons/eHaste.png',
		about: 'Improve your jump distance to 3.'
	},
	eJump4: {
		isBuf: 1,
		rarity: 0.60,
		xPrice: 0.2,
		op: 'max',
		stat: 'jumpMax',
		value: 4,
		isHelp: 1,
		icon: 'gui/icons/eHaste.png',
		about: 'Improve your jump distance to 4.'
	},
	eHaste: {
		isBuf: 1,
		rarity: 0.30,
		op: 'mult',
		stat: 'speedAction',
		value: 2,
		isHelp: 1,
		xPrice: 3,
		requires: e => {
			console.assert( Number.isFinite(e.speedAction) );
			return e.speedAction < 5;
		},
		icon: 'gui/icons/eHaste.png',
		about: 'Move one extra square per round.'
	},
	eBravery: {
		isBuf: 1,
		rarity: 0.50,
		op: 'add',
		stat: 'immune',
		value: Attitude.PANICKED,
		isHelp: 1,
		xPrice: 3,
		name: 'bravery',
		icon: 'gui/icons/eImmune.png',
		about: 'Immunity to panic.'
	},
	eClearMind: {
		isBuf: 1,
		rarity: 0.50,
		op: 'add',
		stat: 'immune',
		value: Attitude.CONFUSED,
		isHelp: 1,
		xPrice: 3,
		name: 'clear mind',
		icon: 'gui/icons/eImmune.png',
		about: 'Immunity to confusion.'
	},
	eStalwart: {
		isBuf: 1,
		rarity: 0.50,
		op: 'add',
		stat: 'immune',
		value: Attitude.HESITANT,
		isHelp: 1,
		xPrice: 3,
		name: 'stalwart',
		icon: 'gui/icons/eImmune.png',
		about: 'Immunity to hesitation.'
	},
	eIronWill: {
		isBuf: 1,
		rarity: 0.30,
		op: 'add',
		stat: 'immune',
		value: 'possess',
		isHelp: 1,
		xPrice: 3,
		name: 'iron will',
		icon: 'gui/icons/eImmune.png',
		about: 'Immune to possession by malign minds.'
	},
	eMentalFence: {
		isBuf: 1,
		rarity: 0.20,
		op: 'add',
		stat: 'resist',
		value: [Attitude.HESITANT, Attitude.PANICKED, Attitude.CONFUSED, 'possess'].join(','),
		isHelp: 1,
		xPrice: 3,
		xDuration: 3,
		name: 'mental fence',
		icon: 'gui/icons/eResist.png',
		about: 'Immunity to panic, confusion, and hesitation.'
	},
	eMentalWall: {
		isBuf: 1,
		rarity: 0.05,
		op: 'add',
		stat: 'immune',
		value: [Attitude.HESITANT, Attitude.PANICKED, Attitude.CONFUSED, 'possess'].join(','),
		isHelp: 1,
		xPrice: 6,
		xDuration: 0.5,
		name: 'mental wall',
		icon: 'gui/icons/eImmune.png',
		about: 'Longer immunity to panic, confusion and hesitation.'
	},

	eResistBurn:	makeResist( DamageType.BURN, 'fire' ),
	eResistFreeze:	makeResist( DamageType.FREEZE, 'cold' ),
	eResistShock:	makeResist( DamageType.SHOCK, 'shock' ),
	eResistWater:	makeResist( DamageType.WATER, 'water' ),
	eResistLight:	makeResist( DamageType.LIGHT, 'light' ),
	eResistCorrode:	makeResist( DamageType.CORRODE, 'acid' ),
	eResistPoison:	makeResist( DamageType.POISON, 'poison' ),
	eResistSmite:	makeResist( DamageType.SMITE, 'smite' ),
	eResistRot:		makeResist( DamageType.ROT, 'rot' ),
	eResistSuffocate:makeResist( DamageType.SUFFOCATE, 'suffocation' ),
	eResistBlind:	makeResist( 'senseBlind', 'blindness' ),
	eResistShove:	makeResist( 'shove', 'shoving' ),

	eImmuneBurn:	makeImmune( DamageType.BURN, 'fire' ),
	eImmuneFreeze:	makeImmune( DamageType.FREEZE, 'cold' ),
	eImmuneShock:	makeImmune( DamageType.SHOCK, 'shock' ),
	eImmuneWater:	makeImmune( DamageType.WATER, 'water' ),
	eImmuneLight:	makeImmune( DamageType.LIGHT, 'light' ),
	eImmuneCorrode:	makeImmune( DamageType.CORRODE, 'acid' ),
	eImmunePoison:	makeImmune( DamageType.POISON, 'poison' ),
	eImmuneSmite:	makeImmune( DamageType.SMITE, 'smite' ),
	eImmuneRot:		makeImmune( DamageType.ROT, 'rot' ),
	eImmuneSuffocate:makeImmune( DamageType.SUFFOCATE, 'suffocation' ),
	eImmuneBlind:	makeImmune( 'senseBlind', 'blindness' ),
	eImmuneShove:	makeImmune( 'shove', 'shoving' ),

	eDeflect: {
		isBuf: 1,
		rarity: 0.50,
		op: 'add',
		stat: 'resist',
		valuePick: () => pick(PickDeflect),
		isHelp: 1,
		name: 'deflect {value}s',
		icon: 'gui/icons/eResist.png',
		about: 'Deflect some incoming {value} damage.'
	},
	eDeflectRot: {
		isBuf: 1,
		rarity: 0.50,
		op: 'add',
		stat: 'resist',
		value: DamageType.ROT,
		isHelp: 1,
		name: 'deflect rot',
		icon: 'gui/icons/eResist.png',
		about: 'Deflect incoming rotting effects.'
	},
	eBlock: {
		isBuf: 1,
		rarity: 0.50,
		op: 'add',
		stat: 'resist',
		valuePick: () => pick(PickDeflect),
		isHelp: 1,
		name: 'block {value}s',
		icon: 'gui/icons/eResist.png',
		about: 'Block all incoming {value} damage.'
	},
	eInvisibility: {
		isBuf: 1,
		rarity: 0.20,
		op: 'set',
		stat: 'invisible',
		value: true,
		isHelp: 1,
		doesItems: true,
		doesTiles: true,
		requires: e => !e.invisible,
		xDuration: 3.0,
		xRecharge: 1.5,
		icon: 'gui/icons/eInvisible.png',
		about: 'Target becomes invisible to sight.'
	},
	eRechargeFast: {
		isBuf: 1,
		rarity: 0.20,
		op: 'max',
		stat: 'rechargeRate',
		value: 1.3,
		isHelp: 1,
		xDuration: 3.0,
		icon: 'gui/icons/eMagic.png',
		about: 'Magic recharges more quickly.'
	},
	eMobility: {
		isBuf: 1,
		rarity: 0.50,
		op: 'add',
		stat: 'immune',
		value: 'eImmobilize',
		isHelp: 1,
		name: 'mobility',
		icon: 'gui/icons/eImmune.png',
		about: 'Immunity to immobilization.'
	},
	eAssassin: {
		isBuf: 1,
		rarity: 0.20,
		op: 'max',
		stat: 'sneakAttackMult',
		value: 5,
		isHelp: 1,
		name: 'mortal strike',
		icon: 'gui/icons/eSneakAttack.png',
		about: 'Sneak attacks become more effective.'
	},

//
// Debuff/Control
//=============================================================================
// All debuffs are reduced duration or effectiveness based on (critterLevel-potionLevel)*ratio
	eStun: {
		isDeb: 1,
		rarity: 0.50,
		op: 'set',
		isHarm: 1,
		stat: 'stun',
		value: true,
		xDuration: 0.3,
		icon: 'gui/icons/eShove.png',
		about: 'Stuns the target, making them unable to move or attack.'
	},
	eShove: {
		isDeb: 1,
		rarity: 0.50,
		op: 'shove',
		isHarm: 1,
		value: 2,
		duration: 0,
		icon: 'gui/icons/eShove.png',
		about: 'Shoves the target away from the attacker.'
	},
	eHesitate: {
		isDeb: 1,
		rarity: 1.00,
		op: 'set',
		stat: 'attitude',
		isHarm: 1,
		value: Attitude.HESITANT,
		isHarm: 1,
		xDuration: 0.3,
		icon: 'gui/icons/eAttitude.png',
		about: 'Target might hesitate and fail to act sometimes.'
	},
	eStartle: {
		isDeb: 1,
		rarity: 1.00,
		op: 'set',
		stat: 'attitude',
		isHarm: 1,
		value: Attitude.PANICKED,
		isHarm: 1,
		xDuration: 0.2,
		icon: 'gui/icons/eFear.png',
		about: 'Startles the target, causing them to briefly flee.'
	},
	eVulnerability: {
		isDeb: 1,
		rarity: 1.00,
		op: 'add',
		isHarm: 1,
		stat: 'vuln',
		requires: (e, effect) => e.isImmune && !e.isImmune(effect.value),
		valuePick: () => pick(PickVuln),
		isHarm: 1,
		xDuration: 2.0,
		name: 'vulnerability to {value}',
		icon: 'gui/icons/eVuln.png',
		about: 'Target will suffer double harm from {value}.'
	},
	// eNoseless - note there is no way to debuff the ability to smell. You must instead mask your own scent.
	eSlow: {
		isDeb: 1,
		rarity: 0.20,
		op: 'mult',
		isHarm: 1,
		stat: 'speedMove',
		value: 0.5,
		xDuration: 0.3,
		name: 'slow',
		icon: 'gui/icons/eSlow.png',
		about: 'Target will act half as frequently.'
	},
	eBlindness: {
		isDeb: 1,
		rarity: 0.30,
		op: 'set',
		isHarm: 1,
		stat: 'senseBlind',
		value: true,
		xDuration: 0.25,
		requires: e => !e.senseBlind,
		name: 'blinding',
		icon: 'gui/icons/eBlind.png',
		about: 'Target becomes blind.'
	},
	eConfusion: {
		isDeb: 1,
		rarity: 0.20,
		op: 'set',
		stat: 'attitude',
		isHarm: 1,
		value: Attitude.CONFUSED,
		xDuration: 0.3,
		name: 'confuse',
		icon: 'gui/icons/eAttitude.png',
		about: 'Target becomes confused, stumbling about randomly.'
	},
	ePanic: {
		isDeb: 1,
		rarity: 0.20,
		op: 'set',
		stat: 'attitude',
		isHarm: 1,
		value: Attitude.PANICKED,
		xDuration: 1.0,
		name: 'panic',
		icon: 'gui/icons/eFear.png',
		about: 'Target panics and runs in fear.'
	},
	eRage: {
		isDeb: 1,
		rarity: 0.20,
		op: 'set',
		stat: 'attitude',
		isHarm: 1,
		value: Attitude.ENRAGED,
		xDuration: 0.5,
		name: 'enrage',
		icon: 'gui/icons/eAttitude.png',
		about: 'Target becomes enraged, attacking friend and foe alike.'
	},
	ePacify: {
		isDeb: 1,
		rarity: 0.40,
		op: 'set',
		stat: 'attitude',
		isHarm: 1,
		value: Attitude.PACIFIED,
		xDuration: 0.5,
		name: 'pacify',
		icon: 'gui/icons/eAttitude.png',
		about: 'Target becomes very mellow. Nobody is an enemy.'
	},
	eAlliance: {
		isDeb: 1,
		rarity: 0.40,
		op: 'set',
		stat: 'team',
		isHarm: 1,
		value: Team.GOOD,
		xDuration: 0.5,
		name: 'alliance',
		icon: 'gui/icons/eAttitude.png',
		about: 'Target becomes your ally, for a while.'
	},
	eTame: {
		isDeb: 1,
		isHarm: 1,
		rarity: 1,
		op: 'tame',
		xDuration: 0.5,
		requires: target => target.isAnimal || target.isInsect,
		name: 'tame',
		icon: 'gui/icons/eAttitude.png',
		about: 'Target becomes your pet.'
	},
	eThrall: {
		isDeb: 1,
		isHarm: 1,
		rarity: 1,
		op: 'tame',
		xDuration: 0.5,
		requires: target => target.isSunChild || target.isEarthChild || target.isLunarChild,
		name: 'thrall',
		icon: 'gui/icons/eAttitude.png',
		about: 'Target becomes your enthralled minion.'
	},
	ePossess: {
		isDeb: 1,
		rarity: 0.20,
		op: 'possess',
		isHarm: 1,
		xDuration: 5.0,
		noPermute: true,
		icon: 'gui/icons/ePossess.png',
		about: 'Takes over the target\'s mind, putting you in their body.'
	},
	eImmobilize: {
		isDeb: 1,
		rarity: 0.40,
		op: 'set',
		isHarm: 1,
		stat: 'immobile',
		value: 1,
		xDuration: 1.0,
		requires: target => !target.immobile,
		icon: 'gui/icons/eImmobile.png',
		about: 'Makes a target unable to move for their spot.'
	},
	eDrain: {
		isDeb: 1,
		rarity: 0.40,
		op: 'drain',
		isHarm: 1,
		value: 'all',
		icon: 'gui/icons/eDrain.png'
	},
//
// Healing
//=============================================================================
	eHealing: {
		isHel: 1,
		rarity: 1.00,
		op: 'heal',
		xDamage: 6.00,
		isHelp: 1,
		duration: 0,
		healingType: DamageType.SMITE,
		icon: 'gui/icons/eHeal.png',
		about: 'Heals a target with holy force.'
	},
	eRegeneration: {
		isHel: 1,
		rarity: 1.00,
		op: 'add',
		stat: 'regenerate',
		value: 0.01,
		isHelp: 1,
		xDuration: 2.0,
		xPrice: 2.5,
		icon: 'gui/icons/eHeal.png',
		about: 'Restores health every round.'
	},
	eTrollBlood: {
		isHel: 1,
		rarity: 1.00,
		op: 'add',
		stat: 'regenerate',
		value: 0.02,
		isHelp: 1,
		xDuration: 2.0,
		xPrice: 5.0,
		icon: 'gui/icons/eHeal.png',
		about: 'Restores lots of health every round.'
	},
	eCurePoison: {
		isHel: 1,
		rarity: 1.00,
		op: 'strip',
		stripFn: deed => deed.isPoison || deed.damageType == DamageType.POISON,
		isHelp: 1,
		duration: 0,
		icon: 'gui/icons/eHeal.png',
		about: 'Halts any poison in the target.'
	},
	eCureDisease: {
		isHel: 1,
		rarity: 1.00,
		op: 'strip',
		stripFn: deed => deed.isDisease,
		isHelp: 1,
		duration: 0,
		icon: 'gui/icons/eHeal.png',
		about: 'Cures any disease on the target.'
	},
	eCureBlindness: {
		isHel: 1,
		rarity: 1.00,
		op: 'strip',
		stripFn: deed => deed.stat == 'senseBlind',
		isHelp: 1,
		duration: 0,
		icon: 'gui/icons/eHeal.png',
		about: 'Removes blindness from the target.'
	},
//
// Damage effects
//=============================================================================
	eBash: {
		isDmg: 1,
		rarity: 0.00,
		op: 'damage',
		xDamage: 1.00,
		isHarm: 1,
		duration: 0,
		damageType: DamageType.BASH,
		doesItems: true,
		icon: 'gui/icons/damageBash.png',
		about: 'Inflicts blunt trauma on the target.'
	},
	eWater: {
		isDmg: 1,
		rarity: 1.00,
		op: 'damage',
		xDamage: 1.00,
		isHarm: 1,
		duration: 0,
		damageType: DamageType.WATER,
		doesTiles: true,
		doesItems: true,
		icon: 'gui/icons/eWater.png',
		about: 'Wets the target with water. Fire creatures hate this, plants love it, and everyone else doesn\'t care.'
	},
	eBurn: {
		isDmg: 1,
		rarity: 1.00,
		op: 'damage',
		xDamage: 1.00,
		isHarm: 1,
		duration: 0,
		damageType: DamageType.BURN,
		doesTiles: true,
		doesItems: true,
		icon: 'gui/icons/eBurn.png',
		about: 'Burns the target.'
	},
	eFreeze: {
		isDmg: 1,
		rarity: 1.00,
		op: 'damage',
		xDamage: 0.80,
		isHarm: 1,
		duration: 0,
		damageType: DamageType.FREEZE,
		doesTiles: true,
		doesItems: true,
		icon: 'gui/icons/eFreeze.png',
		about: 'Freezes the target.'
	},
	eShock: {
		isDmg: 1,
		rarity: 1.00,
		op: 'damage',
		xDamage: 0.70,
		isHarm: 1,
		duration: 0,
		damageType: DamageType.SHOCK,
		doesItems: true,
		icon: 'gui/icons/eShock.png',
		about: 'Shocks the target with electricity.'
	},
	eSmite: {
		isDmg: 1,
		rarity: 1.00,
		op: 'damage',
		xDamage: 1.00,
		isHarm: 1,
		duration: 0,
		damageType: DamageType.SMITE,
		doesItems: true,
		name: 'smite',
		icon: 'gui/icons/eSmite.png',
		about: 'Smites the target with holy might.'
	},
	eRot: {
		isDmg: 1,
		rarity: 1.00,
		op: 'damage',
		xDamage: 0.2,
		isHarm: 1,
		duration: 5,
		damageType: DamageType.ROT,
		doesItems: true,
		icon: 'gui/icons/eRot.png',
		about: 'Rots the target with evil putrescence for {duration} rounds.'
	},
	eAcid: {
		isDmg: 1,
		rarity: 1.00,
		op: 'damage',
		xDamage: 0.30,
		isHarm: 1,
		duration: 3,
		damageType: DamageType.CORRODE,
		doesItems: true,
		icon: 'gui/icons/eCorrode.png',
		about: 'Corrodes the target with acid for {duration} rounds.'
	},
	ePoison: {
		isDmg: 1,
		rarity: 1.00,
		op: 'damage',
		xDamage: 0.50,
		isHarm: 1,
		isPoison: 1,
		duration: 10,
		damageType: DamageType.POISON,
		icon: 'gui/icons/ePoison.png',
		about: 'Poisons the target for {duration} rounds.'
	},
	ePoisonForever: {
		isDmg: 1,
		rarity: 0.01,
		op: 'damage',
		xDamage: 0.05,
		isHarm: 1,
		isPoison: 1,
		duration: true,
		damageType: DamageType.POISON,
		name: 'mortal poison',
		icon: 'gui/icons/ePoison.png',
		about: 'Poisons the target forever.'
	},
	eLeech: {
		isDmg: 1,
		rarity: 0.30,
		op: 'damage',
		xDamage: 0.70,
		isHarm: 1,
		duration: 0,
		isLeech: 1,
		damageType: DamageType.ROT,
		healingType: DamageType.SMITE,
		icon: 'gui/icons/eLeech.png',
		about: 'Leeches health from the target into the aggressor.'
	},
};


EffectTypeList.eBurn.onTargetPosition = function(map,x,y) {
	let tile = map.tileTypeGet(x,y);
	if( tile.mayWalk && !tile.isProblem && !tile.isPit ) {
		//map.tileSymbolSet(x,y,TileTypeList.flames.symbol);
	}
	return {
		status: 'putFire',
		success: true
	}
}

EffectTypeList.eFreeze.onTargetPosition = function(map,x,y) {
	let tile = map.tileTypeGet(x,y);
	if( tile.mayWalk && !tile.isProblem && !tile.isPit ) {
		//map.tileSymbolSet(x,y,TileTypeList.water.symbol);
	}
	return {
		status: 'putWater',
		success: true
	}

}

EffectTypeList = Type.establish(
	'EffectType',
	{
		defaults: {
			power: 0,
			isEffect: true
		},
		onRegister: (effectType) => {
			// all effect bearing items have a bigger price.
			effectType.xPrice = Rules.effectPriceMultiplierByRarity(effectType.rarity);
			console.assert( effectType.typeId );
			ResistanceList.push( effectType.typeId )
		}
	},
	EffectTypeList
);


return {
	EffectTypeList: EffectTypeList
}
});

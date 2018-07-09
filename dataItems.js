
const ItemTypeDefaults = {
	namePattern: 'nameless *',
	mayWalk: true, mayFly: true, opacity: 0,
	img: null
}

const ImgPotion = {
	eWater: 		{ img: "cyan" },
	eInvisibility: 	{ img: "clear" },
	eHaste: 		{ img: "cyan" },
	eSlow: 			{ img: "silver" },
	eRegeneration: 	{ img: "orange" },
	eFlight: 		{ img: "brilliant_blue" },
	eHealing: 		{ img: "pink" },
	ePoison: 		{ img: "emerald" },
	eFire: 			{ img: "ruby" }, 
	eCold: 			{ img: "brilliant_blue" }, 
	ePanic: 		{ img: "magenta" },
	eRage: 			{ img: "dark" },
	eConfusion: 	{ img: "brown" },
	eIgnore: 		{ img: "white" },
	eBlindness: 	{ img: "black" },
	eXray: 			{ img: "white" },
	eGreed: 		{ img: "white" },
	eEcholoc: 		{ img: "white" },
	eLuminari: 		{ img: "white" },
	eVuln: 			{ img: "black" },
	eResistance: 	{ img: "yellow" },
	eShove: 		{ img: "black" }
};

const ImgTables = {
	small: 	{ img: "decor/tableSmall.png" },
	W: 	{ img: "decor/tableW.png" },
	EW: { img: "decor/tableEW.png" },
	E: 	{ img: "decor/tableE.png" },
	N: 	{ img: "decor/tableN.png" },
	NS: { img: "decor/tableNS.png" },
	S: 	{ img: "decor/tableS.png" }
}

const ImgSigns = {
	standing: { img: "decor/sign.png" },
	onWall:    { img: "decor/signFixed.png" },
	onTable:    { img: "decor/signTable.png" },
};


// do NOT assign NullEffects to make something have no effects. Instead, give it effectChance of 0.0001
const NullEfects = { eInert: { level: 0, rarity: 1 } };
const PotionEffects = Object.filter(EffectTypeList, (e,k)=>['eCureDisease','eCurePoison','eOdorless','eStink','eBloodhound','eLuminari','eGreed','eEcholoc','eSeeInvisible','eXray','eFlight',
	'eHaste','eResistance','eInvisibility','eIgnore','eVulnerability','eSlow','eBlindness','eConfusion','eRage','eHealing','ePanic',
	'eRegeneration','eFire','ePoison','eCold','eAcid'].includes(k) );
const SpellEffects = Object.filter(EffectTypeList, (e,k)=>['ePossess','eStun','eTeleport','eStartle','eHesitate','eBlindness','eLuminari','eXray','eEcholoc',
	'eGreed','eSlow','eHealing','ePoison','eFire','eCold','eShock3','eHoly','eRot','eLeech','eRage','ePanic','eConfusion','eShove','eInvisibility'].includes(k) );
const RingEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eBloodhound','eOdorless','eRegeneration','eResistance','eGreed','eMobility','eSeeInvisible'].includes(k) );
const WeaponEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eStun','eStartle','ePoison','eFire','eCold','eShock','eLeech','eBlindness','eSlow','ePanic','eConfusion','eShove','eHoly'].includes(k) );
const AmmoEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eHoly','eHoly3','eHoly5','eHoly7','ePoison','eFire','eCold','eBlindness','eSlow','eConfusion'].includes(k) );
const ShieldEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eStun','eShove','eAbsorb','eAbsorbRot','eResistance'].includes(k) );
const HelmEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eRegeneration', 'eResistance','eLuminari','eSeeInvisible'].includes(k) );
const ArmorEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eRegeneration', 'eResistance'].includes(k) );
const CloakEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eInvisibility', 'eOdorless', 'eRechargeFast'].includes(k) );
const BracersEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eBlock'].includes(k) );
const BootsEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eOdorless','eJump2','eJump3','eRegeneration', 'eIgnore', 'eFlight', 'eResistance'].includes(k) );
const BowEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eFire','eCold','eAcid','ePoison','eHoly','eStun','eSlow'].includes(k) );
const DartEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eAcid','eAcid3','eStun','eStartle','eHesitate','eBlindness','eSlow'].includes(k) );
const GemEffects = Object.filter(EffectTypeList, (e,k)=>['inert','ePossess','eRage','eLuminari','eGreed','eEcholoc','eSeeInvisible'].includes(k) );

const WeaponMaterialList = Fab.add( '', {
	"iron": 		{ level:  0 /* very important this be zero!*/, toMake: 'iron ingot'},
	"silver": 		{ level:  5, toMake: 'silver ingot' },
	"ice": 			{ level: 25, toMake: 'ice block' },
	"glass": 		{ level: 40, toMake: 'malachite' },
	"lunarium": 	{ level: 55, toMake: 'lunarium ingot' },
	"deepium": 		{ level: 70, toMake: 'deepium ingot' },
	"solarium": 	{ level: 85, toMake: 'solarium ingot' },
});

const BowMaterialList = Fab.add( '', {
	"ash": 			{ level:  0 /* very important this be zero!*/ },
	"oak": 			{ level:  5 },
	"maple": 		{ level: 25 },
	"yew": 			{ level: 40 },
	"lunarium": 	{ level: 55 },
	"deepium": 		{ level: 70 },
	"solarium": 	{ level: 85 },
});

const ArrowMaterialList = Fab.add( '', {
	"ash": 			{ level:  0 /* very important this be zero!*/ },
	"oak": 			{ level: 15 },
	"maple": 		{ level: 25 },
	"yew": 			{ level: 40 },
	"lunarium": 	{ level: 55 },
	"deepium": 		{ level: 70 },
	"solarium": 	{ level: 85 },
});


const AmmoList = Fab.add( '', {
	"arrow":     	{
		level:  0,
		rarity: 1.0,
		attackVerb: 'shoot',
		bunchSize: 8,
		breakChance: 20,
		damageType: DamageType.STAB,
		isArrow: true,
		materials: ArrowMaterialList,
		namePattern: '{material} arrow${+plus}',
		quick: 0,
		slot: Slot.AMMO,
		img: 'UNUSED/spells/components/bolt.png'
	},
	"rock":     	{
		level:  0,
		rarity: 1.0,
		bunchSize: 4,
		xDamage: 0.50,
		damageType: DamageType.BASH,
		isRock: true,
		quick: 2,
		namePattern: 'rock${+plus}',
		mayThrow: true,
		range: Rules.RANGED_WEAPON_DEFAULT_RANGE,
		attackVerb: 'throw',
		effectChance: 0.0001,
		img: 'item/weapon/ranged/rock2.png'
	},
	"dart":     	{
		level:  0,
		rarity: 0.5,
		xDamage: 0.70,
		damageType: DamageType.STAB,
		quick: 2,
		namePattern: 'dart${+plus}{?effect}',
		effectChance: 0.80,
		chanceOfEffect: 100,
		slot: false,
		effects: DartEffects,
		mayThrow: true,
		range: 10,
		attackVerb: 'strike', 
		img: 'effect/dart2.png'
	},
});

const WeaponList = Fab.add( '', {
	// Bows are interesting because they take on the damage type of their effect. That makes
	// them large typed damage dealers, similar to spells, but with instant recharge and less
	// damage.
	"bow": {
		level:  0,
		rarity: 1.0,
		xDamage: 1.00,
		xPrice: 1.4,
		quick: 0,
		effectChance: 0.80,
		materials: BowMaterialList,
		effects: BowEffects,
		takeOnDamageTypeOfEffect: true,
		damageType: DamageType.STAB,
		mayShoot: true,
		isBow: true,
		range: Rules.RANGED_WEAPON_DEFAULT_RANGE,
		ammoType: 'isArrow',
		ammoSpec: 'ammo.arrow',
		conveyEffectToAmmo: 	true,
		conveyDamageToAmmo: 	true,
		conveyDamageTypeToAmmo: true,
		conveyQuickToAmmo: 		true,
		attackVerb: 'shoot',
		img: 'item/weapon/ranged/bow1.png'
	},
	"stealthBow": {
		level:  0,
		rarity: 0.5,
		xDamage: 0.5,
		xPrice: 3.0,
		quick: 2,
		effectChance: 0.80,
		materials: BowMaterialList,
		effects: BowEffects,
		takeOnDamageTypeOfEffect: true,
		damageType: DamageType.STAB,
		mayShoot: true,
		isBow: true,
		range: Rules.RANGED_WEAPON_DEFAULT_RANGE-1,
		ammoType: 'isArrow',
		ammoSpec: 'ammo.arrow',
		conveyEffectToAmmo: 	true,
		conveyDamageToAmmo: 	true,
		conveyDamageTypeToAmmo: true,
		conveyQuickToAmmo: 		true,
		attackVerb: 'shoot',
		img: 'item/weapon/ranged/stealthBow48.png'
	},
	"dagger": {
		level: 3,
		rarity: 0.5,
		xDamage: 0.70,
		damageType: DamageType.STAB,
		quick: 2,
		effectChance: 0.30,
		chanceOfEffect: 50,
		mayThrow: true,
		range: 4,
		attackVerb: 'strike',
		img: 'item/weapon/dagger.png'
	},

	// To make a launcher, you must specify the 
	// 	ammoType: 'isRock',
	// 	ammoSpec: 'ammo.rock',
	// 	rechargeTime: 2,
	// 	conveyDamageToAmmo: true,	// optional, but gives you lots of control over the damage.
	//	hitsToKillPlayer: 6,		// optional. You can just use xDamage or leave it alone too.
	// 	name: "rock"				// needed to help describe what happened.

	"launcher":   	{
		level:  0,
		rarity: 0.00001,
		isTreasure: false,
		isLauncher: true,
		range: Rules.RANGED_WEAPON_DEFAULT_RANGE,
		name: "launcher",
		img: 'item/weapon/elven_dagger.png'
	},

	"solarBlade": {
		level: 0,
		rarity: 0.0000001,
		xDamage: 0.33,	// This must be low to offset the fact that it is solarium.
		damageType: DamageType.SMITE,
		glow: 1,
		light: 3,
		quick: 2,
		attackVerb: 'smite',
		isSoulCollector: true,
		isUnique: true,
		isPlot: true,
		name: "blade",
		materials: [WeaponMaterialList.solarium],
		effects: [EffectTypeList.eInert],
		img: 'item/weapon/solariumBlade48.png'
	},
	"pickaxe": {
		level: 0,
		rarity: 0.01,
		xDamage: 0.70,
		damageType: DamageType.STAB,
		quick: 0,
		attackVerb: 'strike',
		mineSpeed: 1.0,
		img: 'item/weapon/pickaxe.png'
	},
	"club": {
		level: 0,
		rarity: 1.0,
		xDamage: 0.70,
		damageType: DamageType.BASH,
		quick: 1,
		attackVerb: 'smash',
		img: 'item/weapon/club.png'
	},
	"sword": {
		level: 1,
		rarity: 1.0,
		xDamage: 1.00,
		damageType: DamageType.CUT,
		quick: 2,
		img: 'item/weapon/long_sword1.png'
	},
	"greatsword": {
		level: 5,
		rarity: 0.3,
		xDamage: 1.20,
		damageType: DamageType.CUT,
		quick: 0,
		img: 'item/weapon/long_sword2.png'
	},
	"mace": {
		level: 3,
		rarity: 1.0,
		xDamage: 0.90,
		damageType: DamageType.BASH,
		quick: 1,
		img: 'item/weapon/mace1.png'
	},
	"hammer": {
		level: 4,
		rarity: 0.4,
		xDamage: 1.40,
		damageType: DamageType.BASH,
		quick: 0,
		img: 'item/weapon/hammer2.png'
	},
	"axe": {
		level: 2,
		rarity: 0.6,
		xDamage: 1.00,
		damageType: DamageType.CUT,
		quick: 1,
		mayThrow: true,
		range: 5,
		attackVerb: 'strike',
		img: 'item/weapon/battle_axe1.png'
	},
	"spear": {
		level: 8,
		rarity: 0.9,
		xDamage: 0.70,
		damageType: DamageType.STAB,
		quick: 1,
		reach: 2,
		mayThrow: true,
		range: 6,
		attackVerb: 'strike',
		img: 'item/weapon/spear2.png'
	},
	"pike": {
		level: 12,
		rarity: 0.7,
		xDamage: 0.90,
		damageType: DamageType.STAB,
		quick: 0,
		reach: 2,
		img: 'item/weapon/bardiche1.png'
	},
	"pitchfork": {
		level: 20,
		rarity: 0.5,
		xDamage: 1.20,
		damageType: DamageType.STAB,
		quick: 0,
		reach: 2,
		mayThrow: true,
		range: 4,
		img: 'item/weapon/trident1.png'
	},});

const ShieldList = Fab.add( '', {
	// We should consider making shields not just useful at range, but also maybe they have a chance to intercept incoming
	// damage and simply halt it. A miss chance.
	"buckler":     	{ level:  0, rarity: 1.0, armorMultiplier: 0.70, blockChance: 0.10 },
	"targe":     	{ level:  5, rarity: 1.0, armorMultiplier: 0.80, blockChance: 0.15 },
	"heater":     	{ level: 20, rarity: 0.8, armorMultiplier: 0.90, blockChance: 0.20 },
	"kite":     	{ level: 40, rarity: 0.6, armorMultiplier: 1.00, blockChance: 0.25 },
	"pavise":     	{ level: 60, rarity: 0.1, armorMultiplier: 1.20, blockChance: 0.30 },
});

const ArmorList = Fab.add( '', {
	"fur": 			{ level:  0, rarity: 1.0, armorMultiplier: 0.50, ingredientId: 'leather', img: 'item/armour/animal_skin1.png' },
	"hide": 		{ level:  1, rarity: 1.0, armorMultiplier: 0.80, ingredientId: 'leather', img: 'item/armour/animal_skin2.png' },
	"leather": 		{ level:  2, rarity: 1.0, armorMultiplier: 0.85, ingredientId: 'leather', img: 'item/armour/leather_armour1.png' },
	"studded": 		{ level:  3, rarity: 1.0, armorMultiplier: 0.90, ingredientId: 'iron ingot', img: 'item/armour/banded_mail2.png' },
	"scale": 		{ level:  4, rarity: 1.0, armorMultiplier: 0.95, ingredientId: 'iron ingot', img: 'item/armour/scale_mail1.png' },
	"chain": 		{ level: 10, rarity: 1.0, armorMultiplier: 1.00, ingredientId: 'iron ingot', img: 'item/armour/chain_mail1.png' },
	"steelPlate": 	{ level: 15, rarity: 1.0, armorMultiplier: 1.00, ingredientId: 'iron ingot', img: 'item/armour/plate_mail1.png' },
	"trollHideArmor": { level: 20, rarity: 1.0, armorMultiplier: 1.20, ingredientId: 'troll hide', img: 'item/armour/troll_leather_armour.png' },
	"elven": 		{ level: 30, rarity: 1.0, armorMultiplier: 1.30, ingredientId: 'chitin', img: 'item/armour/chain_mail2.png' },
	"chitin": 		{ level: 35, rarity: 1.0, armorMultiplier: 1.00, ingredientId: 'chitin', img: 'item/armour/elven_leather_armor.png' },
	"dwarven": 		{ level: 45, rarity: 1.0, armorMultiplier: 1.10, ingredientId: 'chitin', img: 'item/armour/dwarven_ringmail.png' },
	"ice": 			{ level: 50, rarity: 1.0, armorMultiplier: 1.00, ingredientId: 'ice block', img: 'item/armour/elven_ringmail.png' },
	"glass": 		{ level: 55, rarity: 1.0, armorMultiplier: 1.00, ingredientId: 'malachite', img: 'item/armour/crystal_plate_mail.png' },
	"demon": 		{ level: 65, rarity: 1.0, armorMultiplier: 1.00, ingredientId: 'malachite', img: 'item/armour/orcish_platemail.png' },
	"lunar": 		{ level: 50, rarity: 1.0, armorMultiplier: 1.00, ingredientId: 'lunarium ingot', img: 'item/armour/blue_dragon_scale_mail.png' },
	"deep": 		{ level: 80, rarity: 1.0, armorMultiplier: 1.00, ingredientId: 'deepium ingot', img: 'item/armour/gold_dragon_armour.png' },
	"solar": 		{ level: 85, rarity: 1.0, armorMultiplier: 1.00, ingredientId: 'solarium ingot', img: 'item/armour/crystal_plate_mail.png' },
});

const CloakList = Fab.add( '', {
	"corduroyCloak": 	{ level:  0, rarity: 1.0, armorMultiplier: 0.01, img: 'item/armour/cloak3.png' },
	"canvasCloak": 		{ level: 10, rarity: 1.0, armorMultiplier: 0.01, img: 'item/armour/cloak3.png' },
	"linenCloak": 		{ level: 20, rarity: 1.0, armorMultiplier: 0.01, img: 'item/armour/cloak3.png' },
	"silkCloak": 		{ level: 30, rarity: 1.0, armorMultiplier: 0.01, img: 'item/armour/cloak3.png' },
	"elvishCloak": 		{ level: 40, rarity: 1.0, armorMultiplier: 0.01, img: 'item/armour/cloak3.png' },
	"dwarvishCloak":	{ level: 50, rarity: 1.0, armorMultiplier: 0.01, img: 'item/armour/cloak3.png' },
	"demonCloak": 		{ level: 60, rarity: 1.0, armorMultiplier: 0.01, img: 'item/armour/cloak3.png' },
	"lunarCloak": 		{ level: 70, rarity: 1.0, armorMultiplier: 0.01, img: 'item/armour/cloak3.png' },
});


const HelmList = Fab.add( '', {
	"fur": 			{ level:  0, rarity: 1.0, armorMultiplier: 0.50 },
	"hide": 		{ level:  1, rarity: 1.0, armorMultiplier: 0.80 },
	"leather": 		{ level:  2, rarity: 1.0, armorMultiplier: 0.85 },
	"studded": 		{ level:  3, rarity: 1.0, armorMultiplier: 0.90 },
	"scale": 		{ level:  4, rarity: 1.0, armorMultiplier: 0.95 },
	"chain": 		{ level: 10, rarity: 1.0, armorMultiplier: 1.00 },
	"steelPlate": 	{ level: 15, rarity: 1.0, armorMultiplier: 1.00 },
	"trollHideArmor": 	{ level: 20, rarity: 1.0, armorMultiplier: 1.20 },
	"chitin": 		{ level: 25, rarity: 1.0, armorMultiplier: 1.00 },
	"elven": 		{ level: 30, rarity: 1.0, armorMultiplier: 1.30 },
	"dwarven": 		{ level: 35, rarity: 1.0, armorMultiplier: 1.10 },
	"ice": 			{ level: 40, rarity: 1.0, armorMultiplier: 1.00 },
	"glass": 		{ level: 45, rarity: 1.0, armorMultiplier: 1.00 },
	"demon": 		{ level: 50, rarity: 1.0, armorMultiplier: 1.00 },
	"lunar": 		{ level: 55, rarity: 1.0, armorMultiplier: 1.00 },
	"solar": 		{ level: 60, rarity: 1.0, armorMultiplier: 1.00 },
	"deep": 		{ level: 65, rarity: 1.0, armorMultiplier: 1.00 },
});

const BracerList = Fab.add( '', {
	"fur": 			{ level:  0, rarity: 1.0, armorMultiplier: 0.50 },
	"hide": 		{ level:  1, rarity: 1.0, armorMultiplier: 0.80 },
	"leather": 		{ level:  2, rarity: 1.0, armorMultiplier: 0.85 },
	"studded": 		{ level:  3, rarity: 1.0, armorMultiplier: 0.90 },
	"scale": 		{ level:  4, rarity: 1.0, armorMultiplier: 0.95 },
	"chain": 		{ level: 10, rarity: 1.0, armorMultiplier: 1.00 },
	"steelPlate": 	{ level: 15, rarity: 1.0, armorMultiplier: 1.00 },
	"trollHideArmor": 	{ level: 20, rarity: 1.0, armorMultiplier: 1.20 },
	"chitin": 		{ level: 25, rarity: 1.0, armorMultiplier: 1.00 },
	"elven": 		{ level: 30, rarity: 1.0, armorMultiplier: 1.30 },
	"dwarven": 		{ level: 35, rarity: 1.0, armorMultiplier: 1.10 },
	"ice": 			{ level: 40, rarity: 1.0, armorMultiplier: 1.00 },
	"glass": 		{ level: 45, rarity: 1.0, armorMultiplier: 1.00 },
	"demon": 		{ level: 50, rarity: 1.0, armorMultiplier: 1.00 },
	"lunar": 		{ level: 55, rarity: 1.0, armorMultiplier: 1.00 },
	"solar": 		{ level: 60, rarity: 1.0, armorMultiplier: 1.00 },
	"deep": 		{ level: 65, rarity: 1.0, armorMultiplier: 1.00 },
});

const BootList = Fab.add( '', {
	"fur": 			{ level:  0, rarity: 1.0, armorMultiplier: 0.50 },
	"hide": 		{ level:  1, rarity: 1.0, armorMultiplier: 0.80 },
	"leather": 		{ level:  2, rarity: 1.0, armorMultiplier: 0.85 },
	"studded": 		{ level:  3, rarity: 1.0, armorMultiplier: 0.90 },
	"scale": 		{ level:  4, rarity: 1.0, armorMultiplier: 0.95 },
	"chain": 		{ level: 10, rarity: 1.0, armorMultiplier: 1.00 },
	"steelPlate": 	{ level: 15, rarity: 1.0, armorMultiplier: 1.00 },
	"trollHideArmor": 	{ level: 20, rarity: 1.0, armorMultiplier: 1.20 },
	"chitin": 		{ level: 25, rarity: 1.0, armorMultiplier: 1.00 },
	"elven": 		{ level: 30, rarity: 1.0, armorMultiplier: 1.30 },
	"dwarven": 		{ level: 35, rarity: 1.0, armorMultiplier: 1.10 },
	"ice": 			{ level: 40, rarity: 1.0, armorMultiplier: 1.00 },
	"glass": 		{ level: 45, rarity: 1.0, armorMultiplier: 1.00 },
	"demon": 		{ level: 50, rarity: 1.0, armorMultiplier: 1.00 },
	"lunar": 		{ level: 55, rarity: 1.0, armorMultiplier: 1.00 },
	"solar": 		{ level: 60, rarity: 1.0, armorMultiplier: 1.00 },
	"deep": 		{ level: 65, rarity: 1.0, armorMultiplier: 1.00 },
});

const GloveList = Fab.add( '', {
	"furGloves": 		{ level:  0, rarity: 1.0 },
	"leatherGloves": 	{ level:  1, rarity: 1.0 },
	"assassinGloves": 	{ level:  0, rarity: 0.3, effect: EffectTypeList.eAssassin },
	"studdedGloves": 	{ level:  9, rarity: 1.0 },
	"trollHideGloves": 	{ level: 14, rarity: 1.0, name: 'troll hide gloves',
							effect: { op: 'add', stat: 'immune', value: 'frogSpine' } },
	"scale": 			{ level: 24, rarity: 1.0 },
	"chain": 			{ level: 34, rarity: 1.0 }
});



const OreVeinList = Fab.add( '', {
	"oreVeinCoal": 		{ level:  0, rarity:  1.0, name: "coal vein", mineId: 'coal', img: 'oreLumpBlack' },
	"oreVeinTin": 		{ level:  5, rarity:  1.0, name: "tin ore vein", mineId: 'oreTin', img: 'oreMetalWhite' },
	"oreVeinIron": 		{ level: 10, rarity:  0.8, name: "iron ore vein", mineId: 'oreIron', img: 'oreMetalBlack' },
	"oreVeinCopper": 	{ level: 25, rarity:  0.6, name: "copper ore vein", mineId: 'oreCopper', img: 'oreMetalOrange' },
	"oreVeinSilver": 	{ level: 30, rarity:  0.5, name: "silver ore vein", mineId: 'oreSilver', img: 'oreMetalWhite' },
	"oreVeinGold": 		{ level: 45, rarity:  0.3, name: "gold ore vein", mineId: 'oreGold', img: 'oreMetalYellow' },
	"oreVeinPlatinum": 	{ level: 55, rarity:  0.3, name: "platinum ore vein", mineId: 'orePlatinum', img: 'oreMetalBlue' },
	"oreVeinLunarium": 	{ level: 75, rarity:  0.2, name: "lunarium ore vein", mineId: 'oreLunarium', img: 'oreGemCyan' },
	"oreVeinSolarium": 	{ level: 60, rarity:  0.2, name: "solarium ore vein", mineId: 'oreSolarium', img: 'oreGemYellow' },
	"oreVeinDeepium": 	{ level: 85, rarity:  0.1, name: "deepium ore vein", mineId: "oreDeepium", img: 'oreGemBlack' },
	"oreVeinGarnet": 	{ level: 20, rarity:  0.3, name: "garnet ore vein", mineId: "gem.garnet", img: 'oreGemPurple', isGemOre: true },
	"oreVeinOpal": 		{ level: 35, rarity:  0.3, name: "opal ore vein", mineId: "gem.opal", img: 'oreGemWhite', isGemOre: true },
	"oreVeinRuby": 		{ level: 40, rarity:  0.2, name: "ruby ore vein", mineId: "gem.ruby", img: 'oreGemRed', isGemOre: true },
	"oreVeinEmerald": 	{ level: 50, rarity:  0.2, name: "emerald ore vein", mineId: "gem.emerald", img: 'oreGemGreen', isGemOre: true },
	"oreVeinSapphire": 	{ level: 65, rarity:  0.2, name: "sapphire ore vein", mineId: "gem.sapphire", img: 'oreGemBlue', isGemOre: true },
	"oreVeinDiamond": 	{ level: 80, rarity:  0.1, name: "diamond ore vein", mineId: "gem.diamond", img: 'oreGemWhite', isGemOre: true },
	// must be last!
	"oreNone": 			{ level:  0, rarity: 0.001, isNone: true, name: "ore vein", img: 'oreVein' },
});


const OreList = Fab.add( '', {
	"coal": 		{ level:  0, rarity: 1.0, name: "coal", img: 'oreLumpBlack', scale: 0.5, isFuel: true },
	"oreTin": 		{ level:  2, rarity: 1.0, name: "tin ore", refinesTo: "ingotTin", img: 'oreMetalWhite', scale: 0.5 },
	"oreIron": 		{ level:  5, rarity: 0.8, name: "iron ore", refinesTo: "ingotIron", img: 'oreMetalBlack', scale: 0.5 },
	"oreCopper": 	{ level: 10, rarity: 0.6, name: "copper ore", refinesTo: "ingotCopper", img: 'oreMetalOrange', scale: 0.5 },
	"oreSilver": 	{ level: 15, rarity: 0.5, name: "silver ore", refinesTo: "ingotSilver", img: 'oreMetalWhite', scale: 0.5 },
	"oreGold": 		{ level: 20, rarity: 0.3, name: "gold ore", refinesTo: "ingotGold", img: 'oreMetalYellow', scale: 0.5 },
	"orePlatinum": { level: 25, rarity: 0.3, name: "malachite ore", refinesTo: "ingotMalachite", img: 'oreMetalBlue', scale: 0.5 },
	"oreLunarium": 	{ level: 30, rarity: 0.2, name: "lunarium ore", refinesTo: "ingotLunarium", img: 'oreGemCyan', scale: 0.5 },
	"oreSolarium": 	{ level: 35, rarity: 0.1, name: "solarium ore", refinesTo: "ingotSolarium", img: 'oreGemYellow', scale: 0.5 },
	"oreDeepium": 	{ level: 40, rarity: 0.1, name: "deepium ore", refinesTo: "ingotDeepium", img: 'oreGemBlack', scale: 0.5 },
});

const GemQualityList = Fab.add( '', {
	"flawed": 		{ level:  0, rarity: 1.0, xPrice: 0.5 },
	"average": 		{ level:  5, rarity: 0.8, xPrice: 1.0 },
	"large": 		{ level: 10, rarity: 0.6, xPrice: 2.0 },
	"flawless": 	{ level: 15, rarity: 0.4, xPrice: 4.0 },
	"sublime": 		{ level: 20, rarity: 0.2, xPrice: 9.0 }
});

const GemList = Fab.add( '', {
	"garnet": 		{ level:  0, rarity:  0.3, img: "Gem Type1 Red" },
	"opal": 		{ level:  3, rarity:  0.3, img: "Gem Type1 Yellow" },
	"turquoise": 	{ level:  6, rarity:  0.3, img: "Gem Type1 Yellow" },
	"amethyst": 	{ level:  9, rarity:  0.3, img: "Gem Type1 Yellow" },
	"pearl": 		{ level: 12, rarity:  0.3, img: "Gem Type1 Yellow" },
	"amber": 		{ level: 15, rarity:  0.3, img: "Gem Type1 Yellow" },
	"jade": 		{ level: 18, rarity:  0.3, img: "Gem Type1 Yellow" },
	"lapis lazuli": { level: 21, rarity:  0.3, img: "Gem Type1 Yellow" },
	"topaz": 		{ level: 24, rarity:  0.3, img: "Gem Type1 Yellow" },
	"moonstone": 	{ level: 27, rarity:  0.3, img: "Gem Type1 Yellow" },
	"agate": 		{ level: 30, rarity:  0.3, img: "Gem Type1 Yellow" },
	"tourmaline": 	{ level: 33, rarity:  0.3, img: "Gem Type1 Yellow" },
	"peridot": 		{ level: 36, rarity:  0.3, img: "Gem Type1 Yellow" },
	"malachite": 	{ level: 39, rarity:  0.3, img: "Gem Type1 Yellow" },
	"citrine": 		{ level: 42, rarity:  0.3, img: "Gem Type1 Yellow" },
	"jasper": 		{ level: 45, rarity:  0.3, img: "Gem Type1 Yellow" },
	"carnelian": 	{ level: 48, rarity:  0.3, img: "Gem Type1 Yellow" },
	"chalcedony": 	{ level: 51, rarity:  0.3, img: "Gem Type1 Yellow" },
	"beryl": 		{ level: 54, rarity:  0.3, img: "Gem Type1 Yellow" },
	"spinel": 		{ level: 57, rarity:  0.3, img: "Gem Type1 Yellow" },
	"ruby": 		{ level: 60, rarity:  0.2, img: "Gem Type2 Red" },
	"emerald": 		{ level: 65, rarity:  0.2, img: "Gem Type2 Green" },
	"sapphire": 	{ level: 70, rarity:  0.2, img: "Gem Type2 Blue" },
	"diamond": 		{ level: 75, rarity:  0.1, img: "Gem Type3 Black" },
});

const StuffList = Fab.add( '', {
	"lantern": 			{ rarity: 0.2, xPrice: 10, slot: Slot.HIP, light: 10, triggerOnUse: true, autoEquip: true, effect: { op: 'set', stat: 'light', value: 10, name: 'light', icon: EffectTypeList.eLuminari.icon }, useVerb: 'clip on', img: "item/misc/misc_lamp.png" },
	"oilLamp": 			{ rarity: 0.4, xPrice: 10, slot: Slot.HIP, light:  8, triggerOnUse: true, autoEquip: true, effect: { op: 'set', stat: 'light', value:  8, name: 'light', icon: EffectTypeList.eLuminari.icon }, useVerb: 'clip on', img: "item/misc/misc_lamp.png" },
	"candleLamp": 		{ rarity: 0.6, xPrice: 10, slot: Slot.HIP, light:  4, triggerOnUse: true, autoEquip: true, effect: { op: 'set', stat: 'light', value:  4, name: 'light', icon: EffectTypeList.eLuminari.icon }, useVerb: 'clip on', img: "item/misc/misc_lamp.png" },
	"voidCandle": 		{ rarity: 0.2, xPrice: 10, slot: Slot.HIP, triggerOnUse: true, effect: { op: 'set', stat: 'dark', value: 4, name: 'shroud', icon: EffectTypeList.eDarkness.icon }, useVerb: 'clip on', img: "item/misc/darkLantern48.png" },
	"voidLamp": 		{ rarity: 0.1, xPrice: 10, slot: Slot.HIP, triggerOnUse: true, effect: { op: 'set', stat: 'dark', value: 6, name: 'shroud', icon: EffectTypeList.eDarkness.icon }, useVerb: 'clip on', img: "item/misc/darkLantern48.png" },
	"lumpOfMeat": 		{ rarity: 1.0, mayThrow: true, mayTargetPosition: true, isEdible: true, img: "item/food/chunk.png" },
	"trollHide": 		{ rarity: 0.5, img: "item/armour/troll_hide.png" },
	"bone": 			{ rarity: 1.0, mayThrow: true, mayTargetPosition: true, isEdible: true, isBone: true, img: "item/food/bone.png" },
	"antGrubMush": 		{ rarity: 0.8, isAntFood: true, mayThrow: true, mayTargetPosition: true, isEdible: true, img: "item/food/sultana.png" },
	"viperVenom": 		{ rarity: 0.6, isLiquid: true, img: "UNUSED/other/acid_venom.png" },
	"dogCollar": 		{ rarity: 1.0, isJewelry: true, img: 'item/misc/collar.png' },
	"skull": 			{ rarity: 1.0, mayThrow: true, mayTargetPosition: true, isEdible: true, isBone: true, img: 'item/misc/skull.png' },
	"mushroomBread": 	{ rarity: 1.0, mayThrow: true, mayTargetPosition: true, isEdible: true, img: 'item/food/bread_ration.png'},
	"demonScale": 		{ rarity: 0.2, img: 'item/misc/demonEye.png' },
	"demonEye": 		{ rarity: 0.2, mayThrow: true, mayTargetPosition: true, isEdible: true, isGem: true, img: 'item/misc/demonEye.png' },
	"ghoulFlesh": 		{ rarity: 0.4, mayThrow: true, mayTargetPosition: true, isEdible: true, img: 'item/food/chunk_rotten.png' },
	"pinchOfEarth": 	{ rarity: 1.0, img: 'item/weapon/ranged/rock.png' },
	"impBrain": 		{ rarity: 0.4, mayThrow: true, mayTargetPosition: true, isEdible: true },
	"ogreDrool": 		{ rarity: 1.0, isLiquid: true, mayThrow: true, mayTargetPosition: true, isEdible: true, img: 'item/misc/ogreDrool.png' },
	"centurionFigurine":{ level: 44, rarity: 0.1, mayThrow: true, mayTargetPosition: true, rechargeTime: 10*50, img: 'item/misc/solarCenturionFigurine96p.png',
						effect: { op: 'summon', value: 'solarCenturion', isServant: true, xDuration: 5.0, name: false }
						},
	"dogFigurine": 		{ level: 0, rarity: 1.0, mayThrow: true, mayTargetPosition: true, rechargeTime: 10*50, img: 'item/misc/figurine96p.png',
						effect: { op: 'summon', value: 'dog', isServant: true, xDuration: 5.0, name: false }
						},
	"viperFigurine": 	{ level: 24, rarity: 1.0, mayThrow: true, mayTargetPosition: true, rechargeTime: 10*50, img: 'item/misc/figurine96p.png',
						effect: { op: 'summon', value: 'viper', isServant: true, xDuration: 5.0, name: false }
						},
	"scarabCarapace": 	{ rarity: 1.0, },
	"darkEssence": 		{ rarity: 0.1, },
	"facetedEye": 		{ rarity: 0.4, mayThrow: true, mayTargetPosition: true, isEdible: true, isJewelry: true },
	"sunCrystal":   	{ rarity: 0.6, mayThrow: true, range: 7, light: 12, glow: 1, attackVerb: 'throw', img: "gems/sunCrystal.png", mayTargetPosition: true,
						effect: { name: 'radiance', op: 'damage', xDamage: 1.0, effectShape: EffectShape.BLAST5, effectFilter: eff=>eff.target.team==Team.EVIL, damageType: DamageType.SMITE, icon: 'gui/icons/eSmite.png' }
						},
	"trollBlood": 		{ rarity: 0.6, isLiquid: true },
	"spinneret": 		{ rarity: 0.4, },
	"chitin": 			{ rarity: 1.0, },
	"poisonGland": 		{ rarity: 0.4, },
	"snailTrail": 		{ rarity: 0.4, isLiquid: true, alpha: 0.3, img: 'dc-misc/snailSlime.png', isSnailSlime: true, mayPickup: false, existenceTime: 10 },
	"snailSlime": 		{ rarity: 0.4, isLiquid: true, alpha: 0.5, img: 'dc-misc/snailSlime.png', isSnailSlime: true, },
	"redOozeSlime": 	{ rarity: 0.2, isLiquid: true, mayThrow: true, mayTargetPosition: true, isEdible: true, img: 'item/misc/redSlime96.png' },
	"poisonSlime": 		{ rarity: 0.2, isLiquid: true, alpha: 0.5, scale: 0.25, mayThrow: true, mayTargetPosition: true, img: 'item/misc/poisonSlime96.png',
						damageType: DamageType.POISON },
	"acidTrail": 		{ rarity: 0.2, isLiquid: true, alpha: 0.2, scale: 0.35, mayThrow: true, isAcidSlime: true, img: 'item/misc/acidSlime96.png',
						damageType: DamageType.CORRODE, mayPickup: false, existenceTime: 10 },
	"acidSlime": 		{ rarity: 0.2, isLiquid: true, alpha: 0.5, scale: 0.25, mayThrow: true, mayTargetPosition: true, img: 'item/misc/acidSlime96.png',
						damageType: DamageType.CORRODE },
	"lunarEssence": 	{ rarity: 0.6, },
	"batWing": 			{ rarity: 1.0, },
	"frogSpine": 		{ rarity: 0.8, },
	"wool": 			{ rarity: 1.0, isFabricIngredient: true },
	"ingotIron": 		{ rarity: 1.0, isMetal: true },
	"ingotCopper": 		{ rarity: 0.9, isMetal: true },
	"ingotSilver": 		{ rarity: 0.8, isMetal: true },
	"ingotGold": 		{ rarity: 0.7, isMetal: true },
	"ingotTin": 		{ rarity: 1.0, isMetal: true },
	"ingotMalachite": 	{ rarity: 0.6, isMetal: true },
	"ingotLunarium": 	{ rarity: 0.5, isMetal: true },
	"ingotSolarium": 	{ rarity: 0.4, isMetal: true },
	"ingotDeepium": 	{ rarity: 0.3, isMetal: true },

});


StuffList.snailTrail.onTick = function() {
	if( this.owner.isMap ) {
		this.map.scentClear(this.x,this.y);
	}
}

StuffList.snailSlime.onTick = function() {
	if( this.owner.isMap ) {
		this.map.scentClear(this.x,this.y);
	}
}

StuffList.acidTrail.isProblem 	= TouchDamage.isProblem;
StuffList.acidTrail.onTouch 	= TouchDamage.onTouchWalk;
StuffList.acidSlime.isProblem 	= TouchDamage.isProblem;
StuffList.acidSlime.onTouch 	= TouchDamage.onTouchWalk;
StuffList.poisonSlime.isProblem = TouchDamage.isProblem;
StuffList.poisonSlime.onTouch 	= TouchDamage.onTouchWalk;


const RingMaterialList = Fab.add( '', {
	"brass": 	{ level: 0, img: 'brass' },
	"copper": 	{ level: 1, img: 'bronze' },
	"silver": 	{ level: 3, img: 'silver' },
	"gold": 	{ level: 7, img: 'gold' }
});

const RingList = Fab.add( '', {
	"garnetSetting": 	{ level:  0, rarity:  0.3, name: 'garnet' },
	"opalSetting": 		{ level:  5, rarity:  0.3, name: 'opal' },
	"rubySetting": 		{ level: 20, rarity:  0.2, name: 'ruby' },
	"emeraldSetting": 	{ level: 40, rarity:  0.2, name: 'emerald' },
	"sapphireSetting": 	{ level: 60, rarity:  0.2, name: 'sapphire' },
	"diamondSetting": 	{ level: 80, rarity:  0.1, name: 'diamond' }
});

const CoinStacks = Fab.add( '', {
	coinOne: 	{ img: "coin01" },
	coinThree: 	{ img: "coin01" },
	coinTen: 	{ img: "coinTen" },
	coinMany: 	{ img: "coinPile" },
});
let CoinImgFn = (self,img) => {
	let c = self ? self.coinCount : null;
	let cs = CoinStacks;
	return "item/misc/"+(img || (c<=1 ? cs.coinOne : (c<=4 ? cs.coinThree : (c<=10 ? cs.coinTen : cs.coinMany))).img)+".png";
};

const DoorStates = {
	open:   {
		img: 'dc-dngn/dngn_open_door.png',
		mayWalk: true, mayFly: true, opacity: 0,
	},
	shut:   {
		img: 'dc-dngn/dngn_closed_door.png',
		mayWalk: false, mayFly: false, opacity: 1,
	},
	locked: {
		img: 'dc-dngn/dngn_locked_door.png',
		mayWalk: false, mayFly: false, opacity: 1,
	}
};

const NulImg = { img: '' };

// Item Events
// onPickup - fired just before an item is picked up. Return false to disallow the pickup.
// onTick - fires each time a full turn has passed, for every item, whether in the world or in an inventory. 

let Tweak = {
	lootFrequency: 0.70,
	effectChance: 1.0
};


const ItemTypeList = {
	"random":	  { symbol: '*', isRandom: 1, mayPickup: false, neverPick: true, img: '' },
// GATEWAYS
	"stairsDown": { symbol: '>', name: "stairs down", 	isGate: 1, gateDir: 1, gateInverse: 'stairsUp', mayPickup: false, useVerb: 'descend', img: "dc-dngn/gateways/stone_stairs_down.png" },
	"stairsUp":   { symbol: '<', name: "stairs up", 	isGate: 1, gateDir: -1, gateInverse: 'stairsDown', mayPickup: false, useVerb: 'ascend', img: "dc-dngn/gateways/stone_stairs_up.png" },
	"gateway":    { symbol: 'O', name: "gateway", 		isGate: 1, gateDir: 0, gateInverse: 'gateway', mayPickup: false, useVerb: 'enter', img: "dc-dngn/gateways/dngn_enter_dis.png" },
	"portal":     { symbol: '0', name: "portal", 		isGate: 1, gateDir: 0, gateInverse: 'portal', mayPickup: false, useVerb: 'touch', img: "dc-dngn/gateways/dngn_portal.png" },
	"pitDrop": 	  { symbol: SYM, name: "pit drop", 		isGate: 1, gateDir: 1, gateInverse: false, mayPickup: false, useVerb: 'fall', img: "effect/pitDrop.png" },
// DOOR
	"door":       { symbol: '+', mayWalk: true,  mayFly: true,  opacity: 0,
					namePattern: "{state} door",
					isDoor: 1,
					mayPickup: false,
					keyId: false,
					state: 'open',
					states: DoorStates,
					imgChoices: DoorStates,
					imgGet: (self,img) => img || self.imgChoices[self.state].img
				},
// MARKERS
	"marker": 	  { symbol: SYM, name: "marker", rarity: 1, mayPickup: false, img: "gui/icons/marker.png" },
// DECOR
	"columnBroken": {
		symbol: SYM,
		mayWalk: false,
		mayFly: false,
		rarity: 1,
		name: "broken column",
		isDecor: true,
		img: "dc-dngn/crumbled_column.png"
	},
	"columnStump": {
		symbol: SYM,
		mayWalk: false,
		mayFly: true,
		rarity: 1,
		name: "column stump",
		isDecor: true,
		img: "dc-dngn/granite_stump.png"
	},
	"brazier": {
		symbol: SYM,
		mayWalk: false,
		mayFly: true,
		opacity: 0,
		name: "brazier",
		light: 6,
		glow: 1,
		img: "spells/fire/sticky_flame.png"
	},
	"table": {
		symbol: SYM,
		mayWalk: false,
		mayFly: true,
		opacity: 0,
		name: "table",
		isDecor: true,
		isTable: true,
		zOrder: ZOrder.TABLE,
		img: "decor/tableSmall.png",
		imgChoices: ImgTables,
		imgGet: (self, img) => img || self.img
	},
	"sign": {
		symbol: SYM,
		mayWalk: true,
		mayFly: true,
		opacity: 0,
		name: "sign",
		mayPickup: false,
		zOrder: ZOrder.SIGN,
		isDecor: true,
		isSign: true,
		allowPlacementOnBlocking: true,
		img: "decor/sign.png",
		imgChoices: ImgSigns,
		imgGet: (self, img) => img || self.img
	},
	"bed": {
		symbol: SYM,
		mayWalk: false,
		mayFly: true,
		opacity: 0,
		name: "wooden bed",
		mayPickup: false,
		isDecor: true,
		isBed: true,
		imgChoices: {
			head: {
				img: 'decor/bedHead.png'
			},
			foot: {
				img: 'decor/bedFoot.png'
			}
		},
		imgGet: (self, img) => img || self.img
	},
	"barrel": {
		symbol: SYM,
		mayWalk: false,
		mayFly: true,
		opacity: 0,
		name: "barrel",
		mayPickup: false,
		isDecor: true,
		state: 'shut',	// This is required to stop the user from "seeing inside" with mouse hover.
		inventoryLoot: '3x 20% any',
		hasInventory: true,
		img: 'decor/barrel.png'
	},
	"chest": {
		symbol: SYM,
		mayWalk: false,
		mayFly: true,
		opacity: 0,
		name: "chest",
		mayPickup: false,
		isDecor: true,
		state: 'shut',
		imgChoices: {
			shut: { img: 'decor/chestShut.png' },
			open: { img: 'decor/chestOpen.png' },
			empty: { img: 'decor/chestEmpty.png' }
		},
		imgGet: (self,img) => img || self.imgChoices[self.state].img,
		inventoryLoot: '5x 50% any',
		hasInventory: true
	},
	"altar": {
		symbol: SYM,
		mayWalk: false,
		mayFly: false,
		rarity: 1,
		name: "golden altar",
		mayPickup: false,
		light: 4,
		glow: true,
		hasInventory: true,
		isDecor: true,
		rechargeTime: 12,
		healMultiplier: 3.0,
		sign: "This golden alter to Solarus glows faintly.\nTouch it to heal or level up.",
		effect: {
			op: 'heal',
			xDamage: 6.00,
			healingType: DamageType.SMITE,
			icon: 'gui/icons/eHeal.png'
		},
		img: "dc-dngn/altars/dngn_altar_shining_one.png"
	},
	"fountain": {
		symbol: SYM,
		mayWalk: false,
		mayFly: true,
		rarity: 1,
		mayPickup: false,
		name: "fountain",
		isDecor: true,
		img: "dc-dngn/dngn_blue_fountain.png"
	},
	"fontSolar": {
		symbol: 'S',
		mayWalk: true,
		mayFly: true,
		rarity: 1,
		mayPickup: false,
		name: "solar font",
		light: 10,
		glow: 1,
		isDecor: true,
		img: "dc-dngn/mana/fontSolar.png"
	},
	"fontDeep": {
		symbol: 'D',
		mayWalk: true,
		mayFly: true,
		rarity: 1,
		mayPickup: false,
		name: "deep font",
		rechargeTime: 4,
		effectDrain: EffectTypeList.eDrain,
		xDamage: 0.3,
		effectPeriodic: EffectTypeList.eRot,
		dark: 10,
		glow: 1,
		isDecor: true,
		img: "dc-dngn/mana/fontDeep.png"
	},
// ORE VEINS
	"oreVein":    {
		symbol: 'v',
		mayWalk: false,
		mayFly: false,
		rarity: 1,
		opacity: 1,
		isWall: true,
		noneChance: 0.90,
		imgGet: (self,img) => "ore/"+(img || self.variety.img || "oreVein")+".png",
		imgChoices: OreVeinList,
		varieties: OreVeinList,
		mineSwings: 14
	},
// FAKE
	"fake":   	{ symbol: SYM, isFake: true, namePattern: "fake", rarity: 1, img: 'UNUSED/spells/components/skull.png', icon: "corpse.png" },
// CORPSE
	"corpse":   { symbol: SYM, namePattern: "remains of a {mannerOfDeath} {usedToBe}", rarity: 1,
				isCorpse: true,
				zOrder: ZOrder.CORPSE,
				img: 'UNUSED/spells/components/skull.png', icon: "corpse.png" },
// KEYS
	"key": {
		symbol: 		'k',
		namePattern: 	'key to {keyId}',
		isTreasure: 	1,
		isKey: 			true,
		noSell: 		true,
		img: 			"UNUSED/other/key.png",
		icon: 			'key.png'
	},
// TREASURE
	"coin": 	{
		symbol: 		'$',
		namePattern: 	'{coinCount} gold',
		coinCount: 		0,
		coinVariance: 	0.30,
		isCoin: 		true,
		isTreasure: 	1,
		imgGet: 		CoinImgFn,
		imgChoices: 	CoinStacks,
		icon: 			'coin.png'
	},
	"potion":   {
		symbol: 		'p',
		isTreasure: 	1,
		namePattern: 	'potion${?effect}{+plus}',
		charges: 		1,
		xDamage: 		1.5,	// Single use, so more damage.
		light: 			3,
		glow: 			true,
		attackVerb: 	'splash',
		isPotion: 		true,
		range: 			Rules.RANGED_WEAPON_DEFAULT_RANGE,
		effects: 		PotionEffects,
		mayThrow: 		true,
		destroyOnLastCharge: true,
		imgGet: 		(self,img)=>"item/potion/"+(img || (ImgPotion[self.effect?self.effect.typeId:'']||NulImg).img || "emerald")+".png",
		imgChoices: 	ImgPotion,
		icon: 			'potion.png'
	},
	"spell":    {
		symbol: 		's',
		isTreasure: 	1,
		namePattern: 	'spell${?effect}{+plus}',
		rechargeTime: 	Rules.SPELL_RECHARGE_TIME,
		effects: 		SpellEffects,
		mayCast: 		true,
		isSpell: 		true,
		range: 			Rules.RANGED_WEAPON_DEFAULT_RANGE,
		img: 			"item/scroll/scroll.png",
		icon: 			'spell.png'
	},
	"ore": 		{
		symbol: 		'o',
		isTreasure: 	1,
		namePattern: 	'{variety}',
		varieties: 		OreList,
		isOre: 			true,
		imgGet: 		(self,img) => "ore/"+(img || self.variety.img || "ore")+".png",
		imgChoices: 	OreList,
		icon: 			'ore.png'
	},
	"gem": 		{
		symbol: 		"g",
		isTreasure: 	1,
		namePattern: 	'{quality} {variety}${+plus}{?effect}',
		qualities: 		GemQualityList,
		varieties: 		GemList,
		effects: 		GemEffects,
		isGem: 			true,
		mayThrow: 		1,
		mayGaze: 		1,
		range: 			Rules.RANGED_WEAPON_DEFAULT_RANGE,
		mayTargetPosition: 1,
		autoCommand: 	Command.USE,
		imgGet: 		(self,img) => "gems/"+(img || self.variety.img || "Gem Type2 Black")+".png",
		imgChoices: 	GemList,
		scale: 			0.3,
		icon: 			'gem.png'
	},
	"weapon": 	{
		symbol: 'w',
		isTreasure: 1,
		namePattern: '{material} {variety}${+plus}{?effect}',
		materials: WeaponMaterialList,
		varieties: WeaponList,
		effects: WeaponEffects,
		slot: Slot.WEAPON,
		isWeapon: true,
		useVerb: 'weild',
		mayTargetPosition: true,
		img: "item/weapon/dagger.png",
		icon: 'weapon.png'
	},
	"ammo": 	{
		symbol: 'm',
		isTreasure: 1,
		namePattern: '{material} {variety}${+plus}{?effect}',
		varieties: AmmoList,
		donBunches: true,
		isWeapon: true,
		isAmmo: true,
		slot: Slot.AMMO,
		useVerb: 'ready',
		img: "item/weapon/dagger.png",
		icon: 'ammo.png'
	},
	"shield": {
		symbol: 'x',
		isTreasure: 1,
		namePattern: "{variety} shield${+plus}{?effect}",
		varieties: ShieldList,
		effects: ShieldEffects,
		slot: Slot.SHIELD,
		isShield: true,
		armorMultiplier: 0.50,
		useVerb: 'hold',
		triggerOnUseIfHelp: true,
		effectOverride: {
			duration: true
		},
		img: "item/armour/shields/shield3_round.png",
		icon: 'shield.png'
	},
	"helm": {
		symbol: 'h',
		isTreasure: 1,
		namePattern: "{variety} helm${+plus}{?effect}",
		varieties: HelmList,
		effects: HelmEffects,
		slot: Slot.HEAD,
		isHelm: true,
		isArmor: true,
		armorMultiplier: 0.15,
		useVerb: 'wear',
		triggerOnUseIfHelp: true,
		effectOverride: {
			duration: true
		},
		img: "item/armour/headgear/helmet2_etched.png",
		icon: 'helm.png'
	},
	"armor": {
		symbol: 'a',
		isTreasure: 1,
		namePattern: "{variety} armor${+plus}{?effect}",
		varieties: ArmorList,
		effects: ArmorEffects,
		slot: Slot.ARMOR,
		isArmor: true,
		armorMultiplier: 0.60,
		useVerb: 'wear',
		triggerOnUseIfHelp: true,
		effectOverride: {
			duration: true
		},
		imgGet: (self, img) => (img || self.variety.img || "item/armour/chain_mail1.png"),
		imgChoices: ArmorList,
		icon: 'armor.png'
	},
	"cloak": {
		symbol: 'c',
		isTreasure: 1,
		namePattern: "{variety}${+plus}{?effect}",
		varieties: CloakList,
		effects: CloakEffects,
		slot: Slot.ARMOR,
		isArmor: true,
		isCloak: true,
		armorMultiplier: 0.01,
		useVerb: 'wear',
		triggerOnUseIfHelp: true,
		effectOverride: { duration: true },
		imgGet: (self,img) => (img || self.variety.img || "item/armour/chain_mail1.png"),
		imgChoices: CloakList,
		icon: 'armor.png'
	},
	"bracers": {
		symbol: 'b',
		isTreasure: 1,
		namePattern: "{variety} bracers{+plus}{?effect}",
		varieties: BracerList,
		effects: BracersEffects,
		slot: Slot.ARMS,
		isBracers: true,
		isArmor: true,
		armorMultiplier: 0.15,
		useVerb: 'wear',
		triggerOnUseIfHelp: true,
		effectOverride: { duration: true },
		img: "UNUSED/armour/gauntlet1.png",
		icon: 'bracers.png'
	},
	"gloves": {
		symbol: 'l',
		isTreasure: 1,
		namePattern: "{variety}$",
		varieties: GloveList,
		slot: Slot.HANDS,
		isGloves: true,
		useVerb: 'wear',
		triggerOnUseIfHelp: true,
		effectOverride: { duration: true },
		img: "UNUSED/armour/glove4.png",
		icon: 'gloves.png'
	},
	"boots": {
		symbol: 'z',
		isTreasure: 1,
		namePattern: "{variety} boots{+plus}{?effect}",
		varieties: BootList,
		slot: Slot.FEET,
		isBoots: true,
		isArmor: true,
		effects: BootsEffects,
		armorMultiplier: 0.10,
		useVerb: 'wear',
		triggerOnUseIfHelp: true,
		effectOverride: {
			duration: true
		},
		img: "item/armour/boots2_jackboots.png",
		icon: 'boots.png'
	},
	"ring": {
		symbol: 'r',
		isTreasure: 1,
		namePattern: "{material} {variety} ring${+plus}{?effect}",
		materials: RingMaterialList,
		varieties: RingList,
		effects: RingEffects,
		slot: Slot.FINGERS,
		isRing: true,
		isJewelry: true,
		useVerb: 'wear',
		triggerOnUse: true,
		effectOverride: { duration: true },
		imgGet: (self, img) => "item/ring/" + (img || self.material.img || 'gold') + ".png",
		imgChoices: RingMaterialList,
		icon: 'ring.png'
	},
	// INGREDIENTS
	"stuff": {
		symbol: 't',
		isTreasure: 1,
		isStuff: 1,
		namePattern: "{variety}${?effect}",
		varieties: StuffList,
		imgGet: (self, img) => (img || (self ? self.variety.img : '') || 'item/misc/misc_rune.png'),
		imgChoices: StuffList,
		icon: 'stuff.png'
	},
};

(function() {
	// 		core: [ '@', 1, '3:10', 'good', 'cut', 'dc-mon/elf.png', 'he' ],
	for( let typeId in ItemTypeList ) {
		let itemType = ItemTypeList[typeId];
		if( !itemType.isTreasure ) continue;
		console.assert( !itemType.xPrice && !itemType.effectChance );
		console.assert( ItemBag[typeId] );
		ItemTypeList[typeId].xPrice 		= ItemBag[typeId].xPrice;
		ItemTypeList[typeId].effectChance	= ItemBag[typeId].cEff;
	}
})();


const ItemSortOrder = ['weapon','ammo','helm','armor','cloak','bracers','gloves','boots','shield','ring','potion','gem','ore','spell','stuff','key'];
const ItemFilterOrder = ['','weapon','armor','shield','potion','spell','ring','gem','ore','stuff'];
const ItemFilterGroup = {
	weapon: ['weapon','ammo'],
	armor:  ['armor','cloak','helm','bracers','gloves','boots'],
	shield: ['shield'],
	ring:   ['ring'],
	potion: ['potion'],
	gem:    ['gem'],
	ore:    ['ore'],
	spell:  ['spell'],
	stuff:  ['stuff','key']
};


ItemTypeList.oreVein.onBump = function(entity,self) {
	let tool = entity.getFirstItemInSlot(Slot.WEAPON);
	if( !tool || !tool.mineSpeed ) {
		tell(mSubject,entity,' ',mVerb,'need',' a pickaxe to mine this ore.');
		return;
	}
	entity.swings = (entity.swings||0)+1;
	let dx = self.x - entity.x ;
	let dy = self.y - entity.y;
	let deg = deltaToDeg(dx,dy);
	new Anim( {}, {
		follow: 	entity,
		duration: 	0.1,
		onInit: 		a => { a.puppet(entity.spriteList); },
		onSpriteMake: 	s => { s.sPosDeg(deg,0.2); },
		onSpriteDone: 	s => { s.sReset(); }
	});
	let chunkAnim = new Anim({},{
		at: 		self,
		img: 		StickerList.oreChaff.img, //self.imgGet(self),
		duration: 	0.2,
		onInit: 		a => { a.create(6); },
		onSpriteMake: 	s => { s.sScaleSet(0.3).sVel(Math.rand(-90,90),Math.rand(2,5)); s.zOrder=100; },
		onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel).sGrav(40).sRot(360); }
	});
	new Anim( {}, {
		at: 		self,
		img: 		self.imgGet(self),
		duration: 	chunkAnim,
		onSpriteMake: 	s => { },
		onSpriteTick: 	s => { s.sQuiver(0.1,0.1); }
	});

	entity.timeDelay = Math.max(entity.timeDelay||0,0.10);
	if( entity.swings >= self.mineSwings/tool.mineSpeed ) {
		entity.swings = 0;
		entity.map.tileSymbolSetFloor( self.x, self.y );
		if( self.mineId ) {
			let picker = new Picker(entity.area.depth);
			picker.pickLoot( self.mineId, loot=>{
				loot.giveTo(entity.map,self.x,self.y);
			});
		}
		self.destroy();
	}
}


ItemTypeList.altar.onBump = function(toucher,self) {
	let delay = 0;
	if( self.inventory && self.inventory.length ) {
		toucher.inventoryTake( self.inventory, self, false, item => {
			delay += 0.2;
		});
	}

	if( self.unhide ) {
		delay += 1.0;
		let label = self.unhide;
		let hidList = [].concat( self.map.itemListHidden );
		hidList.forEach( item => {
			item.unhide();
			animFloatUp( item, StickerList.ePoof.img, delay );
			delay += 0.2;
		});
		delete self.unhide;
	}

	if( toucher.isChosenOne && ( !toucher.deathReturn || !self.isAtTarget(toucher.deathReturn) ) ) {
		tell(mSubject|mCares,toucher,' will return here upon death.');
		toucher.deathReturn = {
			x:self.x,
			y:self.y,
			px: toucher.x,
			py: toucher.y,
			area:self.area,
			name: 'death return'
		};
		toucher.onDeath = entity => {
			entity.gateTo( entity.deathReturn.area, entity.deathReturn.px, entity.deathReturn.py);
			entity.vanish = false;
			entity.health = entity.healthMax;
			entity.dead = false;
		};
		return;
	}

	if( toucher.isMonsterType && toucher.experience!==undefined ) {
		if( toucher.levelUp() ) {
			return;
		}
	}
	if( !self.rechargeLeft) {
		if( toucher.health >= toucher.healthMax ) {
			tell( mSubject|mCares,toucher,' ',mVerb,'is',' already at full health.');
		}
		else {
			effectApply(self.effect,toucher,null,self);
			self.depleted = true;
		}
	}
	else {
		tell( mCares,toucher,mSubject,self,' ',mVerb,'is',' not glowing at the moment.');
	}
}

ItemTypeList.altar.onTick = function(dt) {
	if( this.depleted && !this.rechargeLeft ) {
		tell( mSubject,this,' ',mVerb,'begin',' to glow.');
		this.depleted = false;
	}
	this.glow = !this.rechargeLeft;
	this.light = this.rechargeLeft ? 0 : ItemTypeList.altar.light;
}

ItemTypeList.table.imgChoose = function(map,x,y) {
	let w = map.findItemAt(x-1,y).filter(item=>item.isTable).count;
	let e = map.findItemAt(x+1,y).filter(item=>item.isTable).count;
	if( e || w ) {
		this.img = this.imgChoices[(w ? (e ? 'EW' : 'E') : 'W')].img;
		return;
	}
	let n = map.findItemAt(x,y-1).filter(item=>item.isTable).count;
	let s = map.findItemAt(x,y+1).filter(item=>item.isTable).count;
	if( n || s ) {
		this.img = this.imgChoices[(n ? (s ? 'NS' : 'S') : 'N')].img;
		return;
	}
	return 'small';
}


ItemTypeList.bed.imgChoose = function(map,x,y) {
	let n = map.findItemAt(x,y-1).filter(item=>item.isBed).first;
	this.img = this.imgChoices[n?'head':'foot'].img;
}


ItemTypeList.sign.imgChoose = function(map,x,y) {
	let tile = map.tileTypeGet(x,y);
	let item = map.findItemAt(x,y).filter(item=>!item.mayWalk).first;
	if( !tile.mayWalk || item ) {
		this.img = this.imgChoices[item && item.isTable ? 'onTable' : 'onWall'].img;
		return;
	}
	this.img = this.imgChoices.standing.img;
}

ItemTypeList.door.onBump = function(entity,self) {
	if( self.state == 'open' ) {
		return;
	}
	if( !entity.able('open') ) {
		return false;
	}
	if( self.state == 'shut' ) {
		self.setState('open');
		spriteDeathCallback(self.spriteList);
		tell(mSubject,entity,' ',mVerb,'open',' the ',mObject,self);
		animFloatUp(self,StickerList.open.img);
		return true;
	}
	if( self.state == 'locked' ) {
		let key = new Finder(entity.inventory).filter(item=>self.keyId && item.keyId==self.keyId).first;
		let hasKey = self.keyId===undefined || key;
		if( hasKey ) {
			self.setState('shut');
			spriteDeathCallback(self.spriteList);
			tell(mSubject,entity,' ',mVerb,'unlock',' the ',mObject,self);
			animFloatUp(self,StickerList.unlock.img);
			if( key && key.name.indexOf('(used)') < 0 ) {
				key.name += ' (used)';
			}
			return true;
		}
		tell(mSubject,self,' requires a specific key to unlock.');
		animFloatUp(self,StickerList.locked.img);		
		return false;
	}
	debugger;
}

ItemTypeList.chest.onBump = function(toucher,self) {
	if( self.state == 'shut' ) {
		if( self.onOpen ) {
			let allow = self.onOpen(self,toucher);
			if( allow === false ) return;
		}
		self.state = self.inventory && self.inventory.length > 0 ? 'open' : 'empty';
	}
	else {
		if( self.inventory && self.inventory.length > 0 ) {
			guiMessage( 'hide' );
			if( self.onLoot ) {
				let allow = self.onLoot(self,toucher);
				if( allow === false ) return;
			}
//			let delay = 0;
			toucher.inventoryTake(self.inventory, self, false); //, item => {
//				new Anim({},{
//					at: 		self,
//					img: 		item.imgGet ? item.imgGet(item) : item.img,
//					delay: 		delay,
//					duration: 	0.6,
//					onSpriteMake: 	s => { s.sVelTo(MaxVis,0,0.6); },
//					onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel).sScaleSet(1+(s.elapsed/s.duration)); }
//				});
//				delay += 0.3;
//			});
			animFountain(self,20,1.0,4,StickerList.coinSingle.img);
		}
		self.state = self.inventory && self.inventory.length > 0 ? 'open' : 'empty';
	}
	spriteDeathCallback(self.spriteList);
}

ItemTypeList.barrel.onBump = function(toucher,self) {
	if( self.inventory && self.inventory.length > 0 ) {
		if( self.onLoot ) {
			let allow = self.onLoot(self,toucher);
			if( allow === false ) return;
		}
//		let delay = 0;
		toucher.inventoryTake(self.inventory, self, false ); //, item => {
//			new Anim({},{
//				at: 		self,
//				img: 		item.imgGet ? item.imgGet(item) : item.img,
//				delay: 		delay,
//				duration: 	0.6,
//				onSpriteMake: 	s => { s.sVelTo(MaxVis,0,0.6); },
//				onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel).sScaleSet(1+(s.elapsed/s.duration)); }
//			});
//			delay += 0.3;
//		});
	}

	new Anim({},{
		follow: 	self,
		img: 		self.img,
		duration: 	0.6,
		onInit: 		a => { a.create(5); },
		onSpriteMake: 	s => { let deg=Math.rand(0-60,0+60); s.sScaleSet(0.7).sVel(deg,Math.rand(5,7)); s.rot = deg/60*Math.PI; },
		onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel).sGrav(20); s.rotation += s.rot*s.delta; }
	});

	self.destroy();
}

ItemTypeList.fontSolar.onTick = function(dt) {
	let nearby = new Finder(this.area.entityList,this).filter(e=>e.team==Team.GOOD).clearShot().nearMe(3);
	let self = this;
	nearby.process( entity => {
		let deed = DeedManager.findFirst( d=>d.target && d.target.id==entity.id && d.isSolarRegen );
		if( deed ) {
			deed.timeLeft = 2;
		}
		else {
			let glowAnim = new Anim( {}, {
				follow: 	entity,
				img: 		StickerList.glowGold.img,
				duration: 	true,
				onInit: 		a => { a.create(1); },
				onSpriteMake: 	s => { s.sScaleSet(0.30).sPos(0,-0.7); },
			});
			let effect = new Effect(this.area.depth,{
				isSolarRegen: true,
				op: 'add',
				stat: 'regenerate',
				value: 0.05,
				duration: 4,
				icon: EffectTypeList.eRegeneration.icon,
				onEnd: () => glowAnim.die()
			});
			effectApply(effect,entity,null,self);
			animHoming(self,entity,StickerList.glowGold.img,45,6,0.5,5);
		}
		let f = new Finder(entity.inventory).filter( item => item.rechargeTime && item.rechargeLeft > 0 );
		if( f.count ) {
			let item = pick(f.all);
			item.rechargeLeft = 0;
			tell( mSubject|mPossessive|mCares,entity,' ',mObject,item,' suddenly recharges.' );
		}
	});
}

ItemTypeList.fontDeep.onTick = function(dt) {
	let nearby = new Finder(this.area.entityList,this).filter(e=>e.team==Team.GOOD).clearShot().nearMe(4);
	let self = this;
	nearby.process( entity => {
		let effect = new Effect(entity.area.depth,this.effectDrain,this,this.rechargeTime);
		effect.chargeless = true;
		effect.showOnset = false;
		effectApply(effect,entity,this,null);
	});
	if( this.isRecharged() ) {
		nearby.process( entity => {
			let effect = new Effect(entity.area.depth,this.effectPeriodic,this,this.rechargeTime);
			effect.icon = StickerList.glowRed.img;
			//this.command = Command.CAST;
			effectApply(effect,entity,this,null);
			animHoming(entity,self,effect.icon,45,6,0.5,5);
		});
		this.resetRecharge();
	}
}

StuffList.sunCrystal.onTick = function(dt) {
	if( this.owner.isMap ) {
		let tile = adhoc(this.map.tileTypeGet(this.x,this.y),this.map,this.x,this.y);
		effectApply(this.effect,tile,this.ownerOfRecord,this);
	}
}

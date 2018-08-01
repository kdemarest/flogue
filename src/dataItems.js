Module.add('dataItems',function(){

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
	eBurn: 			{ img: "ruby" }, 
	eFreeze: 		{ img: "brilliant_blue" }, 
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
const PotionEffects = Object.filter(EffectTypeList, (e,k)=>['eDarkVision','eCureDisease','eCurePoison','eOdorless','eStink','eBloodhound','eSeeInvisible','eXray','eFlight',
	'eHaste','eResistance','eInvisibility','eIgnore','eVulnerability','eSlow','eBlindness','eConfusion','eRage','eHealing','ePanic','eBravery',
	'eRegeneration','eBurn','ePoison','eFreeze','eAcid'].includes(k) );
const SpellEffects = Object.filter(EffectTypeList, (e,k)=>[
	'ePossess','eStun','eTeleport','eStartle','eHesitate','eBlindness','eLuminari','eXray','eEcholoc','eMentalFence',
	'eGreed','eSlow','eHealing','ePoison','eBurn','eFreeze','eShock','eSmite','eSmite3','eRot','eLeech','eRage','ePanic','eConfusion','eShove','eInvisibility'].includes(k) );
const RingEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eBloodhound','eOdorless','eRegeneration','eResistance','eGreed','eMobility','eSeeInvisible'].includes(k) );
const WeaponEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eStun','eStartle','ePoison','eBurn','eFreeze','eShock','eLeech','eBlindness','eSlow','ePanic','eConfusion','eShove','eSmite'].includes(k) );
//const AmmoEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eSmite','eSmite3','eSmite5','eSmite7','ePoison','eBurn','eFreeze','eBlindness','eSlow','eConfusion'].includes(k) );
const ShieldEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eStun','eShove','eAbsorb','eAbsorbRot','eResistance'].includes(k) );
const HelmEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eRegeneration', 'eResistance','eLuminari','eSeeInvisible','eDarkVision','eMentalFence','eBravery','eClearMind','eStalwart','eIronWill'].includes(k) );
const ArmorEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eRegeneration', 'eResistance'].includes(k) );
const CloakEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eInvisibility', 'eOdorless', 'eRechargeFast', 'eResistance'].includes(k) );
const BracersEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eBlock'].includes(k) );
const BootsEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eOdorless','eJump2','eJump3','eRegeneration', 'eIgnore', 'eFlight', 'eResistance'].includes(k) );

// Gaps in the bow effects are shock (reserved for darts), and stun/slow/shove (reserved for slings)
const BowEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eBurn','eFreeze','eAcid','ePoison','eSmite'].includes(k) );

// Slings are meant for short range non-stab damage and anything that feals "heavy" is their realm.
const SlingEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eStun','eSlow','eShove'].includes(k) );

// Darts have the general concept of being tipped with a solutions, so all the mental effects are on them.
const DartEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eShock','eAcid','eStun','eStartle','eHesitate','eBlindness','eSlow'].includes(k) );
const GemEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eMentalWall','eClearMind','eStalwart','eDarkVision','eSmite','ePossess','eRage','eLuminari','eGreed','eEcholoc','eSeeInvisible'].includes(k) );

const WeaponMaterialList = Fab.add( '', {
	"iron": 		{ level:  0 /* very important this be zero!*/, toMake: 'iron ingot', name: 'iron', matter: 'metal' },
	"silver": 		{ level:  5, toMake: 'silver ingot', name: 'silver', matter: 'metal' },
	"ice": 			{ level: 25, toMake: 'ice block', name: 'ice', matter: 'liquid' },
	"glass": 		{ level: 40, toMake: 'malachite', name: 'glass', matter: 'glass' },
	"lunarium": 	{ level: 55, toMake: 'lunarium ingot', name: 'lunarium', matter: 'metal' },
	"deepium": 		{ level: 70, toMake: 'deepium ingot', name: 'deepium', matter: 'metal' },
	"solarium": 	{ level: 85, toMake: 'solarium ingot', name: 'solarium', matter: 'metal' },
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
		noLevelVariance: true,
		attackVerb: 'shoot',
		bunchSize: 8,
		breakChance: 20,
		damageType: DamageType.STAB,
		xDamage: 0.4,	// Needs to be 0.4 or better so tht the different ammo types can be distinguished.
		isArrow: true,
		matter: 'wood',
		materials: ArrowMaterialList,
		namePattern: '{material} arrow${+plus}',
		quick: 0,
		slot: Slot.AMMO,
		img: 'UNUSED/spells/components/bolt.png',
		flyingImg: StickerList.arrowInFlight.img,
		flyingRot: true,
		flyingScale: 1.0,
		flyingSpeed: 15,
	},
	"rock": {
		level:  0,
		rarity: 1.0,
		bunchSize: 4,
		xDamage: 0.40,
		damageType: DamageType.BASH,
		matter: 'stone',
		isRock: true,
		isSlingable: true,
		quick: 2,
		namePattern: 'rock${+plus}',
		mayThrow: true,
		range: Rules.RANGED_WEAPON_DEFAULT_RANGE,
		effectChance: 0.000001,
		img: 'item/weapon/ranged/rock2.png'
	},
	// Sling stones give better damage than irregularly shaped rocks
	"slingStone": {
		level:  10,
		rarity: 1.0,
		bunchSize: 6,
		xDamage: 0.60,
		matter: 'stone',
		damageType: DamageType.BASH,
		isSlingStone: true,
		isSlingable: true,
		quick: 2,
		namePattern: 'rock${+plus}',
		mayThrow: true,
		range: Rules.RANGED_WEAPON_DEFAULT_RANGE,
		effectChance: 0.000001,
		img: 'item/weapon/ranged/rock2.png'
	},
	// Darts are throw only. The unique thing about darts is that, when you hit somebody with one, it does very little
	// damage but the effect ALWAYS happens.
	"dart":     	{
		level:  0,
		rarity: 0.5,
		xDamage: 0.30,
		damageType: DamageType.STAB,
		matter: 'metal',
		quick: 2,
		namePattern: 'dart${+plus}{?effect}',
		chanceOfEffect: 100,	// Here is the key element of darts,
		slot: false,
		effectChance: 0.80,
		effects: DartEffects,
		mayThrow: true,
		range: 10,
		attackVerb: 'stick', 
		img: 'effect/dart2.png',
		flyingImg: StickerList.dartInFlight.img,
		flyingRot: true,
		flyingScale: 1.0,
		flyingSpeed: 15,
	},
});

const WeaponList = Fab.add( '', {
	// Bows damage combines bow+ammo, and when their effect does damage they take on more of that than weapons.
	// Arrows are considered slow, so a stealth bow that does less damage is needed for nimble or lithe opponents.
	// Since their primary damage is stab anything that wants some ranged protection can resist or immune to stab and do pretty well.
	// Their natural ranged advantage is tempered by lower damage: 50% bow and 30% arrow.
	"bow": {
		level:  0,
		rarity: 1.0,
		xDamage: 0.5,
		xPrice: 1.4,
		matter: 'wood',
		quick: 0,
		effectChance: 0.80,
		materials: BowMaterialList,
		effects: BowEffects,
		damageType: DamageType.STAB,
		mayShoot: true,
		isBow: true,
		range: Rules.RANGED_WEAPON_DEFAULT_RANGE,
		ammoType: 'isArrow',
		ammoSpec: 'ammo.arrow',
		ammoDamage: 'combine',
		ammoEffect: 'addMine',
		ammoQuick:  'mine',
		attackVerb: 'shoot',
		img: 'item/weapon/ranged/bow1.png'
	},
	// Although the Stealth Bow does much less damage it is Quick, so it is useful against nimble creatures.
	// It still has the limitation of doing stabbing-only damage.
	"stealthBow": {		// Less damage but it can hit nimble creatures.
		level:  0,
		rarity: 0.5,
		xDamage: 0.3,
		xPrice: 3.0,
		matter: 'wood',
		quick: 2,		// Here is what the stealth bow is all about.
		effectChance: 0.80,
		materials: BowMaterialList,
		effects: BowEffects,
		damageType: DamageType.STAB,
		mayShoot: true,
		isBow: true,
		range: Rules.RANGED_WEAPON_DEFAULT_RANGE-1,		// slightly less range.
		ammoType: 'isArrow',
		ammoSpec: 'ammo.arrow',
		ammoDamage: 'combine',
		ammoEffect: 'addMine',
		ammoQuick:  'mine',
		attackVerb: 'shoot',
		img: 'item/weapon/ranged/stealthBow48.png'
	},
	// Although slings are only useful at short ranges, they can do bash damage (unlike bows).
	// With sling stone ammo they can do full damage, at range, although they are limited in their effects to bashing-like effects.
	"sling": {
		level:  0,
		rarity: 1.0,
		xDamage: 0.4,
		xPrice: 1.4,
		matter: 'leather',
		quick: 0,
		effectChance: 0.80,
		effects: SlingEffects,
		chanceOfEffect: 20,
		damageType: DamageType.BASH,
		mayShoot: true,
		isSling: true,
		range: 4,
		ammoType: 'isSlingable',
		ammoSpec: 'ammo.slingStone',
		ammoDamage: 'combine',
		ammoEffect: 'addMine',
		ammoQuick:  'mine',
		attackVerb: 'sling',
		img: 'item/weapon/ranged/bow1.png'
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

	"solarBlade": {
		level: 0,
		rarity: 0,
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
		materials: { solarium: WeaponMaterialList.solarium },
		effects: { eInert: EffectTypeList.eInert},
		img: 'item/weapon/solariumBlade.png'
	},
	"hands": {
		level: 0,
		rarity: 0,
		xDamage: 0.5,
		damageType: DamageType.BASH,
		noDrop: true,
		quick: 2,
		materials: { flesh: {} },
		effects: { eInert: EffectTypeList.eInert},
		matter: 'flesh',
		namePattern: 'hands{?effect}',
		slot: false,
		isHands: true
	},
	"claws": {
		level: 0,
		rarity: 0,
		xDamage: 0.8,
		damageType: DamageType.CLAW,
		noDrop: true,
		quick: 2,
		materials: { flesh: {} },
		effects: { eInert: EffectTypeList.eInert},
		matter: 'flesh',
		namePattern: 'claws{?effect}',
		isClaws: true
	},
	"bite": {
		level: 0,
		rarity: 0,
		xDamage: 0.8,
		damageType: DamageType.BITE,
		noDrop: true,
		quick: 2,
		materials: { flesh: {} },
		effects: { eInert: EffectTypeList.eInert},
		matter: 'flesh',
		namePattern: 'bite{?effect}',
		isBite: true
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
		matter: 'wood',
		damageType: DamageType.BASH,
		quick: 1,
		isClub: true,
		attackVerb: 'smash',
		img: 'item/weapon/club.png'
	},
	"sword": {
		level: 1,
		rarity: 1.0,
		xDamage: 1.00,
		damageType: DamageType.CUT,
		quick: 2,
		isSword: 1,
		img: 'item/weapon/long_sword1.png'
	},
	"greatsword": {
		level: 5,
		rarity: 0.3,
		xDamage: 1.10,
		damageType: DamageType.CUT,
		isSword: 1,
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
		xDamage: 1.15,
		damageType: DamageType.BASH,
		quick: 0,
		img: 'item/weapon/hammer2.png'
	},
	"axe": {
		level: 2,
		rarity: 0.6,
		xDamage: 1.00,
		damageType: DamageType.CHOP,
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
		matter: 'wood',
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
		matter: 'wood',
		damageType: DamageType.STAB,
		quick: 0,
		reach: 2,
		img: 'item/weapon/bardiche1.png'
	},
	"pitchfork": {
		level: 20,
		rarity: 0.5,
		xDamage: 1.20,
		matter: 'wood',
		damageType: DamageType.STAB,
		quick: 0,
		reach: 2,
		mayThrow: true,
		range: 4,
		img: 'item/weapon/trident1.png'
	},});

let BlockType = {
	PHYSICAL: 	'physical',
	REACH: 		'reach',
	THROWN: 	'thrown',
	SHOT: 		'shot',
	ELEMENTAL: 	'elemental',
	DIVINE: 	'divine',
	NOBLOCK: 	'noblock'
};

// Shield blocking in the xBlock plus 20%*level/MAX_DEPTH
const ShieldList = Fab.add( '', {
	"buckler":     	{ level:  0, rarity: 1.0, xArmor: 0.70, xBlock: 0.20, img: 'item/shield/shieldBuckler.png' },
	"targe":     	{ level:  5, rarity: 1.0, xArmor: 0.80, xBlock: 0.25, block: 'thrown', img: 'item/shield/shieldTarge.png' },
	"heater":     	{ level: 10, rarity: 0.8, xArmor: 0.90, xBlock: 0.30, block: 'thrown,shot', img: 'item/shield/shieldHeater.png' },
	"kite":     	{ level: 20, rarity: 0.6, xArmor: 1.00, xBlock: 0.35, block: 'thrown,shot', img: 'item/shield/shieldKite.png' },
	"pavise":     	{ level: 40, rarity: 0.1, xArmor: 1.20, xBlock: 0.40, block: 'thrown,shot', img: 'item/shield/shieldPavise.png' },
});

const ShieldMaterials = Fab.add( '', {
	"woodSM": 	{ level:  0, block: '', name: "wood", matter: 'wood' },
	"silverSM":	{ level:  5, block: 'divine', name: "silver", matter: 'metal' },
	"iron": 	{ level: 10, block: 'reach', name: 'iron', matter: 'metal' },
	"beryl": 	{ level: 15, block: 'elemental', name: 'beryl', matter: 'glass' },
	"pearl": 	{ level: 20, block: 'elemental,reach', name: 'pearl', matter: 'glass' },
	"opal": 	{ level: 30, block: 'elemental,divine', name: 'opal', matter: 'glass' },
	"solarium2": { level: 40, block: 'elemental,reach,divine', name: 'solarium', matter: 'metal' },
});

const ArmorList = Fab.add( '', {
	"fur": 			{ level:  0, rarity: 1.0, xArmor: 0.50, matter: 'leather', ingredientId: 'leather', img: 'item/armour/animal_skin1.png' },
	"hide": 		{ level:  1, rarity: 1.0, xArmor: 0.80, matter: 'leather', ingredientId: 'leather', img: 'item/armour/animal_skin2.png' },
	"leather": 		{ level:  2, rarity: 1.0, xArmor: 0.85, matter: 'leather', ingredientId: 'leather', img: 'item/armour/leather_armour1.png' },
	"studded": 		{ level:  3, rarity: 1.0, xArmor: 0.90, matter: 'leather', ingredientId: 'iron ingot', img: 'item/armour/banded_mail2.png' },
	"scale": 		{ level:  4, rarity: 1.0, xArmor: 0.95, ingredientId: 'iron ingot', img: 'item/armour/scale_mail1.png' },
	"chain": 		{ level: 10, rarity: 1.0, xArmor: 1.00, ingredientId: 'iron ingot', img: 'item/armour/chain_mail1.png' },
	"steelPlate": 	{ level: 15, rarity: 1.0, xArmor: 1.00, ingredientId: 'iron ingot', img: 'item/armour/plate_mail1.png' },
	"trollHideArmor": { level: 20, rarity: 1.0, xArmor: 1.00, ingredientId: 'troll hide', img: 'item/armour/troll_leather_armour.png' },
	"elven": 		{ level: 30, rarity: 1.0, xArmor: 1.00, ingredientId: 'chitin', img: 'item/armour/chain_mail2.png' },
	"chitin": 		{ level: 35, rarity: 1.0, xArmor: 1.00, matter: 'chitin', ingredientId: 'chitin', img: 'item/armour/elven_leather_armor.png' },
	"dwarven": 		{ level: 45, rarity: 1.0, xArmor: 1.00, ingredientId: 'chitin', img: 'item/armour/dwarven_ringmail.png' },
	"ice": 			{ level: 50, rarity: 1.0, xArmor: 1.00, matter: 'liquid', ingredientId: 'ice block', img: 'item/armour/elven_ringmail.png' },
	"glass": 		{ level: 55, rarity: 1.0, xArmor: 1.00, matter: 'glass', ingredientId: 'malachite', img: 'item/armour/crystal_plate_mail.png' },
	"demon": 		{ level: 65, rarity: 1.0, xArmor: 1.00, ingredientId: 'malachite', img: 'item/armour/orcish_platemail.png' },
	"lunar": 		{ level: 50, rarity: 1.0, xArmor: 1.00, ingredientId: 'lunarium ingot', img: 'item/armour/blue_dragon_scale_mail.png' },
	"deep": 		{ level: 80, rarity: 1.0, xArmor: 1.00, ingredientId: 'deepium ingot', img: 'item/armour/gold_dragon_armour.png' },
	"solar": 		{ level: 85, rarity: 1.0, xArmor: 1.00, ingredientId: 'solarium ingot', img: 'item/armour/crystal_plate_mail.png' },
});

const CloakList = Fab.add( '', {
	"corduroyCloak": 	{ level:  0, rarity: 1.0, xArmor: 0.01, img: 'item/armour/cloak3.png' },
	"canvasCloak": 		{ level: 10, rarity: 1.0, xArmor: 0.01, img: 'item/armour/cloak3.png' },
	"linenCloak": 		{ level: 20, rarity: 1.0, xArmor: 0.01, img: 'item/armour/cloak3.png' },
	"silkCloak": 		{ level: 30, rarity: 1.0, xArmor: 0.01, img: 'item/armour/cloak3.png' },
	"elvishCloak": 		{ level: 40, rarity: 1.0, xArmor: 0.01, img: 'item/armour/cloak3.png' },
	"dwarvishCloak":	{ level: 50, rarity: 1.0, xArmor: 0.01, img: 'item/armour/cloak3.png' },
	"demonCloak": 		{ level: 60, rarity: 1.0, xArmor: 0.01, img: 'item/armour/cloak3.png' },
	"lunarCloak": 		{ level: 70, rarity: 1.0, xArmor: 0.01, img: 'item/armour/cloak3.png' },
});


const HelmList = Fab.add( '', {
	"fur": 			{ level:  0, rarity: 1.0, xArmor: 0.50, matter: 'leather' },
	"hide": 		{ level:  1, rarity: 1.0, xArmor: 0.80, matter: 'leather' },
	"leather": 		{ level:  2, rarity: 1.0, xArmor: 0.85, matter: 'leather' },
	"studded": 		{ level:  3, rarity: 1.0, xArmor: 0.90, matter: 'leather' },
	"scale": 		{ level:  4, rarity: 1.0, xArmor: 0.95 },
	"chain": 		{ level: 10, rarity: 1.0, xArmor: 1.00, matter: 'chitin' },
	"steelPlate": 	{ level: 15, rarity: 1.0, xArmor: 1.00 },
	"trollHideArmor": 	{ level: 20, rarity: 1.0, xArmor: 1.00 },
	"chitin": 		{ level: 25, rarity: 1.0, xArmor: 1.00 },
	"elven": 		{ level: 30, rarity: 1.0, xArmor: 1.00 },
	"dwarven": 		{ level: 35, rarity: 1.0, xArmor: 1.00 },
	"ice": 			{ level: 40, rarity: 1.0, xArmor: 1.00, matter: 'liquid' },
	"glass": 		{ level: 45, rarity: 1.0, xArmor: 1.00, matter: 'glass' },
	"demon": 		{ level: 50, rarity: 1.0, xArmor: 1.00 },
	"lunar": 		{ level: 55, rarity: 1.0, xArmor: 1.00 },
	"solar": 		{ level: 60, rarity: 1.0, xArmor: 1.00 },
	"deep": 		{ level: 65, rarity: 1.0, xArmor: 1.00 },
});

const BracerList = Fab.add( '', {
	"fur": 			{ level:  0, rarity: 1.0, xArmor: 0.50, matter: 'leather' },
	"hide": 		{ level:  1, rarity: 1.0, xArmor: 0.80, matter: 'leather' },
	"leather": 		{ level:  2, rarity: 1.0, xArmor: 0.85, matter: 'leather' },
	"studded": 		{ level:  3, rarity: 1.0, xArmor: 0.90, matter: 'leather' },
	"scale": 		{ level:  4, rarity: 1.0, xArmor: 0.95 },
	"chain": 		{ level: 10, rarity: 1.0, xArmor: 1.00 },
	"steelPlate": 	{ level: 15, rarity: 1.0, xArmor: 1.00 },
	"trollHideArmor": 	{ level: 20, rarity: 1.0, xArmor: 1.00 },
	"chitin": 		{ level: 25, rarity: 1.0, xArmor: 1.00, matter: 'chitin' },
	"elven": 		{ level: 30, rarity: 1.0, xArmor: 1.00 },
	"dwarven": 		{ level: 35, rarity: 1.0, xArmor: 1.00 },
	"ice": 			{ level: 40, rarity: 1.0, xArmor: 1.00, matter: 'liquid' },
	"glass": 		{ level: 45, rarity: 1.0, xArmor: 1.00, matter: 'glass' },
	"demon": 		{ level: 50, rarity: 1.0, xArmor: 1.00 },
	"lunar": 		{ level: 55, rarity: 1.0, xArmor: 1.00 },
	"solar": 		{ level: 60, rarity: 1.0, xArmor: 1.00 },
	"deep": 		{ level: 65, rarity: 1.0, xArmor: 1.00 },
});

const BootList = Fab.add( '', {
	"fur": 			{ level:  0, rarity: 1.0, xArmor: 0.50 },
	"hide": 		{ level:  1, rarity: 1.0, xArmor: 0.80 },
	"leather": 		{ level:  2, rarity: 1.0, xArmor: 0.85 },
	"studded": 		{ level:  3, rarity: 1.0, xArmor: 0.90 },
	"scale": 		{ level:  4, rarity: 1.0, xArmor: 0.95, matter: 'metal' },
	"chain": 		{ level: 10, rarity: 1.0, xArmor: 1.00, matter: 'metal' },
	"steelPlate": 	{ level: 15, rarity: 1.0, xArmor: 1.00, matter: 'metal' },
	"trollHideArmor": 	{ level: 20, rarity: 1.0, xArmor: 1.00 },
	"chitin": 		{ level: 25, rarity: 1.0, xArmor: 1.00, matter: 'chitin' },
	"elven": 		{ level: 30, rarity: 1.0, xArmor: 1.00, matter: 'metal' },
	"dwarven": 		{ level: 35, rarity: 1.0, xArmor: 1.00, matter: 'metal' },
	"ice": 			{ level: 40, rarity: 1.0, xArmor: 1.00, matter: 'liquid' },
	"glass": 		{ level: 45, rarity: 1.0, xArmor: 1.00, matter: 'glass' },
	"demon": 		{ level: 50, rarity: 1.0, xArmor: 1.00, matter: 'metal' },
	"lunar": 		{ level: 55, rarity: 1.0, xArmor: 1.00, matter: 'metal' },
	"solar": 		{ level: 60, rarity: 1.0, xArmor: 1.00, matter: 'metal' },
	"deep": 		{ level: 65, rarity: 1.0, xArmor: 1.00, matter: 'metal' },
});

const GloveList = Fab.add( '', {
	"furGloves": 		{ level:  0, rarity: 1.0 },
	"leatherGloves": 	{ level:  1, rarity: 1.0 },
	"assassinGloves": 	{ level:  0, rarity: 0.3, effect: EffectTypeList.eAssassin },
	"studdedGloves": 	{ level:  9, rarity: 1.0 },
	"trollHideGloves": 	{ level: 14, rarity: 1.0, name: 'troll hide gloves',
							effect: { op: 'add', stat: 'immune', value: 'frogSpine' } },
	"scale": 			{ level: 24, rarity: 1.0, matter: 'metal' },
	"chain": 			{ level: 34, rarity: 1.0, matter: 'metal' }
});



const OreVeinList = Fab.add( '', {
	"oreVeinCoal": 		{ level:  0, rarity:  1.0, name: "coal vein", mineId: 'coal', img: 'ore/oreLumpBlack.png' },
	"oreVeinTin": 		{ level:  5, rarity:  1.0, name: "tin ore vein", mineId: 'oreTin', img: 'ore/oreMetalWhite.png' },
	"oreVeinIron": 		{ level: 10, rarity:  0.8, name: "iron ore vein", mineId: 'oreIron', img: 'ore/oreMetalBlack.png' },
	"oreVeinCopper": 	{ level: 25, rarity:  0.6, name: "copper ore vein", mineId: 'oreCopper', img: 'ore/oreMetalOrange.png' },
	"oreVeinSilver": 	{ level: 30, rarity:  0.5, name: "silver ore vein", mineId: 'oreSilver', img: 'ore/oreMetalWhite.png' },
	"oreVeinGold": 		{ level: 45, rarity:  0.3, name: "gold ore vein", mineId: 'oreGold', img: 'ore/oreMetalYellow.png' },
	"oreVeinPlatinum": 	{ level: 55, rarity:  0.3, name: "platinum ore vein", mineId: 'orePlatinum', img: 'ore/oreMetalBlue.png' },
	"oreVeinLunarium": 	{ level: 75, rarity:  0.2, name: "lunarium ore vein", mineId: 'oreLunarium', img: 'ore/oreGemCyan.png' },
	"oreVeinSolarium": 	{ level: 60, rarity:  0.2, name: "solarium ore vein", mineId: 'oreSolarium', img: 'ore/oreGemYellow.png' },
	"oreVeinDeepium": 	{ level: 85, rarity:  0.1, name: "deepium ore vein", mineId: "oreDeepium", img: 'ore/oreGemBlack.png' },
	"oreVeinGarnet": 	{ level: 20, rarity:  0.3, name: "garnet ore vein", mineId: "gem.garnet", img: 'ore/oreGemPurple.png', isGemOre: true },
	"oreVeinOpal": 		{ level: 35, rarity:  0.3, name: "opal ore vein", mineId: "gem.opal", img: 'ore/oreGemWhite.png', isGemOre: true },
	"oreVeinRuby": 		{ level: 40, rarity:  0.2, name: "ruby ore vein", mineId: "gem.ruby", img: 'ore/oreGemRed.png', isGemOre: true },
	"oreVeinEmerald": 	{ level: 50, rarity:  0.2, name: "emerald ore vein", mineId: "gem.emerald", img: 'ore/oreGemGreen.png', isGemOre: true },
	"oreVeinSapphire": 	{ level: 65, rarity:  0.2, name: "sapphire ore vein", mineId: "gem.sapphire", img: 'ore/oreGemBlue.png', isGemOre: true },
	"oreVeinDiamond": 	{ level: 80, rarity:  0.1, name: "diamond ore vein", mineId: "gem.diamond", img: 'ore/oreGemWhite.png', isGemOre: true },
	// must be last!
	"oreNone": 			{ level:  0, rarity: 0.001, isNone: true, name: "ore vein", img: 'ore/oreVein.png' },
});


const OreList = Fab.add( '', {
	"coal": 		{ level:  0, rarity: 1.0, name: "coal", img: 'ore/oreLumpBlack.png', scale: 0.5, isFuel: true },
	"oreTin": 		{ level:  2, rarity: 1.0, name: "tin ore", refinesTo: "ingotTin", img: 'ore/oreMetalWhite.png', scale: 0.5 },
	"oreIron": 		{ level:  5, rarity: 0.8, name: "iron ore", refinesTo: "ingotIron", img: 'ore/oreMetalBlack.png', scale: 0.5 },
	"oreCopper": 	{ level: 10, rarity: 0.6, name: "copper ore", refinesTo: "ingotCopper", img: 'ore/oreMetalOrange.png', scale: 0.5 },
	"oreSilver": 	{ level: 15, rarity: 0.5, name: "silver ore", refinesTo: "ingotSilver", img: 'ore/oreMetalWhite.png', scale: 0.5 },
	"oreGold": 		{ level: 20, rarity: 0.3, name: "gold ore", refinesTo: "ingotGold", img: 'ore/oreMetalYellow.png', scale: 0.5 },
	"orePlatinum": { level: 25, rarity: 0.3, name: "malachite ore", refinesTo: "ingotMalachite", img: 'ore/oreMetalBlue.png', scale: 0.5 },
	"oreLunarium": 	{ level: 30, rarity: 0.2, name: "lunarium ore", refinesTo: "ingotLunarium", img: 'ore/oreGemCyan.png', scale: 0.5 },
	"oreSolarium": 	{ level: 35, rarity: 0.1, name: "solarium ore", refinesTo: "ingotSolarium", img: 'ore/oreGemYellow.png', scale: 0.5 },
	"oreDeepium": 	{ level: 40, rarity: 0.1, name: "deepium ore", refinesTo: "ingotDeepium", img: 'ore/oreGemBlack.png', scale: 0.5 },
});

const GemQualityList = Fab.add( '', {
	"flawed": 		{ level:  0, rarity: 1.0, xPrice: 0.5 },
	"average": 		{ level:  5, rarity: 0.8, xPrice: 1.0 },
	"large": 		{ level: 10, rarity: 0.6, xPrice: 1.2 },
	"flawless": 	{ level: 15, rarity: 0.4, xPrice: 1.5 },
	"sublime": 		{ level: 20, rarity: 0.2, xPrice: 2.0 }
});

const GemList = Fab.add( '', {
	"garnet": 		{ level:  0, rarity:  0.3, img: "gems/Gem Type1 Red.png" },
	"opal": 		{ level:  3, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"turquoise": 	{ level:  6, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"amethyst": 	{ level:  9, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"pearl": 		{ level: 12, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"amber": 		{ level: 15, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"jade": 		{ level: 18, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"lapisLazuli":  { level: 21, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"topaz": 		{ level: 24, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"moonstone": 	{ level: 27, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"agate": 		{ level: 30, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"tourmaline": 	{ level: 33, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"peridot": 		{ level: 36, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"malachite": 	{ level: 39, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"citrine": 		{ level: 42, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"jasper": 		{ level: 45, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"carnelian": 	{ level: 48, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"chalcedony": 	{ level: 51, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"beryl": 		{ level: 54, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"spinel": 		{ level: 57, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"ruby": 		{ level: 60, rarity:  0.2, img: "gems/Gem Type2 Red.png" },
	"emerald": 		{ level: 65, rarity:  0.2, img: "gems/Gem Type2 Green.png" },
	"sapphire": 	{ level: 70, rarity:  0.2, img: "gems/Gem Type2 Blue.png" },
	"diamond": 		{ level: 75, rarity:  0.1, img: "gems/Gem Type3 Black.png" },
});

const StuffList = Fab.add( '', {
	"lantern": 			{ rarity: 0.2, matter: 'metal', xPrice: 10, slot: Slot.HIP, light: 10, triggerOnUse: true, autoEquip: true, effect: { op: 'set', stat: 'light', value: 10, name: 'light', icon: EffectTypeList.eLuminari.icon }, useVerb: 'clip on', img: "item/misc/misc_lamp.png" },
	"oilLamp": 			{ rarity: 0.4, matter: 'metal', xPrice: 10, slot: Slot.HIP, light:  8, triggerOnUse: true, autoEquip: true, effect: { op: 'set', stat: 'light', value:  8, name: 'light', icon: EffectTypeList.eLuminari.icon }, useVerb: 'clip on', img: "item/misc/misc_lamp.png" },
	"candleLamp": 		{ rarity: 0.6, matter: 'wax', xPrice: 10, slot: Slot.HIP, light:  4, triggerOnUse: true, autoEquip: true, effect: { op: 'set', stat: 'light', value:  4, name: 'light', icon: EffectTypeList.eLuminari.icon }, useVerb: 'clip on', img: "item/misc/misc_lamp.png" },
	"voidCandle": 		{ rarity: 0.2, matter: 'wax', xPrice: 10, slot: Slot.HIP, triggerOnUse: true, effect: { op: 'set', stat: 'dark', value: 4, name: 'shroud', icon: EffectTypeList.eDarkness.icon }, useVerb: 'clip on', img: "item/stuff/darkLantern.png" },
	"voidLamp": 		{ rarity: 0.1, matter: 'metal', xPrice: 10, slot: Slot.HIP, triggerOnUse: true, effect: { op: 'set', stat: 'dark', value: 6, name: 'shroud', icon: EffectTypeList.eDarkness.icon }, useVerb: 'clip on', img: "item/stuff/darkLantern.png" },
	"lumpOfMeat": 		{ rarity: 1.0, matter: 'flesh', mayThrow: true, mayTargetPosition: true, isEdible: true, img: "item/food/chunk.png" },
	"trollHide": 		{ rarity: 0.5, matter: 'leather', img: "item/armour/troll_hide.png" },
	"bone": 			{ rarity: 1.0, matter: 'bone', mayThrow: true, mayTargetPosition: true, isEdible: true, isBone: true, img: "item/food/bone.png" },
	"antGrubMush": 		{ rarity: 0.8, matter: 'liquid', isAntFood: true, mayThrow: true, mayTargetPosition: true, isEdible: true, img: "item/food/sultana.png" },
	"viperVenom": 		{ rarity: 0.6, matter: 'liquid', img: "UNUSED/other/acid_venom.png" },
	"dogCollar": 		{ rarity: 1.0, matter: 'leather', isJewelry: true, img: 'item/misc/collar.png' },
	"skull": 			{ rarity: 1.0, matter: 'bone', mayThrow: true, mayTargetPosition: true, isEdible: true, isBone: true, img: 'item/stuff/skull.png' },
	"mushroomBread": 	{ rarity: 1.0, matter: 'plant', mayThrow: true, mayTargetPosition: true, isEdible: true, img: 'item/food/bread_ration.png'},
	"demonScale": 		{ rarity: 0.2, matter: 'flesh', img: 'item/misc/demonEye.png' },
	"demonEye": 		{ rarity: 0.2, matter: 'flesh', mayThrow: true, mayTargetPosition: true, isEdible: true, isGem: true, img: 'item/misc/demonEye.png' },
	"ghoulFlesh": 		{ rarity: 0.4, matter: 'flesh', mayThrow: true, mayTargetPosition: true, isEdible: true, img: 'item/food/chunk_rotten.png' },
	"pinchOfEarth": 	{ rarity: 1.0, matter: 'stone', img: 'item/weapon/ranged/rock.png' },
	"impBrain": 		{ rarity: 0.4, matter: 'flesh', mayThrow: true, mayTargetPosition: true, isEdible: true },
	"ogreDrool": 		{ rarity: 1.0, matter: 'liquid', mayThrow: true, mayTargetPosition: true, isEdible: true, img: 'item/misc/ogreDrool.png' },
	"centurionFigurine":{ level: 44, rarity: 0.1, matter: 'stone', mayThrow: true, mayTargetPosition: true, rechargeTime: 10*50, img: 'item/stuff/solarCenturionFigurine.png',
						effect: { op: 'summon', value: 'solarCenturion', isServant: true, xDuration: 5.0, doesTiles: true, name: false }
						},
	"bearFigurine": 	{ level: 9, rarity: 1.0, matter: 'stone', mayThrow: true, mayTargetPosition: true, rechargeTime: 10*50, img: 'item/stuff/figurine.png',
						effect: { op: 'summon', value: 'bear', isServant: true, xDuration: 5.0, doesTiles: true, name: false }
						},
	"dogFigurine": 		{ level: 0, rarity: 1.0, matter: 'stone', mayThrow: true, mayTargetPosition: true, rechargeTime: 10*50, img: 'item/stuff/figurine.png',
						effect: { op: 'summon', value: 'dog', isServant: true, xDuration: 5.0, doesTiles: true, name: false }
						},
	"viperFigurine": 	{ level: 24, rarity: 1.0, matter: 'stone', mayThrow: true, mayTargetPosition: true, rechargeTime: 10*50, img: 'item/stuff/figurine.png',
						effect: { op: 'summon', value: 'viper', isServant: true, xDuration: 5.0, doesTiles: true, name: false }
						},
	"scarabCarapace": 	{ rarity: 1.0, matter: 'chitin', },
	"darkEssence": 		{ rarity: 0.1, matter: 'special', },
	"facetedEye": 		{ rarity: 0.4, matter: 'flesh', mayThrow: true, mayTargetPosition: true, isEdible: true, isJewelry: true },
	"sunCrystal":   	{ rarity: 0.6, matter: 'special', mayThrow: true, range: 7, light: 12, glow: 1, attackVerb: 'throw', img: "item/stuff/sunCrystal.png", mayTargetPosition: true,
							effect: {
								name: 'radiance',
								op: 'damage',
								xDamage: 1.0,
								effectShape: EffectShape.BLAST5,
								effectFilter: eff=>eff.target.team==Team.EVIL,
								damageType: DamageType.SMITE,
								icon: 'gui/icons/eSmite.png',
								iconOver: 'effect/lightRayCircle.png',
								iconOverScale: 5.0,
							}
						},
	"trollBlood": 		{ rarity: 0.6, matter: 'liquid' },
	"spinneret": 		{ rarity: 0.4, matter: 'flesh', },
	"chitin": 			{ rarity: 1.0, matter: 'chitin', },
	"poisonGland": 		{ rarity: 0.4, matter: 'flesh', },
	"snailTrail": 		{ rarity: 0.0, matter: 'liquid', alpha: 0.3, isTreasure: false, img: 'item/stuff/snailSlime.png', isSnailSlime: true, mayPickup: false, existenceTime: 10 },
	"snailSlime": 		{ rarity: 0.4, matter: 'liquid', alpha: 0.5, img: 'item/stuff/snailSlime.png', isSnailSlime: true, },
	"redOozeSlime": 	{ rarity: 0.2, matter: 'liquid', mayThrow: true, mayTargetPosition: true, isEdible: true, img: 'item/stuff/redSlime.png' },
	"poisonSlime": 		{ rarity: 0.2, matter: 'liquid', alpha: 0.5, scale: 0.25, mayThrow: true, mayTargetPosition: true, img: 'item/stuff/poisonSlime.png',
						damageType: DamageType.POISON },
	"acidTrail": 		{ rarity: 0.2, matter: 'liquid', alpha: 0.2, scale: 0.35, mayThrow: true, isAcidSlime: true, img: 'item/stuff/acidSlime.png',
						damageType: DamageType.CORRODE, mayPickup: false, existenceTime: 10 },
	"acidSlime": 		{ rarity: 0.2, matter: 'liquid', alpha: 0.5, scale: 0.25, mayThrow: true, mayTargetPosition: true, img: 'item/stuff/acidSlime.png',
						damageType: DamageType.CORRODE },
	"lunarEssence": 	{ rarity: 0.6, matter: 'special', },
	"batWing": 			{ rarity: 1.0, matter: 'flesh', },
	"frogSpine": 		{ rarity: 0.8, matter: 'flesh', },
	"wool": 			{ rarity: 1.0, matter: 'flesh', isFabricIngredient: true },
	"ingotIron": 		{ rarity: 1.0, matter: 'metal', name: 'iron ingot' },
	"ingotCopper": 		{ rarity: 0.9, matter: 'metal', name: 'copper ingot' },
	"ingotSilver": 		{ rarity: 0.8, matter: 'metal', name: 'silver ingot' },
	"ingotGold": 		{ rarity: 0.7, matter: 'metal', name: 'gold ingot' },
	"ingotTin": 		{ rarity: 1.0, matter: 'metal', name: 'tin ingot' },
	"ingotMalachite": 	{ rarity: 0.6, matter: 'metal', name: 'malachite ingot' },
	"ingotLunarium": 	{ rarity: 0.5, matter: 'metal', name: 'lunarium ingot' },
	"ingotSolarium": 	{ rarity: 0.4, matter: 'metal', name: 'solarium ingot' },
	"ingotDeepium": 	{ rarity: 0.3, matter: 'metal', name: 'deepium ingot' },

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
	"brass": 	{ level: 0, img: 'item/ring/brass.png' },
	"copper": 	{ level: 1, img: 'item/ring/bronze.png' },
	"silver": 	{ level: 3, img: 'item/ring/silver.png' },
	"gold": 	{ level: 7, img: 'item/ring/gold.png' }
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

const BrazierStates = {
	lit: {
		img: "decor/brazierLit.png",
		light: 6, glow: 1
	},
	unlit: {
		img: "decor/brazierUnlit.png",
		light: 0, glow: 0
	}
};

const CoffinStates = {
	open:   {
		img: 'item/decor/coffinOpen.png',
	},
	shut:   {
		img: 'item/decor/coffinShut.png',
	}
};

const NulImg = { img: '' };

// Item Events
// onPickup - fired just before an item is picked up. Return false to disallow the pickup.
// onTick - fires each time a full turn has passed, for every item, whether in the world or in an inventory. 

const ItemTypeList = {
	"random":	  { symbol: '*', isRandom: 1, mayPickup: false, neverPick: true, img: '' },
// GATEWAYS
	"stairsDown": { symbol: '>', name: "stairs down", 	isGate: 1, gateDir: 1, gateInverse: 'stairsUp', isStairsDown: true, mayPickup: false, useVerb: 'descend', img: "dc-dngn/gateways/stone_stairs_down.png" },
	"stairsUp":   { symbol: '<', name: "stairs up", 	isGate: 1, gateDir: -1, gateInverse: 'stairsDown', isStairsUp: true, mayPickup: false, useVerb: 'ascend', img: "dc-dngn/gateways/stone_stairs_up.png" },
	"gateway":    { symbol: 'O', name: "gateway", 		isGate: 1, gateDir: 0, gateInverse: 'gateway', mayPickup: false, useVerb: 'enter', img: "dc-dngn/gateways/dngn_enter_dis.png" },
	"portal":     { symbol: '0', name: "portal", 		isGate: 1, gateDir: 0, gateInverse: 'portal', mayPickup: false, useVerb: 'touch', img: "dc-dngn/gateways/dngn_portal.png" },
	"pitDrop": 	  { symbol: SYM, name: "pit drop", 		isGate: 1, gateDir: 1, gateInverse: false, mayPickup: false, useVerb: 'fall', img: "effect/pitDrop.png" },
// DOOR
	"door":       { symbol: '+', mayWalk: true,  mayFly: true, opacity: 0,
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
		mayPickup: false,
		rarity: 1,
		name: "broken column",
		isDecor: true,
		img: "dc-dngn/crumbled_column.png"
	},
	"columnStump": {
		symbol: SYM,
		mayWalk: false,
		mayFly: true,
		mayPickup: false,
		rarity: 1,
		name: "column stump",
		isDecor: true,
		img: "dc-dngn/granite_stump.png"
	},
	"brazier": {
		symbol: SYM,
		mayWalk: false,
		mayFly: true,
		mayPickup: false,
		opacity: 0,
		name: "brazier",
		isLightable: true,
		light: 6,
		glow: 1,
		state: 'lit',
		states: BrazierStates,
		imgChoices: BrazierStates,
		imgGet: (self,img) => img || self.imgChoices[self.state].img
	},
	"table": {
		symbol: SYM,
		mayWalk: false,
		mayFly: true,
		mayPickup: false,
		opacity: 0,
		name: "table",
		isDecor: true,
		isTable: true,
		zOrder: Tile.zOrder.TABLE,
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
		zOrder: Tile.zOrder.SIGN,
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
		matter: 'wood',
		mayPickup: false,
		isDecor: true,
		isContainer: true,
		isRemovable: true,
		state: 'shut',	// This is required to stop the user from "seeing inside" with mouse hover.
		inventoryLoot: '3x 20% any',
		hasInventory: true,
		scale: 0.40,
		img: 'decor/barrel.png'
	},
	"chest": {
		symbol: SYM,
		mayWalk: false,
		mayFly: true,
		opacity: 0,
		name: "chest",
		matter: 'wood',
		mayPickup: false,
		isDecor: true,
		isContainer: true,
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
	"coffin": {
		symbol: SYM,
		mayWalk: false,
		mayFly: true,
		mayPickup: false,
		opacity: 0,
		name: "coffin",
		matter: 'wood',
		isDecor: true,
		isContainer: true,
		state: 'shut',
		imgChoices: {
			shut: { img: 'decor/coffinShut.png' },
			open: { img: 'decor/coffinOpen.png' },
			empty: { img: 'decor/coffinEmpty.png' }
		},
		imgGet: (self,img) => img || self.imgChoices[self.state].img,
		inventoryLoot: '30% weapon, 30% armor, 30% coin, 5% helm, 5% bracers, 5% boots, 5% ring',
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
		isSolarAltar: true,
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
		matter: 'special',
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
		matter: 'special',
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
		symbol: 	'v',
		mayWalk: 	false,
		mayFly: 	false,
		mayPickup: 	false,
		rarity: 	1,
		opacity: 	1,
		isWall: 	true,
		noneChance: 0.90,
		imgGet: (self,img) => (img || self.variety.img || "oreVein"),
		matter: 	'stone',
		imgChoices: OreVeinList,
		varieties: 	OreVeinList,
		mineSwings: 14
	},
// FAKES and SKILLS
	"skill": 	{ symbol: SYM, isSkill: true, rarity: 0, img: 'gui/icons/skill.png', icon: "skill.png" },
	"fake":   	{ symbol: SYM, isFake: true, namePattern: "fake", rarity: 1, img: 'UNUSED/spells/components/skull.png', icon: "corpse.png" },
// CORPSE
	"corpse":   { symbol: SYM, namePattern: "remains of a {mannerOfDeath} {usedToBe}", rarity: 1,
				isCorpse: true,
				zOrder: Tile.zOrder.CORPSE,
				img: 'UNUSED/spells/components/skull.png', icon: "corpse.png" },
// KEYS
	"key": {
		symbol: 		'k',
		namePattern: 	'key to {keyId}',
		matter: 		'metal',
		keyId: 			'none',
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
		matter: 		'metal',
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
		matter: 		'glass',
		charges: 		1,
		xDamage: 		1.5,	// Single use, so more damage.
		light: 			3,
		glow: 			true,
		attackVerb: 	'splash',
		isPotion: 		true,
		range: 			Rules.rangePotion,
		effects: 		PotionEffects,
		effectWhen: 	{ isHarm: 'throw', DEFAULT: 'quaff'},
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
		matter: 		'paper',
		rechargeTime: 	Rules.SPELL_RECHARGE_TIME,
		effects: 		SpellEffects,
		effectWhen: 	'cast',
		mayCast: 		true,
		isSpell: 		true,
		range: 			Rules.rangeSpell,
		img: 			"item/scroll/scroll.png",
		icon: 			'spell.png'
	},
	"ore": 		{
		symbol: 		'o',
		isTreasure: 	1,
		namePattern: 	'{variety}',
		matter: 		'stone',
		varieties: 		OreList,
		isOre: 			true,
		imgGet: 		(self,img) => (img || self.variety.img || "ore"),
		imgChoices: 	OreList,
		icon: 			'ore.png'
	},
	"gem": 		{
		symbol: 		"g",
		isTreasure: 	1,
		namePattern: 	'{quality} {variety}${+plus}{?effect}',
		matter: 		'glass',
		qualities: 		GemQualityList,
		varieties: 		GemList,
		effects: 		GemEffects,
		effectWhen: 	{ isHarm: 'throw', DEFAULT: 'gaze' },
		isGem: 			true,
		mayThrow: 		1,
		mayGaze: 		1,
		range: 			Rules.RANGED_WEAPON_DEFAULT_RANGE,
		mayTargetPosition: 1,
		autoCommand: 	Command.USE,
		imgGet: 		(self,img) => (img || self.variety.img || "Gem Type2 Black"),
		imgChoices: 	GemList,
		scale: 			0.3,
		icon: 			'gem.png'
	},
	"weapon": 	{
		symbol: 'w',
		isTreasure: 1,
		namePattern: 	'{material} {variety}${+plus}{?effect}',
		matter: 		'metal',
		materials: 		WeaponMaterialList,
		varieties: 		WeaponList,
		effects: 		WeaponEffects,
		effectWhen: 	'attack',
		slot: 			Slot.WEAPON,
		isWeapon: 		true,
		useVerb: 		'wield',
		mayTargetPosition: true,
		img: 			"item/weapon/dagger.png",
		icon: 			'weapon.png'
	},
	"ammo": 	{
		symbol: 		'm',
		isTreasure: 	1,
		namePattern: 	'{material} {variety}${+plus}{?effect}',
		varieties: 		AmmoList,
		donBunches: 	true,
		isWeapon: 		true,
		isAmmo: 		true,
		slot: 			Slot.AMMO,
		useVerb: 		'ready',
		img: 			"item/weapon/dagger.png",
		icon: 			'ammo.png'
	},
	"shield": {
		symbol: 		'x',
		isTreasure: 	1,
		namePattern: 	"{material} {variety} shield${+plus}{?effect}",
		matter: 		'metal',
		block: 			'physical',
		varieties: 		ShieldList,
		materials: 		ShieldMaterials,
		effects: 		ShieldEffects,
		effectWhen: 	'use',
		slot: 			Slot.SHIELD,
		isShield: 		true,
		xArmor: 		0.50,
		useVerb: 		'hold',
		triggerOnUseIfHelp: true,
		effectDecorate: { duration: true },
		img: 			"item/armour/shields/shield3_round.png",
		icon: 			'shield.png'
	},
	"helm": {
		symbol: 		'h',
		isTreasure: 	1,
		namePattern: 	"{variety} helm${+plus}{?effect}",
		matter: 		'metal',
		varieties: 		HelmList,
		effects: 		HelmEffects,
		effectWhen: 	'use',
		slot: 			Slot.HEAD,
		isHelm: 		true,
		isArmor: 		true,
		xArmor: 		0.15,
		useVerb: 		'wear',
		triggerOnUseIfHelp: true,
		effectDecorate: { duration: true },
		img: 			"item/armour/headgear/helmet2_etched.png",
		icon: 			'helm.png'
	},
	"armor": {
		symbol: 		'a',
		isTreasure: 	1,
		namePattern: 	"{variety} armor${+plus}{?effect}",
		matter: 		'metal',
		varieties: 		ArmorList,
		effects: 		ArmorEffects,
		effectWhen: 	{ isHarm: 'backsies', DEFAULT: 'use' },
		slot: 			Slot.ARMOR,
		isArmor: 		true,
		xArmor: 0.60,
		useVerb: 		'wear',
		triggerOnUseIfHelp: true,
		effectDecorate: { duration: true },
		imgGet: 		(self, img) => (img || self.variety.img || "item/armour/chain_mail1.png"),
		imgChoices: 	ArmorList,
		icon: 			'armor.png'
	},
	"cloak": {
		symbol: 		'c',
		isTreasure: 	1,
		namePattern: 	"{variety}${+plus}{?effect}",
		matter: 		'cloth',
		varieties: 		CloakList,
		effects: 		CloakEffects,
		effectWhen: 	'use',
		slot: 			Slot.ARMOR,
		isArmor: 		true,
		isCloak: 		true,
		xArmor: 		0.01,
		useVerb: 		'wear',
		triggerOnUseIfHelp: true,
		effectDecorate: { duration: true },
		imgGet: 		(self,img) => (img || self.variety.img || "item/armour/chain_mail1.png"),
		imgChoices: 	CloakList,
		icon: 			'armor.png'
	},
	"bracers": {
		symbol: 		'b',
		isTreasure: 	1,
		namePattern: 	"{variety} bracers{+plus}{?effect}",
		matter: 		'metal',
		varieties: 		BracerList,
		effects: 		BracersEffects,
		effectWhen: 	'use',
		slot:			Slot.ARMS,
		isBracers: 		true,
		isArmor: 		true,
		xArmor: 0.15,
		useVerb: 		'wear',
		triggerOnUseIfHelp: true,
		effectDecorate: { duration: true },
		img: 			"UNUSED/armour/gauntlet1.png",
		icon: 			'bracers.png'
	},
	"gloves": {
		symbol: 		'l',
		isTreasure: 	1,
		namePattern: 	"{variety}$",
		matter: 		'leather',
		varieties: 		GloveList,
		effectWhen: 	'use',
		slot: 			Slot.HANDS,
		isGloves: 		true,
		useVerb: 		'wear',
		triggerOnUseIfHelp: true,
		effectDecorate: { duration: true },
		img: 			"UNUSED/armour/glove4.png",
		icon: 			'gloves.png'
	},
	"boots": {
		symbol: 		'z',
		isTreasure: 	1,
		namePattern: 	"{variety} boots{+plus}{?effect}",
		matter: 		'leather',
		varieties: 		BootList,
		slot: 			Slot.FEET,
		isBoots: 		true,
		isArmor: 		true,
		effects: 		BootsEffects,
		effectWhen: 	'use',
		xArmor: 0.10,
		useVerb: 		'wear',
		triggerOnUseIfHelp: true,
		effectDecorate: { duration: true },
		img: "item/armour/boots2_jackboots.png",
		icon: 'boots.png'
	},
	"ring": {
		symbol: 		'r',
		isTreasure: 	1,
		namePattern: 	"{material} {variety} ring${+plus}{?effect}",
		matter: 		'metal',
		materials: 		RingMaterialList,
		varieties: 		RingList,
		effects: 		RingEffects,
		effectWhen: 	'use',
		slot: 			Slot.FINGERS,
		isRing: 		true,
		isJewelry: 		true,
		useVerb: 		'wear',
		triggerOnUse: 	true,
		effectDecorate: { duration: true },
		imgGet: (self, img) => (img || self.material.img || 'gold'),
		imgChoices: 	RingMaterialList,
		icon: 			'ring.png'
	},
	// INGREDIENTS
	"stuff": {
		symbol: 		't',
		isTreasure: 	1,
		isStuff: 		1,
		namePattern: 	"{variety}${?effect}",
		varieties: 		StuffList,
		imgGet: (self, img) => (img || (self ? self.variety.img : '') || 'item/misc/misc_rune.png'),
		imgChoices: 	StuffList,
		icon: 			'stuff.png'
	},
};

(() => {
	// 		core: [ '@', 1, '3:10', 'good', 'cut', 'dc-mon/elf.png', 'he' ],
	for( let typeId in ItemTypeList ) {
		let itemType = ItemTypeList[typeId];
		if( !itemType.isTreasure ) continue;
		console.assert( !itemType.xPrice && !itemType.effectChance );
		console.assert( Rules.ItemBag[typeId] );
		ItemTypeList[typeId].xPrice 		= Rules.ItemBag[typeId].xPrice;
		ItemTypeList[typeId].effectChance	= Rules.ItemBag[typeId].cEff;
	}
})();


const ItemSortOrder = ['skill','weapon','ammo','helm','armor','cloak','bracers','gloves','boots','shield','ring','potion','gem','ore','spell','stuff','key'];
const ItemFilterOrder = ['','skill','weapon','armor','shield','potion','spell','ring','gem','ore','stuff'];
const ItemFilterGroup = {
	skill:  ['skill'],
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
		entity.map.tileSymbolSetFloor( self.x, self.y, entity.map.defaultFloorSymbol );
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
		let label = self.unhide;
		let hidList = [].concat( self.map.itemListHidden );
		hidList.forEach( item => {
			item.unhide();
			Anim.FloatUp( self.id, item, StickerList.ePoof.img );
		});
		delete self.unhide;
	}

	if( toucher.isChosenOne && ( !toucher.deathReturn || !self.isAtTarget(toucher.deathReturn) ) ) {
		tell(mSubject|mCares,toucher,' will return here upon death.');
		toucher.deathReturn = {
			x: 	self.x,
			y:  self.y,
			px: toucher.x,
			py: toucher.y,
			area: self.area,
			altarId: self.id,
			name: 'death return'
		};
		toucher.onDeath = entity => {
			if( entity.spriteList ) {
				entity.area.animationManager.remove( anim => anim.isPuppeteer && anim.spriteList[0] === entity.spriteList[0] );
			}
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
			effectApply(self.effect,toucher,null,self,'bump');
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

ItemTypeList.brazier.onBump = function(entity,self) {
	self.setState( self.state == 'lit' ? 'unlit' : 'lit' );
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
		imageDirty(self);
		tell(mSubject,entity,' ',mVerb,'open',' the ',mObject,self);
		Anim.FloatUp( entity.id, self, StickerList.open.img );
		return true;
	}
	if( self.state == 'locked' ) {
		let key = new Finder(entity.inventory).filter(item=>self.keyId && item.keyId==self.keyId).first;
		let hasKey = self.keyId===undefined || key;
		if( hasKey ) {
			self.setState('shut');
			imageDirty(self);
			tell(mSubject,entity,' ',mVerb,'unlock',' the ',mObject,self);
			Anim.FloatUp( entity.id, self, StickerList.unlock.img );
			if( key && key.name.indexOf('(used)') < 0 ) {
				key.name += ' (used)';
			}
			return true;
		}
		tell(mSubject,self,' requires a specific key to unlock.');
		Anim.FloatUp( entity.id, self, StickerList.locked.img );
		return false;
	}
	debugger;
}

ItemTypeList.door.isProblem = function(entity,self) {
	if( entity.isOoze || entity.isNonCorporeal || self.state == 'open' ) {
		return Problem.NONE;
	}
	if( !entity.mindset('open') ) {
		return Problem.DEATH;
	}
	if( self.keyId === false || self.keyId === undefined ) {
		return Problem.DOOR;
	}
	let key = entity.inventory.find( item => item.keyId === self.keyId );
	return key ? Problem.DOOR : Problem.DEATH;
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
			toucher.inventoryTake(self.inventory, self, false); //, item => {
			Anim.Fountain(toucher.id,self,20,1.0,4,StickerList.coinSingle.img);
		}
		self.state = self.inventory && self.inventory.length > 0 ? 'open' : 'empty';
	}
	spriteDeathCallback(self.spriteList);
}

ItemTypeList.coffin.onBump = ItemTypeList.chest.onBump;

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
	let nearby = new Finder(this.area.entityList,this).filter(e=>e.isMonsterType && e.team==Team.GOOD).shotClear().nearMe(3);
	let self = this;
	nearby.forEach( entity => {
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
				onEnd: () => {
					glowAnim.die()
				}
			});
			effectApply(effect,entity,null,self,'tick');
			Anim.Homing(self.id,self,entity,StickerList.glowGold.img,45,6,0.5,5);
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
	let nearby = new Finder(this.area.entityList,this).filter(e=>e.team==Team.GOOD).shotClear().nearMe(4);
	let self = this;
	nearby.forEach( entity => {
		let effect = new Effect(entity.area.depth,this.effectDrain,this,this.rechargeTime);
		effect.chargeless = true;
		effect.showOnset = false;
		effectApply(effect,entity,this,null,'tick');
	});
	if( this.isRecharged() ) {
		nearby.forEach( entity => {
			let effect = new Effect(entity.area.depth,this.effectPeriodic,this,this.rechargeTime);
			effect.icon = StickerList.glowRed.img;
			//this.command = Command.CAST;
			effectApply(effect,entity,this,null,'tick');
			Anim.Homing(this.id,entity,self,effect.icon,45,6,0.5,5);
		});
		this.resetRecharge();
	}
}

StuffList.sunCrystal.onTick = function(dt) {
	if( this.owner.isMap ) {
		let tile = adhoc(this.map.tileTypeGet(this.x,this.y),this.map,this.x,this.y);
		effectApply(this.effect,tile,this.ownerOfRecord,this,'tick');
	}
}

return {
	ItemTypeDefaults: ItemTypeDefaults,
	ItemTypeList: ItemTypeList,
	WeaponMaterialList: WeaponMaterialList,
	BowMaterialList: BowMaterialList,
	ItemSortOrder: ItemSortOrder,
	ItemFilterOrder: ItemFilterOrder,
	ItemFilterGroup: ItemFilterGroup,
	BlockType: BlockType,
}

});

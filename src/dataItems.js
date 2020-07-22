Module.add('dataItems',function(){


// To upscale images, a decent upscaler appears to be:
// http://waifu2x.udp.jp/

//Do a full scan through https://www.pngfind.com/freepng/axe/ to find
//plents of PNG-ified image of decor

// If something does not name a damage, then items of that matter suffer NO damage from that attack form.
// It is considered resistance if damage is <=0.5 below, and vulnerable if damage >= 2.0
// The base unit for these effects is typically flesh, which should suffer 1.0 for nearly everything.
const Matter = {
	ether: 		{ damage: { } },
	energy: 	{ damage: { } },
	metal: 		{ damage: { corrode: 1, bash: 0.5 } },
	stone: 		{ damage: { bash: 1 } },
	chitin: 	{ damage: { bash: 1 } },
	glass: 		{ damage: { bash: 2, corrode: 1 } },
	crystal: 	{ damage: { bash: 2 } },
	leather: 	{ damage: { cut: 1, claw: 1, chop: 1, corrode: 1, rot: 2 } },
	cloth: 		{ damage: { cut: 2, claw: 1, chop: 1, corrode: 1, rot: 2 } },
	wax: 		{ damage: { cut: 1, claw: 1, chop: 1, bash: 0.5, burn: 2, corrode: 1 } },
	wood: 		{ damage: { bite: 0.5, bash: 0.5, chop: 2, rot: 1 } },
	liquid: 	{ damage: { burn: 0.5, freeze: 1, shock: 0.5, corrode: 0.5 } },
	paper: 		{ damage: { cut: 1, bite: 1, chop: 1, burn: 1, water: 1, corrode: 1 } },
	ivory: 		{ damage: { bash: 1, chop: 1, smite: 1 } },
	bone: 		{ damage: { bash: 1, chop: 1, smite: 1 } },
	plant: 		{ damage: { cut: 1, bite: 0.5, chop: 1, burn: 1, freeze: 2, corrode: 0.5, smite: 1, rot: 1 } },
	fungus: 	{ damage: { chop: 1, burn: 1, freeze: 2, corrode: 0.5, smite: 1, rot: 1 } },
	flesh: 		{ damage: { cut: 1, stab: 1, bite: 1, claw: 1, bash: 1, chop: 1, burn: 1, freeze: 1, shock: 1, corrode: 1, smite: 1, rot: 2 } },
	special: 	{ damage: { } },
};

const PotionImgChoices = {
// Heal / Buff
	eWater: 		{ img: "item/potion/roundedClear.png" },
	eHealing: 		{ img: "item/potion/roundedRed.png" },
	eInvisibility: 	{ img: "item/potion/roundedGray.png" },
	eRegeneration: 	{ img: "item/potion/roundedGold.png" },
	eCureDisease:	{ img: "item/potion/roundedGreen.png" },
	eCurePoison:	{ img: "item/potion/roundedBlack.png" },
	eResistBurn:	{ img: "item/potion/roundedBlue.png" },
	eResistFreeze:	{ img: "item/potion/roundedBlue.png" },
	eResistShock:	{ img: "item/potion/roundedBlue.png" },
	eResistWater:	{ img: "item/potion/roundedBlue.png" },
	eResistLight:	{ img: "item/potion/roundedBlue.png" },
	eResistCorrode:	{ img: "item/potion/roundedBlue.png" },
	eResistPoison:	{ img: "item/potion/roundedBlue.png" },
	eResistSmite:	{ img: "item/potion/roundedBlue.png" },
	eResistRot:		{ img: "item/potion/roundedBlue.png" },
	eResistSuffocate: { img: "item/potion/roundedBlue.png" },
	eBravery:	 	{ img: "item/potion/roundedMagenta.png" },
	eImmuneBurn:	{ img: "item/potion/roundedSilver.png" },
	eResistFreeze:	{ img: "item/potion/roundedSilver.png" },
	eImmuneShock:	{ img: "item/potion/roundedSilver.png" },
	eImmuneWater:	{ img: "item/potion/roundedSilver.png" },
	eImmuneLight:	{ img: "item/potion/roundedSilver.png" },
	eImmuneCorrode:	{ img: "item/potion/roundedSilver.png" },
	eImmunePoison:	{ img: "item/potion/roundedSilver.png" },
	eImmuneSmite:	{ img: "item/potion/roundedSilver.png" },
	eImmuneRot:		{ img: "item/potion/roundedSilver.png" },
	eImmuneSuffocate: { img: "item/potion/roundedSilver.png" },
// Harm / Debuff
	ePoison: 		{ img: "item/potion/squatBlack.png" },
	eBurn: 			{ img: "item/potion/squatRed.png" }, 
	eFreeze: 		{ img: "item/potion/squatCyan.png" }, 
	eAcid: 			{ img: "item/potion/squatGreenBubble.png" }, 
	eVulnerability:	{ img: "item/potion/squatPurple.png" },
// Mental
	ePanic: 		{ img: "item/potion/sqMagentaBlack.png" },
	eRage: 			{ img: "item/potion/sqYellow.png" },
	ePacify: 		{ img: "item/potion/sqBlue.png" },
	eConfuse: 		{ img: "item/potion/sqCyan.png" },
	eAlliance: 		{ img: "item/potion/sqPurple.png" },
	eTame: 			{ img: "item/potion/sqPink.png" },
	eThrall: 		{ img: "item/potion/sqBlack.png" },
	eConfusion: 	{ img: "item/potion/sqBrown.png" },
// Senses
	eBlindness: 	{ img: "item/potion/tubeBlack.png" },
	eCureBlindness:	{ img: "item/potion/tubeBlackBlue.png" },
	eResistBlind:	{ img: "item/potion/tubeBlackSilver.png" },
	eImmuneBlind:	{ img: "item/potion/tubeBlackSilver.png" },
	eSeeInvisible: 	{ img: "item/potion/tubeGrayStripe.png" },
	eSenseXray: 	{ img: "item/potion/tubeWhite.png" },
	eDarkVision:	{ img: "item/potion/tubeGold.png" },
	eSenseSmell: 	{ img: "item/potion/tubeRed.png" },
	eOdorless: 		{ img: "item/potion/tubeYellow.png" },
// Mobility
	eHaste: 		{ img: "item/potion/flaskWhite.png" },
	eSlow: 			{ img: "item/potion/flaskGray.png" },
	eJump2:			{ img: "item/potion/flaskOrange.png" },
	eJump3:			{ img: "item/potion/flaskOrange.png" },
	eJump4:			{ img: "item/potion/flaskOrange.png" },
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
const NullEfects = { eInert: { power: 0, rarity: 1 } };
const PotionEffects = Object.filter(EffectTypeList, (e,k)=>[
	// Senses things are potions because they affect your physical ability
	'eDarkVision','eSenseSmell','eSeeInvisible','eSenseXray','eBlindness',
	// Healing your body in any way also makes sense
	'eHealing','eCureDisease','eCurePoison','eCureBlindness','eOdorless','eRegeneration',
	// Drinking something that makes you physcially change - faster, slower, invisible, smelly
	'eHaste','eSlow','eJump2','eJump3','eJump4','eInvisibility','eStink',
	// You can resist physical stuff by drinking things
	'eResistBurn','eResistFreeze','eResistShock','eResistPoison','eResistRot','eResistSuffocate','eResistBlind',
	// You can be immune to physical stuff by drinking things
	'eImmuneBurn','eImmuneFreeze','eImmuneShock','eImmunePoison','eImmuneRot','eImmuneSuffocate','eImmuneBlind',
	// These seem less legit to me. It could be that something else should provide resistances
	'eVulnerability',
	// Certain kinds of mind alteration, that you could achieve with drugs IRL
	'eConfusion','eRage','ePanic','eBravery',
	// Splash damage from water or acid is sensible. Maybe we should make them generally blast2 or better.
	'eWater','eAcid',
	// Poison only makes sense when imbibed. As splash damage? Not great.
	'ePoison',
	// What would these really be? I'm thinking that maybe darts need to do this.
	'eBurn','eFreeze'	
	].includes(k) );

const SpellEffects = Object.filter(EffectTypeList, (e,k)=>[
	'ePossess','eStun','eBlink','eTeleport','eStartle','eHesitate','eBlindness','eLight','eSenseXray','eSenseLiving',
	'eMentalFence','eSenseTreasure','eSlow','eHealing','ePoison','eWater','eBurn','eFreeze','eShock','eSmite',
	'eSmite3','eRot','eLeech','eRage','ePacify','eAlliance','ePanic','eConfusion','eShove','eInvisibility',
	'eTame','eThrall'
	].includes(k) );

const RingEffects = Object.filter(EffectTypeList, (e,k)=>[
	// Since rings are rarest, most of their capabilities are awesome, with senseTreasure being the odd man out.
	'eSenseSmell','eOdorless','eRegeneration','eSenseTreasure','eMobility','eSeeInvisible',
	'eResistRot','eResistSmite','eResistBurn','eResistFreeze','eResistShock','eResistPoison','eResistSuffocate',
	].includes(k) );

// Weapons only keep their magic for a little while. Apply runes in order to re-enhance them
const WeaponEffects = Object.filter(EffectTypeList, (e,k)=>[
	// Energy damage is classic magic for weapons.
	'eBurn','eFreeze','eShock',
	// Can we find a way to apply poison potions to weapons? If you 'use' a poison potion it applies to currently held weapon?
	'ePoison',
	// The trope of the life-sucking weapon.
	'eLeech',
	// This can only really be justified because it is a rune you're applying to the weapon
	'eSmite',
	// We should consider making these characteristics of certain weapons
	'eShove',		// Staves
	'eStun',		// Clubs, maces
	// 'eShatter',	// hammers can shatter stiff armor or like a carapace?
	].includes(k));
//const AmmoEffects = Object.filter(EffectTypeList, (e,k)=>['eSmite','eSmite3','eSmite5','eSmite7','ePoison','eBurn','eFreeze','eBlindness','eSlow','eConfusion'].includes(k) );

const ShieldEffects = Object.filter(EffectTypeList, (e,k)=>[
	'eStun','eShove','eDeflect','eDeflectRot','eResistBurn','eResistShock','eResistCorrode','eImmuneCorrode'
	].includes(k) );

const HelmEffects = Object.filter(EffectTypeList, (e,k)=>[
	// Guarding your eyes seems legit.
	'eResistBlind',
	// A shining beacon of light for the player.
	'eLight',
	// A couple of permanently useful visions you might want, but smell and xray are purposely omitted.
	'eSeeInvisible','eDarkVision',
	// Helms protect the mind from Confusion, Hesitation, Panic, and possession
	'eClearMind','eStalwart','eBravery','eIronWill',
	// Complete protection against every mental attack
	'eMentalFence',
	// Multiple armor pieces and rings can provide regen, each adding 1%
	'eRegeneration', 
	].includes(k) );

const ArmorEffects = Object.filter(EffectTypeList, (e,k)=>[
	// Multiple armor pieces and rings can provide regen, each adding 1%
	'eRegeneration',
	// Body armor can keep you warm,and shunt acid
	'eResistFreeze', 'eResistCorrode',
	].includes(k) );

const CloakEffects = Object.filter(EffectTypeList, (e,k)=>[
	'eInvisibility', 'eOdorless', 'eRechargeFast', 'eResistBurn', 'eResistFreeze'
	].includes(k) );

const BracersEffects = Object.filter(EffectTypeList, (e,k)=>[
	'eBlock'
	].includes(k) );

const BootsEffects = Object.filter(EffectTypeList, (e,k)=>[
	// Multiple armor pieces and rings can provide regen, each adding 1%
	'eOdorless','eJump2','eJump3','eRegeneration','eFlight','eResistShove'
	].includes(k) );

const AmuletEffects = Object.filter(EffectTypeList, (e,k)=>[
	// Multiple armor pieces and rings can provide regen, each adding 1%
	'eRegeneration','eResistRot','eResistSmite','eResistPoison'
	].includes(k) );

// Gaps in the bow effects are shock (reserved for darts), and stun/slow/shove (reserved for slings)
const BowEffects = Object.filter(EffectTypeList, (e,k)=>[
	// Classic energy damage, and piercing will poison. Rot's idea is something gets into your blood.
	'eBurn','eFreeze','ePoison','eRot'
	].includes(k) );

// Slings are meant for short range bashing.  that feals "heavy" is their realm.
const SlingEffects = Object.filter(EffectTypeList, (e,k)=>[
	// These would happen if you were hit on the head, or hit very hard with a blunt trauma
	'eStun','eShove',
	// Because it is biblical, and because slinging does a bit less than arrows.
	'eSmite'
	].includes(k) );

const DartEffects = Object.filter(EffectTypeList, (e,k)=>[
	// Darts have the general concept of being tipped with a solution, so all the mental effects are on them.
	'ePoison','eStun','eStartle','eHesitate','eBlindness','eSlow'
	].includes(k) );

const GemEffects = Object.filter(EffectTypeList, (e,k)=>[
	'eMentalWall','eClearMind','eStalwart','eDarkVision','eSmite','ePossess','eRage',
	'eLight','eSenseTreasure','eSenseLiving','eSeeInvisible'
	].includes(k) );


const WeaponMaterialList = ({ //Type.establish('WeaponMaterial',{},{
	"bronze": 		{ power:  0 /* very important this be zero!*/, fixins: 'ingotCopper', name: 'bronze', matter: 'metal' },
	"iron": 		{ power:  5 /* very important this be zero!*/, fixins: 'ingotIron', name: 'iron', matter: 'metal' },
	"silver": 		{ power: 10, fixins: 'ingotSilver', name: 'silver', matter: 'metal' },
	"ice": 			{ power: 25, fixins: 'ice block', name: 'ice', matter: 'liquid', durability: Rules.weaponDurability(20) },
	"lunarium": 	{ power: 40, fixins: 'lunarium ingot', name: 'lunarium', matter: 'metal' },
	"glass": 		{ power: 55, fixins: 'oreMalachite', name: 'glass', matter: 'glass', breakChance: Rules.weaponBreakChance(20) },
	"deepium": 		{ power: 70, fixins: 'deepium ingot', name: 'deepium', matter: 'metal' },
	"solarium": 	{ power: 85, fixins: 'solarium ingot', name: 'solarium', matter: 'metal' },
});

const BowMaterialList = ({ //Type.establish('BowMaterial',{},{
	"ash": 			{ power:  0, fixins: 'wood' },		// power MUST be zero
	"oak": 			{ power:  5, fixins: 'wood' },
	"maple": 		{ power: 25, fixins: 'wood' },
	"lunarium": 	{ power: 40, fixins: 'ingotLunarium' },
	"yew": 			{ power: 55, fixins: 'wood' },
	"deepium": 		{ power: 70, fixins: 'ingotDeepium' },
	"solarium": 	{ power: 85, fixins: 'ingotSolarium' },
});

const SlingMaterialList = ({
	"ash": 			{ power:  0, fixins: 'wood' /* very important this be zero!*/ },
	"oak": 			{ power:  5, fixins: 'wood' },
	"maple": 		{ power: 25, fixins: 'wood' },
	"lunarium": 	{ power: 40, fixins: 'wood' },
	"yew": 			{ power: 55, fixins: 'wood' },
	"deepium": 		{ power: 70, fixins: 'wood' },
	"solarium": 	{ power: 85, fixins: 'wood' },
});

const ArrowMaterialList = ({
	"ash": 			{ power:  0, fixins: 'wood' /* very important this be zero!*/ },
	"oak": 			{ power:  5, fixins: 'wood' },
	"maple": 		{ power: 25, fixins: 'wood' },
	"lunarium": 	{ power: 40, fixins: 'wood' },
	"yew": 			{ power: 55, fixins: 'wood' },
	"deepium": 		{ power: 70, fixins: 'wood' },
	"solarium": 	{ power: 85, fixins: 'wood' },
});


const AmmoVarietyList = ({ //Type.establish('AmmoVariety',{},{
	"arrow":     	{
		power:  0,
		rarity: 1.0,
		noLevelVariance: true,
		attackVerb: 'shoot',
		bunchSize: 8,
		breakChance: 50,
		breakVerb: false,	// silently breaks.
		damageType: DamageType.STAB,
		xDamage: 0.4,	// Needs to be 0.4 or better so tht the different ammo types can be distinguished.
		isArrow: true,
		matter: 'wood',
		materials: ArrowMaterialList,
		name: '{material} arrow${+plus}',
		quick: Quick.NORMAL,
		slot: Slot.AMMO,
		img: 'UNUSED/spells/components/bolt.png',
		flyingImg: StickerList.arrowInFlight.img,
		flyingRot: true,
		flyingScale: 1.0,
		flyingSpeed: 15,
	},
	"rock": {
		power:  0,
		rarity: 1.0,
		bunchSize: 4,
		xDamage: 0.40,
		damageType: DamageType.BASH,
		matter: 'stone',
		isRock: true,
		isSlingable: true,
		quick: Quick.NORMAL,
		name: 'rock${+plus}',
		mayThrow: true,
		range: Rules.RANGED_WEAPON_DEFAULT_RANGE,
		effectChance: 0.000001,
		img: 'item/weapon/ranged/rock2.png'
	},
	// Sling stones give better damage and are quicker than irregularly shaped rocks.
	"slingStone": {
		power:  10,
		rarity: 1.0,
		bunchSize: 6,
		xDamage: 0.60,					// More damage than regular rocks.
		matter: 'stone',
		damageType: DamageType.BASH,
		isSlingStone: true,
		isSlingable: true,
		quick: Quick.NIMBLE,			// Nimble due to aerodynamic shape.
		name: 'rock${+plus}',
		mayThrow: true,
		range: Rules.RANGED_WEAPON_DEFAULT_RANGE,
		effectChance: 0.000001,
		img: 'item/weapon/ranged/rock2.png'
	},
	// Darts are throw only. The unique thing about darts is that, when you hit somebody with one, it does very little
	// damage but the effect ALWAYS happens.
	"dart":     	{
		power:  0,
		rarity: 0.5,
		bunchSize: 4,
		xDamage: 0.30,
		damageType: DamageType.STAB,
		matter: 'metal',
		quick: Quick.LITHE,				// Important element of darts.
		name: 'dart${+plus}{?effect}',
		chanceEffectFires: 100,			// Here is the key element of darts,
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

const WeaponVarietyList = ({ //Type.establish('WeaponVariety',{},{
	// Bows damage combines bow+ammo, and when their effect does damage they take on more of that than weapons.
	// Arrows are considered slow, so a stealth bow that does less damage is needed for nimble or lithe opponents.
	// Since their primary damage is stab anything that wants some ranged protection can resist or immune to stab and do pretty well.
	// Their natural ranged advantage is tempered by lower damage: 50% bow and 30% arrow.
	"bow": {
		power:  0,
		rarity: 1.0,
		xDamage: 0.5,	// The needs to be low, because the arrow takes up the rest or the damage.
		xPrice: 1.4,
		matter: 'wood',
		quick: Quick.NORMAL,
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
	// Although the Stealth Bow does much less damage it won't give away your location.
	// We'll probably get rid of this entirely.
	"stealthBow": {		// Less damage but it can hit nimble creatures.
		power:  0,
		rarity: 0.5,
		xDamage: 0.3,
		xPrice: 3.0,
		matter: 'wood',
		quick: Quick.NORMAL,
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
		power:  0,
		rarity: 1.0,
		xDamage: 0.4,
		xPrice: 1.4,
		matter: 'leather',
		fixins: 'stuff.leather',
		quick: Quick.NORMAL,
		materials: SlingMaterialList,
		effectChance: 0.80,
		effects: SlingEffects,
		chanceEffectFires: 20,
		damageType: DamageType.BASH,
		mayShoot: true,
		isSling: true,
		range: 4,
		ammoType: 'isSlingable',
		ammoSpec: 'ammo.slingStone',
		ammoDamage: 'combine',
		ammoEffect: 'addMine',
		ammoQuick:  'theirs',
		attackVerb: 'sling',
		img: 'item/weapon/ranged/bow1.png'
	},
	// The lithe melee and ranged weapon that stabs but seldom has special effects.
	"dagger": {
		power: 3,
		rarity: 0.5,
		xDamage: 0.70,
		damageType: DamageType.STAB,
		quick: Quick.LITHE,
		effectChance: 0.30,
		chanceEffectFires: 50,
		mayThrow: true,
		range: 4,
		attackVerb: 'strike',
		img: 'item/weapon/dagger.png',
		scale: 0.7
	},
	// Lithe, and does very special smite damage instead of cut or stab.
	"solarBlade": {
		power: 0,
		rarity: 0,
		xDamage: 0.33,	// This must be low to offset the fact that it is solarium.
		damageType: DamageType.SMITE,
		glow: 1,
		light: 3,
		quick: Quick.LITHE,
		attackVerb: 'smite',
		isSoulCollector: true,
		isUnique: true,
		isPlot: true,
		name: "solar blade",
		materials: { solarium: WeaponMaterialList.solarium },
		effects: { eInert: EffectTypeList.eInert},
		img: 'item/weapon/solariumBlade.png'
	},
	"hands": {
		power: 0,
		rarity: 0,
		xDamage: 0.3,
		damageType: DamageType.BASH,
		isHands: true,
		noDrop: true,
		quick: Quick.LITHE,
		materials: { flesh: {} },
		effects: { eInert: EffectTypeList.eInert},
		matter: 'flesh',
		name: 'hands{?effect}',
	},
	"claws": {
		power: 0,
		rarity: 0,
		xDamage: 0.8,
		damageType: DamageType.CLAW,
		noDrop: true,
		quick: Quick.LITHE,
		materials: { flesh: {} },
		effects: { eInert: EffectTypeList.eInert},
		matter: 'flesh',
		name: 'claws{?effect}',
		isClaws: true
	},
	"bite": {
		power: 0,
		rarity: 0,
		xDamage: 1.0,
		damageType: DamageType.BITE,
		noDrop: true,
		quick: Quick.LITHE,
		materials: { flesh: {} },
		effects: { eInert: EffectTypeList.eInert},
		matter: 'flesh',
		name: 'bite{?effect}',
		isBite: true
	},
	"pickaxe": {
		power: 0,
		rarity: 0.1,
		xDamage: 0.70,
		damageType: DamageType.STAB,
		quick: Quick.CLUMSY,
		attackVerb: 'strike',
		mineSpeed: 1.0,
		effects: { eInert: EffectTypeList.eInert},
		img: {
			src: 'item/weapon/pickaxe.png',
			desaturate: -1.0
		}
	},
	"club": {
		power: 0,
		rarity: 1.0,
		xDamage: 0.70,
		matter: 'wood',
		damageType: DamageType.BASH,
		quick: Quick.NORMAL,
		isClub: true,
		attackVerb: 'smash',
		img: 'item/weapon/club.png'
	},
	// The only lithe bashing weapon. Modest damage, but at least it bashes.
	"staff": {
		power: 0,
		rarity: 1.0,
		xDamage: 0.60,
		matter: 'wood',
		materials: BowMaterialList,
		damageType: DamageType.BASH,
		quick: Quick.LITHE,
		isStaff: true,
		attackVerb: 'whack',
		img: 'item/weapon/club.png'
	},
	// The standard weapon. It does regular damage, cutting, and can harm creatures up to nimble.
	"sword": {
		power: 1,
		rarity: 1.0,
		xDamage: 1.00,
		damageType: DamageType.CUT,
		quick: Quick.NIMBLE,
		isSword: 1,
		img: 'item/weapon/long_sword1.png'
	},
	// More damage than a sword, but only Quick.NORMAL
	"broadsword": {
		power: 3,
		rarity: 0.5,
		xDamage: 1.10,
		damageType: DamageType.CUT,
		quick: Quick.NORMAL,
		isSword: 1,
		img: 'item/weapon/long_sword1.png'
	},
	// More damage than sword or broadsword, but Quick.CLUMSY
	"greatsword": {
		power: 5,
		rarity: 0.3,
		xDamage: 1.20,
		damageType: DamageType.CUT,
		isSword: 1,
		quick: Quick.CLUMSY,
		img: 'item/weapon/long_sword2.png'
	},
	"rapier": {
		power: 1,
		rarity: 0.2,
		xDamage: 0.90,
		damageType: DamageType.STAB,
		quick: Quick.LITHE,
		isSword: 1,
		img: 'item/weapon/long_sword1.png'
	},
	"mace": {
		power: 3,
		rarity: 1.0,
		xDamage: 0.90,
		damageType: DamageType.BASH,
		quick: Quick.NIMBLE,
		img: 'item/weapon/mace1.png'
	},
	// Most damage in the game, but clumsy.
	"hammer": {
		power: 4,
		rarity: 0.4,
		xDamage: 1.30,
		damageType: DamageType.BASH,
		quick: Quick.CLUMSY,
		img: 'item/weapon/hammer.png'
	},
	// Standard damage chopping weapon, throwable, but only NORMAL speed. Needs big swings.
	"axe": {
		power: 2,
		rarity: 1.0,
		xDamage: 1.00,
		damageType: DamageType.CHOP,
		quick: Quick.NORMAL,
		mayThrow: true,
		range: 5,
		attackVerb: 'strike',
		img: 'item/weapon/battle_axe1.png'
	},
	// Higher damage chopper, but Quick.CLUMSY
	"battleAxe": {
		power: 5,
		rarity: 0.2,
		xDamage: 1.10,
		damageType: DamageType.CHOP,
		quick: Quick.CLUMSY,
		attackVerb: 'strike',
		img: 'item/weapon/battle_axe1.png'
	},
	// Stabbing, throwable,, nimble reach weapon. A solid choice, if you're ok with the weaker damage
	"spear": {
		power: 8,
		rarity: 0.9,
		xDamage: 0.70,
		matter: 'wood',
		damageType: DamageType.STAB,
		quick: Quick.NIMBLE,
		reach: 2,
		mayThrow: true,
		range: 6,
		attackVerb: 'strike',
		img: 'item/weapon/spear2.png'
	},
	// The cutting weapon with reach and better damage than spear, but not throwable.
	"pike": {
		power: 12,
		rarity: 0.7,
		xDamage: 0.90,
		matter: 'wood',
		damageType: DamageType.CUT,
		quick: Quick.CLUMSY,
		reach: 2,
		img: 'item/weapon/bardiche1.png'
	},
	// Damage as good as a hammer, plus reach and close throw, but also clumsy; meant to be demon-like
	"pitchfork": {
		power: 16,
		rarity: 0.5,
		xDamage: 1.30,
		matter: 'wood',
		damageType: DamageType.STAB,
		quick: Quick.CLUMSY,
		reach: 2,
		mayThrow: true,
		range: 5,
		img: 'item/weapon/trident1.png'
	},
	// Extra spines give a bit of extra damage, like a souped-up spear but not as nimble.
	"trident": {
		power: 12,
		rarity: 0.5,
		xDamage: 1.10,
		matter: 'metal',
		damageType: DamageType.STAB,
		quick: Quick.NORMAL,
		reach: 2,
		mayThrow: true,
		range: 5,
		img: 'item/weapon/trident1.png'
	},
});

let BlockType = {
	PHYSICAL: 	'physical',
	REACH: 		'reach',
	THROWN: 	'thrown',
	SHOT: 		'shot',
	ELEMENTAL: 	'elemental',
	DIVINE: 	'divine',
	NOBLOCK: 	'noblock'
};

// Shield blocking in the xBlock plus 20%*power/POWER_MAX
const ShieldVarietyList = ({ //Type.establish('ShieldVariety',{},{
	"buckler":     	{ power:  0, rarity: 1.0, xArmor: 0.70, xBlock: 0.20, img: 'item/shield/shieldBuckler.png' },
	"targe":     	{ power:  5, rarity: 1.0, xArmor: 0.80, xBlock: 0.25, block: 'thrown', img: 'item/shield/shieldTarge.png' },
	"heater":     	{ power: 10, rarity: 0.8, xArmor: 0.90, xBlock: 0.30, block: 'thrown,shot', img: 'item/shield/shieldHeater.png' },
	"kite":     	{ power: 20, rarity: 0.6, xArmor: 1.00, xBlock: 0.35, block: 'thrown,shot', img: 'item/shield/shieldKite.png' },
	"pavise":     	{ power: 40, rarity: 0.1, xArmor: 1.20, xBlock: 0.40, block: 'thrown,shot', img: 'item/shield/shieldPavise.png' },
});

const ShieldMaterialList = ({ //Type.establish('ShieldMaterial',{},{
	"woodSM": 	{ power:  0, block: '', name: "wood", matter: 'wood' },
	"silverSM":	{ power:  5, block: 'divine', name: "silver", matter: 'metal' },
	"iron": 	{ power: 10, block: 'reach', name: 'iron', matter: 'metal' },
	"beryl": 	{ power: 15, block: 'elemental', name: 'beryl', matter: 'crystal' },
	"pearl": 	{ power: 20, block: 'elemental,reach', name: 'pearl', matter: 'glass' },
	"opal": 	{ power: 30, block: 'elemental,divine', name: 'opal', matter: 'crystal' },
	"solarium2": { power: 40, block: 'elemental,reach,divine', name: 'solarium', matter: 'metal' },
});

const ArmorVarietyList = ({ //Type.establish('ArmorVariety',{},{
	"fur": 			{ power:  0, rarity: 1.0, xArmor: 0.50, matter: 'leather', fixins: 'part isSkin isAnimal', img: 'item/armor/fur.png' },
	"hide": 		{ power:  1, rarity: 1.0, xArmor: 0.80, matter: 'leather', fixins: '2x part isSkin isAnimal', img: 'item/armor/hide.png' },
	"leather": 		{ power:  2, rarity: 1.0, xArmor: 0.85, matter: 'leather', fixins: '2x stuff.leather', img: 'item/armor/leather.png' },
	"studded": 		{ power:  3, rarity: 1.0, xArmor: 0.90, matter: 'leather', fixins: 'iron ingot', img: 'item/armor/studded.png' },
	"scale": 		{ power:  4, rarity: 1.0, xArmor: 0.95, fixins: 'ingotIron', img: 'item/armor/scale.png' },
	"chain": 		{ power: 10, rarity: 1.0, xArmor: 1.00, fixins: 'ingotIron', img: 'item/armor/chain.png' },
	"steelPlate": 	{ power: 15, rarity: 1.0, xArmor: 1.00, fixins: 'ingotIron', img: 'item/armor/steelPlate.png' },
	"trollHideArmor": { power: 20, rarity: 1.0, xArmor: 1.00, fixins: 'troll hide', img: 'item/armor/trollHide.png' },
	"elven": 		{ power: 30, rarity: 1.0, xArmor: 1.00, fixins: 'chitin', img: 'item/armor/elven.png' },
	"chitin": 		{ power: 35, rarity: 1.0, xArmor: 1.00, matter: 'chitin', fixins: 'chitin', img: 'item/armor/chitin.png' },
	"dwarven": 		{ power: 45, rarity: 1.0, xArmor: 1.00, fixins: 'chitin', img: 'item/armor/dwarven.png' },
	"ice": 			{ power: 50, rarity: 1.0, xArmor: 1.00, matter: 'liquid', fixins: 'ice block', img: 'item/armor/ice.png',
					durability: Rules.armorDurability(40)
					},
	"glass": 		{ power: 55, rarity: 1.0, xArmor: 1.00, matter: 'glass', fixins: 'oreMalachite', img: 'item/armor/crystal.png',
					breakChance: Rules.armorBreakChance(40)
					},
	"demonHide":	{ power: 65, rarity: 1.0, xArmor: 1.00, fixins: 'oreMalachite, stuff.demonLeather', img: 'item/armor/demonHide.png' },
	"lunar": 		{ power: 50, rarity: 1.0, xArmor: 1.00, fixins: 'lunarium ingot', img: 'item/armor/lunar.png' },
	"deep": 		{ power: 80, rarity: 1.0, xArmor: 1.00, fixins: 'deepium ingot', img: 'item/armor/deepium.png' },
	"solar": 		{ power: 85, rarity: 1.0, xArmor: 1.00, fixins: 'solarium ingot', img: 'item/armor/solar.png' },
});

const CloakVarietyList = ({ //Type.establish('CloakVariety',{},{
	"corduroyCloak": 	{ power:  0, rarity: 1.0, xArmor: 0.01, img: 'item/armour/cloak3.png' },
	"canvasCloak": 		{ power: 10, rarity: 1.0, xArmor: 0.01, img: 'item/armour/cloak3.png' },
	"linenCloak": 		{ power: 20, rarity: 1.0, xArmor: 0.01, img: 'item/armour/cloak3.png' },
	"linenRobes": 		{ power: 20, rarity: 1.0, xArmor: 0.01, img: 'item/armour/cloak3.png' },
	"silkCloak": 		{ power: 30, rarity: 1.0, xArmor: 0.01, img: 'item/armour/cloak3.png' },
	"elvishCloak": 		{ power: 40, rarity: 1.0, xArmor: 0.01, img: 'item/armour/cloak3.png' },
	"dwarvishCloak":	{ power: 50, rarity: 1.0, xArmor: 0.01, img: 'item/armour/cloak3.png' },
	"demonCloak": 		{ power: 60, rarity: 1.0, xArmor: 0.01, img: 'item/armour/cloak3.png' },
	"lunarCloak": 		{ power: 70, rarity: 1.0, xArmor: 0.01, img: 'item/armour/cloak3.png' },
});


const HelmVarietyList = ({ //Type.establish('HelmVariety',{},{
	"fur": 			{ power:  0, rarity: 1.0, xArmor: 0.50, matter: 'leather' },
	"hide": 		{ power:  1, rarity: 1.0, xArmor: 0.80, matter: 'leather' },
	"leather": 		{ power:  2, rarity: 1.0, xArmor: 0.85, matter: 'leather' },
	"studded": 		{ power:  3, rarity: 1.0, xArmor: 0.90, matter: 'leather' },
	"scale": 		{ power:  4, rarity: 1.0, xArmor: 0.95 },
	"chain": 		{ power: 10, rarity: 1.0, xArmor: 1.00, matter: 'chitin' },
	"steelPlate": 	{ power: 15, rarity: 1.0, xArmor: 1.00 },
	"trollHideArmor": 	{ power: 20, rarity: 1.0, xArmor: 1.00 },
	"chitin": 		{ power: 25, rarity: 1.0, xArmor: 1.00 },
	"elven": 		{ power: 30, rarity: 1.0, xArmor: 1.00 },
	"dwarven": 		{ power: 35, rarity: 1.0, xArmor: 1.00 },
	"ice": 			{ power: 40, rarity: 1.0, xArmor: 1.00, matter: 'liquid', durability: Rules.armorDurability(20) },
	"glass": 		{ power: 45, rarity: 1.0, xArmor: 1.00, matter: 'glass', breakChance: Rules.armorBreakChance(20) },
	"demon": 		{ power: 50, rarity: 1.0, xArmor: 1.00 },
	"lunar": 		{ power: 55, rarity: 1.0, xArmor: 1.00 },
	"solar": 		{ power: 60, rarity: 1.0, xArmor: 1.00 },
	"deep": 		{ power: 65, rarity: 1.0, xArmor: 1.00 },
});

const BracerVarietyList = ({ //Type.establish('BracerVariety',{},{
	"fur": 			{ power:  0, rarity: 1.0, xArmor: 0.50, matter: 'leather' },
	"hide": 		{ power:  1, rarity: 1.0, xArmor: 0.80, matter: 'leather' },
	"leather": 		{ power:  2, rarity: 1.0, xArmor: 0.85, matter: 'leather' },
	"studded": 		{ power:  3, rarity: 1.0, xArmor: 0.90, matter: 'leather' },
	"scale": 		{ power:  4, rarity: 1.0, xArmor: 0.95 },
	"chain": 		{ power: 10, rarity: 1.0, xArmor: 1.00 },
	"steelPlate": 	{ power: 15, rarity: 1.0, xArmor: 1.00 },
	"trollHideArmor": 	{ power: 20, rarity: 1.0, xArmor: 1.00 },
	"chitin": 		{ power: 25, rarity: 1.0, xArmor: 1.00, matter: 'chitin' },
	"elven": 		{ power: 30, rarity: 1.0, xArmor: 1.00 },
	"dwarven": 		{ power: 35, rarity: 1.0, xArmor: 1.00 },
	"ice": 			{ power: 40, rarity: 1.0, xArmor: 1.00, matter: 'liquid', durability: Rules.armorDurability(20) },
	"glass": 		{ power: 45, rarity: 1.0, xArmor: 1.00, matter: 'glass', breakChance: Rules.armorBreakChance(20) },
	"demon": 		{ power: 50, rarity: 1.0, xArmor: 1.00 },
	"lunar": 		{ power: 55, rarity: 1.0, xArmor: 1.00 },
	"solar": 		{ power: 60, rarity: 1.0, xArmor: 1.00 },
	"deep": 		{ power: 65, rarity: 1.0, xArmor: 1.00 },
});

const BootVarietyList = ({ //Type.establish('BootVariety',{},{
	"fur": 			{ power:  0, rarity: 1.0, xArmor: 0.50 },
	"hide": 		{ power:  1, rarity: 1.0, xArmor: 0.80 },
	"leather": 		{ power:  2, rarity: 1.0, xArmor: 0.85 },
	"studded": 		{ power:  3, rarity: 1.0, xArmor: 0.90 },
	"scale": 		{ power:  4, rarity: 1.0, xArmor: 0.95, matter: 'metal' },
	"chain": 		{ power: 10, rarity: 1.0, xArmor: 1.00, matter: 'metal' },
	"steelPlate": 	{ power: 15, rarity: 1.0, xArmor: 1.00, matter: 'metal' },
	"trollHideArmor": 	{ power: 20, rarity: 1.0, xArmor: 1.00 },
	"chitin": 		{ power: 25, rarity: 1.0, xArmor: 1.00, matter: 'chitin' },
	"elven": 		{ power: 30, rarity: 1.0, xArmor: 1.00, matter: 'metal' },
	"dwarven": 		{ power: 35, rarity: 1.0, xArmor: 1.00, matter: 'metal' },
	"ice": 			{ power: 40, rarity: 1.0, xArmor: 1.00, matter: 'liquid', durability: Rules.armorDurability(20) },
	"glass": 		{ power: 45, rarity: 1.0, xArmor: 1.00, matter: 'glass', breakChance: Rules.armorBreakChance(20) },
	"demon": 		{ power: 50, rarity: 1.0, xArmor: 1.00, matter: 'metal' },
	"lunar": 		{ power: 55, rarity: 1.0, xArmor: 1.00, matter: 'metal' },
	"solar": 		{ power: 60, rarity: 1.0, xArmor: 1.00, matter: 'metal' },
	"deep": 		{ power: 65, rarity: 1.0, xArmor: 1.00, matter: 'metal' },
});

const GloveVarietyList = ({ //Type.establish('GloveVariety',{},{
	"furGloves": 		{ power:  0, rarity: 1.0 },
	"leatherGloves": 	{ power:  1, rarity: 1.0 },
	"assassinGloves": 	{ power:  0, rarity: 0.3, effect: EffectTypeList.eAssassin },
	"studdedGloves": 	{ power:  9, rarity: 1.0 },
	"trollHideGloves": 	{ power: 14, rarity: 1.0, name: 'troll hide gloves',
							effect: { op: 'add', stat: 'immune', value: 'frogSpine' } },
	"scaleGauntlets":	{ power: 24, rarity: 1.0, matter: 'metal' },
	"chainGauntlets":	{ power: 34, rarity: 1.0, matter: 'metal' }
});



const VeinImageList = ({ //Type.establish('VeinVariety',{},{
	"veinCoal": 	{ img: 'ore/oreLumpBlack.png' },
	"veinTin": 		{ img: 'ore/oreMetalGray.png' },
	"veinCopper": 	{ img: 'ore/oreMetalOrange.png' },
	"veinIron": 	{ img: 'ore/oreMetalRed.png' },
	"veinSilver": 	{ img: 'ore/oreMetalSilver.png' },
	"veinGold": 	{ img: 'ore/oreMetalYellow.png' },
	"veinPlatinum": { img: 'ore/oreMetalBlue.png' },
	"veinLunarium": { img: 'ore/oreGemCyan.png' },
	"veinSolarium": { img: 'ore/oreGemYellow.png' },
	"veinDeepium": 	{ img: 'ore/oreGemBlack.png' },
	"veinGarnet": 	{ img: 'ore/oreGemPurple.png' },
	"veinOpal": 	{ img: 'ore/oreGemWhite.png' },
	"veinRuby": 	{ img: 'ore/oreGemRed.png' },
	"veinEmerald": 	{ img: 'ore/oreGemGreen.png' },
	"veinSapphire": { img: 'ore/oreGemBlue.png' },
	"veinDiamond": 	{ img: 'ore/oreGemWhite.png' },
	// must be last!
	"veinNone": 	{ img: 'ore/oreVein.png' },
});

function mapTypeId(list) {
	Object.each( list, (data,key)=>{data.typeId=key;} );
	return list;
}

const VeinVarietyList = mapTypeId({ //Type.establish('VeinVariety',{},{
	"veinCoal": 	{ power:  0, rarity:  1.0, name: "coal vein", mineId: 'coal' },
	"veinTin": 		{ power:  5, rarity:  1.0, name: "tin ore vein", mineId: 'oreTin' },
	"veinCopper": 	{ power:  5, rarity:  0.8, name: "copper ore vein", mineId: 'oreCopper' },
	"veinIron": 	{ power: 10, rarity:  0.8, name: "iron ore vein", mineId: 'oreIron' },
	"veinSilver": 	{ power: 30, rarity:  0.5, name: "silver ore vein", mineId: 'oreSilver' },
	"veinGold": 	{ power: 45, rarity:  0.3, name: "gold ore vein", mineId: 'oreGold' },
	"veinPlatinum": { power: 55, rarity:  0.3, name: "platinum ore vein", mineId: 'orePlatinum' },
	"veinLunarium": { power: 75, rarity:  0.2, name: "lunarium ore vein", mineId: 'oreLunarium' },
	"veinSolarium": { power: 60, rarity:  0.2, name: "solarium ore vein", mineId: 'oreSolarium' },
	"veinDeepium": 	{ power: 85, rarity:  0.1, name: "deepium ore vein", mineId: "oreDeepium" },
	"veinGarnet": 	{ power: 20, rarity:  0.3, name: "garnet ore vein", mineId: "gem.garnet", isGemOre: true },
	"veinOpal": 	{ power: 35, rarity:  0.3, name: "opal ore vein", mineId: "gem.opal", isGemOre: true },
	"veinRuby": 	{ power: 40, rarity:  0.2, name: "ruby ore vein", mineId: "gem.ruby", isGemOre: true },
	"veinEmerald": 	{ power: 50, rarity:  0.2, name: "emerald ore vein", mineId: "gem.emerald", isGemOre: true },
	"veinSapphire": { power: 65, rarity:  0.2, name: "sapphire ore vein", mineId: "gem.sapphire", isGemOre: true },
	"veinDiamond": 	{ power: 80, rarity:  0.1, name: "diamond ore vein", mineId: "gem.diamond", isGemOre: true },
	// must be last!
	"veinNone": 	{ power:  0, rarity: 0.001, isNone: true, name: "ore vein" },
});


const OreVarietyList = ({ //Type.establish('OreVariety',{},{
	"coal": 		{ power:  0, rarity: 1.0, name: "coal", img: 'ore/oreLumpBlack.png', scale: 0.5, isFuel: true },
	"oreTin": 		{ power:  2, rarity: 1.0, name: "tin ore", img: 'ore/oreMetalWhite.png', scale: 0.5 },
	"oreIron": 		{ power:  5, rarity: 0.8, name: "iron ore", img: 'ore/oreMetalBlack.png', scale: 0.5 },
	"oreCopper": 	{ power: 10, rarity: 0.6, name: "copper ore", img: 'ore/oreMetalOrange.png', scale: 0.5 },
	"oreSilver": 	{ power: 15, rarity: 0.5, name: "silver ore", img: 'ore/oreMetalSilver.png', scale: 0.5 },
	"oreGold": 		{ power: 20, rarity: 0.3, name: "gold ore", img: 'ore/oreMetalYellow.png', scale: 0.5 },
	"oreMalachite": { power: 25, rarity: 0.3, name: "malachite shards", img: 'ore/oreGemGreen.png', scale: 0.5 },
	"oreLunarium": 	{ power: 30, rarity: 0.2, name: "lunarium ore", img: 'ore/oreGemCyan.png', scale: 0.5 },
	"oreSolarium": 	{ power: 35, rarity: 0.1, name: "solarium ore", img: 'ore/oreGemYellow.png', scale: 0.5 },
	"oreDeepium": 	{ power: 40, rarity: 0.1, name: "deepium ore", img: 'ore/oreGemBlack.png', scale: 0.5 },
});

const GemQualityList = ({ //Type.establish('GemQuality',{},{
	"flawed": 		{ power:  0, rarity: 1.0, xPrice: 0.5 },
	"average": 		{ power:  5, rarity: 0.8, xPrice: 1.0 },
	"large": 		{ power: 10, rarity: 0.6, xPrice: 1.2 },
	"flawless": 	{ power: 15, rarity: 0.4, xPrice: 1.5 },
	"sublime": 		{ power: 20, rarity: 0.2, xPrice: 2.0 }
});

const GemVarietyList = ({ //Type.establish('GemVariety',{},{
	"garnet": 		{ power:  0, rarity:  0.3, img: "gems/Gem Type1 Red.png" },
	"opal": 		{ power:  3, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"turquoise": 	{ power:  6, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"amethyst": 	{ power:  9, rarity:  0.3, img: {
		src:"item/gem/gem2Oct.png",
		desaturate: -1.0
	}},
	"pearl": 		{ power: 12, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"amber": 		{ power: 15, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"jade": 		{ power: 18, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"lapisLazuli":  { power: 21, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"topaz": 		{ power: 24, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"moonstone": 	{ power: 27, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"agate": 		{ power: 30, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"tourmaline": 	{ power: 33, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"peridot": 		{ power: 36, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"malachite": 	{ power: 39, rarity:  0.3, img: "gems/Gem Type1 Green.png" },
	"citrine": 		{ power: 42, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"jasper": 		{ power: 45, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"carnelian": 	{ power: 48, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"chalcedony": 	{ power: 51, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"beryl": 		{ power: 54, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"spinel": 		{ power: 57, rarity:  0.3, img: "gems/Gem Type1 Yellow.png" },
	"ruby": 		{ power: 60, rarity:  0.2, img: "gems/Gem Type2 Red.png" },
	"emerald": 		{ power: 65, rarity:  0.2, img: "gems/Gem Type2 Green.png" },
	"sapphire": 	{ power: 70, rarity:  0.2, img: "gems/Gem Type2 Blue.png" },
	"diamond": 		{ power: 75, rarity:  0.1, img: "gems/Gem Type3 Black.png" },
});

const CharmVarietyList = ({ //Type.establish('CharmVariety',{},{
	"centurionFigurine":{ power: 44, rarity: 0.1, matter: 'stone', mayThrow: true, mayTargetPosition: true, rechargeTime: 10*50, img: 'item/stuff/solarCenturionFigurine.png',
						effect: { op: 'summon', value: 'solarCenturion', isServant: true, xDuration: 5.0, doesTiles: true, name: false }
						},
	"batFigurine": 		{ power: 1, rarity: 1.0, matter: 'stone', mayThrow: true, mayTargetPosition: true, rechargeTime: 10*50, img: 'item/stuff/figurine.png',
						effect: { op: 'summon', value: 'bat', isServant: true, xDuration: 1.0, doesTiles: true, name: false }
						},
	"bearFigurine": 	{ power: 9, rarity: 1.0, matter: 'stone', mayThrow: true, mayTargetPosition: true, rechargeTime: 10*50, img: 'item/stuff/figurine.png',
						effect: { op: 'summon', value: 'bear', isServant: true, xDuration: 5.0, doesTiles: true, name: false }
						},
	"dogFigurine": 		{ power: 0, rarity: 1.0, matter: 'stone', mayThrow: true, mayTargetPosition: true, rechargeTime: 10*50, img: 'item/stuff/figurine.png',
						effect: { op: 'summon', value: 'dog', isServant: true, xDuration: 5.0, doesTiles: true, name: false }
						},
	"viperFigurine": 	{ power: 24, rarity: 1.0, matter: 'stone', mayThrow: true, mayTargetPosition: true, rechargeTime: 10*50, img: 'item/stuff/figurine.png',
						effect: { op: 'summon', value: 'viper', isServant: true, xDuration: 5.0, doesTiles: true, name: false }
						},
	"sunCrystal":   	{ rarity: 0.6, matter: 'crystal', mayThrow: true, range: 7, light: 12, glow: 1, attackVerb: 'throw', img: "item/stuff/sunCrystal.png", mayTargetPosition: true,
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
	"solarOrbS":   		{ rarity: 1.0, matter: 'energy', xPrice: 4.0, mayThrow: true, range: 6, mayTargetPosition: true, light: 12, glow: 1, scale: 0.3, img: "item/stuff/solarOrb.png", name: 'small solar orb' },
	"solarOrbM":   		{ rarity: 0.6, matter: 'energy', xPrice: 5.0, mayThrow: true, range: 5, mayTargetPosition: true, light: 15, glow: 1, scale: 0.4, img: "item/stuff/solarOrb.png", name: 'medium solar orb' },
	"solarOrbL":   		{ rarity: 0.2, matter: 'energy', xPrice: 7.0, mayThrow: true, range: 4, mayTargetPosition: true, light: 18, glow: 1, scale: 0.5, img: "item/stuff/solarOrb.png", name: 'large solar orb' },
	"solarOrbH":   		{ rarity: 0.2, matter: 'energy', xPrice: 9.0, mayThrow: true, range: 4, mayTargetPosition: true, light: 22, glow: 1, scale: 0.6, img: "item/stuff/solarOrb.png", name: 'huge solar orb' },
});

// Artifact, Relic, Talisman, Amulet

const StuffVarietyList = ({ //Type.establish('StuffVariety',{},{
	"shovel": {
		rarity: 0.2,
		matter: 'wood',
		mineSpeed: 0.2,
		isShovel: true,
		effects: { eInert: EffectTypeList.eInert},
		img: 'item/tool/shovel.png'
	},
	"wood":				{ rarity: 0.6, matter: 'wood', xPrice:  0.1, isWood: 1 },
	"leather":			{ rarity: 0.6, matter: 'leather', xPrice:  0.1, isLeather: 1, recipe: 'part isAnimal isSkin' },
	"demonLeather":		{ rarity: 0.6, matter: 'leather', xPrice:  0.4, isDemonLeather: 1, recipe: 'part isDemon isSkin' },
	"candleLamp": 		{ rarity: 0.6, matter: 'wax',   xPrice:  2, slot: Slot.HIP, light:  4, isLight: 1, triggerOnUse: true, autoEquip: true, effect: { op: 'set', stat: 'light', value:  4, name: 'light 4', icon: EffectTypeList.eLight.icon }, useVerb: 'clip on', img: "item/stuff/candle.png" },
	"torch": 			{ rarity: 1.0, matter: 'wood',  xPrice:  4, slot: Slot.HIP, light:  6, isLight: 1, triggerOnUse: true, autoEquip: true, effect: { op: 'set', stat: 'light', value:  6, name: 'light 6', icon: EffectTypeList.eLight.icon }, isTorch: true, allowPlacementOnBlocking: true, useVerb: 'clip on', img: "item/stuff/torch.png" },
	"lamp": 			{ rarity: 0.4, matter: 'metal', xPrice:  6, slot: Slot.HIP, light:  8, isLight: 1, triggerOnUse: true, autoEquip: true, effect: { op: 'set', stat: 'light', value:  8, name: 'light 8', icon: EffectTypeList.eLight.icon }, allowPlacementOnBlocking: true, useVerb: 'clip on', img: "item/stuff/lamp.png" },
	"lantern": 			{ rarity: 0.2, matter: 'metal', xPrice:  8, slot: Slot.HIP, light: 10, isLight: 1, triggerOnUse: true, autoEquip: true, effect: { op: 'set', stat: 'light', value: 10, name: 'light 10', icon: EffectTypeList.eLight.icon }, allowPlacementOnBlocking: true, useVerb: 'clip on', img: "item/stuff/lantern.png" },
	"voidCandle": 		{ rarity: 0.3, matter: 'wax',   xPrice:  2, slot: Slot.HIP, thinkDon: false, triggerOnUse: true, effect: { op: 'set', stat: 'dark', value: 4, name: 'shroud', icon: EffectTypeList.eDark.icon }, useVerb: 'clip on', img: "item/stuff/voidCandle.png" },
	"voidLamp": 		{ rarity: 0.2, matter: 'metal', xPrice:  4, slot: Slot.HIP, thinkDon: false, triggerOnUse: true, effect: { op: 'set', stat: 'dark', value: 6, name: 'shroud', icon: EffectTypeList.eDark.icon }, useVerb: 'clip on', img: "item/stuff/darkLamp.png" },
	"voidLantern": 		{ rarity: 0.1, matter: 'metal', xPrice:  8, slot: Slot.HIP, thinkDon: false, triggerOnUse: true, effect: { op: 'set', stat: 'dark', value: 8, name: 'shroud', icon: EffectTypeList.eDark.icon }, useVerb: 'clip on', img: "item/stuff/darkLantern.png" },
	"lumpOfMeat": 		{ rarity: 1.0, matter: 'flesh', mayThrow: true, mayTargetPosition: true, isEdible: true, img: "item/food/chunk.png" },
	"trollHide": 		{ rarity: 0.5, matter: 'leather', img: "item/armour/troll_hide.png" },
	"bone": 			{ rarity: 1.0, matter: 'bone', mayThrow: true, mayTargetPosition: true, isEdible: true, isBone: true, img: "item/food/bone.png" },
	"antGrubMush": 		{ rarity: 0.8, matter: 'liquid', isAntFood: true, mayThrow: true, mayTargetPosition: true, isEdible: true, img: "item/food/sultana.png" },
	"viperVenom": 		{ rarity: 0.6, matter: 'liquid', img: "UNUSED/other/acid_venom.png" },
	"dogCollar": 		{ rarity: 1.0, matter: 'leather', isJewelry: true, img: 'item/misc/collar.png' },
	"skull": 			{ rarity: 1.0, matter: 'bone', mayThrow: true, mayTargetPosition: true, isEdible: true, isBone: true, img: 'item/stuff/skull.png' },
	"demonScale": 		{ rarity: 0.2, matter: 'flesh', img: 'item/misc/demonEye.png' },
	"demonEye": 		{ rarity: 0.2, matter: 'flesh', mayThrow: true, mayTargetPosition: true, isEdible: true, isGem: true, img: 'item/misc/demonEye.png' },
	"ghoulFlesh": 		{ rarity: 0.4, matter: 'flesh', mayThrow: true, mayTargetPosition: true, isEdible: true, img: 'item/food/chunk_rotten.png' },
	"pinchOfEarth": 	{ rarity: 1.0, matter: 'stone', img: 'item/weapon/ranged/rock.png' },
	"markOfReturn": 	{ rarity: 0.0, matter: 'stone', isMarkOfReturn: true, noPermute: true, command: Command.TRIGGER, name: 'mark of return',
						effect: { name: 'return', op: 'gate', twoWay: true, duration: 0, isTac: true, description: 'Use this to return to a marked location, and then use it AGAIN to return to you origin point.' } },
	"darkEssence": 		{ rarity: 0.1, matter: 'special', },
	"trollBlood": 		{ rarity: 0.6, matter: 'liquid' },
	"spinneret": 		{ rarity: 0.4, matter: 'flesh', bitPoison: true },
	"chitin": 			{ rarity: 1.0, matter: 'chitin', },
	"poisonGland": 		{ rarity: 0.4, matter: 'flesh', bitPoison: true },
	"snailTrail": 		{ rarity: 0.0, matter: 'liquid', alpha: 0.3, isTreasure: false, img: 'item/stuff/snailSlime.png', isSnailSlime: true, mayPickup: false, existenceTime: 10 },
	"snailSlime": 		{ rarity: 0.4, matter: 'liquid', alpha: 0.5, img: 'item/stuff/snailSlime.png', isSnailSlime: true, },
	"redOozeSlime": 	{ rarity: 0.2, matter: 'liquid', mayThrow: true, mayTargetPosition: true, isEdible: true, img: 'item/stuff/redSlime.png' },
	"poisonSlime": 		{ rarity: 0.2, matter: 'liquid', alpha: 0.5, scale: 0.25, mayThrow: true, mayTargetPosition: true, img: 'item/stuff/poisonSlime.png',
						damageType: DamageType.POISON },
	"acidTrail": 		{ rarity: 0.2, matter: 'liquid', alpha: 0.2, scale: 0.35, mayThrow: true, isAcidSlime: true, img: 'item/stuff/acidSlime.png',
						damageType: DamageType.CORRODE, mayPickup: false, existenceTime: 10 },
	"acidSlime": 		{ rarity: 0.2, matter: 'liquid', alpha: 0.5, scale: 0.25, mayThrow: true, mayTargetPosition: true, img: 'item/stuff/acidSlime.png',
						damageType: DamageType.CORRODE },
	"lunarEssence": 	{ rarity: 0.6, matter: 'energy', },
	"frogSpine": 		{ rarity: 0.8, matter: 'flesh', },
	"wool": 			{ rarity: 1.0, matter: 'flesh', isFabricIngredient: true },
	"magicMap":			{ rarite: 1.0, matter: 'paper', effect: EffectTypeList.eMap, charges: 1, command: Command.TRIGGER, description: "One glance at this magic map blaze the area into your memory." },

	"ingotTin": 		{ power:  0, rarity: 1.0, matter: 'metal', isIngot: true, fixins: '3x oreTin', name: 'tin ingot' },
	"ingotCopper": 		{ power:  0, rarity: 1.0, matter: 'metal', isIngot: true, fixins: '3x oreCopper', name: 'copper ingot' },
	"ingotIron": 		{ power:  5, rarity: 1.0, matter: 'metal', isIngot: true, fixins: '3x oreIron', name: 'iron ingot' },
	"ingotSilver": 		{ power:  5, rarity: 0.8, matter: 'metal', isIngot: true, fixins: '3x oreSilver', name: 'silver ingot' },
	"ingotGold": 		{ power: 15, rarity: 0.7, matter: 'metal', isIngot: true, fixins: '3x oreGold', name: 'gold ingot' },
	"ingotLunarium": 	{ power: 40, rarity: 0.5, matter: 'metal', isIngot: true, fixins: '3x oreLunarium', name: 'lunarium ingot' },
	"ingotDeepium": 	{ power: 70, rarity: 0.3, matter: 'metal', isIngot: true, fixins: '3x oreDeepium', name: 'deepium ingot' },
	"ingotSolarium": 	{ power: 85, rarity: 0.4, matter: 'metal', isIngot: true, fixins: '3x oreSolarium', name: 'solarium ingot' },

});

StuffVarietyList.snailTrail.onTickRound = function() {
	if( this.owner.isMap ) {
		this.map.scentClear(this.x,this.y);
	}
}

StuffVarietyList.snailSlime.onTickRound = function() {
	if( this.owner.isMap ) {
		this.map.scentClear(this.x,this.y);
	}
}

StuffVarietyList.acidTrail.isProblem 	= TouchDamage.isProblem;
StuffVarietyList.acidTrail.onTouch 	= TouchDamage.onTouchWalk;
StuffVarietyList.acidSlime.isProblem 	= TouchDamage.isProblem;
StuffVarietyList.acidSlime.onTouch 	= TouchDamage.onTouchWalk;
StuffVarietyList.poisonSlime.isProblem = TouchDamage.isProblem;
StuffVarietyList.poisonSlime.onTouch 	= TouchDamage.onTouchWalk;


const RingMaterialList = ({ //Type.establish('RingMaterial',{},{
	"brass": 	{ power: 0, img: 'item/ring/brass.png' },
	"copper": 	{ power: 1, img: 'item/ring/bronze.png' },
	"silver": 	{ power: 3, img: 'item/ring/silver.png' },
	"gold": 	{ power: 7, img: 'item/ring/gold.png' }
});

const RingVarietyList = ({ //Type.establish('RingVariety',{},{
	"garnetSetting": 	{ power:  0, rarity:  0.3, name: 'garnet' },
	"opalSetting": 		{ power:  5, rarity:  0.3, name: 'opal' },
	"rubySetting": 		{ power: 20, rarity:  0.2, name: 'ruby' },
	"emeraldSetting": 	{ power: 40, rarity:  0.2, name: 'emerald' },
	"sapphireSetting": 	{ power: 60, rarity:  0.2, name: 'sapphire' },
	"diamondSetting": 	{ power: 80, rarity:  0.1, name: 'diamond' }
});

const CoinImgChoices = ({ //Type.establish('CoinStack',{},{
	coinOne: 	{ img: "item/misc/coin01.png" },
	coinThree: 	{ img: "item/misc/coin01.png" },
	coinTen: 	{ img: "item/misc/coinTen.png" },
	coinMany: 	{ img: "item/misc/coinPile.png" },
});
let CoinImgChooseFn = self => {
	let c = self ? self.coinCount : null;
	let cs = self.imgChoices;
	return (c<=1 ? cs.coinOne : c<=4 ? cs.coinThree : c<=10 ? cs.coinTen : cs.coinMany).img;
};

const DoorStates = {
	open:   {
		img: 'portal/door1Open.png',
		mayWalk: true, mayFly: true, opacity: 0,
	},
	shut:   {
		img: 'portal/door1Shut.png',
		mayWalk: false, mayFly: false, opacity: 1,
	},
	locked: {
		img: 'portal/door1Locked.png',
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

/*
Item Events
onPickup() 				- fired just before an item is picked up. Return false to disallow the pickup.
onTickRound() 			- fires each time a full turn has passed, for every item, whether in the world or in an inventory. 
onBump(toucher,self)	- when any entity bumps into this. Remember that self might be a temporary tile proxy
onPutInWorld(x,y,map)	- when an item is put into the world, either from the void to from an inventory.
onGiveToEntity(x,y,recipient)	- when an item is given to a creature.
onAttacked(attacker,amount,damageType) - when attacked.

// Here are typical item values
// symbol			- the text character used to represent this thing
// charges			- decrements when item effect is used successfully. At zero removes the item's effect completely.
// durability		- decrements when item used successfully. At zero item is destroyed.
// breakChance		- upon item effect use, rolls a chance to break and if so the item is destroyed.
// mayWalk			- creatures can walk over it
// mayFly			- creatures can fly over it
// mayPickup		- can be picked up into inventory
// mayThrow			- you can throw this
// opacity			- how well can normal sight see past this thing? 0.0 clear through 1.0 opaque
// img, imgChoices	- images ou can show for this item
// imgSpin			- rate at which this image spins
// isDecor			- this may not go in a container.
// isWall			- generally impassable.
// isFloor			- passable.
// isGate			- leads to another area. Needs a gateDir and gateInverse.
// qualities		- 1 of 3 things the picker randomizes on an item
// materials		- 2 of 3 things the picker randomizes on an item
// varieties		- 3 of 3 things the picker randomizes on an item
// effects			- The list of all effects this thing is allowed to have.
// effectWhen		- DEPRECATED
// scale			- adjustment to the image size
// isContainer		- you can acquire the inventory of this object by bumping it.
// hasInventory		- carries inventory. But you might not be able to get to it. See isContainer.
// carrying	- the loot this thing gets when it is first generated
*/

let ItemTypeList = {
	"random":	  { symbol: '*', isRandom: 1, mayPickup: false, neverPick: true, img: '' },
	// GATEWAYS
	"stairsDown": {
		symbol: '>',
		name: "stairs down",
		isGate: 1,
		gateDir: 1,
		gateInverse: 'stairsUp',
		isStairsDown: true,
		mayPickup: false,
		useVerb: 'descend',
		img: "portal/stairsDown.png"
	},
	"stairsUp": {
		symbol: '<',
		name: "stairs up",
		isGate: 1,
		gateDir: -1,
		gateInverse: 'stairsDown',
		isStairsUp: true,
		mayPickup: false,
		useVerb: 'ascend',
		img: "portal/stairsUp.png"
	},
	"gateway": {
		symbol: 'O',
		name: "gateway",
		isGate: 1,
		gateDir: 0,
		gateInverse: 'gateway',
		mayPickup: false,
		useVerb: 'enter',
		img: "portal/arch1.png"
	},
	"portal":     {
		symbol: '0',
		name: "portal",
		isGate: 1,
		gateDir: 0,
		gateInverse: 'portal',
		mayPickup: false,
		useVerb: 'touch',
		glow: 1,
		light: 4,
		imgSpin: 0.01,
		img: "portal/portal.png"
	},
	"pitDrop": {
		symbol: '`',
		name: "pit drop",
		isGate: 1,
		gateDir: 1,
		oneway: true,
		mayPickup: false,
		useVerb: 'fall',
		img: "effect/pitDrop.png"
	},
	// DOOR
	"door": {
		symbol: '+',
		mayWalk: true,
		mayFly: true,
		opacity: 0,
		name: "{state} door",
		isDoor: 1,
		mayPickup: false,
		keyId: false,
		state: 'open',
		states: DoorStates,
		imgChoices: DoorStates,
		imgChooseFn: self => self.imgChoices[self.state].img
	},
	// MARKERS
	"marker": {
		name: "marker",
		rarity: 1,
		mayPickup: false,
		img: "gui/icons/marker.png"
	},
	// DECOR
	"columnBroken": {
		mayWalk: false,
		mayFly: false,
		mayPickup: false,
		rarity: 1,
		name: "broken column",
		isDecor: true,
		img: "dc-dngn/crumbled_column.png"
	},
	"columnStump": {
		mayWalk: false,
		mayFly: true,
		mayPickup: false,
		rarity: 1,
		name: "column stump",
		isDecor: true,
		img: "dc-dngn/granite_stump.png"
	},
	"brazier": {
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
		imgChooseFn: self => self.imgChoices[self.state].img
	},
	"table": {
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
		imgChooseFn: self => self.img
	},
	"sign": {
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
		imgChooseFn: self => self.img
	},
	"bed": {
		mayWalk: false,
		mayFly: true,
		opacity: 0,
		name: "wooden bed",
		mayPickup: false,
		isDecor: true,
		isBed: true,
		imgChoices: {
			head: { img: 'decor/bedHead.png' },
			foot: { img: 'decor/bedFoot.png' }
		},
		imgChooseFn: self => self.img
	},
	"barrel": {
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
		carrying: '3x 20% any, 30% ammo.rock',
		hasInventory: true,
		scale: 0.80,
		img: 'decor/barrel.png'
	},
	"chest": {
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
		imgChooseFn: self => self.imgChoices[self.state].img,
		carrying: '5x 20% any, 30% ammo.arrow, 30% ammo.rock',
		hasInventory: true
	},
	"coffin": {
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
		imgChooseFn: self => self.imgChoices[self.state].img,
		carrying: '30% weapon, 30% armor, 30% coin, 5% helm, 5% bracers, 5% boots, 5% ring, 30% ammo.arrow',
		hasInventory: true
	},
	"altar": {
		mayWalk: false,
		mayFly: false,
		rarity: 1,
		name: "golden altar",
		mayPickup: false,
		light: 4,
		glow: true,
		hasInventory: true,
		hideInventory: true,
		isDecor: true,
		isSolarAltar: true,
		rechargeTime: 12,
		healMultiplier: 3.0,
		sign: "This golden alter to Solarus glows faintly.\nTouch it to heal, level up, and set your respawn point.",
		effect: {
			name: 'holy healing',
			op: 'heal',
			xDamage: 6.00,
			healingType: DamageType.SMITE,
			icon: 'gui/icons/eHeal.png'
		},
		img: "dc-dngn/altars/dngn_altar_shining_one.png"
	},
	"fountain": {
		mayWalk: false,
		mayFly: true,
		rarity: 1,
		mayPickup: false,
		name: "fountain",
		isDecor: true,
		isWaterSource: true,
		sign: "Water streams from this beautiful fountain. You can fill empty vials here.",
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
		sign: "Glorious light streams from this strange rift in reality.",
		img: "terrain/fontSolar.png"
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
		lightDestroys: 3,
		isDecor: true,
		sign: "Sinister anti-light plagues this unsettling rift in reality.",
		img: "terrain/fontDeep.png"
	},
// ORE VEINS
	"vein":    {
		symbol: 	'v',
		mayWalk: 	false,
		mayFly: 	false,
		mayPickup: 	false,
		rarity: 	1,
		opacity: 	1,
		isWall: 	true,
		noneChance: 0.90,
		zOrder:		Tile.zOrder.VEIN,
		imgBg:		'oreVein.png',
		imgChooseFn: self => self.imgChoices[self.variety.typeId].img,
		matter: 	'stone',
		imgChoices: VeinImageList,
		varieties: 	VeinVarietyList,
		mineSwings: 14
	},
	"vial": {
		name: 			'Empty glass vial',
		rarity:			0,
		isTreasure:		true,
		isVial:			true,
		matter:			'glass',
		mayWalk: 		true,
		mayFly: 		true,
		mayPickup: 		true,
		icon: 			'/gui/icons/charm.png',
		img:			"item/potion/silver.png"
	},

// FAKES and SKILLS
	"skill": 	{ isSkill: true, rarity: 0, img: 'gui/icons/skill.png', icon: "/gui/icons/skill.png" },
	"fake":   	{
		isFake: true,
		name: "fake",
		rarity: 1,
		img: 'UNUSED/spells/components/skull.png',
		icon: "/gui/icons/corpse.png"
	},
	"naturalWeapon":   	{
		name: "naturalWeapon",
		rarity: 1,
		noDrop: true,
		isFake: true,
		img: 'UNUSED/spells/components/skull.png',
		icon: "/gui/icons/corpse.png"
	},
// CORPSE
	"corpse":   {
		name: "{matter} remains of a {mannerOfDeath} {usedToBe}",
		matter: "REPLACE THIS MATTER",
		rarity: 0,			// Never generates, because the Grocer job picks from .isEdible
		isCorpse: true,
		isEdible: true,
		zOrder: Tile.zOrder.CORPSE,
		scale: 0.50,
		img: 'mon/corpse.png',
		icon: "/gui/icons/corpse.png"
	},
// KEYS
	"key": {
		symbol: 		'k',
		name: 			'key to {keyId}',
		matter: 		'metal',
		keyId: 			'none',
		isTreasure: 	1,
		isKey: 			true,
		noSell: 		true,
		img: 			"item/misc/key.png",
		icon: 			'/gui/icons/key.png'
	},
// TREASURE
	"coin": 	{
		symbol: 		'$',
		name:		 	'{coinCount} gold',
		matter: 		'metal',
		coinCount: 		0,
		coinVariance: 	0.30,
		isCoin: 		true,
		isTreasure: 	1,
		imgChoices: 	CoinImgChoices,
		imgChooseFn: 	CoinImgChooseFn,
		icon: 			'/gui/icons/coin.png'
	},
	"potion":   {
		symbol: 		'p',
		isTreasure: 	1,
		name:		 	'potion${?effect}{+plus}',
		matter: 		'glass',
		durability: 	1,
		xDamage: 		1.5,	// Single use, so more damage.
		light: 			3,
		glow: 			true,
		attackVerb: 	'splash',
		isPotion: 		true,
		scale:			0.6,
		range: 			Rules.rangePotion,
		effects: 		PotionEffects,
		effectWhen: 	{ isHarm: 'throw', DEFAULT: 'quaff'},
		mayThrow: 		true,
		imgChoices: 	PotionImgChoices,
		imgChooseFn: 	self => self.effect && self.imgChoices[self.effect.typeId] ? self.imgChoices[self.effect.typeId].img : self.imgChoices.eHealing.img,
		icon: 			'/gui/icons/potion.png'
	},
	"spell":    {
		symbol: 		's',
		isTreasure: 	1,
		name:		 	'spell${?effect}{+plus}',
		matter: 		'paper',
		rechargeTime: 	Rules.SPELL_RECHARGE_TIME,
		effects: 		SpellEffects,
		effectWhen: 	'cast',
		mayCast: 		true,
		isSpell: 		true,
		isMagic:		true,
		range: 			Rules.rangeSpell,
		img: 			"item/scroll/scroll.png",
		icon: 			'/gui/icons/spell.png'
	},
	"ore": 		{
		symbol: 		'o',
		isTreasure: 	1,
		name:		 	'{variety}',
		matter: 		'stone',
		varieties: 		OreVarietyList,
		isOre: 			true,
		imgChoices: 	OreVarietyList,
		imgChooseFn: 	self => self.variety.img,
		icon: 			'/gui/icons/ore.png'
	},
	"gem": 		{
		symbol: 		"g",
		isTreasure: 	1,
		name:		 	'{quality} {variety} $ {?effect}',
		matter: 		'crystal',
		qualities: 		GemQualityList,
		varieties: 		GemVarietyList,
		effects: 		GemEffects,
		effectWhen: 	{ isHarm: 'throw', DEFAULT: 'gaze' },
		isGem: 			true,
		mayThrow: 		1,
		mayGaze: 		1,
		breakChance:	33,
		breakVerb:		'shatter',
		range: 			Rules.RANGED_WEAPON_DEFAULT_RANGE,
		mayTargetPosition: 1,
		autoCommand: 	Command.USE,
		imgChooseFn: 	self => self.variety.img,
		imgChoices: 	GemVarietyList,
		scale: 			0.3,
		icon: 			'/gui/icons/gem.png'
	},
	"weapon": 	{
		symbol: 'w',
		isTreasure: 1,
		name:		 	'{material} {variety}${+plus}{?effect}',
		matter: 		'metal',
		durability:		4*100,
		varieties: 		WeaponVarietyList,
		materials: 		WeaponMaterialList,
		effects: 		WeaponEffects,
		effectWhen: 	'attack',
		slot: 			Slot.WEAPON,
		isWeapon: 		true,
		useVerb: 		'wield',
		mayTargetPosition: true,
		img: 			"item/weapon/dagger.png",
		icon: 			'/gui/icons/weapon.png'
	},
	"ammo": 	{
		symbol: 		'm',
		isTreasure: 	1,
		name: 	'{material} {variety}${+plus}{?effect}',
		durability:		4*100,
		varieties: 		AmmoVarietyList,
		donBunches: 	true,
		isWeapon: 		true,
		isAmmo: 		true,
		slot: 			Slot.AMMO,
		useVerb: 		'ready',
		img: 			"item/weapon/dagger.png",
		icon: 			'/gui/icons/ammo.png'
	},
	"shield": {
		symbol: 		'x',
		isTreasure: 	1,
		name: 			"{material} {variety} shield${+plus}{?effect}",
		durability:		8000,
		matter: 		'metal',
		block: 			'physical',
		varieties: 		ShieldVarietyList,
		materials: 		ShieldMaterialList,
		effects: 		ShieldEffects,
		effectWhen: 	'use',
		slot: 			Slot.SHIELD,
		isShield: 		true,
		xArmor: 		0.50,
		useVerb: 		'hold',
		triggerOnUseIfHelp: true,
		effectDecorate: { duration: true },
		img: 			"item/armour/shields/shield3_round.png",
		icon: 			'/gui/icons/shield.png'
	},
	"helm": {
		symbol: 		'h',
		isTreasure: 	1,
		name:		 	"{variety} helm${+plus}{?effect}",
		matter: 		'metal',
		durability:		Math.floor(4*60/5),
		varieties: 		HelmVarietyList,
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
		icon: 			'/gui/icons/helm.png'
	},
	"armor": {
		symbol: 		'a',
		isTreasure: 	1,
		name:		 	"{variety} armor${+plus}{?effect}",
		matter: 		'metal',
		durability:		Rules.armorDurability(100),
		varieties: 		ArmorVarietyList,
		effects: 		ArmorEffects,
		effectWhen: 	{ isHarm: 'backsies', DEFAULT: 'use' },
		slot: 			Slot.ARMOR,
		isArmor: 		true,
		donDuration:	6,
		xArmor: 		0.60,
		useVerb: 		'wear',
		triggerOnUseIfHelp: true,
		effectDecorate: { duration: true },
		imgChooseFn: 	self => self.variety.img,
		imgChoices: 	ArmorVarietyList,
		icon: 			'/gui/icons/armor.png'
	},
	"cloak": {
		symbol: 		'c',
		isTreasure: 	1,
		name:		 	"{variety}${+plus}{?effect}",
		matter: 		'cloth',
		durability:		Rules.armorDurability(100),
		varieties: 		CloakVarietyList,
		effects: 		CloakEffects,
		effectWhen: 	'use',
		slot: 			Slot.ARMOR,
		isArmor: 		true,
		isCloak: 		true,
		xArmor: 		0.01,
		useVerb: 		'wear',
		triggerOnUseIfHelp: true,
		effectDecorate: { duration: true },
		imgChooseFn: 	self => self.variety.img,
		imgChoices: 	CloakVarietyList,
		icon: 			'/gui/icons/armor.png'
	},
	"bracers": {
		symbol: 		'b',
		isTreasure: 	1,
		name:		 	"{variety} bracers{+plus}{?effect}",
		matter: 		'metal',
		durability:		Rules.armorDurability(100),
		varieties: 		BracerVarietyList,
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
		icon: 			'/gui/icons/bracers.png'
	},
	"gloves": {
		symbol: 		'l',
		isTreasure: 	1,
		name:		 	"{variety}$",
		matter: 		'leather',
		durability:		Rules.armorDurability(100),
		varieties: 		GloveVarietyList,
		effectWhen: 	'use',
		slot: 			Slot.HANDS,
		isGloves: 		true,
		useVerb: 		'wear',
		triggerOnUseIfHelp: true,
		effectDecorate: { duration: true },
		img: 			"UNUSED/armour/glove4.png",
		icon: 			'/gui/icons/gloves.png'
	},
	"boots": {
		symbol: 		'z',
		isTreasure: 	1,
		name:		 	"{variety} boots{+plus}{?effect}",
		matter: 		'leather',
		durability:		Rules.armorDurability(100),
		varieties: 		BootVarietyList,
		slot: 			Slot.FEET,
		isBoots: 		true,
		isArmor: 		true,
		effects: 		BootsEffects,
		effectWhen: 	'use',
		xArmor: 0.10,
		useVerb: 		'wear',
		triggerOnUseIfHelp: true,
		effectDecorate: { duration: true },
		img:			"item/armour/boots2_jackboots.png",
		icon:			'/gui/icons/boots.png'
	},
	"amulet": {
		isTreasure: 	1,
		name:		 	"amulet{?effect}",
		matter: 		'stone',
		durability:		Rules.armorDurability(100),
		slot: 			Slot.NECK,
		isAmulet: 		true,
		effects: 		AmuletEffects,
		effectWhen: 	'use',
		useVerb: 		'wear',
		triggerOnUseIfHelp: true,
		effectDecorate: { duration: true },
		img:			"item/amulet.png",
		icon:			'/gui/icons/boots.png'
	},
	"ring": {
		symbol: 		'r',
		isTreasure: 	1,
		name:		 	"{material} {variety} ring${+plus}{?effect}",
		matter: 		'metal',
		materials: 		RingMaterialList,
		varieties: 		RingVarietyList,
		effects: 		RingEffects,
		effectWhen: 	'use',
		slot: 			Slot.FINGERS,
		isRing: 		true,
		isJewelry: 		true,
		useVerb: 		'wear',
		triggerOnUse: 	true,
		effectDecorate: { duration: true },
		imgChooseFn:	self => self.material.img,
		imgChoices: 	RingMaterialList,
		icon: 			'/gui/icons/ring.png'
	},
	"charm": {
		isTreasure: 	1,
		isCharm: 		1,
		name:		 	"{variety}${?effect}",
		varieties: 		CharmVarietyList,
		imgChooseFn:	self => self.variety.img,
		imgChoices: 	CharmVarietyList,
		icon: 			'/gui/icons/charm.png'
	},
	"stuff": {
		symbol: 		't',
		isTreasure: 	1,
		isStuff: 		1,
		name:		 	"{variety}${?effect}",
		varieties: 		StuffVarietyList,
		imgDefault:		'item/misc/misc_rune.png',
		imgChooseFn: 	self => self.variety.img || self.imgDefault,
		imgChoices: 	StuffVarietyList,
		icon: 			'/gui/icons/stuff.png'
	},
	// INGREDIENTS

	"part": {
		symbol: 		'y',
		matter: 		'stone',
		isPart: 		1,
		isTreasure:		1,
		varieties:		{},	// This gets auto-filled during the monsterPreProcess()
		name:			'{variety}$',
		img: 			'item/misc/misc_rune.png',
		scale:			0.50,
		icon: 			'/gui/icons/stuff.png'
	},

};


const ItemSortOrder = ['skill','weapon','ammo','helm','armor','cloak','bracers','gloves','boots','shield','ring','potion','gem','spell','charm','ore','plant','mushroom','stuff','part','key'];
const ItemFilterOrder = ['','skill','weapon','armor','shield','potion','spell','ring','gem','ore','charm','stuff'];
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
	charm:  ['charm'],
	stuff:  ['stuff','part','key','plant','mushroom']
};


ItemTypeList.vein.onBump = function(entity,self) {
	let tool = entity.getFirstItemInSlot(Slot.WEAPON);
	if( !tool || !tool.mineSpeed ) {
		tell(mSubject,entity,' ',mVerb,'need',' a pickaxe to mine this ore.');
		return;
	}
	entity.swings = (entity.swings||0)+1;
	let dx = self.x - entity.x ;
	let dy = self.y - entity.y;
	let deg = deltaToDeg(dx,dy);
	new Anim({
		follow: 	entity,
		duration: 	0.1,
		onInit: 		a => { a.takePuppet(entity); },
		onSpriteMake: 	s => { s.sPosRelDeg(deg,0.2); },
	});
	let chunkAnim = new Anim({
		at: 		self,
		img: 		StickerList.oreChaff.img,
		duration: 	0.2,
		onInit: 		a => { a.create(6); },
		onSpriteMake: 	s => { s.sScale(0.3).sVel(Random.anim.floatRange(-90,90),Random.anim.floatRange(2,5)); s.zOrder=100; },
		onSpriteTick: 	s => { s.sMoveRel(s.xVel,s.yVel).sGrav(40).sRotate(360*s.dt); }
	});
	new Anim({
		at: 		self,
		img: 		ImageRepo.getImg(self),
		duration: 	0.2,
		onInit: 		a => { a.create(1); },
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

	// Give inventory, specifically the Solar Blade
	let delay = 0;
	if( self.inventory && self.inventory.length ) {
		Inventory.giveTo( toucher, self.inventory, self, false, item => {
			delay += 0.2;
		});
	}

	// Grant a Mark of Return.
	if( toucher.isChosenOne ) {
		let item = toucher.findItem(item=>item.teleportId=='altar');
		if( !item ) {
			item = toucher.itemCreate('stuff.markOfReturn');
			item.giveTo(toucher,toucher.x,toucher.y);
			tell( mCares,toucher,mSubject,self,' ',mVerb,'grant',' ',mObject,toucher,' a Mark of Return.');
			item.teleportId = 'altar';
		}
		item.effect.areaId =toucher.area.id;
		item.effect.x = toucher.x;
		item.effect.y = toucher.y;
	}

	// Reveal starter chests
	if( self.unhide ) {
		let label = self.unhide;
		let hidList = [].concat( self.map.itemListHidden );
		hidList.forEach( item => {
			item.unhide();
			let a = Anim.FloatUp( self.id, item, StickerList.ePoof.img );
			a.delay = Random.anim.floatRange(0,0.5);

		});
		delete self.unhide;
	}

	// Death Return
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
			entity.requestGateTo( entity.deathReturn.area, entity.deathReturn.px, entity.deathReturn.py);
			entity.vanish = false;
			entity.health = entity.healthMax;
			entity.dead = false;
		};
	}

	// Level Up
	if( toucher.isMonsterType && toucher.experience!==undefined ) {
		toucher.levelUp();
	}

	// Heal the player
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

ItemTypeList.altar.onTickRound = function() {
	if( this.depleted && !this.rechargeLeft ) {
		tell( mSubject,this,' ',mVerb,'begin',' to glow.');
		this.depleted = false;
	}
	this.glow = !this.rechargeLeft;
	this.light = this.rechargeLeft ? 0 : ItemTypeList.altar.light;
}

ItemTypeList.table.imgDetermine = function(map,x,y) {
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


ItemTypeList.bed.imgDetermine = function(map,x,y) {
	let n = map.findItemAt(x,y-1).filter(item=>item.isBed).first;
	this.img = this.imgChoices[n?'head':'foot'].img;
}


ItemTypeList.sign.imgDetermine = function(map,x,y) {
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
		tell(mSubject,entity,' ',mVerb,'open',' the ',mObject,self);
		Anim.FloatUp( entity.id, self, StickerList.open.img );
		return true;
	}
	if( self.state == 'locked' ) {
		let key = new Finder(entity.inventory).filter(item=>self.keyId && item.keyId==self.keyId).first;
		let hasKey = self.keyId===undefined || key;
		if( hasKey ) {
			self.setState('shut');
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
		self.setState( self.inventory && self.inventory.length > 0 ? 'open' : 'empty' );
	}
	else {
		if( self.inventory && self.inventory.length > 0 ) {
			guiMessage( 'hideInfo', { from: 'onBump' } );
			if( self.onLoot ) {
				let allow = self.onLoot(self,toucher);
				if( allow === false ) return;
			}
			Inventory.giveTo( toucher, self.inventory, self, false); //, item => {
			Anim.Fountain(toucher.id,self,20,1.0,4,StickerList.coinSingle.img);
		}
		self.setState( self.inventory && self.inventory.length > 0 ? 'open' : 'empty' );
	}
}

ItemTypeList.coffin.onBump = ItemTypeList.chest.onBump;

ItemTypeList.barrel.onBump = function(toucher,self) {
	if( self.inventory && self.inventory.length > 0 ) {
		if( self.onLoot ) {
			let allow = self.onLoot(self,toucher);
			if( allow === false ) return;
		}
		Inventory.giveTo( toucher, self.inventory, self, false );
	}

	new Anim({
		watch: true,
		at:			self,
		img: 		self.img,
		duration: 	0.6,
		onInit: 		a => { a.create(5); },
		onSpriteMake: 	s => { let deg=Random.anim.floatRange(0-40,0+40); s.sScale(0.8).sVel(deg,Random.anim.floatRange(5,7)); s.rot = deg/60*Math.PI; },
		onSpriteTick: 	s => { s.sMoveRel(s.xVel,s.yVel).sGrav(20).sScale(s.sOverTime(0.8,0.5)); s.rotation += s.rot*s.dt; }
	});

	self.destroy();
}

ItemTypeList.fountain.onBump = function(toucher,self) {
	if( !toucher || !toucher.inventory ) {
		return;
	}
	let vial = new Finder(toucher.inventory,toucher).filter(item=>item.isVial).first;
	if( !vial ) {
		tell(mSubject,toucher,' could fill a vial with water, if you had an empty vial.');
		return;
	}
	Inventory.lootTo( toucher, 'potion.eWater', toucher.map.depth || self.level || 1, self, true );
	self.destroy();
	tell(mSubject,toucher,' ',mVerb,'fill',' a vial with water from the fountain.');
}

ItemTypeList.fontSolar.onTickRound = function() {
	let nearby = new Finder(this.area.entityList,this).filter(e=>e.isMonsterType && e.team==Team.GOOD).shotClear().nearMe(3);
	let self = this;
	nearby.forEach( entity => {
		let deed = DeedManager.findFirst( d=>d.target && d.target.id==entity.id && d.isSolarRegen );
		if( deed ) {
			deed.timeLeft = 2;
		}
		else {
			let aboveHead = -0.7;
			let glowAnim = new Anim({
				follow: 	entity,
				img: 		StickerList.glowGold.img,
				duration: 	true,
				onInit: 		a => { a.create(1); },
				onSpriteMake: 	s => { s.sScale(0.30).sQuiverSet(0,aboveHead); },
			});
			let effect = new Effect(this.area.depth,{
				isSolarRegen: true,
				op: 'add',
				stat: 'regenerate',
				value: 0.05,
				duration: 4,
				icon: EffectTypeList.eRegeneration.icon,
				onEnd: () => {
					glowAnim.die('deed completed')
				}
			});
			effectApply(effect,entity,null,self,'tick');
			//Anim.Homing(self.id,self,entity,StickerList.glowGold.img,45,6,0.5,5);
			let divergeSign = 1;
			return new Anim({
				origin:		self,
				follow: 	entity,
				img: 		StickerList.glowGold.img,
				delayId: 	self.id,
				duration: 		Anim.Duration.untilAllDead,
				onInit: 		a => { },
				onTick: 		a => a.createPerSec(3,1),
				onSpriteMake: 	s => { s.sScale(0.30).sDuration(2).divergence=Random.anim.floatRange(1,3)*divergeSign; divergeSign = -divergeSign; },
				onSpriteTick: 	s => !s.sMissile( s.tCubed ).sDiverge( s.tSquared ).sQuiverSet(0,aboveHead).sArrived(0.001),
			});
		}



		let f = new Finder(entity.inventory).filter( item => item.rechargeTime && item.rechargeLeft > 0 );
		if( f.count ) {
			let item = pick(f.all);
			item.recharge(3);
			tell( mSubject|mPossessive|mCares,entity,' ',mObject,item,' suddenly recharges.' );
		}
	});
}


ItemTypeList.fontDeep.onTickRound = function() {
	let nearby = new Finder(this.area.entityList,this).filter(e=>e.team==Team.GOOD).shotClear().nearMe(4);
	let self = this;

	// Drain nearby magic items.
	nearby.forEach( entity => {
		let effect = new Effect(entity.area.depth,this.effectDrain,this,this.rechargeTime);
		effect.chargeless = true;
		effect.showOnset = false;
		effectApply(effect,entity,this,null,'tick');
	});

	// Rot nearby creatures. That might heal certain creatures.
	if( this.isRecharged() ) {
		nearby.forEach( entity => {
			let effect = new Effect(entity.area.depth,this.effectPeriodic,this,this.rechargeTime);
			effect.icon = StickerList.glowRed.img;
			//this.command = Command.CAST;
			effectApply(effect,entity,this,null,'tick');
			//Anim.Homing(this.id,entity,self,effect.icon,45,6,0.5,5);

			Anim.Run({
				style:		'Missile',
				delayId:	this.id,
				origin:		this,
				follow:		entity,
				img:		StickerList.bloodGreen.img,
				numPerSec:		10,
				fireDuration:	0.3,
				flightDuration: 0.8
			});



		});
		this.resetRecharge();
	}

	let light = this.map.getLightAt(this.x,this.y);
	if( light >= this.lightDestroys ) {
		tell( mSubject, this, 'explodes with a force you can feel in your soul. This area feels clean.' );
		this.destroy();
	}
}

CharmVarietyList.sunCrystal.onTickRound = function() {
	if( this.owner.isMap ) {
		let tile = this.map.getTileEntity(this.x,this.y);
		effectApply(this.effect,tile,this.ownerOfRecord,this,'tick');
	}
}

//
// ItemTypeList
//
ItemTypeList = Type.establish( 'ItemType', {
	typeIdUnique:	true,
	useSymbols:		true,
	defaults: {
		isItemType: true,
		mayWalk:	true,
		mayFly:		true,
		opacity:	0,
		img:		null
	},
	onRegister: itemType => {
		if( !itemType.isTreasure ) {
			return;
		}
		console.assert( Rules.ItemBag[itemType.typeId] );
		// Required to make the itemTraverse work.
		Type.giveTypeIds(itemType.materials);
		Type.giveTypeIds(itemType.varieties);
		Type.giveTypeIds(itemType.qualities);
		Object.each( itemType.varieties, variety=>{
			// The bow and others override the main weapon material lists, so these need typeIds as well.
			Type.giveTypeIds(variety.materials);
		});
		Object.each( itemType.materials, material=>{
			ResistanceList.push( material.typeId );
		});

		itemType.xPrice 		= Rules.ItemBag[itemType.typeId].xPrice;
		itemType.effectChance	= Rules.ItemBag[itemType.typeId].cEff;
	},
	onMerge: (existing,incoming) => {
		let list = ['materials','varieties','quality'];
		let result = {};
		list.forEach( field => {
			if( existing[field] && incoming[field] ) {
				result[field] = Object.assign( {}, existing[field], incoming[field] );
			}
		});
		return result;
	},
	onFinalize: (itemType,x,checker) => {
		let picker = new Picker(0);
		checker.checkLoot(itemType);
		if( itemType.ammoType ) {
			if( !itemType.ammoSpec ) {
				console.log( 'Item '+itemType.typeId+' needs an ammoSpec!' );
				debugger;
			}
			else {
				let ammoType = picker.pickItem( itemType.ammoSpec, null, false );
				if( !ammoType ) {
					console.log( 'Item '+itemType.typeId+' has illegal ammoSpec ['+itemType.ammoSpec+']' );
				}
			}
		}
//		if( itemType.typeId=='armor' ) {
//			debugger;
//		}
	}
}, ItemTypeList);

return {
	Matter: Matter,
	ItemTypeList: ItemTypeList,
	WeaponMaterialList: WeaponMaterialList,
	BowMaterialList: BowMaterialList,
	ItemSortOrder: ItemSortOrder,
	ItemFilterOrder: ItemFilterOrder,
	ItemFilterGroup: ItemFilterGroup,
	BlockType: BlockType,
}

});

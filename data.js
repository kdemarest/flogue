// STATIC DATA

// WARNING: The strings for directions MUST remain the same for commandToDirection() to work.
const Command = { NONE: "none", N:"N", NE:"NE", E:"E", SE:"SE", S:"S", SW:"SW", W:"W", NW:"NW", WAIT: "wait", 
				INVENTORY: "inventory", PICKUP: "pickup", QUAFF: "quaff", GAZE: "gaze", THROW: "throw", LOSETURN: "lose turn", PRAY: "pray",
				ATTACK: "attack", USE: "use", LOOT: "loot", DROP: "drop",
				DEBUGKILL: "debugkill", DEBUGTHRIVE: "debugthrive", DEBUGVIEW: "debugview", DEBUGANIM: "debuganim", DEBUGTEST: "debugtest",
				CAST: "cast", CAST1: "cast1", CAST2: "cast2", CAST3: "cast3", CAST4: "cast4", CAST5: "cast5", QUIT: "quit",
				EXECUTE: "execute", CANCEL: "cancel"
			};
const Direction = { N: 0, NE: 1, E: 2, SE: 3, S: 4, SW: 5, W: 6, NW: 7 };
const DirectionAdd = [
	{ x:0,  y:-1, c:Command.N },
	{ x:1,  y:-1, c:Command.NE },
	{ x:1,  y:0,  c:Command.E },
	{ x:1,  y:1,  c:Command.SE },
	{ x:0,  y:1,  c:Command.S },
	{ x:-1, y:1,  c:Command.SW },
	{ x:-1, y:0,  c:Command.W },
	{ x:-1, y:-1, c:Command.NW }
];
const DirectionCount = 8;
function commandToDirection(c) {
	return ( Direction[c] != undefined ? Direction[c] : false );
}
function directionToCommand(dir) {
	let d2c = [ Command.N, Command.NE, Command.E, Command.SE, Command.S, Command.SW, Command.W, Command.NW ];
	if( dir === false || dir < 0 || dir >= DirectionCount ) { debugger; }
	return d2c[dir];
}
function deltasToDirPredictable(dx,dy) {
	if( dy < 0 ) return dx==0 ? Direction.N : (dx<0 ? Direction.NW : Direction.NE);
	if( dy > 0 ) return dx==0 ? Direction.S : (dx<0 ? Direction.SW : Direction.SE);
	return dx==0 ? false : (dx<0 ? Direction.W : Direction.E);
} 
function deltasToDirNatural(dx,dy) {
	let ax = Math.abs(dx);
	let ay = Math.abs(dy);
	if( ax != ay ) {
		// We want to flatten our trajectory sometimes.
		if( Math.rand(0,ax+ay)<Math.max(ax,ay) ) {
			if( ax < ay ) { dx=0; } else { dy=0; }
		}
	}
	return deltasToDirPredictable(dx,dy);
}

let TILE_UNKNOWN = ' ';		// reserved so that map creation can look sane.
let SymbolToType = {};
let TypeToSymbol = {};

function fab(type,typeId,isWhat) {
	if( isWhat ) {
		type[isWhat] = true;
	}
	if( !type.namePattern ) {
		type.name = type.name || String.uncamel(typeId);
		if( type.name.charAt(1) == ' ' ) {	// hack special case to fix effect names with ePrefix format.
			type.name = type.name.substr(2);
		}
	}
	type.typeId = typeId;
	if( type.symbol ) {
		if( SymbolToType[type.symbol] ) {
			// If you get this, you have a duplicate type.symbol
			debugger;
		}
		SymbolToType[type.symbol] = type;
		TypeToSymbol[typeId] = type.symbol;
	}
	return type;
}

let FabList = [];
function toFab(t) {
	FabList.push(t);
	return t;
}

let Say = {};
DynamicViewList = {
	none: { tick: ()=>{}, render: ()=>{} }
};

const StickerList = {
	wallProxy: { img: "spells/air/static_discharge.png" },
	observerProxy: { img: "gems/Gem Type2 Yellow.png" },
	gateProxy: { img: "gems/Gem Type2 Green.png" },
	gateDownProxy: { img: "gems/Gem Type2 Purple.png" },
	unvisitedMap: { img: "gui/mapUnvisited.png" },
	invUnmarked: { img: "gui/icons/unmarked.png" },
	invMarked: { img: "gui/icons/marked.png" },
	invAll: { img: "gui/icons/all.png", icon: 'all.png' },
	oreChaff: { img: "ore/oreChaff.png", scale: 0.3, xAnchor: 0.5, yAnchor: 0.5 },
	bloodRed: { img: "dc-misc/bloodRed.png" },
	bloodGreen: { img: "dc-misc/bloodGreen.png" },
	bloodBlue: { img: "dc-misc/bloodBlue.png" },
	bloodYellow: { img: "dc-misc/bloodYellow.png" },
	bloodBlack: { img: "dc-misc/bloodBlack.png" },
	showImmunity: { img: 'gui/icons/eImmune.png' },
	showResistance: { img: 'gui/icons/eResist.png' },
	showVulnerability: { img: 'gui/icons/eVuln.png' },
	showDodge: { img: 'gui/icons/iDodge.png' },
	eGeneric: { img: "gui/icons/eGeneric.png" },
	hit: { img: "effect/bolt04.png", scale: 0.4, xAnchor: 0.5, yAnchor: 0.5 },
	invisibleObserver: { img: "spells/enchantment/invisibility.png" },
	crosshairYes: { img: "dc-misc/cursor_green.png", scale: 1.0, xAnchor: 0, yAnchor: 0 },
	crosshairNo:  { img: "dc-misc/travel_exclusion.png", scale: 1.0, xAnchor: 0, yAnchor: 0 }

}

// Probably should do this at some point.
//const Travel = { WALK: 1, FLY: 2, SWIM: 4 };
let DEFAULT_DAMAGE_BONUS_FOR_RECHARGE = 0.10;	// Should reflect that, with 5 slots used, you can do x more damage than a standard weapon
let DEFAULT_EFFECT_DURATION = 10;
let ARMOR_SCALE = 100;

const DamageType = { CUT: "cut", STAB: "stab", BITE: "bite", CLAW: "claw", BASH: "bash", BURN: "burn", FREEZE: "freeze", CORRODE: "corrode", POISON: "poison", SMITE: "smite", ROT: "rot" };
const EffectShape = { SINGLE: "single", SMALL: "small", MEDIUM: "medium", LARGE: "large" };
const ArmorDefendsAgainst = [DamageType.CUT,DamageType.STAB,DamageType.PIERCE,DamageType.BITE,DamageType.CLAW,DamageType.WHOMP];
const Attitude = { ENRAGED: "enraged", AGGRESSIVE: "aggressive", AWAIT: "await", HESITANT: "hesitant", CONFUSED: "confused", FEARFUL: "fearful", PANICKED: "panicked", WANDER: "wander", CALM: "calm", WORSHIP: "worshipping" };
const Team = { EVIL: "evil", GOOD: "good", NEUTRAL: "neutral", LUNAR: "lunar"};
const Job = { SMITH: "smith" };
const Slot = { HEAD: "head", NECK: "neck", ARMS: "arms", HANDS: "hands", FINGERS: "fingers", WAIST: "waist", HIP: "hip", FEET: "feet", ARMOR: "torso", WEAPON: "weapon", SHEILD: "shield" };
const HumanSlotLimit = { head: 1, neck: 1, arms: 1, hands: 1, fingers: 2, waist: 1, hip: 1, feet: 1, armor: 1, weapon: 1, shield: 1 };
const PickIgnore = ['mud','forceField'];
const PickVuln   = [DamageType.BURN,DamageType.FREEZE,DamageType.POISON,DamageType.SMITE,DamageType.ROT];
const PickResist = [DamageType.BURN,DamageType.FREEZE,DamageType.POISON,DamageType.SMITE,DamageType.ROT];
const PickAbsorb = [DamageType.CUT,DamageType.STAB,DamageType.BASH,DamageType.BURN,DamageType.FREEZE,DamageType.SMITE,DamageType.ROT];
const PickBlock  = [DamageType.CUT,DamageType.STAB,DamageType.BASH];

// IMMUNITY and RESISTANCE!
// Note that you can be immune to almost anything that is a string. That is, you can be immune to a DamageType,
// or an Attitude, an Effect, or even immune to the effects of 'mud' or 'forcefield' as long as their event handlers check it.

Say.damagePast = {
	"cut": "chopped",
	"stab": "pierced",
	"bite": "chewed",
	"claw": "mauled",
	"bash": "bashed up",
	"burn": "scorched",
	"freeze": "frosty",
	"corrode": "corroded",
	"poison": "poisoned",
	"smite": "smitten",
	"rot": "rotted"
};


// Effect Events
// onTargetPosition - if this effect is targeting a map tile, instead of a monster.

let EffectTypeList = toFab({
	eInert: 		{ level:  0, isInert: 1 },	// this is special, used in the picker effect proxy! Do not change!
	eWater: 		{ level:  0, rarity: 1.00, isWater: 1 },
	eBlank: 		{ level:  0, rarity: 1.00, isBlank: 1, name: 'blank paper' },
// Tactical
	eLuminari: 		{ isTac: 1, level:  null, rarity: 1.00, op: 'add', stat: 'light', value: 3, durationMod: 5.0, isPlayerOnly: 1, name: 'luminari', icon: 'gui/icons/eLuminari.png' },
//	eMap: 			{ isTac: 1, level:  null, rarity: 0.50, op: 'fillMinimap', isPlayerOnly: 1, name: 'map' },
	eGreed: 			{ isTac: 1, level:  null, rarity: 0.50, op: 'set', stat: 'senseItems', value: true, durationMod: 5.0, isPlayerOnly: 1, name: 'greed', icon: 'gui/icons/eVision.png' },
	echoloc: 		{ isTac: 1, level:  null, rarity: 0.50, op: 'set', stat: 'senseLife', value: true, durationMod: 5.0, isPlayerOnly: 1, name: 'bat sense', icon: 'gui/icons/eVision.png' },
	eSeeInvisible: 	{ isTac: 1, level:  null, rarity: 0.50, op: 'set', stat: 'senseInvisible', value: true, durationMod: 5.0, isHelp: 1, name: 'see invisible', icon: 'gui/icons/eVision.png' },
	eXray: 			{ isTac: 1, level:  null, rarity: 0.20, op: 'set', stat: 'senseXray', value: true, durationMod: 5.0, isPlayerOnly: 1, name: 'earth vision', icon: 'gui/icons/eVision.png' },
// Buff
	eFlight: 		{ isBuf: 1, level:  0, rarity: 0.20, op: 'set', stat: 'travelMode', value: 'fly', isHelp: 1, requires: e=>e.travelMode==e.baseType.travelMode,
					additionalDoneTest: (self) => { return self.target.map.tileTypeGet(self.target.x,self.target.y).mayWalk; }, icon: 'gui/icons/eFly.png' },
	eHaste: 		{ isBuf: 1, level: 10, rarity: 1.00, op: 'add', stat: 'speed', value: 1, isHelp: 1, requires: e=>e.speed<5, icon: 'gui/icons/eHaste.png' },
	eResistance: 	{ isBuf: 1, level: 20, rarity: 0.50, op: 'add', stat: 'resist',
					valuePick: () => pick(PickResist), isHelp: 1, namePattern: 'resist {value}s', icon: 'gui/icons/eResist.png' },
	eAbsorb: 		{ isBuf: 1, level:  1, rarity: 0.50, op: 'add', stat: 'resist',
					valuePick: () => pick(PickAbsorb), isHelp: 1, namePattern: 'absorb {value}s', icon: 'gui/icons/eResist.png' },
	eBlock: 		{ isBuf: 1, level:  1, rarity: 0.50, op: 'add', stat: 'resist',
					valuePick: () => pick(PickAbsorb), isHelp: 1, namePattern: 'block {value}s', icon: 'gui/icons/eResist.png' },
	eInvisibility: 	{ isBuf: 1, level: 10, rarity: 0.20, op: 'set', stat: 'invisible', value: true, isHelp: 1, requires: e=>!e.invisible, durationMod: 3.0, icon: 'gui/icons/eInvisible.png' },
	eIgnore: 		{ isBuf: 1, level:  0, rarity: 1.00, op: 'add', stat: 'immune',
					valuePick: () => pick(PickIgnore), isHelp: 1, namePattern: 'ignore {value}', icon: 'gui/icons/eImmune.png' },
// Debuff/Control
// All debuffs are reduced duration or effectiveness based on (critterLevel-potionLevel)*ratio
	eShove: 		{ isDeb: 1, level:  0, rarity: 1.00, op: 'shove', value: 3, isInstant: 1, icon: 'gui/icons/eShove.png' },
	eHesitate: 		{ isDeb: 1, level:  0, rarity: 1.00, op: 'set', stat: 'attitude', value: Attitude.HESITANT, isHarm: 1, durationMod: 0.3, icon: 'gui/icons/eAttitude.png' },
	eStartle: 		{ isDeb: 1, level:  0, rarity: 1.00, op: 'set', stat: 'attitude', value: Attitude.PANICKED, isHarm: 1, durationMod: 0.2, icon: 'gui/icons/eFear.png' },
	eVulnerability: { isDeb: 1, level: 10, rarity: 1.00, op: 'add', stat: 'vuln', requires: (e,effect)=>!e.isImmune(effect.value),
					valuePick: () => pick(PickVuln), isHarm: 1, durationMod: 2.0, namePattern: 'vulnerability to {value}', icon: 'gui/icons/eVuln.png' },
	eSlow: 			{ isDeb: 1, level: 20, rarity: 1.00, op: 'sub', stat: 'speed', value: 0.5, isHarm: 1, durationMod: 0.3, requires: e=>e.speed>0.5 },
	eBlindness: 	{ isDeb: 1, level: 30, rarity: 1.00, op: 'set', stat: 'senseBlind', value: true, isHarm: 1, durationMod: 0.25, requires: e=>!e.blind, icon: 'gui/icons/eBlind.png' },
	eConfusion: 	{ isDeb: 1, level: 40, rarity: 1.00, op: 'set', stat: 'attitude', value: Attitude.CONFUSED, isHarm: 1, durationMod: 0.3, icon: 'gui/icons/eAttitude.png' },
	ePanic: 		{ isDeb: 1, level: 50, rarity: 1.00, op: 'set', stat: 'attitude', value: Attitude.PANICKED, isHarm: 1, durationMod: 1.0, icon: 'gui/icons/eFear.png' },
	eRage: 			{ isDeb: 1, level: 60, rarity: 1.00, op: 'set', stat: 'attitude', value: Attitude.ENRAGED, isHarm: 1, durationMod: 0.5, icon: 'gui/icons/eAttitude.png' },
// Healing
	eHealing: 		{ isHel: 1, level:  0, rarity: 1.00, op: 'heal', valueDamage: 6.00, isHelp: 1, isInstant: 1, healingType: DamageType.SMITE, icon: 'gui/icons/eHeal.png' },
	eRegeneration: 	{ isHel: 1, level: 20, rarity: 1.00, op: 'add', stat: 'regenerate', value: 0.05, isHelp: 1, durationMod: 2.0, icon: 'gui/icons/eHeal.png' },
// Damage
	eFire: 			{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', valueDamage: 2.00, isHarm: 1, isInstant: 1, damageType: DamageType.BURN, mayTargetPosition: true, icon: 'gui/icons/eFire.png' },
	ePoison: 		{ isDmg: 1, level:  5, rarity: 1.00, op: 'damage', valueDamage: 2.50, isHarm: 1, isInstant: 1, damageType: DamageType.POISON, icon: 'gui/icons/ePoison.png' },
	eCold: 			{ isDmg: 1, level:  10, rarity: 1.00, op: 'damage', valueDamage: 1.60, isHarm: 1, isInstant: 1, damageType: DamageType.FREEZE, mayTargetPosition: true, icon: 'gui/icons/eCold.png' },
	eAcid: 			{ isDmg: 1, level:  15, rarity: 1.00, op: 'damage', valueDamage: 1.60, isHarm: 1, isInstant: 1, damageType: DamageType.CORRODE, icon: 'gui/icons/eCorrode.png' },
	eHoly: 			{ isDmg: 1, level:  20, rarity: 1.00, op: 'damage', valueDamage: 2.00, isHarm: 1, isInstant: 1, damageType: DamageType.SMITE, icon: 'gui/icons/eSmite.png' },
	eRot: 			{ isDmg: 1, level:  25, rarity: 1.00, op: 'damage', valueDamage: 2.00, isHarm: 1, isInstant: 1, damageType: DamageType.ROT, icon: 'gui/icons/eRot.png' },
});

EffectTypeList.eFire.onTargetPosition = function(map,x,y) {
	map.tileSymbolSet(x,y,TileTypeList.flames.symbol);
}

EffectTypeList.eCold.onTargetPosition = function(map,x,y) {
	map.tileSymbolSet(x,y,TileTypeList.water.symbol);
}

let SayStatList = {
	invisible: function(subj,obj,oldValue,newValue) {
		return [mSubject,subj,' suddenly ',mVerb,newValue?'wink':'appear',newValue?' out of sight':' from thin air','!'];
	},
	senseInvisible: function(subj,obj,oldValue,newValue) {
		return [mSubject,subj,' can see invisible things!'];
	},
	speed: function(subj,obj,oldValue,newValue) {
		return [mSubject,subj,' ',mVerb,(newValue<oldValue?'slow':'speed'),' ',(newValue<oldValue?'down':'up'),'.'];
	},
	regenerate: function(subj,obj,oldValue,newValue) {
		return [mSubject|mPossessive,subj,' body ',newValue==0 ? 'stops regenerating.' : (newValue<oldValue ? 'regenerates a bit less.' : 'begins to knit itself back together.')];
	},
	immune: function(subj,obj,oldValue,newValue) {
		return [mSubject|mPossessive,subj,' ',mVerb,'is',' ',!oldValue ? 'now immune to '+newValue : 'no longer immune to '+oldValue,'s.'];
	},
	vuln: function(subj,obj,oldValue,newValue) {
		return [mSubject,subj,' ',mVerb,'is',' ',!oldValue ? 'now vulnerable to '+newValue : 'no longer vulnerable to '+oldValue,'s.'];
	},
	resist: function(subj,obj,oldValue,newValue) {
		return [mSubject|mPossessive,subj,' ',mVerb,'is',' ',!oldValue ? 'now resistant to '+newValue+'s.' : 'no longer resistant to '+oldValue+'s.'];
	},
	travelMode: function(subj,obj,oldValue,newValue) {
		return [mSubject,subj,' ',mSubject|mVerb,'begin',' to ',newValue,'.'];
	},
	attitude: function(subj,obj,oldValue,newValue) {
		return [mSubject,subj,' ',mSubject|mVerb,'become',' ',newValue,'.'];
	},
	senseBlind: function(subj,obj,oldValue,newValue) {
		return [mSubject,subj,' ',mSubject|mVerb,newValue?'lose':'regain',' ',mSubject|mPronoun|mPossessive,subj,' sight!'];
	},
	senseXray: function(subj,obj,oldValue,newValue) {
		return [mSubject,subj,' can '+(newValue?'':'no longer')+' see through walls!'];
	},
	senseItems: function(subj,obj,oldValue,newValue) {
		return [mSubject,subj,' '+(newValue?'':'no longer '),mVerb,'sense',' treasure!'];
	},
	senseLife: function(subj,obj,oldValue,newValue) {
		return [mSubject,subj,' '+(newValue?'':'no longer '),mVerb,'sense',' creatures!'];
	},
	light: function(subj,obj,oldValue,newValue) {
		return [mSubject,subj,' '+(newValue?'':'no longer '),mVerb,'glow','.'];
	},
	_generic_: function(subj,obj,oldValue,newValue) {
		return [mSubject,subj,' ',mVerb,'is',' less enchanted.'];
	}
};

// Item Events
// onTouch - fires each round a monster is standing on a tile, and ALSO when you bonk into a non-passable tile.
//			 also fires when you WAIT or LOSE TURN upon a tile.
// onDepart - fires every single time you leave this tile, whether you're heading into another similar tile or not
//				return false to stop the movement.
// onDepartType - fires when you are leaving this tile type, like stepping out of fire or mud or water.
//				return false to stop the movement.
// onEnterType - if you are entering a tile type from another tile NOT of the same type.
//				return false to stop the movement.



const TileTypeList = {
	"floor":      { symbol: '.', mayWalk: true,  mayFly: true,  opacity: 0, name: "floor", img: "dc-dngn/floor/pebble_brown0.png", isFloor: true },
	"grass":      { symbol: ',', mayWalk: true,  mayFly: true,  opacity: 0, name: "grass", img: "dc-dngn/floor/grass/grass_flowers_blue1.png", isFloor: true },
	"wall":       { symbol: '#', mayWalk: false, mayFly: false, opacity: 1, name: "wall", img: "dc-dngn/wall/brick_brown0.png", isWall: true },
	"glass":      { symbol: '▢', mayWalk: false, mayFly: false, opacity: 0, name: "glass", img: "dc-dngn/wall/dngn_mirrored_wall.png", isWall: true },
	"pit":        { symbol: ':', mayWalk: false, mayFly: true,  opacity: 0, name: "pit", img: "dc-dngn/pit.png" },
	"shaft":      { symbol: ';', mayWalk: false, mayFly: true,  opacity: 0, name: "shaft", img: "dc-dngn/dngn_trap_shaft.png" },
	"door":       { symbol: '+', mayWalk: true,  mayFly: true,  opacity: 1, name: "locked door", isDoor: 1, img: "dc-dngn/dngn_open_door.png" },
	"lockedDoor": { symbol: '±', mayWalk: false, mayFly: false, opacity: 1, name: "door", isDoor: 1, img: "dc-dngn/dngn_closed_door.png" },
	"flames":     { symbol: 'ᵮ', mayWalk: true,  mayFly: true,  opacity: 0, name: "fames", light: 5, glow:1, damage: '1d4', damageType: DamageType.BURN, img: "dc-mon/nonliving/fire_elemental.png" },
	"water":      { symbol: '~', mayWalk: true, mayFly: true,  maySwim: true, opacity: 0, name: "water", img: "dc-dngn/water/dngn_shoals_shallow_water1.png" },
	"lava":    	  { symbol: '⍨', mayWalk: true, mayFly: true,  maySwim: true, opacity: 0, name: "lava", light: 5, glow:1, damage: '3d20', damageType: DamageType.BURN, img: "UNUSED/features/dngn_lava.png" },
	"mist":       { symbol: '░', mayWalk: true,  mayFly: true,  opacity: 0.3, name: "mist", img: "effect/cloud_grey_smoke.png", layer: 3 },
	"mud":        { symbol: '⋍', mayWalk: true,  mayFly: true,  opacity: 0, name: "mud", img: "dc-dngn/floor/dirt0.png" },
	"ghoststone": { symbol: 'J', mayWalk: false, mayFly: false, opacity: 0, name: "ghost stone", img: "dc-dngn/altars/dngn_altar_vehumet.png",
					effect: { op: 'set', stat: 'invisible', value: true } },
	"obelisk":    { symbol: 'B', mayWalk: false, mayFly: false, opacity: 0, name: "obsidian obelisk", img: "dc-dngn/altars/dngn_altar_sif_muna.png",
					effect: { op: 'set', stat: 'senseBlind', value: true } },
	"crystal":    { symbol: 'C', mayWalk: false, mayFly: false, opacity: 0, name: "shimmering crystal", glow:1, img: "dc-dngn/altars/dngn_altar_beogh.png",
					effect: { op: 'add', stat: 'speed', value: 3 } },
	"forcefield": { symbol: '|', mayWalk: true,  mayFly: true,  opacity: 1, name: "force field", light: 3, glow:1, img: "spells/air/static_discharge.png" },
	"brazier":    { symbol: 'u', mayWalk: false, mayFly: true,  opacity: 0, name: "brazier", light: 6, glow:1, img: "spells/fire/sticky_flame.png" }
};

function resolve(memberName) {
	if( typeof this[memberName] == 'function' ) {
		this[memberName] = this[memberName].apply(this,memberName);
	}
}

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
	echoloc: 		{ img: "white" },
	eLuminari: 		{ img: "white" },
	eVuln: 			{ img: "black" },
	eResistance: 	{ img: "yellow" },
	eShove: 		{ img: "black" }
};


const PotionEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['eLuminari','eGreed','echoloc','eSeeInvisible','eXray','eFlight',
	'eHaste','eResistance','eInvisibility','eIgnore','eVulnerability','eSlow','eBlindness','eConfusion','eRage','eHealing','ePanic',
	'eRegeneration','eFire','ePoison','eCold','eAcid','eHoly','eRot'].includes(k) ) );
const SpellEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['eStartle','eHesitate','eBlindness','eLuminari','eXray','echoloc',
	'eGreed','eSlow','eHealing','ePoison','eFire','eCold','eHoly','eRage','ePanic','eConfusion','eShove'].includes(k) ) );
const RingEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['inert','eRegeneration','eResistance','eGreed'].includes(k) ) );
const WeaponEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['inert','eStartle','ePoison','eFire','eCold','eBlindness','eSlow','ePanic','eConfusion','eShove'].includes(k) ) );
const ShieldEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['inert','eShove','eAbsorb','eResistance'].includes(k) ) );
const HelmEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['inert','eRegeneration', 'eResistance','eLuminari'].includes(k) ) );
const ArmorEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['inert','eRegeneration', 'eResistance'].includes(k) ) );
const BracersEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['inert','eBlock'].includes(k) ) );
const BootsEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['inert','eRegeneration', 'eIgnore', 'eFlight', 'eResistance'].includes(k) ) );
const DartEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['inert','eStartle','eHesitate','ePoison','eFire','eCold','eBlindness','eSlow','eVuln'].includes(k) ) );
const GemEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['inert','eLuminari','eGreed','echoloc','eSeeInvisible'].includes(k) ) );

const WeaponList = toFab({
	"rock":     	{ level:  0, rarity: 1.0, damageMultiplier: 0.50, damageType: DamageType.BASH, quick: 2, mayThrow: true, range: 7, attackVerb: 'strike', img: 'item/weapon/ranged/rock.png' },
	"dart":     	{ level:  0, rarity: 1.0, damageMultiplier: 0.20, damageType: DamageType.STAB, quick: 2, effectChance: 0.80, effects: DartEffects, mayThrow: true, range: 10, attackVerb: 'strike', img: 'UNUSED/spells/components/bolt.png' },
	"dagger":   	{ level:  3, rarity: 1.0, damageMultiplier: 0.70, damageType: DamageType.STAB, quick: 2, effectChance: 0.30, mayThrow: true, range: 4, attackVerb: 'strike', img: 'item/weapon/dagger.png' },
	"solKnife":   	{ level:900, rarity: 0.0001, damageMultiplier: 0.60, damageType: DamageType.CUT , quick: 2, attackVerb: 'carve', isTreasure: false, isSoulCollector: true, name: "sol knife", img: 'item/weapon/elven_dagger.png' },
	"club":   		{ level:  0, rarity: 1.0, damageMultiplier: 0.70, damageType: DamageType.BASH, quick: 1, attackVerb: 'smash', img: 'item/weapon/club.png' },
	"sword": 		{ level:  1, rarity: 1.0, damageMultiplier: 1.00, damageType: DamageType.CUT, quick: 2, img: 'item/weapon/long_sword1.png' },
	"greatsword": 	{ level:  5, rarity: 0.3, damageMultiplier: 1.20, damageType: DamageType.CUT, quick: 0, img: 'item/weapon/long_sword2.png' },
	"mace": 		{ level:  3, rarity: 1.0, damageMultiplier: 0.90, damageType: DamageType.BASH, quick: 1, img: 'item/weapon/mace1.png' },
	"hammer": 		{ level:  4, rarity: 0.4, damageMultiplier: 1.40, damageType: DamageType.BASH, quick: 0, img: 'item/weapon/hammer2.png' },
	"axe": 			{ level:  2, rarity: 0.6, damageMultiplier: 1.00, damageType: DamageType.CUT, quick: 1, mayThrow: true, range: 5, attackVerb: 'strike', img: 'item/weapon/battle_axe1.png' },
	"spear": 		{ level:  8, rarity: 0.9, damageMultiplier: 0.70, damageType: DamageType.STAB, quick: 1, reach: 2, mayThrow: true, range: 6, attackVerb: 'strike', img: 'item/weapon/spear2.png' },
	"pike": 		{ level: 12, rarity: 0.7, damageMultiplier: 0.90, damageType: DamageType.STAB, quick: 0, reach: 2, img: 'item/weapon/bardiche1.png' },
	"pitchfork": 	{ level: 20, rarity: 0.5, damageMultiplier: 1.20, damageType: DamageType.STAB, quick: 0, reach: 2, mayThrow: true, range: 4, img: 'item/weapon/trident1.png' },
});

const WeaponMaterialList = toFab({
	"iron": 		{ level:  0 /* very important this be zero!*/, toMake: 'iron ingot'},
	"silver": 		{ level:  5, toMake: 'silver ingot' },
	"ice": 			{ level: 10, toMake: 'ice block' },
	"glass": 		{ level: 20, toMake: 'malachite' },
	"lunarium": 	{ level: 30, toMake: 'lunarium ingot' },
	"solarium": 	{ level: 40, toMake: 'solarium ingot' },
	"deepium": 		{ level: 50, toMake: 'deepium ingot' },
});

const ShieldList = toFab({
	"buckler":     	{ level:  0, rarity: 1.0 },
	"targe":     	{ level:  5, rarity: 1.0 },
	"heater":     	{ level: 10, rarity: 1.0 },
	"kite":     	{ level: 15, rarity: 1.0 },
	"pavise":     	{ level: 20, rarity: 1.0 },
});

const ArmorList = toFab({
	"fur": 			{ level:  0, rarity: 1.0, armorMultiplier: 0.50, ingredientId: 'leather' },
	"hide": 		{ level:  1, rarity: 1.0, armorMultiplier: 0.80, ingredientId: 'leather' },
	"leather": 		{ level:  2, rarity: 1.0, armorMultiplier: 0.85, ingredientId: 'leather' },
	"studded": 		{ level:  3, rarity: 1.0, armorMultiplier: 0.90, ingredientId: 'iron ingot' },
	"scale": 		{ level:  4, rarity: 1.0, armorMultiplier: 0.95, ingredientId: 'iron ingot' },
	"chain": 		{ level: 10, rarity: 1.0, armorMultiplier: 1.00, ingredientId: 'iron ingot' },
	"steelPlate": 	{ level: 15, rarity: 1.0, armorMultiplier: 1.00, ingredientId: 'iron ingot' },
	"trollHideArmor": 	{ level: 20, rarity: 1.0, armorMultiplier: 1.20, ingredientId: 'troll hide' },
	"chitin": 		{ level: 25, rarity: 1.0, armorMultiplier: 1.00, ingredientId: 'chitin' },
	"elven": 		{ level: 30, rarity: 1.0, armorMultiplier: 1.30, ingredientId: 'chitin' },
	"dwarven": 		{ level: 35, rarity: 1.0, armorMultiplier: 1.10, ingredientId: 'chitin' },
	"ice": 			{ level: 40, rarity: 1.0, armorMultiplier: 1.00, ingredientId: 'ice block' },
	"glass": 		{ level: 45, rarity: 1.0, armorMultiplier: 1.00, ingredientId: 'malachite' },
	"demon": 		{ level: 50, rarity: 1.0, armorMultiplier: 1.00, ingredientId: 'malachite' },
	"lunar": 		{ level: 55, rarity: 1.0, armorMultiplier: 1.00, ingredientId: 'lunarium ingot' },
	"solar": 		{ level: 60, rarity: 1.0, armorMultiplier: 1.00, ingredientId: 'solarium ingot' },
	"deep": 		{ level: 65, rarity: 1.0, armorMultiplier: 1.00, ingredientId: 'deepium ingot' },
});

const GloveList = toFab({
	"furGloves": 		{ level:  0, rarity: 1.0 },
	"leatherGloves": 	{ level:  1, rarity: 1.0 },
	"trollHideGloves": 	{ level:  2, rarity: 1.0, name: 'troll hide gloves',
							effect: { op: 'add', stat: 'immune', value: 'frogSpine' } },
	"studdedGloves": 	{ level:  3, rarity: 1.0 },
	"scale": 			{ level:  4, rarity: 1.0 },
	"chain": 			{ level: 10, rarity: 1.0 }
});



const OreVeinList = toFab({
	"oreNone": 			{ level:  0, rarity: 10.00, name: "ore vein", img: 'oreVein' },
	"oreVeinCoal": 		{ level:  1, rarity:  1.0, name: "coal vein", mineId: 'coal', img: 'oreLumpBlack' },
	"oreVeinTin": 		{ level:  2, rarity:  1.0, name: "tin ore vein", mineId: 'oreTin', img: 'oreMetalWhite' },
	"oreVeinIron": 		{ level:  5, rarity:  0.8, name: "iron ore vein", mineId: 'oreIron', img: 'oreMetalBlack' },
	"oreVeinCopper": 	{ level: 10, rarity:  0.6, name: "copper ore vein", mineId: 'oreCopper', img: 'oreMetalOrange' },
	"oreVeinSilver": 	{ level: 15, rarity:  0.5, name: "silver ore vein", mineId: 'oreSilver', img: 'oreMetalWhite' },
	"oreVeinGold": 		{ level: 20, rarity:  0.3, name: "gold ore vein", mineId: 'oreGold', img: 'oreMetalYellow' },
	"oreVeinMalachite": { level: 25, rarity:  0.3, name: "malachite ore vein", mineId: 'oreMalachite', img: 'oreMetalBlue' },
	"oreVeinLunarium": 	{ level:  1, rarity:  0.2, name: "lunarium ore vein", mineId: 'oreLunarium', img: 'oreGemCyan' },
	"oreVeinSolarium": 	{ level:  1, rarity:  0.2, name: "solarium ore vein", mineId: 'oreSolarium', img: 'oreGemYellow' },
	"oreVeinDeepium": 	{ level: 40, rarity:  0.1, name: "deepium ore vein", mineId: "oreDeepium", img: 'oreGemBlack' },
	"oreVeinGarnet": 	{ level:  1, rarity:  0.3, name: "garnet ore vein", mineId: "gem.garnet", img: 'oreGemPurple', isGemOre: true },
	"oreVeinOpal": 		{ level:  5, rarity:  0.3, name: "opal ore vein", mineId: "gem.opal", img: 'oreGemWhite', isGemOre: true },
	"oreVeinRuby": 		{ level: 10, rarity:  0.2, name: "ruby ore vein", mineId: "gem.ruby", img: 'oreGemRed', isGemOre: true },
	"oreVeinEmerald": 	{ level: 15, rarity:  0.2, name: "emerald ore vein", mineId: "gem.emerald", img: 'oreGemGreen', isGemOre: true },
	"oreVeinSapphire": 	{ level: 20, rarity:  0.2, name: "sapphire ore vein", mineId: "gem.sapphire", img: 'oreGemBlue', isGemOre: true },
	"oreVeinDiamond": 	{ level: 55, rarity:  0.1, name: "diamond ore vein", mineId: "gem.diamond", img: 'oreGemWhite', isGemOre: true }
});


const OreList = toFab({
	"coal": 		{ level:  0, rarity: 1.0, name: "coal", img: 'oreLumpBlack', scale: 0.5, isFuel: true },
	"oreTin": 		{ level:  2, rarity: 1.0, name: "tin ore", refinesTo: "ingotTin", img: 'oreMetalWhite', scale: 0.5 },
	"oreIron": 		{ level:  5, rarity: 0.8, name: "iron ore", refinesTo: "ingotIron", img: 'oreMetalBlack', scale: 0.5 },
	"oreCopper": 	{ level: 10, rarity: 0.6, name: "copper ore", refinesTo: "ingotCopper", img: 'oreMetalOrange', scale: 0.5 },
	"oreSilver": 	{ level: 15, rarity: 0.5, name: "silver ore", refinesTo: "ingotSilver", img: 'oreMetalWhite', scale: 0.5 },
	"oreGold": 		{ level: 20, rarity: 0.3, name: "gold ore", refinesTo: "ingotGold", img: 'oreMetalYellow', scale: 0.5 },
	"oreMalachite": { level: 25, rarity: 0.3, name: "malachite ore", refinesTo: "ingotMalachite", img: 'oreMetalBlue', scale: 0.5 },
	"oreLunarium": 	{ level: 30, rarity: 0.2, name: "lunarium ore", refinesTo: "ingotLunarium", img: 'oreGemCyan', scale: 0.5 },
	"oreSolarium": 	{ level: 35, rarity: 0.1, name: "solarium ore", refinesTo: "ingotSolarium", img: 'oreGemYellow', scale: 0.5 },
	"oreDeepium": 	{ level: 40, rarity: 0.1, name: "deepium ore", refinesTo: "ingotDeepium", img: 'oreGemBlack', scale: 0.5 },
});

const GemQualityList = toFab({
	"flawed": 		{ level:  0, rarity: 1.0, priceMultiplier: 0.5 },
	"average": 		{ level: 10, rarity: 0.8, priceMultiplier: 0.7 },
	"large": 		{ level: 20, rarity: 0.6, priceMultiplier: 0.9 },
	"flawless": 	{ level: 30, rarity: 0.4, priceMultiplier: 1.2 },
	"sublime": 		{ level: 50, rarity: 0.2, priceMultiplier: 1.5 }
});

const GemList = toFab({
	"garnet": 		{ level:  0, rarity:  0.3, intrinsicEffect: "eHealing", img: "Gem Type1 Red", xAnchor: -0.5, yAnchor: -0.5 },
	"opal": 		{ level:  5, rarity:  0.3, intrinsicEffect: "eFlight", img: "Gem Type1 Yellow", xAnchor: -0.5, yAnchor: -0.5 },
	"ruby": 		{ level: 10, rarity:  0.2, intrinsicEffect: "eFire", img: "Gem Type2 Red", xAnchor: -0.5, yAnchor: -0.5 },
	"emerald": 		{ level: 15, rarity:  0.2, intrinsicEffect: "ePoison", img: "Gem Type2 Green", xAnchor: -0.5, yAnchor: -0.5 },
	"sapphire": 	{ level: 20, rarity:  0.2, intrinsicEffect: "eCold", img: "Gem Type2 Blue", xAnchor: -0.5, yAnchor: -0.5 },
	"diamond": 		{ level: 25, rarity:  0.1, intrinsicEffect: "eInvisibility", img: "Gem Type3 Black", xAnchor: -0.5, yAnchor: -0.5 },
});

const StuffList = toFab({
	"lantern": 			{ slot: Slot.HIP, light: 14, triggerOnUse: true, effect: { op: 'set', stat: 'light', value: 14, name: 'light' }, useVerb: 'clip on', img: "item/misc/misc_lamp.png" },
	"oilLamp": 			{ slot: Slot.HIP, light: 10, triggerOnUse: true, effect: { op: 'set', stat: 'light', value: 10, name: 'light' }, useVerb: 'clip on', img: "item/misc/misc_lamp.png" },
	"candleLamp": 		{ slot: Slot.HIP, light:  6, triggerOnUse: true, effect: { op: 'set', stat: 'light', value:  6, name: 'light' }, useVerb: 'clip on', img: "item/misc/misc_lamp.png" },
	"trollHide": 		{ },
	"bones": 			{ },
	"antGrubMush": 		{ },
	"viperVenom": 		{ },
	"bones": 			{ },
	"dogCollar": 		{ },
	"skull": 			{ },
	"mushroomBread": 	{ },
	"demonScale": 		{ },
	"demonEye": 		{ },
	"ghoulFlesh": 		{ },
	"pinchOfEarth": 	{ },
	"impBrain": 		{ },
	"ogreDrool": 		{ },
	"redOozeSlime": 	{ },
	"scarabCarapace": 	{ },
	"darkEssence": 		{ },
	"facetedEye": 		{ },
	"trollBlood": 		{ },
	"lunarEssence": 	{ },
	"batWing": 			{ },
	"frogSpine": 		{ },
	"wool": 			{ },
	"ingotIron": 		{ },
	"ingotCopper": 		{ },
	"ingotSilver": 		{ },
	"ingotGold": 		{ },
	"ingotTin": 		{ },
	"ingotMalachite": 	{ },
	"ingotLunarium": 	{ },
	"ingotSolarium": 	{ },
	"ingotDeepium": 	{ },

});



/* RING IMG NAMES
	"agate"
	"brass"
	"bronze"
	"clay"
	"copper"
	"coral"
	"diamond"
	"emerald"
	"glass"
	"gold"
	"granite"
	"iron"
	"ivory"
	"jade"
	"silver"
	"steel"
	"wooden"
*/


const RingMaterialList = toFab({
	"brass": 	{ level: 0, img: 'brass' },
	"copper": 	{ level: 1, img: 'bronze' },
	"silver": 	{ level: 3, img: 'silver' },
	"gold": 	{ level: 7, img: 'gold' }
});

const RingList = {
	"garnetSetting": 	{ level:  0, rarity:  0.3, name: 'garnet' },
	"opalSetting": 		{ level:  5, rarity:  0.3, name: 'opal' },
	"rubySetting": 		{ level: 10, rarity:  0.2, name: 'ruby' },
	"emeraldSetting": 	{ level: 15, rarity:  0.2, name: 'emerald' },
	"sapphireSetting": 	{ level: 20, rarity:  0.2, name: 'sapphire' },
	"diamondSetting": 	{ level: 25, rarity:  0.1, name: 'diamond' }
};

const NulImg = { img: '' };

// Item Events
// onPickup - fired just before an item is picked up. Return false to disallow the pickup.
// onTick - fires each time a full turn has passed, for every item, whether in the world or in an inventory. 
const CommandLeavesInventoryOpen = [Command.USE,Command.LOOT];
const CommandIsInstant = [Command.USE];

let Tweak = {
	lootFrequency: 0.70,
	effectChance: 1.0
};

const ARMOR_EFFECT_CHANCE_TO_FIRE = 10;
const ARMOR_EFFECT_OP_ALWAYS = ['damage'];
const ARMOR_EFFECT_DAMAGE_PERCENT = 10;

const WEAPON_EFFECT_CHANCE_TO_FIRE = 10;
const WEAPON_EFFECT_OP_ALWAYS = ['damage'];
const WEAPON_EFFECT_DAMAGE_PERCENT = 10;

const ItemTypeList = {
	"random":	{ symbol: '*', isRandom: 1, mayPickup: false, neverPick: true },
// GATEWAYS
	"stairsDown": { symbol: '>', name: "stairs down", rarity: 1, gateDir: 1, gateInverse: 'stairsUp', mayPickup: false, useVerb: 'descend', img: "dc-dngn/gateways/stone_stairs_down.png" },
	"stairsUp":   { symbol: '<', name: "stairs up", rarity: 1, gateDir: -1, gateInverse: 'stairsDown', mayPickup: false, useVerb: 'ascend', img: "dc-dngn/gateways/stone_stairs_up.png" },
	"gateway":    { symbol: 'y', name: "gateway", rarity: 1, gateDir: 0, gateInverse: 'gateway', mayPickup: false, useVerb: 'enter', img: "dc-dngn/gateways/dngn_enter_dis.png" },
	"portal":     { symbol: 'Ώ', name: "portal", rarity: 1, gateDir: 0, gateInverse: 'portal', mayPickup: false, useVerb: 'touch', img: "dc-dngn/gateways/dngn_portal.png" },
// DECOR
	"columnBroken": { symbol: 'O', mayWalk: false, mayFly: false, rarity: 1, name: "broken column", isDecor: true, img: "dc-dngn/crumbled_column.png" },
	"columnStump":  { symbol: 'o', mayWalk: false, mayFly: true, rarity: 1, name: "column stump", isDecor: true, img: "dc-dngn/granite_stump.png" },

	"altar":    { symbol: 'A', mayWalk: false, mayFly: false, rarity: 1, name: "golden altar", mayPickup: false, light: 4, glow:true,
				isDecor: true, rechargeTime: 12, healMultiplier: 3.0,
				effect: { op: 'heal', valueDamage: 6.00, healingType: DamageType.SMITE, icon: 'gui/icons/eHeal.png' },
				img: "dc-dngn/altars/dngn_altar_shining_one.png" },
	"fountain": { symbol: 'F', mayWalk: false, mayFly: true, rarity: 1, name: "fountain", mayPickup: false,
				isDecor: true, img: "dc-dngn/dngn_blue_fountain.png" },
// ORE VEINS
	"oreVein":    { symbol: 'x', mayWalk: false, mayFly: false, rarity: 1, opacity: 1, name: "ore vein", isWall: true,
				  imgGet: (self,img) => "ore/"+(img || self.variety.img || "oreVein")+".png", imgChoices: OreVeinList,
				  varieties: OreVeinList, mineSwings: 3 },
// CORPSE
	"corpse":   { symbol: 'X', namePattern: "remains of a {mannerOfDeath} {usedToBe}", rarity: 1, isCorpse: true,
				img: 'UNUSED/spells/components/skull.png', icon: "corpse.png" },
// TREASURE
	"coin": 	{ symbol: '$', namePattern: '{goldCount} gold', goldCount: 0, goldVariance: 0.30, isGold: true,
				isTreasure: 1, img: "item/misc/gold_pile.png", icon: 'coin.png' },
	"potion":   { symbol: '¡', isTreasure: 1, namePattern: 'potion{?effect}', charges: 1, light: 3, glow: true, attackVerb: 'splash',
				effectChance: 1.0, isPotion: true,
				effects: PotionEffects, mayThrow: true, destroyOnLastCharge: true,
				imgGet: (self,img)=>"item/potion/"+(img || (ImgPotion[self.effect?self.effect.typeId:'']||NulImg).img || "emerald")+".png", imgChoices: ImgPotion, icon: 'potion.png' },
	"spell":    { symbol: 'ᵴ', isTreasure: 1, namePattern: 'spell{?effect}', rechargeTime: 10, effects: SpellEffects,
				effectChance: 1.0, isSpell: true,
				img: "item/scroll/scroll.png", icon: 'spell.png' },
	"ore": 		{ symbol: '"', isTreasure: 1, namePattern: '{variety}', varieties: OreList, isOre: true,
				imgGet: (self,img) => "ore/"+(img || self.variety.img || "ore")+".png", imgChoices: OreList, icon: 'ore.png' },
	"gem": 		{ symbol: "^", isTreasure: 1, namePattern: '{quality} {variety}{?effect}', qualities: GemQualityList, varieties: GemList, effects: GemEffects, isGem: true,
				effectChance: 0.20, mayThrow: 1, mayTargetPosition: 1, autoCommand: Command.USE,
				imgGet: (self,img) => "gems/"+(img || self.variety.img || "Gem Type2 Black")+".png", imgChoices: GemList, scale:0.3, xAnchor: -0.5, yAnchor: -0.5, icon: 'gem.png' },
	"weapon": 	{ symbol: '†', isTreasure: 1, namePattern: '{material} {variety} {?effect}', materials: WeaponMaterialList, varieties: WeaponList, effects: WeaponEffects, slot: Slot.WEAPON, isWeapon: true,
				useVerb: 'weild', mayTargetPosition: true,
				effectChance: 0.05,
				img: "item/weapon/dagger.png", icon: 'weapon.png' },
	"shield": 	{ symbol: '}', isTreasure: 1, namePattern: "{variety} shield{?effect}", varieties: ShieldList, effects: ShieldEffects, slot: Slot.SHIELD, isShield: true,
				effectChance: 0.10,
				useVerb: 'hold', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "item/armour/shields/shield3_round.png", icon: 'shield.png' },
	"helm": 	{ symbol: '[', isTreasure: 1, namePattern: "{variety} helm{?effect}", varieties: ArmorList, effects: HelmEffects, slot: Slot.HEAD, isHelm: true, isArmor: true,
				effectChance: 0.05,
				armorMultiplier: 0.15,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "item/armour/headgear/helmet2_etched.png", icon: 'helm.png' },
	"armor": 	{ symbol: '&', isTreasure: 1, namePattern: "{variety} armor{?effect}", varieties: ArmorList, effects: ArmorEffects, slot: Slot.ARMOR, isArmor: true,
				effectChance: 0.05,
				armorMultiplier: 0.60,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "player/body/armor_mummy.png", icon: 'armor.png' },
	"bracers": 	{ symbol: ']', isTreasure: 1, namePattern: "{variety} bracers{?effect}", varieties: ArmorList, effects: BracersEffects, slot: Slot.ARMS, isBracers: true, isArmor: true,
				effectChance: 0.05,
				armorMultiplier: 0.15,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "UNUSED/armour/gauntlet1.png", icon: 'gauntlets.png' },
	"boots": 	{ symbol: 'b', isTreasure: 1, namePattern: "{variety} boots{?effect}", varieties: ArmorList, slot: Slot.FEET, isBoots: true, isArmor: true, effects: BootsEffects,
				effectChance: 0.05,
				armorMultiplier: 0.10,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "item/armour/boots2_jackboots.png", icon: 'boots.png' },
	"gloves": 	{ symbol: '{', isTreasure: 1, namePattern: "{variety}", varieties: GloveList, slot: Slot.HANDS, isGloves: true,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "UNUSED/armour/glove4.png", icon: 'gauntlets.png' },
	"ring": 	{ symbol: '=', isTreasure: 1, namePattern: "{material} {variety} ring{?effect}", materials: RingMaterialList, varieties: RingList,
				effects: RingEffects, slot: Slot.FINGERS, isRing: true,
				effectChance: 0.10,
				useVerb: 'wear', triggerOnUse: true, effectOverride: { duration: true },
				imgGet: (self,img) => "item/ring/"+(img || self.material.img || 'gold')+".png", imgChoices: RingMaterialList, icon: 'ring.png' },
// INGREDIENTS
	"stuff": 	{ symbol: '%', isTreasure: 1, namePattern: "{variety}{?effect}", varieties: StuffList,
				imgGet: (self,img) => (img || (self?self.variety.img:'') || 'item/misc/misc_rune.png'), imgChoices: StuffList, icon: 'stuff.png' },

};
const ItemSortOrder = ['weapon','helm','armor','bracers','gloves','boots','ring','potion','gem','ore','spell','stuff'];

// ItemBag is the top level item probability and price manager.
// gen = the chance to generate the item. Themes can tweak this number
// eff = the change that the generated item has an effect of some kind. Rises by (map.depth*0.30)
// price = how much you have to pay to buy this thing. Multiplied by the level of the variety/material/quality
// basis = how you calculate the value and rarity
let ItemBag = (function() {
	let raw = {
		// 			cGen 	cEff	price	basis
		coin: 	[	35.0, 	  0.0,	  1.0,	[], ],
		potion: [	10.0, 	100.0,	 10.0,	['effect'], ],
		spell: 	[	 1.0, 	100.0,	 50.0,	['effect'], ],
		ore: 	[	 5.0, 	  0.0,	  1.0,	['variety'], ],
		gem: 	[	 4.0,	 20.0,	 20.0,	['material','quality','effect'], ],
		weapon: [	15.0, 	  5.0,	 40.0,	['material','effect','variety'], ],
		helm: 	[	 2.5, 	  5.0,	 30.0,	['variety','effect'], ],
		armor: 	[	 7.0, 	  5.0,	 30.0,	['variety','effect'], ],
		bracers:[	 2.0, 	  5.0,	 30.0,	['variety','effect'], ],
		gloves: [	 0.5, 	  5.0,	 30.0,	['variety','effect'], ],
		boots: 	[	 2.0, 	  5.0,	 30.0,	['variety','effect'], ],
		ring: 	[	 1.0, 	 10.0,	 90.0,	['material','effect'], ],
		stuff: 	[	15.0, 	  0.0,	  4.0,	['variety'], ]
	};
	return Object.convert(raw,(row,key) => { let a={}; a[key] = { cGen: row[0], cEff: row[1], price: row[2], basis: row[3] }; return a; });
})();

const Brain = { AI: "ai", USER: "user" };

const MonsterTypeDefaults = {
					level: 0, power: '3:10', team: Team.EVIL, damageType: DamageType.CUT, img: "dc-mon/acid_blob.png", pronoun: 'it',
					attitude: Attitude.AGGRESSIVE,
					light: 0,
					senseBlind: false, senseXray: false, senseItems: false, senseLife: false,
					invisible: false, senseInvisible: false, sightDistance: 6,
					brain: Brain.AI, brainFlee: false, brainOpensDoors: false, brainTalk: false,
					corpse: 'corpse',
					immune: '', resist: '', vuln: '',
					loseTurn: false,
					packAnimal: false,
					personalEnemy: '',
					picksUp: false,
					reach: 1,
					regenerate: 0,
					speed: 1,
					travelMode: 'walk', mayWalk: false, mayFly: false,
					type: null, typeId: null,

					//debug only
					observeDistantEvents: false
				};

let MaxSightDistance = 10;
let LightAlpha = [];
for( let i=0 ; i<MaxSightDistance+20 ; ++i ) {
	LightAlpha[i] = Math.clamp(i/MaxSightDistance,0.0,1.0);
}


// Monster Events
// onAttacked - fired when the monster gets attacked, even if damage nets to zero.
// onAttack - fires when ever the monster attacks, so you can pile on extra effects.
// onTouch - fires if somebody steps into you but doesn't attack you. Like when confused.
// onHeal - fires when you get healing. return true to suppress the auto-generated message about healing.

let UndeadImmunity = [DamageType.FREEZE,DamageType.ROT,DamageType.POISON,Attitude.PANICKED,Attitude.ENRAGED,Attitude.CONFUSED,'blind'].join(',');
let SkeletonImmunity = UndeadImmunity+[DamageType.CUT,DamageType.STAB].join(',');
let UndeadResistance = [DamageType.CUT,DamageType.STAB].join(',');
let UndeadVulnerability = ['silver',DamageType.SMITE,DamageType.BURN].join(',');
let ShadowImmunity = [DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.BASH,DamageType.BURN,DamageType.FREEZE,DamageType.CORRODE,DamageType.POISON,DamageType.ROT].join(',');

let OozeImmunity = ['blind',DamageType.CORRODE,DamageType.STAB,DamageType.BASH,DamageType.POISON,Attitude.PANICKED].join(',');
let OozeResistance = [DamageType.CUT,Attitude.ENRAGED,Attitude.CONFUSED].join(',');
let OozeVulnerability = ['ice','glass',DamageType.BURN,DamageType.FREEZE].join(',');

let LunarVulnerabilities = ['solarium',DamageType.BURN].join(',');


let DemonImmunity = [DamageType.BURN].join(',');
let DemonResistance = ['deepium',DamageType.POISON,DamageType.STAB].join(',');
let DemonVulnerability = ['ice','solarium',DamageType.SMITE,DamageType.FREEZE].join(',');
const MonsterTypeList = {

// GOOD TEAM
	"player": {
		core: [ '@', 1, '3:10', 'good', 'cut', 'player.png', 'he' ],
		attitude: Attitude.CALM,
		brain: Brain.USER,
		brainOpensDoors: true,
		brainTalk: true,
		inventoryLoot: '',
		inventoryWear: '',
		isSunChild: true,
		light: 4,
		neverPick: true,
		picksup: true,
		regenerate: 0.01,
		sightDistance: MaxSightDistance
	},
	"dog": {
		core: [ 'd', 1, '10:10', 'good', 'bite', 'UNUSED/spells/components/dog2.png', '*' ],
		name: "Fido/Lucy",
		brainFlee: true,
		brainPet: true,
		dodge: 1,
		isAnimal: true,
		isPet: true,
		loot: '30% dogCollar',
		properNoun: true,
		packAnimal: true,
		regenerate: 0.03
	},
	"dwarf": {
		core: [ 'R', 1, '3:10', 'good', 'bash', 'dc-mon/dwarf.png', '*' ],
		name: "Fili",
		job: Job.SMITH,
		brainFlee: true,
		isSunChid: true,
		isDwarf: true,
		inventoryLoot: '', //'30x 100% stuff',
		properNoun: true,
		packAnimal: true
	},
	"mastiff": {
		core: [ 'm', 10, '10:10', 'good', 'bite', 'UNUSED/spells/components/dog2.png', '*' ],
		name: "Rover/Fluffy",
		dodge: 1,
		brainFlee: true,
		brainPet: true,
		isAnimal: true,
		isPet: true,
		loot: '30% dogCollar',
		properNoun: true,
		packAnimal: true,
		regenerate: 0.03
	},
	"human": {
		core: [ 'H', 1, '3:10', 'good', 'cut', 'dc-mon/human.png', '*' ],
		attitude: Attitude.CALM,
		brainAlertFriends: true,
		brainTalk: true,
		brainOpensDoors: true,
		isSunChild: true,
		loot: '30% mushroomBread, 30% coin, 10% potion.eHealing',
	},
	"philanthropist": {
		core: [ 'P', 1, '3:10', 'good', 'cut', 'dc-mon/philanthropist.png', '*' ],
		attitude: Attitude.CALM,
		brainAlertFriends: true,
		brainTalk: true,
		brainOpensDoors: true,
		isSunChild: true,
		loot: '30% mushroomBread, 50% coin, 10% potion.eHealing',
		sayPrayer: 'Get in line! Come to the left window for donations!'
	},
	"refugee": {
		core: [ 'p', 1, '2:20', 'good', 'bash', 'dc-mon/refugee.png', '*' ],
		attitude: Attitude.FEARFUL,
		brainAlertFriends: true,
		brainTalk: true,
		brainOpensDoors: true,
		isSunChild: true,
		loot: '10% bones, 5% dogCollar, 3x 10% stuff',
		sayPrayer: "Oh god... What I wouldn't give for a steak."
	},

// EVIL TEAM
	"Avatar of Balgur": {
		core: [ 'a', 30, '25:2', 'evil', 'burn', 'dc-mon/hell_knight.png', 'he' ],
		isUnique: true, neverPick: true,
		brainAlertFriends: true,
		brainTalk: true,
		immune: [DamageType.BURN,Attitude.PANICKED].join(','),
		isDemon: true,
		sayPrayer: 'I shall rule this planet!',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"demon": {
		core: [ 'D', 5, '3:5', 'evil', 'burn', 'player/base/draconian_red_f.png', 'it' ],
		brainAlertFriends: true,
		brainTalk: true,
		immune: DemonImmunity,
		isDemon: true,
		loot: '30% coin, 50% potion.eFire, 30% demonScale, 20% pitchfork, 30% demonEye',
		packAnimal: true,
		resist: DemonResistance,
		sayPrayer: 'Hail Balgur, ruler of the deep!',
		vuln: DemonVulnerability,
	},
	"ethermite": {
		core: [ 'e', 10, '3:20', 'evil', 'bite', 'dc-mon/shining_eye.png', '*' ],
		dodge: 1,
		glow: true,
		invisible: true,
		isPlanar: 1,
		light: 6,
		loot: '50% gem.eSeeInvisible, 30% gem, 20% gem',
		packAnimal: true,
		sneakAttackMult: 3,
		vuln: 'glass'
	},
	"ghoul": {
		core: [ 'G', 4, '1:2', 'evil', 'rot', 'dc-mon/undead/ghoul.png', 'it' ],
		immune: UndeadImmunity,
		dark: 2,
		isUndead: true,
		loot: '30% coin, 20% potion.eRot, 50% ghoulFlesh',
		senseLife: true,
		resist: UndeadResistance,
		vuln: UndeadVulnerability
	},
	"goblin": {
		core: [ 'g', 1, '3:10', 'evil', 'cut', 'dc-mon/goblin.png', '*' ],
		brainAlertFriends: true,
		brainTalk: true,
		isGoblin: true,
		isEarthChild: true,
		loot: '50% coin, 20% weapon.sword, 20% weapon.club, 20% any, 30% pinchOfEarth',
		packAnimal: true,
		sayPrayer: 'Oh mighty Thagzog...'
	},
	"goblinWar": { 
		core: [ 'W', 12, '3:8', 'evil', 'cut', 'dc-mon/goblin.png', '*' ],
		name: 'goblin warrior',
		brainAlertFriends: true,
		brainTalk: true,
		isGoblin: true,
		isEarthChild: true,
		loot: '50% coin, 80% weapon.sword, 20% weapon.club, 30% pinchOfEarth',
		sayPrayer: 'Oh warrior Thagzog...'
	},
	"goblinMut": {
		core: [ 'I', 22, '3:8', 'evil', 'cut', 'dc-mon/goblin.png', '*' ],
		name: 'goblin mutant',
		brainAlertFriends: true,
		brainTalk: true,
		isGoblin: true,
		isEarthChild: true,
		loot: '50% coin, 80% weapon.mace, 30% pinchOfEarth',
		sayPrayer: 'Oh mutant Thagzog...'
	},
	"imp": {
		core: [ 'i', 7, '3:10', 'evil', 'claw', 'dc-mon/demons/imp.png', 'it' ],
		attitude: Attitude.HESITANT,
		dodge: 1,
		glow: 1,
		immune: DamageType.BURN,
		isDemon: true,
		loot: '30% potion.eFire, 30% impBrain',
		senseInvisible: true,
		travelMode: "fly",
		vuln: DemonVulnerability
	},
	"kobold": {
		core: [ 'k', 1, '4:20', 'evil', 'cut', 'dc-mon/kobold.png', '*' ],
		attitude: Attitude.HESITANT,
		brainAlertFriends: true,
		brainTalk: true,
		dodge: 1,
		isEarthChild: true,
		loot: '50% coin, 50% weapon.dart, 30% weapon.dagger, 30% dogCollar',
		packAnimal: true
	},
	"ogreKid": { 
		core: [ 'Ǿ', 2, '10:10', 'evil', 'bash', 'dc-mon/ogre.png', '*' ],
		name: "ogre child",
		brainTalk: true, 
		isEarthChild: true,
		loot: '50% weapon.club, 20% ogreDrool',
		resist: DamageType.CUT,
		speed: 0.75
	},
	"ogre": {
		core: [ 'Ȱ', 10, '10:10', 'evil', 'bash', 'dc-mon/ogre.png', '*' ],
		brainTalk: true,
		isEarthChild: true,
		loot: '90% coin, 90% coin, 90% coin, 50% weapon.club, 20% ogreDrool',
		resist: [DamageType.CUT,DamageType.STAB].join(','),
		speed: 0.5
	},
	"redOoze": {
		core: [ 'z', 1, '2:3', 'evil', 'corrode', 'dc-mon/jelly.png', 'it' ],
		name: "red ooze",
		glow: 4,
		immune: OozeImmunity,
		isPlanar: true,
		loot: '90% potion.eCorrode, 40% redOozeSlime',
		regenerate: 0.15,
		resist: OozeResistance,
		speed: 0.75,
		vuln: OozeVulnerability
	},
	"blueScarab": {
		core: [ 'q', 6, '2:30', 'evil', 'freeze', 'dc-mon/animals/boulder_beetle.png', 'it' ],
		namePattern: "blue scarab",
		glow: 3,
		immune: DamageType.FREEZE,
		isPlanar: true,
		loot: '30% gem, 50% scarabCarapace',
		travelMode: "fly",
		vuln: 'glass,'+DamageType.BURN
	},
	"redScarab": {
		core: [ 'h', 12, '2:30', 'evil', 'burn', 'dc-mon/animals/boulder_beetle.png', 'it' ],
		namePattern: "red scarab",
		glow: 3,
		immune: DamageType.BURN,
		isPlanar: true,
		loot: '30% gem, 50% scarabCarapace',
		travelMode: "fly",
		vuln: 'glass,'+DamageType.FREEZE
	},
	"shadow": {
		core: [ 'w', 8, '1:12', 'evil', 'rot', 'dc-mon/undead/shadow.png', 'it' ],
		dark: 12,
		immune: ShadowImmunity,
		isUndead: true,
		loot: '50% darkEssence, 20% potion.eBlindness',
		speed: 0.75,
		vuln: ['silver',DamageType.SMITE].join(',')
	},
	"skeleton": {
		core: [ 's', 3, '2:10', 'evil', 'claw', 'dc-mon/undead/skeletons/skeleton_humanoid_small.png', 'it' ],
		immune: SkeletonImmunity,
		isUndead: true,
		loot: '50% bones, 50% skull',
		vuln: 'silver'+','+DamageType.SMITE
	},
	"skeletonLg": {
		core: [ 'S', 13, '2:8', 'evil', 'claw', 'dc-mon/undead/skeletons/skeleton_humanoid_large.png', 'it' ],
		name: 'ogre skeleton',
		immune: SkeletonImmunity,
		isUndead: true,
		loot: '50% bones, 50% skull',
		vuln: 'silver'+','+DamageType.SMITE
	},
	"soldierAnt": {
		core: [ 'c', 1, '2:22', 'evil', 'bite', 'dc-mon/animals/soldier_ant.png', 'it' ],
		name: "soldier ant",
		brainAlertFriends: true,
		loot: '10% potion, 20% facetedEye, 10% antGrubMush',
		isAnimal: true,
		speed: 1.5,
		vuln: 'glass'+','+DamageType.FREEZE
	},
	"troll": {
		core: [ 'T', 8, '3:6', 'evil', 'claw', 'dc-mon/troll.png', '*' ],
		loot: '50% trollHide, 10% coin, 20% trollBlood',
		isEarthChild: true,
		regenerate: 0.15,
		vuln: DamageType.BURN
	},
	"viper": {
		core: [ 'v', 5, '3:16', 'evil', 'bite', 'dc-mon/animals/viper.png', 'it' ],
		attitude: Attitude.HESITANT,
		dodge: 2,
		isAnimal: true,
		loot: '40% viperVenom',
		speed: 2.0
	},

// LUNAR
	"lunarOne": {
		core: [ 'L', 12, '3:10', 'lunar', 'freeze', 'dc-mon/deep_elf_demonologist.png', '*' ],
		name: "lunar one",
		brainAlertFriends: true,
		brainTalk: true,
		immune: DamageType.FREEZE,
		isLunarChild: true,
		loot: '2x 50% coin, 40% lunarEssence',
		rarity: 1.0,
		vuln: LunarVulnerabilities
	},
	"lunarReaper": {
		core: [ 'l', 1, '3:10', 'lunar', 'freeze', 'dc-mon/deep_elf_high_priest.png', '*' ],
		name: "lunar reaper",
		brainAlertFriends: true,
		brainTalk: true,
		immune: DamageType.FREEZE,
		loot: '2x 50% coin, 40% lunarEssence',
		rarity: 1.0,
		travelType: 'fly',
		vuln: LunarVulnerabilities
	},

// NEUTRAL TEAM
	"bat": {
		core: [ 'ᵬ', 1, '2:20', 'neutral', 'bite', 'dc-mon/animals/giant_bat.png', 'it' ],
		attitude: Attitude.WANDER,
		dodge: 2,
		isAnimal: true,
		loot: '50% batWing',
		packAnimal: true,
		senseInvisible: true,
		senseLife: true,
		travelMode: "fly"
	},
	"spinyFrog": {
		core: [ 'f', 4, '3:10', 'neutral', 'stab', 'dc-mon/animals/spiny_frog.png', 'it' ],
		name: "spiny frog",
		attitude: Attitude.WANDER,
		immune: [DamageType.POISON,'mud'].join(','),
		isAnimal: true,
		loot: '50% frogSpine',
	},
	"sheep": {
		core: [ 'r', 1, '1:20', 'neutral', 'bite', 'dc-mon/animals/sheep.png', 'it' ],
		attitude: Attitude.FEARFUL,
		isAnimal: true,
		loot: '3x 50% wool',
		packAnimal: true
	}
};

(function() {
	// 		core: [ '@', 1, '3:10', 'good', 'cut', 'dc-mon/elf.png', 'he' ],
	for( let typeId in MonsterTypeList ) {
		let m = MonsterTypeList[typeId];
		m.symbol = m.core[0];
		m.level = m.core[1];
		m.power = m.core[2];
		m.team  = m.core[3];
		m.damageType = m.core[4];
		m.img = m.core[5];
		m.pronoun = m.core[6];
		delete m.core;

		let blood = {
			isPlanar: 	'bloodYellow',
			isDemon: 	'bloodBlack',
			isEarthChild: 'bloodGreen',
			isAnimal: 	'bloodRed',
			isSunChild: 'bloodRed',
			isLunarChild: 'bloodBlue'
		};
		for( let key in blood ) {
			if( m[key] ) {
				m.bloodId = m.bloodId || blood[key];
				break;
			}
		}
		m.bloodId = m.bloodId || 'bloodRed';
	}
})();


TileTypeList['lockedDoor'].onTouch = function(entity,self) {
	if( entity.brainOpensDoors ) {
		entity.map.tileSymbolSet( self.x, self.y, TileTypeList.door.symbol );
		tell(mSubject,entity,' ',mVerb,'open',' the ',mObject,self);
	}
}

TileTypeList.obelisk.onTouch = function(toucher,self) {
	if( !toucher.senseBlind ) {
		tell(mSubject,toucher,' ',mVerb,'touch',' ',mObject,self,'.');
		effectApply( self.effect, toucher, null, null );
	}
	else {
		tell(mSubject,toucher,' ',mVerb,'touch',' ',mObject,self,' but ',mVerb,'are',' already blind.');
	}
}

TileTypeList.crystal.onTouch = function(entity,self) {
	if( entity.speed <= 1 ) {
		tell(mSubject,entity,' ',mVerb,'touch',' ',mObject,self,' and ',mSubject|mVerb,'blur',' with speed!');
		effectApply( self.effect, toucher, null, null );
	}
	else {
		tell( mSubject,entity,' ',mVerb,'touch',' ',mObject,self,', but ',mVerb,'are',' already moving fast.');
	}
}

TileTypeList.pit.onTouch = function(entity,self) {
	if( entity.travelMode == "walk" ) {
		tell(mSubject|mCares,entity,' ',mVerb,'are',' at the edge of ',mObject,self);
	}
}

TileTypeList.flames.onEnterType = function(entity,self) {
	tell( mSubject|mCares,entity,' ',mVerb,'enter',' ',mObject,self,'.' );
}

TileTypeList.flames.onDepartType = function(entity,self) {
	tell( mSubject|mCares,entity,' ',mVerb,'leave',' ',mObject,self,'.' );
}

TileTypeList.flames.isProblem = function(entity,self) {
	return !entity.isImmune(self.damageType);
}

TileTypeList.flames.onTouch = function(entity,self) {
	// We could pass in an onDamage that would also catch you on fire...
	entity.takeDamage( self, null, rollDice(self.damage), self.damageType );
}

TileTypeList.lava.onEnterType = function(entity,self) {
	tell( mSubject|mCares,entity,' ',mVerb,'enter',' ',mObject,self,'.' );
}

TileTypeList.lava.onDepartType = function(entity,self) {
	tell( mSubject|mCares,entity,' ',mVerb,'leave',' ',mObject,self,'.' );
}

TileTypeList.lava.isProblem = function(entity,self) {
	return !entity.isImmune(self.damageType);
}

TileTypeList.lava.onTouch = function(entity,self) {
	// We could pass in an onDamage that would also catch you on fire...
	entity.takeDamage( self, null, rollDice(self.damage), self.damageType );
}

TileTypeList.mud.isProblem = function(entity,self) {
	return ( entity.travelMode == "walk" );
}

TileTypeList.mud.onEnterType = function(entity,self) {
	if( entity.travelMode == "walk" ) {
		tell( mSubject|mCares,entity,' ',mVerb,'enter',' ',mObject,self,'.' );
	}
}

TileTypeList.mud.onDepartType = function(entity,self) {
	if( entity.travelMode == "walk" ) {
		tell( mSubject|mCares,entity,' ',mVerb,'escape',' ',mObject,self,'.' );
	}
}

TileTypeList.mud.onDepart = function(entity,self) {
	if( entity.isImmune(self.typeId) || ( entity.isResistant(self.typeId) && Math.chance(50) ) ) {
		return;
	}

	if( entity.travelMode == "walk" && !entity.mudded ) {
		entity.mudded = true;
		tell( mSubject|mCares,entity,' ',mVerb,'is',' stuck in the mud.');
		return false;
	}
	entity.mudded = false;
}

ItemTypeList.oreVein.onTouch = function(entity,self) {
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
		x: 			self.x,
		y: 			self.y,
		img: 		StickerList.oreChaff.img, //self.imgGet(self),
		scale: 		0.1,
		duration: 	0.2,
		onInit: 		a => { a.create(12); },
		onSpriteMake: 	s => { s.sVel(Math.rand(-90,90),Math.rand(5,10)); },
		onSpriteTick: 	s => { s.sScale(1.00).sMove(s.xVel,s.yVel).sGrav(40).sRot(360); }
	});
	new Anim( {}, {
		x: 			self.x,
		y: 			self.y,
		img: 		self.imgGet(self),
		duration: 	chunkAnim,
		onSpriteMake: 	s => { },
		onSpriteTick: 	s => { s.sQuiver(0.1,0.1); }
	});

	if( entity.swings >= self.mineSwings ) {
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



TileTypeList.forcefield.onEnterType = function(entity,self) {
	if( entity.isImmune(self.typeId) || ( entity.isResistant(self.typeId) && Math.chance(50) ) ) {
		return;
	}

	if( Math.chance(70) ) {
		tell( mSubject|mCares,entity,' ',mVerb,'is',' stopped by the ',mObject,self,'.' );
		return false;
	}
}

TileTypeList.ghoststone.onTouch = function(toucher,self) {
	if( !toucher.invisible ) {
		tell( mSubject,toucher,' ',mVerb,['touch','touches'],' ',mObject,self,'.' );
		effectApply( this.effect, toucher, null, self );
	}
	else {
		tell( mSubject,toucher,' ',mVerb,'touch',' ',mObject,self,', but ',mVerb,'are',' already invisible.');
	}
}

ItemTypeList.altar.onTouch = function(toucher,self) {
	if( !self.rechargeLeft) {
		effectApply(self.effect,toucher,null,self);
		self.depleted = true;
	}
	else {
		tell( mSubject|mCares,self,' ',mVerb,'is',' not glowing at the moment.');
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


MonsterTypeList.spinyFrog.onAttacked = function(attacker,amount,damageType) {
	if( attacker.command == Command.THROW || this.getDistance(attacker.x,attacker.y) > 1 ) {
		return;
	}

	if( attacker.isImmune(StuffList.frogSpine.typeId) ) {
		tell(mSubject,attacker,' ',mVerb,'is',' protected from the ',mObject|mPossessive,this,' spines.');
		return;
	}
	let damage = this.rollDamage(this.naturalWeapon.damage);
	attacker.takeDamagePassive( this, null, damage, DamageType.POISON, function(attacker,victim,amount,damageType) {
		if( amount<=0 ) {
			tell(mSubject,victim,' ',mVerb,'ignore',' ',mObject|mPossessive,attacker,' spines.');
		}
		else {
			tell(mSubject,victim,' ',mVerb,'is',' stabbed by ',mObject|mPossessive,attacker,' spines.');			
		}
		return true;
	}, true);
}

MonsterTypeList.bat.onAttacked = function(attacker,amount,damageType) {
	let f = this.findAliveOthers().includeMe().filter( e => e.typeId==this.typeId );
	if( f.count ) {
		let numAlerted = 0;
		f.process( e => {
			if( e.attitude == Attitude.HESITANT || e.attitude == Attitude.WANDER || e.attacker == Attitude.AWAIT ) {
				e.changeAttitude( Attitude.AGGRESSIVE );
			}
			e.team = (attacker.team == Team.EVIL || attacker.team == Team.NEUTRAL) ? Team.GOOD : Team.EVIL;
			numAlerted++;
		});
		if( this.isAlive() && numAlerted ) {
			tell(mSubject,this,' sonically ',mVerb,'alert',' ',mSubject|mPronoun|mPossessive,this,' friend'+(f.count>2?'s':''),' to attack team '+attacker.team+'!');
		}
	}
}

MonsterTypeList.blueScarab.onAttack = function(target) {
	let effect = Object.assign({},EffectTypeList.eVulnerability,{value: DamageType.FREEZE});
	effectApply(effect,target,this,null);
}

MonsterTypeList.redScarab.onAttack = function(target) {
	let effect = Object.assign({},EffectTypeList.eVulnerability,{value: DamageType.BURN});
	effectApply(effect,target,this,null);
}

MonsterTypeList.redOoze.onMove = function(self,x,y) {
	let f = self.map.findItem().at(x,y).filter( i=>i.isCorpse );
	if( f.first && self.health < self.healthMax ) {
		tell(mSubject,self,' ',mVerb,'absorb',' ',mObject,f.first,' and ',mVerb,'regain',' strength!');
		let heal = Math.floor(self.healthMax * 0.25);
		self.takeHealing(self,heal,DamageType.CORRODE,true);

		let anim = new Anim({},{
			x: 			entity.x,
			y: 			entity.y,
			img: 		self.img,
			onInit: 		a => { a.puppet(entity.spriteList); },
			onSpriteTick: 	s => { s.sScaleSet(1.0+s.sSine(1.0)); }
		});

		f.first.destroy();
	}
}

function loadKeyMapping(name) {
	return {
		ArrowUp: Command.N,
		ArrowLeft: Command.W,
		ArrowDown: Command.S,
		ArrowRight: Command.E,
		k: Command.N,
		u: Command.NE,
		l: Command.E,
		n: Command.SE,
		j: Command.S,
		b: Command.SW,
		h: Command.W,
		y: Command.NW,
		T: Command.DEBUGTEST,
		X: Command.DEBUGKILL,
		a: Command.DEBUGTHRIVE,
		s: Command.DEBUGVIEW,
		z: Command.DEBUGANIM,
		i: Command.INVENTORY,
		q: Command.QUAFF,
		t: Command.THROW,
		d: Command.DROP,
		c: Command.CAST,
		F1: Command.CAST1,
		F2: Command.CAST2,
		F3: Command.CAST3,
		F4: Command.CAST4,
		F5: Command.CAST5,
		'.': Command.WAIT,
		Enter: Command.EXECUTE,
		Escape: Command.CANCEL
	};
}

(function() {

	// Ǿgidᵬje  AB*? ᵮ⍨|:░ ¡$

	let level = {
		"oldtest":
			"############\n"+
			"#   Ώ      #\n"+
			"#          #\n"+
			"#<    h    #\n"+
			"#          #\n"+
			"#          #\n"+
			"#        > #\n"+
			"############\n"+
			'',
		"all":
 			"#######################\n"+
			"#Ǿ#g#s#k#e#T#v#ᵬ#f#i#r#\n"+
			"#±#±#±#±#±#±#±#±#±#±#±#\n"+
			"#                     #\n"+
			"# :::                 #\n"+
			"# :::                 #\n"+
			"# ⍨⍨⍨       g ᵴ@      #\n"+
			"# ᵮᵮᵮ            AB?F##\n"+
			"#              ########\n"+
			"#              + ░░░░░#\n"+
			"# $ ††         | ░░░░░#\n"+
			"# ᵴᵴᵴᵴᵴᵴᵴᵴᵴᵴᵴ  ± ░░░░░#\n"+
			"#¡¡¡¡¡¡¡¡¡¡¡¡  # ░░░░>#\n"+
			"#######################\n"+
			'',
		"real":
			"###################         ##########\n"+
			"#>i+*gᵮ     *  * ?######### # ¡¡  ᵬ  #\n"+
			"####  ᵮ           #     g # #⍨⍨⍨####v#\n"+
			"   #ggᵮ      kk   # ##### # #⍨⍨⍨#### #\n"+
			"  #####           # | A | ###⍨⍨⍨#*## #\n"+
			"  #Ǿ ¡##+#      ᵬ ± ##### +  g       #\n"+
			"  #      #   d@   ###***##############\n"+
			"  #+##########Ώ## #B    #¡ ::::::::#  \n"+
			"  #░░░░░░░░#    # #     #  ᵮᵮᵮᵬᵬᵬ::#  \n"+
			"  ####░░░░░#    # ###±###  :::::ᵬ::#  \n"+
			"     #░░░░░##   #          ::::g ᵬ:#  \n"+
			"     #e░░ffF#   # #############   ##  \n"+
			"     ########   # #           #   #   \n"+
			"                # #           #   #   \n"+
			"        ######### ######      # A #   \n"+
			"        #    |     ::  #      #####   \n"+
			"        #    |     ::  #              \n"+
			"        #e   |     ::  #              \n"+
			"        #¡   |     ::  #              \n"+
			"        #¡¡¡ |     ::  #              \n"+
			"        ################              \n"+
			'',
		"test":
			"##########################################\n"+
			"#Ώ < >                                   #\n"+
			"#  @                                     #\n"+
			"#           h                            #\n"+
			"# <                                      #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                        #\n"+
			"#                                      > #\n"+
			"##########################################\n"+
			'',

	};
	window.loadLevel = function(levelName) {
		return level[levelName];
	}
})();

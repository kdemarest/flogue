// STATIC DATA

// WARNING: The strings for directions MUST remain the same for commandToDirection() to work.
const Command = { NONE: "none", N:"N", NE:"NE", E:"E", SE:"SE", S:"S", SW:"SW", W:"W", NW:"NW", WAIT: "wait", 
				INVENTORY: "inventory", PICKUP: "pickup", QUAFF: "quaff", GAZE: "gaze", THROW: "throw", SHOOT: "shoot",
				LOSETURN: "lose turn", PRAY: "pray", EAT: "eat", ENTERGATE: "enterGate",
				ATTACK: "attack", USE: "use", LOOT: "loot", DROP: "drop",
				BUY: "buy", SELL: "sell", CRAFT: "craft",
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

let DEPTH_MIN = 0;
let DEPTH_MAX = 19;
let DEPTH_SPAN = (DEPTH_MAX-DEPTH_MIN)+1;
// If you change this, you must also chance the .css class .tile
let TILE_DIM = 48;
let MaxSightDistance = 8;

let STANDARD_MONSTER_SIGHT_DISTANCE = 6;
let TILE_UNKNOWN = ' ';		// reserved so that map creation can look sane.
let SymbolToType = {};
let TypeIdToSymbol = {};
let SYM = 111;

// Pathfinding and terrain isProblem
let Prob = {
	NONE:  0.0,
	MILD:  0.3,
	HARSH: 0.7,
	// Do NOT have a value of 1.0 or up to 900000 here. The Path class requires numbers below 1.0 for problem spots.
	WALL:  800000.0,
	DEATH: 900000.0
}

let ZOrder = {
	TILE: 10,
	GATE: 20,
	DECOR: 22,
	TABLE: 24,
	ITEM: 26,
	SIGN: 28,
	MONSTER: 30,
	OTHER: 40,
	MIST: 50,
	ANIM: 100
};

let PRICE_MULT_BUY  = 10;
let PRICE_MULT_SELL = 3;

Gab = {
};

DynamicViewList = {
	none: { tick: ()=>{}, render: ()=>{} }
};

const StickerList = {
	wallProxy: { img: "dc-dngn/wallProxy.png" },
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
	bloodWhite: { img: "dc-misc/bloodYellow.png" },
	showImmunity: { img: 'gui/icons/eImmune.png' },
	showResistance: { img: 'gui/icons/eResist.png' },
	showVulnerability: { img: 'gui/icons/eVuln.png' },
	showDodge: { img: 'gui/icons/iDodge.png' },
	showEat: { img: 'gui/icons/activityEat.png' },
	eGeneric: { img: "gui/icons/eGeneric.png" },
	ePoof: { img: "gui/icons/ePoof.png" },
	selectBox: { img: "gui/selectBox.png", scale: 1.0, xAnchor: 0, yAnchor: 0 },
	hit: { img: "effect/bolt04.png", scale: 0.4, xAnchor: 0.5, yAnchor: 0.5 },
	invisibleObserver: { img: "spells/enchantment/invisibility.png" },
	crosshairYes: { img: "dc-misc/cursor_green.png", scale: 1.0, xAnchor: 0, yAnchor: 0 },
	crosshairNo:  { img: "dc-misc/travel_exclusion.png", scale: 1.0, xAnchor: 0, yAnchor: 0 },
	slice0: { img: 'gui/sliceEmpty.png' },
	slice10: { img: 'gui/slice10.png' },
	slice20: { img: 'gui/slice20.png' },
	slice30: { img: 'gui/slice30.png' },
	slice40: { img: 'gui/slice40.png' },
	slice50: { img: 'gui/slice50.png' },
	slice60: { img: 'gui/slice60.png' },
	slice70: { img: 'gui/slice70.png' },
	slice80: { img: 'gui/slice80.png' },
	slice90: { img: 'gui/slice90.png' },
	slice100: { img: 'gui/sliceReady.png' },
};

// Probably should do this at some point.
//const Travel = { WALK: 1, FLY: 2, SWIM: 4 };
const RANGED_WEAPON_DEFAULT_RANGE = 7;
let DEFAULT_DAMAGE_BONUS_FOR_RECHARGE = 0.05;	// Should reflect that, with 5 slots used, you can do x more damage than a standard weapon
let DEFAULT_EFFECT_DURATION = 10;
let ARMOR_SCALE = 100;

const DamageType = { CUT: "cut", STAB: "stab", BITE: "bite", CLAW: "claw", BASH: "bash", BURN: "burn", FREEZE: "freeze", CORRODE: "corrode", POISON: "poison", SMITE: "smite", ROT: "rot" };
const EffectShape = { SINGLE: "single", BLAST3: "blast3", BLAST5: "blast5", BLAST7: "blast7" };
const ArmorDefendsAgainst = [DamageType.CUT,DamageType.STAB,DamageType.PIERCE,DamageType.BITE,DamageType.CLAW,DamageType.WHOMP];
const ShieldDefendsAgainst = [DamageType.CUT,DamageType.STAB,DamageType.PIERCE,DamageType.BITE,DamageType.CLAW,DamageType.WHOMP];
const ShieldBlocks = [DamageType.CUT,DamageType.STAB,DamageType.PIERCE,DamageType.BITE,DamageType.CLAW,DamageType.WHOMP,DamageType.BURN,DamageType.FREEZE,DamageType.CORRODE,DamageType.POISON,DamageType.SMITE,DamageType.ROT];
const Attitude = { ENRAGED: "enraged", AGGRESSIVE: "aggressive", AWAIT: "await", HESITANT: "hesitant", CONFUSED: "confused", FEARFUL: "fearful", PANICKED: "panicked", WANDER: "wander", CALM: "calm", WORSHIP: "worshipping" };
const Team = { EVIL: "evil", GOOD: "good", NEUTRAL: "neutral", LUNAR: "lunar"};
const Job = { SMITH: "smith", BREWER: "brewer", ARMORER: "armorer", LAPIDARY: "lapidary", JEWELER: "jeweler" };
const Slot = { HEAD: "head", NECK: "neck", ARMS: "arms", HANDS: "hands", FINGERS: "fingers", WAIST: "waist", HIP: "hip", FEET: "feet", ARMOR: "armor", WEAPON: "weapon", AMMO: "ammo", SHIELD: "shield" };
const HumanSlotLimit = { head: 1, neck: 1, arms: 1, hands: 1, fingers: 2, waist: 1, hip: 1, feet: 1, armor: 1, weapon: 1, shield: 1 };
const PickIgnore = ['mud','forceField'];
const PickVuln   = [DamageType.BURN,DamageType.FREEZE,DamageType.POISON,DamageType.SMITE,DamageType.ROT];
const PickResist = [DamageType.BURN,DamageType.FREEZE,DamageType.POISON,DamageType.SMITE,DamageType.ROT];
const PickAbsorb = [DamageType.CUT,DamageType.STAB,DamageType.BASH,DamageType.BURN,DamageType.FREEZE,DamageType.SMITE,DamageType.ROT];
const PickBlock  = [DamageType.CUT,DamageType.STAB,DamageType.BASH];

// IMMUNITY and RESISTANCE!
// Note that you can be immune to almost anything that is a string. That is, you can be immune to a DamageType,
// or an Attitude, an Effect, or even immune to the effects of 'mud' or 'forcefield' as long as their event handlers check it.

// Effect Events
// onTargetPosition - if this effect is targeting a map tile, instead of a monster.

let EffectTypeList = {
	eInert: 		{ level:  0, isInert: 1 },	// this is special, used in the picker effect proxy! Do not change!
	eWater: 		{ level:  0, rarity: 1.00, isWater: 1 },
	eBlank: 		{ level:  0, rarity: 1.00, isBlank: 1, name: 'blank paper' },
// Tactical
	eLuminari: 		{ isTac: 1, level:  0, rarity: 1.00, op: 'add', stat: 'light', value: 3, durationMod: 5.0, isPlayerOnly: 1, name: 'luminari', icon: 'gui/icons/eLuminari.png' },
//	eMap: 			{ isTac: 1, level:  null, rarity: 0.50, op: 'fillMinimap', isPlayerOnly: 1, name: 'map' },
	eGreed: 		{ isTac: 1, level:  0, rarity: 0.50, op: 'set', stat: 'senseItems', value: true, durationMod: 5.0, isPlayerOnly: 1, name: 'greed', icon: 'gui/icons/eVision.png' },
	eEcholoc: 		{ isTac: 1, level:  0, rarity: 0.50, op: 'set', stat: 'senseLife', value: true, durationMod: 5.0, isPlayerOnly: 1, name: 'bat sense', icon: 'gui/icons/eVision.png' },
	eSeeInvisible: 	{ isTac: 1, level:  0, rarity: 0.50, op: 'set', stat: 'senseInvisible', value: true, durationMod: 5.0, isHelp: 1, name: 'see invisible', icon: 'gui/icons/eVision.png' },
	eXray: 			{ isTac: 1, level:  0, rarity: 0.20, op: 'set', stat: 'senseXray', value: true, durationMod: 5.0, isPlayerOnly: 1, name: 'earth vision', icon: 'gui/icons/eVision.png' },
// Buff
	eFlight: 		{ isBuf: 1, level:  0, rarity: 0.20, op: 'set', stat: 'travelMode', value: 'fly', isHelp: 1, requires: e=>e.travelMode==e.baseType.travelMode,
					additionalDoneTest: (self) => { return self.target.map.tileTypeGet(self.target.x,self.target.y).mayWalk; }, icon: 'gui/icons/eFly.png' },
	eJump2: 		{ isBuf: 1, level:  0, rarity: 0.50, op: 'set', stat: 'jumpMax', value: 2, isHelp: 1, icon: 'gui/icons/eHaste.png' },
	eJump3: 		{ isBuf: 1, level:  0, rarity: 0.50, op: 'set', stat: 'jumpMax', value: 3, isHelp: 1, icon: 'gui/icons/eHaste.png' },
	eHaste: 		{ isBuf: 1, level:  0, rarity: 0.30, op: 'add', stat: 'speed', value: 1, isHelp: 1, xPrice: 3, requires: e=>e.speed<5, icon: 'gui/icons/eHaste.png' },
	eResistance: 	{ isBuf: 1, level:  0, rarity: 0.50, op: 'add', stat: 'resist',
					valuePick: () => pick(PickResist), isHelp: 1, namePattern: 'resist {value}s', icon: 'gui/icons/eResist.png' },
	eAbsorb: 		{ isBuf: 1, level:  0, rarity: 0.50, op: 'add', stat: 'resist',
					valuePick: () => pick(PickAbsorb), isHelp: 1, namePattern: 'absorb {value}s', icon: 'gui/icons/eResist.png' },
	eBlock: 		{ isBuf: 1, level:  0, rarity: 0.50, op: 'add', stat: 'resist',
					valuePick: () => pick(PickAbsorb), isHelp: 1, namePattern: 'block {value}s', icon: 'gui/icons/eResist.png' },
	eInvisibility: 	{ isBuf: 1, level:  0, rarity: 0.20, op: 'set', stat: 'invisible', value: true, isHelp: 1, requires: e=>!e.invisible, durationMod: 3.0, icon: 'gui/icons/eInvisible.png' },
	eIgnore: 		{ isBuf: 1, level:  0, rarity: 1.00, op: 'add', stat: 'immune',
					valuePick: () => pick(PickIgnore), isHelp: 1, namePattern: 'ignore {value}', icon: 'gui/icons/eImmune.png' },
// Debuff/Control
// All debuffs are reduced duration or effectiveness based on (critterLevel-potionLevel)*ratio
	eStun: 			{ isDeb: 1, level:  0, rarity: 0.50, op: 'set', stat: 'loseTurn', value: true, isHarm: 1, durationMod: 0.3, icon: 'gui/icons/eShove.png' },
	eShove: 		{ isDeb: 1, level:  0, rarity: 0.50, op: 'shove', value: 2, isInstant: 1, icon: 'gui/icons/eShove.png' },
	eHesitate: 		{ isDeb: 1, level:  0, rarity: 1.00, op: 'set', stat: 'attitude', value: Attitude.HESITANT, isHarm: 1, durationMod: 0.3, icon: 'gui/icons/eAttitude.png' },
	eStartle: 		{ isDeb: 1, level:  0, rarity: 1.00, op: 'set', stat: 'attitude', value: Attitude.PANICKED, isHarm: 1, durationMod: 0.2, icon: 'gui/icons/eFear.png' },
	eVulnerability: { isDeb: 1, level:  0, rarity: 1.00, op: 'add', stat: 'vuln', requires: (e,effect)=>!e.isImmune(effect.value),
					valuePick: () => pick(PickVuln), isHarm: 1, durationMod: 2.0, namePattern: 'vulnerability to {value}', icon: 'gui/icons/eVuln.png' },
	eSlow: 			{ isDeb: 1, level:  0, rarity: 0.20, op: 'sub', stat: 'speed', value: 0.5, isHarm: 1, durationMod: 0.3, requires: e=>e.speed>0.5 },
	eBlindness: 	{ isDeb: 1, level:  0, rarity: 0.30, op: 'set', stat: 'senseBlind', value: true, isHarm: 1, durationMod: 0.25, requires: e=>!e.blind, icon: 'gui/icons/eBlind.png' },
	eConfusion: 	{ isDeb: 1, level:  0, rarity: 0.20, op: 'set', stat: 'attitude', value: Attitude.CONFUSED, isHarm: 1, durationMod: 0.3, icon: 'gui/icons/eAttitude.png' },
	ePanic: 		{ isDeb: 1, level:  0, rarity: 0.20, op: 'set', stat: 'attitude', value: Attitude.PANICKED, isHarm: 1, durationMod: 1.0, icon: 'gui/icons/eFear.png' },
	eRage: 			{ isDeb: 1, level:  0, rarity: 0.20, op: 'set', stat: 'attitude', value: Attitude.ENRAGED, isHarm: 1, durationMod: 0.5, icon: 'gui/icons/eAttitude.png' },
// Healing
	eHealing: 		{ isHel: 1, level:  0, rarity: 1.00, op: 'heal', valueDamage: 6.00, isHelp: 1, isInstant: 1, healingType: DamageType.SMITE, icon: 'gui/icons/eHeal.png' },
	eRegeneration: 	{ isHel: 1, level:  0, rarity: 1.00, op: 'add', stat: 'regenerate', value: 0.05, isHelp: 1, durationMod: 2.0, icon: 'gui/icons/eHeal.png' },
// Damage
	eFire: 			{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', valueDamage: 2.00, isHarm: 1, isInstant: 1, damageType: DamageType.BURN, mayTargetPosition: true, icon: 'gui/icons/eFire.png' },
	ePoison: 		{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', valueDamage: 2.50, isHarm: 1, isInstant: 1, damageType: DamageType.POISON, icon: 'gui/icons/ePoison.png' },
	eCold: 			{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', valueDamage: 1.60, isHarm: 1, isInstant: 1, damageType: DamageType.FREEZE, mayTargetPosition: true, icon: 'gui/icons/eCold.png' },
	eAcid: 			{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', valueDamage: 1.60, isHarm: 1, isInstant: 1, damageType: DamageType.CORRODE, icon: 'gui/icons/eCorrode.png' },
	eAcid3: 		{ isDmg: 1, level:  0, rarity: 0.50, op: 'damage', valueDamage: 1.00, isHarm: 1, isInstant: 1, damageType: DamageType.CORRODE, icon: 'gui/icons/eCorrode.png' },
	eHoly: 			{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', valueDamage: 2.00, isHarm: 1, isInstant: 1, damageType: DamageType.SMITE, icon: 'gui/icons/eSmite.png' },
	eHoly3: 		{ isDmg: 1, level:  0, rarity: 0.50, op: 'damage', valueDamage: 1.50, effectShape: EffectShape.BLAST3, isHarm: 1, isInstant: 1, damageType: DamageType.SMITE, icon: 'gui/icons/eSmite.png' },
	eHoly5: 		{ isDmg: 1, level:  0, rarity: 0.20, op: 'damage', valueDamage: 1.20, effectShape: EffectShape.BLAST5, isHarm: 1, isInstant: 1, damageType: DamageType.SMITE, icon: 'gui/icons/eSmite.png' },
	eHoly7: 		{ isDmg: 1, level:  0, rarity: 0.05, op: 'damage', valueDamage: 1.00, effectShape: EffectShape.BLAST7, isHarm: 1, isInstant: 1, damageType: DamageType.SMITE, icon: 'gui/icons/eSmite.png' },
	eRot: 			{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', valueDamage: 2.00, isHarm: 1, isInstant: 1, damageType: DamageType.ROT, icon: 'gui/icons/eRot.png' },
};

for( let key in EffectTypeList ) {
	// all effect bearing items have a bigger price.
	EffectTypeList[key].xPrice = 1.3 * 1/(EffectTypeList[key].rarity||1.0);
}

EffectTypeList.eFire.onTargetPosition = function(map,x,y) {
	map.tileSymbolSet(x,y,TileTypeList.flames.symbol);
}

EffectTypeList.eCold.onTargetPosition = function(map,x,y) {
	map.tileSymbolSet(x,y,TileTypeList.water.symbol);
}


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
	"wall":       { symbol: '#', mayWalk: false, mayFly: false, opacity: 1, name: "wall", img: "dc-dngn/wall/brick_brown0.png", isWall: true },
	"pit":        { symbol: ':', mayWalk: true, mayFly: true,  opacity: 0, name: "pit", mayJump: true, isPit: true, wantsBridge: true, img: "dc-dngn/pit.png" },
	"door":       { symbol: '+', mayWalk: true,  mayFly: true,  opacity: 1, name: "locked door", isDoor: 1, img: "dc-dngn/dngn_open_door.png" },
	"lockedDoor": { symbol: '±', mayWalk: false, mayFly: false, opacity: 1, name: "door", isDoor: 1, img: "dc-dngn/dngn_closed_door.png" },
	"water":      { symbol: '~', mayWalk: true,  mayFly: true,  maySwim: true, isWater: true, opacity: 0, mayJump: true, wantsBridge: true, name: "water", img: "dc-dngn/water/dngn_shoals_shallow_water1.png" },
	"grass":      { symbol: SYM, mayWalk: true,  mayFly: true,  opacity: 0, name: "grass", img: "dc-dngn/floor/grass/grass_flowers_blue1.png", isFloor: true },
	"glass":      { symbol: SYM, mayWalk: false, mayFly: false, opacity: 0, name: "glass", img: "dc-dngn/wall/dngn_mirrored_wall.png", isWall: true },
	"shaft":      { symbol: SYM, mayWalk: false, mayFly: true,  opacity: 0, name: "shaft", mayJump: true, img: "dc-dngn/dngn_trap_shaft.png" },
	"flames":     { symbol: SYM, mayWalk: true,  mayFly: true,  opacity: 0.26, isFire: true, name: "flames", light: 9, glow:1,
					effect: { op: 'damage', valueDamage: 4.0, damageType: DamageType.BURN, isInstant: 1, icon: 'gui/icons/eFire.png' }, img: "dc-mon/nonliving/fire_elemental.png" },
	"lava":    	  { symbol: SYM, mayWalk: true, mayFly: true,  maySwim: true, opacity: 0, isFire: true, mayJump: true, name: "lava", light: 5, glow:1, 
					effect: { op: 'damage', valueDamage: 8.0, damageType: DamageType.BURN, isInstant: 1, icon: 'gui/icons/eFire.png' }, img: "UNUSED/features/dngn_lava.png" },
	"mist":       { symbol: SYM, mayWalk: true,  mayFly: true,  opacity: 0.34, name: "mist", zOrder: ZOrder.MIST, img: "effect/cloud_grey_smoke.png", layer: 3 },
	"mud":        { symbol: SYM, mayWalk: true,  mayFly: true,  opacity: 0, mayJump: true, name: "mud", img: "dc-dngn/floor/dirt0.png" },
	"ghostStone": { symbol: SYM, mayWalk: false, mayFly: false, opacity: 0, name: "ghost stone", img: "dc-dngn/altars/dngn_altar_vehumet.png",
					effect: { op: 'set', stat: 'invisible', value: true } },
	"obelisk":    { symbol: SYM, mayWalk: false, mayFly: false, opacity: 0, name: "obsidian obelisk", img: "dc-dngn/altars/dngn_altar_sif_muna.png",
					effect: { op: 'set', stat: 'senseBlind', value: true } },
	"crystal":    { symbol: SYM, mayWalk: false, mayFly: false, opacity: 0, name: "shimmering crystal", glow:1, img: "dc-dngn/altars/dngn_altar_beogh.png",
					effect: { op: 'add', stat: 'speed', value: 3 } },
	"forcefield": { symbol: SYM, mayWalk: true,  mayFly: true,  opacity: 1, name: "force field", light: 3, glow:1, img: "spells/air/static_discharge.png" },
};

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
const PotionEffects = Object.filter(EffectTypeList, (e,k)=>['eLuminari','eGreed','eEcholoc','eSeeInvisible','eXray','eFlight',
	'eHaste','eResistance','eInvisibility','eIgnore','eVulnerability','eSlow','eBlindness','eConfusion','eRage','eHealing','ePanic',
	'eRegeneration','eFire','ePoison','eCold','eAcid'].includes(k) );
const SpellEffects = Object.filter(EffectTypeList, (e,k)=>['eStun','eStartle','eHesitate','eBlindness','eLuminari','eXray','eEcholoc',
	'eGreed','eSlow','eHealing','ePoison','eFire','eCold','eHoly','eRot','eRage','ePanic','eConfusion','eShove'].includes(k) );
const RingEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eRegeneration','eResistance','eGreed'].includes(k) );
const WeaponEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eStun','eStartle','ePoison','eFire','eCold','eBlindness','eSlow','ePanic','eConfusion','eShove'].includes(k) );
const AmmoEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eHoly','eHoly3','eHoly5','eHoly7','ePoison','eFire','eCold','eBlindness','eSlow','eConfusion'].includes(k) );
const ShieldEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eStun','eShove','eAbsorb','eResistance'].includes(k) );
const HelmEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eRegeneration', 'eResistance','eLuminari'].includes(k) );
const ArmorEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eRegeneration', 'eResistance'].includes(k) );
const BracersEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eBlock'].includes(k) );
const BootsEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eJump2','eJump3','eRegeneration', 'eIgnore', 'eFlight', 'eResistance'].includes(k) );
const DartEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eAcid','eAcid3','eStun','eStartle','eHesitate','eBlindness','eSlow'].includes(k) );
const GemEffects = Object.filter(EffectTypeList, (e,k)=>['inert','eLuminari','eGreed','eEcholoc','eSeeInvisible'].includes(k) );

const AmmoList = Fab.add( '', {
	"arrow":     	{ level:  0, rarity: 1.0, damageType: DamageType.STAB, quick: 0, slot: Slot.AMMO, isArrow: true, breakChance: 60, attackVerb: 'shoot', img: 'UNUSED/spells/components/bolt.png' },
});

const WeaponList = Fab.add( '', {
	"rock":     	{ level:  0, rarity: 1.0, xDamage: 0.50, damageType: DamageType.BASH, isRock: true, quick: 2,
					mayThrow: true, range: RANGED_WEAPON_DEFAULT_RANGE, attackVerb: 'throw',
					effectChance: 0.0001,
					img: 'item/weapon/ranged/rock2.png' },
	"dart":     	{ level:  0, rarity: 0.5, xDamage: 0.20, damageType: DamageType.STAB, quick: 2,
					effectChance: 0.80,
					chanceToFire: 100,
					slot: false,
					effects: DartEffects,
					mayThrow: true,
					range: 10,
					attackVerb: 'strike', 
					img: 'UNUSED/spells/components/bolt.png' },
	"bow": 	    	{ level:  0, rarity: 1.0, xDamage: 1.00, quick: 0, effectChance: 0.80, effects: DartEffects, damageType: DamageType.STAB,
					mayShoot: true, range: RANGED_WEAPON_DEFAULT_RANGE, ammoType: 'isArrow', conveyEffectToAmmo: true, conveyDamageToAmmo: true, attackVerb: 'shoot', img: 'item/weapon/ranged/bow1.png' },
	"dagger":   	{ level:  3, rarity: 0.5, xDamage: 0.70, damageType: DamageType.STAB, quick: 2, effectChance: 0.30, 
					chanceToFire: 50, mayThrow: true, range: 4, attackVerb: 'strike', img: 'item/weapon/dagger.png' },
	"launcher":   	{ level:900, rarity: 0.0001, isTreasure: false, range: RANGED_WEAPON_DEFAULT_RANGE, name: "launcher", img: 'item/weapon/elven_dagger.png' },
	"solKnife":   	{ level:900, rarity: 0.0001, xDamage: 0.60, damageType: DamageType.CUT , quick: 2, attackVerb: 'carve', isTreasure: false, isSoulCollector: true, name: "sol knife", img: 'item/weapon/elven_dagger.png' },
	"pickaxe":   	{ level:  0, rarity: 0.01, xDamage: 0.70, damageType: DamageType.STAB, quick: 0, 
					attackVerb: 'strike', mineSpeed: 1.0, img: 'item/weapon/pickaxe.png' },
	"club":   		{ level:  0, rarity: 1.0, xDamage: 0.70, damageType: DamageType.BASH, quick: 1, attackVerb: 'smash', img: 'item/weapon/club.png' },
	"sword": 		{ level:  1, rarity: 1.0, xDamage: 1.00, damageType: DamageType.CUT, quick: 2, img: 'item/weapon/long_sword1.png' },
	"greatsword": 	{ level:  5, rarity: 0.3, xDamage: 1.20, damageType: DamageType.CUT, quick: 0, img: 'item/weapon/long_sword2.png' },
	"mace": 		{ level:  3, rarity: 1.0, xDamage: 0.90, damageType: DamageType.BASH, quick: 1, img: 'item/weapon/mace1.png' },
	"hammer": 		{ level:  4, rarity: 0.4, xDamage: 1.40, damageType: DamageType.BASH, quick: 0, img: 'item/weapon/hammer2.png' },
	"axe": 			{ level:  2, rarity: 0.6, xDamage: 1.00, damageType: DamageType.CUT, quick: 1, mayThrow: true, range: 5, attackVerb: 'strike', img: 'item/weapon/battle_axe1.png' },
	"spear": 		{ level:  8, rarity: 0.9, xDamage: 0.70, damageType: DamageType.STAB, quick: 1, reach: 2, mayThrow: true, range: 6, attackVerb: 'strike', img: 'item/weapon/spear2.png' },
	"pike": 		{ level: 12, rarity: 0.7, xDamage: 0.90, damageType: DamageType.STAB, quick: 0, reach: 2, img: 'item/weapon/bardiche1.png' },
	"pitchfork": 	{ level: 20, rarity: 0.5, xDamage: 1.20, damageType: DamageType.STAB, quick: 0, reach: 2, mayThrow: true, range: 4, img: 'item/weapon/trident1.png' },
});

const WeaponMaterialList = Fab.add( '', {
	"iron": 		{ level:  0 /* very important this be zero!*/, toMake: 'iron ingot'},
	"silver": 		{ level:  5, toMake: 'silver ingot' },
	"ice": 			{ level: 25, toMake: 'ice block' },
	"glass": 		{ level: 40, toMake: 'malachite' },
	"lunarium": 	{ level: 55, toMake: 'lunarium ingot' },
	"deepium": 		{ level: 70, toMake: 'deepium ingot' },
	"solarium": 	{ level: 85, toMake: 'solarium ingot' },
});

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
	"trollHideArmor": 	{ level: 20, rarity: 1.0, armorMultiplier: 1.20, ingredientId: 'troll hide', img: 'item/armour/troll_leather_armour.png' },
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
	"trollHideGloves": 	{ level:  2, rarity: 1.0, name: 'troll hide gloves',
							effect: { op: 'add', stat: 'immune', value: 'frogSpine' } },
	"studdedGloves": 	{ level:  3, rarity: 1.0 },
	"scale": 			{ level:  4, rarity: 1.0 },
	"chain": 			{ level: 10, rarity: 1.0 }
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
	"lantern": 			{ slot: Slot.HIP, light: 14, triggerOnUse: true, autoEquip: true, effect: { op: 'set', stat: 'light', value: 14, name: 'light', icon: EffectTypeList.eLuminari.icon }, useVerb: 'clip on', img: "item/misc/misc_lamp.png" },
	"oilLamp": 			{ slot: Slot.HIP, light: 10, triggerOnUse: true, autoEquip: true, effect: { op: 'set', stat: 'light', value: 10, name: 'light', icon: EffectTypeList.eLuminari.icon }, useVerb: 'clip on', img: "item/misc/misc_lamp.png" },
	"candleLamp": 		{ slot: Slot.HIP, light:  6, triggerOnUse: true, autoEquip: true, effect: { op: 'set', stat: 'light', value:  6, name: 'light', icon: EffectTypeList.eLuminari.icon }, useVerb: 'clip on', img: "item/misc/misc_lamp.png" },
	"lumpOfMeat": 		{ mayThrow: true, mayTargetPosition: true, isEdible: true, img: "item/food/chunk.png" },
	"trollHide": 		{ img: "item/armour/troll_hide.png" },
	"bone": 			{ mayThrow: true, mayTargetPosition: true, isEdible: true, isBone: true, img: "item/food/bone.png" },
	"antGrubMush": 		{ mayThrow: true, mayTargetPosition: true, isEdible: true, img: "item/food/sultana.png" },
	"viperVenom": 		{ img: "UNUSED/other/acid_venom.png" },
	"dogCollar": 		{ mayThrow: true, mayTargetPosition: true, isEdible: true, img: 'item/misc/collar.png' },
	"skull": 			{ mayThrow: true, mayTargetPosition: true, isEdible: true, isBone: true, img: 'item/misc/skull.png' },
	"mushroomBread": 	{ mayThrow: true, mayTargetPosition: true, isEdible: true, img: 'item/food/bread_ration.png'},
	"demonScale": 		{ img: 'item/misc/demonEye.png' },
	"demonEye": 		{ mayThrow: true, mayTargetPosition: true, isEdible: true, img: 'item/misc/demonEye.png' },
	"ghoulFlesh": 		{ mayThrow: true, mayTargetPosition: true, isEdible: true, img: 'item/food/chunk_rotten.png' },
	"pinchOfEarth": 	{ img: 'item/weapon/ranged/rock.png' },
	"impBrain": 		{ mayThrow: true, mayTargetPosition: true, isEdible: true },
	"ogreDrool": 		{ mayThrow: true, mayTargetPosition: true, isEdible: true, img: 'item/misc/ogreDrool.png' },
	"redOozeSlime": 	{ mayThrow: true, mayTargetPosition: true, isEdible: true, img: 'item/misc/redOozeSlime.png' },
	"scarabCarapace": 	{ },
	"darkEssence": 		{ },
	"facetedEye": 		{ mayThrow: true, mayTargetPosition: true, isEdible: true },
	"sunCrystal":   	{ mayThrow: true, range: 7, light: 12, glow: 1, attackVerb: 'throw', img: "gems/sunCrystal.png", mayTargetPosition: true,
						effect: { name: 'radiance', op: 'damage', damageModifier: 1.0, effectShape: EffectShape.BLAST5, damageType: DamageType.SMITE, icon: 'gui/icons/eSmite.png' }
						},
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
	coinOne: 	{ img: "coinOne" },
	coinThree: 	{ img: "coinThree" },
	coinTen: 	{ img: "coinTen" },
	coinMany: 	{ img: "coinPile" },
});
let coinImgFn = (self,img) => {
	let c = self ? self.coinCount : null;
	let cs = CoinStacks;
	return "item/misc/"+(img || (c<=1 ? cs.coinOne : (c<=4 ? cs.coinThree : (c<=10 ? cs.coinTen : cs.coinMany))).img)+".png";
};

const NulImg = { img: '' };

// Item Events
// onPickup - fired just before an item is picked up. Return false to disallow the pickup.
// onTick - fires each time a full turn has passed, for every item, whether in the world or in an inventory. 

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
	"random":	  { symbol: '*', isRandom: 1, mayPickup: false, neverPick: true, img: '' },
// GATEWAYS
	"stairsDown": { symbol: '>', name: "stairs down", 	rarity: 1, isGate: 1, gateDir: 1, gateInverse: 'stairsUp', mayPickup: false, useVerb: 'descend', img: "dc-dngn/gateways/stone_stairs_down.png" },
	"stairsUp":   { symbol: '<', name: "stairs up", 	rarity: 1, isGate: 1, gateDir: -1, gateInverse: 'stairsDown', mayPickup: false, useVerb: 'ascend', img: "dc-dngn/gateways/stone_stairs_up.png" },
	"gateway":    { symbol: '=', name: "gateway", 		rarity: 1, isGate: 1, gateDir: 0, gateInverse: 'gateway', mayPickup: false, useVerb: 'enter', img: "dc-dngn/gateways/dngn_enter_dis.png" },
	"portal":     { symbol: '0', name: "portal", 		rarity: 1, isGate: 1, gateDir: 0, gateInverse: 'portal', mayPickup: false, useVerb: 'touch', img: "dc-dngn/gateways/dngn_portal.png" },
	"pitDrop": 	  { symbol: SYM, name: "pit drop", 		rarity: 1, isGate: 1, gateDir: 1, gateInverse: false, mayPickup: false, useVerb: 'fall', img: "effect/pitDrop.png" },
// MARKERS
	"marker": 	  { symbol: SYM, name: "marker", rarity: 1, mayPickup: false, img: "gui/icons/marker.png" },
// DECOR
	"bridgeNS": 	{ symbol: SYM, mayWalk: true, mayFly: true, rarity: 1, name: "bridge", mayPickup: false, isDecor: true, isBridge: true, noFloor: true, img: "dc-dngn/bridgeNS.png" },
	"bridgeEW": 	{ symbol: SYM, mayWalk: true, mayFly: true, rarity: 1, name: "bridge", mayPickup: false, isDecor: true, isBridge: true, noFloor: true, img: "dc-dngn/bridgeEW.png" },
	"columnBroken": { symbol: SYM, mayWalk: false, mayFly: false, rarity: 1, name: "broken column", isDecor: true, img: "dc-dngn/crumbled_column.png" },
	"columnStump":  { symbol: SYM, mayWalk: false, mayFly: true, rarity: 1, name: "column stump", isDecor: true, img: "dc-dngn/granite_stump.png" },
	"brazier":    	{ symbol: SYM, mayWalk: false, mayFly: true,  opacity: 0, name: "brazier", light: 6, glow:1, img: "spells/fire/sticky_flame.png" },
	"table":    	{ symbol: SYM, mayWalk: false, mayFly: true,  opacity: 0, name: "table", isDecor: true, isTable: true, zOrder: ZOrder.TABLE,
					img: "decor/tableSmall.png", imgChoices: ImgTables, imgGet: (self,img) => img || self.img },
	"sign":    		{ symbol: SYM, mayWalk: true, mayFly: true,  opacity: 0, name: "sign", mayPickup: false, zOrder: ZOrder.SIGN, isDecor: true, isSign: true,
					allowPlacementOnBlocking: true, img: "decor/sign.png", imgChoices: ImgSigns,
					imgGet: (self,img) => img || self.img },

	"altar":    { symbol: SYM, mayWalk: false, mayFly: false, rarity: 1, name: "golden altar", mayPickup: false, light: 4, glow:true,
				isDecor: true, rechargeTime: 12, healMultiplier: 3.0, sign: "This golden alter to Solarus glows faintly.\nTouch it to level up.",
				effect: { op: 'heal', valueDamage: 6.00, healingType: DamageType.SMITE, icon: 'gui/icons/eHeal.png' },
				img: "dc-dngn/altars/dngn_altar_shining_one.png" },
	"fountain": { symbol: SYM, mayWalk: false, mayFly: true, rarity: 1, mayPickup: false,
				isDecor: true, img: "dc-dngn/dngn_blue_fountain.png" },
	"fontSolar":{ symbol: 'S', mayWalk: true, mayFly: true, rarity: 1, mayPickup: false, name: "solar font",
				light: 10, glow: 1, isDecor: true, img: "dc-dngn/mana/fontSolar.png" },
	"fontDeep": { symbol: 'D', mayWalk: true, mayFly: true, rarity: 1, mayPickup: false, name: "deep font", rechargeTime: 4, xDamage: 0.3, damageType: DamageType.ROT, 
				dark: 10, glow: 1, isDecor: true, img: "dc-dngn/mana/fontDeep.png" },
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
	"fake":   	{ symbol: SYM, namePattern: "fake", rarity: 1, img: 'UNUSED/spells/components/skull.png', icon: "corpse.png" },
// CORPSE
	"corpse":   { symbol: SYM, namePattern: "remains of a {mannerOfDeath} {usedToBe}", rarity: 1, isCorpse: true,
				img: 'UNUSED/spells/components/skull.png', icon: "corpse.png" },
// TREASURE
	"coin": 	{ symbol: '$', xPrice: 1.0, namePattern: '{coinCount} gold', coinCount: 0, coinVariance: 0.30, isCoin: true, isTreasure: 1,
				imgGet: coinImgFn, imgChoices: CoinStacks, icon: 'coin.png' },
	"potion":   { symbol: 'p', isTreasure: 1, xPrice: 1.0, namePattern: 'potion{?effect}{+plus}', charges: 1, light: 3, glow: true, attackVerb: 'splash',
				effectChance: 1.0, isPotion: true, range: RANGED_WEAPON_DEFAULT_RANGE,
				effects: PotionEffects, mayThrow: true, destroyOnLastCharge: true,
				imgGet: (self,img)=>"item/potion/"+(img || (ImgPotion[self.effect?self.effect.typeId:'']||NulImg).img || "emerald")+".png", imgChoices: ImgPotion, icon: 'potion.png' },
	"spell":    { symbol: 's', isTreasure: 1, xPrice: 3.0, namePattern: 'spell{?effect}{+plus}', rechargeTime: 10, effects: SpellEffects,
				effectChance: 1.0, mayCast: true, isSpell: true, range: RANGED_WEAPON_DEFAULT_RANGE,
				img: "item/scroll/scroll.png", icon: 'spell.png' },
	"ore": 		{ symbol: 'o', isTreasure: 1, xPrice: 0.1, namePattern: '{variety}', varieties: OreList, isOre: true,
				imgGet: (self,img) => "ore/"+(img || self.variety.img || "ore")+".png", imgChoices: OreList, icon: 'ore.png' },
	"gem": 		{
		symbol: "g",
		isTreasure: 1,
		xPrice: 1.5,
		namePattern: '{quality} {variety}{+plus}{?effect}',
		qualities: GemQualityList,
		varieties: GemList,
		effects: GemEffects,
		isGem: true,
		effectChance: 0.30,
		mayThrow: 1,
		range: RANGED_WEAPON_DEFAULT_RANGE,
		mayTargetPosition: 1,
		autoCommand: Command.USE,
		imgGet: (self,img) => "gems/"+(img || self.variety.img || "Gem Type2 Black")+".png",
		imgChoices: GemList,
		scale:0.3,
		icon: 'gem.png'
	},
	"weapon": 	{
		symbol: 'w',
		isTreasure: 1,
		xPrice: 4.0,
		namePattern: '{material} {variety}{+plus}{?effect}',
		materials: WeaponMaterialList,
		varieties: WeaponList,
		effects: WeaponEffects,
		slot: Slot.WEAPON,
		isWeapon: true,
		useVerb: 'weild',
		mayTargetPosition: true,
		effectChance: 0.15,
		img: "item/weapon/dagger.png",
		icon: 'weapon.png'
	},
	"ammo": 	{ symbol: 'm', isTreasure: 1, xPrice: 0.1, namePattern: '{material} {variety}{+plus}{?effect}', materials: WeaponMaterialList, varieties: AmmoList, effects: AmmoEffects, slot: Slot.AMMO, isWeapon: true,
				useVerb: 'ready', effectChance: 0.30, img: "item/weapon/dagger.png", icon: 'weapon.png' },
	"shield": 	{ symbol: 'x', isTreasure: 1, xPrice: 3.0, namePattern: "{variety} shield{+plus}{?effect}", varieties: ShieldList, effects: ShieldEffects, slot: Slot.SHIELD, isShield: true,
				effectChance: 0.25,
				armorMultiplier: 0.50,
				useVerb: 'hold', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "item/armour/shields/shield3_round.png", icon: 'shield.png' },
	"helm": 	{ symbol: 'h', isTreasure: 1, xPrice: 2.5, namePattern: "{variety} helm{+plus}{?effect}", varieties: HelmList, effects: HelmEffects, slot: Slot.HEAD, isHelm: true, isArmor: true,
				effectChance: 0.15,
				armorMultiplier: 0.15,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "item/armour/headgear/helmet2_etched.png", icon: 'helm.png' },
	"armor": 	{ symbol: 'a', isTreasure: 1, xPrice: 8.0, namePattern: "{variety} armor{+plus}{?effect}", varieties: ArmorList, effects: ArmorEffects, slot: Slot.ARMOR, isArmor: true,
				effectChance: 0.10,
				armorMultiplier: 0.60,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				imgGet: (self,img) => (img || self.variety.img || "item/armour/chain_mail1.png"), imgChoices: ArmorList, icon: 'armor.png' },
	"bracers": 	{ symbol: 'b', isTreasure: 1, xPrice: 3.5, namePattern: "{variety} bracers{+plus}{?effect}", varieties: BracerList, effects: BracersEffects, slot: Slot.ARMS, isBracers: true, isArmor: true,
				effectChance: 0.15,
				armorMultiplier: 0.15,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "UNUSED/armour/gauntlet1.png", icon: 'bracers.png' },
	"boots": 	{ symbol: 'c', isTreasure: 1, xPrice: 1.8, namePattern: "{variety} boots{+plus}{?effect}", varieties: BootList, slot: Slot.FEET, isBoots: true, isArmor: true, effects: BootsEffects,
				effectChance: 0.15,
				armorMultiplier: 0.10,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "item/armour/boots2_jackboots.png", icon: 'boots.png' },
	"gloves": 	{ symbol: 'l', isTreasure: 1, xPrice: 1.0, namePattern: "{variety}", varieties: GloveList, slot: Slot.HANDS, isGloves: true,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "UNUSED/armour/glove4.png", icon: 'gloves.png' },
	"ring": 	{ symbol: 'r', isTreasure: 1, xPrice: 6.0, namePattern: "{material} {variety} ring{+plus}{?effect}", materials: RingMaterialList, varieties: RingList,
				effects: RingEffects, slot: Slot.FINGERS, isRing: true,
				effectChance: 0.50,
				useVerb: 'wear', triggerOnUse: true, effectOverride: { duration: true },
				imgGet: (self,img) => "item/ring/"+(img || self.material.img || 'gold')+".png", imgChoices: RingMaterialList, icon: 'ring.png' },
// INGREDIENTS
	"stuff": 	{ symbol: 't', isTreasure: 1, isStuff: 1, xPrice: 0.4, namePattern: "{variety}{?effect}", varieties: StuffList,
				imgGet: (self,img) => (img || (self?self.variety.img:'') || 'item/misc/misc_rune.png'), imgChoices: StuffList, icon: 'stuff.png' },

};
const ItemSortOrder = ['weapon','ammo','helm','armor','bracers','gloves','boots','shield','ring','potion','gem','ore','spell','stuff'];
const ItemFilterOrder = ['','weapon','armor','shield','potion','spell','ring','gem','ore','stuff'];
const ItemFilterGroup = {
	weapon: ['weapon','ammo'],
	armor:  ['armor','helm','bracers','gloves','boots'],
	shield: ['shield'],
	ring:   ['ring'],
	potion: ['potion'],
	gem:    ['gem'],
	ore:    ['ore'],
	spell:  ['spell'],
	stuff:  ['stuff']
};

// ItemBag is the top level item probability and price manager.
// gen = the chance to generate the item. Themes can tweak this number
// eff = the change that the generated item has an effect of some kind. Rises by (area.depth*0.30)
// price = how much you have to pay to buy this thing. Multiplied by the level of the variety/material/quality
// basis = how you calculate the value and rarity
let ItemBag = (function() {
	let raw = {
		// 			cGen 	cEff	price	basis
		coin: 	[	30.0, 	  0.0,	  1.0,	[], ],
		potion: [	10.0, 	100.0,	 10.0,	['effect'], ],
		spell: 	[	 1.0, 	100.0,	 50.0,	['effect'], ],
		ore: 	[	 5.0, 	  0.0,	  1.0,	['variety'], ],
		gem: 	[	 4.0,	 20.0,	 20.0,	['material','quality','effect'], ],
		weapon: [	15.0, 	  5.0,	 40.0,	['material','effect','variety'], ],
		ammo: 	[	 5.0, 	  5.0,	 40.0,	['material','effect','variety'], ],
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
let MaxLightValue = 15;
let LightFullBrightDistance = 7;

const MonsterTypeDefaults = {
	level: 0, power: '3:10', team: Team.EVIL, damageType: DamageType.CUT, img: "dc-mon/acid_blob.png", pronoun: 'it',
	attitude: Attitude.AGGRESSIVE,
	light: 0,
	senseBlind: false, senseXray: false, senseItems: false, senseLife: false,
	invisible: false, senseInvisible: false, sightDistance: STANDARD_MONSTER_SIGHT_DISTANCE,
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

let LightAlpha = [];
// This makes the assumption that a 
for( let i=-MaxLightValue-20 ; i<MaxLightValue+20 ; ++i ) {
	LightAlpha[i] = Math.clamp(i/LightFullBrightDistance,0.0,1.0);
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

let OozeImmunity = ['eShove','eBlind',DamageType.CORRODE,DamageType.STAB,DamageType.BASH,DamageType.POISON,Attitude.PANICKED].join(',');
let OozeResistance = [DamageType.CUT,Attitude.ENRAGED,Attitude.CONFUSED].join(',');
let OozeVulnerability = ['ice','glass',DamageType.FREEZE].join(',');

let LunarVulnerabilities = ['solarium',DamageType.BURN].join(',');

let DemonImmunity = [DamageType.BURN].join(',');
let DemonResistance = ['deepium',DamageType.POISON,DamageType.STAB].join(',');
let DemonVulnerability = ['ice','solarium',DamageType.SMITE,DamageType.FREEZE].join(',');


function launcher(obj) {
	// Use this as a convenience to make launchers for anything to be thrown or shot
	return Object.assign({
		typeFilter: 'weapon.launcher',
		fake: true,
		mayShoot: true,
		damageType: DamageType.STAB,
		name: 'natural ranged weapon'
	}, obj );
}

const MonsterTypeList = {

// GOOD TEAM
	"player": {
		core: [ '@', 0, '3:10', 'good', 'cut', 'player.png', 'he' ],
		attitude: Attitude.CALM,
		brain: Brain.USER,
		brainOpensDoors: true,
		brainPicksup: true,
		brainTalk: true,
		experience: 0,
		inventoryLoot: '',
		inventoryWear: '',
		isSunChild: true,
		isNamed: false,
		jumpMax: 1,
		light: 4,
		neverPick: true,
		regenerate: 0.01,
		sightDistance: MaxSightDistance,
		strictAmmo: true
	},
	"dog": {
		core: [ 'd', 0, '10:10', 'good', 'bite', 'UNUSED/spells/components/dog2.png', '*' ],
		brainFlee: true,
		brainPet: true,
		dodge: 1,
		isAnimal: true,
		isPet: true,
		isNamed: true,
		jumpMax: 2,
		loot: '30% dogCollar',
		properNoun: true,
		packAnimal: true,
		rarity: 0.10,
		regenerate: 0.03
	},
	"dwarf": {
		core: [ SYM, 0, '3:10', 'good', 'bash', 'dc-mon/dwarf.png', '*' ],
		name: "Fili",
		brainFlee: true,
		isSunChild: true,
		isDwarf: true,
		isNamed: true,
		jobId: 'PICK',
		properNoun: true,
		packAnimal: true
	},
	"mastiff": {
		core: [ SYM, 69, '10:10', 'good', 'bite', 'UNUSED/spells/components/dog2.png', '*' ],
		dodge: 1,
		brainFlee: true,
		brainPet: true,
		isAnimal: true,
		isPet: true,
		isNamed: true,
		loot: '30% dogCollar',
		properNoun: true,
		packAnimal: true,
		rarity: 0.10,
		regenerate: 0.03
	},
	"human": {
		core: [ SYM, 0, '3:10', 'good', 'cut', 'dc-mon/human.png', '*' ],
		attitude: Attitude.CALM,
		brainAlertFriends: true,
		brainTalk: true,
		brainOpensDoors: true,
		isSunChild: true,
		isNamed: true,
		loot: '30% mushroomBread, 30% coin, 10% potion.eHealing',
		rarity: 0.10,
	},
	"philanthropist": {
		core: [ SYM, 0, '3:10', 'good', 'cut', 'dc-mon/philanthropist.png', '*' ],
		attitude: Attitude.CALM,
		brainAlertFriends: true,
		brainTalk: true,
		brainOpensDoors: true,
		isSunChild: true,
		isNamed: true,
		loot: '30% mushroomBread, 50% coin, 10% potion.eHealing',
		rarity: 0.10,
		sayPrayer: 'Get in line! Come to the left window for donations!'
	},
	"refugee": {
		core: [ SYM, 0, '2:20', 'good', 'bash', 'dc-mon/refugee.png', '*' ],
		attitude: Attitude.FEARFUL,
		brainAlertFriends: true,
		brainTalk: true,
		brainOpensDoors: true,
		isSunChild: true,
		isNamed: true,
		loot: '10% bone, 5% dogCollar, 3x 10% stuff',
		rarity: 0.40,
		sayPrayer: "Oh god... What I wouldn't give for a steak."
	},

// EVIL TEAM
	"avatarOfBalgur": {
		core: [ SYM, 99, '25:2', 'evil', 'burn', 'dc-mon/hell_knight.png', 'he' ],
		isUnique: true, neverPick: true,
		brainAlertFriends: true,
		brainTalk: true,
		immune: ['eShove',DamageType.BURN,Attitude.PANICKED].join(','),
		inventoryLoot: 'spell.eFire, spell.eRot, spell.ePoison',
		isDemon: true,
		isLarge: true,
		sayPrayer: 'I shall rule this planet!',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"demon": {
		core: [ SYM, 49, '3:5', 'evil', 'burn', 'player/base/draconian_red_f.png', 'it' ],
		brainAlertFriends: true,
		brainTalk: true,
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: 'weapon.dart.eFire',
		loot: '30% coin, 50% potion.eFire, 30% demonScale, 20% pitchfork, 30% demonEye',
		packAnimal: true,
		resist: DemonResistance,
		sayPrayer: 'Hail Balgur, ruler of the deep!',
		vuln: DemonVulnerability,
	},
	"ethermite": {
		core: [ SYM, 59, '3:20', 'evil', 'bite', 'dc-mon/shining_eye.png', '*' ],
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
		core: [ SYM, 39, '1:2', 'evil', 'rot', 'dc-mon/undead/ghoul.png', 'it' ],
		immune: UndeadImmunity,
		dark: 2,
		isUndead: true,
		loot: '30% coin, 20% potion.eRot, 50% ghoulFlesh',
		senseLife: true,
		resist: UndeadResistance,
		vuln: UndeadVulnerability
	},
	"goblin": {
		core: [ SYM, 1, '3:10', 'evil', 'cut', 'dc-mon/goblin.png', '*' ],
		brainAlertFriends: true,
		brainTalk: true,
		brainIgnoreClearShots: 70,
		isGoblin: true,
		isEarthChild: true,
		inventoryLoot: '1x potion.eFire',
		loot: '50% coin, 20% weapon.sword, 20% weapon.club, 20% any, 30% pinchOfEarth',
		packAnimal: true,
		sayPrayer: 'Oh mighty Thagzog...'
	},
	"goblinWar": { 
		core: [ SYM, 49, '3:8', 'evil', 'cut', 'dc-mon/goblin.png', '*' ],
		name: 'goblin warrior',
		brainAlertFriends: true,
		brainTalk: true,
		isGoblin: true,
		isEarthChild: true,
		lootInventory: 'weapon.axe',
		loot: '50% coin, 80% weapon.sword, 20% weapon.club, 30% pinchOfEarth',
		sayPrayer: 'Oh warrior Thagzog...'
	},
	"goblinMut": {
		core: [ SYM, 79, '3:8', 'evil', 'cut', 'dc-mon/goblin.png', '*' ],
		name: 'goblin mutant',
		brainAlertFriends: true,
		brainTalk: true,
		isGoblin: true,
		isEarthChild: true,
		lootInventory: 'weapon.axe',
		loot: '50% coin, 80% weapon.mace, 30% pinchOfEarth',
		sayPrayer: 'Oh mutant Thagzog...'
	},
	"imp": {
		core: [ SYM, 39, '3:10', 'evil', 'claw', 'dc-mon/demons/imp.png', 'it' ],
		attitude: Attitude.HESITANT,
		dodge: 1,
		glow: 1,
		immune: DamageType.BURN,
		isDemon: true,
		lootInventory: '3x weapon.dart.eFire',
		loot: '30% potion.eFire, 30% impBrain',
		senseInvisible: true,
		travelMode: "fly",
		vuln: DemonVulnerability
	},
	"kobold": {
		core: [ SYM, 1, '4:20', 'evil', 'cut', 'dc-mon/kobold.png', '*' ],
		attitude: Attitude.HESITANT,
		brainAlertFriends: true,
		brainTalk: true,
		dodge: 1,
		inventoryLoot: '2x dart.eInert',
		isEarthChild: true,
		loot: '50% coin, 4x 50% weapon.dart, 30% weapon.dagger, 30% dogCollar',
		packAnimal: true
	},
	"ogreKid": { 
		core: [ SYM, 39, '10:10', 'evil', 'bash', 'dc-mon/ogre.png', '*' ],
		name: "ogre child",
		brainTalk: true, 
		isEarthChild: true,
		lootInventory: 'weapon.rock',
		loot: '50% weapon.club, 20% ogreDrool',
		resist: DamageType.CUT,
		speed: 0.75
	},
	"ogre": {
		core: [ SYM, 69, '10:10', 'evil', 'bash', 'dc-mon/ogre.png', '*' ],
		brainTalk: true,
		isEarthChild: true,
		isOgre: true,
		isLarge: true,
		inventoryLoot: launcher({ ammoType: 'isRock', rechargeTime: 2, hitsToKillPlayer: 3, name: "rock" }),
		loot: '90% coin, 90% coin, 90% coin, 50% weapon.club, 20% ogreDrool',
		resist: [DamageType.CUT,DamageType.STAB].join(','),
		speed: 0.5,
	},
	"redOoze": {
		core: [ SYM, 9, '3:3', 'evil', 'corrode', 'dc-mon/jelly.png', 'it' ],
		brainRavenous: true,
		name: "red ooze",
		glow: 4,
		immune: OozeImmunity,
		isPlanar: true,
		isOoze: true,
		loot: '90% potion.eAcid, 40% redOozeSlime',
		regenerate: 0.05,
		resist: OozeResistance,
		scale: 0.50,
		growLimit: 3.0,
		speed: 0.75,
		vuln: OozeVulnerability
	},
	"blueScarab": {
		core: [ SYM, 59, '2:30', 'evil', 'freeze', 'dc-mon/animals/boulder_beetle.png', 'it' ],
		namePattern: "blue scarab",
		glow: 3,
		immune: DamageType.FREEZE,
		isPlanar: true,
		loot: '30% gem, 50% scarabCarapace',
		travelMode: "fly",
		vuln: 'glass,'+DamageType.BURN
	},
	"redScarab": {
		core: [ SYM, 19, '2:30', 'evil', 'burn', 'dc-mon/animals/boulder_beetle.png', 'it' ],
		namePattern: "red scarab",
		glow: 3,
		immune: DamageType.BURN,
		isPlanar: true,
		loot: '30% gem, 50% scarabCarapace',
		travelMode: "fly",
		vuln: 'glass,'+DamageType.FREEZE
	},
	"shadow": {
		core: [ SYM, 79, '1:12', 'evil', 'rot', 'dc-mon/undead/shadow.png', 'it' ],
		dark: 12,
		immune: ShadowImmunity,
		isUndead: true,
		isSkeleton: true,
		loot: '50% darkEssence, 20% potion.eBlindness',
		speed: 0.75,
		vuln: ['silver',DamageType.SMITE].join(',')
	},
	"skeleton": {
		core: [ SYM, 19, '2:10', 'evil', 'claw', 'dc-mon/undead/skeletons/skeleton_humanoid_small.png', 'it' ],
		immune: SkeletonImmunity,
		isUndead: true,
		isSkeleton: true,
		loot: '50% bone, 50% skull',
		vuln: 'silver'+','+DamageType.SMITE
	},
	"skeletonArcher": {
		core: [ SYM, 29, '2:10', 'evil', 'claw', 'dc-mon/undead/skeletonArcher.png', 'it' ],
		immune: SkeletonImmunity,
		inventoryLoot: [{ typeFilter:'weapon.bow', rechargeTime: 4, unreal: 1, name: 'unholy bow', fake: true }],
		isUndead: true,
		isSkeleton: true,
		loot: '50% bone, 50% skull',
		vuln: 'silver'+','+DamageType.SMITE
	},
	"skeletonLg": {
		core: [ SYM, 59, '2:8', 'evil', 'claw', 'dc-mon/undead/skeletons/skeleton_humanoid_large.png', 'it' ],
		name: 'ogre skeleton',
		immune: SkeletonImmunity,
		inventoryLoot: '50% spell.eRot',
		isUndead: true,
		isLarge: true,
		loot: '50% bone, 50% skull',
		vuln: 'silver'+','+DamageType.SMITE
	},
	"soldierAnt": {
		core: [ SYM, 1, '2:22', 'evil', 'bite', 'dc-mon/animals/soldier_ant.png', 'it' ],
		name: "soldier ant",
		brainAlertFriends: true,
		loot: '10% potion, 20% facetedEye, 10% antGrubMush',
		isAnimal: true,
		isSmall: true,
		speed: 1.5,
		vuln: 'glass'+','+DamageType.FREEZE
	},
	"troll": {
		core: [ SYM, 49, '3:6', 'evil', 'claw', 'dc-mon/troll.png', '*' ],
		brainRavenous: true,
		loot: '50% trollHide, 10% coin, 20% trollBlood',
		isEarthChild: true,
		isLarge: true,
		regenerate: 0.15,
		vuln: DamageType.BURN
	},
	"viper": {
		core: [ SYM, 44, '3:16', 'evil', 'bite', 'dc-mon/animals/viper.png', 'it' ],
		attitude: Attitude.HESITANT,
		dodge: 2,
		isAnimal: true,
		loot: '40% viperVenom',
		speed: 2.0
	},

// LUNAR
	"lunarOne": {
		core: [ SYM, 12, '3:10', 'lunar', 'freeze', 'dc-mon/deep_elf_demonologist.png', '*' ],
		name: "lunar one",
		brainAlertFriends: true,
		brainTalk: true,
		immune: DamageType.FREEZE,
		inventoryLoot: '3x 50% potion.eCold',
		isLunarChild: true,
		loot: '2x 50% coin, 40% lunarEssence',
		rarity: 1.0,
		vuln: LunarVulnerabilities
	},
	"lunarReaper": {
		core: [ SYM, 9, '3:10', 'lunar', 'freeze', 'dc-mon/deep_elf_high_priest.png', '*' ],
		name: "lunar reaper",
		brainAlertFriends: true,
		brainTalk: true,
		immune: DamageType.FREEZE,
		isLunarChild: true,
		loot: '2x 50% coin, 40% lunarEssence',
		rarity: 1.0,
		travelType: 'fly',
		vuln: LunarVulnerabilities,
		inventoryLoot: { typeFilter: 'spell.eCold', rechargeTime: 1, hitsToKillPlayer: 3}
	},

// NEUTRAL TEAM
	"bat": {
		core: [ SYM, 1, '2:20', 'neutral', 'bite', 'dc-mon/animals/giant_bat.png', 'it' ],
		attitude: Attitude.WANDER,
		dodge: 2,
		isAnimal: true,
		isBat: true,
		loot: '50% batWing',
		packAnimal: true,
		senseInvisible: true,
		senseLife: true,
		travelMode: "fly"
	},
	"spinyFrog": {
		core: [ SYM, 39, '3:10', 'neutral', 'stab', 'dc-mon/animals/spiny_frog.png', 'it' ],
		name: "spiny frog",
		attitude: Attitude.WANDER,
		immune: [DamageType.POISON,'mud'].join(','),
		isAnimal: true,
		loot: '50% frogSpine',
	},
	"sheep": {
		core: [ SYM, 1, '1:20', 'neutral', 'bite', 'dc-mon/animals/sheep.png', 'it' ],
		attitude: Attitude.FEARFUL,
		isAnimal: true,
		isSheep: true,
		loot: '1x lumpOfMeat, 3x 50% wool',
		packAnimal: true
	}
};


(function() {
	// 		core: [ '@', 1, '3:10', 'good', 'cut', 'dc-mon/elf.png', 'he' ],
	for( let typeId in MonsterTypeList ) {
		monsterPreProcess(typeId,MonsterTypeList[typeId]);
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
		effectApply( self.effect, toucher, null, self );
	}
	else {
		tell(mSubject,toucher,' ',mVerb,'touch',' ',mObject,self,' but ',mVerb,'are',' already blind.');
	}
}

TileTypeList.crystal.onTouch = function(entity,self) {
	if( entity.speed <= 1 ) {
		tell(mSubject,entity,' ',mVerb,'touch',' ',mObject,self,' and ',mSubject|mVerb,'blur',' with speed!');
		effectApply( self.effect, toucher, null, self );
	}
	else {
		tell( mSubject,entity,' ',mVerb,'touch',' ',mObject,self,', but ',mVerb,'are',' already moving fast.');
	}
}

TileTypeList.pit.isProblem = function(entity,self) {
	if( entity.travelMode == 'walk' ) {
		// This is a temporary fix to the problem that dogs that can jump are allowed to enter
		// pit squares but might actually have no viable path out...
		return Prob.DEATH;
	}
	if( entity.travelMode == 'walk' && (!entity.jumpMax || entity.jump>0) ) {
		return Prob.DEATH;
	}
	if( entity.travelMode == 'walk' && entity.attitude !== Attitude.AGGRESSIVE ) {
		return Prob.MILD;
	}
	return Prob.NONE;
}


TileTypeList.pit.onTouch = function(entity,self) {
	if( entity.travelMode == "walk" && !entity.jump ) {
		tell(mSubject|mCares,entity,' ',mVerb,'are',' at the edge of ',mObject,self);
	}
}

TileTypeList.flames.onEnterType = function(entity,self) {
	tell( mSubject|mCares,entity,' ',mVerb,'enter',' ',mObject,self,'.' );
}

TileTypeList.flames.onDepartType = function(entity,self) {
	tell( mSubject|mCares,entity,' ',mVerb,'leave',' ',mObject,self,'.' );
}

TileTypeList.flames.getDamage = function(toucher,self) {
	return value
}

TileTypeList.flames.isProblem = function(entity,self) {
	if( entity.isImmune(self.damageType) ) {
		return Prob.NONE;
	}
	let valueDamage = self.effect.valueDamage;
	let damage = Math.max(1,Math.floor(new Picker(entity.area.depth).pickDamage(entity.area.depth,self.rechargeTime) * valueDamage))
	let ratio = damage/entity.health;
	if( ratio <= 0.3 ) return Prob.MILD;
	if( ratio <= 0.7 ) return Prob.HARSH;
	return Prob.DEATH;
}

TileTypeList.flames.onTouch = function(toucher,self) {
	// We could pass in an onDamage that would also catch you on fire...
	let valueDamage = self.effect.valueDamage;
	let effect = Object.assign( {}, self.effect, { valueDamage: valueDamage } );
	effect = new Picker(toucher.area.depth).assignEffect(effect);
	effectApply( effect, toucher, null, self );
}

TileTypeList.lava.onEnterType = function(entity,self) {
	tell( mSubject|mCares,entity,' ',mVerb,'enter',' ',mObject,self,'.' );
}

TileTypeList.lava.onDepartType = function(entity,self) {
	tell( mSubject|mCares,entity,' ',mVerb,'leave',' ',mObject,self,'.' );
}

TileTypeList.lava.isProblem = function(entity,self) {
	if( entity.isImmune(self.damageType) || entity.travelMode !== 'walk' ) {
		return Prob.NONE;
	}
	let valueDamage = self.effect.valueDamage;
	let damage = Math.max(1,Math.floor(new Picker(entity.area.depth).pickDamage(entity.area.depth,0) * valueDamage))
	let ratio = damage/entity.health;
	if( ratio <= 0.3 ) return Prob.MILD;
	if( ratio <= 0.7 ) return Prob.HARSH;
	return Prob.DEATH;
}

TileTypeList.lava.onTouch = function(toucher,self) {
	// We could pass in an onDamage that would also catch you on fire...
	if( toucher.travelMode == "walk" && !toucher.jump ) {
		let effect = new Picker(toucher.area.depth).assignEffect(self.effect);
		effectApply( effect, toucher, null, self );
	}
}

TileTypeList.mud.isProblem = function(entity,self) {
	if( entity.travelMode == "walk" ) {
		return Prob.HARSH;
	}
	return Prob.NONE;
}

TileTypeList.mud.onEnterType = function(entity,self) {
	if( entity.travelMode == "walk" && !entity.jump ) {
		tell( mSubject|mCares,entity,' ',mVerb,'enter',' ',mObject,self,'.' );
	}
}

TileTypeList.mud.onDepartType = function(entity,self) {
	if( entity.travelMode == "walk" && !entity.jump ) {
		tell( mSubject|mCares,entity,' ',mVerb,'escape',' ',mObject,self,'.' );
	}
}

TileTypeList.mud.onDepart = function(entity,self) {
	if( entity.travelMode == "walk" && entity.jump ) {
		return;
	}

	if( entity.isImmune(self.typeId) || ( entity.isResist(self.typeId) && Math.chance(50) ) ) {
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
		x: 			self.x,
		y: 			self.y,
		img: 		StickerList.oreChaff.img, //self.imgGet(self),
		duration: 	0.2,
		onInit: 		a => { a.create(6); },
		onSpriteMake: 	s => { s.sScaleSet(0.3).sVel(Math.rand(-90,90),Math.rand(2,5)); s.zOrder=100; },
		onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel).sGrav(40).sRot(360); }
	});
	new Anim( {}, {
		x: 			self.x,
		y: 			self.y,
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



TileTypeList.forcefield.onEnterType = function(entity,self) {
	if( entity.isImmune(self.typeId) || ( entity.isResist(self.typeId) && Math.chance(50) ) ) {
		return;
	}

	if( Math.chance(70) ) {
		tell( mSubject|mCares,entity,' ',mVerb,'is',' stopped by the ',mObject,self,'.' );
		return false;
	}
}

TileTypeList.ghostStone.onTouch = function(toucher,self) {
	if( !toucher.invisible ) {
		tell( mSubject,toucher,' ',mVerb,['touch','touches'],' ',mObject,self,'.' );
		effectApply( this.effect, toucher, null, self );
	}
	else {
		tell( mSubject,toucher,' ',mVerb,'touch',' ',mObject,self,', but ',mVerb,'are',' already invisible.');
	}
}

ItemTypeList.altar.onTouch = function(toucher,self) {
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

ItemTypeList.sign.imgChoose = function(map,x,y) {
	let tile = map.tileTypeGet(x,y);
	let item = map.findItemAt(x,y).filter(item=>!item.mayWalk).first;
	if( !tile.mayWalk || item ) {
		this.img = this.imgChoices[item && item.isTable ? 'onTable' : 'onWall'].img;
		return;
	}
	this.img = this.imgChoices.standing.img;
}

ItemTypeList.fontSolar.onTick = function(dt) {
	let nearby = new Finder(this.area.entityList,this).filter(e=>e.team==Team.GOOD).nearMe(1);
	let self = this;
	nearby.process( entity => {
		let deed = DeedManager.findFirst( d=>d.isSolarRegen );
		if( deed ) {
			deed.timeLeft = 4;
		}
		else {
			let effect = self.area.picker.assignEffect({ isSolarRegen: true, op: 'add', stat: 'regenerate', value: 0.05, duration: 4, icon: EffectTypeList.eRegeneration.icon });
			effectApply(effect,entity,null,self);
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
	let nearby = new Finder(this.area.entityList,this).filter(e=>e.team==Team.GOOD).nearMe(2);
	let self = this;
	nearby.process( entity => {
		entity.inventory.forEach( item => item.resetRecharge() );
	});
	if( this.isRecharged() ) {
		nearby.process( entity => {
			let damage = new Picker(self.area.depth).pickDamage(self.area.depth,self.rechargeTime,self);
			entity.takeDamagePassive( null, self, damage, self.damageType || DamageType.ROT );
		});
		this.resetRecharge();
	}
}



MonsterTypeList.spinyFrog.onAttacked = function(attacker,amount,damageType) {
	if( attacker.command == Command.THROW || this.getDistance(attacker.x,attacker.y) > 1 ) {
		return;
	}

	if( attacker.isImmune(StuffList.frogSpine.typeId) ) {
		tell(mSubject,attacker,' ',mVerb,'is',' protected from the ',mObject|mPossessive,this,' spines.');
		return;
	}
	let damage = this.rollDamage(this.naturalMeleeWeapon.damage);
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

MonsterTypeList.redOoze.rescale = function() {
	let healthScale = ((Math.max(this.health,this.healthMax) / this.healthMax) - 1) / (this.growLimit-1);
	this.scale = 0.50 + 1.00*healthScale;	// should make the ooze grow when health is beyond max.
	if( this.spriteList ) {
		for( let i=0 ; i<this.spriteList.length ; ++i ) {
			this.spriteList[i].baseScale = this.scale;
		}
	}
	console.log( "Scale is now "+this.scale );
}

MonsterTypeList.redOoze.onAttacked = function() {
	this.rescale.call(this);
}

MonsterTypeList.redOoze.onMove = function(x,y) {
	let f = this.map.findItemAt(x,y).filter( i=>i.isCorpse );
	if( f.first && this.health < this.healthMax*this.growLimit ) {
		tell(mSubject,this,' ',mVerb,'absorb',' ',mObject,f.first,' and ',mVerb,'regain',' strength!');
		let heal = Math.floor(this.healthMax * 0.25);
		this.takeHealing(this,heal,DamageType.CORRODE,true,true);
		this.rescale.call(this)

		let self = this;
		let anim = new Anim({},{
			follow: 	this,
			img: 		this.img,
			duration: 	0.3,
			onInit: 		a => { a.puppet(self.spriteList); },
			onSpriteTick: 	s => {
				let scale = 1.0+s.sSine(s.sPct(),1.5);
				console.log( "Scale="+scale );
				s.sScaleSet(scale);
			},
			onSpriteDone: 	s => { s.sReset(); }
		});

		f.first.destroy();
	}
}

StuffList.sunCrystal.onTick = function(dt) {
	if( this.owner.isMap ) {
		let tile = adhoc(this.map.tileTypeGet(this.x,this.y),this.map,this.x,this.y);
		effectApply(this.effect,tile,this.ownerOfRecord,this);
	}
}

function commandToKey(command) {
	let keyMap = loadKeyMapping();
	let key;
	Object.each( keyMap, (c,k) => { if( c==command ) key=k; });
	return key;
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
		v: Command.DEBUGVIEW,
		z: Command.DEBUGANIM,
		i: Command.INVENTORY,
		q: Command.QUAFF,
		t: Command.THROW,
		s: Command.SHOOT,
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

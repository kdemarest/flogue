// STATIC DATA

// WARNING: The strings for directions MUST remain the same for commandToDirection() to work.
const Command = { NONE: "none", N:"N", NE:"NE", E:"E", SE:"SE", S:"S", SW:"SW", W:"W", NW:"NW", WAIT: "wait", 
				INVENTORY: "inventory", PICKUP: "pickup", QUAFF: "quaff", GAZE: "gaze", THROW: "throw", SHOOT: "shoot",
				FAVORITE: "favorite",
				LOSETURN: "lose turn", PRAY: "pray", EAT: "eat", ENTERGATE: "enterGate",
				ATTACK: "attack", USE: "use", LOOT: "loot", DROP: "drop", PICKUP: "pickup",
				BUY: "buy", SELL: "sell", CRAFT: "craft", BUSY: "busy",
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

// If you change this, you must also chance the .css class .tile
let TILE_DIM = 48;
let MapVis = 8;		// The vision distance used when actually drawing your map display, casting light etc.
let MaxVis = 8;		// The vision distance max any monster can see
let TILE_UNKNOWN = ' ';		// reserved so that map creation can look sane.
let SymbolToType = {};
let TypeIdToSymbol = {};
let SYM = 111;

// Pathfinding and terrain isProblem
let Prob = {
	NONE:  0.0,
	ENTITY: 0.2,		// be wary of changing this!
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
	CORPSE: 25,
	ITEM: 26,
	SIGN: 28,
	MONSTER: 30,
	OTHER: 40,
	MIST: 50,
	ANIM: 100
};

let MONSTER_SCALE_VARIANCE_MIN = 0.75;
let MONSTER_SCALE_VARIANCE_MAX = 1.00;

Gab = {
};

DynamicViewList = {
	none: { tick: ()=>{}, render: ()=>{} }
};

const StickerList = {
	wallProxy: { img: "dc-dngn/wallProxy.png" },
	observerProxy: { img: "gems/Gem Type2 Yellow.png" },
	enemyProxy: { img: "gems/Gem Type2 Red.png" },
	friendProxy: { img: "gems/Gem Type2 Green.png" },
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
	glowRed: { img: "effect/glowRed.png" },
	glowGold: { img: "effect/glowGold.png" },
	showImmunity: { img: 'gui/icons/eImmune.png' },
	showResistance: { img: 'gui/icons/eResist.png' },
	showVulnerability: { img: 'gui/icons/eVuln.png' },
	showDodge: { img: 'gui/icons/iDodge.png' },
	showEat: { img: 'gui/icons/activityEat.png' },
	coinSingle: { img: 'item/misc/coinOne.png' },
	eGeneric: { img: "gui/icons/eGeneric.png" },
	ePoof: { img: "gui/icons/ePoof.png" },
	alert: { img: "gui/icons/alert.png" },
	locked: { img: "gui/icons/locked.png" },
	unlock: { img: "gui/icons/unlock.png" },
	open: { img: "gui/icons/open.png" },
	selectBox: { img: "gui/selectBox.png", scale: 1.0, xAnchor: 0, yAnchor: 0 },
	hit: { img: "effect/bolt04.png", scale: 0.4, xAnchor: 0.5, yAnchor: 0.5 },
	invisibleObserver: { img: "spells/enchantment/invisibility.png" },
	crosshairYes: { img: "dc-misc/cursor_green.png", scale: 1.0, xAnchor: 0, yAnchor: 0 },
	crosshairNo:  { img: "dc-misc/travel_exclusion.png", scale: 1.0, xAnchor: 0, yAnchor: 0 },
	sortAscending: { img: 'gui/sortAscending.png' },
	sortDescending: { img: 'gui/sortDescending.png' },
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
let ARMOR_SCALE = 100;

const MiscImmunity = { SPEED: "speed", LOSETURN: "loseTurn", IMMOBILE: "immobile", GAS: "gas", MUD: "mud", FORCEFIELD: "forceField" };


const DamageType = { CUT: "cut", STAB: "stab", BITE: "bite", CLAW: "claw", BASH: "bash", BURN: "burn", FREEZE: "freeze", SHOCK: "shock", CORRODE: "corrode", POISON: "poison", SMITE: "smite", ROT: "rot" };
const PhysicalDamage = [DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.BASH].join(',');
const EffectShape = { SINGLE: "single", BLAST3: "blast3", BLAST5: "blast5", BLAST7: "blast7" };
const ArmorDefendsAgainst = [DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.BASH];
const ShieldDefendsAgainst = [DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.BASH];
const ShieldBlocks = [DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.BASH,DamageType.BURN,DamageType.FREEZE,DamageType.SHOCK,DamageType.CORRODE,DamageType.POISON,DamageType.SMITE,DamageType.ROT];
const Attitude = { ENRAGED: "enraged", CONFUSED: "confused", PANICKED: "panicked",
				FEARFUL: "fearful", CALM: "calm",
				AWAIT: "await", WORSHIP: "worshipping",
				AGGRESSIVE: "aggressive", PATROL: "patroling", HUNT: "hunting", HESITANT: "hesitant", WANDER: "wandering" };
const Team = { EVIL: "evil", GOOD: "good", NEUTRAL: "neutral", LUNAR: "lunar"};
const Job = { SMITH: "smith", BREWER: "brewer", ARMORER: "armorer", LAPIDARY: "lapidary", JEWELER: "jeweler" };
const Slot = { HEAD: "head", NECK: "neck", ARMS: "arms", HANDS: "hands", FINGERS: "fingers", WAIST: "waist", HIP: "hip", FEET: "feet", ARMOR: "armor", WEAPON: "weapon", AMMO: "ammo", SHIELD: "shield" };
const PickIgnore = ['mud','forceField'];
const PickVuln   = [DamageType.BURN,DamageType.FREEZE,DamageType.SHOCK,DamageType.POISON,DamageType.SMITE,DamageType.ROT];
const PickResist = [DamageType.BURN,DamageType.FREEZE,DamageType.SHOCK,DamageType.POISON,DamageType.SMITE,DamageType.ROT];
const PickAbsorb = [DamageType.CUT,DamageType.STAB,DamageType.BASH,DamageType.BURN,DamageType.FREEZE,DamageType.SHOCK,DamageType.SMITE,DamageType.ROT];
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
	eKillLabel: 	{ level:  0, rarity: 1.00, op: 'killLabel', isInstant: 1, icon: false },	
// Tactical
	eLuminari: 		{ isTac: 1, level:  0, rarity: 1.00, op: 'add', stat: 'light', value: 6, xDuration: 5.0, isPlayerOnly: 1, name: 'luminari', icon: 'gui/icons/eLuminari.png' },
	eDarkness: 		{ isTac: 1, level:  0, rarity: 1.00, op: 'add', stat: 'dark', value: 12, xDuration: 5.0, isPlayerOnly: 1, name: 'darkness', icon: 'gui/icons/eLuminari.png' },
//	eMap: 			{ isTac: 1, level:  null, rarity: 0.50, op: 'fillMinimap', isPlayerOnly: 1, name: 'map' },
	eGreed: 		{ isTac: 1, level:  0, rarity: 0.50, op: 'set', stat: 'senseTreasure', value: true, xDuration: 5.0, isPlayerOnly: 1, name: 'greed', icon: 'gui/icons/eVision.png' },
	eEcholoc: 		{ isTac: 1, level:  0, rarity: 0.50, op: 'set', stat: 'senseLiving', value: true, xDuration: 5.0, isPlayerOnly: 1, name: 'bat sense', icon: 'gui/icons/eVision.png' },
	eSeeInvisible: 	{ isTac: 1, level:  0, rarity: 0.50, op: 'set', stat: 'senseInvisible', value: true, xDuration: 5.0, isHelp: 1, name: 'see invisible', icon: 'gui/icons/eVision.png' },
	eXray: 			{ isTac: 1, level:  0, rarity: 0.20, op: 'set', stat: 'senseXray', value: true, xDuration: 5.0, isPlayerOnly: 1, name: 'earth vision', icon: 'gui/icons/eVision.png' },
	eTeleport: 		{ isTac: 1, level:  0, rarity: 1.00, op: 'teleport', isInstant: true, xRecharge: 2.0, isHelp: true, name: 'teleport', icon: 'gui/icons/eTeleport.png' },
	eOdorless: 		{ isTac: 1, level:  0, rarity: 1.00, op: 'max', stat: 'scentReduce', value: SCENT_AGE_LIMIT, isHelp: true, name: 'no scent', icon: 'gui/icons/eFragrance.png' },
	eStink: 		{ isTac: 1, level:  0, rarity: 1.00, op: 'max', stat: 'stink', value: 0.8, isHarm: true, name: 'stink', icon: 'gui/icons/eFragrance.png' },
	eBloodhound: 	{ isTac: 1, level:  0, rarity: 1.00, op: 'set', stat: 'senseSmell', value: 100, isHelp: true, name: 'bloodhound', icon: 'gui/icons/eFragrance.png' },
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
	eAbsorbRot: 	{ isBuf: 1, level:  0, rarity: 0.50, op: 'add', stat: 'resist', value: DamageType.ROT,
					isHelp: 1, namePattern: 'deflect rot', icon: 'gui/icons/eResist.png' },
	eBlock: 		{ isBuf: 1, level:  0, rarity: 0.50, op: 'add', stat: 'resist',
					valuePick: () => pick(PickAbsorb), isHelp: 1, namePattern: 'block {value}s', icon: 'gui/icons/eResist.png' },
	eInvisibility: 	{ isBuf: 1, level:  0, rarity: 0.20, op: 'set', stat: 'invisible', value: true, isHelp: 1, requires: e=>!e.invisible, xDuration: 3.0, xRecharge: 1.5, icon: 'gui/icons/eInvisible.png' },
	eIgnore: 		{ isBuf: 1, level:  0, rarity: 1.00, op: 'add', stat: 'immune',
					valuePick: () => pick(PickIgnore), isHelp: 1, namePattern: 'ignore {value}', icon: 'gui/icons/eImmune.png' },
	eRechargeFast: 	{ isBuf: 1, level:  0, rarity: 0.20, op: 'max', stat: 'rechargeRate', value: 1.3, isHelp: 1, xDuration: 3.0, icon: 'gui/icons/eMagic.png' },
	eMobility: 		{ isBuf: 1, level:  0, rarity: 0.50, op: 'add', stat: 'immune', value: 'eImmobilize',
					isHelp: 1, namePattern: 'mobility', icon: 'gui/icons/eImmune.png' },
	eAssassin: 		{ isBuf: 1, level:  0, rarity: 0.20, op: 'max', stat: 'sneakAttackMult', value: 5,
					isHelp: 1, namePattern: 'deadly assassination', icon: 'gui/icons/eSneakAttack.png' },

// Debuff/Control
// All debuffs are reduced duration or effectiveness based on (critterLevel-potionLevel)*ratio
	eStun: 			{ isDeb: 1, level:  0, rarity: 0.50, op: 'set', stat: 'loseTurn', value: true, isHarm: 1, xDuration: 0.3, icon: 'gui/icons/eShove.png' },
	eShove: 		{ isDeb: 1, level:  0, rarity: 0.50, op: 'shove', value: 2, isInstant: 1, icon: 'gui/icons/eShove.png' },
	eHesitate: 		{ isDeb: 1, level:  0, rarity: 1.00, op: 'set', stat: 'attitude', value: Attitude.HESITANT, isHarm: 1, xDuration: 0.3, icon: 'gui/icons/eAttitude.png' },
	eStartle: 		{ isDeb: 1, level:  0, rarity: 1.00, op: 'set', stat: 'attitude', value: Attitude.PANICKED, isHarm: 1, xDuration: 0.2, icon: 'gui/icons/eFear.png' },
	eVulnerability: { isDeb: 1, level:  0, rarity: 1.00, op: 'add', stat: 'vuln', requires: (e,effect)=>!e.isImmune(effect.value),
					valuePick: () => pick(PickVuln), isHarm: 1, xDuration: 2.0, namePattern: 'vulnerability to {value}', icon: 'gui/icons/eVuln.png' },
	eSlow: 			{ isDeb: 1, level:  0, rarity: 0.20, op: 'sub', stat: 'speed', value: 0.5, isHarm: 1, xDuration: 0.3, requires: e=>e.speed>0.5 },
	eBlindness: 	{ isDeb: 1, level:  0, rarity: 0.30, op: 'set', stat: 'senseBlind', value: true, isHarm: 1, xDuration: 0.25, requires: e=>!e.senseBlind, icon: 'gui/icons/eBlind.png' },
	eConfusion: 	{ isDeb: 1, level:  0, rarity: 0.20, op: 'set', stat: 'attitude', value: Attitude.CONFUSED, isHarm: 1, xDuration: 0.3, icon: 'gui/icons/eAttitude.png' },
	ePanic: 		{ isDeb: 1, level:  0, rarity: 0.20, op: 'set', stat: 'attitude', value: Attitude.PANICKED, isHarm: 1, xDuration: 1.0, icon: 'gui/icons/eFear.png' },
	eRage: 			{ isDeb: 1, level:  0, rarity: 0.20, op: 'set', stat: 'attitude', value: Attitude.ENRAGED, isHarm: 1, xDuration: 0.5, icon: 'gui/icons/eAttitude.png' },
	ePossess: 		{ isDeb: 1, level:  0, rarity: 0.20, op: 'possess', xDuration: 5.0, icon: 'gui/icons/ePossess.png' },
	eDrain: 		{ isDeb: 1, level:  0, rarity: 0.40, op: 'drain', value: 'all', icon: 'gui/icons/eDrain.png' },
	eImmobilize: 	{ isDeb: 1, level:  0, rarity: 0.40, op: 'set', stat: 'immobile', value: 1, requires: e=>!e.immobile, icon: 'gui/icons/eImmobile.png' },

// Healing
	eHealing: 		{ isHel: 1, level:  0, rarity: 1.00, op: 'heal', xDamage: 6.00, isHelp: 1, isInstant: 1, healingType: DamageType.SMITE, icon: 'gui/icons/eHeal.png' },
	eRegeneration: 	{ isHel: 1, level:  0, rarity: 1.00, op: 'add', stat: 'regenerate', value: 0.05, isHelp: 1, xDuration: 2.0, xPrice: 1.5, icon: 'gui/icons/eHeal.png' },
	eCurePoison: 	{ isHel: 1, level:  0, rarity: 1.00, op: 'strip', stripFn: deed=>deed.isPoison || deed.damageType==DamageType.POISON, isHelp: 1, isInstant: 2.0, icon: 'gui/icons/eHeal.png' },
	eCureDisease: 	{ isHel: 1, level:  0, rarity: 1.00, op: 'strip', stripFn: deed=>deed.isDisease, isHelp: 1, isInstant: 2.0, icon: 'gui/icons/eHeal.png' },
// Damage
	eFire: 			{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 1.00, isHarm: 1, isInstant: 1, damageType: DamageType.BURN, mayTargetPosition: true, icon: 'gui/icons/eFire.png' },
	eCold: 			{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 0.80, isHarm: 1, isInstant: 1, damageType: DamageType.FREEZE, mayTargetPosition: true, icon: 'gui/icons/eCold.png' },
	eShock: 		{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 0.70, isHarm: 1, isInstant: 1, damageType: DamageType.SHOCK, icon: 'gui/icons/eShock.png' },
	eShock3: 		{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 0.50, effectShape: EffectShape.BLAST3, isHarm: 1, isInstant: 1, damageType: DamageType.SHOCK, icon: 'gui/icons/eShock.png' },
	eAcid: 			{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 0.90, isHarm: 1, isInstant: 1, damageType: DamageType.CORRODE, icon: 'gui/icons/eCorrode.png' },
	eAcid3: 		{ isDmg: 1, level:  0, rarity: 0.50, op: 'damage', xDamage: 0.50, effectShape: EffectShape.BLAST3, isHarm: 1, isInstant: 1, damageType: DamageType.CORRODE, icon: 'gui/icons/eCorrode.png' },
	eHoly: 			{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 1.00, isHarm: 1, isInstant: 1, damageType: DamageType.SMITE, name: 'smite', icon: 'gui/icons/eSmite.png' },
	eHoly3: 		{ isDmg: 1, level:  0, rarity: 0.50, op: 'damage', xDamage: 0.70, effectShape: EffectShape.BLAST3, isHarm: 1, isInstant: 1, damageType: DamageType.SMITE, name: 'smite', icon: 'gui/icons/eSmite.png' },
	eHoly5: 		{ isDmg: 1, level:  0, rarity: 0.20, op: 'damage', xDamage: 0.60, effectShape: EffectShape.BLAST5, isHarm: 1, isInstant: 1, damageType: DamageType.SMITE, name: 'smite', icon: 'gui/icons/eSmite.png' },
	eHoly7: 		{ isDmg: 1, level:  0, rarity: 0.05, op: 'damage', xDamage: 0.50, effectShape: EffectShape.BLAST7, isHarm: 1, isInstant: 1, damageType: DamageType.SMITE, name: 'smite', icon: 'gui/icons/eSmite.png' },
	eRot: 			{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 1.00, isHarm: 1, isInstant: 1, damageType: DamageType.ROT, icon: 'gui/icons/eRot.png' },
	ePoison: 		{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 0.50, isHarm: 1, isPoison: 1,
					duration: 10, damageType: DamageType.POISON, icon: 'gui/icons/ePoison.png' },
	ePoisonForever: { isDmg: 1, level:  0, rarity: 0.01, op: 'damage', xDamage: 0.05, isHarm: 1, isPoison: 1,
					duration: true, damageType: DamageType.POISON, name: 'mortal poison', icon: 'gui/icons/ePoison.png' },
	eLeech: 		{ isDmg: 1, level:  0, rarity: 0.30, op: 'damage', xDamage: 0.70, isHarm: 1, isInstant: 1, isLeech: 1, damageType: DamageType.ROT, healingType: DamageType.SMITE, icon: 'gui/icons/eLeech.png' },
};

for( let key in EffectTypeList ) {
	// all effect bearing items have a bigger price.
	EffectTypeList[key].xPrice = Rules.effectPriceMultiplierByRarity(EffectTypeList[key].rarity);
}

EffectTypeList.eFire.onTargetPosition = function(map,x,y) {
	map.tileSymbolSet(x,y,TileTypeList.flames.symbol);
}

EffectTypeList.eCold.onTargetPosition = function(map,x,y) {
	map.tileSymbolSet(x,y,TileTypeList.water.symbol);
}

const ImgBridges = {
	NS: { img: "dc-dngn/bridgeNS.png" },
	EW: { img: "dc-dngn/bridgeEW.png" }
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
	"bridge":     { symbol: SYM, mayWalk: true,  mayFly: true,  opacity: 0, name: "bridge", isBridge: true, img: "dc-dngn/bridgeNS.png", imgChoices: ImgBridges, imgGet: (self,img) => img || self.img },
	"water":      { symbol: '~', mayWalk: true,  mayFly: true,  maySwim: true, isWater: true, opacity: 0, mayJump: true, wantsBridge: true, name: "water", img: "dc-dngn/water/dngn_shoals_shallow_water1.png" },
	"grass":      { symbol: SYM, mayWalk: true,  mayFly: true,  opacity: 0, name: "grass", img: "dc-dngn/floor/grass/grass_flowers_blue1.png", isFloor: true },
	"glass":      { symbol: SYM, mayWalk: false, mayFly: false, opacity: 0, name: "glass", img: "dc-dngn/wall/dngn_mirrored_wall.png", isWall: true },
	"shaft":      { symbol: SYM, mayWalk: false, mayFly: true,  opacity: 0, name: "shaft", mayJump: true, img: "dc-dngn/dngn_trap_shaft.png" },
	"flames":     { symbol: SYM, mayWalk: true,  mayFly: true,  opacity: 0.26, isFire: true, name: "flames", light: 9, glow:1,
					effect: { op: 'damage', xDamage: 4.0, damageType: DamageType.BURN, isInstant: 1, icon: 'gui/icons/eFire.png' }, img: "dc-mon/nonliving/fire_elemental.png" },
	"lava":    	  { symbol: SYM, mayWalk: true, mayFly: true,  maySwim: true, opacity: 0, isFire: true, mayJump: true, name: "lava", light: 5, glow:1, 
					effect: { op: 'damage', xDamage: 8.0, damageType: DamageType.BURN, isInstant: 1, icon: 'gui/icons/eFire.png' }, img: "UNUSED/features/dngn_lava.png" },
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


let MaxLightValue = 15;
let LightFullBrightDistance = 7;	// how many squares light casts.

let LightAlpha = [];
// This makes the assumption that a 
for( let i=-MaxLightValue-20 ; i<MaxLightValue+20 ; ++i ) {
	LightAlpha[i] = Math.clamp(i/LightFullBrightDistance,0.0,1.0);
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
	let xDamage = ItemCalc(self,self,'xDamage','*');
	let damage = Math.max(1,Math.floor(Rules.pickDamage(entity.area.depth,self.rechargeTime) * xDamage))
	let ratio = damage/entity.health;
	if( ratio <= 0.3 ) return Prob.MILD;
	if( ratio <= 0.7 ) return Prob.HARSH;
	return Prob.DEATH;
}

TileTypeList.flames.onTouch = function(toucher,self) {
	// We could pass in an onDamage that would also catch you on fire...
	let xDamage = ItemCalc(self,self,'xDamage','*');
	let effect = Object.assign( {}, self.effect, { xDamage: xDamage } );
	effect = new Effect( toucher.area.depth, effect );
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
	let xDamage = ItemCalc(self,self,'xDamage','*');
	let damage = Math.max(1,Math.floor(Rules.pickDamage(entity.area.depth,0) * xDamage))
	let ratio = damage/entity.health;
	if( ratio <= 0.3 ) return Prob.MILD;
	if( ratio <= 0.7 ) return Prob.HARSH;
	return Prob.DEATH;
}

TileTypeList.lava.onTouch = function(toucher,self) {
	// We could pass in an onDamage that would also catch you on fire...
	if( toucher.travelMode == "walk" && !toucher.jump ) {
		let effect = new Effect(toucher.area.depth,self.effect);
		effectApply( effect, toucher, null, self );
	}
}

TileTypeList.mud.isProblem = function(entity,self) {
	if( !entity.isImmune(self.typeId) && entity.travelMode == "walk" ) {
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


TileTypeList.bridge.imgChoose = function(map,x,y) {
	let w = map.tileTypeGet(x-1,y);
	let e = map.tileTypeGet(x+1,y);
	let n = map.tileTypeGet(x,y-1);
	let s = map.tileTypeGet(x,y+1);
	if( w.isPit && e.isPit ) {
		this.img = this.imgChoices.NS.img;
		return;
	}
	this.img = this.imgChoices.EW.img;
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
		f: Command.FAVORITE,
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

Module.add('data',function(extern){

// STATIC DATA

// WARNING: The strings for directions MUST remain the same for Direction.fromCommand() to work.
const Command = { NONE: "none", N:"N", NE:"NE", E:"E", SE:"SE", S:"S", SW:"SW", W:"W", NW:"NW", WAIT: "wait", 
				INVENTORY: "inventory", PICKUP: "pickup", QUAFF: "quaff", GAZE: "gaze", THROW: "throw", SHOOT: "shoot", TRIGGER: "trigger",
				FAVORITE: "favorite",
				LOSETURN: "lose turn", PRAY: "pray", EAT: "eat", ENTERGATE: "enterGate",
				ATTACK: "attack", USE: "use", LOOT: "loot", DROP: "drop", PICKUP: "pickup",
				BUY: "buy", SELL: "sell", CRAFT: "craft", BUSY: "busy", DIG: "dig",
				DEBUGKILL: "debugkill", DEBUGTHRIVE: "debugthrive", DEBUGVIEW: "debugview", DEBUGANIM: "debuganim", DEBUGTEST: "debugtest",
				CAST: "cast", CAST1: "cast1", CAST2: "cast2", CAST3: "cast3", CAST4: "cast4", CAST5: "cast5", QUIT: "quit",
				EXECUTE: "execute", CANCEL: "cancel"
			};

Command.Movement = [Command.N,Command.NE,Command.E,Command.SE,Command.S,Command.SW,Command.W,Command.NW];
Command.Attack =   [Command.ATTACK,Command.THROW,Command.SHOOT,Command.CAST];

const Distance = new class{
	get(dx,dy) {
		return Math.sqrt(dx*dx+dy*dy);
	}
	isNear(dx,dy,dist) {
		return dx*dx+dy*dy <= dist*dist;
	}
	getSq(dx,dy) {
		return Math.max(Math.abs(dx),Math.abs(dy));
	}
};

const Direction = new class {
	constructor() {
		this.add = [
			{ x:0,  y:-1, c:Command.N },
			{ x:1,  y:-1, c:Command.NE },
			{ x:1,  y:0,  c:Command.E },
			{ x:1,  y:1,  c:Command.SE },
			{ x:0,  y:1,  c:Command.S },
			{ x:-1, y:1,  c:Command.SW },
			{ x:-1, y:0,  c:Command.W },
			{ x:-1, y:-1, c:Command.NW }
		];
		this.count = 8;
	}
	fromCommand(command) {
		let c2d = { N: 0, NE: 1, E: 2, SE: 3, S: 4, SW: 5, W: 6, NW: 7 };
		return ( c2d[Command[command]] != undefined ? c2d[Command[command]] : false );
	}
	toCommand(dir) {
		let d2c = [ Command.N, Command.NE, Command.E, Command.SE, Command.S, Command.SW, Command.W, Command.NW ];
		if( dir === false || dir < 0 || dir >= Direction.count ) { debugger; }
		return d2c[dir];
	
	}
	predictable(dx,dy) {
		let dirId = { N: 0, NE: 1, E: 2, SE: 3, S: 4, SW: 5, W: 6, NW: 7 };
		if( dy < 0 ) return dx==0 ? dirId.N : (dx<0 ? dirId.NW : dirId.NE);
		if( dy > 0 ) return dx==0 ? dirId.S : (dx<0 ? dirId.SW : dirId.SE);
		return dx==0 ? false : (dx<0 ? dirId.W : dirId.E);
	} 
	natural(dx,dy) {
		let ax = Math.abs(dx);
		let ay = Math.abs(dy);
		if( ax != ay ) {
			// We want to flatten our trajectory sometimes.
			if( Math.rand(0,ax+ay)<Math.max(ax,ay) ) {
				if( ax < ay ) { dx=0; } else { dy=0; }
			}
		}
		return this.predictable(dx,dy);
	}
};

class ClipRect {
	constructor() {
		this.reset();
	}
	reset() {
		this.xMin = -99999999;
		this.yMin = -99999999;
		this.xMax = 99999999;
		this.yMax = 99999999;
	}
	set(x0,y0,x1,y1) {
		this.xMin = x0;
		this.yMin = y0;
		this.xMax = x1;
		this.yMax = y1;
	}
	setCtr(x,y,dist) {
		this.set(x-dist,y-dist,x+dist,y+dist);
	}
	contains(x,y) {
		return !(x<this.xMin || y<this.yMin || x>this.xMax || y>this.yMax);
	}
};

let IMG_BASE = 'http://localhost:8080/tiles/';

let SymbolForbidden = { ' ': 1, '.': 1, '#': 1 };
let SymbolToType = {};
let TypeIdToSymbol = {};
let SYM = 111;

// If you change this, you must also chance the .css class .tile
let MapVisDefault = 8;	// The vision distance used when actually drawing your map display, casting light etc.
let MaxVis = 8;			// The vision distance max any monster can see

// Pathfinding and terrain isProblem
let Problem = {
	NONE:  0.0,
	TINY: 0.1,
	DOOR: 0.1,		// be wary of changing this!
	ENTITY: 0.2,		// be wary of changing this!
	MILD:  0.3,
	HARSH: 0.7,
	NEARDEATH: 0.9,
	// Do NOT have a value of 1.0 or up to 900000 here. The Path class requires numbers below 1.0 for problem spots.
	WALL:  800000.0,
	DEATH: 900000.0
}

let Tile = {
	DIM: 48,
	UNKNOWN: ' ',
	FLOOR: '.',
	WALL: '#',
	zOrder: {
		FLOOR: 6,
		TILE: 8,
		WALL: 10,
		GATE: 20,
		TABLE: 24,
		DECOR: 22,
		CORPSE: 25,
		ITEM: 26,
		SIGN: 28,
		MONSTER: 30,
		OTHER: 40,
		MIST: 50,
		ANIM: 100
	}
}


Gab = {
};

const StickerList = {
	mmWall: { img: "dc-dngn/wallProxy.png" },
	mmObserver: { img: "gems/Gem Type2 Yellow.png" },
	mmEnemy: { img: "gems/Gem Type2 Red.png" },
	mmFriend: { img: "gems/Gem Type2 Green.png" },
	mmGate: { img: "gems/Gem Type2 Green.png" },
	mmGateDown: { img: "gems/Gem Type2 Purple.png" },
	mmGateTown: { img: "gems/Gem Type2 Blue.png" },
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
	cloudPoison: { img: "effect/cloudPoison96.png" },
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
	perception: { img: "gui/icons/perception.png" },
	selectBox: { img: "gui/selectBox.png", scale: 1.0, xAnchor: 0, yAnchor: 0 },
	hit: { img: "effect/bolt04.png", scale: 0.4, xAnchor: 0.5, yAnchor: 0.5 },
	// WARNING: This is used very special-case in the ViewMap.
	invisibleObserver: { img: "spells/enchantment/invisibility.png" },
	crosshairYes: { img: "dc-misc/cursor_green.png", scale: 1.0, xAnchor: 0, yAnchor: 0 },
	crosshairNo:  { img: "dc-misc/travel_exclusion.png", scale: 1.0, xAnchor: 0, yAnchor: 0 },
	sortAscending: { img: 'gui/sortAscending.png' },
	sortDescending: { img: 'gui/sortDescending.png' },
	arrowInFlight: { img: 'effect/arrowInFlight.png' },
	dartInFlight: { img: 'effect/dartInFlight.png' },
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
	// WARNING - these names are direct equivalents to the damage type names, and must align/
	cutIcon: { img: 'gui/icons/damageCut.png' },
	stabIcon:  { img: 'gui/icons/damageStab.png' },
	biteIcon: { img: 'gui/icons/damageBite.png' },
	clawIcon: { img: 'gui/icons/damageClaw.png' },
	bashIcon: { img: 'gui/icons/damageBash.png' },
	burnIcon: { img: 'gui/icons/eBurn.png' },
	lightIcon: { img: 'gui/icons/eLight.png' },
	freezeIcon: { img: 'gui/icons/eFreeze.png' },
	shockIcon: { img: 'gui/icons/eShock.png' },
	corrodeIcon: { img: 'gui/icons/eCorrode.png' },
	poisonIcon: { img: 'gui/icons/ePoison.png' },
	smiteIcon: { img: 'gui/icons/eSmite.png' },
	rotIcon: { img: 'gui/icons/eRot.png' },
};

const Quick = {
	CLUMSY: 1,
	NORMAL: 2,
	NIMBLE: 3,
	LITHE: 4
}
const QuickName = ['','clumsy','normal','nimble','lithe'];

// Probably should do this at some point.
//const Travel = { WALK: 1, FLY: 2, SWIM: 4 };

const MiscImmunity = { SPEED: "speed", STUN: "stun", IMMOBILE: "immobile", GAS: "gas", MUD: "mud", FORCEFIELD: "forceField", HEALING: "healing" };


// WARNING: the damage type names are re-used in their icon names in StickerList. Maintain both.
const DamageType = { CUT: "cut", STAB: "stab", BITE: "bite", CLAW: "claw", CHOP: "chop", BASH: "bash", BURN: "burn", FREEZE: "freeze", WATER: "water", LIGHT: "light", SHOCK: "shock", CORRODE: "corrode", POISON: "poison", SMITE: "smite", ROT: "rot" };
const Damage = {
	All: 		Object.values(DamageType).join(',')+','+Object.values(MiscImmunity).join(','),
	Misc: 		Object.values(MiscImmunity).join(','),
	Physical: 	[DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.CHOP,DamageType.BASH].join(','),
	Physical2: 	[DamageType.CORRODE,DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.BASH].join(','),
	Elemental: 	[DamageType.BURN,DamageType.FREEZE,DamageType.SHOCK,DamageType.WATER].join(','),
	Divine: 	[DamageType.SMITE,DamageType.ROT].join(',')
};


const EffectShape = { SINGLE: "single", BLAST2: 'blast2', BLAST3: 'blast3', BLAST4: 'blast4', BLAST5: "blast5", BLAST6: "blast6" };
const ArmorDefendsAgainst = [DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.CHOP,DamageType.BASH];
const ShieldDefendsAgainst = [DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.CHOP,DamageType.BASH];
const Attitude = { ENRAGED: "enraged", CONFUSED: "confused", PANICKED: "panicked", PACIFIED: "pacified",
				FEARFUL: "fearful", CALM: "calm", BUSY: "busy",
				AWAIT: "await", WORSHIP: "worshipping",
				AGGRESSIVE: "aggressive", PATROL: "patroling", HUNT: "hunting", HESITANT: "hesitant", WANDER: "wandering" };
const Team = { EVIL: "evil", GOOD: "good", NEUTRAL: "neutral", LUNAR: "lunar"};
const Job = { SMITH: "smith", BREWER: "brewer", ARMORER: "armorer", LAPIDARY: "lapidary", JEWELER: "jeweler" };
const Slot = { HEAD: "head", NECK: "neck", ARMS: "arms", HANDS: "hands", FINGERS: "fingers", WAIST: "waist", HIP: "hip", FEET: "feet", ARMOR: "armor", WEAPON: "weapon", AMMO: "ammo", SHIELD: "shield", SKILL: "skill" };
const PickIgnore  		= ['mud','forceField'];
const PickVuln    		= [DamageType.BURN,DamageType.FREEZE,DamageType.SHOCK,DamageType.POISON,DamageType.SMITE,DamageType.ROT];
const PickResist  		= [DamageType.BURN,DamageType.FREEZE,DamageType.SHOCK,DamageType.POISON,DamageType.SMITE,DamageType.ROT];
const PickDeflect 		= [DamageType.CUT,DamageType.STAB,DamageType.CHOP,DamageType.BASH,DamageType.BURN,DamageType.FREEZE,DamageType.SHOCK,DamageType.SMITE,DamageType.ROT];
const PickBlock   		= [DamageType.CUT,DamageType.STAB,DamageType.CHOP,DamageType.BASH];

// IMMUNITY and RESISTANCE!
// Note that you can be immune to almost anything that is a string. That is, you can be immune to a DamageType,
// or an Attitude, an Effect, or even immune to the effects of 'mud' or 'forcefield' as long as their event handlers check it.

// Effect Events
// onTargetPosition - if this effect is targeting a map tile, instead of a monster.

let EffectTypeList = {
	eInert: 		{ level:  0, isInert: 1 },	// this is special, used in the picker effect proxy! Do not change!
	eBlank: 		{ level:  0, rarity: 1.00, isBlank: 1, name: 'blank paper' },
	eKillLabel: 	{ level:  0, rarity: 1.00, op: 'killLabel', duration: 0, icon: false },	
// Tactical
	eLight: 		{ isTac: 1, level:  0, rarity: 1.00, op: 'max', stat: 'light', value: 6, xDuration: 5.0, isPlayerOnly: 1, name: 'luminari', icon: 'gui/icons/eLight.png', about: 'Sheds light over an area.' },
	eDark: 			{ isTac: 1, level:  0, rarity: 1.00, op: 'add', stat: 'dark', value: 12, xDuration: 5.0, isPlayerOnly: 1, name: 'darkness', icon: 'gui/icons/eLight.png', about: 'Spreads darkness over an area.' },
	eDarkVision: 	{ isTac: 1, level:  0, rarity: 1.00, op: 'max', stat: 'senseDarkVision', value: 6, xDuration: 5.0, isPlayerOnly: 1, name: 'dark vision', icon: 'gui/icons/eLight.png', about: 'Enables seeing in the dark.' },
	eSenseTreasure: { isTac: 1, level:  0, rarity: 0.50, op: 'set', stat: 'senseTreasure', value: true, xDuration: 5.0, isPlayerOnly: 1, name: 'sense treasure', icon: 'gui/icons/eVision.png', about: 'Sense distant treasure through obstacles.' },
	eSenseLiving: 	{ isTac: 1, level:  0, rarity: 0.50, op: 'set', stat: 'senseLiving', value: true, xDuration: 5.0, isPlayerOnly: 1, name: 'sense life', icon: 'gui/icons/eVision.png', about: 'Sense living creatures through obstacles.' },
	eSeeInvisible: 	{ isTac: 1, level:  0, rarity: 0.50, op: 'set', stat: 'senseInvisible', value: true, xDuration: 5.0, isHelp: 1, name: 'see invisible', icon: 'gui/icons/eVision.png', about: 'See invisible things.' },
	eSenseXray: 	{ isTac: 1, level:  0, rarity: 0.20, op: 'set', stat: 'senseXray', value: true, xDuration: 5.0, isPlayerOnly: 1, name: 'xray vision', icon: 'gui/icons/eVision.png', about: 'See through walls.' },
	eSenseSmell: 	{ isTac: 1, level:  0, rarity: 1.00, op: 'set', stat: 'senseSmell', value: 100, isHelp: true, name: 'bloodhound', icon: 'gui/icons/eFragrance.png', about: 'Sharpen your sense of smell.' },
	eTeleport: 		{ isTac: 1, level:  0, rarity: 1.00, op: 'teleport', range2: 0, random: true, duration: 0, xRecharge: 2.0, isHelp: true, name: 'teleport', icon: 'gui/icons/eTeleport.png', about: 'Teleport a target to a new location.' },
	eBlink: 		{ isTac: 1, level:  0, rarity: 1.00, op: 'teleport', targetMe: true, range2: 5, random: false, duration: 0, xRecharge: 2.0, isHelp: true, name: 'blink', icon: 'gui/icons/eTeleport.png', about: 'Teleport yourself a short distance.' },
	eOdorless: 		{ isTac: 1, level:  0, rarity: 1.00, op: 'max', stat: 'scentReduce', value: Rules.SCENT_AGE_LIMIT, isHelp: true, name: 'no scent', icon: 'gui/icons/eFragrance.png', about: 'Hide your scent from olfactory hunters.' },
	eStink: 		{ isTac: 1, level:  0, rarity: 1.00, op: 'max', stat: 'stink', value: 0.8, isHarm: true, name: 'stink', icon: 'gui/icons/eFragrance.png', about: 'Increase the scent of a target to overwhelming levels, hiding other scents.' },
//	eMap: 			{ isTac: 1, level:  null, rarity: 0.50, op: 'fillMinimap', isPlayerOnly: 1, name: 'map' },
// Buff
	eFlight: 		{ isBuf: 1, level:  0, rarity: 0.20, op: 'set', stat: 'travelMode', value: 'fly', isHelp: 1, requires: e=>e.travelMode==e.baseType.travelMode,
					additionalDoneTest: (self) => { return self.target.map.tileTypeGet(self.target.x,self.target.y).mayWalk; }, icon: 'gui/icons/eFly.png', about: 'Fly above pits and many traps.' },
	eJump2: 		{ isBuf: 1, level:  0, rarity: 0.50, op: 'set', stat: 'jumpMax', value: 2, isHelp: 1, icon: 'gui/icons/eHaste.png', about: 'Improve your jump distance to 2.' },
	eJump3: 		{ isBuf: 1, level:  0, rarity: 0.50, op: 'set', stat: 'jumpMax', value: 3, isHelp: 1, icon: 'gui/icons/eHaste.png', about: 'Improve your jump distance to 3.' },
	eHaste: 		{ isBuf: 1, level:  0, rarity: 0.30, op: 'add', stat: 'speed', value: 1, isHelp: 1, xPrice: 3, requires: e=>e.speed<5, icon: 'gui/icons/eHaste.png', about: 'Move one extra square per round.' },
	eBravery: 		{ isBuf: 1, level:  0, rarity: 0.50, op: 'add', stat: 'immune', value: Attitude.PANICKED, isHelp: 1, xPrice: 3, name: 'bravery', icon: 'gui/icons/eImmune.png', about: 'Immunity to panic.' },
	eClearMind: 	{ isBuf: 1, level:  0, rarity: 0.50, op: 'add', stat: 'immune', value: Attitude.CONFUSED, isHelp: 1, xPrice: 3, name: 'clear mind', icon: 'gui/icons/eImmune.png', about: 'Immunity to confusion.' },
	eStalwart: 		{ isBuf: 1, level:  0, rarity: 0.50, op: 'add', stat: 'immune', value: Attitude.HESITANT, isHelp: 1, xPrice: 3, name: 'stalwart', icon: 'gui/icons/eImmune.png', about: 'Immunity to hesitation.' },
	eIronWill: 		{ isBuf: 1, level:  0, rarity: 0.30, op: 'add', stat: 'immune', value: 'possess', isHelp: 1, xPrice: 3, name: 'iron will', icon: 'gui/icons/eImmune.png', about: 'Immune to possession by malign minds.' },
	eMentalFence: 	{ isBuf: 1, level:  0, rarity: 0.20, op: 'add', stat: 'resist', value: [Attitude.HESITANT,Attitude.PANICKED,Attitude.CONFUSED,'possess'].join(','), isHelp: 1, xPrice: 3, xDuration: 3, name: 'mental fence', icon: 'gui/icons/eResist.png', about: 'Immunity to panic, confusion, and hesitation.' },
	eMentalWall: 	{ isBuf: 1, level:  0, rarity: 0.05, op: 'add', stat: 'immune', value: [Attitude.HESITANT,Attitude.PANICKED,Attitude.CONFUSED,'possess'].join(','), isHelp: 1, xPrice: 6, xDuration: 0.5, name: 'mental wall', icon: 'gui/icons/eImmune.png', about: 'Longer immunity to panic, confusion and hesitation.' },
	eResistance: 	{ isBuf: 1, level:  0, rarity: 0.50, op: 'add', stat: 'resist',
					valuePick: () => pick(PickResist), isHelp: 1, name: 'resist {value}s', icon: 'gui/icons/eResist.png', about: 'Suffer only half the effect of {value}.' },
	eDeflect: 		{ isBuf: 1, level:  0, rarity: 0.50, op: 'add', stat: 'resist',
					valuePick: () => pick(PickDeflect), isHelp: 1, name: 'deflect {value}s', icon: 'gui/icons/eResist.png', about: 'Deflect some incoming {value} damage.' },
	eDeflectRot: 	{ isBuf: 1, level:  0, rarity: 0.50, op: 'add', stat: 'resist', value: DamageType.ROT,
					isHelp: 1, name: 'deflect rot', icon: 'gui/icons/eResist.png', about: 'Deflect incoming rotting effects.' },
	eBlock: 		{ isBuf: 1, level:  0, rarity: 0.50, op: 'add', stat: 'resist',
					valuePick: () => pick(PickDeflect), isHelp: 1, name: 'block {value}s', icon: 'gui/icons/eResist.png', about: 'Block all incoming {value} damage.' },
	eInvisibility: 	{ isBuf: 1, level:  0, rarity: 0.20, op: 'set', stat: 'invisible', value: true, isHelp: 1, 
					doesItems: true, doesTiles: true, requires: e=>!e.invisible, xDuration: 3.0, xRecharge: 1.5, icon: 'gui/icons/eInvisible.png', about: 'Target becomes invisible to sight.' },
	eIgnore: 		{ isBuf: 1, level:  0, rarity: 1.00, op: 'add', stat: 'immune',
					valuePick: () => pick(PickIgnore), isHelp: 1, name: 'ignore {value}', icon: 'gui/icons/eImmune.png', about: 'Target is no longer affected by {value}.' },
	eRechargeFast: 	{ isBuf: 1, level:  0, rarity: 0.20, op: 'max', stat: 'rechargeRate', value: 1.3, isHelp: 1, xDuration: 3.0, icon: 'gui/icons/eMagic.png', about: 'Magic recharges more quickly.' },
	eMobility: 		{ isBuf: 1, level:  0, rarity: 0.50, op: 'add', stat: 'immune', value: 'eImmobilize',
					isHelp: 1, name: 'mobility', icon: 'gui/icons/eImmune.png', about: 'Immunity to immobilization.' },
	eAssassin: 		{ isBuf: 1, level:  0, rarity: 0.20, op: 'max', stat: 'sneakAttackMult', value: 5,
					isHelp: 1, name: 'mortal strike', icon: 'gui/icons/eSneakAttack.png', about: 'Sneak attacks become more effective.' },

// Debuff/Control
// All debuffs are reduced duration or effectiveness based on (critterLevel-potionLevel)*ratio
	eStun: 			{ isDeb: 1, level:  0, rarity: 0.50, op: 'set', isHarm: 1, stat: 'stun', value: true, xDuration: 0.3, icon: 'gui/icons/eShove.png', about: 'Stuns the target, making them unable to move or attack.'  },
	eShove: 		{ isDeb: 1, level:  0, rarity: 0.50, op: 'shove', isHarm: 1, value: 2, duration: 0, icon: 'gui/icons/eShove.png', about: 'Shoves the target away from the attacker.' },
	eHesitate: 		{ isDeb: 1, level:  0, rarity: 1.00, op: 'set', stat:'attitude', isHarm: 1, value: Attitude.HESITANT, isHarm: 1, xDuration: 0.3, icon: 'gui/icons/eAttitude.png', about: 'Target might hesitate and fail to act sometimes.' },
	eStartle: 		{ isDeb: 1, level:  0, rarity: 1.00, op: 'set', stat:'attitude', isHarm: 1, value: Attitude.PANICKED, isHarm: 1, xDuration: 0.2, icon: 'gui/icons/eFear.png', about: 'Startles the target, causing them to briefly flee.' },
	eVulnerability: { isDeb: 1, level:  0, rarity: 1.00, op: 'add', isHarm: 1, stat: 'vuln', requires: (e,effect)=>e.isImmune && !e.isImmune(effect.value),
					valuePick: () => pick(PickVuln), isHarm: 1, xDuration: 2.0, name: 'vulnerability to {value}', icon: 'gui/icons/eVuln.png', about: 'Target will suffer double harm from {value}.' },
	// eNoseless - note there is no way to debuff the ability to smell. You must instead mask your own scent.
	eSlow: 			{ isDeb: 1, level:  0, rarity: 0.20, op: 'sub', isHarm: 1, stat: 'speed', value: 0.5, xDuration: 0.3, requires: e=>e.speed>0.5, icon: 'gui/icons/eSlow.png', about: 'Target will act half as frequently.' },
	eBlindness: 	{ isDeb: 1, level:  0, rarity: 0.30, op: 'set', isHarm: 1, stat: 'senseBlind', value: true, xDuration: 0.25, requires: e=>!e.senseBlind, icon: 'gui/icons/eBlind.png', about: 'Target becomes blind.' },
	eConfusion: 	{ isDeb: 1, level:  0, rarity: 0.20, op: 'set', stat:'attitude', isHarm: 1, value: Attitude.CONFUSED, xDuration: 0.3, icon: 'gui/icons/eAttitude.png', about: 'Target becomes confused, stumbling about randomly.' },
	ePanic: 		{ isDeb: 1, level:  0, rarity: 0.20, op: 'set', stat:'attitude', isHarm: 1, value: Attitude.PANICKED, xDuration: 1.0, icon: 'gui/icons/eFear.png', about: 'Target panics and runs in fear.' },
	eRage: 			{ isDeb: 1, level:  0, rarity: 0.20, op: 'set', stat:'attitude', isHarm: 1, value: Attitude.ENRAGED, xDuration: 0.5, icon: 'gui/icons/eAttitude.png', about: 'Target becomes enraged, attacking friend and foe alike.' },
	ePossess: 		{ isDeb: 1, level:  0, rarity: 0.20, op: 'possess', isHarm: 1, xDuration: 5.0, noPermute: true, icon: 'gui/icons/ePossess.png', about: 'Takes over the target\'s mind, putting you in their body.' },
	eImmobilize: 	{ isDeb: 1, level:  0, rarity: 0.40, op: 'set',     isHarm: 1, stat: 'immobile', value: 1, xDuration: 1.0, requires: e=>!e.immobile, icon: 'gui/icons/eImmobile.png', about: 'Makes a target unable to move for their spot.' },
	eDrain: 		{ isDeb: 1, level:  0, rarity: 0.40, op: 'drain',   isHarm: 1, value: 'all', icon: 'gui/icons/eDrain.png' },

// Healing
	eHealing: 		{ isHel: 1, level:  0, rarity: 1.00, op: 'heal', xDamage: 6.00, isHelp: 1, duration: 0, healingType: DamageType.SMITE, icon: 'gui/icons/eHeal.png', about: 'Heals a target with holy force.' },
	eRegeneration: 	{ isHel: 1, level:  0, rarity: 1.00, op: 'add', stat: 'regenerate', value: 0.01, isHelp: 1, xDuration: 2.0, xPrice: 2.5, icon: 'gui/icons/eHeal.png', about: 'Restores health every round.' },
	eTrollBlood: 	{ isHel: 1, level:  0, rarity: 1.00, op: 'add', stat: 'regenerate', value: 0.02, isHelp: 1, xDuration: 2.0, xPrice: 5.0, icon: 'gui/icons/eHeal.png', about: 'Restores lots of health every round.' },
	eCurePoison: 	{ isHel: 1, level:  0, rarity: 1.00, op: 'strip', stripFn: deed=>deed.isPoison || deed.damageType==DamageType.POISON, isHelp: 1, duration: 0, icon: 'gui/icons/eHeal.png', about: 'Halts any poison in the target.' },
	eCureDisease: 	{ isHel: 1, level:  0, rarity: 1.00, op: 'strip', stripFn: deed=>deed.isDisease, isHelp: 1, duration: 0, icon: 'gui/icons/eHeal.png', about: 'Cures any disease on the target.' },
// Damage
	eBash: 			{ isDmg: 1, level:  0, rarity: 0.00, op: 'damage', xDamage: 1.00, isHarm: 1, duration: 0, damageType: DamageType.BASH, doesItems: true, icon: 'gui/icons/damageBash.png', about: 'Inflicts blunt trauma on the target.' },
	eWater: 		{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 1.00, isHarm: 1, duration: 0, damageType: DamageType.WATER, doesTiles: true, doesItems: true, icon: 'gui/icons/eWater.png', about: 'Wets the target with water. Most demons hate this.' },
	eBurn: 			{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 1.00, isHarm: 1, duration: 0, damageType: DamageType.BURN, doesTiles: true, doesItems: true, icon: 'gui/icons/eBurn.png', about: 'Burns the target.' },
	eFreeze: 		{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 0.80, isHarm: 1, duration: 0, damageType: DamageType.FREEZE, doesTiles: true, doesItems: true, icon: 'gui/icons/eFreeze.png', about: 'Freezes the target.' },
	eShock: 		{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 0.70, isHarm: 1, duration: 0, damageType: DamageType.SHOCK, doesItems: true, icon: 'gui/icons/eShock.png', about: 'Shocks the target with electricity.' },
	eSmite: 		{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 1.00, isHarm: 1, duration: 0, damageType: DamageType.SMITE, doesItems: true, name: 'smite', icon: 'gui/icons/eSmite.png', about: 'Smites the target with holy might.' },
	eRot: 			{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 0.2, isHarm: 1,
					duration: 5, damageType: DamageType.ROT, doesItems: true, icon: 'gui/icons/eRot.png', about: 'Rots the target with evil putrescence for {duration} rounds.' },
	eAcid: 			{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 0.30, isHarm: 1, 
					duration: 3, damageType: DamageType.CORRODE, doesItems: true, icon: 'gui/icons/eCorrode.png', about: 'Corrodes the target with acid for {duration} rounds.' },
	ePoison: 		{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 0.50, isHarm: 1, isPoison: 1,
					duration: 10, damageType: DamageType.POISON, icon: 'gui/icons/ePoison.png', about: 'Poisons the target for {duration} rounds.' },
	ePoisonForever: { isDmg: 1, level:  0, rarity: 0.01, op: 'damage', xDamage: 0.05, isHarm: 1, isPoison: 1,
					duration: true, damageType: DamageType.POISON, name: 'mortal poison', icon: 'gui/icons/ePoison.png', about: 'Poisons the target forever.' },
	eLeech: 		{ isDmg: 1, level:  0, rarity: 0.30, op: 'damage', xDamage: 0.70, isHarm: 1, duration: 0, isLeech: 1, damageType: DamageType.ROT, healingType: DamageType.SMITE, icon: 'gui/icons/eLeech.png', about: 'Leeches health from the target into the aggressor.' },
};

(() => {
for( let key in EffectTypeList ) {
	// all effect bearing items have a bigger price.
	EffectTypeList[key].xPrice = Rules.effectPriceMultiplierByRarity(EffectTypeList[key].rarity);
	// Although this is set in the Fab, certain code needs it sooner, so here it is.
	EffectTypeList[key].isEffect = true;
}
})();

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


// Item Events
// onTouch - fires each round a monster is standing on a tile. Also fires when you WAIT or LOSE TURN upon a tile.
// onBump - fires when you bonk into a non-passable tile.
// onDepart - fires every single time you leave this tile, whether you're heading into another similar tile or not
//				return false to stop the movement.
// onDepartType - fires when you are leaving this tile type, like stepping out of fire or mud or water.
//				return false to stop the movement.
// onEnterType - if you are entering a tile type from another tile NOT of the same type.
//				return false to stop the movement.


class KeyMap {
	constructor() {
		this.keyToCommand = this.load();
	}

	commandToKey(command) {
		let key;
		Object.each( this.keyToCommand, (c,k) => { if( c==command ) key=k; });
		return key;
	}

	load() {
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
			A: Command.DEBUGTHRIVE,
			V: Command.DEBUGVIEW,
			Z: Command.DEBUGANIM,
			a: Command.ATTACK,
			i: Command.INVENTORY,
			f: Command.FAVORITE,
			q: Command.QUAFF,
			t: Command.THROW,
			s: Command.SHOOT,
			d: Command.DROP,
			c: Command.CAST,
	//		F1: Command.CAST1,
	//		F2: Command.CAST2,
	//		F3: Command.CAST3,
	//		F4: Command.CAST4,
	//		F5: Command.CAST5,
			'.': Command.WAIT,
			Enter: Command.EXECUTE,
			Escape: Command.CANCEL
		};
	}
}

return {
	Command: Command,
	Distance: Distance,
	Direction: Direction,
	ClipRect: ClipRect,
	IMG_BASE: IMG_BASE,
	SymbolForbidden: SymbolForbidden,
	SymbolToType: SymbolToType,
	TypeIdToSymbol: TypeIdToSymbol,
	SYM: SYM,
	MapVisDefault: MapVisDefault,
	MaxVis: MaxVis,
	Problem: Problem,
	Tile: Tile,
	Gab: Gab,
	Quick: Quick,
	QuickName: QuickName,
	StickerList: StickerList,
	MiscImmunity: MiscImmunity,
	DamageType: DamageType,
	Damage: Damage,
	EffectShape: EffectShape,
	ArmorDefendsAgainst: ArmorDefendsAgainst,
	ShieldDefendsAgainst: ShieldDefendsAgainst,
	Attitude: Attitude,
	Team: Team,
	Job: Job,
	Slot: Slot,
	PickIgnore: PickIgnore,
	EffectTypeList: EffectTypeList,
	KeyMap: KeyMap,
}

});
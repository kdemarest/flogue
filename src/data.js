Module.add('data',function(extern){

// STATIC DATA

// WARNING: The strings for directions MUST remain the same for Direction.fromCommand() to work.
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

let IMG_BASE = 'http://localhost:3000/tiles/';

let SymbolForbidden = { ' ': 1, '.': 1, '#': 1 };
let SymbolToType = {};
let TypeIdToSymbol = {};
let SYM = 111;

// If you change this, you must also chance the .css class .tile
let MapVis = 8;		// The vision distance used when actually drawing your map display, casting light etc.
let MaxVis = 8;		// The vision distance max any monster can see

// Pathfinding and terrain isProblem
let Problem = {
	NONE:  0.0,
	ENTITY: 0.2,		// be wary of changing this!
	MILD:  0.3,
	HARSH: 0.7,
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
		DECOR: 22,
		TABLE: 24,
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
	freezeIcon: { img: 'gui/icons/eFreeze.png' },
	shockIcon: { img: 'gui/icons/eShock.png' },
	corrodeIcon: { img: 'gui/icons/eCorrode.png' },
	poisonIcon: { img: 'gui/icons/ePoison.png' },
	smiteIcon: { img: 'gui/icons/eSmite.png' },
	rotIcon: { img: 'gui/icons/eRot.png' },
};

// Probably should do this at some point.
//const Travel = { WALK: 1, FLY: 2, SWIM: 4 };

const MiscImmunity = { SPEED: "speed", STUN: "stun", IMMOBILE: "immobile", GAS: "gas", MUD: "mud", FORCEFIELD: "forceField", HEALING: "healing" };


// WARNING: the damage type names are re-used in their icon names in StickerList. Maintain both.
const DamageType = { CUT: "cut", STAB: "stab", BITE: "bite", CLAW: "claw", BASH: "bash", BURN: "burn", FREEZE: "freeze", WATER: "water", SHOCK: "shock", CORRODE: "corrode", POISON: "poison", SMITE: "smite", ROT: "rot" };
const Damage = {
	All: 		Object.values(DamageType).join(',')+','+Object.values(MiscImmunity).join(','),
	Misc: 		Object.values(MiscImmunity).join(','),
	Physical: 	[DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.BASH].join(','),
	Physical2: 	[DamageType.CORRODE,DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.BASH].join(','),
	Elemental: 	[DamageType.BURN,DamageType.FREEZE,DamageType.SHOCK,DamageType.WATER].join(','),
	Divine: 	[DamageType.SMITE,DamageType.ROT].join(',')
};


const EffectShape = { SINGLE: "single", BLAST2: 'blast2', BLAST3: 'blast3', BLAST4: 'blast4', BLAST5: "blast5", BLAST6: "blast6" };
const ArmorDefendsAgainst = [DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.BASH];
const ShieldDefendsAgainst = [DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.BASH];
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
	eBlank: 		{ level:  0, rarity: 1.00, isBlank: 1, name: 'blank paper' },
	eKillLabel: 	{ level:  0, rarity: 1.00, op: 'killLabel', duration: 0, icon: false },	
// Tactical
	eLuminari: 		{ isTac: 1, level:  0, rarity: 1.00, op: 'add', stat: 'light', value: 6, xDuration: 5.0, isPlayerOnly: 1, name: 'luminari', icon: 'gui/icons/eLuminari.png' },
	eDarkness: 		{ isTac: 1, level:  0, rarity: 1.00, op: 'add', stat: 'dark', value: 12, xDuration: 5.0, isPlayerOnly: 1, name: 'darkness', icon: 'gui/icons/eLuminari.png' },
	eDarkVision: 	{ isTac: 1, level:  0, rarity: 1.00, op: 'max', stat: 'darkVision', value: 6, xDuration: 5.0, isPlayerOnly: 1, name: 'dark vision', icon: 'gui/icons/eLuminari.png' },
//	eMap: 			{ isTac: 1, level:  null, rarity: 0.50, op: 'fillMinimap', isPlayerOnly: 1, name: 'map' },
	eGreed: 		{ isTac: 1, level:  0, rarity: 0.50, op: 'set', stat: 'senseTreasure', value: true, xDuration: 5.0, isPlayerOnly: 1, name: 'sense items', icon: 'gui/icons/eVision.png' },
	eEcholoc: 		{ isTac: 1, level:  0, rarity: 0.50, op: 'set', stat: 'senseLiving', value: true, xDuration: 5.0, isPlayerOnly: 1, name: 'sense life', icon: 'gui/icons/eVision.png' },
	eSeeInvisible: 	{ isTac: 1, level:  0, rarity: 0.50, op: 'set', stat: 'senseInvisible', value: true, xDuration: 5.0, isHelp: 1, name: 'see invisible', icon: 'gui/icons/eVision.png' },
	eXray: 			{ isTac: 1, level:  0, rarity: 0.20, op: 'set', stat: 'senseXray', value: true, xDuration: 5.0, isPlayerOnly: 1, name: 'xray vision', icon: 'gui/icons/eVision.png' },
	eTeleport: 		{ isTac: 1, level:  0, rarity: 1.00, op: 'teleport', duration: 0, xRecharge: 2.0, isHelp: true, name: 'teleport', icon: 'gui/icons/eTeleport.png' },
	eOdorless: 		{ isTac: 1, level:  0, rarity: 1.00, op: 'max', stat: 'scentReduce', value: Rules.SCENT_AGE_LIMIT, isHelp: true, name: 'no scent', icon: 'gui/icons/eFragrance.png' },
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
	eStun: 			{ isDeb: 1, level:  0, rarity: 0.50, op: 'set', isHarm: 1, stat: 'stun', value: true, xDuration: 0.3, icon: 'gui/icons/eShove.png' },
	eShove: 		{ isDeb: 1, level:  0, rarity: 0.50, op: 'shove', isHarm: 1, value: 2, duration: 0, icon: 'gui/icons/eShove.png' },
	eHesitate: 		{ isDeb: 1, level:  0, rarity: 1.00, op: 'attitude', isHarm: 1, value: Attitude.HESITANT, isHarm: 1, xDuration: 0.3, icon: 'gui/icons/eAttitude.png' },
	eStartle: 		{ isDeb: 1, level:  0, rarity: 1.00, op: 'attitude', isHarm: 1, value: Attitude.PANICKED, isHarm: 1, xDuration: 0.2, icon: 'gui/icons/eFear.png' },
	eVulnerability: { isDeb: 1, level:  0, rarity: 1.00, op: 'add', isHarm: 1, stat: 'vuln', requires: (e,effect)=>!e.isImmune(effect.value),
					valuePick: () => pick(PickVuln), isHarm: 1, xDuration: 2.0, namePattern: 'vulnerability to {value}', icon: 'gui/icons/eVuln.png' },
	eSlow: 			{ isDeb: 1, level:  0, rarity: 0.20, op: 'sub', isHarm: 1, stat: 'speed', value: 0.5, xDuration: 0.3, requires: e=>e.speed>0.5 },
	eBlindness: 	{ isDeb: 1, level:  0, rarity: 0.30, op: 'set', isHarm: 1, stat: 'senseBlind', value: true, xDuration: 0.25, requires: e=>!e.senseBlind, icon: 'gui/icons/eBlind.png' },
	eConfusion: 	{ isDeb: 1, level:  0, rarity: 0.20, op: 'attitude', isHarm: 1, value: Attitude.CONFUSED, xDuration: 0.3, icon: 'gui/icons/eAttitude.png' },
	ePanic: 		{ isDeb: 1, level:  0, rarity: 0.20, op: 'attitude', isHarm: 1, value: Attitude.PANICKED, xDuration: 1.0, icon: 'gui/icons/eFear.png' },
	eRage: 			{ isDeb: 1, level:  0, rarity: 0.20, op: 'attitude', isHarm: 1, value: Attitude.ENRAGED, xDuration: 0.5, icon: 'gui/icons/eAttitude.png' },
	ePossess: 		{ isDeb: 1, level:  0, rarity: 0.20, op: 'possess', isHarm: 1, xDuration: 5.0, noPermute: true, icon: 'gui/icons/ePossess.png' },
	eDrain: 		{ isDeb: 1, level:  0, rarity: 0.40, op: 'drain', isHarm: 1, value: 'all', icon: 'gui/icons/eDrain.png' },
	eImmobilize: 	{ isDeb: 1, level:  0, rarity: 0.40, op: 'set', isHarm: 1, stat: 'immobile', value: 1, requires: e=>!e.immobile, icon: 'gui/icons/eImmobile.png' },

// Healing
	eHealing: 		{ isHel: 1, level:  0, rarity: 1.00, op: 'heal', xDamage: 6.00, isHelp: 1, duration: 0, healingType: DamageType.SMITE, icon: 'gui/icons/eHeal.png' },
	eRegeneration: 	{ isHel: 1, level:  0, rarity: 1.00, op: 'add', stat: 'regenerate', value: 0.01, isHelp: 1, xDuration: 2.0, xPrice: 1.5, icon: 'gui/icons/eHeal.png' },
	eTrollBlood: 	{ isHel: 1, level:  0, rarity: 1.00, op: 'add', stat: 'regenerate', value: 0.02, isHelp: 1, xDuration: 2.0, xPrice: 2.5, icon: 'gui/icons/eHeal.png' },
	eCurePoison: 	{ isHel: 1, level:  0, rarity: 1.00, op: 'strip', stripFn: deed=>deed.isPoison || deed.damageType==DamageType.POISON, isHelp: 1, duration: 0, icon: 'gui/icons/eHeal.png' },
	eCureDisease: 	{ isHel: 1, level:  0, rarity: 1.00, op: 'strip', stripFn: deed=>deed.isDisease, isHelp: 1, duration: 0, icon: 'gui/icons/eHeal.png' },
// Damage
	eWater: 		{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 1.00, isHarm: 1, duration: 0, damageType: DamageType.WATER, mayTargetPosition: true, icon: 'gui/icons/eBurn.png' },
	eBurn: 			{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 1.00, isHarm: 1, duration: 0, damageType: DamageType.BURN, mayTargetPosition: true, icon: 'gui/icons/eBurn.png' },
	eFreeze: 		{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 0.80, isHarm: 1, duration: 0, damageType: DamageType.FREEZE, icon: 'gui/icons/eFreeze.png' },
	eShock: 		{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 0.70, isHarm: 1, duration: 0, damageType: DamageType.SHOCK, icon: 'gui/icons/eShock.png' },
	eAcid: 			{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 0.90, isHarm: 1, duration: 0, damageType: DamageType.CORRODE, icon: 'gui/icons/eCorrode.png' },
	eSmite: 		{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 1.00, isHarm: 1, duration: 0, damageType: DamageType.SMITE, name: 'smite', icon: 'gui/icons/eSmite.png' },
	eRot: 			{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 1.00, isHarm: 1, duration: 0, damageType: DamageType.ROT, icon: 'gui/icons/eRot.png' },
	ePoison: 		{ isDmg: 1, level:  0, rarity: 1.00, op: 'damage', xDamage: 0.50, isHarm: 1, isPoison: 1,
					duration: 10, damageType: DamageType.POISON, icon: 'gui/icons/ePoison.png' },
	ePoisonForever: { isDmg: 1, level:  0, rarity: 0.01, op: 'damage', xDamage: 0.05, isHarm: 1, isPoison: 1,
					duration: true, damageType: DamageType.POISON, name: 'mortal poison', icon: 'gui/icons/ePoison.png' },
	eLeech: 		{ isDmg: 1, level:  0, rarity: 0.30, op: 'damage', xDamage: 0.70, isHarm: 1, duration: 0, isLeech: 1, damageType: DamageType.ROT, healingType: DamageType.SMITE, icon: 'gui/icons/eLeech.png' },
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
	map.tileSymbolSet(x,y,TileTypeList.flames.symbol);
	return {
		status: 'putFire',
		success: true
	}
}

EffectTypeList.eFreeze.onTargetPosition = function(map,x,y) {
	map.tileSymbolSet(x,y,TileTypeList.water.symbol);
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
	IMG_BASE: IMG_BASE,
	SymbolForbidden: SymbolForbidden,
	SymbolToType: SymbolToType,
	TypeIdToSymbol: TypeIdToSymbol,
	SYM: SYM,
	MapVis: MapVis,
	MaxVis: MaxVis,
	Problem: Problem,
	Tile: Tile,
	Gab: Gab,
	DynamicViewList: DynamicViewList,
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
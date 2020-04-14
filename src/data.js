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
	isAt(x0,y0,x1,y1,dist=0.5) {
		return this.isNear(x1-x0,y1-y0,dist);
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
		this.xMin = Math.toTile(x0);
		this.yMin = Math.toTile(y0);
		this.xMax = Math.toTile(x1);
		this.yMax = Math.toTile(y1);
	}
	setCtr(x,y,dist) {
		this.set(x-dist,y-dist,x+dist,y+dist);
	}
	contains(x,y) {
		return !(x<this.xMin || y<this.yMin || x>this.xMax || y>this.yMax);
	}
};

let IMG_BASE = 'http://localhost:8080/tiles/';

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

let StickerList = Type.establish( 'Sticker', {}, {
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
	suffocateIcon: { img: 'gui/icons/eSmite.png' },
});

const Quick = {
	CLUMSY: 1,
	NORMAL: 2,
	NIMBLE: 3,
	LITHE: 4
}
const QuickName = ['','clumsy','normal','nimble','lithe'];

// Probably should do this at some point.
//const Travel = { WALK: 1, FLY: 2, SWIM: 4 };

let ResistanceList = [];

const MiscImmunity = { SPEED: "speed", STUN: "stun", IMMOBILE: "immobile", GAS: "gas", MUD: "mud", FORCEFIELD: "forceField", HEALING: "healing" };
ResistanceList.push(MiscImmunity);

// WARNING: the damage type names are re-used in their icon names in StickerList. Maintain both.
const DamageType = { CUT: "cut", STAB: "stab", BITE: "bite", CLAW: "claw", CHOP: "chop", BASH: "bash",
					BURN: "burn", FREEZE: "freeze", WATER: "water", LIGHT: "light", SHOCK: "shock",
					CORRODE: "corrode", POISON: "poison", SMITE: "smite", ROT: "rot", SUFFOCATE: 'suffocate' };
ResistanceList.push(DamageType);

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
ResistanceList.push(Attitude);


const Team = { EVIL: "evil", GOOD: "good", NEUTRAL: "neutral", LUNAR: "lunar"};
const Slot = { HEAD: "head", NECK: "neck", ARMS: "arms", HANDS: "hands", FINGERS: "fingers", WAIST: "waist", HIP: "hip", FEET: "feet", ARMOR: "armor", WEAPON: "weapon", AMMO: "ammo", SHIELD: "shield", SKILL: "skill" };



// IMMUNITY and RESISTANCE!
// Note that you can be immune to almost anything that is a string. That is, you can be immune to a DamageType,
// or an Attitude, an Effect, or even immune to the effects of 'mud' or 'forcefield' as long as their event handlers check it.

// Effect Events
// onTargetPosition - if this effect is targeting a map tile, instead of a monster.


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
	Symbol: Symbol,
	MapVisDefault: MapVisDefault,
	MaxVis: MaxVis,
	Problem: Problem,
	Tile: Tile,
	Gab: Gab,
	Quick: Quick,
	QuickName: QuickName,
	StickerList: StickerList,
	ResistanceList: ResistanceList,
	MiscImmunity: MiscImmunity,
	DamageType: DamageType,
	Damage: Damage,
	EffectShape: EffectShape,
	ArmorDefendsAgainst: ArmorDefendsAgainst,
	ShieldDefendsAgainst: ShieldDefendsAgainst,
	Attitude: Attitude,
	Team: Team,
	Slot: Slot,
	KeyMap: KeyMap
}

});
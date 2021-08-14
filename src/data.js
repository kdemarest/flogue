Module.add('data',function(extern){

// STATIC DATA

// WARNING: The strings for directions MUST remain the same for Direction.fromCommand() to work.
const Command = { NONE: "none", N:"N", NE:"NE", E:"E", SE:"SE", S:"S", SW:"SW", W:"W", NW:"NW", WAIT: "wait", 
				INVENTORY: "inventory", QUAFF: "quaff", GAZE: "gaze", THROW: "throw", SHOOT: "shoot", TRIGGER: "trigger",
				FAVORITE: "favorite",
				LOSETURN: "lose turn", PRAY: "pray", EAT: "eat", ENTERGATE: "enterGate",
				ATTACK: "attack", USE: "use", LOOT: "loot", DROP: "drop", PICKUP: "pickup",
				BUY: "buy", SELL: "sell", CRAFT: "craft", BUSY: "busy", DIG: "dig",
				DEBUGKILL: "debugkill", DEBUGTHRIVE: "debugthrive", DEBUGVIEW: "debugview", DEBUGANIM: "debuganim", DEBUGTEST: "debugtest",
				CAST: "cast", CAST1: "cast1", CAST2: "cast2", CAST3: "cast3", CAST4: "cast4", CAST5: "cast5", QUIT: "quit",
				EXECUTE: "execute", CANCEL: "cancel"
			};

// By default all commands cost 1.0, unless overridden here
Command.Free = [Command.INVENTORY,Command.PICKUP,Command.DROP,Command.FAVORITE,Command.USE,Command.BUY,Command.SELL, Command.CANCEL,
				Command.DEBUGKILL,Command.DEBUGTHRIVE,Command.DEBUGVIEW,Command.DEBUGANIM,Command.DEBUGTEST
			];

Command.Movement = [Command.N,Command.NE,Command.E,Command.SE,Command.S,Command.SW,Command.W,Command.NW];
Command.Attack =   [Command.ATTACK,Command.THROW,Command.SHOOT,Command.CAST];

const Distance = new class{
	get(dx,dy) {
		return Math.sqrt(dx*dx+dy*dy);
	}
	getNormalized(dx,dy) {
		let dist = Distance.get(dx,dy);
		if( dist == 0 ) {
			return [0,0];
		}
		dx = dx / dist;
		dy = dy / dist;
		return [dx,dy];
	}
	isNear(dx,dy,dist) {
		if( dx > dist || dy > dist ) return false;	// hopefully this speeds up the calc.
		return dx*dx+dy*dy <= dist*dist;
	}
	getSq(dx,dy) {
		return Math.max(Math.abs(dx),Math.abs(dy));
	}
	isNearSq(dx,dy,dist) {
		return Math.abs(dx)<=dist && Math.abs(dy)<=dist;
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
			if( Random.Pseudo.floatRange(0,ax+ay)<Math.max(ax,ay) ) {
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
	NONE:  0.0,			// Must be ZERO so that boolean ops work on it
	TINY: 0.1,
	DOOR: 0.1,			// be wary of changing this!
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
		VEIN: 11,
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

const MiscImmunity = { SPEED: "speed", GAS: "gas", STUN: "stun", IMMOBILE: "immobile", MUD: "mud", FORCEFIELD: "forceField", HEALING: "healing" };
ResistanceList.push(...Object.values(MiscImmunity));

// WARNING: the damage type names are re-used in their icon names in StickerList. Maintain both.
const DamageType = { CUT: "cut", STAB: "stab", BITE: "bite", CLAW: "claw", CHOP: "chop", BASH: "bash",
					BURN: "burn", FREEZE: "freeze", WATER: "water", LIGHT: "light", SHOCK: "shock",
					CORRODE: "corrode", POISON: "poison", SMITE: "smite", ROT: "rot", SUFFOCATE: 'suffocate' };
ResistanceList.push(...Object.values(DamageType));

const ConditionType = { STUN: "stun", IMMOBILE: "immobile", POSSESS: "possess" };
ResistanceList.push(...Object.values(ConditionType));

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
				AGGRESSIVE: "aggressive", PATROL: "patrolling", HUNT: "hunting", HESITANT: "hesitant", WANDER: "wandering" };
ResistanceList.push(...Object.values(Attitude));


const Team = { EVIL: "evil", GOOD: "good", NEUTRAL: "neutral", LUNAR: "lunar"};
const Slot = {
	HEAD: "head", NECK: "neck", ARMS: "arms", HANDS: "hands", FINGERS: "fingers", WAIST: "waist", HIP: "hip",
	FEET: "feet", ARMOR: "armor", WEAPON: "weapon", AMMO: "ammo", SHIELD: "shield", SKILL: "skill"
};



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
			w: Command.N,
			e: Command.NE,
			d: Command.E,
			c: Command.SE,
			s: Command.S,
			z: Command.SW,
			a: Command.W,
			q: Command.NW,

			T: Command.DEBUGTEST,
			X: Command.DEBUGKILL,
			A: Command.DEBUGTHRIVE,
			V: Command.DEBUGVIEW,
			Z: Command.DEBUGANIM,
//			a: Command.ATTACK,
			' ': Command.ATTACK,
			i: Command.INVENTORY,
			f: Command.FAVORITE,
			t: Command.THROW,
			r: Command.DROP,
//			q: Command.QUAFF,
//			s: Command.SHOOT,
//			d: Command.DROP,
//			c: Command.CAST,
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
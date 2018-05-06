// STATIC DATA

// WARNING: The strings for directions MUST remain the same for commandToDirection() to work.
const Command = { NONE: "none", N:"N", NE:"NE", E:"E", SE:"SE", S:"S", SW:"SW", W:"W", NW:"NW", WAIT: "wait", QUIT: "quit" };
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

const DamageType = { CUT: "cut", STAB: "pierce", BITE: "bite", CLAW: "claw", BLUNT: "whomp", FIRE: "burn", POISON: "poison", HOLY: "holy", UNHOLY: "unholy" };

const TileTypeDefaults = { mayWalk: false, mayFly: false, opacity: 0, isStairs: false, damage: '', damageType: DamageType.BLUNT };
const TileTypeList = {
	"floor":     { symbol: ' ', mayWalk: true,  mayFly: true,  opacity: 0, name: "floor" },
	"wall":      { symbol: '#', mayWalk: false, mayFly: false, opacity: 1, name: "wall" },
	"pit":       { symbol: ':', mayWalk: false, mayFly: true,  opacity: 0, name: "pit" },
	"door":      { symbol: '+', mayWalk: true,  mayFly: true,  opacity: 1, name: "door" },
	"shut door": { symbol: 'Ώ', mayWalk: false, mayFly: false, opacity: 1, name: "shut door" },
	"stairs":    { symbol: '>', mayWalk: true,  mayFly: true,  opacity: 0, name: "staircase", isStairs: true },
	"altar":     { symbol: 'A', mayWalk: false, mayFly: false, opacity: 0, name: "glowing altar" },
	"obelisk":   { symbol: 'B', mayWalk: false, mayFly: false, opacity: 0, name: "obsidian obelisk" },
	"crystal":   { symbol: '*', mayWalk: false, mayFly: false, opacity: 0, name: "shimmering crystal" },
	"fire":      { symbol: 'ᵮ', mayWalk: true,  mayFly: true,  opacity: 0, name: "fire", damage: '1d4', damageType: DamageType.FIRE },
	"mist":      { symbol: '░', mayWalk: true,  mayFly: true,  opacity: 0.3, name: "mist" },
	"mud":       { symbol: '⍨', mayWalk: true,  mayFly: true,  opacity: 0, name: "mud" },
	"ghoststone":{ symbol: '?', mayWalk: false, mayFly: false, opacity: 0, name: "ghost stone" },
	"forcefield":{ symbol: '|', mayWalk: true,  mayFly: true,  opacity: 1, name: "force field" }
};

const ItemTypeDefaults = {
	symbol: '?', namePattern: 'nameless *', effect: true, charges: 1, mayWalk: true, mayFly: true, opacity: 0
}

const ItemTypeList = {
	"gold": 	{ symbol: '$', namePattern: '* gold', effect: false },
	"potion":   { symbol: '¡', namePattern: 'potion of *' }
}

const selfInvisibilitySymbol = '?';
const Attitude = { ENRAGED: "enraged", AGGRESSIVE: "aggressive", HESITANT: "hesitant", CONFUSED: "confused", FEARFUL: "fearful", PANICKED: "panicked", WANDER: "wander", CALM: "calm" };
const Brain = { AI: "ai", USER: "user" };
const Team = { EVIL: "evil", GOOD: "good", NEUTRAL: "neutral" };

const MonsterTypeDefaults = {
					type: null, typeId: null, reach: 1, travelMode: "walk", speed: 1, pronoun: "it", packAnimal: false,
					healthMax: 10, health: 10, regenerate: 0,
					invisible: false, inaudible: false, blind: false, seeInvisible: false, sightDistance: 10, observeDistantEvents: false,
					symbol: '?', mayWalk: false, mayFly: false, healthMax: 10, damage: '1d1', damageType: DamageType.BLUNT,
					resist: '', immune: '',
					brain: Brain.AI, attitude: Attitude.AGGRESSIVE, team: Team.EVIL
				};

const MonsterTypeList = {
	"ogre": { 		symbol: 'Ǿ', pronoun: "*",
					healthMax: 20, damage: '1d8',   damageType: DamageType.BLUNT, resist: [DamageType.CUT], speed: 0.5,
					attitude: Attitude.AGGRESSIVE,  team: Team.EVIL },
	"goblin": { 	symbol: 'g', pronoun: "*",
					healthMax: 10, damage: '1d4',   damageType: DamageType.CUT, packAnimal: true,
					attitude: Attitude.AGGRESSIVE,  team: Team.EVIL },
	"skeleton": { 	symbol: 's', pronoun: "it",
					healthMax: 10, damage: '1d4',   damageType: DamageType.CUT, immune: [DamageType.CUT,DamageType.STAB],
					attitude: Attitude.AGGRESSIVE,  team: Team.EVIL },
	"kobold": { 	symbol: 'k', pronoun: "*",
					healthMax:  8, damage: '1d3',   damageType: DamageType.CUT,
					attitude: Attitude.HESITANT,    team: Team.EVIL },
	"ethermite": { 	symbol: 'e', pronoun: "*", invisible: true,
					healthMax: 10, damage: '1d4',   damageType: DamageType.CUT, packAnimal: true,
					attitude: Attitude.AGGRESSIVE,  team: Team.EVIL },
	"troll": {	 	symbol: 'T', pronoun: "*", regenerate: 1,
					healthMax: 20, damage: '2d4',   damageType: DamageType.CLAW,
					attitude: Attitude.AGGRESSIVE,  team: Team.EVIL },
	"jaguar": {		symbol: 'j', pronoun: "it",
					healthMax: 15, damage: '1d4+2', damageType: DamageType.CLAW, speed: 2.0,
					attitude: Attitude.HESITANT,    team: Team.EVIL },
	"bat": { 		symbol: 'ᵬ', pronoun: "it", seeInvisible: true,
					healthMax:  6, damage: '1d2',   damageType: DamageType.BITE, travelMode: "fly", packAnimal: true,
					attitude: Attitude.WANDER,      team: Team.NEUTRAL },
	"porcupine": {	symbol: 'p', pronoun: "it",
					healthMax: 12, damage: '2d3',   damageType: DamageType.STAB,
					attitude: Attitude.WANDER,      team: Team.NEUTRAL },
	"dog": {	 	symbol: 'd', name: "Fido/Lucy", properNoun: true, pronoun: "*",
					healthMax: 20, damage: '1d4+1', damageType: DamageType.BITE, packAnimal: true, regenerate: 0.2,
					attitude: Attitude.AGGRESSIVE,  team: Team.GOOD, watch:1 },
	"imp": {	 	symbol: 'i', pronoun: "it", seeInvisible: true,
					healthMax: 30, damage: '1d2',   damageType: DamageType.BITE, travelMode: "fly", immune: DamageType.FIRE,
					attitude: Attitude.CONFUSED,    team: Team.NEUTRAL },
	"rabbit": { 	symbol: 'r', pronoun: "it",
					healthMax: 30, damage: '1d2',   damageType: DamageType.BITE, packAnimal: true,
					attitude: Attitude.FEARFUL,     team: Team.EVIL, watch:true },
	"player": { 	symbol: '@', pronoun: "he", brain: Brain.USER,
					healthMax: 80, damage: '1d3+2', damageType: DamageType.CUT,
					attitude: Attitude.CALM,        team: Team.GOOD },
};

const SymbolToType = (function() {
	let lookup = {};
	Object.entries(TileTypeList).forEach( ([typeId,tileType]) => {
		tileType.typeId = typeId;
		lookup[tileType.symbol] = tileType;
		tileType.type = tileType;
	} );
	Object.entries(ItemTypeList).forEach( ([typeId,itemType]) =>  {
		itemType.isItemType = true;
		itemType.typeId = typeId;
		ItemTypeList[typeId].name = ItemTypeList[typeId].name || typeId;
		ItemTypeList[typeId] = Object.assign( {}, ItemTypeDefaults, ItemTypeList[typeId] );
		lookup[itemType.symbol] = ItemTypeList[typeId];
		ItemTypeList[typeId].type = ItemTypeList[typeId];
	} );
	Object.entries(MonsterTypeList).forEach( ([typeId,monsterType]) =>  {
		monsterType.isMonsterType = true;
		monsterType.typeId = typeId;
		MonsterTypeList[typeId].name = MonsterTypeList[typeId].name || typeId;
		MonsterTypeList[typeId] = Object.assign( {}, MonsterTypeDefaults, MonsterTypeList[typeId] );
		lookup[monsterType.symbol] = MonsterTypeList[typeId];
		MonsterTypeList[typeId].type = MonsterTypeList[typeId];
	} );
	return lookup;
})();

let EffectTypeList = {
	invisibility: 	{ duration: '4d4+4', stat: 'invisible', op:'set', value: true, requires: e=>!e.invisible },
	blindness: 		{ duration: '1d4+4', stat: 'blind', op:'set', value: true, requires: e=>!e.blind },
	haste: 			{ duration: '2d4+4', stat: 'speed', op:'add', value: 1, requires: e=>e.speed<5 },
	slow: 			{ duration: '2d4+4', stat: 'speed', op:'sub', value: 0.5, requires: e=>e.speed>0.5 },
	regeneration: 	{ duration: '4d4+4', stat: 'regenerate', op:'add', value: 2 },
	flight: 		{ duration: '2d4+9', stat: 'travelMode', op:'set', value: 'fly', requires: e=>e.travelMode==e.type.travelMode },
	healing: 		{ duration: 0,       stat: 'health', op:'add', value: '1d4+4', healingType: DamageType.HOLY },
	poison: 		{ duration: 0,       stat: 'health', op:'sub', value: '1d4+4', damageType: DamageType.POISON },
	panic: 			{ duration: '1d4+4', stat: 'attitude', op:'set', value: Attitude.PANICKED },
	rage: 			{ duration: '1d4+4', stat: 'attitude', op:'set', value: Attitude.ENRAGED },
	confusion: 		{ duration: '1d4+4', stat: 'attitude', op:'set', value: Attitude.CONFUSED },
	immunity: 		{ duration: '4d4+4', stat: 'immune', op:'add', value: DamageType.FIRE },
	resistance: 	{ duration: '8d4+4', stat: 'resist', op:'add', value: DamageType.FIRE }
};


(function() {
	Object.entries(EffectTypeList).forEach( ([typeId,effectType]) =>  {
		effectType.name = typeId;
	});
})();


TileTypeList.altar.onTouch = function(entity,self) {
	entity.takeHealing(adhoc(self),rollDice("2d3+3"),DamageType.HOLY);
}

TileTypeList.obelisk.onTouch = function(entity,self) {
	if( !entity.blind ) {
		tell(mSubject,entity,' ',mVerb,'touch',' ',mObject,self,'.');
		deedAdd(adhoc(self),entity,10,'blind','set',true);
	}
	else {
		tell(mSubject,entity,' ',mVerb,'touch',' ',mObject,self,' but ',mVerb,'are',' already blind.');
	}
}

TileTypeList.crystal.onTouch = function(entity,self) {
	if( entity.speed <= 1 ) {
		tell(mSubject,entity,' ',mVerb,'touch',' ',mObject,self,' and ',mSubject|mVerb,'blur',' with speed!');
		deedAdd(adhoc(self),entity,3,'speed','add',1);
	}
	else {
		tell( mSubject,entity,' ',mVerb,'touch',' ',mObject,self,', but ',mVerb,'are',' already moving fast.');
	}
}

TileTypeList.pit.onTouch = function(entity,self) {
	if( entity.travelMode == "walk" ) {
		tell(mSubject,entity,' ',mVerb,'are',' at the edge of ',mObject,self);
	}
}

TileTypeList.fire.onEnterType = function(entity,self) {
	tell( mSubject,entity,' ',mVerb,'enter',' ',mObject,self,'.' );
}

TileTypeList.fire.onDepartType = function(entity,self) {
	tell( mSubject,entity,' ',mVerb,'leave',' ',mObject,self,'.' );
}

TileTypeList.fire.isProblem = function(entity,self) {
	return !entity.isImmune(self.damageType);
}

TileTypeList.fire.onTouch = function(entity,self) {
	// We could pass in an onDamage that would also catch you on fire...
	entity.takeDamage( self, rollDice(self.damage), self.damageType );
}

TileTypeList.mud.isProblem = function(entity,self) {
	return ( entity.travelMode == "walk" );
}

TileTypeList.mud.onEnterType = function(entity,self) {
	if( entity.travelMode == "walk" ) {
		tell( mSubject,entity,' ',mVerb,'enter',' ',mObject,self,'.' );
	}
}

TileTypeList.mud.onDepartType = function(entity,self) {
	if( entity.travelMode == "walk" ) {
		tell( mSubject,entity,' ',mVerb,'escape',' ',mObject,self,'.' );
	}
}

TileTypeList.mud.onDepart = function(entity,self) {
	if( entity.travelMode == "walk" && Math.chance(20) ) {
		tell( mSubject,entity,' ',mVerb,'is',' stuck in the mud.');
		return false;
	}
}

TileTypeList.forcefield.onEnterType = function(entity,self) {
	if( Math.chance(80) ) {
		tell( mSubject,entity,' ',mVerb,'is',' stopped by the ',mObject,self,'.' );
		return false;
	}
}

TileTypeList.ghoststone.onTouch = function(entity,self) {
	if( !entity.invisible ) {
		tell( mSubject,entity,' ',mVerb,['touch','touches'],' ',mObject,self,'.' );
		deedAdd( adhoc(self), entity, 10, 'invisible', 'set', true );
	}
	else {
		tell( mSubject,entity,' ',mVerb,'touch',' ',mObject,self,', but ',mVerb,'are',' already invisible.');
	}
}

MonsterTypeList.porcupine.onTouch = function(entity,self) {
	let damage = entity.rollDamage(entity.damage);
	entity.takeDamage( self, damage, DamageType.STAB, function(attacker,victim,amount,damageType) {
		if( amount<=0 ) {
			tell(mSubject,victim,' ',mVerb,'ignore',' ',mObject|mPossessive,attacker,' quills.');
		}
		else {
			tell(mSubject,victim,' ',mVerb,'is',' stabbed by ',mObject|mPossessive,attacker,' quills.');			
		}
		return true;
	});
}

MonsterTypeList.bat.onTouch = function(entity,self) {
	let f = self.entityFinder().includeMe().isAlive().filter( e => e.name==self.name );
	if( f.count ) {
		f.process( e => {
			if( e.attitude == Attitude.HESITANT || e.attitude == Attitude.WANDER ) {
				e.attitude = Attitude.AGGRESSIVE;
			}
			e.team = (entity.team == Team.EVIL || entity.team == Team.NEUTRAL) ? Team.GOOD : Team.EVIL;
		});
		if( self.isAlive() && f.count > 1 ) {
			tell(mSubject,self,' sonically ',mVerb,'alert',' ',mSubject|mPronoun|mPossessive,self,' friend'+(f.count>2?'s':''),' to attack team '+entity.team+'!');
		}
	}
}

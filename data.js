// STATIC DATA

// WARNING: The strings for directions MUST remain the same for commandToDirection() to work.
const Command = { NONE: "none", N:"N", NE:"NE", E:"E", SE:"SE", S:"S", SW:"SW", W:"W", NW:"NW", WAIT: "wait", 
				INVENTORY: "inventory", PICKUP: "pickup", QUAFF: "quaff", THROW: "throw", LOSETURN: "lose turn", PRAY: "pray",
				CAST: "cast", CAST1: "cast1", CAST2: "cast2", CAST3: "cast3", CAST4: "cast4", CAST5: "cast5", QUIT: "quit" };
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

const StickerList = {
	hit: { img: "effect/bolt04.png", scale: 0.4, xAnchor: 0.5, yAnchor: 0.5 },
	invisibleObserver: { symbol: '?', img: "spells/enchantment/invisibility.png" },
	crosshairYes: { img: "dc-misc/cursor_green.png", scale: 1.0, xAnchor: 0, yAnchor: 0 },
	crosshairNo:  { img: "dc-misc/travel_exclusion.png", scale: 1.0, xAnchor: 0, yAnchor: 0 }

}

const DamageType = { CUT: "cut", STAB: "pierce", BITE: "bite", CLAW: "claw", BLUNT: "whomp", FIRE: "burn", COLD: "freeze", POISON: "poison", HOLY: "divine power", ROT: "rot" };
const Attitude = { ENRAGED: "enraged", AGGRESSIVE: "aggressive", HESITANT: "hesitant", CONFUSED: "confused", FEARFUL: "fearful", PANICKED: "panicked", WANDER: "wander", CALM: "calm", WORSHIP: "worshipping" };
const Team = { EVIL: "evil", GOOD: "good", NEUTRAL: "neutral" };
const PickImmune = [DamageType.FIRE,DamageType.POISON,DamageType.HOLY,DamageType.ROT];
const PickResist = [DamageType.CUT,DamageType.STAB,DamageType.BLUNT,DamageType.FIRE,DamageType.POISON,DamageType.HOLY,DamageType.ROT];

let EffectTypeList = {
	invisibility: 	{ duration: '4d4+4', stat: 'invisible', op:'set', value: true, requires: e=>!e.invisible },
	blindness: 		{ duration: '1d4+4', stat: 'blind', op:'set', value: true, requires: e=>!e.blind },
	haste: 			{ duration: '2d4+4', stat: 'speed', op:'add', value: 1, requires: e=>e.speed<5 },
	slow: 			{ duration: '2d4+4', stat: 'speed', op:'sub', value: 0.5, requires: e=>e.speed>0.5 },
	regeneration: 	{ duration: '4d4+4', stat: 'regenerate', op:'add', value: 2 },
	flight: 		{ duration: '2d4+9', stat: 'travelMode', op:'set', value: 'fly', requires: e=>e.travelMode==e.type.travelMode },
	healing: 		{ duration: 0,       stat: 'health', op:'add', value: '1d4+4', healingType: DamageType.HOLY },
	poison: 		{ duration: 0,       stat: 'health', op:'sub', value: '1d4+4', damageType: DamageType.POISON },
	fire: 			{ duration: 0,       stat: 'health', op:'sub', value: '1d16', damageType: DamageType.FIRE, mayTargetPosition: true },
	cold: 			{ duration: 0,       stat: 'health', op:'sub', value: '1d16', damageType: DamageType.COLD, mayTargetPosition: true },
	holy: 			{ duration: 0,       stat: 'health', op:'sub', value: '1d1+6', damageType: DamageType.HOLY },
	rot: 			{ duration: 0,       stat: 'health', op:'sub', value: '2d4', damageType: DamageType.ROT },
	panic: 			{ duration: '1d4+4', stat: 'attitude', op:'set', value: Attitude.PANICKED },
	rage: 			{ duration: '1d4+4', stat: 'attitude', op:'set', value: Attitude.ENRAGED },
	confusion: 		{ duration: '1d4+4', stat: 'attitude', op:'set', value: Attitude.CONFUSED },
	immunity: 		{ duration: '4d4+4', stat: 'immune', op:'add', value: null, valuePick: () => pick(PickImmune), name: 'immunity to *' },
	resistance: 	{ duration: '8d4+4', stat: 'resist', op:'add', value: null, valuePick: () => pick(PickImmune), name: 'resist *s' },
	shove: 			{ duration: 0,       stat: 'position', op:'push', value: 3 },
};

EffectTypeList.fire.onTargetPosition = function(map,x,y) {
	map.tileSymbolSet(x,y,TileTypeList.fire.symbol);
}

EffectTypeList.cold.onTargetPosition = function(map,x,y) {
	map.tileSymbolSet(x,y,TileTypeList.water.symbol);
}

let SayStatList = {
	invisible: function(subj,obj,oldValue,newValue) {
		return [mSubject,subj,' suddenly ',mVerb,newValue?'wink':'appear',newValue?' out of sight':' from thin air','!'];
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
	resist: function(subj,obj,oldValue,newValue) {
		return [mSubject|mPossessive,subj,' ',mVerb,'is',' ',!oldValue ? 'now resistant to '+newValue+'s.' : 'no longer resistant to '+oldValue+'s.'];
	},
	blind: function(subj,obj,oldValue,newValue) {
		return [mSubject,subj,' ',mSubject|mVerb,newValue?'lose':'regain',' ',mSubject|mPronoun|mPossessive,subj,' sight!'];
	},
	travelMode: function(subj,obj,oldValue,newValue) {
		return [mSubject,subj,' ',mSubject|mVerb,'begin',' to ',newValue,'.'];
	},
	attitude: function(subj,obj,oldValue,newValue) {
		return [mSubject,subj,' ',mSubject|mVerb,'become',' ',newValue,'.'];
	},
	_generic_: function(subj,obj,oldValue,newValue) {
		return [mSubject,subj,' ',stat,' ',mVerb,'is',' less enchanted.'];
	}
};


(function() {
	Object.entries(EffectTypeList).forEach( ([typeId,effectType]) =>  {
		effectType.typeId = typeId;
		effectType.name = typeId;
	});
})();

const TileTypeDefaults = { mayWalk: false, mayFly: false, opacity: 0, isStairs: false, 
							damage: '', damageType: DamageType.BLUNT, img: null };
const TileTypeList = {
	"floor":      { symbol: '.', mayWalk: true,  mayFly: true,  opacity: 0, name: "floor", img: "dc-dngn/floor/pebble_brown0.png", ivar: 9 },
	"wall":       { symbol: '#', mayWalk: false, mayFly: false, opacity: 1, name: "wall", img: "dc-dngn/wall/brick_brown0.png", ivar: 8 },
	"pit":        { symbol: ':', mayWalk: false, mayFly: true,  opacity: 0, name: "pit", img: "dc-dngn/pit.png" },
	"shaft":      { symbol: ';', mayWalk: false, mayFly: true,  opacity: 0, name: "shaft", img: "dc-dngn/dngn_trap_shaft.png" },
	"door":       { symbol: '+', mayWalk: true,  mayFly: true,  opacity: 1, name: "locked door", img: "dc-dngn/dngn_open_door.png" },
	"locked door":{ symbol: '±', mayWalk: false, mayFly: false, opacity: 1, name: "door", img: "dc-dngn/dngn_closed_door.png" },
	"entry door": { symbol: 'Ώ', mayWalk: false, mayFly: false, opacity: 1, name: "entry door", img: "dc-dngn/dngn_closed_door.png" },
	"stairsdown": { symbol: '>', mayWalk: true,  mayFly: true,  opacity: 0, name: "stairs down", isStairs: true, img: "dc-dngn/gateways/stone_stairs_down.png" },
	"stairsup":   { symbol: '<', mayWalk: true,  mayFly: true,  opacity: 0, name: "stairs up", isStairs: true, img: "dc-dngn/gateways/stone_stairs_down.png" },
	"fire":       { symbol: 'ᵮ', mayWalk: true,  mayFly: true,  opacity: 0, name: "fire", light: 5, glow:1, damage: '1d4', damageType: DamageType.FIRE, img: "dc-mon/nonliving/fire_elemental.png" },
	"water":      { symbol: '~', mayWalk: false, mayFly: true,  maySwim: true, opacity: 0, name: "water", img: "dc-dngn/water/dngn_shoals_shallow_water1.png" },
	"mist":       { symbol: '░', mayWalk: true,  mayFly: true,  opacity: 0.3, name: "mist", img: "effect/cloud_grey_smoke.png", layer: 3 },
	"mud":        { symbol: '⍨', mayWalk: true,  mayFly: true,  opacity: 0, name: "mud", img: "dc-dngn/floor/dirt0.png", ivar: 3},
	"ghoststone": { symbol: 'G', mayWalk: false, mayFly: false, opacity: 0, name: "ghost stone", img: "dc-dngn/altars/dngn_altar_vehumet.png" },
	"obelisk":    { symbol: 'B', mayWalk: false, mayFly: false, opacity: 0, name: "obsidian obelisk", img: "dc-dngn/altars/dngn_altar_sif_muna.png" },
	"crystal":    { symbol: 'F', mayWalk: false, mayFly: false, opacity: 0, name: "shimmering crystal", glow:1, img: "dc-dngn/altars/dngn_altar_beogh.png" },
	"forcefield": { symbol: '|', mayWalk: true,  mayFly: true,  opacity: 1, name: "force field", light: 3, glow:1, img: "spells/air/static_discharge.png" },
	"brazier":    { symbol: 'u', mayWalk: false, mayFly: true,  opacity: 0, name: "brazier", light: 6, glow:1, img: "spells/fire/sticky_flame.png" }
};

function resolve(memberName) {
	if( typeof this[memberName] == 'function' ) {
		this[memberName] = this[memberName].apply(this,memberName);
	}
}

const ItemTypeDefaults = {
	symbol: '?', namePattern: 'nameless *', charges: 1, effect: true,
	mayWalk: true, mayFly: true, opacity: 0, triggerOnPickup: false,
	rechargeTime: false, rechargeLeft: 0,
	img: null
}

const ItemPotionImg = {
	invisibility: 	"clear",
	blindness: 		"black",
	haste: 			"emerald",
	slow: 			"silver",
	regeneration: 	"orange",
	flight: 		"brilliant_blue",
	healing: 		"ruby",
	poison: 		"brown",
	fire: 			"ruby", 
	cold: 			"brilliant_blue", 
	panic: 			"brown",
	rage: 			"brown",
	confusion: 		"brown",
	immunity: 		"white",
	resistance: 	"yellow",
	shove: 			"pink"
};

const PotionChoices = Object.keys(EffectTypeList);
const SpellChoices = Object.keys(EffectTypeList);
const WeaponChoices = ['poison','fire','cold','blindness','slow','panic','rage','confusion','shove'];
const DartChoices = ['poison','fire','cold','blindness','slow'];

const ItemTypeList = {
	"random":	{ symbol: '*', isRandom: 1, neverPick: true },
	"gold": 	{ symbol: '$', namePattern: '* gold', effect: false, img: "item/misc/gold_pile.png" },
	"altar":    { symbol: 'A', mayWalk: false, mayFly: false, name: "golden altar", light: 4, glow:true, rechargeTime: 12,
				img: "dc-dngn/altars/dngn_altar_shining_one.png" },
	"potion":   { symbol: '¡', namePattern: 'potion of *', charges: 1, light: 3, glow: true, effectChoices: PotionChoices, mayThrow: true, destroyOnLastCharge: true,
				imgGet: (typeId)=>"item/potion/"+(ItemPotionImg[typeId] || "emerald")+".png", imgChoices: ItemPotionImg },
	"spell":    { symbol: 'ᵴ', namePattern: 'spell of *', charges: true, rechargeTime: 3, effectChoices: SpellChoices,
				img: "item/scroll/scroll.png" },
	"dagger":   { symbol: '†', namePattern: 'dagger of *', charges: true, effectChoices: WeaponChoices, mayThrow: true,
				img: "item/weapon/dagger.png" },
	"dart":     { symbol: ',', namePattern: 'dart of *', charges: true, effectChoices: DartChoices, mayThrow: true,
				img: "item/weapon/dagger.png" }
}

const selfInvisibilitySymbol = '?';
const Brain = { AI: "ai", USER: "user" };

const MonsterTypeDefaults = {
					type: null, typeId: null, reach: 1, travelMode: "walk", speed: 1, loseTurn: false, pronoun: "it", packAnimal: false,
					healthMax: 10, health: 10, regenerate: 0, resist: '', immune: '', picksup: false, 
					damage: '1d1', damageType: DamageType.BLUNT, personalEnemy: '',
					invisible: false, inaudible: false, blind: false, seeInvisible: false, sightDistance: 6, observeDistantEvents: false,
					symbol: '?', mayWalk: false, mayFly: false,
					brain: Brain.AI, brainFlee: false, brainPet: false, brainOpensDoors: false, brainTalk: false, attitude: Attitude.AGGRESSIVE, team: Team.EVIL
				};

const MonsterTypeList = {
	"ogre": { 		symbol: 'Ǿ', pronoun: "*", img: "dc-mon/ogre.png", brainTalk: true,
					healthMax: 20, damage: '1d8',   damageType: DamageType.BLUNT, resist: DamageType.CUT, speed: 0.5,
					attitude: Attitude.AGGRESSIVE,  team: Team.EVIL },
	"goblin": { 	symbol: 'g', pronoun: "*", img: "dc-mon/goblin.png", brainTalk: true, isGoblin: true,
					healthMax: 10, damage: '1d4',   damageType: DamageType.CUT, packAnimal: true,
					attitude: Attitude.AGGRESSIVE,  team: Team.EVIL, sayPrayer: 'Oh mighty Thagzog...' },
	"skeleton": { 	symbol: 's', pronoun: "it", img: "dc-mon/undead/skeletons/skeleton_humanoid_small.png",
					healthMax: 10, damage: '1d4',   damageType: DamageType.CUT, immune: DamageType.CUT+','+DamageType.STAB,
					attitude: Attitude.AGGRESSIVE,  team: Team.EVIL },
	"kobold": { 	symbol: 'k', pronoun: "*", img: "dc-mon/kobold.png", brainTalk: true,
					healthMax:  8, damage: '1d3',   damageType: DamageType.CUT,
					attitude: Attitude.HESITANT,    team: Team.EVIL },
	"ethermite": { 	symbol: 'e', pronoun: "*", invisible: true, light:6, glow:true, img: "dc-mon/shining_eye.png",
					healthMax: 10, damage: '1d4',   damageType: DamageType.BITE, packAnimal: true,
					attitude: Attitude.AGGRESSIVE,  team: Team.EVIL },
	"troll": {	 	symbol: 'T', pronoun: "*", regenerate: 1, img: "dc-mon/troll.png",
					healthMax: 20, damage: '2d4',   damageType: DamageType.CLAW,
					attitude: Attitude.AGGRESSIVE,  team: Team.EVIL },
	"viper": {		symbol: 'v', pronoun: "it", img: "dc-mon/animals/viper.png",
					healthMax: 15, damage: '1d4+2', damageType: DamageType.CLAW, speed: 2.0,
					attitude: Attitude.HESITANT,    team: Team.EVIL },
	"bat": { 		symbol: 'ᵬ', pronoun: "it", seeInvisible: true, img: "dc-mon/animals/giant_bat.png",
					healthMax:  6, damage: '1d2',   damageType: DamageType.BITE, travelMode: "fly", packAnimal: true,
					attitude: Attitude.WANDER,      team: Team.NEUTRAL },
	"spinyfrog": {	symbol: 'f', pronoun: "it", name: "spiny frog", img: "dc-mon/animals/spiny_frog.png",
					healthMax: 12, damage: '2d3',   damageType: DamageType.STAB,
					attitude: Attitude.WANDER,      team: Team.NEUTRAL },
	"dog": {	 	symbol: 'd', name: "Fido/Lucy", properNoun: true, pronoun: "*", img: "UNUSED/spells/components/dog2.png",
					healthMax: 20, damage: '1d4+1', damageType: DamageType.BITE, packAnimal: true, regenerate: 0.2,
					attitude: Attitude.AGGRESSIVE,  brainFlee: true, brainPet: true, team: Team.GOOD, watch:1 },
	"imp": {	 	symbol: 'i', pronoun: "it", seeInvisible: true, glow: 1, img: "dc-mon/demons/imp.png",
					healthMax: 30, damage: '1d2',   damageType: DamageType.BITE, travelMode: "fly", immune: DamageType.FIRE,
					attitude: Attitude.CONFUSED,    team: Team.NEUTRAL },
	"rabbit": { 	symbol: 'r', pronoun: "it", img: "dc-mon/animals/sheep.png",
					healthMax: 30, damage: '1d2',   damageType: DamageType.BITE, packAnimal: true,
					attitude: Attitude.FEARFUL,     team: Team.EVIL, watch:true },
	"player": { 	symbol: '@', pronoun: "he", light: 7, brainTalk: true,
					brain: Brain.USER, brainOpensDoors: true, picksup: true, img: "dc-mon/human.png",
					healthMax: 80, damage: '1d3+2', damageType: DamageType.CUT, sightDistance: 8,
					attitude: Attitude.CALM,        team: Team.GOOD, neverPick: true }
};

let SymbolToType;

TileTypeList['locked door'].onTouch = function(entity,self) {
	if( entity.brainOpensDoors ) {
		entity.map.tileSymbolSet( self.x, self.y, TileTypeList.door.symbol );
		tell(mSubject,entity,' ',mVerb,'open',' the ',mObject,adhoc(self));
	}
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

ItemTypeList.altar.onTouch = function(entity,self) {
	if( !self.rechargeLeft) {
		entity.takeHealing(self,rollDice("2d3+3"),DamageType.HOLY);
		self.rechargeLeft = self.rechargeTime;
		self.depleted = true;
	}
	else {
		tell( mSubject,self,' ',mVerb,'is',' not glowing at the moment.');
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


MonsterTypeList.spinyfrog.onTouch = function(entity,self) {
	let damage = entity.rollDamage(entity.damage);
	entity.takeDamage( self, damage, DamageType.POISON, function(attacker,victim,amount,damageType) {
		if( amount<=0 ) {
			tell(mSubject,victim,' ',mVerb,'ignore',' ',mObject|mPossessive,attacker,' spines.');
		}
		else {
			tell(mSubject,victim,' ',mVerb,'is',' stabbed by ',mObject|mPossessive,attacker,' spines.');			
		}
		return true;
	});
}

MonsterTypeList.bat.onTouch = function(entity,self) {
	let f = self.findAliveOthers().includeMe().isAlive().filter( e => e.name==self.name );
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


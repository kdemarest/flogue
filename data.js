// STATIC DATA

// WARNING: The strings for directions MUST remain the same for commandToDirection() to work.
const Command = { NONE: "none", N:"N", NE:"NE", E:"E", SE:"SE", S:"S", SW:"SW", W:"W", NW:"NW", WAIT: "wait", 
				INVENTORY: "inventory", PICKUP: "pickup", QUAFF: "quaff", GAZE: "gaze", THROW: "throw", LOSETURN: "lose turn", PRAY: "pray",
				ATTACK: "attack", USE: "use", LOOT: "loot", DROP: "drop",
				DEBUGKILL: "debugkill", DEBUGTHRIVE: "debugthrive", DEBUGVIEW: "debugview", DEBUGMAP: "debugmap", DEBUGTEST: "debugtest",
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
		if( typeId=='immunity' ) debugger;
		type.name = type.name || String.uncamel(typeId);
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

let Say = {};
DynamicViewList = {
	none: { tick: ()=>{}, render: ()=>{} }
};

const StickerList = {
	wallProxy: { img: "spells/air/static_discharge.png" },
	observerProxy: { img: "gems/Gem Type2 Yellow.png" },
	gateProxy: { img: "gems/Gem Type2 Green.png" },
	gateDownProxy: { img: "gems/Gem Type2 Purple.png" },
	unvisitedMap: { img: "gui/grey.png" },
	invUnmarked: { img: "gui/icons/unmarked.png" },
	invMarked: { img: "gui/icons/marked.png" },
	invAll: { img: "gui/icons/all.png", icon: 'all.png' },
	hit: { img: "effect/bolt04.png", scale: 0.4, xAnchor: 0.5, yAnchor: 0.5 },
	invisibleObserver: { img: "spells/enchantment/invisibility.png" },
	crosshairYes: { img: "dc-misc/cursor_green.png", scale: 1.0, xAnchor: 0, yAnchor: 0 },
	crosshairNo:  { img: "dc-misc/travel_exclusion.png", scale: 1.0, xAnchor: 0, yAnchor: 0 }

}

// Probably should do this at some point.
//const Travel = { WALK: 1, FLY: 2, SWIM: 4 };
let DEFAULT_DAMAGE_BONUS_FOR_RECHARGE = 0.20;
let DEFAULT_EFFECT_DURATION = 10;
let ARMOR_SCALE = 100;

const DamageType = { CUT: "cut", STAB: "stab", BITE: "bite", CLAW: "claw", BASH: "bash", BURN: "burn", FREEZE: "freeze", CORRODE: "corrode", POISON: "poison", SMITE: "smite", ROT: "rot" };
const ArmorDefendsAgainst = [DamageType.CUT,DamageType.STAB,DamageType.PIERCE,DamageType.BITE,DamageType.CLAW,DamageType.WHOMP];
const Attitude = { ENRAGED: "enraged", AGGRESSIVE: "aggressive", AWAIT: "await", HESITANT: "hesitant", CONFUSED: "confused", FEARFUL: "fearful", PANICKED: "panicked", WANDER: "wander", CALM: "calm", WORSHIP: "worshipping" };
const Team = { EVIL: "evil", GOOD: "good", NEUTRAL: "neutral", LUNAR: "lunar"};
const Job = { SMITH: "smith" };
const Slot = { HEAD: "head", NECK: "neck", LEFTHAND: "left hand", RIGHTHAND: "right hand", ARMS: "arms", WAIST: "waist", FEET: "feet", ARMOR: "torso", WEAPON: "weapon" };
const PickImmune = [DamageType.BURN,DamageType.FREEZE,DamageType.POISON,DamageType.SMITE,DamageType.ROT];
const PickVuln   = [DamageType.BURN,DamageType.FREEZE,DamageType.POISON,DamageType.SMITE,DamageType.ROT];
const PickResist = [DamageType.CUT,DamageType.STAB,DamageType.BASH,DamageType.BURN,DamageType.FREEZE,DamageType.POISON,DamageType.SMITE,DamageType.ROT];

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
	"poison": "posoned",
	"smite": "smitten",
	"rot": "rotted"
};


// Effect Events
// onTargetPosition - if this effect is targeting a map tile, instead of a monster.

let EffectTypeList = {
	inert: 			{ level:  0, rarity: 0.05, isInert: 1 },
	water: 			{ level:  0, rarity: 1.00, isWater: 1 },
	blank: 			{ level:  0, rarity: 1.00, isBlank: 1, name: 'blank paper' },
	invisibility: 	{ level: 10, rarity: 0.05, op: 'set', stat: 'invisible', value: true, isHelp: 1, requires: e=>!e.invisible },
	seeInvisible: 	{ level: 10, rarity: 0.50, op: 'set', stat: 'senseInvisible', value: true, isHelp: 1, name: 'see invisible' },
	haste: 			{ level:  7, rarity: 1.00, op: 'add', stat: 'speed', value: 1, isHelp: 1, requires: e=>e.speed<5 },
	slow: 			{ level:  3, rarity: 1.00, op: 'sub', stat: 'speed', value: 0.5, isHarm: 1, requires: e=>e.speed>0.5 },
	regeneration: 	{ level: 20, rarity: 1.00, op: 'add', stat: 'regenerate', value: 0.05, isHelp: 1 },
	flight: 		{ level:  2, rarity: 0.20, op: 'set', stat: 'travelMode', value: 'fly', isHelp: 1, requires: e=>e.travelMode==e.baseType.travelMode },
	healing: 		{ level:  0, rarity: 1.00, op: 'heal',   valueDamage: 6.00, isHelp: 1, isInstant: 1, healingType: DamageType.SMITE },
	poison: 		{ level:  1, rarity: 1.00, op: 'damage', valueDamage: 2.50, isHarm: 1, isInstant: 1, damageType: DamageType.POISON },
	fire: 			{ level:  0, rarity: 1.00, op: 'damage', valueDamage: 2.00, isHarm: 1, isInstant: 1, damageType: DamageType.BURN, mayTargetPosition: true },
	cold: 			{ level:  2, rarity: 1.00, op: 'damage', valueDamage: 1.60, isHarm: 1, isInstant: 1, damageType: DamageType.FREEZE, mayTargetPosition: true },
	holy: 			{ level:  3, rarity: 1.00, op: 'damage', valueDamage: 2.00, isHarm: 1, isInstant: 1, damageType: DamageType.SMITE },
	rot: 			{ level:  4, rarity: 1.00, op: 'damage', valueDamage: 2.00, isHarm: 1, isInstant: 1, damageType: DamageType.ROT },
	rage: 			{ level:  1, rarity: 1.00, op: 'set', stat: 'attitude', value: Attitude.ENRAGED, isHarm: 1 },
	panic: 			{ level:  5, rarity: 1.00, op: 'set', stat: 'attitude', value: Attitude.PANICKED, isHarm: 1 },
	confusion: 		{ level:  3, rarity: 1.00, op: 'set', stat: 'attitude', value: Attitude.CONFUSED, isHarm: 1 },
	blindness: 		{ level:  5, rarity: 1.00, op: 'set', stat: 'senseBlind', value: true, isHarm: 1, requires: e=>!e.blind },
	xray: 			{ level:  8, rarity: 0.20, op: 'set', stat: 'senseXray', value: true, isPlayerOnly: 1, name: 'earth vision' },
	greed: 			{ level:  0, rarity: 0.50, op: 'set', stat: 'senseItems', value: true, isPlayerOnly: 1, name: 'greed' },
	echoloc: 		{ level:  1, rarity: 0.50, op: 'set', stat: 'senseLife', value: true, isPlayerOnly: 1, name: 'bat sense' },
	luminari: 		{ level:  1, rarity: 1.00, op: 'add', stat: 'light', value: 3, isPlayerOnly: 1, name: 'luminari' },
	immunity: 		{ level: 30, rarity: 0.20, op: 'add', stat: 'immune',
					valuePick: () => pick(PickImmune), isHelp: 1, namePattern: 'immunity to {value}' },
	vulnerability: 	{ level: 10, rarity: 1.00, op: 'add', stat: 'vuln', requires: (e,effect)=>!e.isImmune(effect.value),
					valuePick: () => pick(PickVuln), isHarm: 1, namePattern: 'vulnerability to {value}' },
	resistance: 	{ level:  5, rarity: 0.50, op: 'add', stat: 'resist',
					valuePick: () => pick(PickImmune), isHelp: 1, namePattern: 'resist {value}s' },
	shove: 			{ level:  3, rarity: 1.00, op: 'shove', value: 3, isInstant: 1 },
};

EffectTypeList.fire.onTargetPosition = function(map,x,y) {
	map.tileSymbolSet(x,y,TileTypeList.flames.symbol);
}

EffectTypeList.cold.onTargetPosition = function(map,x,y) {
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


(function() {
	Object.entries(EffectTypeList).forEach( ([typeId,effectType]) =>  {
		effectType.typeId = typeId;
		if( !effectType.namePattern ) {
			effectType.name = effectType.name || typeId;
		}
	});
})();

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
	"oreVein":    { symbol: 'x', mayWalk: false, mayFly: false, opacity: 1, name: "ore vein", img: "dc-dngn/wall/lair0.png", isWall: true, mineSwings: 3, mineId: 'ore.ironOre' },
	"ghoststone": { symbol: 'J', mayWalk: false, mayFly: false, opacity: 0, name: "ghost stone", img: "dc-dngn/altars/dngn_altar_vehumet.png" },
	"obelisk":    { symbol: 'B', mayWalk: false, mayFly: false, opacity: 0, name: "obsidian obelisk", img: "dc-dngn/altars/dngn_altar_sif_muna.png" },
	"crystal":    { symbol: 'C', mayWalk: false, mayFly: false, opacity: 0, name: "shimmering crystal", glow:1, img: "dc-dngn/altars/dngn_altar_beogh.png" },
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
	water: 			{ img: "cyan" },
	invisibility: 	{ img: "clear" },
	haste: 			{ img: "cyan" },
	slow: 			{ img: "silver" },
	regeneration: 	{ img: "orange" },
	flight: 		{ img: "brilliant_blue" },
	healing: 		{ img: "pink" },
	poison: 		{ img: "emerald" },
	fire: 			{ img: "ruby" }, 
	cold: 			{ img: "brilliant_blue" }, 
	panic: 			{ img: "magenta" },
	rage: 			{ img: "dark" },
	confusion: 		{ img: "brown" },
	immunity: 		{ img: "white" },
	blindness: 		{ img: "black" },
	xray: 			{ img: "white" },
	greed: 			{ img: "white" },
	echoloc: 		{ img: "white" },
	luminari: 		{ img: "white" },
	vuln: 			{ img: "black" },
	resistance: 	{ img: "yellow" },
	shove: 			{ img: "black" }
};

let FabList = [];
function toFab(t) {
	FabList.push(t);
	return t;
}


const PotionEffects = toFab( Object.filter(EffectTypeList, e=>!e.isInert && !e.isBlank ) );
const SpellEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['blank','blindness','luminari','xray','echoloc','greed','slow','healing','poison','fire','cold','holy','rage','panic','confusion','shove','xray'].includes(k) ) );
const RingEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['inert','regeneration','resistance','greed'].includes(k) ) );
const WeaponEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['inert','poison','fire','cold','blindness','slow','panic','confusion','shove'].includes(k) ) );
const HelmEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['inert','regeneration', 'resistance','luminari'].includes(k) ) );
const ArmorEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['inert','regeneration', 'immunity', 'resistance'].includes(k) ) );
const BracersEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['inert','resistance'].includes(k) ) );
const BootsEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['inert','regeneration', 'flight', 'resistance'].includes(k) ) );
const DartEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['inert','poison','fire','cold','blindness','slow','vuln'].includes(k) ) );
const GemEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['inert','luminari','greed','echoloc','seeInvisible'].includes(k) ) );

PotionEffects.healing.rarity = 10.00;

const WeaponList = toFab({
	"rock":     	{ level:  0, damageMultiplier: 0.50, damageType: DamageType.BASH, mayThrow: true, range: 7, attackVerb: 'strike' },
	"dart":     	{ level:  0, damageMultiplier: 0.20, damageType: DamageType.STAB, effectChance: 0.80, effects: DartEffects, mayThrow: true, range: 10, attackVerb: 'strike' },
	"dagger":   	{ level:  0, damageMultiplier: 0.70, damageType: DamageType.STAB, effectChance: 0.30, mayThrow: true, range: 4, attackVerb: 'strike' },
	"solKnife":   	{ level:  0, damageMultiplier: 0.60, damageType: DamageType.CUT , attackVerb: 'carve', neverPick: true, isSoulCollector: true, name: "sol knife" },
	"club":   		{ level:  0, damageMultiplier: 0.70, damageType: DamageType.BASH, attackVerb: 'smash' },
	"sword": 		{ level:  0, damageMultiplier: 1.00, damageType: DamageType.CUT },
	"greatsword": 	{ level:  0, damageMultiplier: 1.20, damageType: DamageType.CUT },
	"mace": 		{ level:  0, damageMultiplier: 0.90, damageType: DamageType.BASH },
	"hammer": 		{ level:  0, damageMultiplier: 1.40, damageType: DamageType.BASH },
	"axe": 			{ level:  0, damageMultiplier: 1.00, damageType: DamageType.CUT, mayThrow: true, range: 5, attackVerb: 'strike' },
	"spear": 		{ level:  0, damageMultiplier: 0.70, damageType: DamageType.STAB, reach: 2, mayThrow: true, range: 6, attackVerb: 'strike' },
	"pike": 		{ level:  0, damageMultiplier: 0.90, damageType: DamageType.STAB, reach: 2 },
	"pitchfork": 	{ level:  0, damageMultiplier: 1.20, damageType: DamageType.STAB, reach: 2, mayThrow: true, range: 4 },
});

const WeaponMaterialList = toFab({
	"iron": 		{ level:  1, toMake: 'iron ingot'},
	"silver": 		{ level:  5, toMake: 'silver ingot' },
	"ice": 			{ level: 10, toMake: 'ice block' },
	"glass": 		{ level: 20, toMake: 'malachite' },
	"lunarium": 	{ level: 30, toMake: 'lunarium ingot' },
	"solarium": 	{ level: 40, toMake: 'solarium ingot' },
	"deepium": 		{ level: 50, toMake: 'deepium ingot' },
});

const ArmorList = toFab({
	"fur": 			{ level:  1, armorMultiplier: 0.50, ingredientId: 'leather' },
	"hide": 		{ level:  2, armorMultiplier: 0.60, ingredientId: 'leather' },
	"leather": 		{ level:  4, armorMultiplier: 0.80, ingredientId: 'leather' },
	"studded": 		{ level:  6, armorMultiplier: 0.90, ingredientId: 'iron ingot' },
	"chain": 		{ level: 10, armorMultiplier: 1.00, ingredientId: 'iron ingot' },
	"steelPlate": 	{ level: 15, armorMultiplier: 1.00, ingredientId: 'iron ingot' },
	"trollHideArmor": 	{ level: 20, armorMultiplier: 1.20, ingredientId: 'troll hide' },
	"chitin": 		{ level: 25, armorMultiplier: 1.00, ingredientId: 'chitin' },
	"elven": 		{ level: 30, armorMultiplier: 1.30, ingredientId: 'chitin' },
	"dwarven": 		{ level: 35, armorMultiplier: 1.10, ingredientId: 'chitin' },
	"ice": 			{ level: 40, armorMultiplier: 1.00, ingredientId: 'ice block' },
	"glass": 		{ level: 45, armorMultiplier: 1.00, ingredientId: 'malachite' },
	"demon": 		{ level: 50, armorMultiplier: 1.00, ingredientId: 'malachite' },
	"lunar": 		{ level: 55, armorMultiplier: 1.00, ingredientId: 'lunarium ingot' },
	"solar": 		{ level: 60, armorMultiplier: 1.00, ingredientId: 'solarium ingot' },
	"deep": 		{ level: 65, armorMultiplier: 1.00, ingredientId: 'deepium ingot' },
});

const OreList = toFab({
	"ironOre": 		{ name: "iron ore", refinesTo: "iron ingot", img: 'i-protection' },
	"copperOre": 	{ name: "copper ore", refinesTo: "copper ingot", img: 'i-protection' },
	"silverOre": 	{ name: "silver ore", refinesTo: "silver ingot", img: 'i-protection' },
	"goldOre": 		{ name: "gold ore", refinesTo: "gold ingot", img: 'i-protection' },
	"tinOre": 		{ name: "tin ore", refinesTo: "tin ingot", img: 'i-protection' },
	"malachiteOre": { name: "malachite ore", refinesTo: "malachite ingot", img: 'i-protection' },
	"lunariumOre": 	{ name: "lunarium ore", refinesTo: "lunarium ingot", img: 'i-protection' },
	"solariumOre": 	{ name: "solarium ore", refinesTo: "solarium ingot", img: 'i-protection' },
	"deepiumOre": 	{ name: "deepium ore", refinesTo: "deepium ingot", img: 'i-protection' },
	"moonsteelOre": { name: "moonsteel ore", refinesTo: "moonsteel ingot", img: 'i-protection' }
});

const GemQualityList = toFab({
	"flawed": 		{ priceMultiplier: 0.5 },
	"quality": 		{ priceMultiplier: 1.0 },
	"flawless": 	{ priceMultiplier: 1.5 }
});

const GemList = toFab({
	"garnet": 		{ intrinsicEffect: "healing", img: "Gem Type1 Red" },
	"opal": 		{ intrinsicEffect: "flight", img: "Gem Type1 Yellow" },
	"ruby": 		{ intrinsicEffect: "fire", img: "Gem Type2 Red" },
	"emerald": 		{ intrinsicEffect: "poison", img: "Gem Type2 Green" },
	"sapphire": 	{ intrinsicEffect: "cold", img: "Gem Type2 Blue" },
	"diamond": 		{ intrinsicEffect: "invisibility", img: "Gem Type3 Black" },
});

const StuffList = toFab({
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
	"brass": 	{ img: 'brass' },
	"copper": 	{ img: 'bronze' },
	"silver": 	{ img: 'silver' },
	"gold": 	{ img: 'gold' }
});

const RingList = GemList;

const NulImg = { img: '' };

// Item Events
// onPickup - fired just before an item is picked up. Return false to disallow the pickup.
// onTick - fires each time a full turn has passed, for every item, whether in the world or in an inventory. 
const CommandLeavesInventoryOpen = [Command.USE,Command.LOOT];
const CommandIsInstant = [Command.USE];

const ARMOR_EFFECT_CHANCE_TO_FIRE = 10;
const ARMOR_EFFECT_OP_ALWAYS = ['damage'];
const ARMOR_EFFECT_DAMAGE_PERCENT = 10;

const WEAPON_EFFECT_CHANCE_TO_FIRE = 10;
const WEAPON_EFFECT_OP_ALWAYS = ['damage'];
const WEAPON_EFFECT_DAMAGE_PERCENT = 10;

const ItemTypeList = {
	"random":	{ symbol: '*', isRandom: 1, mayPickup: false, neverPick: true },
// GATEWAYS
	"stairsDown": { symbol: '>', name: "stairs down", gateDir: 1, gateInverse: 'stairsUp', mayPickup: false, neverPick: true, useVerb: 'descend', img: "dc-dngn/gateways/stone_stairs_down.png" },
	"stairsUp":   { symbol: '<', name: "stairs up", gateDir: -1, gateInverse: 'stairsDown', mayPickup: false, neverPick: true, useVerb: 'ascend', img: "dc-dngn/gateways/stone_stairs_up.png" },
	"gateway":    { symbol: 'y', name: "gateway", gateDir: 0, gateInverse: 'gateway', mayPickup: false, neverPick: true, useVerb: 'enter', img: "dc-dngn/gateways/dngn_enter_dis.png" },
	"portal":     { symbol: 'Ώ', name: "portal", gateDir: 0, gateInverse: 'portal', mayPickup: false, neverPick: true, useVerb: 'touch', img: "dc-dngn/gateways/dngn_portal.png" },
// DECOR
	"columnBroken": { symbol: 'O', mayWalk: false, mayFly: false, name: "broken column", neverPick: true, img: "dc-dngn/crumbled_column.png" },
	"columnStump":  { symbol: 'o', mayWalk: false, mayFly: true, name: "column stump", neverPick: true, img: "dc-dngn/granite_stump.png" },

	"altar":    { symbol: 'A', mayWalk: false, mayFly: false, name: "golden altar", mayPickup: false, light: 4, glow:true,
				rechargeTime: 12, healMultiplier: 3.0, neverPick: true,
				img: "dc-dngn/altars/dngn_altar_shining_one.png" },
	"fountain": { symbol: 'F', mayWalk: false, mayFly: true, name: "fountain", mayPickup: false,
				neverPick: true, img: "dc-dngn/dngn_blue_fountain.png" },
// CORPSE
	"corpse":   { symbol: 'X', namePattern: "remains of a {mannerOfDeath} {usedToBe}", isCorpse: true, neverPick: true,
				img: 'UNUSED/spells/components/skull.png', icon: "corpse.png" },
// TREASURE
	"coin": { symbol: '$', isTreasure: 1, namePattern: '{goldCount} gold', goldCount: 0, goldVariance: 0.30, isGold: true,
				rarity: /*50*/1.00, img: "item/misc/gold_pile.png", icon: 'coin.png' },
	"potion":   { symbol: '¡', isTreasure: 1, namePattern: 'potion{?effect}', charges: 1, light: 3, glow: true, attackVerb: 'splash',
				rarity:  5.00, effectDuration: '1d4+4', isPotion: true,
				effects: PotionEffects, mayThrow: true, destroyOnLastCharge: true,
				imgGet: (self,img)=>"item/potion/"+(img || (ImgPotion[self.effect?self.effect.typeId:'']||NulImg).img || "emerald")+".png", imgChoices: ImgPotion, icon: 'potion.png' },
	"spell":    { symbol: 'ᵴ', isTreasure: 1, namePattern: 'spell{?effect}', rechargeTime: '3d4', effects: SpellEffects,
				rarity:  0.50, isSpell: true,
				img: "item/scroll/scroll.png", icon: 'spell.png' },
	"ore": 		{ symbol: '"', isTreasure: 1, namePattern: '{variety}', varieties: OreList, isOre: true, neverPick: true,
				rarity:  0.01,	// Has to be non-neverPick to be chosen from the picker. Hmm...
				imgGet: (self,img) => "item/ring/"+(img || self.variety.img || "i-protection")+".png", imgChoices: OreList, icon: 'ore.png' },
	"gem": 		{ symbol: "^", isTreasure: 1, namePattern: '{quality} {variety}{?effect}', qualities: GemQualityList, varieties: GemList, effects: GemEffects, isGem: true,
				rarity: 2.00, effectChance: 0.20, mayThrow: 1, mayTargetPosition: 1, autoCommand: Command.USE,
				imgGet: (self,img) => "gems/"+(img || self.variety.img || "Gem Type2 Black")+".png", imgChoices: GemList, scale:0.3, xAnchor: -0.5, yAnchor: -0.5, icon: 'gem.png' },
	"weapon": 	{ symbol: '†', isTreasure: 1, namePattern: '{material} {variety} {?effect}', materials: WeaponMaterialList, varieties: WeaponList, effects: WeaponEffects, slot: Slot.WEAPON, isWeapon: true,
				rarity: 10.00,
				useVerb: 'weild', mayTargetPosition: true,
				effectChance: 0.05,
				img: "item/weapon/dagger.png", icon: 'weapon.png' },
	"helm": 	{ symbol: '[', isTreasure: 1, namePattern: "{variety} helm{?effect}", varieties: ArmorList, effects: HelmEffects, slot: Slot.HEAD, isHelm: true, isArmor: true,
				rarity: 2.00,
				effectChance: 0.05,
				armorMultiplier: 0.15,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "item/armour/headgear/helmet2_etched.png", icon: 'helm.png' },
	"armor": 	{ symbol: '&', isTreasure: 1, namePattern: "{variety} armor{?effect}", varieties: ArmorList, effects: ArmorEffects, slot: Slot.ARMOR, isArmor: true,
				rarity: 2.00,
				effectChance: 0.05,
				armorMultiplier: 0.60,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "player/body/armor_mummy.png", icon: 'armor.png' },
	"bracers": 	{ symbol: ']', isTreasure: 1, namePattern: "{variety} bracers{?effect}", varieties: ArmorList, effects: BracersEffects, slot: Slot.ARMS, isBracers: true, isArmor: true,
				rarity: 2.00,
				effectChance: 0.05,
				armorMultiplier: 0.15,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "UNUSED/armour/gauntlet1.png", icon: 'gauntlets.png' },
	"boots": 	{ symbol: 'b', isTreasure: 1, namePattern: "{variety} boots{?effect}", varieties: ArmorList, slot: Slot.FEET, isBoots: true, isArmor: true, effects: BootsEffects,
				rarity: 2.00,
				effectChance: 0.05,
				armorMultiplier: 0.10,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "item/armour/boots2_jackboots.png", icon: 'boots.png' },
	"ring": 	{ symbol: '=', isTreasure: 1, namePattern: "{material} {variety} ring{?effect}", materials: RingMaterialList, varieties: RingList,
				effects: RingEffects, slot: Slot.LEFTHAND, isRing: true,
				rarity: 0.50,
				effectChance: 0.10,
				useVerb: 'wear', triggerOnUse: true, effectOverride: { duration: true },
				imgGet: (self,img) => "item/ring/"+(img || self.material.img || 'gold')+".png", imgChoices: RingMaterialList, icon: 'ring.png' },
// INGREDIENTS
	"stuff": 	{ symbol: '%', isTreasure: 1, namePattern: "{variety}{?effect}", varieties: StuffList,
				rarity: 15.00,
				imgGet: (self,img) => "item/"+(img || (self?self.variety.img:'') || 'misc/misc_rune')+".png", imgChoices: StuffList, icon: 'stuff.png' },

};
const ItemSortOrder = ['weapon','helm','armor','bracers','boots','ring','potion','gem','ore','spell','stuff'];


const Brain = { AI: "ai", USER: "user" };

const MonsterTypeDefaults = {
					level: 1, power: '3:10', team: Team.EVIL, damageType: DamageType.CUT, img: "dc-mon/acid_blob.png", pronoun: 'it',
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

// Monster Events
// onAttacked - fired when the monster gets attacked, even if damage nets to zero.
// onAttack - fires when ever the monster attacks, so you can pile on extra effects.
// onTouch - fires if somebody steps into you but doesn't attack you. Like when confused.
// onHeal - fires when you get healing. return true to suppress the auto-generated message about healing.

let UndeadImmunity = [DamageType.FREEZE,DamageType.ROT,DamageType.POISON,Attitude.PANICKED,Attitude.ENRAGED,Attitude.CONFUSED,'blind'].join(',');
let SkeletonImmunity = UndeadImmunity+[DamageType.CUT,DamageType.STAB].join(',');
let UndeadResistance = [DamageType.CUT,DamageType.STAB].join(',');
let UndeadVulnerability = [DamageType.SMITE,DamageType.BURN].join(',');
let ShadowImmunity = [DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.BASH,DamageType.BURN,DamageType.FREEZE,DamageType.CORRODE,DamageType.POISON,DamageType.ROT].join(',');

let OozeImmunity = ['blind',DamageType.CORRODE,DamageType.STAB,DamageType.BASH,DamageType.POISON,Attitude.PANICKED].join(',');
let OozeResistance = [DamageType.CUT,Attitude.ENRAGED,Attitude.CONFUSED].join(',');
let OozeVulnerability = [DamageType.BURN,DamageType.FREEZE].join(',');

let DemonImmunity = [DamageType.BURN].join(',');
let DemonResistance = [DamageType.POISON,DamageType.STAB].join(',');
let DemonVulnerability = [DamageType.SMITE,DamageType.FREEZE].join(',');
const MonsterTypeList = {

// GOOD TEAM
	"player": {
		core: [ '@', 1, '3:10', 'good', 'cut', 'player.png', 'he' ],
		attitude: Attitude.CALM,
		brain: Brain.USER,
		brainOpensDoors: true,
		brainTalk: true,
		light: 9,
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
		inventoryLoot: '30x 100% stuff',
		properNoun: true,
		packAnimal: true
	},
	"mastiff": {
		core: [ 'm', 10, '10:10', 'good', 'bite', 'UNUSED/spells/components/dog2.png', '*' ],
		name: "Rover/Fluffy",
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
		loot: '30% mushroomBread, 30% coin, 10% potion.healing',
	},

// EVIL TEAM
	"Avatar of Balgur": {
		core: [ 'a', 30, '25:2', 'evil', 'burn', 'dc-mon/hell_knight.png', 'he' ],
		brainAlertFriends: true,
		brainTalk: true,
		immune: [DamageType.BURN,Attitude.PANICKED].join(','),
		isDemon: true,
		sayPrayer: 'I shall rule this planet!',
		rarity: 0.000000001,
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"demon": {
		core: [ 'D', 5, '3:5', 'evil', 'burn', 'player/base/draconian_red_f.png', 'it' ],
		brainAlertFriends: true,
		brainTalk: true,
		immune: DemonImmunity,
		isDemon: true,
		loot: '30% coin, 50% potion.fire, 30% demonScale, 20% pitchfork, 30% demonEye',
		packAnimal: true,
		resist: DemonResistance,
		sayPrayer: 'Hail Balgur, ruler of the deep!',
		vuln: DemonVulnerability,
	},
	"ethermite": {
		core: [ 'e', 10, '3:20', 'evil', 'bite', 'dc-mon/shining_eye.png', '*' ],
		glow: true,
		invisible: true,
		isPlanar: 1,
		light: 6,
		loot: '50% gem.seeInvisible, 30% gem, 20% gem',
		packAnimal: true,
		sneakAttackMult: 3
	},
	"ghoul": {
		core: [ 'G', 4, '1:2', 'evil', 'rot', 'dc-mon/undead/ghoul.png', 'it' ],
		immune: UndeadImmunity,
		dark: 2,
		isUndead: true,
		loot: '30% coin, 20% potion.rot, 50% ghoulFlesh',
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
		glow: 1,
		immune: DamageType.BURN,
		isDemon: true,
		loot: '30% potion.fire, 30% impBrain',
		senseInvisible: true,
		travelMode: "fly",
		vuln: DemonVulnerability
	},
	"kobold": {
		core: [ 'k', 1, '4:20', 'evil', 'cut', 'dc-mon/kobold.png', '*' ],
		attitude: Attitude.HESITANT,
		brainAlertFriends: true,
		brainTalk: true,
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
		resist: DamageType.CUT+','+DamageType.STAB,
		speed: 0.5
	},
	"redOoze": {
		core: [ 'z', 1, '2:3', 'evil', 'corrode', 'dc-mon/jelly.png', 'it' ],
		name: "red ooze",
		glow: 4,
		immune: OozeImmunity,
		isPlanar: true,
		loot: '90% potion.corrode, 40% redOozeSlime',
		regenerate: 0.15,
		resist: OozeResistance,
		speed: 0.75,
		vuln: OozeVulnerability
	},
	"blueScarab": {
		core: [ 'q', 6, '3:30', 'evil', 'freeze', 'dc-mon/animals/boulder_beetle.png', 'it' ],
		namePattern: "blue scarab",
		glow: 3,
		immune: DamageType.FREEZE,
		isPlanar: true,
		loot: '30% gem, 50% scarabCarapace',
		travelMode: "fly",
		vuln: DamageType.BURN
	},
	"redScarab": {
		core: [ 'h', 12, '3:30', 'evil', 'burn', 'dc-mon/animals/boulder_beetle.png', 'it' ],
		namePattern: "red scarab",
		glow: 3,
		immune: DamageType.BURN,
		isPlanar: true,
		loot: '30% gem, 50% scarabCarapace',
		travelMode: "fly",
		vuln: DamageType.FREEZE
	},
	"shadow": {
		core: [ 'w', 8, '1:12', 'evil', 'rot', 'dc-mon/undead/shadow.png', 'it' ],
		dark: 6,
		immune: ShadowImmunity,
		isUndead: true,
		loot: '50% darkEssence, 20% potion.blindness',
		speed: 0.75,
		vuln: DamageType.SMITE
	},
	"skeleton": {
		core: [ 's', 3, '2:10', 'evil', 'claw', 'dc-mon/undead/skeletons/skeleton_humanoid_small.png', 'it' ],
		immune: SkeletonImmunity,
		isUndead: true,
		loot: '50% bones, 50% skull',
		vuln: DamageType.SMITE
	},
	"skeletonLg": {
		core: [ 'S', 13, '2:8', 'evil', 'claw', 'dc-mon/undead/skeletons/skeleton_humanoid_large.png', 'it' ],
		name: 'ogre skeleton',
		immune: SkeletonImmunity,
		isUndead: true,
		loot: '50% bones, 50% skull',
		vuln: DamageType.SMITE
	},
	"soldierAnt": {
		core: [ 'c', 1, '2:22', 'evil', 'bite', 'dc-mon/animals/soldier_ant.png', 'it' ],
		name: "soldier ant",
		brainAlertFriends: true,
		loot: '10% potion, 20% facetedEye, 10% antGrubMush',
		isAnimal: true,
		speed: 1.5,
		vuln: DamageType.FREEZE
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
		vuln: DamageType.BURN
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
		vuln: DamageType.BURN
	},

// NEUTRAL TEAM
	"bat": {
		core: [ 'ᵬ', 1, '2:20', 'neutral', 'bite', 'dc-mon/animals/giant_bat.png', 'it' ],
		attitude: Attitude.WANDER,
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
		immune: DamageType.POISON,
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
	}
})();


TileTypeList['lockedDoor'].onTouch = function(entity,self) {
	if( entity.brainOpensDoors ) {
		entity.map.tileSymbolSet( self.x, self.y, TileTypeList.door.symbol );
		tell(mSubject,entity,' ',mVerb,'open',' the ',mObject,self);
	}
}

TileTypeList.obelisk.onTouch = function(entity,self) {
	if( !entity.senseBlind ) {
		tell(mSubject,entity,' ',mVerb,'touch',' ',mObject,self,'.');
		deedAdd(self,entity,10,'senseBlind','set',true);
	}
	else {
		tell(mSubject,entity,' ',mVerb,'touch',' ',mObject,self,' but ',mVerb,'are',' already blind.');
	}
}

TileTypeList.crystal.onTouch = function(entity,self) {
	if( entity.speed <= 1 ) {
		tell(mSubject,entity,' ',mVerb,'touch',' ',mObject,self,' and ',mSubject|mVerb,'blur',' with speed!');
		deedAdd(self,entity,3,'speed','add',1);
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
	entity.takeDamage( self, rollDice(self.damage), self.damageType );
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
	entity.takeDamage( self, rollDice(self.damage), self.damageType );
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

TileTypeList.oreVein.onTouch = function(entity,self) {
	if( !self.isPosition ) debugger;
	entity.swings = (entity.swings||0)+1;
	animationAdd( new AniPaste({
		entity: 	entity, 
		sticker: 	self.img,
		duration: 	3.0,
		onTick: 	function(delta) { this.yOfs -= delta*32; }
	}));

	if( entity.swings >= self.mineSwings ) {
		entity.swings = 0;
		let level     = self.map.level;
		entity.map.tileSymbolSetFloor( self.x, self.y );
		new Picker(self.map.level).pickLoot( self.mineId || "ore", loot=>{
			loot.giveTo(self.map,self.x,self.y);
		});
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

TileTypeList.ghoststone.onTouch = function(entity,self) {
	if( !entity.invisible ) {
		tell( mSubject,entity,' ',mVerb,['touch','touches'],' ',mObject,self,'.' );
		deedAdd( self, entity, 10, 'invisible', 'set', true );
	}
	else {
		tell( mSubject,entity,' ',mVerb,'touch',' ',mObject,self,', but ',mVerb,'are',' already invisible.');
	}
}

ItemTypeList.altar.onTouch = function(entity,self) {
	if( !self.rechargeLeft) {
		let picker = new Picker(entity.map.level);
		entity.takeHealing(self,picker.pickDamage(self.rechargeTime)*self.healMultiplier,DamageType.SMITE);
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


MonsterTypeList.spinyFrog.onAttacked = function(attacker,amount,damageType) {
	let damage = this.rollDamage(this.damage);
	attacker.takeDamagePassive( this, damage, DamageType.POISON, function(attacker,victim,amount,damageType) {
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
	let effect = Object.assign({},EffectTypeList.vulnerability,{value: DamageType.FREEZE});
	effectApply(this,effect,target);
}

MonsterTypeList.redScarab.onAttack = function(target) {
	let effect = Object.assign({},EffectTypeList.vulnerability,{value: DamageType.BURN});
	effectApply(this,effect,target);
}

MonsterTypeList.redOoze.onMove = function(self,x,y) {
	let f = self.map.findItem().at(x,y).filter( i=>i.isCorpse );
	if( f.first && self.health < self.healthMax ) {
		tell(mSubject,self,' ',mVerb,'absorb',' ',mObject,f.first,' and ',mVerb,'regain',' strength!');
		let heal = Math.floor(self.healthMax * 0.25);
		self.takeHealing(self,heal,DamageType.CORRODE,true);
		animationAdd( new AniPaste({
			entity: this, xOfs: 0.5, yOfs: 0.5,
			sticker: self,
			x: x,
			y: y,
			duration: 0.5,
			onTick: function(delta) { this.scale *= delta*4; }
		}));
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
		z: Command.DEBUGMAP,
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

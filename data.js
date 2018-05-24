// STATIC DATA

// WARNING: The strings for directions MUST remain the same for commandToDirection() to work.
const Command = { NONE: "none", N:"N", NE:"NE", E:"E", SE:"SE", S:"S", SW:"SW", W:"W", NW:"NW", WAIT: "wait", 
				INVENTORY: "inventory", PICKUP: "pickup", QUAFF: "quaff", THROW: "throw", LOSETURN: "lose turn", PRAY: "pray",
				ATTACK: "attack", USE: "use", LOOT: "loot", TEST: "test",
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

let SymbolToType = {};
let TypeToSymbol = {};

function fab(type,typeId,isWhat) {
	if( isWhat ) {
		type[isWhat] = true;
	}
	if( !type.namePattern ) {
		if( typeId=='immunity' ) debugger;
		type.name = type.name || typeId;
	}
	type.typeId = typeId;
	type.type = type;
	if( type.symbol ) {
		if( SymbolToType[type.symbol] ) {
			debugger;
		}
		SymbolToType[type.symbol] = type;
		TypeToSymbol[typeId] = type.symbol;
	}
	return type;
}


const StickerList = {
	wallProxy: { img: "spells/air/static_discharge.png" },
	observerProxy: { img: "gems/Gem Type2 Purple.png" },
	gateProxy: { img: "gems/Gem Type2 Purple.png" },
	hit: { img: "effect/bolt04.png", scale: 0.4, xAnchor: 0.5, yAnchor: 0.5 },
	invisibleObserver: { symbol: '?', img: "spells/enchantment/invisibility.png" },
	crosshairYes: { img: "dc-misc/cursor_green.png", scale: 1.0, xAnchor: 0, yAnchor: 0 },
	crosshairNo:  { img: "dc-misc/travel_exclusion.png", scale: 1.0, xAnchor: 0, yAnchor: 0 }

}

// Probably should do this at some point.
//const Travel = { WALK: 1, FLY: 2, SWIM: 4 };
let DEFAULT_DAMAGE_BONUS_FOR_RECHARGE = 0.20;
let DEFAULT_EFFECT_DURATION = 10;
let ARMOR_SCALE = 100;

const DamageType = { CUT: "cut", STAB: "stab", BITE: "bite", CLAW: "claw", BASH: "bash", BURN: "burn", FREEZE: "freeze", POISON: "poison", SMITE: "smite", ROT: "rot" };
const ArmorDefendsAgainst = [DamageType.CUT,DamageType.STAB,DamageType.PIERCE,DamageType.BITE,DamageType.CLAW,DamageType.WHOMP];
const Attitude = { ENRAGED: "enraged", AGGRESSIVE: "aggressive", HESITANT: "hesitant", CONFUSED: "confused", FEARFUL: "fearful", PANICKED: "panicked", WANDER: "wander", CALM: "calm", WORSHIP: "worshipping" };
const Team = { EVIL: "evil", GOOD: "good", NEUTRAL: "neutral", LUNAR: "lunar"};
const Slot = { HEAD: "head", NECK: "neck", LEFTHAND: "left hand", RIGHTHAND: "right hand", ARMS: "arms", WAIST: "waist", FEET: "feet", ARMOR: "torso", WEAPON: "weapon" };
const PickImmune = [DamageType.BURN,DamageType.FREEZE,DamageType.POISON,DamageType.SMITE,DamageType.ROT];
const PickVuln   = [DamageType.BURN,DamageType.FREEZE,DamageType.POISON,DamageType.SMITE,DamageType.ROT];
const PickResist = [DamageType.CUT,DamageType.STAB,DamageType.BASH,DamageType.BURN,DamageType.FREEZE,DamageType.POISON,DamageType.SMITE,DamageType.ROT];

// Effect Events
// onTargetPosition - if this effect is targeting a map tile, instead of a monster.

let EffectTypeList = {
	invisibility: 	{ level: 10, rarity: 0.05, op: 'set', stat: 'invisible', value: true, isHelp: 1, requires: e=>!e.invisible },
	seeinvisible: 	{ level: 10, rarity: 0.50, op: 'set', stat: 'seeInvisible', value: true, isHelp: 1, name: 'see invisible' },
	blindness: 		{ level:  5, rarity: 1.00, op: 'set', stat: 'blind', value: true, isHarm: 1, requires: e=>!e.blind },
	haste: 			{ level:  7, rarity: 1.00, op: 'add', stat: 'speed', value: 1, isHelp: 1, requires: e=>e.speed<5 },
	slow: 			{ level:  3, rarity: 1.00, op: 'sub', stat: 'speed', value: 0.5, isHarm: 1, requires: e=>e.speed>0.5 },
	regeneration: 	{ level: 20, rarity: 1.00, op: 'add', stat: 'regenerate', value: 0.05, isHelp: 1 },
	flight: 		{ level:  2, rarity: 0.20, op: 'set', stat: 'travelMode', value: 'fly', isHelp: 1, requires: e=>e.travelMode==e.type.travelMode },
	healing: 		{ level:  1, rarity: 1.00, op: 'heal',   valueDamage: 6.00, isHelp: 1, isInstant: 1, healingType: DamageType.SMITE },
	poison: 		{ level:  1, rarity: 1.00, op: 'damage', valueDamage: 1.30, isHarm: 1, isInstant: 1, damageType: DamageType.POISON },
	fire: 			{ level:  1, rarity: 1.00, op: 'damage', valueDamage: 1.00, isHarm: 1, isInstant: 1, damageType: DamageType.BURN, mayTargetPosition: true },
	cold: 			{ level:  2, rarity: 1.00, op: 'damage', valueDamage: 0.80, isHarm: 1, isInstant: 1, damageType: DamageType.FREEZE, mayTargetPosition: true },
	holy: 			{ level:  3, rarity: 1.00, op: 'damage', valueDamage: 1.00, isHarm: 1, isInstant: 1, damageType: DamageType.SMITE },
	rot: 			{ level:  4, rarity: 1.00, op: 'damage', valueDamage: 1.00, isHarm: 1, isInstant: 1, damageType: DamageType.ROT },
	rage: 			{ level:  1, rarity: 1.00, op: 'set', stat: 'attitude', value: Attitude.ENRAGED, isHarm: 1 },
	panic: 			{ level:  5, rarity: 1.00, op: 'set', stat: 'attitude', value: Attitude.PANICKED, isHarm: 1 },
	confusion: 		{ level:  3, rarity: 1.00, op: 'set', stat: 'attitude', value: Attitude.CONFUSED, isHarm: 1 },
	immunity: 		{ level: 30, rarity: 0.20, op: 'add', stat: 'immune',
					valuePick: () => pick(PickImmune), isHelp: 1, namePattern: 'immunity to {value}' },
	vulnerability: 	{ level: 10, rarity: 1.00, op: 'add', stat: 'vuln', requires: (e,effect)=>!e.isImmune(effect.value),
					valuePick: () => pick(PickVuln), isHarm: 1, namePattern: 'vulnerability to {value}' },
	resistance: 	{ level: 10, rarity: 0.50, op: 'add', stat: 'resist',
					valuePick: () => pick(PickImmune), isHelp: 1, namePattern: 'resist {value}s' },
	shove: 			{ level:  3, rarity: 1.00, op: 'push', value: 3, isInstant: 1 },
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
	seeInvisible: function(subj,obj,oldValue,newValue) {
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



const TileTypeDefaults = { mayWalk: false, mayFly: false, opacity: 0,
							damage: '', damageType: DamageType.BASH, img: null };
const TileTypeList = {
	"floor":      { symbol: '.', mayWalk: true,  mayFly: true,  opacity: 0, name: "floor", img: "dc-dngn/floor/pebble_brown0.png", isFloor: true },
	"grass":      { symbol: ',', mayWalk: true,  mayFly: true,  opacity: 0, name: "grass", img: "dc-dngn/floor/grass/grass_flowers_blue1.png", isFloor: true },
	"wall":       { symbol: '#', mayWalk: false, mayFly: false, opacity: 1, name: "wall", img: "dc-dngn/wall/brick_brown0.png", isWall: true },
	"glass":      { symbol: '▢', mayWalk: false, mayFly: false, opacity: 0, name: "glass", img: "dc-dngn/wall/dngn_mirrored_wall.png", isWall: true },
	"pit":        { symbol: ':', mayWalk: false, mayFly: true,  opacity: 0, name: "pit", img: "dc-dngn/pit.png" },
	"shaft":      { symbol: ';', mayWalk: false, mayFly: true,  opacity: 0, name: "shaft", img: "dc-dngn/dngn_trap_shaft.png" },
	"door":       { symbol: '+', mayWalk: true,  mayFly: true,  opacity: 1, name: "locked door", img: "dc-dngn/dngn_open_door.png" },
	"lockedDoor": { symbol: '±', mayWalk: false, mayFly: false, opacity: 1, name: "door", img: "dc-dngn/dngn_closed_door.png" },
	"fire":       { symbol: 'ᵮ', mayWalk: true,  mayFly: true,  opacity: 0, name: "fire", light: 5, glow:1, damage: '1d4', damageType: DamageType.BURN, img: "dc-mon/nonliving/fire_elemental.png" },
	"water":      { symbol: '~', mayWalk: true, mayFly: true,  maySwim: true, opacity: 0, name: "water", img: "dc-dngn/water/dngn_shoals_shallow_water1.png" },
	"lava":    	  { symbol: '⍨', mayWalk: true, mayFly: true,  maySwim: true, opacity: 0, name: "lava", light: 5, glow:1, damage: '3d20', damageType: DamageType.BURN, img: "UNUSED/features/dngn_lava.png" },
	"mist":       { symbol: '░', mayWalk: true,  mayFly: true,  opacity: 0.3, name: "mist", img: "effect/cloud_grey_smoke.png", layer: 3 },
	"mud":        { symbol: '⋍', mayWalk: true,  mayFly: true,  opacity: 0, name: "mud", img: "dc-dngn/floor/dirt0.png" },
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
	symbol: '?', namePattern: 'nameless *',
	mayWalk: true, mayFly: true, opacity: 0, triggerOnPickup: false,
	img: null
}

const ImgPotion = {
	invisibility: 	{ img: "clear" },
	blindness: 		{ img: "black" },
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
	vuln: 			{ img: "black" },
	resistance: 	{ img: "yellow" },
	shove: 			{ img: "black" }
};

let FabList = [];
function toFab(t) {
	FabList.push(t);
	return t;
}

const PotionEffects = toFab( Object.assign({},EffectTypeList) );
const SpellEffects = toFab( Object.filter(EffectTypeList, e=>e.isHarm ) );
const RingEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['regeneration','resistance'].includes(k) ) );
const WeaponEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['poison','fire','cold','blindness','slow','panic','confusion','shove'].includes(k) ) );
const HelmEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['regeneration', 'resistance', 'seeinvisible'].includes(k) ) );
const ArmorEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['regeneration', 'immunity', 'resistance'].includes(k) ) );
const BracersEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['resistance'].includes(k) ) );
const BootsEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['regeneration', 'flight', 'resistance'].includes(k) ) );
const DartEffects = toFab( Object.filter(EffectTypeList, (e,k)=>['poison','fire','cold','blindness','slow','vuln'].includes(k) ) );

PotionEffects.healing.rarity = 10.00;

const WeaponList = toFab({
	"dart":     	{ level:  1, damageMultiplier: 0.50, damageType: DamageType.STAB, effects: DartEffects, mayThrow: true, attackVerb: 'strike' },
	"dagger":   	{ level:  1, damageMultiplier: 0.60, damageType: DamageType.STAB, mayThrow: true, attackVerb: 'strike' },
	"sword": 		{ level:  1, damageMultiplier: 1.00, damageType: DamageType.CUT },
	"greatsword": 	{ level:  1, damageMultiplier: 1.20, damageType: DamageType.CUT },
	"mace": 		{ level:  1, damageMultiplier: 0.90, damageType: DamageType.BASH },
	"hammer": 		{ level:  1, damageMultiplier: 1.40, damageType: DamageType.BASH },
	"axe": 			{ level:  1, damageMultiplier: 1.00, damageType: DamageType.CUT, mayThrow: true, attackVerb: 'strike' },
	"spear": 		{ level:  1, damageMultiplier: 0.70, damageType: DamageType.STAB, range: 2, mayThrow: true, attackVerb: 'strike' },
	"pike": 		{ level:  1, damageMultiplier: 0.90, damageType: DamageType.STAB, range: 2 }
});

const WeaponMaterialList = toFab({
	"ironium": 		{ level:  1, toMake: 'ironium ingot'},
	"silverium": 	{ level:  5, toMake: 'silverium ingot' },
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
	"studded": 		{ level:  6, armorMultiplier: 0.90, ingredientId: 'ironium ingot' },
	"chain": 		{ level: 10, armorMultiplier: 1.00, ingredientId: 'ironium ingot' },
	"steel plate": 	{ level: 15, armorMultiplier: 1.00, ingredientId: 'ironium ingot' },
	"troll hide": 	{ level: 20, armorMultiplier: 1.20, ingredientId: 'troll hide' },
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
	"ironOre": 		{ name: "ironium ore", refinesTo: "ironium ingot", img: 'i-protection' },
	"copperOre": 	{ name: "copperium ore", refinesTo: "copperium ingot", img: 'i-protection' },
	"silverOre": 	{ name: "silverium ore", refinesTo: "silverium ingot", img: 'i-protection' },
	"goldOre": 		{ name: "goldium ore", refinesTo: "goldium ingot", img: 'i-protection' },
	"tinOre": 		{ name: "tinium ore", refinesTo: "tinium ingot", img: 'i-protection' },
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
	"brassium": 	{ img: 'brass' },
	"copperium": 	{ img: 'bronze' },
	"silverium": 	{ img: 'silver' },
	"goldium": 		{ img: 'gold' }
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
	"stairsDown": { symbol: '>', name: "stairs down", gateDir: 1, gateInverse: 'stairsUp', mayPickup: false, neverPick: true, useVerb: 'descend', img: "dc-dngn/gateways/stone_stairs_down.png" },
	"stairsUp":   { symbol: '<', name: "stairs up", gateDir: -1, gateInverse: 'stairsDown', mayPickup: false, neverPick: true, useVerb: 'ascend', img: "dc-dngn/gateways/stone_stairs_up.png" },
	"gateway":    { symbol: '𝞟', name: "gateway", gateDir: 0, gateInverse: 'gateway', mayPickup: false, neverPick: true, useVerb: 'enter', img: "dc-dngn/gateways/dngn_enter_dis.png" },
	"portal":     { symbol: 'Ώ', name: "portal", gateDir: 0, gateInverse: 'portal', mayPickup: false, neverPick: true, useVerb: 'touch', img: "dc-dngn/gateways/dngn_portal.png" },

	"gold": 	{ symbol: '$', namePattern: '{goldCount} gold', goldCount: 0, isGold: true,
				rarity: 2.00, img: "item/misc/gold_pile.png" },
	"altar":    { symbol: 'A', mayWalk: false, mayFly: false, name: "golden altar", mayPickup: false, light: 4, glow:true,
				rarity: 0.10, rechargeTime: 12, healMultiplier: 3.0,
				img: "dc-dngn/altars/dngn_altar_shining_one.png" },
	"corpse":   { symbol: 'X', namePattern: "remains of a {usedToBe}", isCorpse: true, neverPick: true,
				autoCommand: Command.LOOT, img: 'UNUSED/spells/components/skull.png' },
	"potion":   { symbol: '¡', namePattern: 'potion of {effect}', charges: 1, light: 3, glow: true, attackVerb: 'splash',
				rarity: 2.00, autoCommand: Command.QUAFF, effectDuration: '1d4+4', isPotion: true,
				effects: PotionEffects, mayThrow: true, destroyOnLastCharge: true,
				imgGet: (self,img)=>"item/potion/"+(img || (ImgPotion[self.effect.typeId]||NulImg).img || "emerald")+".png", imgChoices: ImgPotion },
	"spell":    { symbol: 'ᵴ', namePattern: 'spell of {effect}', rechargeTime: '3d4', effects: SpellEffects,
				rarity: 0.50, autoCommand: Command.CAST, isSpell: true,
				img: "item/scroll/scroll.png" },
	"ore": 		{ symbol: '"', namePattern: '{variety}', varieties: OreList, isOre: true, neverPick: true,
				rarity: 1.00,
				imgGet: (self,img) => "item/ring/"+(img || self.variety.img || "i-protection")+".png", imgChoices: OreList },
	"gem": 		{ symbol: "^", namePattern: '{quality} {variety}', qualities: GemQualityList, varieties: GemList, isGem: true,
				rarity: 1.00,
				imgGet: (self,img) => "gems/"+(img || self.variety.img || "Gem Type2 Black")+".png", imgChoices: GemList, scale:0.3, xAnchor: -0.5, yAnchor: -0.5 },
	"weapon": 	{ symbol: '†', namePattern: '{material} {variety} {?effect}', materials: WeaponMaterialList, varieties: WeaponList, effects: WeaponEffects, slot: Slot.WEAPON, isWeapon: true,
				rarity: 1.00, autoCommand: Command.USE,
				useVerb: 'weild',
				effectChance: 0.05,
				img: "item/weapon/dagger.png" },
	"helm": 	{ symbol: '[', namePattern: "{variety} helm{?effect}", varieties: ArmorList, effects: HelmEffects, slot: Slot.HEAD, isHelm: true, isArmor: true,
				rarity: 0.50, autoCommand: Command.USE,
				effectChance: 0.05,
				armorMultiplier: 0.15,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "item/armour/headgear/helmet2_etched.png" },
	"armor": 	{ symbol: '&', namePattern: "{variety} armor{?effect}", varieties: ArmorList, effects: ArmorEffects, slot: Slot.ARMOR, isArmor: true,
				rarity: 1.00, autoCommand: Command.USE,
				effectChance: 0.05,
				armorMultiplier: 0.60,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "player/body/armor_mummy.png" },
	"bracers": 	{ symbol: ']', namePattern: "{variety} bracers{?effect}", varieties: ArmorList, effects: BracersEffects, slot: Slot.ARMS, isBracers: true, isArmor: true,
				rarity: 0.50, autoCommand: Command.USE,
				effectChance: 0.05,
				armorMultiplier: 0.15,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "UNUSED/armour/gauntlet1.png" },
	"boots": 	{ symbol: 'b', namePattern: "{variety} boots{?effect}", varieties: ArmorList, slot: Slot.FEET, isBoots: true, isArmor: true, effects: BootsEffects,
				rarity: 0.50, autoCommand: Command.USE,
				effectChance: 0.05,
				armorMultiplier: 0.10,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "item/armour/boots2_jackboots.png" },
	"ring": 	{ symbol: '=', namePattern: "{material} {variety} ring{?effect}", materials: RingMaterialList, varieties: RingList,
				effects: RingEffects, slot: Slot.LEFTHAND, isRing: true,
				rarity: 0.05, autoCommand: Command.USE,
				effectChance: 0.10,
				useVerb: 'wear', triggerOnUse: true, effectOverride: { duration: true },
				imgGet: (self,img) => "item/ring/"+(img || self.material.img || 'gold')+".png", imgChoices: RingMaterialList },
};
const ItemSortOrder = ['corpse','weapon','helm','armor','bracers','boots','ring','potion','gem','ore','gold','spell'];


const selfInvisibilitySymbol = '?';
const Brain = { AI: "ai", USER: "user" };

const MonsterTypeDefaults = {
//					type: null, typeId: null, reach: 1, travelMode: "walk", speed: 1, loseTurn: false, pronoun: "it", packAnimal: false,
//					power: '3:10', health: 10, healthMax: 10, regenerate: 0, resist: '', vuln: '', immune: '', picksup: false, 
//					damage: 1, damageType: DamageType.BASH, personalEnemy: '',
//					invisible: false, inaudible: false, blind: false, seeInvisible: false, sightDistance: 6, observeDistantEvents: false,
//					symbol: '?', mayWalk: false, mayFly: false,
//					corpse: 'corpse',
//					brain: Brain.AI, brainFlee: false, brainPet: false, brainOpensDoors: false, brainTalk: false,
//					attitude: Attitude.AGGRESSIVE, team: Team.EVIL

					symbol: '?',level: 1, power: '3:10', team: Team.EVIL, damageType: DamageType.CUT, img: "dc-mon/acid_blob.png", pronoun: 'it',
					attitude: Attitude.AGGRESSIVE,
					blind: false, invisible: false, seeInvisible: false, sightDistance: 6,
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

let UndeadImmunity = [DamageType.CUT,DamageType.STAB,DamageType.FREEZE,DamageType.ROT,DamageType.POISON,Attitude.PANICKED,Attitude.ENRAGED,Attitude.CONFUSED,'blind'].join(',');

const MonsterTypeList = {

// GOOD TEAM
	"player": {
		core: [ '@', 1, '3:10', 'good', 'cut', 'dc-mon/elf.png', 'he' ],
		attitude: Attitude.CALM,
		brain: Brain.USER,
		brainOpensDoors: true,
		brainTalk: true,
		light: 7,
		neverPick: true,
		picksup: true,
		regenerate: 0.03,
		sightDistance: MaxSightDistance
	},
	"dog": {
		core: [ 'd', 1, '10:10', 'good', 'bite', 'UNUSED/spells/components/dog2.png', '*' ],
		name: "Fido/Lucy",
		brainFlee: true,
		brainPet: true,
		properNoun: true,
		packAnimal: true,
		regenerate: 0.03,
		watch:1
	},
	"human": {
		core: [ 'H', 1, '3:10', 'good', 'cut', 'dc-mon/human.png', '*' ],
		attitude: Attitude.CALM,
		brainTalk: true,
		brainOpensDoors: true,
	},

// EVIL TEAM
	"Avatar of Balgur": {
		core: [ 'a', 1, '25:2', 'evil', 'burn', 'dc-mon/hell_knight.png', 'he' ],
		brainTalk: true,
		immune: [DamageType.BURN,Attitude.PANIC].join(','),
		sayPrayer: 'I shall rule this planet!',
		rarity: 0.000000001
	},
	"demon": {
		core: [ 'D', 5, '3:5', 'evil', 'burn', 'player/base/draconian_red_f.png', 'it' ],
		brainTalk: true,
		immune: DamageType.BURN,
		packAnimal: true,
		sayPrayer: 'Hail Balgur, ruler of the deep!'
	},
	"ethermite": {
		core: [ 'e', 10, '3:20', 'evil', 'bite', 'dc-mon/shining_eye.png', '*' ],
		glow:true,
		invisible: true,
		light:6,
		loot: 'ring',
		packAnimal: true,
		sneakAttackMult: 3
	},
	"goblin": {
		core: [ 'g', 1, '3:10', 'evil', 'cut', 'dc-mon/goblin.png', '*' ],
		brainTalk: true,
		isGoblin: true,
		packAnimal: true,
		sayPrayer: 'Oh mighty Thagzog...'
	},
	"goblinWar": { 
		core: [ 'W', 12, '3:8', 'evil', 'cut', 'dc-mon/goblin.png', '*' ],
		name: 'goblin warrior',
		brainTalk: true,
		isGoblin: true,
		sayPrayer: 'Oh warrior Thagzog...'
	},
	"goblinMut": {
		core: [ 'I', 22, '3:8', 'evil', 'cut', 'dc-mon/goblin.png', '*' ],
		name: 'goblin mutant',
		brainTalk: true,
		isGoblin: true,
		sayPrayer: 'Oh mutant Thagzog...'
	},
	"imp": {
		core: [ 'i', 7, '3:10', 'evil', 'claw', 'dc-mon/demons/imp.png', 'it' ],
		attitude: Attitude.HESITANT,
		glow: 1,
		immune: DamageType.BURN,
		seeInvisible: true,
		travelMode: "fly",
		vuln: DamageType.FREEZE
	},
	"kobold": {
		core: [ 'k', 1, '4:20', 'evil', 'cut', 'dc-mon/kobold.png', '*' ],
		attitude: Attitude.HESITANT,
		brainTalk: true,
		loot: 'potion',
		packAnimal: true
	},
	"ogreKid": { 
		core: [ 'Ǿ', 2, '10:10', 'evil', 'bash', 'dc-mon/ogre.png', '*' ],
		name: "ogre child",
		brainTalk: true, 
		resist: DamageType.CUT,
		speed: 0.75
	},
	"ogre": {
		core: [ 'Ȱ', 10, '10:10', 'evil', 'bash', 'dc-mon/ogre.png', '*' ],
		brainTalk: true,
		resist: DamageType.CUT+','+DamageType.STAB,
		speed: 0.5
	},
	"scarab": {
		core: [ 'h', 12, '3:30', 'evil', 'bite', 'dc-mon/animals/boulder_beetle.png', 'it' ],
		namePattern: "{color} scarab",
		color: 'red',
		glow: 3,
		immune: DamageType.BURN,
		loot: 'potion',
		travelMode: "fly",
		vuln: DamageType.FREEZE
	},
	"skeleton": {
		core: [ 's', 3, '2:10', 'evil', 'claw', 'dc-mon/undead/skeletons/skeleton_humanoid_small.png', 'it' ],
		immune: UndeadImmunity,
		loot: 'bones',
		vuln: DamageType.SMITE
	},
	"skeletonLg": {
		core: [ 'S', 13, '2:8', 'evil', 'claw', 'dc-mon/undead/skeletons/skeleton_humanoid_large.png', 'it' ],
		name: 'ogre skeleton',
		immune: UndeadImmunity,
		loot: 'bones',
		vuln: DamageType.SMITE
	},
	"troll": {
		core: [ 'T', 8, '3:6', 'evil', 'claw', 'dc-mon/troll.png', '*' ],
		loot: 'trollHide',
		regenerate: 0.15,
		vuln: DamageType.BURN
	},
	"viper": {
		core: [ 'v', 5, '3:16', 'evil', 'claw', 'dc-mon/animals/viper.png', 'it' ],
		attitude: Attitude.HESITANT,
		loot: 'potion',
		speed: 2.0
	},

// LUNAR
	"lunarOne": {
		core: [ 'l', 12, '3:10', 'lunar', 'freeze', 'dc-mon/deep_elf_high_priest.png', '*' ],
		brainTalk: true,
		immune: DamageType.FREEZE,
		name: "lunar one",
		rarity: 10
	},

// NEUTRAL TEAM
	"bat": {
		core: [ 'ᵬ', 1, '2:20', 'neutral', 'bite', 'dc-mon/animals/giant_bat.png', 'it' ],
		attitude: Attitude.WANDER,
		packAnimal: true,
		seeInvisible: true,
		travelMode: "fly"
	},
	"spinyFrog": {
		core: [ 'f', 4, '3:10', 'neutral', 'stab', 'dc-mon/animals/spiny_frog.png', 'it' ],
		name: "spiny frog",
		attitude: Attitude.WANDER,
		immune: DamageType.POISON,
		loot: 'potion'
	},
	"sheep": {
		core: [ 'r', 1, '1:20', 'neutral', 'bite', 'dc-mon/animals/sheep.png', 'it' ],
		attitude: Attitude.FEARFUL,
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
		tell(mSubject|mCares,entity,' ',mVerb,'are',' at the edge of ',mObject,self);
	}
}

TileTypeList.fire.onEnterType = function(entity,self) {
	tell( mSubject|mCares,entity,' ',mVerb,'enter',' ',mObject,self,'.' );
}

TileTypeList.fire.onDepartType = function(entity,self) {
	tell( mSubject|mCares,entity,' ',mVerb,'leave',' ',mObject,self,'.' );
}

TileTypeList.fire.isProblem = function(entity,self) {
	return !entity.isImmune(self.damageType);
}

TileTypeList.fire.onTouch = function(entity,self) {
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
	if( entity.travelMode == "walk" && Math.chance(50) ) {
		tell( mSubject|mCares,entity,' ',mVerb,'is',' stuck in the mud.');
		return false;
	}
}

TileTypeList.forcefield.onEnterType = function(entity,self) {
	if( Math.chance(80) ) {
		tell( mSubject|mCares,entity,' ',mVerb,'is',' stopped by the ',mObject,self,'.' );
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
	attacker.takeDamage( this, damage, DamageType.POISON, function(attacker,victim,amount,damageType) {
		if( amount<=0 ) {
			tell(mSubject,victim,' ',mVerb,'ignore',' ',mObject|mPossessive,attacker,' spines.');
		}
		else {
			tell(mSubject,victim,' ',mVerb,'is',' stabbed by ',mObject|mPossessive,attacker,' spines.');			
		}
		return true;
	});
}

MonsterTypeList.bat.onAttacked = function(attacker,amount,damageType) {
	let f = this.findAliveOthers().includeMe().isAlive().filter( e => e.name==this.name );
	if( f.count ) {
		f.process( e => {
			if( e.attitude == Attitude.HESITANT || e.attitude == Attitude.WANDER ) {
				e.attitude = Attitude.AGGRESSIVE;
			}
			e.team = (attacker.team == Team.EVIL || attacker.team == Team.NEUTRAL) ? Team.GOOD : Team.EVIL;
		});
		if( this.isAlive() && f.count > 1 ) {
			tell(mSubject,this,' sonically ',mVerb,'alert',' ',mSubject|mPronoun|mPossessive,this,' friend'+(f.count>2?'s':''),' to attack team '+attacker.team+'!');
		}
	}
}

MonsterTypeList.scarab.onAttack = function(target) {
	let effect = Object.assign({},EffectTypeList.vulnerability,{value: DamageType.BURN});
	effectApply(this,effect,target);
}

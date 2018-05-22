// STATIC DATA

// WARNING: The strings for directions MUST remain the same for commandToDirection() to work.
const Command = { NONE: "none", N:"N", NE:"NE", E:"E", SE:"SE", S:"S", SW:"SW", W:"W", NW:"NW", WAIT: "wait", 
				INVENTORY: "inventory", PICKUP: "pickup", QUAFF: "quaff", THROW: "throw", LOSETURN: "lose turn", PRAY: "pray",
				ATTACK: "attack", USE: "use",
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
const DamageType = { CUT: "cut", STAB: "pierce", BITE: "bite", CLAW: "claw", BLUNT: "whomp", FIRE: "burn", COLD: "freeze", POISON: "poison", HOLY: "divine power", ROT: "rot" };
const ArmorDefendsAgainst = [DamageType.CUT,DamageType.STAB,DamageType.PIERCE,DamageType.BITE,DamageType.CLAW,DamageType.WHOMP];
const Attitude = { ENRAGED: "enraged", AGGRESSIVE: "aggressive", HESITANT: "hesitant", CONFUSED: "confused", FEARFUL: "fearful", PANICKED: "panicked", WANDER: "wander", CALM: "calm", WORSHIP: "worshipping" };
const Team = { EVIL: "evil", GOOD: "good", NEUTRAL: "neutral" };
const Slot = { HEAD: "head", NECK: "neck", LEFTHAND: "left hand", RIGHTHAND: "right hand", WAIST: "waist", FEET: "feet", ARMOR: "torso", WEAPON: "weapon" };
const PickImmune = [DamageType.FIRE,DamageType.COLD,DamageType.POISON,DamageType.HOLY,DamageType.ROT];
const PickVuln   = [DamageType.FIRE,DamageType.COLD,DamageType.POISON,DamageType.HOLY,DamageType.ROT];
const PickResist = [DamageType.CUT,DamageType.STAB,DamageType.BLUNT,DamageType.FIRE,DamageType.COLD,DamageType.POISON,DamageType.HOLY,DamageType.ROT];

// Effect Events
// onTargetPosition - if this effect is targeting a map tile, instead of a monster.

let EffectTypeList = {
	invisibility: 	{ level: 10, rarity: 0.05, duration: '4d4+4', stat: 'invisible', op:'set', value: true, isHelp: 1, requires: e=>!e.invisible },
	seeinvisible: 	{ level: 10, rarity: 0.50, duration: '4d4+4', stat: 'seeInvisible', op:'set', value: true, isHelp: 1 },
	blindness: 		{ level:  5, rarity: 1.00, duration: '1d4+4', stat: 'blind', op:'set', value: true, isHarm: 1, requires: e=>!e.blind },
	haste: 			{ level:  7, rarity: 1.00, duration: '2d4+4', stat: 'speed', op:'add', value: 1, isHelp: 1, requires: e=>e.speed<5 },
	slow: 			{ level:  3, rarity: 1.00, duration: '2d4+4', stat: 'speed', op:'sub', value: 0.5, isHarm: 1, requires: e=>e.speed>0.5 },
	regeneration: 	{ level: 20, rarity: 1.00, duration: '4d4+4', stat: 'regenerate', op:'add', value: 0.05, isHelp: 1 },
	flight: 		{ level:  2, rarity: 0.20, duration: '2d4+9', stat: 'travelMode', op:'set', value: 'fly', isHelp: 1, requires: e=>e.travelMode==e.type.travelMode },
	healing: 		{ level:  1, rarity: 1.00, duration: 0,       stat: 'health', op:'add', value: '1d4+4', isHelp: 1, healingType: DamageType.HOLY },
	poison: 		{ level:  1, rarity: 1.00, duration: 0,       stat: 'health', op:'sub', value: '1d4+4', isHarm: 1, damageType: DamageType.POISON },
	fire: 			{ level:  1, rarity: 1.00, duration: 0,       stat: 'health', op:'sub', value: '1d16', isHarm: 1, damageType: DamageType.FIRE, mayTargetPosition: true },
	cold: 			{ level:  2, rarity: 1.00, duration: 0,       stat: 'health', op:'sub', value: '1d16', isHarm: 1, damageType: DamageType.COLD, mayTargetPosition: true },
	holy: 			{ level:  3, rarity: 1.00, duration: 0,       stat: 'health', op:'sub', value: '1d1+6', isHarm: 1, damageType: DamageType.HOLY },
	rot: 			{ level:  4, rarity: 1.00, duration: 0,       stat: 'health', op:'sub', value: '2d4', isHarm: 1, damageType: DamageType.ROT },
	rage: 			{ level:  1, rarity: 1.00, duration: '1d4+4', stat: 'attitude', op:'set', value: Attitude.ENRAGED, isHarm: 1 },
	panic: 			{ level:  5, rarity: 1.00, duration: '1d4+4', stat: 'attitude', op:'set', value: Attitude.PANICKED, isHarm: 1 },
	confusion: 		{ level:  3, rarity: 1.00, duration: '1d4+4', stat: 'attitude', op:'set', value: Attitude.CONFUSED, isHarm: 1 },
	immunity: 		{ level: 30, rarity: 0.20, duration: '4d4+4', stat: 'immune', op:'add', value: null,
					valuePick: () => pick(PickImmune), isHelp: 1, namePattern: 'immunity to {value}' },
	vulnerability: 	{ level: 10, rarity: 1.00, duration: '4d4+4', stat: 'vuln', op:'add', value: null, requires: (e,effect)=>!e.isImmune(effect.value),
					valuePick: () => pick(PickVuln), isHarm: 1, namePattern: 'vulnerability to {value}' },
	resistance: 	{ level: 10, rarity: 0.50, duration: '8d4+4', stat: 'resist', op:'add', value: null,
					valuePick: () => pick(PickImmune), isHelp: 1, namePattern: 'resist {value}s' },
	shove: 			{ level:  3, rarity: 1.00, duration: 0,       stat: 'position', op:'push', value: 3 },
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



const TileTypeDefaults = { mayWalk: false, mayFly: false, opacity: 0, isStairs: false, 
							damage: '', damageType: DamageType.BLUNT, img: null };
const TileTypeList = {
	"floor":      { symbol: '.', mayWalk: true,  mayFly: true,  opacity: 0, name: "floor", img: "dc-dngn/floor/pebble_brown0.png", ivar: 9, isFloor: true },
	"wall":       { symbol: '#', mayWalk: false, mayFly: false, opacity: 1, name: "wall", img: "dc-dngn/wall/brick_brown0.png", ivar: 8, isWall: true },
	"pit":        { symbol: ':', mayWalk: false, mayFly: true,  opacity: 0, name: "pit", img: "dc-dngn/pit.png" },
	"shaft":      { symbol: ';', mayWalk: false, mayFly: true,  opacity: 0, name: "shaft", img: "dc-dngn/dngn_trap_shaft.png" },
	"door":       { symbol: '+', mayWalk: true,  mayFly: true,  opacity: 1, name: "locked door", img: "dc-dngn/dngn_open_door.png" },
	"lockedDoor": { symbol: '±', mayWalk: false, mayFly: false, opacity: 1, name: "door", img: "dc-dngn/dngn_closed_door.png" },
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
	symbol: '?', namePattern: 'nameless *', effect: true,
	mayWalk: true, mayFly: true, opacity: 0, triggerOnPickup: false,
	rechargeTime: false, rechargeLeft: 0,
	img: null
}

const ImgPotion = {
	invisibility: 	{ img: "clear" },
	blindness: 		{ img: "black" },
	haste: 			{ img: "cyan" },
	slow: 			{ img: "silver" },
	regeneration: 	{ img: "orange" },
	flight: 		{ img: "brilliant_blue" },
	healing: 		{ img: "ruby" },
	poison: 		{ img: "emerald" },
	fire: 			{ img: "ruby" }, 
	cold: 			{ img: "brilliant_blue" }, 
	panic: 			{ img: "magenta" },
	rage: 			{ img: "dark" },
	confusion: 		{ img: "brown" },
	immunity: 		{ img: "white" },
	vuln: 			{ img: "black" },
	resistance: 	{ img: "yellow" },
	shove: 			{ img: "pink" }
};

let FabList = [];
function toFab(t) {
	FabList.push(t);
	return t;
}

const PotionEffectChoices = toFab( Object.assign({},EffectTypeList) );
const SpellEffectChoices = toFab( Object.filter(EffectTypeList, e=>e.isHarm ) );
const RingEffectChoices = toFab( Object.filter(EffectTypeList, e=>e.isHelp ) );
const WeaponEffectChoices = toFab( Object.filter(EffectTypeList, (e,k)=>['poison','fire','cold','blindness','slow','panic','confusion','shove'].includes(k) ) );
const ArmorEffectChoices = toFab( Object.filter(EffectTypeList, (e,k)=>['invisible', 'slow', 'regeneration', 'poison', 'fire', 'cold', 'confusion', 'immunity', 'resistance'].includes(k) ) );
const BootsEffectChoices = toFab( Object.filter(EffectTypeList, (e,k)=>['invisible', 'regeneration', 'flight', 'immunity', 'resistance'].includes(k) ) );
const HelmEffectChoices = toFab( Object.filter(EffectTypeList, (e,k)=>['regeneration', 'resistance', 'seeinvisible'].includes(k) ) );
const DartEffectChoices = toFab( Object.filter(EffectTypeList, (e,k)=>['poison','fire','cold','blindness','slow','vuln'].includes(k) ) );

const WeaponList = toFab({
	"dart":     	{ level:  1, damageType: DamageType.STAB, effectChoices: DartEffectChoices, mayThrow: true, attackVerb: 'strike' },
	"dagger":   	{ level:  1, damageType: DamageType.STAB, mayThrow: true, attackVerb: 'strike' },
	"sword": 		{ level:  1, damageType: DamageType.CUT },
	"greatsword": 	{ level:  1, damageType: DamageType.CUT },
	"mace": 		{ level:  1, damageType: DamageType.BLUNT },
	"hammer": 		{ level:  1, damageType: DamageType.BLUNT },
	"axe": 			{ level:  1, damageType: DamageType.CUT, mayThrow: true, attackVerb: 'strike' },
	"spear": 		{ level:  1, damageType: DamageType.STAB, range: 2, mayThrow: true, attackVerb: 'strike' },
	"pike": 		{ level:  1, damageType: DamageType.STAB, range: 2 },
	"mace": 		{ level:  1, damageType: DamageType.CUT }
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
	"fur": 		{ level:  1, armor: 46, ingredientId: 'leather' },
	"hide": 	{ level:  1, armor: 40, ingredientId: 'leather' },
	"studded": 	{ level:  1, armor: 43, ingredientId: 'iron ingot' },
	"leather": 	{ level:  6, armor: 52, ingredientId: 'leather' },
	"scaled": 	{ level: 12, armor: 64, ingredientId: 'iron ingot' },
	"elven": 	{ level: 18, armor: 58, ingredientId: 'moonstone' },
	"dwarven": 	{ level: 24, armor: 62, ingredientId: 'iron' },
	"demon": 	{ level: 40, armor: 82, ingredientId: 'demon hide' },
});
const ArmorMaterialList = toFab({
	"iron": 	{ level: 1, ingredientId: 'ironium ingot' },
	"steel": 	{ level: 4, ingredientId: 'steelium ingot' },
	"troll hide": { level: 8, ingredientId: 'troll hide' },
	"chitin": 	{ level: 12, ingredientId: 'chitin' },
	"ice": 		{ level: 16, ingredientId: 'ice block' },
	"glass": 	{ level: 20, ingredientId: 'malachite' },
	"lunarium": { level: 30, ingredientId: 'lunarium ingot' },
	"solarium": { level: 40, ingredientId: 'solarium ingot' },
	"deepium": 	{ level: 50, ingredientId: 'deepium ingot' },
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
	"meteoriumOre": { name: "meteorium ore", refinesTo: "meteorium ingot", img: 'i-protection' }
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


const ItemTypeList = {
	"random":	{ symbol: '*', isRandom: 1, mayPickup: false, neverPick: true },
	"stairsDown": { symbol: '>', name: "stairs down", gateDir: 1, mayPickup: false, neverPick: true, img: "dc-dngn/gateways/stone_stairs_down.png" },
	"stairsUp":   { symbol: '<', name: "stairs up", gateDir: -1, mayPickup: false, neverPick: true, img: "dc-dngn/gateways/stone_stairs_up.png" },
	"gateway":    { symbol: 'Ώ', name: "gateway", gateDir: 0, mayPickup: false, neverPick: true, img: "dc-dngn/gateways/dngn_enter_dis.png" },

	"gold": 	{ symbol: '$', namePattern: '* gold', effect: false, 
				rarity: 2.00, img: "item/misc/gold_pile.png" },
	"altar":    { symbol: 'A', mayWalk: false, mayFly: false, name: "golden altar", mayPickup: false, light: 4, glow:true,
				rarity: 0.10, rechargeTime: 12,
				img: "dc-dngn/altars/dngn_altar_shining_one.png" },
	"potion":   { symbol: '¡', namePattern: 'potion of {effect}', charges: 1, light: 3, glow: true, attackVerb: 'splash',
				rarity: 3.00,
				effectChoices: PotionEffectChoices, mayThrow: true, destroyOnLastCharge: true,
				imgGet: (self,img)=>"item/potion/"+(img || (ImgPotion[self.effect.typeId]||NulImg).img || "emerald")+".png", imgChoices: ImgPotion },
	"spell":    { symbol: 'ᵴ', namePattern: 'spell of {effect}', rechargeTime: 3, effectChoices: SpellEffectChoices,
				rarity: 0.50,
				img: "item/scroll/scroll.png" },
	"ore": 		{ symbol: '"', namePattern: '{variety}', varieties: OreList, isOre: true, neverPick: true,
				rarity: 1.00,
				imgGet: (self,img) => "item/ring/"+(img || self.variety.img || "i-protection")+".png", imgChoices: OreList },
	"gem": 		{ symbol: "'", namePattern: '{quality} {variety}', qualities: GemQualityList, varieties: GemList, isGem: true,
				rarity: 1.00,
				imgGet: (self,img) => "gems/"+(img || self.variety.img || "Gem Type2 Black")+".png", imgChoices: GemList, scale:0.3, xAnchor: -0.5, yAnchor: -0.5 },
	"weapon": 	{ symbol: '†', namePattern: '{material} {variety} of {effect}  [{damage} {damageType}]', materials: WeaponMaterialList, varieties: WeaponList, effectChoices: WeaponEffectChoices, slot: Slot.WEAPON, isWeapon: true,
				rarity: 1.00,
				useVerb: 'weild',
				img: "item/weapon/dagger.png" },
	"armor": 	{ symbol: '&', namePattern: "{material} {variety} armor of {effect} [{armor}]", materials: ArmorMaterialList, varieties: ArmorList, effectChoices: ArmorEffectChoices, slot: Slot.ARMOR, isArmor: true,
				rarity: 1.00,
				armorMultiplier: 0.75,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "player/body/armor_mummy.png" },
	"helm": 	{ symbol: '[', namePattern: "{material} {variety} helm of {effect} [{armor}]", materials: ArmorMaterialList, varieties: ArmorList, effectChoices: ArmorEffectChoices, slot: Slot.HEAD, isHelm: true,
				rarity: 0.50,
				armorMultiplier: 0.15,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "item/armour/headgear/helmet2_etched.png" },
	"boots": 	{ symbol: 'Ⓑ', namePattern: "{material} {variety} boots of {effect} [{armor}]", materials: ArmorMaterialList, varieties: ArmorList, effectChoices: BootsEffectChoices, slot: Slot.FEET, isBoots: true,
				rarity: 0.50,
				armorMultiplier: 0.10,
				useVerb: 'wear', triggerOnUseIfHelp: true, effectOverride: { duration: true },
				img: "item/armour/boots2_jackboots.png" },
	"ring": 	{ symbol: '=', namePattern: "{material} {variety} ring of {effect}", materials: RingMaterialList, varieties: RingList, effectChoices: RingEffectChoices, slot: Slot.LEFTHAND, isRing: true,
				rarity: 0.05,
				useVerb: 'wear', triggerOnUse: true, effectOverride: { duration: true },
				imgGet: (self,img) => "item/ring/"+(img || self.material.img || 'gold')+".png", imgChoices: RingMaterialList },
};
const ItemSortOrder = ['weapon','helm','armor','boots','ring','potion','gem','ore','gold','spell'];


const selfInvisibilitySymbol = '?';
const Brain = { AI: "ai", USER: "user" };

const MonsterTypeDefaults = {
					type: null, typeId: null, reach: 1, travelMode: "walk", speed: 1, loseTurn: false, pronoun: "it", packAnimal: false,
					power: '3:10', health: 10, healthMax: 10, regenerate: 0, resist: '', vuln: '', immune: '', picksup: false, 
					damage: '1d1', damageType: DamageType.BLUNT, personalEnemy: '',
					invisible: false, inaudible: false, blind: false, seeInvisible: false, sightDistance: 6, observeDistantEvents: false,
					symbol: '?', mayWalk: false, mayFly: false,
					brain: Brain.AI, brainFlee: false, brainPet: false, brainOpensDoors: false, brainTalk: false,
					attitude: Attitude.AGGRESSIVE, team: Team.EVIL
				};

let MaxSightDistance = 10;

// Monster Events
// onAttacked - fired when the monster gets attacked, even if damage nets to zero.
// onAttack - fires when ever the monster attacks, so you can pile on extra effects.
// onTouch - fires if somebody steps into you but doesn't attack you. Like when confused.
// onHeal - fires when you get healing. return true to suppress the auto-generated message about healing.

let UndeadImmunity = [DamageType.CUT,DamageType.STAB,DamageType.COLD,DamageType.POISON,Attitude.PANICKED,Attitude.ENRAGED,Attitude.CONFUSED,'blind'].join(',');

const MonsterTypeList = {
	"ogrekid": { 	symbol: 'Ǿ', pronoun: "*", img: "dc-mon/ogre.png", brainTalk: true, name: "ogre child",
					level:  2, power: '10:10', damageType: DamageType.BLUNT, resist: DamageType.CUT, speed: 0.5 },
	"ogre": { 		symbol: 'Ȱ', pronoun: "*", img: "dc-mon/ogre.png", brainTalk: true,
					level:  10, power: '10:10', damageType: DamageType.BLUNT, resist: DamageType.CUT+','+DamageType.STAB, speed: 0.5 },
	"goblin": { 	symbol: 'g', pronoun: "*", img: "dc-mon/goblin.png", brainTalk: true, isGoblin: true,
					level:  1, power: '3:10',  damageType: DamageType.CUT, packAnimal: true,
					sayPrayer: 'Oh mighty Thagzog...' },
	"goblinwar": { 	symbol: 'H', pronoun: "*", img: "dc-mon/goblin.png", brainTalk: true, isGoblin: true,
					level:  12, power: '3:8',  damageType: DamageType.CUT, name: 'goblin warrior',
					sayPrayer: 'Oh warrior Thagzog...' },
	"goblinmut": { 	symbol: 'I', pronoun: "*", img: "dc-mon/goblin.png", brainTalk: true, isGoblin: true,
					level:  22, power: '3:8',  damageType: DamageType.CUT, name: 'goblin mutant',
					sayPrayer: 'Oh mutant Thagzog...' },
	"skeleton": { 	symbol: 's', pronoun: "it", img: "dc-mon/undead/skeletons/skeleton_humanoid_small.png",
					level:  3, power: '2:10',  damageType: DamageType.CUT, immune: UndeadImmunity, vuln: DamageType.HOLY },
	"skeletonlg": { symbol: 'S', pronoun: "it", img: "dc-mon/undead/skeletons/skeleton_humanoid_large.png", name: 'ogre skeleton',
					level:  13, power: '2:8',  damageType: DamageType.CUT, immune: UndeadImmunity, vuln: DamageType.HOLY },
	"kobold": { 	symbol: 'k', pronoun: "*", img: "dc-mon/kobold.png", brainTalk: true,
					level:  1, power: '4:20',  damageType: DamageType.CUT,
					attitude: Attitude.HESITANT },
	"ethermite": { 	symbol: 'e', pronoun: "*", invisible: true, light:6, glow:true, img: "dc-mon/shining_eye.png",
					level: 10, power: '5:20', sneakAttackMult: 4, damageType: DamageType.BITE, packAnimal: true },
	"troll": {	 	symbol: 'T', pronoun: "*", regenerate: 0.15, img: "dc-mon/troll.png", vuln: DamageType.FIRE,
					level:  8, power: '3:6',   damageType: DamageType.CLAW },
	"viper": {		symbol: 'v', pronoun: "it", img: "dc-mon/animals/viper.png",
					level:  5, power: '3:16', damageType: DamageType.CLAW, speed: 2.0,
					attitude: Attitude.HESITANT },
	"bat": { 		symbol: 'ᵬ', pronoun: "it", seeInvisible: true, img: "dc-mon/animals/giant_bat.png",
					level:  1, power: '2:20', damageType: DamageType.BITE, travelMode: "fly", packAnimal: true,
					attitude: Attitude.WANDER,      team: Team.NEUTRAL },
	"spinyfrog": {	symbol: 'f', pronoun: "it", name: "spiny frog", img: "dc-mon/animals/spiny_frog.png",
					level: 4, power: '3:10', damageType: DamageType.STAB,
					attitude: Attitude.WANDER,      team: Team.NEUTRAL },
	"dog": {	 	symbol: 'd', name: "Fido/Lucy", properNoun: true, pronoun: "*", img: "UNUSED/spells/components/dog2.png",
					level: 1, power: '10:10', damageType: DamageType.BITE, packAnimal: true, regenerate: 0.2,
					brainFlee: true, brainPet: true, team: Team.GOOD, watch:1 },
	"imp": {	 	symbol: 'i', pronoun: "it", seeInvisible: true, glow: 1, img: "dc-mon/demons/imp.png",
					level: 7, power: '3:10', damageType: DamageType.BITE, travelMode: "fly", immune: DamageType.FIRE, vuln: DamageType.COLD,
					attitude: Attitude.CONFUSED,    team: Team.NEUTRAL },
	"scarab": {	 	symbol: 'h', pronoun: "it", namePattern: "{color} scarab", color: 'red', glow: 3, img: "dc-mon/animals/boulder_beetle.png",
					level: 12, power: '3:30', damageType: DamageType.BITE, travelMode: "fly", immune: DamageType.FIRE, vuln: DamageType.COLD },
	"rabbit": { 	symbol: 'r', pronoun: "it", img: "dc-mon/animals/sheep.png",
					level: 1, power: '1:20',   damageType: DamageType.BITE, packAnimal: true,
					attitude: Attitude.FEARFUL },
	"player": { 	symbol: '@', pronoun: "he", light: 7, brainTalk: true,
					brain: Brain.USER, brainOpensDoors: true, picksup: true, img: "dc-mon/human.png",
					level: 1, power: null, regenerate: 0.01, damageType: DamageType.CUT, sightDistance: MaxSightDistance,
					attitude: Attitude.CALM, team: Team.GOOD, neverPick: true }
};

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
	if( entity.travelMode == "walk" && Math.chance(50) ) {
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


MonsterTypeList.spinyfrog.onAttacked = function(attacker,amount,damageType) {
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
	let effect = Object.assign({},EffectTypeList.vulnerability,{value: DamageType.FIRE});
	effectApply(this,effect,target);
}

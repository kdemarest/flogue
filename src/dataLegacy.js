Module.add('dataLegacy',function() {

let LegacyList = {};

function perkDataCondition(perk, level, index, singularId ) {
	perk.level = level;
	perk.index = index;
	if( perk.singularId === undefined ) {
		perk.singularId = singularId;
	}
	if( perk.item ) {
		perk.item.singularId = perk.singularId;
		perk.item.description = perk.description;
		perk.item.name = perk.item.name || perk.name;
		perk.item.namePattern = perk.item.name;
		perk.item.aboutPattern = perk.item.about || '';
		if( perk.item.effect ) {
			perk.item.effect.name = perk.item.effect.name || perk.item.name;
			perk.item.effect.namePattern = perk.item.effect.name;
			perk.item.effect.aboutPattern = perk.item.effect.about || '';
			perk.item.effect.singularId = perk.item.effect.singularId || perk.singularId;
		}
		if( perk.item.slot ) {
			perk.item.useVerb = perk.item.useVerb || 'activate';
		}
	}
	if( perk.skill ) {
		Object.assign( perk.skill, {
			typeId: 'skill',
			isItemType: true,
			isSkill: true,
			img: 'gui/icons/skill.png',
			icon: "/gui/icons/skill.png"
		});
		if( perk.haltHere ) {
			debugger;
		}
		perk.skill.singularId = perk.singularId;
		perk.skill.description = perk.description;
		perk.skill.name = perk.skill.name || perk.name;
		perk.skill.namePattern = perk.skill.name;
		perk.skill.aboutPattern = perk.skill.about || '';
		if( perk.skill.effect ) {
			perk.skill.effect.name = perk.skill.effect.name || perk.skill.name;
			perk.skill.effect.namePattern = perk.skill.effect.name;
			perk.skill.effect.aboutPattern = perk.skill.effect.about || '';
			perk.skill.effect.singularId = perk.skill.effect.singularId || perk.singularId;
		}
		if( perk.skill.slot ) {
			perk.skill.useVerb = perk.skill.useVerb || 'activate';
		}
	}
	if( perk.onGain && typeof perk.onGain=='object' ) {
		perk.onGain.name = perk.onGain.name || perk.name;
		perk.onGain.duration = perk.onGain.duration===undefined ? true : perk.onGain.duration;
		perk.onGain.singularId = perk.singularId;
	}
	return perk;
}


function range(array,fn) {
	let result = {};
	let singularId = Date.makeUid();
	array.forEach( (level,index) => {
		result[level] = perkDataCondition( fn(index,level), level-1, index, singularId );
	});
	return result;
}

function compose(perkIdStem,raw) {
	let alts = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	let perkList = {};
	raw.forEach( perkGroup => {
		Object.each( perkGroup, (perk,perkIdAffix) => {
			let perkId;
			for( let i=0 ; i<alts.length ; ++i ) {
				perkId = perkIdStem+'.'+perkIdAffix+'.'+alts.charAt(i);
				if( !perkList[perkId] ) break;
			}
			perkList[perkId] = perk;
		});
	});
	return perkList;
}

/**
Perks can have any or all of the following:
	- apply - a function that transforms any effect in any way. It is run at MANY moments during the code, and you must check for which
	          applies to you. Many types of 'when' exist!
	- effect - an effect that is applied to the entity at the moment of grant. Always given duration=true unless given another duration
	- skill  - a skill given to the entity at the moment of grant.
	- item   - an item given to the entity at the moment of grant. Always set to isPlot unless explicitly isPlot===false
	- loot   - uses an typeFilter spec identical to that used in places, carrying etc to generate an item.
By default like perks do NOT stack - they are each assigned a singularId and that is checked.
**/


//===================================================
// Air Mage
//
// High Concept: The winds move your enemies where you will
// Knockback, then pull toward, then shove any direction, then air burst from a center. Also knockdown.
// Do it singly, then more forcefully, then to groups: push into pits, walls or hazards
// Deprive the ability to hear (alerts), to speak (can't cast or alert friends), and eventually to breath
// Push any direction, pull enemies that prefer to stay at range or make one arrive sooner
// Assisted jump, fly, speedier run +25%, +50%
// Deflect incoming arrows, potions, etc with a passive wind defense
// Throw or shoot things longer distances: darts, potions, maybe not arrows
// On the moon air mages lose all their powers
LegacyList.airMage = compose('air mage',[

	range( [1,8,16], (index) => ({
		name: 'Shove gust '+Number.roman(index+1),
		skill: {
			needsTarget: true,
			rechargeTime: 50,
			range: 5,
			effect: { op: 'shove', value: index+2, duration: 0, isDeb: 1, isHarm: 1 }

		},
		description: 'Air buffets enemies away.'
	}) ),
	range( [2,7], (index) => ({
		name: 'Wind Leap '+Number.roman(index+1),
		onGain: { op: 'set', stat: 'jumpMax', value: 2+index, isHelp: 1 },
		description: 'Whirling air carries your jumps farther.'
	}) ),
	range( [5], (index) => ({
		name: 'Pulling gust '+Number.roman(index+1),
		skill: {
			needsTarget: true,
			rechargeTime: 50,
			range: 8,
			effect: { op: 'shove', pull: true, value: index+2, duration: 0, isDeb: 1, isHarm: 1 }

		},
		description: 'A sudden gust brings enemies closer.'
	}) ),
	range( [3,17], (index) => ({
		name: 'grounding wind '+Number.roman(index+1),
		onGain: { op: 'set', stat: 'stopThrown', value: 50+index*25 },
		description: 'Wind has a '+(50+index*25)+'% chance to shove thrown objects to the ground.'
	}) ),
	range( [4,19], (index) => ({
		name: 'Slowing zephyr '+Number.roman(index+1),
		skill: {
			needsTarget: true,
			rechargeTime: 50,
			range: 8,
			effect: { op: 'set', stat: 'movementSlow', value: 4-index, duration: 12, isDeb: 1 }
		},
		description: 'A zephyr opposes enemy movements, slowing their travel'+Math.percent(1/(4-index))+'%.'
	}) ),
	range( [6], (index) => ({
		name: 'Steal breath '+Number.roman(index+1),
		skill: {
			needsTarget: true,
			rechargeTime: 50,
			range: 5,
			effect: { op: 'set', stat: 'breathStopped', value: true, duration: Rules.breathLimitToDamage + 4, isHarm: 1 }
		},
		description: 'Suck the breath from your victim for '+(Rules.breathLimitToDamage + 4)+' rounds.'
	}) ),
	range( [12], (index) => ({
		name: 'Air bubble',
		onGain: { op: 'set', stat: 'breathIgnore', value: 40, duration: true, isHelp: 1 },
		description: 'An air bubble follows you, giving '+40+' rounds of extra breath.'
	}) ),
/*
	eOdorless
	eFlight
	eHaste
	eDeflect (or increase his dodge)
	blockChance
	eStun
	immune suffocate
*/
]);


//===================================================
// Archer
//
// High Concept: Master of the bow
LegacyList.archer = compose( 'archer', [
	range( [1,3,5,7,9,11,13,15,17,19], (index) => ({
		name: 'Marksman +'+((index+1)*10)+'%',
		apply: (when,e)=>when=='damage' && e.source && e.item && (e.item.isBow || e.item.isArrow)
			? e.value = ( e.value * (1+((index+1)*0.10)) + (e.item.plus||0) )
			: false,
		description: 'Bow shots do additional damage as your eagle eye finds weakness.'
	}) ),
	range( [2,18], (index) => ({
		name: 'Multi Shot x'+(index+2),
		skill: {
			rechargeTime: 50,
			passesTime: false,
			effect: { op: 'set', stat: 'freeCommands', value: [Command.SHOOT], duration: 2+index }
		},
		description: 'Rain arrows upon foes in a burst of speed'
	}) ),
	range( [4,14], (index) => ({
		name: 'Dash '+(3+index)+'x',
		skill: {
			rechargeTime: 20,
			passesTime: false,
			effect: { op: 'set', stat: 'freeCommands', value: Command.Movement, duration: 3+index-1 }
		},
		description: 'Move multiple times in a row. Any other action cancels the dash.'
	}) ),
	range( [6], (index) => ({
		name: 'Nimble shots',
		singularId: 'nimShot',
		apply: (when,e)=>when=='quick' && e.source && e.item && (e.item.isBow || e.item.isArrow)
			? e.quick = Math.max(e.quick||Quick.CLUMSY,Quick.NORMAL)
			: false,
		description: 'Faster shots now hit nimble creatures.'
	}) ),
	range( [8], (index) => ({
		name: 'Blind Shot',
		effect: { op: 'set', stat: 'blindShot', value: true, duration: true },
		description: 'Never miss when attacking enemies you can not see.'
	}) ),
	range( [10], (index) => ({
		name: 'Elemental Arrows',
		apply: (when,e)=>when=='shooter' && e.item && e.item.isBow
			? e.item.ammoDamageType = 'convey'
			: false,
		description: 'Your arrow\'s entire damage now aligns with the bow\'s bonus effect.'
	}) ),
	range( [12], (index) => ({
		name: 'Lithe shots',
		singularId: 'nimShot',
		apply: (when,e)=>when=='quick' && e.source && e.item && (e.item.isBow || e.item.isArrow)
			? e.quick = Math.max(e.quick||Quick.CLUMSY,Quick.NIMBLE)
			: false,
		description: 'Faster shots now hit lithe and nimble creatures.'
	}) ),
	range( [16], (index) => ({
		name: 'Exploding Shot',
		apply: (when,e)=>when=='effectShape' && e.source && source.explodingShot && e.item && e.item.isArrow && (e.effectShape==EffectShape.SINGLE || !e.effectShape)
			? e.effectShape = EffectShape.BLAST3
			: false,
		skill: {
			rechargeTime: 20,
			passesTime: false,
			effect: { op: 'set', stat: 'explodingShot', value: true, duration: 1 }
		},
		description: 'Your next shot will explode in a 3 radius blast.'
	}) ),

]);

//===================================================
// Assassin
//
// High Concept: Prepare carefully to destroy enemies on the first hit
/*
Weapons:
- Bows are too loud. Make there is no more stealth bow.
- Darts can be thrown (showing movement) or shot with a blowgun (no movement)
- Daggers can be concealed, like when you're skin-walking
- Traps with disablement, but never direct damage.
Getting close:
- Camo Nest hides you at range 6/4/2/0. senseLife defeats it. Scent alerts when within 1 tile.
- Lure can pull a creature from a group, or make them walk up to your camo nest
- Skin-walking you get a "skin sample" from a dead creature. But you can ONLY wield a dagger, else it blows your cover
- You can reduce their vision distance with very short duration sneak, then dash 2 to pass through their remaining alert range
Killing:
- Poisons you brew while doing Insidious Brew skill have limited lifespan, but big bonuses
- Specialty poisons "Disable" in various ways: sleep, stun, blind, panic, or a stink that enrages others at you
- Killing alerts nearby creatures, but a sleep/stun/confusion dart does not, giving you time to do that to the whole group
- Attacks against Disabled creatures have big damage bonuses. You probably get this at a very early level
Technique:
- Your assassinations are typically melee, and only ranged at higher levels, and with less success
- Maybe camo nest requires collecting detritus and time to setup (start nest, add x, y, then z).
- Eventually L10 Camo Nest skill lets you attack without being revealed
- Dash to flee if it all goes south
*/
LegacyList.assassin = compose('assassin',[
]);

//===================================================
// Blaster
//
LegacyList.blaster = compose( 'blaster', [
	range( [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19], (index) => ({
		name: 'Craft Explosives '+Number.roman(index+1),
		onGain: { op: 'set', stat: 'skillOrdner', value: index+1, duration: true },
		isAutoFavorite: true,
		rechargeTime: 5,
		skill: {
			craftId: 'ordner',
			passesTime: false,
		},
		description: 'Gain skill level '+(index+1)+' creating ordnance.'
	}) ),
	range( [2,8,14], (index) => ({
		name: 'Blast '+Number.roman(index+1),
		apply: (when,e)=>{
/*
			let item = when=='recipe.ordner' ? e.ingredientList.first : false;
			if( item && item.isPotion && e.ingredientList.count == 1 && item.effect && (item.effect.isDeb || item.effect.isDmg) ) {
				let effectShape = [EffectShape.BLAST3,EffectShape.BLAST4,EffectShape.BLAST5][index];
				return new RecipeAugment

				e.found = {
					augment:	e.ingredientList.first,
					transform:	item => item.effect.effectShape = effectShape,
					description: 'add blast area '+(3+index),
				}
			}
*/
		},
		skill: {
			craftId: 'ordner',
			passesTime: false,
		},
		description: 'Craft potions to blast in a radius of '+(3+index)
	}) ),
	range( [3,9,15], (index) => ({
		name: 'Build mines '+Number.roman(index+1),
		onGain: { op: 'set', stat: 'skillOrdnerMine', value: [EffectShape.SINGLE,EffectShape.BLAST2,EffectShape.BLAST3][index] },
		description: 'Convert a potion into a mine that explodes in radius '+(index+1)+'.'
	}) ),
	range( [4,7,11], (index) => ({
		name: 'Far toss '+Number.roman(index+1),
		onGain: { op: 'set', stat: 'potionRange', value: 6+index },
		description: 'Throw potions '+(index+1)+' tiles farther.'
	}) ),
/*	
	range( [5,10,16], (index) => ({
		name: 'Magician Blast '+Number.roman(index+1),
		skill: {
			craftId: 'ordner',
			passesTime: false,
		},
allow the use to select a point to blink to...
		onGain: { op: 'set', stat: 'skillOrdnerMine', value: [EffectShape.BLAST2,EffectShape.BLAST3,EffectShape.BLAST4][index] },
		description: 'Smash the potion at your feet and blink away, affecting all within '+(2+index)+' tiles.'
	}) ),
*/
]);

//===================================================
// Brawler
//
LegacyList.brawler = compose('brawler',[
	range( [1,5,9,13,17], (index) => ({
		name: 'Bruiser +'+((index+3)*20)+'%',
		apply: (when,e)=>when=='damage' && e.source && e.item && e.item.isClub
			? e.value = ( Rules.pickDamage(e.source.level,0,e.item) * (1+((index+3)*0.20)) + (e.item.plus||0) ) * (e.source.visciousWhack||1)
			: false,
		description: 'Heavy handed bashing with club weapons.'
	}) ),
	range( [3,7,11,15,19], (index) => ({
		name: 'Hurler +'+((index+3)*20)+'%',
		apply: (when,e) => when=='damage' && e.source && e.item && e.item.isRock
			? e.value = Rules.pickDamage(e.source.level,0,e.item) * (1+((index+3)*0.20)) + (e.item.plus||0)
			: false,
		description: 'Hurl rocks with mortal effect.'
	}) ),
	range( [10], (index) => ({
		name: 'Shove',
		skill: {
			needsTarget: true,
			rechargeTime: 20,
			passesTime: true,
			effect: { op: 'shove', value: 2+index, duration: 0 }
		},
		description: 'Push enemies backward'
	}) ),
	range( [2,14], (index) => ({
		name: 'Stunning blow '+((index+1)*10)+'%',
		apply: (when,e,details) => when=='secondary' && e.isEffect && e.item && (e.item.isClub || e.item.isRock) && e.op=='damage' ? 
			details.secondary.push( {
				effect: { op: 'set', stat: 'stun', value: true, duration: 1, icon: 'gui/icons/eShove.png' },
				chance: 100
			})
			: false,
		description: 'Stun foes with your overpowering club and rock bashes.'
	}) ),
	range( [6,12], (index) => ({
		name: 'Vigor +'+((index+1)*20)+'',
		onGain: { op: 'add', stat: 'healthMax', value: (index+1)*20, duration: true },
		description: 'Permanently gain health.'
	}) ),
	range( [4], (index) => ({
		name: 'Resist Bash',
		onGain: { op: 'add', stat: 'resist', value: DamageType.BASH, duration: true },
	}) ),
	range( [8], (index) => ({
		name: 'Shoulder Rush 1.5x',
		onGain: { op: 'set', stat: 'chargeAttackMult', value: 1.5, duration: true },
		description: 'Charge at least two squares in a straight line to inflict double damage.'
	}) ),
	range( [16], (index) => ({
		name: 'Bull Rush 3',
		skill: {
			needsTarget: true,
			rechargeTime: 20,
			passesTime: false,
			effect: { op: 'set', stat: 'freeCommands', value: Command.Movement, duration: 3 }
		},
		description: 'A quick charge that catches enemies off guard.'
	}) ),
	range( [18], (index) => ({
		name: 'Viscious Whack 2x',
		skill: {
			needsTarget: true,
			rechargeTime: 60,
			passesTime: false,
			effect: { op: 'set', stat: 'visciousWhack', value: 2, duration: 2 }
		},
		description: 'Your next blow with a club will do triple damage, in addition to any other bonuses you already have.'
	}) ),
]);

//===================================================
// Alchemist
//
// High Concept: Chemistry leads the way to power.
// Rapidly learn what ingredients make which potions
// When you brew potions you make more of them, and they last longer
// Gain ever-full font, which has ever-decreasing recharge time
// Ability to brew in the field - no gear required
LegacyList.alchemist = compose('alchemist',[
]);

//===================================================
// Cleric
//
// High Concept: You can't be killed if you're already healed!
// You are a tank, and meant to fight, but you heal very well both during and after
// Holy healing has generous recharge, plus you get +1% regen each level. 
// Any weapon with smite, in your hands, becomes all-smite damage; at early levels your hands do smite damage.
// Any light you hold extends +1/2/3/4/5/6 distance
// Your water potion bonus is great when you make them.
LegacyList.cleric = compose('cleric',[
]);

//===================================================
// Decimage
//
// High Concept: Decimate enemies with the power of untamed magic
// Shatter weapons and natural weapons
// Weaken armor, even natural armor, by temporarily cracking it
// Magic missiles fly from your hands. Shocking and corroding are your baliwicks
// Dissolve doors, chests, and objects
// Destroy some walls
LegacyList.decimage = compose('decimage',[
]);

//===================================================
// Druid
//
// High Concept: Bring wholesome life to the lifeless underground
// You can teleport to your "private garden" (a personal level)
// There you discover and tend plants that you will use in combat, to create effects, and green the levels
// Plants that damage are like tower defense. Vines delay, thorns harm, brambles AoE damage, poison spines
// Bush you can hide in
// Grows his own weapons, eg staves wrapped with brambles; plant that overwhelms scents
// You plant things in dead bodies. You want rotten meat.
// You regain power by planting, nurturing, growing, and also dwelling within green spaces
// Discover new seeds over time - throw a seed and it lives, growing in 3, 2, 1 or 0 rounds
// Your more powerful emplacement plants take time to grow. You must give them light and water to grow.
// Allied creatures may appear in your greened spaces, like lithe faeries that sleep your foes. Not pets. Won't leave area.
// Evenutally create water, but always low-level because it isn't about harming demons, its about nourishing plants.
// Root networks give tremor sense, and teleport you among certain types of plants
// Warp the wood of doors and weapons, temporarily ruining both
// At high levels you leave a trail of green grass everywhere.
LegacyList.druid = compose('druid',[
]);

//===================================================
// EarthMage
//
// High Concept: Primal forces of earth are yours to command
// Simply walk through stone as if it were air
// Make temporary stone walls, slow enemies with mud, quiksand, or rubble terrain
// Defend yourself with skin of stone, which also defeats knockback and shove due to your weight
// Bludgeon is your forte, with special skill with a hammer
// Tremors knock foes prone
// Know where things are in radius 4/5/6/7/8 with tremor sense
LegacyList.earthMage = compose('earthMage',[
]);

//===================================================
// Enchanter
//
// High Concept: Empower your weapons and armor
// Add pluses and effects to weapons and armor. Can have an isDmg and an isBuf.
// Items get inventory, and you 'enchant' by interacting with the item as if it were a merchant, and on hits all items check their inventories and do their enchantments.
// Can strip an enchantment from an item, and transfer it to another item.
// Create and recharge items and charms, like figurines
// Enchant squares in the world?
// Even enchant yourself with resistances and immunities: but you can only have 1/2/3 of each at a time.
// Maybe you can enchant things other people can't, like 
// You can disenchant things! Goblin altar magical suppression halts whatever effect that thing does, and more, fire resistance on demon squares.
// Disenchant constructs and they stop acting for a while, disenchant innate abilities as long as they're magical.
// Strip enemy buffs
// Disenchant a dark or light font and it stops working for a while.
LegacyList.enchanter = compose('enchanter',[
]);

//===================================================
// Hoplite
//
// High Concept: Stand firm with you shield to avert all attacks
// Stand still to deflect initial onslaughts with +30% deflect
// Become near-immune to ranged attacks
// Brace your shield for big defense bonuses when fighting
// Bonuses to range 2 spears. At highest level augment range 2 weapons to range 3 when braced
// Can't use bows while braced
LegacyList.hoplite = compose('hoplite',[
]);

//===================================================
// Illusionist
//
// High Concept: What is reality except what you claim it to be?
// Deceive others into acting against their best interests
// Mimic: inanimate objects, to be ignored, or food, to lure them to you for surprise attack
// At higher levels you can move every 3rd round as an inanimate object and nobody will think anything of it
// Reshape - gather creature samples then to look like them
// Mirror image - which of you should they hit? Any interaction dispels, notably AoE dispells many
// Faux face makes an enemy look like they're you, and you like them. They're allies attack them!
// Beauty spell makes you able to get better prices
// Displacement make you seem to be elsewhere, causing 50% miss chance
// Grim reaper illusion fears because all creatures fear death
// Change scent - to that of another creature, maybe something they fear. Red ooze goes to older spots on the scent path instead of newer.
// Lure with illusory food, illusory noises, or whatever the creature desires
// Distort Perception confuses creatures
LegacyList.illusionist = compose('illusionist',[
]);

//===================================================
// Monk
//
// High Concept: Self discipline makes your body a lethal weapon
let noChestArmor = e => e.source && e.source.isMonsterType && !e.source.anySlotFilled([Slot.ARMOR]);
let handsEmpty = e => e.source && e.source.isMonsterType && !e.source.anySlotFilled([Slot.WEAPON,Slot.SHIELD,Slot.HANDS]);
let monkHandSkill = (damageType) => ({
	slot: Slot.SKILL,
	isMonkHandSkill: true,
	isAutoFavorite: true,
	damageType: damageType,
	effect: {
		op: 'custom',
		duration: true,
		customFn: function() {
			let doffList = new Finder( this.source.inventory ).filter( item => item.isMonkHandSkill && item.inSlot && item.damageType != damageType );
			doffList.forEach( item => this.source.doff(item) );
			this.source.findItem( item=>item.isHands ).damageType = damageType;
		}
	}
});

LegacyList.monk = compose( 'monk', [
	range( [1,5,10,15,20], (index,level) => ({
		name: 'Open Hand Technique '+Number.roman(index+1),
		singularId: 'monkOpenHand',
		onGain: (entity) => {
			let hands = entity.findItem(i=>i.isHands);
			hands.damage  = Rules.playerDamage(level) * (1+((index+1)*0.20));
		},
		description: 'Your hands become weapons capable of major damage.'
	})),
	range( [1], (index,level) => ({
		name: 'Stone Hands '+Number.roman(index+1),
		skill: monkHandSkill( DamageType.BASH ),
		description: 'Your hands bash like stone.'
	})),
	range( [5], (index,level) => ({
		name: 'Stabbing Hands '+Number.roman(index+1),
		skill: monkHandSkill( DamageType.STAB ),
		description: 'Your hands stab like a knife.'
	})),
	range( [9], (index) => ({
		name: 'Chopping Hands '+Number.roman(index+1),
		skill: monkHandSkill( DamageType.CHOP ),
		description: 'Your strikes chop like an axe.'
	})),
	range( [13], (index) => ({
		name: 'Shocking Hands '+Number.roman(index+1),
		skill: monkHandSkill( DamageType.SHOCK ),
		description: 'Your strikes jolt with electricity.'
	})),
	range( [19], (index) => ({
		name: 'Luminous Hands '+Number.roman(index+1),
		skill: monkHandSkill( DamageType.LIGHT ),
		description: 'Your hands become pure light.'
	})),
	range( [2,6,10,14], (index) => ({
		name: 'Jaguar Technique '+Number.roman(index+1),
		singularId: 'monkJaguar',
		allow: noChestArmor,
		skill: {
			rechargeTime: 30,
			passesTime: false,
			effect: { op: 'max', stat: 'speed', value: 2, duration: 5+index*2, contingent: noChestArmor },
		},
		description: 'Move like the jaguar for '+((index+1)*4)+' turns to outpace opponents. No chest armor allowed.'
	})),
	range( [3,7,11], (index,level) => ({
		name: 'Refocus Harm '+Number.roman(index+1),
		allow: noChestArmor,
		apply: (when,e) => when=='armor' && noChestArmor(e) ? e.armor = Rules.playerArmor(level+1) : false,
		description: 'You move like wind to deflect '+Rules.playerArmor(level+1)+'% of damage. No chest armor.'
	})),
	range( [16], (index) => ({
		name: 'Jaguar Essence',
		singularId: 'monkJaguar',
		allow: noChestArmor,
		onGain: { op: 'max', stat: 'speed', value: 2, duration: true, contingent: noChestArmor },
		description: 'Become one with the jaguar to move faster permanently. No chest armor allowed.'
	})),
	range( [17], (index) => ({
		name: 'Attunement',
		onGain: { op: 'set', stat: 'senseLiving', value: true, duration: true },
		description: 'You sense all living energy.'
	})),
	range( [18], (index) => ({
		name: 'Resist Energies',
		onGain: { op: 'add', stat: 'resist', value: Damage.Elemental, duration: true },
		description: 'You resist damage from all elemental energies.'
	})),
//	range( [19], (index) => ({
//		name: 'Divine strike',
//		apply: (when,e)=> when=='damageType' && e.item && e.item.isHands ? e.damageType = e.item.damageType = DamageType.SMITE : false,
//		description: 'Your strikes smite with divine power.'
//	})),
	range( [4,12], (index) => ({
		name: 'Peaceful Chi '+Number.roman(index+1),
		skill: {
			rechargeTime: 50,
			effect: {
				op: 'set',
				stat:'attitude',
				ignoreSource: true,
				value: Attitude.PACIFIED,
				effectShape: [EffectShape.BLAST3,EffectShape.BLAST5][index],
				xDuration: 2.0,
				icon: 'gui/icons/eAttitude.png'
			}
		},
		description: 'Radiate peace into the hearts of your opponents.'
	})),
	range( [8,15], (index) => ({
		name: 'Healing Trance '+Number.roman(index+1),
		skill: {
			rechargeTime: 100,
			effect: {
				op: 'set',
				stat: 'attitude',
				value: Attitude.BUSY,
				duration: (10-index*5),
				description: 'in a healing trance',
				onEnd: (deed) => {
					if( deed.completed() ) {
						let healEffect = { op: 'heal', value: 10000, duration: 0, healingType: DamageType.SMITE, icon: 'gui/icons/eHeal.png' };
						effectApply( healEffect, deed.source, deed.target, null, 'postTrance' );
					}
				}
			}
		},
		description: 'Enter a trance for '+(10-index*5)+' turns to restore your health.'
	})),
]);

//===================================================
// Neuromancer
//
// High Concept: Eventually go anywhere and do anything untouched by enemies
// Hesitate, confuse, enrage, panic, fear, persuade, pacify
// Learn what they know: map, treasure, traps, plot
// Forget me, lure elsewhere
// Buy for reduced prices, sell for better prices, or make them think I already paid
LegacyList.neuromancer = compose('neuromancer',[
]);

//===================================================
// Ninja
//
// High Concept: They can't hit what they never see
// Detect where enemies are looking to avoid being seen, and even dim their perceptions and see in the dark
// Catch thrown and shot objects
// Avoid scent hunters by reducing and then eliminating your scent
// Eventually become invisible at will
LegacyList.ninja = compose( 'ninja', [
	range( [1], (index) => ({
		name: 'Intuition',
		skill: {
			slot: Slot.SKILL,	// means you san see if it is selected.
			passesTime: false,
			effect: { op: 'set', stat: 'sensePerception', value: true, duration: true }
		},
		description: 'Intuition tells you what areas are being watched.'
	}) ),
	range( [2,6,12,17], (index) => ({
		name: 'Sneak '+Number.roman(index+1),
		skill: {
			rechargeTime: 40,
			passesTime: false,
			effect: { op: 'set', stat: 'sneak', value: index+2, duration: 20 },
		},
		description: 'Enemy sight distance reduced by '+(index+2)+' as you sneak. However, if your light is bright they will see you!'
	}) ),
	range( [3,7,13], (index) => ({
		name: 'Nimble Catch '+Number.roman(index+1),
		singluarId: 'nimbleCatch',
		onGain: { op: 'max', stat: 'catchThrown', value: 50+index*25, duration: true },
		description: 'You catch thrown objects '+(50+index*25)+'% of the time.'
	}) ),
	range( [4,9,15], (index) => ({
		name: 'Shot Catch '+Number.roman(index+1),
		singluarId: 'shotCatch',
		onGain: { op: 'max', stat: 'catchShot', value: 50+index*25, duration: true },
		description: 'You catch shot objects '+(50+index*25)+'% of the time.'
	}) ),
	range( [5,14], (index) => ({
		name: 'Odorless Step '+Number.roman(index+1),
		singularId: 'ninjaOdor',
		skill: {
			rechargeTime: 40,
			passesTime: false,
			effect: { op: 'max', stat: 'scentReduce', value: Rules.SCENT_AGE_LIMIT, duration: 2+index*2 }
		},
		description: 'Take '+(2+index*2)+' steps without leaving a scent trail.'
	}) ),
	range( [10], (index) => ({
		name: 'Delicacy',
		skill: {
			slot: Slot.SKILL,
			passesTime: false,
			effect: { op: 'set', stat: 'senseAlert', value: true, duration: true }
		},
		description: 'Delicate sense reveals how close is "too close".'
	}) ),
	range( [8,11,16], (index) => ({
		name: 'Dark Vision '+Number.roman(index+1),
		skill: {
			slot: Slot.SKILL,
			passesTime: false,
			effect: { op: 'set', stat: 'senseDarkVision', value: 4+index*2, duration: true }
		},
		description: 'See in the dark '+(4+index*2)+' squares.'
	}) ),
	range( [18], (index) => ({
		name: 'Odorless',
		singularId: 'ninjaOdor',
		skill: {
			slot: Slot.SKILL,
			passesTime: false,
			effect: { op: 'set', stat: 'scentReduce', value: Rules.SCENT_AGE_LIMIT, duration: true }
		},
		description: 'Become odorless at will.'
	}) ),
	range( [19], (index) => ({
		name: 'Invisible',
		skill: {
			slot: Slot.SKILL,
			passesTime: false,
			effect: { op: 'set', stat: 'invisible', value: true, duration: true }
		},
		description: 'Become invisible at will.'
	}) ),

]);

//===================================================
// Planar Mage
//
// High Concept: Tap the multiverse of planes to overcome all
// Banish demons, gate in elementals, or tag monsters for recall. You can't control them, but summon them to fight what they hate
// Easily summon things less than your level, but for beefy stuff you must touch them for x rounds to "mark" them.
// Mega travel with blink, teleport, mega-blink, and mark/recall to Dwarf villages
// Become ethereal, attack while ethereal
// Visit the Solar plane as a base of operations, caching infinite loot with ease
// Constantly unlocking new planes to access, and get resources. Some planes, when you visit, recharge your stuff. Fire plane recharges or empowers fire potions.
LegacyList.planarMage = compose('planarMage',[
]);

//===================================================
// Possessor
//
// High Concept: The body is just a vehicle, and others' minds easily evicted
// Possess tougher things longer, and overcome possession resistance
// Make body safer, like by hiding it in containers; then suicide
// Eventually leave your body entirely, and use illusion spells to look OK to drawves
LegacyList.possessor = compose('possessor',[
]);

//===================================================
// Priest
//
// High Concept: Beseech your god humbly to thrive in adversity
// You must actually pray from time to time, a kind of meditation, to restore your spells
// Sacrifice is a skill. It lets you select an item from inventory and sacrifice it to your god.
// God requires: spare creature, sacrifice item, heal sick, evangelize, convert person
// God requires: fight under imposed duress like blind or half health, or with god's chosen weapon
// When god requires something impossible, like killing a demon with a dagger, he'll subtly help you succeed
// Lots of light. Followers, who you've convinced of the justness of your cause, fight for you.
// Create temp mana fonts
LegacyList.priest = compose('priest',[
]);

//===================================================
// Ranger
//
// High Concept: Track anything, know where everything is
// Tracking scent, detect treasure and monsters at range
// Mask my own scent and reasonable camoflage
// Sword and bow attacks benefit with critical hits as my monster knowledge of weaknesses grows.
LegacyList.ranger = compose('ranger',[
]);

//===================================================
// Soldier
//
// High Concept: Sword and armor are my meat and potatoes
LegacyList.soldier = compose('soldier',[
	range( [1,3,5,7,9,11,13,15,17,19], (index) => ({
		name: 'Swordsmanship +'+((index+1)*10)+'%',
		apply: (when,e)=>when=='damage' && e.item && e.item.isSword && e.op=='damage' ? e.value *= 1+(index+1)*0.10 : false,
		description: 'Inflict more damage with sword style weapons.'
	}) ),
	range( [2,6,14,18], (index) => ({
		name: 'Shower of Blows '+(2+index)+'x',
		skill: {
			rechargeTime: 50,
			passesTime: false,
			effect: { op: 'set', stat: 'freeCommands', value: [Command.ATTACK], duration: 2+index }
		},
		description: 'Shower melee and reach attacks upon enemies'
	}) ),
	range( [10], (index) => ({
		name: 'Power Shove x'+(3+index),
		skill: {
			needsTarget: true,
			rechargeTime: 30,
			passesTime: true,
			effect: { op: 'shove', value: 3+index, duration: 0 }
		},
		description: 'Force enemies to fall back, even into pits'
	}) ),
	range( [1,4,12], (index) => ({
		name: 'Dash '+(3+index)+'x',
		skill: {
			rechargeTime: 20,
			passesTime: false,
			effect: { op: 'set', stat: 'freeCommands', value: Command.Movement, duration: 3+index-1 }
		},
		description: 'Move multiple times in a row. Any other action cancels the dash.'
	}) ),
	range( [8,16], (index) => ({
		name: 'Armor Skill +'+((index+1)*20)+'%',
		apply: (when,e) => {
			return when=='armor' ? e.armor *= 1+(index+1)*0.20 : false;
		},
		description: 'Improves the defense of any armor worn, reducing damage.'
	}) ),
]);

//===================================================
// Tamer
//
// High Concept: Anything can be tamed, if you transcend human beliefs
// Tame rares, patiently feeding them, persuading them, even killing some and understanding their habeology
// You might have to return to the same creature multiple days in a row, feeding it without being killed
// Habeology of one creature type (isEarthChild) will give insight into others
// acquire their senses, see what they see on your map and in real time
// Extraordinary heal and resurrect of pets. Name them.
// Get 1, 2 then 3 favored pets who never die while you live.
LegacyList.tamer = compose('tamer',[
]);

//===================================================
// Temporalist
//
// High Concept: Control time, against which all are helpless
// Stop others' time - freeze their movement, then their reality. Early you can't attack those in stasis. Later you can.
// Gain time to have extra moves, then extra attacks
// Rewind your person time to an earlier location/mind state/health level.
// Restore weapons?
LegacyList.temporalist = compose('temporalist',[
]);

//===================================================
// Thermaturge
//
// High Concept: The power of temperature overcomes all resistance
// Fire & ice extra damage and range
// Ice walls, spikes and prisons, AoE slippery floors, water walk
// Heat weapons, boil water and brains; overcome fire immunity and resistance
LegacyList.thermaturge = compose('thermaturge',[
]);

//===================================================
// Tinker
//
// High Concept: Lord of Constructs, even ones you ride!
// Build ever more powerful constructs that fight for you
// Eventually ride in them, that is, look like it, get its non-mind resistances, sight and movement
// Repair damage, back to 80/60/40/20 then unable to repair; repair during battle
// Augment constructs HP, resistances, mech wings, and eventually give them an inventory to use goods
// So strong they break weapons often. Never get armor/helms/boots/rings/etc.
// 2x2 construct that can bash away any wall with four surrounding squares being not-wall
// Learn weaknesses of constructs you face. You get habeology of automatons
// Alter their programming to become neutral. never gain them as pets, but maybe pirate for parts.
LegacyList.tinker = compose('tinker',[
]);



return {
	LegacyList: LegacyList
}

});
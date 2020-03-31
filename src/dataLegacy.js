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
			icon: "skill.png"
		});
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
	if( perk.effect ) {
		perk.effect.duration = perk.effect.duration===undefined ? true : perk.effect.duration;
		perk.effect.singularId = perk.singularId;
	}
	return perk;
}


function range(array,fn) {
	let result = {};
	let singularId = GetTimeBasedUid();
	array.forEach( (level,index) => {
		result[level] = perkDataCondition( fn(level,index), level, index, singularId );
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
LegacyList.airMage = compose('air mage',[
]);


//===================================================
// Archer
//
LegacyList.archer = compose( 'archer', [
	range( [1,3,5,7,9,11,13,15,17,19], (level,index) => ({
		name: 'Marksman +'+((index+1)*10)+'%',
		apply: (when,e)=>when=='damage' && e.source && e.item && (e.item.isBow || e.item.isArrow)
			? e.value = ( e.value * (1+((index+1)*0.10)) + (e.item.plus||0) )
			: false,
		description: 'Bow shots do additional damage as your eagle eye finds weakness.'
	}) ),
	range( [2,18], (level,index) => ({
		name: 'Multi Shot x'+(index+2),
		skill: {
			rechargeTime: 50,
			passesTime: false,
			effect: { op: 'set', stat: 'freeCommands', value: [Command.SHOOT], duration: 2+index }
		},
		description: 'Rain arrows upon foes in a burst of speed'
	}) ),
	range( [4,14], (level,index) => ({
		name: 'Dash '+(3+index)+'x',
		skill: {
			rechargeTime: 20,
			passesTime: false,
			effect: { op: 'set', stat: 'freeCommands', value: Command.Movement, duration: 3+index-1 }
		},
		description: 'Move multiple times in a row. Any other action cancels the dash.'
	}) ),
	range( [6], (level,index) => ({
		name: 'Nimble shots',
		singularId: 'nimShot',
		apply: (when,e)=>when=='quick' && e.source && e.item && (e.item.isBow || e.item.isArrow)
			? e.quick = Math.max(e.quick||Quick.CLUMSY,Quick.NORMAL)
			: false,
		description: 'Faster shots now hit nimble creatures.'
	}) ),
	range( [8], (level,index) => ({
		name: 'Blind Shot',
		effect: { op: 'set', stat: 'blindShot', value: true, duration: true },
		description: 'Never miss when attacking enemies you can not see.'
	}) ),
	range( [10], (level,index) => ({
		name: 'Elemental Arrows',
		apply: (when,e)=>when=='shooter' && e.item && e.item.isBow
			? e.item.ammoDamageType = 'convey'
			: false,
		description: 'Your arrow\'s entire damage now aligns with the bow\'s bonus effect.'
	}) ),
	range( [12], (level,index) => ({
		name: 'Lithe shots',
		singularId: 'nimShot',
		apply: (when,e)=>when=='quick' && e.source && e.item && (e.item.isBow || e.item.isArrow)
			? e.quick = Math.max(e.quick||Quick.CLUMSY,Quick.NIMBLE)
			: false,
		description: 'Faster shots now hit lithe and nimble creatures.'
	}) ),
	range( [16], (level,index) => ({
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
	range( [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19], (level,index) => ({
		name: 'Craft Explosives '+Number.roman(level),
		effect: { op: 'set', stat: 'skillOrdner', value: level, duration: true },
		skill: {
			craftId: 'ordner',
			passesTime: false,
		},
		description: 'Gain skill level '+level+' creating ordnance.'
	}) ),
	range( [2,8,14], (level,index) => ({
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
	range( [3,9,15], (level,index) => ({
		name: 'Build mines '+Number.roman(index+1),
		effect: { op: 'set', stat: 'skillOrdnerMine', value: [EffectShape.SINGLE,EffectShape.BLAST2,EffectShape.BLAST3][index] },
		description: 'Convert a potion into a mine that explodes in radius '+(index+1)+'.'
	}) ),
	range( [4,7,11], (level,index) => ({
		name: 'Far toss '+Number.roman(index+1),
		effect: { op: 'set', stat: 'potionRange', value: 6+index },
		description: 'Throw potions '+(index+1)+' tiles farther.'
	}) ),
/*	
	range( [5,10,16], (level,index) => ({
		name: 'Magician Blast '+Number.roman(index+1),
		skill: {
			craftId: 'ordner',
			passesTime: false,
		},
allow the use to select a point to blink to...
		effect: { op: 'set', stat: 'skillOrdnerMine', value: [EffectShape.BLAST2,EffectShape.BLAST3,EffectShape.BLAST4][index] },
		description: 'Smash the potion at your feet and blink away, affecting all within '+(2+index)+' tiles.'
	}) ),
*/
]);

//===================================================
// Brawler
//
LegacyList.brawler = compose('brawler',[
	range( [1,5,9,13,17], (level,index) => ({
		name: 'Bruiser +'+((index+3)*20)+'%',
		apply: (when,e)=>when=='damage' && e.source && e.item && e.item.isClub
			? e.value = ( Rules.pickDamage(e.source.level,0,e.item) * (1+((index+3)*0.20)) + (e.item.plus||0) ) * (e.source.visciousWhack||1)
			: false,
		description: 'Heavy handed bashing with club weapons.'
	}) ),
	range( [3,7,11,15,19], (level,index) => ({
		name: 'Hurler +'+((index+3)*20)+'%',
		apply: (when,e) => when=='damage' && e.source && e.item && e.item.isRock
			? e.value = Rules.pickDamage(e.source.level,0,e.item) * (1+((index+3)*0.20)) + (e.item.plus||0)
			: false,
		description: 'Hurl rocks with mortal effect.'
	}) ),
	range( [10], (level,index) => ({
		name: 'Shove',
		skill: {
			needsTarget: true,
			rechargeTime: 20,
			passesTime: true,
			effect: { op: 'shove', value: 2+index, duration: 0 }
		},
		description: 'Push enemies backward'
	}) ),
	range( [2,14], (level,index) => ({
		name: 'Stunning blow '+((index+1)*10)+'%',
		apply: (when,e,details) => when=='secondary' && e.isEffect && e.item && (e.item.isClub || e.item.isRock) && e.op=='damage' ? 
			details.secondary.push( {
				effect: { op: 'set', stat: 'stun', value: true, duration: 1, icon: 'gui/icons/eShove.png' },
				chance: 100
			})
			: false,
		description: 'Stun foes with your overpowering club and rock bashes.'
	}) ),
	range( [6,12], (level,index) => ({
		name: 'Vigor +'+((index+1)*20)+'',
		effect: { op: 'add', stat: 'healthMax', value: (index+1)*20, duration: true },
		description: 'Permanently gain health.'
	}) ),
	range( [4], (level,index) => ({
		name: 'Resist Bash',
		effect: { op: 'add', stat: 'resist', value: DamageType.BASH, duration: true },
	}) ),
	range( [8], (level,index) => ({
		name: 'Shoulder Rush 1.5x',
		effect: { op: 'set', stat: 'chargeAttackMult', value: 1.5, duration: true },
		description: 'Charge at least two squares in a straight line to inflict double damage.'
	}) ),
	range( [16], (level,index) => ({
		name: 'Bull Rush 3',
		skill: {
			needsTarget: true,
			rechargeTime: 20,
			passesTime: false,
			effect: { op: 'set', stat: 'freeCommands', value: Command.Movement, duration: 3 }
		},
		description: 'A quick charge that catches enemies off guard.'
	}) ),
	range( [18], (level,index) => ({
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
// Brewer
//
// High Concept: Chemistry leads the way to power.
// Rapidly learn what ingredients make which potions
// When you brew potions you make more of them, and they last longer
// Gain ever-full font, which has ever-decreasing recharge time
LegacyList.brewer = compose('brewer',[
]);

//===================================================
// Cleric
//
// High Concept: You can't be killed if you're already healed!
// You are a tank, and meant to fight, but you heal very well both during and after
// Holy healing has generous recharge, plus you get +1% regen each level. 
// Any weapon with smite, in your hands, becomes all-smite damage
// Any light you hold extends +1/2/3/4/5/6 distance
// Your water potion bonus is second only to the Druid
LegacyList.cleric = compose('cleric',[
]);

//===================================================
// Decimage
//
LegacyList.decimage = compose('decimage',[
]);

//===================================================
// Druid
//
// Warp doors off their hinges
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
LegacyList.enchanter = compose('enchanter',[
]);

//===================================================
// Hoplite
//
LegacyList.hoplite = compose('hoplite',[
]);

//===================================================
// Illusionist
//
LegacyList.illusionist = compose('illusionist',[
]);

//===================================================
// Monk
//
let noChestArmor = e => e.source && e.source.isMonsterType && !e.source.anySlotFilled([Slot.ARMOR]);
let handsEmpty = e => e.source && e.source.isMonsterType && !e.source.anySlotFilled([Slot.WEAPON,Slot.SHIELD,Slot.HANDS]);

LegacyList.monk = compose( 'monk', [
	range( [1,5], (level,index) => ({
		name: 'Stone Hands +'+((index+1)*20)+'%',
		singularId: 'monkHands',
		allow: handsEmpty,
		apply: (when,e) => {
			if( when=='damage' && e.source && e.item && e.item.isHands ) {
				let ok = handsEmpty(e);
				e.value = ok ? Rules.pickDamage(e.source.level,0,e.item) * (1+((index+1)*0.20)) : Rules.pickDamage(1,0,e.item);
			}
		},
		description: 'Your hands strike like stone. Hands must be empty.'
	})),
	range( [9,13], (level,index) => ({
		name: 'Chopping Hands +'+((index+3)*20)+'%',
		singularId: 'monkHands',
		allow: handsEmpty,
		apply: (when,e) => {
			if( e.source && e.item && e.item.isHands ) {
				let ok = handsEmpty(e);
				if( when=='damageType' ) {
					e.item.damageType = ok ? DamageType.CHOP : DamageType.BASH;
					e.damageType = ok ? DamageType.CHOP : DamageType.BASH;
				}
				if( when=='damage' ) {
					e.value = ok ? Rules.pickDamage(e.source.level,0,e.item) * (1+((index+3)*0.20)) : Rules.pickDamage(1,0,e.item);
				}
			}
		},
		description: 'Your strikes chop like an axe for extra damage. Hands must be empty.'
	})),
	range( [2,6,10,14], (level,index) => ({
		name: 'Jaguar Technique '+Number.roman(index+1),
		singularId: 'monkJaguar',
		allow: noChestArmor,
		skill: {
			rechargeTime: 30-(index*4),
			passesTime: false,
			effect: { op: 'max', stat: 'speed', value: 2, duration: ((index+1)*4), contingent: noChestArmor },
		},
		description: 'Move like the jaguar for '+((index+1)*4)+' turns to outpace opponents. No chest armor allowed.'
	})),
	range( [3,7,11], (level,index) => ({
		name: 'Refocus Harm '+Number.roman(index+1),
		allow: noChestArmor,
		apply: (when,e) => when=='armor' && noChestArmor(e) ? e.armor = Rules.playerArmor(level+1) : false,
		description: 'You move like wind to deflect '+Rules.playerArmor(level+1)+'% of damage. No chest armor.'
	})),
	range( [16], (level,index) => ({
		name: 'Jaguar Essence',
		singularId: 'monkJaguar',
		allow: noChestArmor,
		effect: { op: 'max', stat: 'speed', value: 2, duration: true, contingent: noChestArmor },
		description: 'Become one with the jaguar to move faster permanently. No chest armor allowed.'
	})),
	range( [17], (level,index) => ({
		name: 'Attunement',
		effect: { op: 'set', stat: 'senseLiving', value: true, duration: true },
		description: 'You sense all living energy.'
	})),
	range( [18], (level,index) => ({
		name: 'Resist Energies',
		effect: { op: 'add', stat: 'resist', value: Damage.Elemental, duration: true },
		description: 'You resist damage from all elemental energies.'
	})),
	range( [19], (level,index) => ({
		name: 'Divine strike',
		apply: (when,e)=> when=='damageType' && e.item && e.item.isHands ? e.damageType = e.item.damageType = DamageType.SMITE : false,
		description: 'Your strikes smite with divine power.'
	})),
	range( [4,12], (level,index) => ({
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
	range( [8,15], (level,index) => ({
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
	range( [1], (level,index) => ({
		name: 'Intuition',
		skill: {
			slot: Slot.SKILL,
			passesTime: false,
			effect: { op: 'set', stat: 'sensePerception', value: true, duration: true }
		},
		description: 'Intuition tells you what areas are being watched.'
	}) ),
	range( [2,6,12,17], (level,index) => ({
		name: 'Sneak '+Number.roman(index+1),
		skill: {
			rechargeTime: 40,
			passesTime: false,
			effect: { op: 'set', stat: 'sneak', value: index+2, duration: 20 },
		},
		description: 'Enemy sight distance reduced by '+(index+2)+' as you sneak. However, if your light is bright they will see you!'
	}) ),
	range( [3,7,13], (level,index) => ({
		name: 'Nimble Catch '+Number.roman(index+1),
		singluarId: 'nimbleCatch',
		effect: { op: 'max', stat: 'catchThrown', value: 50+index*25, duration: true },
		description: 'You catch thrown objects '+(50+index*25)+'% of the time.'
	}) ),
	range( [4,9,15], (level,index) => ({
		name: 'Shot Catch '+Number.roman(index+1),
		singluarId: 'shotCatch',
		effect: { op: 'max', stat: 'catchShot', value: 50+index*25, duration: true },
		description: 'You catch shot objects '+(50+index*25)+'% of the time.'
	}) ),
	range( [5,14], (level,index) => ({
		name: 'Odorless Step '+Number.roman(index+1),
		singularId: 'ninjaOdor',
		skill: {
			rechargeTime: 40,
			passesTime: false,
			effect: { op: 'max', stat: 'scentReduce', value: Rules.SCENT_AGE_LIMIT, duration: 2+index*2 }
		},
		description: 'Take '+(2+index*2)+' steps without leaving a scent trail.'
	}) ),
	range( [10], (level,index) => ({
		name: 'Delicacy',
		skill: {
			slot: Slot.SKILL,
			passesTime: false,
			effect: { op: 'set', stat: 'senseAlert', value: true, duration: true }
		},
		description: 'Delicate sense reveals how close is "too close".'
	}) ),
	range( [8,11,16], (level,index) => ({
		name: 'Dark Vision '+Number.roman(index+1),
		skill: {
			slot: Slot.SKILL,
			passesTime: false,
			effect: { op: 'set', stat: 'senseDarkVision', value: 4+index*2, duration: true }
		},
		description: 'See in the dark '+(4+index*2)+' squares.'
	}) ),
	range( [18], (level,index) => ({
		name: 'Odorless',
		singularId: 'ninjaOdor',
		skill: {
			slot: Slot.SKILL,
			passesTime: false,
			effect: { op: 'set', stat: 'scentReduce', value: Rules.SCENT_AGE_LIMIT, duration: true }
		},
		description: 'Become odorless at will.'
	}) ),
	range( [19], (level,index) => ({
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
// Mega travel with blink, teleport, mega-blink, and mark/recall to Dwarf villages
// Become ethereal, attack while ethereal
// Visit the Solar plane as a base of operations, caching infinite loot with ease
LegacyList.planarMage = compose('planarMage',[
]);

//===================================================
// Possessor
//
// High Concept: The body is just a vehicle, the mind, easily overcome
// Possess tougher things longer, and overcome possession resistance
// Make body safer, like by hiding it in containers; then suicide
// Eventually leave your body entirely, and use illusion spells to look OK to drawves
LegacyList.possessor = compose('possessor',[
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
	range( [1,3,5,7,9,11,13,15,17,19], (level,index) => ({
		name: 'Swordsmanship +'+((index+1)*10)+'%',
		apply: (when,e)=>when=='damage' && e.item && e.item.isSword && e.op=='damage' ? e.value *= 1+(index+1)*0.10 : false,
		description: 'Inflict more damage with sword style weapons.'
	}) ),
	range( [2,6,14,18], (level,index) => ({
		name: 'Shower of Blows '+(2+index)+'x',
		skill: {
			rechargeTime: 50,
			passesTime: false,
			effect: { op: 'set', stat: 'freeCommands', value: [Command.ATTACK], duration: 2+index }
		},
		description: 'Shower melee and reach attacks upon enemies'
	}) ),
	range( [10], (level,index) => ({
		name: 'Power Shove x'+(3+index),
		skill: {
			needsTarget: true,
			rechargeTime: 30,
			passesTime: true,
			effect: { op: 'shove', value: 3+index, duration: 0 }
		},
		description: 'Force enemies to fall back, even into pits'
	}) ),
	range( [1,4,12], (level,index) => ({
		name: 'Dash '+(3+index)+'x',
		skill: {
			rechargeTime: 20,
			passesTime: false,
			effect: { op: 'set', stat: 'freeCommands', value: Command.Movement, duration: 3+index-1 }
		},
		description: 'Move multiple times in a row. Any other action cancels the dash.'
	}) ),
	range( [8,16], (level,index) => ({
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
// acquire their senses, see what they see on your map and in real time
// Extraordinary heal and resurrect of pets. Name them.
// Get 1, 2 then 3 favored pets who never die while you live.
LegacyList.tamer = compose('tamer',[
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
LegacyList.tinker = compose('tinker',[
]);



return {
	LegacyList: LegacyList
}

});
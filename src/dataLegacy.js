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
		if( perk.item.effect ) {
			perk.item.effect.name = perk.item.effect.name || perk.item.name;
			perk.item.effect.singularId = perk.item.effect.singularId || perk.singularId;
		}
		if( perk.item.slot ) {
			perk.item.useVerb = perk.item.useVerb || 'activate';
		}
	}
	if( perk.skill ) {
		Object.assign( perk.skill, { isItemType: true, isSkill: true, img: 'gui/icons/skill.png', icon: "skill.png", typeId: 'skill' } );
		perk.skill.singularId = perk.singularId;
		perk.skill.description = perk.description;
		perk.skill.name = perk.skill.name || perk.name;
		if( perk.skill.effect ) {
			perk.skill.effect.name = perk.skill.effect.name || perk.skill.name;
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
	let alts = 'abcdefghijklmnopqrstuvwxyz';
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
	          applies to you. when=='main' is the main one, but calcReduction exists as do many others.
	- effect - an effect that is applied to the entity at the moment of grant. Always given duration=true unless given another duration
	- skill  - a skill given to the entity at the moment of grant.
	- item   - an item given to the entity at the moment of grant. Always set to isPlot unless explicitly isPlot===false
	- loot   - uses an typeFilter spec identical to that used in places, lootInventory etc to generate an item.
By default like perks do NOT stack - they are each assigned a singularId and that is checked.
**/

//
// Soldier
//

LegacyList.soldier = compose('soldier',[
	range( [1,3,5,7,9,11,13,15,17,19], (level,index) => ({
		name: 'Swordsmanship +'+((index+1)*10)+'%',
		apply: (when,e)=>when=='main' && e.item && e.item.isSword && e.op=='damage' ? e.value *= 1+(index+1)*0.10 : false,
		description: 'Inflict more damage with sword style weapons.'
	}) ),
	range( [2,6,14,18], (level,index) => ({
		name: 'Shower of Blows x'+(2+index),
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
	range( [4,12], (level,index) => ({
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
		apply: (when,e)=>when=='calcReduction' ? e.armor *= 1+(index+1)*0.20 : false,
		description: 'Improves the defense of any armor worn, reducing damage.'
	}) ),
]);

//
// Brawler
//

LegacyList.brawler = compose('brawler',[
	range( [1,5,9,13,17], (level,index) => ({
		name: 'Bruiser +'+((index+3)*20)+'%',
		apply: (when,e)=>when=='main' && e.source && e.item && e.item.isClub
			? e.value = ( Rules.pickDamage(e.source.level,0,e.item) * (1+((index+3)*0.20)) + (e.item.plus||0) ) * (e.source.visciousWhack||1)
			: false,
		description: 'Heavy handed bashing with club weapons.'
	}) ),
	range( [3,7,11,15,19], (level,index) => ({
		name: 'Hurler +'+((index+3)*20)+'%',
		apply: (when,e) => when=='main' && e.source && e.item && e.item.isRock
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

//
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
			if( when=='main' && e.source && e.item && e.item.isHands ) {
				let ok = handsEmpty(e);
				e.value = ok ? Rules.pickDamage(handLevel,0,e.item) * (1+((index+1)*0.20)) : Rules.pickDamage(1,0,e.item);
			}
		},
		description: 'Your hands strike like stone. Hands must be empty.'
	})),
	range( [9,13], (level,index) => ({
		name: 'Chopping Hands +'+((index+3)*20)+'%',
		singularId: 'monkHands',
		allow: handsEmpty,
		apply: (when,e) => {
			if( when=='main' && e.source && e.item && e.item.isHands ) {
				let ok = handsEmpty(e);
				e.item.damageType = ok ? DamageType.CHOP : DamageType.BASH;
				e.damageType = ok ? DamageType.CHOP : DamageType.BASH;
				e.value = ok ? Rules.pickDamage(e.source.level,0,e.item) * (1+((index+3)*0.20)) : Rules.pickDamage(1,0,e.item);
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
		apply: (when,e) => when=='calcReduction' && noChestArmor(e) ? e.armor = Rules.playerArmor(level+1) : false,
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
		apply: (when,e)=> when=='main' && e.item && e.item.isHands ? e.item.damageType = DamageType.SMITE : false,
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

//
// Archer
//

LegacyList.archer = compose( 'archer', [
	range( [1,3,5,7,9,11,13,15,17,19], (level,index) => ({
		name: 'Marksman +'+((index+1)*10)+'%',
		apply: (when,e)=>when=='main' && e.source && e.item && (e.item.isBow || e.item.isArrow)
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
		apply: (when,e)=>when=='main' && e.source && e.item && (e.item.isBow || e.item.isArrow)
			? e.quick = Math.max(e.quick||0,1)
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
		apply: (when,e)=>when=='main' && e.source && e.item && (e.item.isBow || e.item.isArrow)
			? e.quick = Math.max(e.quick||0,2)
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

//
// Ninja
//

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
		effect: { op: 'max', stat: 'catchThrown', value: 50+index*25, duration: true },
		description: 'You catch thrown objects '+(50+index*25)+'% of the time.'
	}) ),
	range( [4,9,15], (level,index) => ({
		name: 'Shot Catch '+Number.roman(index+1),
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
		description: 'Delicate sense reveal how close is "too close".'
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

//LegacyList.thief = [
//];

//
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
		effect: { op: 'set', stat: 'skillOrdnerBlast', value: [EffectShape.BLAST3,EffectShape.BLAST4,EffectShape.BLAST5][index] },
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
LegacyList.assassin = [
];
LegacyList.possessor = [
];
LegacyList.neuromancer = [
];
LegacyList.illusionist = [
];
LegacyList.enchanter = [
];
LegacyList.tamer = [
];
LegacyList.tinker = [
];
LegacyList.druid = [
];
LegacyList.cleric = [
];
LegacyList.hoplite = [
];
LegacyList.summoner = [
];
LegacyList.thermancer = [
];
LegacyList.decimage = [
];
LegacyList.leader = [
];

return {
	LegacyList: LegacyList
}

});
Module.add('dataMonsters',function() {


let PartList = Type.establish('Part',{
	onRegister: (part) => {
		part.name = part.name || part.partId;
	}
});

Type.register('Part', {
	blood: 		{
		matter: 'liquid',
		makes: ['eRechargeFast', 'eBlindness', 'eRage', 'eHealing', 'eRegeneration', 'eWater'],
		img: 'part/blood.png',
	},
	eye: 		{
		matter: 'flesh',
		makes: ['eLight', 'eDark', 'eDarkVision', 'eSeeInvisible', 'eSenseXray'],
		img: 'part/eye.png',
	},
	tongue: 	{
		matter: 'flesh',
		makes: ['eShove', 'eHesitate', 'eStartle'],
		img: 'part/tongue.png',
	},
	skin: 	{
		matter: 'leather',
		makes: [],
		img: 'part/skin.png',
	},
	brain: 		{
		matter: 'flesh',
		makes: ['eSenseTreasure', 'eBravery', 'eClearMind', 'eStalwart', 'eMentalFence','ePacify','eAlliance','eTame','eThrall'],
		img: 'part/brain.png',
	},
	bone: 		{
		matter: 'bone',
		makes: [],
		img: 'part/bone.png',
	},
	skull: 		{
		matter: 'bone',
		makes: ['eIronWill', 'eSlow'],
		img: 'part/skull.png',
	},
	tooth:		{
		matter: 'bone',
		makes: ['eAssassin', 'eBash'],
		img: 'part/tooth.png',
	},
	claw:		{
		matter: 'bone',
		makes: ['eJump2', 'eMobility'],
		img: 'part/claw.png',
	},
	horn:		{
		matter: 'bone',
		makes: ['eJump2', 'eMobility'],
		img: 'part/horn.png',
	},
	heart:		{
		matter: 'flesh',
		makes: ['eSenseLiving', 'ePossess', 'eSmite'],
		img: 'part/heart.png',
	},
	liver:		{
		matter: 'flesh',
		makes: ['eVulnerability', 'eCurePoison', 'eCureDisease'],
		img: 'part/liver.png',
	},
	gland:		{
		matter: 'flesh',
		makes: ['eStink', 'eDrain', 'eAcid', 'ePoison'],
		img: 'part/gland.png',
	},
	tentacle:	{
		matter: 'flesh',
		makes: ['eStink', 'eDrain', 'eAcid', 'ePoison'],
		img: 'part/tentacle.png',
	},
	wing:		{
		matter: 'leather',
		makes: ['eFlight', 'eHaste'],
		img: 'part/wing.png',
	},
	chitin:		{
		matter: 'chitin',
		makes: ['eStun', 'eLeech'],
		img: 'part/chitin.png',
	},
	spinneret:		{
		matter: 'chitin',
		makes: ['eSlow'],
		img: 'part/chitin.png',
	},
	icor:		{
		matter: 'liquid',
		makes: ['eTeleport', 'eImmobilize', 'eBurn', 'eFreeze', 'eRot'],
		img: 'part/icor.png',
	},
	oculus:	{
		matter: 'metal',
		makes: ['eShock'],
		img: 'part/oculus.png',
	},
	gear:	{
		matter: 'metal',
		makes: [],
		img: 'part/gear.png',
	},
	hasp:	{
		matter: 'metal',
		makes: [],
		img: 'part/hasp.png',
	},
	spring:	{
		matter: 'metal',
		makes: [],
		img: 'part/tooth.png',
	},
	oil:	{
		matter: 'metal',
		makes: [],
		img: 'part/oil.png',
	},
	leaf:	{
		matter: 'plant',
		makes: [],
		img: 'part/leaf.png',
	},
	sap:	{
		matter: 'plant',
		makes: [],
		img: 'part/sap.png',
	},
	bark:	{
		matter: 'plant',
		makes: [],
		img: 'part/bark.png',
	},
	flower:	{
		matter: 'plant',
		makes: [],
		img: 'part/flower.png',
	},
	stem:	{
		matter: 'fungus',
		makes: [],
		img: 'part/stem.png',
	},
	gill:	{
		matter: 'fungus',
		makes: [],
		img: 'part/gill.png',
	},
	slime:		{
		matter: 'liquid',
		makes: ['eInvisibility', 'eAcid'],
		img: 'part/slime.png',
	},
});

let SpeciesList = Type.establish('Species',{
});

Type.register( 'Species', {
	isAnimal: {
		parts: ['blood','eye','tongue','skin','brain','bone','skull','tooth','claw','heart','liver'],
	},
	isEarthChild: {
		parts: ['blood','eye','tongue','brain','bone','skull','tooth','heart','liver'],
	},
	isSunChild: {
		parts: ['blood','brain','bone','skull','tooth','heart'],
	},
	isLunarChild: {
		parts: ['blood','brain','bone','skull','tooth','heart','liver'],
	},
	isUndead: {
		parts: ['eye','tongue','brain','bone','skull','tooth','claw'],
	},
	isDemon: {
		parts: ['blood','eye','tongue','skin','brain','bone','skull','tooth','claw','heart','liver'],
	},
	isInsect: {
		parts: ['eye','brain','chitin','icor'],
	},
	isWinged: {
		parts: ['eye','brain','chitin','icor'],
	},
	isSpider: {
		parts: ['spinneret'],
	},
	isPlanar: {
		parts: ['eye','tongue','brain','heart','liver','gland','icor'],
	},
	isConstruct: {
		parts: ['oculus','gear','hasp','spring','oil'],
	},
	isOoze: {
		parts: ['slime'],
	},
	isPlant: {
		parts: ['*self*','leaf','sap','bark','flower'],
	},
	isMushroom: {
		parts: ['*self*','stem','gill'],
	}
});

const Control = { AI: "ai", USER: "user", TESTER: "tester", EMPTY: "empty" };



let MentalAttack = [Attitude.ENRAGED, Attitude.CONFUSED, Attitude.PANICKED, Attitude.PACIFIED].join(',');
let ConstructImmunity = [MentalAttack,DamageType.ROT,DamageType.POISON,MiscImmunity.HEALING].join(',');
let ConstructResistance = Damage.Physical;
let ConstructVulnerability = [DamageType.WATER,DamageType.SHOCK,DamageType.FREEZE,DamageType.CORRODE].join(',');

let UndeadImmunity = [DamageType.FREEZE,DamageType.ROT,DamageType.POISON,Attitude.PANICKED,Attitude.ENRAGED,Attitude.CONFUSED,Attitude.PACIFIED,'eBlindness'].join(',');
let SkeletonImmunity = [UndeadImmunity,DamageType.CUT,DamageType.STAB].join(',');
let UndeadResistance = [DamageType.CUT,DamageType.STAB].join(',');
let UndeadVulnerability = ['silver',DamageType.SMITE,DamageType.BURN].join(',');
let ShadowImmunity = [DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.BASH,DamageType.BURN,DamageType.FREEZE,DamageType.CORRODE,DamageType.POISON,DamageType.ROT].join(',');

let OozeImmunity = ['eShove','eBlindness',DamageType.CORRODE,DamageType.STAB,DamageType.BASH,DamageType.POISON,Attitude.PANICKED].join(',');
let OozeResistance = [DamageType.CUT,Attitude.ENRAGED,Attitude.CONFUSED].join(',');
let OozeVulnerability = ['ice','glass',DamageType.FREEZE].join(',');

let PlantImmunity = ['eShove','eBlindness',DamageType.WATER,DamageType.CORRODE,DamageType.STAB,DamageType.BASH,DamageType.POISON,Attitude.PANICKED,Attitude.ENRAGED,Attitude.CONFUSED].join(',');
let PlantResistance = [DamageType.CUT].join(',');
let PlantVulnerability = [DamageType.CHOP,DamageType.BURN].join(',');

let LunarVulnerabilities = ['solarium',DamageType.BURN].join(',');

let DemonImmunity = [DamageType.BURN,Attitude.PANICKED].join(',');
let DemonResistance = ['deepium',DamageType.POISON,DamageType.STAB,DamageType.ROT,'possess',Attitude.PACIFIED].join(',');
let DemonVulnerability = ['ice','solarium',DamageType.SMITE,DamageType.FREEZE,DamageType.LIGHT,Attitude.ENRAGED].join(',');
		// Distribute these weaknesses among demons, so they aren't all running about weak all the time.

function launcher(obj) {
	// Use this as a convenience to make launchers for anything to be thrown or shot
	// To make a launcher, you must specify the 
	// 	ammoType: 'isRock',
	// 	ammoSpec: 'ammo.rock',
	// 	ammoDamage: ...,		// optional. 'convey' sets the damage, and 'combine' summs it
	// 	rechargeTime: 2,
	//	hitsToKillPlayer: 6,		// optional. You can just use xDamage or leave it alone too.
	// 	name: "rock"				// needed to help describe what happened.

	return Object.assign({
		typeFilter: 'fake',
		isLauncher: true,
		mayShoot: true,
		range: Rules.RANGED_WEAPON_DEFAULT_RANGE,
		damageType: DamageType.STAB,
		name: 'natural ranged weapon'
	}, obj );
}

// Mindsets tell how you will generally act. They are tested with if( entity.mindset(mindsetName) )
// lep			- I'll remember where suddenly-vanished enemies last were, and keep going there.
// pickup		- I'll pick up objects when I step on them
// harvest		- I'll harvest any harvestables I step on
// open			- I'll open doors between me and my target
// don			- I'll don any wearables that improve my situation
// fleeWhenHurt	- I'll flee when "hurt", eg health is below 30%
// pack			- I'll get a packId with up to (me.packSize||4) like creatures. I'll flee towards my pack, might alert them, and bunch up with buddies when I'm not currently threatened
// alert		- I'll set nearby friends that I can see, and who are in my pack if I have one, to aggressive if they were WANDER or AWAIT
// fleeWhenAttacked - I'll run from any attacker

//
// LEP stands for "last enemy position", which helps the enemies know where you attacked from, even if you
// vanished from or were outside their perception.
//
let BrainMindset = {
	hero: 			'pickup,harvest,open,don,fleeWhenHurt',
	sentient: 		'alert,fleeWhenHurt,lep,pack,don',
	simpleton: 		'lep',
	demon: 			'lep,don',
	canine:   		'alert,fleeWhenHurt,lep,pack',
	animal:   		'fleeWhenHurt,lep',
	animalHunter:   'lep',
	animalHerd:   	'fleeWhenAttacked,lep,pack',
	robot:  		'lep',
	undead: 		'lep',
	undeadDumb: 	'',
	hivemind: 		'alert,pack',
}

// This is what I CAN do, not what I will tend to do (that is mindset, above)
// Mostly self-explanatory. Many of these abilities exist so that we know what
// the player can do when in the body of a possessed creature. You keep your brain abilities
// when you switch to a new body, but assume the body abilities of the new host.

let BrainAbility = {
	hero: 			'cast,gaze,open,pickup,harvest,shoot,talk,throw',
	sentient: 		'cast,gaze,open,pickup,harvest,shoot,talk,throw',
	simpleton: 		'gaze,open,pickup,harvest,shoot,talk,throw',
	demon: 			'cast,gaze,open,pickup,harvest,shoot,talk,throw',
	canine:   		'gaze,open,pickup,harvest,shoot,talk,throw',
	animal:   		'',
	animalHunter:   '',
	animalHerd: 	'',
	robot: 			'open,pickup,harvest,shoot,throw',
	undead: 		'open,pickup,shoot,throw',
	undeadDumb: 	'open,pickup,shoot,throw',
	hivemind: 		'gaze,open,pickup,harvest,shoot,talk,throw',
}

// This is what your body can physically do. So by default a quadruped can't physically talk
// yet if a dog's brain were put into a human body it would be able to speak.
let BodyAbility = {
	humanoid: 		'cast,gaze,open,pickup,harvest,shoot,talk,throw',
	quadruped: 		'gaze,open,pickup,harvest',
	multiped: 		'gaze,open,pickup,harvest',
	wingedBiped: 	'gaze,open,pickup,harvest',
	noped:    		'gaze',
	blob:    		'open,pickup,harvest',
	humanoidBot: 	'gaze,open,pickup,harvest,shoot,throw',
}

// What can this body form wear? Can it be decapitated? Wear armor?
let BodySlots = {
	humanoid: 		{ head: 1, neck: 1, arms: 1, hands: 1, fingers: 2, waist: 1, hip: 1, feet: 1, armor: 1, weapon: 1, ammo: 2, shield: 1, skill: 100 },
	quadruped: 		{ head: 1, neck: 1, waist: 1, hip: 1, feet: 2, armor: 1, skill: 100 },
	multiped: 		{ head: 1, neck: 1, waist: 1, hip: 1, fingers: 2, feet: 2, armor: 1, skill: 100 },
	wingedBiped: 	{ head: 1, neck: 1, feet: 1, skill: 100 },
	noped:  		{ head: 1, skill: 100 },
	blob:  			{ skill: 100 },
	humanoidBot: 	{ hip: 1, shield: 1, skill: 100 },
}

let PlayerImgChoices = {
	standard: { img: 'mon/human/solarPriest.png' }, 
	soldier: { img: 'mon/human/soldier.png' }, 
	ninja: { img: 'mon/human/ninja.png' }, 
	ninjaSneak: { img: 'mon/human/ninjaSneak.png' }
}

/**
Monster core is arranged as follows:
symbol	- the default symbol you can use for me in dataPlaces
power	- how strong I am, and thus what depth I appear at
brawn	- helps generate my health and damage. it is [hitsToKillMe : hitsToKillPlayer]
team		- good, evil etc indicates who I like and hate
naturalDamage (cut, stab, burn etc) using my natural weaponry
brain	- my basic abilities (cast, shoot, talk) and my mindset (do I flee when hurt, am I pack animal, etc)
body		- what is my body type? humanoid, quadruped etc. What body parts and default abilities do I have?
img		- what icon to draw for me
pronoun	- he, she, it, or a * to adapt to my gender

Some of the more common settings are
corpse			- the corpse you leave, or false if none.
attitude		- How they're generated by default. CALM, AGGRESSIVE, HUNT, AWAIT (sit there) and so on.
loot			- What you'll find on them. Uses the "loot spec" to describe the loot.
dodge			- Creature can avoid slowed weapons. 0=clumsy, 1=normal and 2=nimble
light			- How much light I keep around me by default
regenerate 		- in health per turn. So 0.01 is 1% regeneration
immune			- What damageTypes you're immune to. Often references the Immunity, Resistance and Vulnerability lists above.
resist			- as immune, except what you resist for half damage
vuln			- as immune, except what you are vulnerable to for double damage
sneakAttackMult - The multiplier when this creature successfully sneak attacks. Requires Quick.LITHE weapons.
xShove			- The percent to multiply shove distances. However, remember that size, matter, body type etc already change shove.
xShoveReason	- Why they resist or are vulnerable to shove.

speedMove 		- speed in tiles-per-second, but in reality adjusted by Rules.SPEED_STANDARD
speedAction 	- actions per second, also adjusted by Rules.SPEED_STANDARD

immortal		- will never die, and can't drop below 1 health
invilnerable	- suffers no damage or negative status effects


EVENTS
- onEnterTile(x,y)	- called when you enter a newtile, which means breaching its radius.
- onAttacked(attacker,amount,damageType) - fired when the monster gets attacked, even if damage nets to zero.
- onAttack(attacker,amount,damageType) - fires when ever the monster attacks, so you can pile on extra effects.
- onBump - fires if somebody steps into you but doesn't attack you. Like when confused.
- onTouch - fires if somebody is over/upon you.
- onHeal - fires when you get healing. return true to suppress the auto-generated message about healing.

trail			- Leaves a trail of itemType that lasts for 10||item.existenceTime seconds.


naturalWeapon
 - by default assigned as a 'fake', isNatural, quick=2, reach 1, damageType=core.naturalDamage
 - however you can override with any weapon description you like. See the Daiacrid for an ornate example.
isSYMBOL
 - Some common ones are isMindless, isConstruct, isLiving, 
 - isNamed - a real human name will be created for this entity
 - isLiving - by default set to true, unless is undead or construct in which case default is false.
Species 
The species is determined with a flag, so any number of species can exist. Some of them are:
isAnimal, isEarthChild, isSunChild, isLunarChild, isUndead, isDemon, isInsect, isPlanar, isConstruct
isOoze, isPlant, isMushroom

isTalker - A sentient who can have conversations with you.
jobId	- Tells what kind of job this thing can be assigned.
 - isLayman - just wanders about doing nothing
 - isSentry - acts as a defender of things
 - isMinor  - indicates to assign me a job with the flag isMinor
 - isMajor  - indicates to assign me a job with the flag isMajor


SENSES
senseSight - how far I can see. Defaults to Rules.MONSTER_SIGHT_DISTANCE. Even "blind" things get 1.
senseSmell		- can detect scent of the last creature that walked past, within senseSmell turns. Typically 100-400 for smelling creatures.
senseDarkVision	- distance you can see in the dark, by default Rules.MONSTER_DARK_VISION unless you isSunChild
senseInvisible	- can see invisible creatures, true or false
senseTreasure	- can detect treasure nearby, eg shows it on th drawn map whether in visual range or not
senseLiving		- can detect any living creature, eg that has isLiving set. default is false.
senseXray		- distance the creature can see through walls, and the contents of chests or barrels.
senseBlind		- when set the creature is blind
sensePerception	- shows you where others could target you, eg roughly their reach and range
senseAlert		- shows, based on your sneaking ability, how close you'd have to be to them to alert

blindFight		- you can't actually see, but you don't suffer a miss chance when fighting blind.
blindShot		- you can't actually see, but you don't suffer a miss chance when shooting blind.

imgChoices		- If you want to get fancier than just using core.img you can put some image choices here.
imgChooseFn		- pairs with imgChoices to determine what to show. Returns the image path.
imgDetermine	- picks an image based on what else is around it.

Statuses
breathStopped	- if you require breath you'll start taking damage after Rules.breathLimitToDamage
catchThrown
catchShot
stopThrown
stopShot
stopIncoming
*/

function monsterTypePreProcess(typeId,m) {
	console.assert(m.typeId==typeId);
	console.assert(m.isMonsterType);

	let brain = null;
	let naturalDamageType;
	if( m.core ) {
		m.power = m.core[0];
		console.assert( Number.isFinite(m.power) );
		m.brawn = m.core[1];
		m.team  = m.core[2];
		naturalDamageType = m.core[3];
		brain = m.core[4];
		m.body = m.core[5];
		m.img = m.core[6];
		m.pronoun = m.core[7];
		delete m.core;
	}

	console.assert( !brain || (BrainMindset[brain]!==undefined && BrainAbility[brain]!==undefined) );
	console.assert( !m.body  || (BodyAbility[m.body]!==undefined && BodySlots[m.body]!==undefined) );

	// OK, this sucks, but I set isMonsterType here AS WELL AS in fab, because the merge
	// of monsters from places requires it.
	m.brainMindset = String.combine(',',m.brainMindset,BrainMindset[brain]);
	m.brainAbility = String.combine(',',m.brainAbility,BrainAbility[brain]);
	m.bodyAbility  = String.combine(',',m.bodyAbility, BodyAbility[m.body]);
	m.bodySlots    = Object.assign( m.bodySlots || {}, BodySlots[m.body] );
	m.size         = m.size===undefined ? 1.0 : m.size;

	let blood = {
		isAnimal: 		'bloodRed',
		isEarthChild: 	'bloodGreen',
		isSunChild: 	'bloodRed',
		isLunarChild: 	'bloodBlue',
		isPlanar: 		'bloodYellow',
		isInsect: 		'bloodYellow',
		isUndead: 		'bloodWhite',
		isDemon: 		'bloodBlack',
		isOoze: 		'bloodBlack',
	};
	m.bloodId = m.bloodId || Object.findByFlag( m, blood ) || 'bloodRed';
	if( !m.isSunChild && m.senseDarkVision===undefined ) {
		m.senseDarkVision = m.senseDarkVision || Rules.MONSTER_DARK_VISION;
	}
	if( m.isLiving === undefined ) {
		m.isLiving = !m.isUndead && !m.isConstruct && !m.isIncorporeal;
	}
	if( m.isMindless ) {
		m.immune = String.arAdd(m.immune,MentalAttack+',possess');
	}
	if( !String.arIncludes(m.vuln||'',DamageType.WATER) && !String.arIncludes(m.resist||'',DamageType.WATER) ) {
		m.immune = String.arAdd(m.immune,DamageType.WATER);
	}
	if( m.isDemon && m.lightHarms === undefined ) {
		m.lightHarms = 8;
	}
	if( m.isIncorporeal && m.corpse===undefined ) {
		m.corpse = false;
	}
	let eatDefaults = {
		isIncorporeal:	['ether'],
		isInsectivore:	['plant','fungus','liquid'],
		isHerbivore:	['plant','fungus','liquid'],
		isCarnivore:	['liquid','flesh','bone'],
		isOmnivore:		['plant','fungus','liquid','flesh','bone'],
		isScavenger:	['plant','fungus','liquid','flesh','bone','leather'],
		isDog:			['liquid','flesh','bone', 'leather', 'cloth', 'chitin', 'ivory'],
		isAnimal:		['plant','fungus','liquid','flesh','bone'],
		isEarthChild:	['plant','fungus','liquid','flesh','bone'],
		isSunChild:		['plant','fungus','liquid','flesh','bone'],
		isLunarChild:	['plant','fungus','liquid','flesh','bone'],
		isPlanar:		['plant','fungus','liquid','flesh','energy'],
		isUndead: 		['flesh'],
		isDemon: 		['liquid','flesh','bone','crystal'],
		isOoze: 		['plant','fungus','liquid','flesh','bone','leather','crystal','wood','wax','cloth','chitin','paper','ivory'],
	}

	console.assert( !m.eat || Array.isArray(m.eat) );
	if( m.eat === undefined ) {
		m.eat = Object.findByFlag( m, eatDefaults ) || ['plant'];
	}

	// Most things are flesh, but there are definitely some that aren't
	let matterDefaults = {
		isSunChild:		'crystal',
		isPlanar:		'energy',
		isInsect:		'chitin',
		isDemon: 		'chitin',
		isOoze: 		'liquid',
		isConstruct:	'metal',
		isSkeleton:		'bone',
		isMushroom:		'fungus'
	}
	m.matter = m.matter || Object.findByFlag( m, matterDefaults ) || 'flesh';

	let breathIgnore = {
		isLunarChild:	true,
		isElemental: 	true,
		isConstruct: 	true,
		isIncorporeal: 	true,
		isUndead: 		true,
		isOoze: 		true,
		isPlant:		40,
	};
	if( Object.findByFlag( m, breathIgnore ) ) {
		m.breathIgnore = Object.findByFlag( m, breathIgnore );
	}

	m.speedMove   = m.speedMove!==undefined ? m.speedMove : 1.0;
	m.speedAction = m.speedAction!==undefined ? m.speedAction : 1.0;

	// There is code that assumes that all monsters have, at least, an emptyinventory.
	m.carrying = m.carrying || [];
	m.carrying = Array.isArray(m.carrying) ? m.carrying : [m.carrying];

	// Determine the creature's natural weapon and its damageType
	let damType = naturalDamageType || m.naturalWeapon.damageType || DamageType.CUT;
	m._naturalWeapon = m.naturalWeapon;
	let natWeapon = Object.assign({
		typeFilter: 'naturalWeapon',
		isNatural: true,
		isMelee: true,
		isWeapon: true,
		quick: m.quick!==undefined ? m.quick : Quick.NIMBLE, // This is important, so that bite/claw critters can hit you if you're nimble
		reach: m.reach || 1,
		damageType: damType,
	}, m.naturalWeapon );
	m.naturalWeapon = natWeapon;

	if( (m.isIncorporeal || m.isEnergy) && m.dropParts === undefined ) {
		m.dropParts = false;
	}

	// Generate all the parts of this creature as items.
	let species = Object.findByFlag( m, SpeciesList );
	let partList = m.parts || species.parts;
	partList.forEach( partId => {
		let part = PartList[partId];
		if( !part ) {
			return;
		}
		// NOTE: The rarities are not being set here, because what SHOULD
		// happen is that parts get generated only when there is a recipe 
		// that uses them.
		let inject = {
			typeId:		m.typeId+String.capitalize(partId),				// goblinHeart
			name:		(m.name||String.uncamelTypeId(m.typeId))+' '+(part.name||String.uncamelTypeId(partId)),				// goblin heart, ooze slime
			matter:		part.matter,									// matter: liquid or matter: flash
			img: 		part.img || 'item/misc/misc_rune.png',
		};
		inject[String.getIs(m.typeId)] = true;					// isGoblin: true
		inject[String.getIs(partId)] = true;					// isHeart: true or isSlime: true
		inject[species.typeId] = true;							// isDemon, isAnimal, etc.
		if( part.makes ) {
			part.makes.forEach( effectId => {
				let bitId = 'bit'+String.capitalize(effectId.slice(1));		// bitInvisibility or bitFreeze
				inject[bitId] = true;
			});
		}
		ItemTypeList.part.varieties[inject.typeId] = inject;
	});

	console.assert( m.stink===undefined || (m.stink>=0 && m.stink<=1) );
}

const monsterTypeDefaults = {
	isMonsterType: true,
	power: 0, brawn: '3:10', team: Team.EVIL, damageType: DamageType.CUT, img: "dc-mon/acid_blob.png", pronoun: 'it',
	attitude: Attitude.AGGRESSIVE,
	light: 0,
	senseBlind: false, senseXray: false, senseTreasure: false, senseLiving: false,
	invisible: false, senseInvisible: false,
	control: Control.AI,
	immune: '', resist: '', vuln: '',
	stun: false,
	personalEnemy: '',
	reach: 1,
	regenerate: 0,
	travelMode: 'walk', mayWalk: false, mayFly: false,
	type: null, typeId: null,

	//debug only
	observeDistantEvents: false
};

let MonsterTypeList = Type.establish( 'MonsterType', {
	typeIdUnique:	true,
	useSymbols:		true,
	defaults: 		monsterTypeDefaults,
	onRegister: (monsterType) => {
		monsterTypePreProcess(monsterType.typeId,monsterType);
	},
	onFinalize: (monsterType,X,checker) => {
		checker.checkLoot(monsterType);
		checker.checkResistance( monsterType.immune );
		checker.checkResistance( monsterType.resist );
		checker.checkResistance( monsterType.vuln );
	}
});

Type.register( 'MonsterType', {

// GOOD TEAM
	"player": {
		symbol: '@',
		core: [ 0, '3:10', 'good', 'cut', 'hero', 'humanoid', 'mon/human/solarPriest.png', 'he' ],
		attitude: Attitude.CALM,
		brainMindset: 'pickup,open',
		control: Control.USER,
		experience: 0,
		naturalWeapon: {
			typeFilter: 'weapon.hands',
		},
		speedAction: 1.0,
		braceBonus: 0,
		carrying: '',
		wearing: '',
		isChosenOne: true,
		isSunChild: true,
		isNamed: false,
		jumpMax: 1,
		light: 2,			// This is intentionally low, to allow dark lamps to work, but also non-zero in case the player really does run out of light sources.
		neverPick: true,
		regenerate: 0.01,
		rechargeRate: 1,
		senseSight: MaxVis,
		strictAmmo: true,
		scale: 1.1,
		imgChoices: PlayerImgChoices,
		imgChooseFn: self => {
			let i2 = self.imgChoices.standard;
			let i1 = self.imgChoices[self.legacyId];
			let i0 = self.imgChoices[self.legacyId+(self.sneak?'Sneak':'')];
			return (i0||i1||i2).img;
		},
	},
	"dog": {
		symbol: 'd',
		core: [ 0, '10:10', 'good', 'bite', 'canine', 'quadruped', 'UNUSED/spells/components/dog2.png', '*'  ],
		size: 0.5,
		attitude: Attitude.HUNT,
		dodge: Quick.NIMBLE,
		isAnimal: true,
		isDog: true,
		isPet: true,
		isNamed: true,
		jumpMax: 2,
		loot: '30% dogCollar',
		properNoun: true,
		rarity: 0.10,
		regenerate: 0.01,
		senseSmell: 200,
		senseSight: 3,
	},
	"dwarf": {
		core: [ 0, '3:10', 'good', 'bash', 'sentient', 'humanoid', 'mon/dwarf/dwarfWarrior.png', '*' ],
		name: "Fili",
		isSunChild: true,
		isDwarf: true,
		isNamed: true,
		isTalker: true,
		jobId: 'isLayman',
		light: 6,
		properNoun: true,
		brainPackAnimal: true
	},
	"mastiff": {
		core: [ 69, '10:10', 'good', 'bite', 'canine', 'quadruped', 'UNUSED/spells/components/dog2.png', '*' ],
		attitude: Attitude.HUNT,
		dodge: Quick.NIMBLE,
		isAnimal: true,
		isDog: true,
		isPet: true,
		isNamed: true,
		loot: '30% dogCollar',
		properNoun: true,
		rarity: 0.10,
		regenerate: 0.03,
		senseSmell: 200,
	},
	"human": {
		core: [ 0, '3:10', 'good', 'cut', 'sentient', 'humanoid', 'dc-mon/human.png', '*' ],
		attitude: Attitude.CALM,
		isSunChild: true,
		isNamed: true,
		light: 4,
		loot: '30% stuff.mushroomBread, 30% coin, 10% potion.eHealing',
		rarity: 0.10,
	},
	"philanthropist": {
		core: [ 0, '3:10', 'good', 'cut', 'sentient', 'humanoid', 'dc-mon/philanthropist.png', '*' ],
		attitude: Attitude.CALM,
		dodge: Quick.CLUMSY,
		isSunChild: true,
		isNamed: true,
		light: 4,
		loot: '30% stuff.mushroomBread, 50% coin, 10% potion.eHealing',
		rarity: 0.10,
		sayPrayer: 'Get in line! Come to the left window for donations!'
	},
	"refugee": {
		core: [ 0, '2:20', 'good', 'bash', 'sentient', 'humanoid', 'dc-mon/refugee.png', '*' ],
		attitude: Attitude.FEARFUL,
		isSunChild: true,
		isNamed: true,
		light: 3,
		loot: '10% bone, 5% dogCollar, 3x 10% stuff',
		rarity: 0.40,
		sayPrayer: "Oh god... What I wouldn't give for a steak."
	},
	"solarCenturion": {
		core: [ 44, '4:20', 'good', 'stab', 'sentient', 'humanoid', 'mon/solarCenturion.png', 'he'  ],
		attitude: Attitude.AGGRESIVE,
		brainPath: true,
		corpse: false,
		immune: [ConstructImmunity,DamageType.BURN].join(','),
		isMindless: true,
		isConstruct: true,
		isLiving: false,
		isPlanar: true,
		isSummoned: true,
		rarity: 0,
		reach: 2,
		resist: ConstructResistance,
		senseSight: MaxVis,
		travelMode: 'fly',
		vuln: ConstructVulnerability,
	},

// EVIL TEAM
	"avatarOfBalgur": {
		core: [ 99, '25:2', 'evil', 'burn', 'sentient', 'humanoid', 'dc-mon/hell_knight.png', 'he' ],
		size: 3.0,
		isUnique: true,
		neverPick: true,
		immune: ['eShove',DamageType.BURN,Attitude.PANICKED].join(','),
		carrying: 'spell.eBurn, spell.eRot, spell.ePoison',
		isDemon: true,
		sayPrayer: 'I shall rule this planet!',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"ambligryp": {
		core: [ 29, '4:20', 'evil', 'bash', 'animalHunter', 'multiped', 'mon/insect/ambligryp.png', 'it' ],
		attitude: Attitude.HUNT,
		gripChance: 25,
		isInsect: true,
		isAmbligryp: true,
		resist: 'poison,eSlow,stab,bite,bash,cut,burn',
		senseSight: 3,
		senseSmell: 400,
		vuln: 'freeze,corrode',
	},
	"tinnamaton": {
		core: [ 29, '4:12', 'evil', 'bash', 'robot', 'humanoidBot', 'mon/robot/tinnamaton.png', 'it' ],
		scale: 0.55,
		attitude: Attitude.AWAIT,
		tooClose: 2,
		immune: ConstructImmunity,
		isMindless: true,
		isConstruct: true,
		isLiving: false,
		isTinnamaton: true,
		resist: ConstructResistance,
		senseSight: 8,
		vuln: ConstructVulnerability,
	},
	"brassamaton": {
		core: [ 59, '6:3', 'evil', 'bash', 'robot', 'humanoidBot', 'mon/robot/brassamaton.png', 'it' ],
		size: 2.0,
		scale: 1.4,
		attitude: Attitude.AWAIT,
		tooClose: 2,
		immune: ConstructImmunity,
		isMindless: true,
		isConstruct: true,
		isLiving: false,
		isBrassamaton: true,
		resist: ConstructResistance,
		senseSight: 5,
		vuln: ConstructVulnerability,
	},
	"ghostScorpion": {
		// make it so this goes insubstantial from time to time.
		core: [ 39, '6:8', 'evil', 'stab', 'animalHunter', 'multiped', 'mon/insect/boneScorpion.png', 'it' ],
		attitude: Attitude.AWAIT,
		tooClose: 5,
		isInsect: true,
		isScorpion: true,
		loot: '70% poisonGland',
		naturalWeapon: {
			chanceEffectFires: 64,
			effect: { basis: 'ePoison', singularId: 'gsco', singularOp: 'sum' },
		},
		immune: DamageType.POISON+',eSlow',
		resist: [DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.BASH].join(','),
		vuln: DamageType.FREEZE,
	},
	"demon": {
		core: [ 49, '3:5', 'evil', 'burn', 'sentient', 'humanoid', 'player/base/draconian_red_f.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		carrying: 'ammo.dart.eSlow',
		loot: '30% coin, 50% potion.eBurn, 30% demonScale, 20% pitchfork, 30% demonEye',
		resist: DemonResistance,
		sayPrayer: 'Hail Balgur, ruler of the deep!',
		vuln: DemonVulnerability,
	},
	"daihundt": {
		core: [ 15, '3:7', 'evil', 'bite', 'canine', 'quadruped', 'dc-mon/animals/hell_hound.png', 'it' ],
		attitude: Attitude.HUNT,
		brainMindset: 'ravenous',
		dodge: Quick.NIMBLE,
		immune: ['deepium',DamageType.POISON,DamageType.ROT,Attitude.PACIFIED].join(','),
		isDemon: true,
		isDemonHound: true,
		loot: '30% demonEye',
		resist: DemonResistance,
		senseSmell: 400,
		scentReduce: 100,
		vuln: DemonVulnerability,
	},
	"daispine": {	// (stab)
		core: [  4, '3:5', 'evil', 'stab', 'demon', 'wingedBiped', 'mon/demon/daispine.png', 'it' ],
		breathIgnore: true,
		glow: 1,
		light: 2,
		immune: DemonImmunity,
		isDemon: true,
		isDaispine: true,
		carrying: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		resist: DemonResistance,
		travelMode: 'fly',
		vuln: DemonVulnerability,
	},
	"daibelade": {	// (cut)
		core: [  9, '3:5', 'evil', 'cut', 'demon', 'wingedBiped', 'mon/demon/daibelade.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		carrying: 'pitchfork',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		resist: DemonResistance,
		travelMode: 'fly',
		vuln: DemonVulnerability,
		scale: 1.4,
	},
	"daifahng": {	// (bite)
		core: [ 14, '8:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daifahng.png', 'it' ],
		dodge: Quick.CLUMSY,
		immune: DemonImmunity,
		isDemon: true,
		carrying: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daicolasp": {	// (claw)
		core: [ 19, '3:5', 'evil', 'claw', 'demon', 'wingedBiped', 'mon/demon/daicolasp.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		carrying: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daimaul": {	// (bash)
		core: [ 24, '3:5', 'evil', 'bash', 'demon', 'wingedBiped', 'mon/demon/daimaul.png', 'it' ],
		size: 2,
		glow: 1,
		light: 1,
		immune: DemonImmunity,
		isDemon: true,
		isDaimaul: true,
		carrying: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		resist: DemonResistance,
		scale: 1.2,
		vuln: DemonVulnerability,
	},
	"daiskorsh": {	// (burn)
		core: [ 29, '3:5', 'evil', 'burn', 'demon', 'wingedBiped', 'mon/demon/daiskorsh.png', 'it' ],
		immune: DemonImmunity,
		glow: 1,
		light: 7,
		isDemon: true,
		breathIgnore: true,
		carrying: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		resist: DemonResistance,
		vuln: 'ice,water',
	},
	"daileesh": {	// (leech)
		core: [ 34, '4:10', 'evil', null, 'demon', 'wingedBiped', 'mon/demon/daileesh.png', 'it' ],
		attitude: Attitude.HUNT,
		naturalWeapon: {
			_effectOnAttack: EffectTypeList.eLeech
		},
		immune: DemonImmunity,
		isDemon: true,
		isMindless: true,	// Too powerful to allow possession.
		isDaileesh: true,
		carrying: '',
		loot: '30% gem, 50% potion',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"dailectra": {	// (shock)
		core: [ 39, '3:5', 'evil', 'shock', 'demon', 'wingedBiped', 'mon/demon/dailectra.png', 'it' ],
		corpse: false,
		glow: true,
		light: 12,
		immune: DemonImmunity+','+DamageType.SHOCK,
		isDemon: true,
		isDailectra: true,
		breathIgnore: true,
		carrying: '',
		loot: '3x gem',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daiacrid": {	// (corrode)
		core: [ 44, '3:16', 'evil', null, 'demon', 'quadruped', 'mon/demon/daiacrid.png', 'it' ],
		naturalWeapon: {
			reach: 6,
			rechargeTime: 2,
			_effectOnAttack: {
				op: 'damage',
				xDamage: 1,
				isHarm: 1,
				duration: 5,
				damageType: DamageType.CORRODE,
				name: 'demon acid',
				flyingIcon: 'item/stuff/acidSlime.png',
				icon: 'gui/icons/eCorrode.png'
			}
		},
		senseSight: 8,
		tooClose: 7,
		corpse: false,
		immune: DemonImmunity+','+DamageType.CORRODE,
		isDemon: true,
		isDaiacrid: true,
		carrying: '',
		loot: '2x 70% acidSlime, 4x acidTrail',
		lootFling: 1,
		resist: DemonResistance,
		trail: 'stuff.acidTrail',
		vuln: DemonVulnerability,
	},
	"daitox": {	// (poison)
		core: [ 49, '3:20', 'evil', 'stab', 'demon', 'wingedBiped', 'mon/demon/daitox.png', 'it' ],
		isDemon: true,
		isDaitox: true,
		effectOngoing: {
			isCloud: true,
			isGas: true,
			op: 'damage',
			xDamage: 1,
			duration: 0,
			effectShape: EffectShape.BLAST5,
			damageType: DamageType.POISON,
			name: 'poison cloud',
			icon: EffectTypeList.ePoison.icon,
			iconCloud: StickerList.cloudPoison.img,
		},
		carrying: '',
		loot: '3x 30% demonEye',
		immune: Damage.Physical2+','+ConstructImmunity+',poison,suffocate',
		resist: 'water',
		vuln: 'shock',
	},
	"daikay": {	// (rot)
		core: [ 54, '3:30', 'evil', null, 'demon', 'noped', 'mon/demon/daikay.png', 'it' ],
		naturalWeapon: {
			_effectOnAttack: {
				op: 'damage',
				singularId: 'putridRot',	// Will not re-infect if already impacting...
				singularOp: 'max',
				xDamage: 1,
				isHarm: 1,
				duration: 30,
				damageType: DamageType.ROT,
				name: 'putrid rotting',
				icon: 'gui/icons/eRot.png'
			}
		},
		breathIgnore: true,
		isDemon: true,
		isDaikay: true,
		carrying: '',
		loot: '3x 30% stuff.bone',
		travelMode: 'fly',
		immune: UndeadImmunity+',rot',
		resist: DemonResistance,
		vuln: 'light,smite',
	},
	"daitraum": {	// (stun)
		core: [ 59, '3:4', 'evil', 'bash', 'demon', 'wingedBiped', 'mon/demon/daimaul.png', 'it' ],
		size: 3.0,
		isDemon: true,
		carrying: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: {
			chanceEffectFires: 15,
			effect: { basis: 'eStun', xDuration: 0.2, singularId: 'daitraum', },
		},
		scale: 1.4,
		immune: 'shock',
		resist: Damage.Physical,
		vuln: MentalAttack,
	},
	"daishulk": {	// (shove)
		core: [ 64, '3:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daishulk.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		carrying: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: {
			chanceEffectFires: 50,
			effect: EffectTypeList.eShove
		},
		resist: DemonResistance,
		vuln: ['silver',DamageType.SMITE].join(','),
	},
	"daibozle": {	// (confuse)
		core: [ 69, '3:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daibozle.png', 'it' ],
		isDemon: true,
		breathIgnore: true,
		carrying: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: {
			chanceEffectFires: 50,
			effect: { basis: 'eConfusion', singularId: 'daibozle' }
		},
		travelMode: 'fly',
		immune: ConstructImmunity,
		resist: DemonResistance,
		vuln: [DamageType.CHOP,DamageType.CORRODE,DamageType.SMITE].join(','),
	},
	"daisteria": {	// (panic)
		core: [ 74, '3:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daisteria.png', 'it' ],
		breathIgnore: true,
		immune: DemonImmunity,
		isDemon: true,
		isDaisteria: true,
		carrying: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: {
			chanceEffectFires: 50,
			effect: { basis: 'ePanic', singularId: 'daisteria' }
		},
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daiffury": {	// (enrage)
		core: [ 79, '3:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daifury.png', 'it' ],
		breathIgnore: true,
		travelMode: "fly",
		isDemon: true,
		isDaifury: true,
		carrying: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: {
			chanceEffectFires: 50,
			effect: { basis: 'eRage', singularId: 'daifury' }
		},
		immune: ConstructImmunity,
		resist: DemonResistance,
		vuln: 'burn,bash,cut',
	},
	"daiphant": {	// (slow)
		core: [ 84, '5:12', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daiphant.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		isDaiphant: true,
		dodge: Quick.CLUMSY,
		carrying: '',
		loot: '30% gem, 50% potion, 30% demonEye',
		naturalWeapon: {
			chanceEffectFires: 25,
			effect: { basis: 'eSlow', singularId: 'daiphant' }
		},
		resist: DemonResistance,
		vuln: 'light,enraged,solarium',
	},
	"dailess": {	// (blind)
		core: [ 89, '3:5', 'evil', 'bite', 'demon', 'multiped', 'mon/demon/dailess.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		isDailess: true,
		carrying: '',
		loot: '30% gem, 10% potion',
		parts: ['tentacle','tongue','eye'],
		naturalWeapon: {
			chanceEffectFires: 50,
			effect: { basis: 'eBlindness', singularId: 'dailess' }
		},
		resist: DemonResistance,
		vuln: 'light,chop',
	},
	"dairain": {	// (drain)
		core: [ 94, '3:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/dairain.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		isDairain: true,
		carrying: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: {
			chanceEffectFires: 50,
			effect: EffectTypeList.eDrain
		},
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"deepCentipede": {
		core: [ 24, '4:20', 'evil', 'stab', 'animalHunter', 'multiped', 'mon/insect/centipede.png', 'it' ],
		attitude: Attitude.HUNT,
		tooClose: 9,
		isInsect: true,
		immune: DamageType.POISON,
		loot: '40% chitin, 80% poisonGland',
		naturalWeapon: {
			chanceEffectFires: 25,
			quick: Quick.LITHE,
			effect: { basis: 'ePoison', singularId: 'deepCent', singularOp: 'sum' }
		},
		senseSight: 2,
		senseSmell: 100,
		scentReduce: 50
	},
	"deepSpider": {
		core: [ 59, '2:20', 'evil', 'stab', 'animalHunter', 'multiped', 'mon/spider.png', 'it' ],
		attitude: Attitude.AWAIT,
		tooClose: 7,
		isInsect: true,
		isSpider: true,
		loot: '30% spinneret, 70% poisonGland',
		naturalWeapon: {
			attackVerb: 'sting',
			quick: Quick.LITHE,
			chanceEffectFires: 34,
			effect: { basis: 'ePoisonForever', singularId: 'deepSpider', singularOp: 'fail' }
		},
		resist: DamageType.POISON,
		senseLiving: true,
		vuln: DamageType.BASH,
	},
	"ethermite": {
		core: [ 59, '3:12', 'evil', 'bite', 'animalHunter', 'noped', 'mon/planar/ethermite.png', '*' ],
		attitude: Attitude.HUNT,
		brainMindset: 'pack',
		dodge: Quick.NIMBLE,
		glow: true,
		invisible: true,
		isPlanar: true,
		isEthermite: true,
		parts: SpeciesList.IsInsect,
		light: 6,
		loot: '2% gem.eSeeInvisible, 10% potion.eSeeInvisible, 50% any',
		senseInvisible: true,
		sneakAttackMult: 4,
		vuln: 'glass'
	},
	"shade": {
		core: [ 4, '1.5:16', 'evil', 'rot', 'undeadDumb', 'humanoid', 'mon/undead/shade.png', '*' ],
		attitude: Attitude.HUNT,
		bloodId: 'bloodBlack',
		immune: UndeadImmunity,
		invisible: true,
		isUndead: true,
		isIncorporeal: true,
		isShade: true,
		loot: '20% gem.eSeeInvisible, 30% gem',
		senseInvisible: true,
		sneakAttackMult: 3,
		resist: Damage.Physical2,
		vuln: DamageType.SMITE
	},
	"ghoul": {
		core: [ 39, '1:2', 'evil', 'rot', 'undeadDumb', 'humanoid', 'dc-mon/undead/ghoul.png', 'it' ],
		attitude: Attitude.HUNT,
		brainMindset: 'greedy',
		dark: 2,
		dodge: Quick.NORMAL,
		greedField: 'isCorpse',
		immune: UndeadImmunity,
		isUndead: true,
		isGhoul: true,
		loot: '30% coin, 50% ring, 50% ghoulFlesh',
		senseLiving: true,
		stink: 0.5,
		resist: UndeadResistance,
		vuln: UndeadVulnerability,
		senseSmell: 200,
	},
	"goblin": {
		core: [ 1, '3:10', 'evil', 'cut', 'sentient', 'humanoid', 'mon/earth/goblin.png', '*' ],
		brainIgnoreClearShots: 70,
		brainMindset: 'greedy',
		greedField: 'isGem',
		isGoblin: true,
		isGoblinMinion: true,
		isEarthChild: true,
		carrying: '1x potion.eBurn',
		loot: '50% coin, 20% weapon.sword, 20% weapon.club, 20% any, 30% pinchOfEarth',
		sayPrayer: 'Oh mighty Thagzog...',
	},
	"goblinWar": { 
		core: [ 49, '3:8', 'evil', 'cut', 'sentient', 'humanoid', 'dc-mon/goblin.png', '*' ],
		attitude: Attitude.HUNT,
		name: 'goblin warrior',
		brainMindset: 'greedy',
		greedField: 'isGem',
		isGoblin: true,
		isWarGoblin: true,
		isEarthChild: true,
		carrying: 'weapon.axe',
		loot: '50% coin, 80% weapon.sword, 20% weapon.club, 30% pinchOfEarth',
		sayPrayer: 'Oh warrior Thagzog...'
	},
	"goblinMut": {
		core: [ 79, '3:8', 'evil', 'cut', 'sentient', 'humanoid', 'dc-mon/goblin.png', '*' ],
		name: 'goblin mutant',
		brainMindset: 'greedy',
		dodge: Quick.NIMBLE,
		greedField: 'isGem',
		isGoblin: true,
		isEarthChild: true,
		carrying: 'weapon.axe',
		loot: '50% coin, 80% weapon.mace, 30% pinchOfEarth',
		sayPrayer: 'Oh mutant Thagzog...'
	},
	"imp": {
		core: [ 39, '3:10', 'evil', 'claw', 'demon', 'humanoid', 'dc-mon/demons/imp.png', 'it' ],
		attitude: Attitude.HESITANT,
		dodge: Quick.NIMBLE,
		glow: 1,
		immune: DamageType.BURN,
		isDemon: true,
		carrying: '2x ammo.dart.eBlindness',
		loot: '30% potion.eBurn',
		senseInvisible: true,
		travelMode: "fly",
		vuln: DemonVulnerability
	},
	"kobold": {
		core: [ 14, '4:20', 'evil', 'cut', 'canine', 'humanoid', 'dc-mon/kobold.png', '*' ],
		attitude: Attitude.HESITANT,
		dodge: Quick.NIMBLE,
		carrying: '2x dart.eInert',
		isEarthChild: true,
		isKobold: true,
		loot: '50% coin, 4x 50% ammo.dart, 30% weapon.dagger, 30% dogCollar',
		senseSmell: 200,
	},
	"ogreKid": { 
		core: [ 39, '6:8', 'evil', 'bash', 'simpleton', 'humanoid', 'dc-mon/ogre.png', '*' ],
		name: "ogre child",
		carrying: 'ammo.rock',
		isEarthChild: true,
		loot: '50% weapon.club',
		resist: DamageType.CUT,
		speedMove: 0.75,
		stink: 0.6,
	},
	"ogre": {
		core: [ 69, '5:5', 'evil', 'bash', 'simpleton', 'humanoid', 'dc-mon/ogre.png', '*' ],
		size: 2,
		carrying: launcher({
			ammoType: 'isRock',
			ammoSpec: 'ammo.rock',
			ammoDamage: 'convey',
			rechargeTime: 2,
			hitsToKillPlayer: 6,
			name: "rock"
		}),
		dodge: Quick.CLUMSY,
		isEarthChild: true,
		isOgre: true,
		loot: '90% coin, 90% coin, 90% coin, 50% weapon.club',
		resist: [DamageType.CUT,DamageType.STAB].join(','),
		speedMove: 0.5,
		speedAction: 0.5,
		stink: 0.8,
	},
	"redOoze": {
		core: [ 19, '3:3', 'evil', 'corrode', 'animalHunter', 'blob', 'dc-mon/jelly.png', 'it' ],
		name: "red ooze",
		attitude: Attitude.HUNT,
		brainMindset: 'ravenous',
		corpse: false,
		dodge: Quick.CLUMSY,
		eatenFoodToInventory: true,
		glow: 4,
		growLimit: 3.0,
		immune: OozeImmunity,
		isOoze: true,
		loot: '90% potion.eAcid, 40% redOozeSlime',
		regenerate: 0.05,
		resist: OozeResistance,
		scale: 0.50,
		senseSight: 1,
		senseSmell: 200,
		speedMove: 0.75,
		vuln: OozeVulnerability,
	},
	"redFiddler": {
		core: [ 29, '4:7', 'evil', null, 'animalHunter', 'multiped', 'mon/insect/redFiddler.png', 'it' ],
		name: "red fiddler",
		naturalWeapon: {
			reach: 6,
			_effectOnAttack: {
				op: 'damage',
				xDamage: 0.2,
				isHarm: 1,
				duration: 3,
				singularId: 'redFiddlerGel',
				damageType: DamageType.BURN,
				name: 'fiddler fire gel',
				flyingIcon: 'effect/fire.png',
				icon: 'gui/icons/eBurn.png'
			}
		},
		glow: 2,
		immune: DamageType.BURN,
		isInsect: true,
		isFiddler: true,
		isRedFiddler: true,
		loot: '2x 30% gem',
		travelMode: "walk",
		vuln: 'glass'
	},
	"blueFiddler": {
		core: [ 39, '4:7', 'evil', null, 'animalHunter', 'multiped', 'mon/insect/blueFiddler.png', 'it' ],
		name: "blue fiddler",
		naturalWeapon: {
			reach: 5,
			_effectOnAttack: {
				op: 'damage',
				xDamage: 1.5,
				isHarm: 1,
				duration: 0,
				damageType: DamageType.FREEZE,
				name: 'blue fiddler ice',
				icon: 'gui/icons/eFreeze.png'
			}
		},
		reach: 5,
		glow: 2,
		resist: DamageType.FREEZE,
		isInsect: true,
		isFiddler: true,
		isBlueFiddler: true,
		loot: '2x 30% gem',
		travelMode: "walk",
		vuln: 'glass'
	},
	"greenFiddler": {
		core: [ 49, '4:7', 'evil', null, 'animalHunter', 'multiped', 'mon/insect/greenFiddler.png', 'it' ],
		name: "green fiddler",
		naturalWeapon: {
			reach: 6,
			rechargeTime: 3,
			_effectOnAttack: {
				op: 'damage',
				xDamage: 0.3,
				isHarm: 1,
				duration: 8,
				singularId: 'greenFiddlerAcid',
				damageType: DamageType.CORRODE,
				name: 'sticky green fiddler acid',
				icon: 'gui/icons/eCorrode.png'
			}
		},
		glow: 2,
		resist: DamageType.CORRODE,
		isInsect: true,
		isFiddler: true,
		isGreenFiddler: true,
		loot: '2x 30% gem',
		travelMode: "walk",
		vuln: 'glass'
	},
	"blueScarab": {
		core: [ 59, '2:30', 'evil', 'shock', 'animalHunter', 'multiped', 'mon/insect/blueScarab.png', 'it' ],
		name: "blue scarab",
		dodge: Quick.NIMBLE,
		glow: 3,
		immune: DamageType.SHOCK,
		isPlanar: true,
		isInsect: true,
		isScarab: true,
		isBlueScarab: true,
		loot: '30% gem',
		travelMode: "fly",
		vuln: 'glass,'+DamageType.BURN
	},
	"redScarab": {
		core: [ 19, '2:30', 'evil', 'burn', 'animalHunter', 'multiped', 'mon/insect/redScarab.png', 'it' ],
		name: "red scarab",
		dodge: Quick.NIMBLE,
		glow: 3,
		immune: DamageType.BURN,
		isPlanar: true,
		isInsect: true,
		isScarab: true,
		isRedScarab: true,
		loot: '30% gem',
		travelMode: "fly",
		vuln: 'glass,'+DamageType.FREEZE
	},
	"arborian": {
		core: [ 69, '6:5', 'evil', 'bash', 'simpleton', 'humanoid', 'mon/plant/arborian.png', 'it' ],
		dodge: Quick.CLUMSY,
		glow: 3,
		immune: PlantImmunity,
		isPlant: true,
		loot: '30% gem, 70% seed',
		resist: PlantResistance,
		vuln: PlantVulnerability
	},
	"shadow": {
		core: [ 79, '1:12', 'evil', 'rot', 'undead', 'humanoid', 'dc-mon/undead/shadow.png', 'it' ],
		dark: 12,
		immune: ShadowImmunity,
		isUndead: true,
		isIncorporeal: true,
		loot: '50% darkEssence, 20% potion.eBlindness',
		speedMove: 0.75,
		vuln: ['silver',DamageType.SMITE].join(',')
	},
	"crawler": {
		core: [ 1, '2:15', 'evil', 'bite', 'undeadDumb', 'humanoid', 'mon/undead/crawler.png', 'it' ],
		attitude: Attitude.HUNT,
		immune: SkeletonImmunity,
		isUndead: true,
		isSkeleton: true,
		speedMove: 0.5,
		loot: '50% dagger, 50% helm',
		vuln: 'silver'
	},
	"skeleton": {
		core: [ 19, '2:10', 'evil', 'claw', 'undeadDumb', 'humanoid', 'dc-mon/undead/skeletons/skeleton_humanoid_small.png', 'it' ],
		attitude: Attitude.HUNT,
		immune: SkeletonImmunity,
		isUndead: true,
		isSkeleton: true,
		loot: '50% bone, 50% skull',
		vuln: 'silver'+','+DamageType.SMITE
	},
	"skeletonArcher": {
		core: [ 29, '2:10', 'evil', 'claw', 'undeadDumb', 'humanoid', 'dc-mon/undead/skeletonArcher.png', 'it' ],
		attitude: Attitude.HUNT,
		immune: SkeletonImmunity,
		carrying: [{ typeFilter:'weapon.bow', rechargeTime: 4, unreal: 1, name: 'unholy bow', isFake: true }],
		isUndead: true,
		isSkeleton: true,
		loot: '50% bone, 50% skull',
		vuln: 'silver'+','+DamageType.SMITE
	},
	"skeletonLg": {
		core: [ 59, '2:8', 'evil', 'claw', 'undeadDumb', 'humanoid', 'dc-mon/undead/skeletons/skeleton_humanoid_large.png', 'it' ],
		size: 2.0,
		name: 'ogre skeleton',
		attitude: Attitude.HUNT,
		immune: SkeletonImmunity,
		carrying: '50% spell.eRot',
		isUndead: true,
		isSkeleton: true,
		loot: '50% bone, 50% skull',
		vuln: 'silver'+','+DamageType.SMITE
	},
	"soldierAnt": {
		core: [ 1, '2:12', 'evil', 'bite', 'hivemind', 'multiped', 'mon/insect/giantAnt.png', 'it' ],
		name: "soldier ant",
		brainMindset: 'greedy',
		greedField: 'isAntFood',
		loot: '10% potion, 10% antGrubMush',
		isInsect: true,
		isSmall: true,
		senseSmell: 200,
		speedMove: 1.5,
		vuln: 'glass'+','+DamageType.FREEZE,
	},
	"spinyFrog": {
		core: [ 39, '3:10', 'evil', 'stab', 'animal', 'quadruped', 'dc-mon/animals/spiny_frog.png', 'it' ],
		name: "spiny frog",
		attitude: Attitude.WANDER,
		tooClose: 1,
		immune: [DamageType.POISON,'mud'].join(','),
		isAnimal: true,
		isSpinyFrog: 1,
		loot: '50% frogSpine',
		stink: 0.8,
	},
	"bear": {
		core: [ 9, '6:7', 'evil', 'claw', 'animal', 'quadruped', 'mon/animal/bear.png', 'it' ],
		size: 2.0,
		name: "bear",
		attitude: Attitude.WANDER,
		tooClose: 3,
		isAnimal: true,
		isBear: true,
		loot: '50% lumpOfMeat',
		senseSmell: 200
	},
	"troll": {
		core: [ 49, '5:4', 'evil', 'claw', 'animalHunter', 'humanoid', 'mon/troll.png', '*' ],
		size: 2.0,
		brainMindset: 'ravenous',
		loot: '50% trollHide, 10% coin, 20% trollBlood',
		isEarthChild: true,
		isTroll: true,
		regenerate: 0.10,
		scale: 1.4,
		yAnchor: 0.6,
		senseSight: 3,
		stink: 0.4,
		vuln: DamageType.BURN
	},
	"viper": {
		core: [ 44, '3:16', 'evil', 'bite', 'animalHunter', 'noped', 'dc-mon/animals/viper.png', 'it' ],
		attitude: Attitude.HESITANT,
		dodge: Quick.LITHE,
		isAnimal: true,
		loot: '40% viperVenom',
		senseSmell: 20,
		speedMove: 2.0,
	},

// LUNAR
	"lunarMoth": {
		core: [ 4, '2:20', 'lunar', 'freeze', 'animalHunter', 'noped', 'dc-mon/animals/butterfly.png', '*' ],
		name: "lunar moth",
		immune: DamageType.FREEZE,
		carrying: '',
		isLunarChild: true,
		loot: '10% gem, 40% lunarEssence',
		rarity: 1.0,
		vuln: LunarVulnerabilities
	},
	"lunarOne": {
		core: [ 12, '3:10', 'lunar', 'freeze', 'sentient', 'humanoid', 'dc-mon/deep_elf_demonologist.png', '*' ],
		name: "lunar one",
		immune: DamageType.FREEZE,
		carrying: '3x 50% potion.eFreeze',
		isLunarChild: true,
		isLunarOne: true,
		loot: '2x 50% coin, 40% lunarEssence',
		rarity: 1.0,
		vuln: LunarVulnerabilities
	},
	"lunarReaper": {
		core: [ 9, '3:10', 'lunar', 'freeze', 'sentient' ,'humanoid', 'dc-mon/deep_elf_high_priest.png', '*' ],
		name: "lunar reaper",
		immune: DamageType.FREEZE,
		isLunarChild: true,
		loot: '2x 50% coin, 40% lunarEssence',
		rarity: 1.0,
		travelType: 'fly',
		vuln: LunarVulnerabilities,
		carrying: { typeFilter: 'spell.eFreeze', rechargeTime: 1, hitsToKillPlayer: 3}
	},

// NEUTRAL TEAM
	"bat": {
		core: [ 1, '2:20', 'neutral', 'bite', 'animal', 'wingedBiped', 'mon/animal/giantBat.png', 'it' ],
		attitude: Attitude.WANDER,
		dodge: Quick.LITHE,
		isAnimal: true,
		isBat: true,
		isWinged: true,
		loot: '',
		parts: ['wing','tongue','claw'],
		brainPackAnimal: true,
		senseInvisible: true,
		senseLiving: true,
		travelMode: "fly"
	},
	"giantSnail": {
		core: [ 59, '10:100', 'neutral', 'rot', 'animal', 'noped', 'mon/snail.png', 'it' ],
		imgChoices: { moving: { img: 'mon/snail.png' }, hiding: { img: 'mon/snailInShell.png' } },
		imgChooseFn: self => self.imgChoices[self.inShell?'hiding':'moving'].img,
		attitude: Attitude.HUNT,
		brainMindset: 'fleeWhenAttacked',
		immuneInShell: [DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.BASH,DamageType.POISON,DamageType.BURN,DamageType.FREEZE].join(','),
		isAnimal: true,
		isGiant: true,
		isSnail: true,
		parts: ['shell'],
		tooClose: 1,
		loot: '50% snailSlime',
		scentReduce: -1,	// Makes it always override any scent
		speedMove: 0.25,
		speedAction: 0.5,
		trail: 'stuff.snailTrail',
		resistInShell: [DamageType.SHOCK,DamageType.SMITE,DamageType.ROT].join(',')
	},
	"sheep": {
		core: [ 1, '1:20', 'neutral', 'bite', 'animalHerd', 'quadruped', 'dc-mon/animals/sheep.png', 'it' ],
		attitude: Attitude.FEARFUL,
		isAnimal: true,
		isLivestock: true,
		isSheep: true,
		loot: '1x lumpOfMeat, 3x 50% wool',
	}
});


MonsterTypeList.spinyFrog.onAttacked = function(attacker,amount,damageType) {
	if( !attacker || attacker.command == Command.THROW || this.getDistance(attacker.x,attacker.y) > 1 ) {
		return;
	}

	if( attacker.isImmune('frogSpine') ) {
		tell(mSubject,attacker,' ',mVerb,'is',' protected from the ',mObject|mPossessive,this,' spines.');
		return;
	}
/*
	let damage = 10;
	attacker.ta..keDamagePassive( this, null, damage, DamageType.POISON, function(attacker,victim,amount,damageType) {
		if( amount<=0 ) {
			tell(mSubject,victim,' ',mVerb,'ignore',' ',mObject|mPossessive,attacker,' spines.');
		}
		else {
			tell(mSubject,victim,' ',mVerb,'is',' stabbed by ',mObject|mPossessive,attacker,' spines.');			
		}
		return true;
	}, true);
*/
}

MonsterTypeList.bat.onAttacked = function(attacker,amount,damageType) {
	if( !attacker ) return;
	let f = this.findAliveOthers().includeMe().filter( e => e.typeId==this.typeId );
	if( f.count ) {
		let numAlerted = 0;
		f.forEach( e => {
			if( e.attitude == Attitude.HESITANT || e.attitude == Attitude.WANDER || e.attacker == Attitude.AWAIT ) {
				e.changeAttitude( Attitude.AGGRESSIVE );
			}
			let attackerTeam = (attacker.teamApparent || attacker.team);
			e.team = (attackerTeam == Team.EVIL || attackerTeam == Team.NEUTRAL) ? Team.GOOD : Team.EVIL;
			numAlerted++;
		});
		if( this.isAlive() && numAlerted ) {
			tell(mSubject,this,' sonically ',mVerb,'alert',' ',mSubject|mPronoun|mPossessive,this,' friend'+(f.count>2?'s':''),' to attack team '+attacker.team+'!');
		}
	}
}

MonsterTypeList.ambligryp.onAttack = function(target) {
	let isGripping = DeedManager.findFirst( deed => deed.source && deed.source.id == this.id && deed.stat == 'immobile' );
	if( !isGripping && Random.Pseudo.chance100(this.gripChance) ) {
		let effect = Object.assign( {}, EffectTypeList.eImmobilize, { name: 'the ambligryp\'s pincer grip' } );
		effectApply( effect, target, this, null, 'onAttack' );
	}
}

MonsterTypeList.ambligryp.onEnterTile = function(x,y) {
	// Remove my grip on any victim.
	DeedManager.end( deed => {
		return deed.source && deed.source.id == this.id && deed.stat == 'immobile';
	});
}


MonsterTypeList.blueScarab.onAttack = function(target) {
	let effect = Object.assign({},EffectTypeList.eVulnerability,{value: DamageType.FREEZE});
	effectApply(effect,target,this,null,'onAttack');
}

MonsterTypeList.redScarab.onAttack = function(target) {
	let effect = Object.assign({},EffectTypeList.eVulnerability,{value: DamageType.BURN});
	effectApply(effect,target,this,null,'onAttack');
}

MonsterTypeList.redOoze.rescale = function() {
	let healthScale = ((Math.max(this.health,this.healthMax) / this.healthMax) - 1) / (this.growLimit-1);
	this.scale = 0.50 + 1.00*healthScale;	// should make the ooze grow when health is beyond max.
	this.spriteSetMember('scale',this.scale);
	console.log( "Scale is now "+this.scale );
}

MonsterTypeList.redOoze.onAttacked = function() {
	this.rescale.call(this);
}

MonsterTypeList.arborian.onAttacked = function(attacker,amount,damageType) {
	if( damageType == DamageType.WATER ) {
		effectApply(
			{ op: 'heal', value: Math.max(1,amount/2), damageType: damageType },
			this,
			attacker
		);
	}
}

MonsterTypeList.redOoze.onEnterTile = function(x,y) {
	let f = this.map.findItemAt(x,y).filter( i=>i.isCorpse );
	if( f.first && this.health < this.healthMax*this.growLimit ) {
		tell(mSubject,this,' ',mVerb,'absorb',' ',mObject,f.first,' and ',mVerb,'regain',' strength!');
		let heal = this.healthMax * 0.25;
		this.takeHealing(this,heal,DamageType.CORRODE,true,true);
		this.rescale.call(this)

		let self = this;
		let anim = new Anim({
			name:		'oozeEat',
			follow: 	this,
			img: 		this.img,
			duration: 	0.5,
			onInit: 		a => { a.takePuppet(this); },
			onSpriteTick: 	s => { s.sScale( s.sSine(this.scale, this.scale*0.4, 2*(1-s.sPctDone) ) ); }
		});

		f.first.destroy();
	}
}

MonsterTypeList.daitox.onTickRound = function() {
	let tile = this.map.getTileEntity(this.x,this.y);
	effectApply(this.effectOngoing,tile,this,null,'tick');
}

MonsterTypeList.giantSnail.onAttacked = function(attacker,amount,damageType) {
	if( amount > 0 ) {
		let shellEffect = {
			op: 'set',
			stat: 'attitude',
			value: Attitude.BUSY,
			duration: 10,
			description: 'in its shell',
			onStart: (deed) => {
				this.inShell = true;
				this.immune = this.immuneInShell;
				this.resist = this.resistInShell;
				this.spriteDirty = true;
				guiMessage('dirty',this,'map');
			},
			onEnd: (deed) => {
				this.inShell = false;
				this.immune = '';
				this.resist = '';
				this.spriteDirty = true;
				guiMessage('dirty',this,'map');
			}
		};
		effectApply(shellEffect,this,this,null,'attacked');
	}
};


return {
	Control: Control,
	PartList: PartList,
	SpeciesList: SpeciesList,
	MonsterTypeList: MonsterTypeList,
}

});

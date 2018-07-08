// Monster Events
// onAttacked - fired when the monster gets attacked, even if damage nets to zero.
// onAttack - fires when ever the monster attacks, so you can pile on extra effects.
// onBump - fires if somebody steps into you but doesn't attack you. Like when confused.
// onTouch - fires if somebody is over/upon you.
// onHeal - fires when you get healing. return true to suppress the auto-generated message about healing.

const Control = { AI: "ai", USER: "user", EMPTY: "empty" };

const MonsterTypeDefaults = {
	level: 0, power: '3:10', team: Team.EVIL, damageType: DamageType.CUT, img: "dc-mon/acid_blob.png", pronoun: 'it',
	attitude: Attitude.AGGRESSIVE,
	light: 0,
	senseBlind: false, senseXray: false, senseTreasure: false, senseLiving: false,
	invisible: false, senseInvisible: false,
	control: Control.AI,
	immune: '', resist: '', vuln: '',
	loseTurn: false,
	personalEnemy: '',
	reach: 1,
	regenerate: 0,
	speed: 1,
	travelMode: 'walk', mayWalk: false, mayFly: false,
	type: null, typeId: null,

	//debug only
	observeDistantEvents: false
};


let UndeadImmunity = [DamageType.FREEZE,DamageType.ROT,DamageType.POISON,Attitude.PANICKED,Attitude.ENRAGED,Attitude.CONFUSED,'eBlindness'].join(',');
let SkeletonImmunity = [UndeadImmunity,DamageType.CUT,DamageType.STAB].join(',');
let UndeadResistance = [DamageType.CUT,DamageType.STAB].join(',');
let UndeadVulnerability = ['silver',DamageType.SMITE,DamageType.BURN].join(',');
let ShadowImmunity = [DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.BASH,DamageType.BURN,DamageType.FREEZE,DamageType.CORRODE,DamageType.POISON,DamageType.ROT].join(',');

let OozeImmunity = ['eShove','eBlindness',DamageType.CORRODE,DamageType.STAB,DamageType.BASH,DamageType.POISON,Attitude.PANICKED].join(',');
let OozeResistance = [DamageType.CUT,Attitude.ENRAGED,Attitude.CONFUSED].join(',');
let OozeVulnerability = ['ice','glass',DamageType.FREEZE].join(',');

let LunarVulnerabilities = ['solarium',DamageType.BURN].join(',');

let DemonImmunity = [DamageType.BURN].join(',');
let DemonResistance = ['deepium',DamageType.POISON,DamageType.STAB].join(',');
let DemonVulnerability = ['ice','solarium',DamageType.SMITE,DamageType.FREEZE].join(',');


function launcher(obj) {
	// Use this as a convenience to make launchers for anything to be thrown or shot
	return Object.assign({
		typeFilter: 'weapon.launcher.eInert',
		isFake: true,
		mayShoot: true,
		damageType: DamageType.STAB,
		name: 'natural ranged weapon'
	}, obj );
}

let BrainMindset = {
	sentient: 		'alert,fleeWhenHurt,lep,pack',
	simpleton: 		'lep',
	demon: 			'lep',
	canine:   		'alert,fleeWhenHurt,lep,pack',
	animal:   		'fleeWhenHurt,lep',
	animalHunter:   'lep',
	animalHerd:   	'fleeWhenAttacked,lep,pack',
	undead: 		'lep',
	undeadDumb: 	'',
	hivemind: 		'alert,pack',
}

let BrainAbility = {
	sentient: 		'cast,gaze,open,pickup,shoot,talk,throw',
	simpleton: 		'gaze,open,pickup,shoot,talk,throw',
	demon: 			'cast,gaze,open,pickup,shoot,talk,throw',
	canine:   		'gaze,open,pickup,shoot,talk,throw',
	animal:   		'',
	animalHunter:   '',
	animalHerd: 	'',
	undead: 		'open,pickup,shoot,throw',
	undeadDumb: 	'open,pickup,shoot,throw',
	hivemind: 		'gaze,open,pickup,shoot,talk,throw',
}

let BodyAbility = {
	humanoid: 		'cast,gaze,open,pickup,shoot,talk,throw',
	quadruped: 		'gaze,open,pickup',
	multiped: 		'gaze,open,pickup',
	wingedBiped: 	'gaze,open,pickup',
	noped:    		'gaze',
	blob:    		'open,pickup',
}

let BodySlots = {
	humanoid: 		{ head: 1, neck: 1, arms: 1, hands: 1, fingers: 2, waist: 1, hip: 1, feet: 1, armor: 1, weapon: 1, ammo: 1, shield: 1 },
	quadruped: 		{ head: 1, neck: 1, waist: 1, hip: 1, feet: 2, armor: 1 },
	multiped: 		{ head: 1, neck: 1, waist: 1, hip: 1, fingers: 2, feet: 2, armor: 1 },
	wingedBiped: 	{ head: 1, neck: 1, feet: 1 },
	noped:  		{ head: 1 },
	blob:  			{ },
}


const MonsterTypeList = {

// GOOD TEAM
	"player": {
		core: [ '@', 0, '3:10', 'good', 'cut', 'sentient', 'humanoid', 'player.png', 'he' ],
		attitude: Attitude.CALM,
		brainMindset: 'pickup',
		control: Control.USER,
		experience: 0,
		inventoryLoot: '',
		inventoryWear: '',
		isChosenOne: true,
		isSunChild: true,
		isNamed: false,
		jumpMax: 1,
		light: 2,			// This is intentionally low, to allow dark lamps to work, but also non-zero in case the player really does run out of light sources.
		neverPick: true,
		regenerate: 0.01,
		rechargeRate: 1,
		senseSight: MaxVis,
		strictAmmo: true
	},
	"dog": {
		core: [ 'd', 0, '10:10', 'good', 'bite', 'canine', 'quadruped', 'UNUSED/spells/components/dog2.png', '*'  ],
		attitude: Attitude.HUNT,
		dodge: 1,
		isAnimal: true,
		isDog: true,
		isPet: true,
		isNamed: true,
		jumpMax: 2,
		loot: '30% dogCollar',
		properNoun: true,
		rarity: 0.10,
		regenerate: 0.03,
		senseSmell: 200,
		senseSight: 3,
	},
	"dwarf": {
		core: [ SYM, 0, '3:10', 'good', 'bash', 'sentient', 'humanoid', 'dc-mon/dwarf.png', '*' ],
		name: "Fili",
		isSunChild: true,
		isDwarf: true,
		isNamed: true,
		jobId: 'isLayman',
		light: 6,
		properNoun: true,
		brainPackAnimal: true
	},
	"mastiff": {
		core: [ SYM, 69, '10:10', 'good', 'bite', 'canine', 'quadruped', 'UNUSED/spells/components/dog2.png', '*' ],
		attitude: Attitude.HUNT,
		dodge: 1,
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
		core: [ SYM, 0, '3:10', 'good', 'cut', 'sentient', 'humanoid', 'dc-mon/human.png', '*' ],
		attitude: Attitude.CALM,
		isSunChild: true,
		isNamed: true,
		light: 4,
		loot: '30% mushroomBread, 30% coin, 10% potion.eHealing',
		rarity: 0.10,
	},
	"philanthropist": {
		core: [ SYM, 0, '3:10', 'good', 'cut', 'sentient', 'humanoid', 'dc-mon/philanthropist.png', '*' ],
		attitude: Attitude.CALM,
		isSunChild: true,
		isNamed: true,
		light: 4,
		loot: '30% mushroomBread, 50% coin, 10% potion.eHealing',
		rarity: 0.10,
		sayPrayer: 'Get in line! Come to the left window for donations!'
	},
	"refugee": {
		core: [ SYM, 0, '2:20', 'good', 'bash', 'sentient', 'humanoid', 'dc-mon/refugee.png', '*' ],
		attitude: Attitude.FEARFUL,
		isSunChild: true,
		isNamed: true,
		light: 3,
		loot: '10% bone, 5% dogCollar, 3x 10% stuff',
		rarity: 0.40,
		sayPrayer: "Oh god... What I wouldn't give for a steak."
	},

// EVIL TEAM
	"avatarOfBalgur": {
		core: [ SYM, 99, '25:2', 'evil', 'burn', 'sentient', 'humanoid', 'dc-mon/hell_knight.png', 'he' ],
		isUnique: true,
		neverPick: true,
		immune: ['eShove',DamageType.BURN,Attitude.PANICKED].join(','),
		inventoryLoot: 'spell.eFire, spell.eRot, spell.ePoison',
		isDemon: true,
		isLarge: true,
		sayPrayer: 'I shall rule this planet!',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"ambligryp": {
		// make it so this goes insubstantial from time to time.
		core: [ SYM, 29, '4:20', 'evil', 'bash', 'animalHunter', 'multiped', 'mon/ambligryp48.png', 'it' ],
		attitude: Attitude.HUNT,
		gripChance: 25,
		isInsect: true,
		isAmbligryp: true,
		resist: 'poison,eSlow,stab,bite,bash,cut,burn',
		senseSight: 3,
		senseSmell: 400,
		vuln: 'freeze,corrode',
	},
	"ghostScorpion": {
		// make it so this goes insubstantial from time to time.
		core: [ SYM, 39, '6:8', 'evil', 'stab', 'animalHunter', 'multiped', 'mon/boneScorpion48.png', 'it' ],
		attitude: Attitude.AWAIT,
		tooClose: 5,
		isInsect: true,
		isScorpion: true,
		loot: '70% poisonGland',
		naturalWeapon: { chanceOfEffect: 64, effect: EffectTypeList.ePoison },
		immune: DamageType.POISON+',eSlow',
		reach: 3,
		resist: [DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.BASH].join(','),
		vuln: DamageType.FREEZE,
	},
	"demon": {
		core: [ SYM, 49, '3:5', 'evil', 'burn', 'sentient', 'humanoid', 'player/base/draconian_red_f.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: 'ammo.dart.eFire',
		loot: '30% coin, 50% potion.eFire, 30% demonScale, 20% pitchfork, 30% demonEye',
		resist: DemonResistance,
		sayPrayer: 'Hail Balgur, ruler of the deep!',
		vuln: DemonVulnerability,
	},
	"daihundt": {
		core: [ SYM, 15, '3:7', 'evil', 'bite', 'canine', 'quadruped', 'dc-mon/animals/hell_hound.png', 'it' ],
		attitude: Attitude.HUNT,
		brainMindset: 'ravenous',
		dodge: 1,
		immune: DemonImmunity,
		isDemon: true,
		isDemonHound: true,
		loot: '30% demonEye',
		resist: DemonResistance,
		senseSmell: 400,
		scentReduce: 100,
		vuln: DemonVulnerability,
	},
	"daibelade": {	// (cut)
		core: [ SYM,  4, '3:5', 'evil', 'cut', 'demon', 'wingedBiped', 'mon/demon/daibelade48.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daispine": {	// (stab)
		core: [ SYM,  9, '3:5', 'evil', 'stab', 'demon', 'wingedBiped', 'mon/demon/daispine48.png', 'it' ],
		glow: 1,
		light: 2,
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daifahng": {	// (bite)
		core: [ SYM, 14, '3:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daifahng48.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daicolasp": {	// (claw)
		core: [ SYM, 19, '3:5', 'evil', 'claw', 'demon', 'wingedBiped', 'mon/demon/daicolasp48.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daimaul": {	// (bash)
		core: [ SYM, 24, '3:5', 'evil', 'bash', 'demon', 'wingedBiped', 'mon/demon/daimaul48.png', 'it' ],
		glow: 1,
		light: 1,
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		resist: DemonResistance,
		scale: 1.3,
		vuln: DemonVulnerability,
	},
	"daiskorsh": {	// (burn)
		core: [ SYM, 29, '3:5', 'evil', 'burn', 'demon', 'wingedBiped', 'mon/demon/daiskorsh48.png', 'it' ],
		immune: DemonImmunity,
		glow: 1,
		light: 7,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daileesh": {	// (leech)
		core: [ SYM, 34, '4:10', 'evil', null, 'demon', 'wingedBiped', 'mon/demon/daileesh96.png', 'it' ],
		attitude: Attitude.HUNT,
		naturalWeapon: { effectOnAttack: ETL.eLeech },
		immune: DemonImmunity,
		isDemon: true,
		isMindless: true,	// Too powerful to allow possession.
		isDaileesh: true,
		lootInventory: '',
		loot: '30% gem, 50% potion',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"dailectra": {	// (shock)
		core: [ SYM, 39, '3:5', 'evil', 'shock', 'demon', 'wingedBiped', 'mon/demon/dailectra96.png', 'it' ],
		corpse: false,
		glow: true,
		light: 12,
		immune: DemonImmunity,
		isDemon: true,
		isDailectra: true,
		lootInventory: '',
		loot: '3x gem',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daiacrid": {	// (corrode)
		core: [ SYM, 44, '3:16', 'evil', null, 'demon', 'quadruped', 'mon/demon/daiacrid96.png', 'it' ],
		naturalWeapon: {
			reach: 6,
			rechargeTime: 2,
			effectOnAttack: { isDmg: 1, op: 'damage', xDamage: 1, isHarm: 1, duration: 5, damageType: DamageType.CORRODE, name: 'demon acid', flyingIcon: 'item/misc/acidSlime96.png', icon: 'gui/icons/eCorrode.png' }
		},
		senseSight: 8,
		tooClose: 7,
		corpse: false,
		immune: DemonImmunity+','+DamageType.CORRODE,
		isDemon: true,
		isDaiacrid: true,
		lootInventory: '',
		loot: '3x 70% acidSlime, 8x acidTrail',
		lootFling: 1,
		resist: DemonResistance,
		trail: 'stuff.acidTrail',
		vuln: DemonVulnerability,
	},
	"daitoxue": {	// (poison)
		core: [ SYM, 49, '3:5', 'evil', 'poison', 'demon', 'wingedBiped', 'mon/demon/daispine48.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: { chanceOfEffect: 50, effect: EffectTypeList.ePoison },
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daikaee": {	// (rot)
		core: [ SYM, 54, '3:5', 'evil', 'rot', 'demon', 'wingedBiped', 'mon/demon/daispine48.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: { chanceOfEffect: 50, effect: EffectTypeList.eRot },
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daitraum": {	// (stun)
		core: [ SYM, 59, '3:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daispine48.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: { chanceOfEffect: 50, effect: EffectTypeList.eStun },
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daishulk": {	// (shove)
		core: [ SYM, 64, '3:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daishulk48.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: { chanceOfEffect: 50, effect: EffectTypeList.eShove },
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daibozle": {	// (confuse)
		core: [ SYM, 69, '3:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daibozle48.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: { chanceOfEffect: 50, effect: EffectTypeList.eConfusion },
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daisteria": {	// (panic)
		core: [ SYM, 74, '3:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daispine48.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: { chanceOfEffect: 50, effect: EffectTypeList.ePanic },
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daiffury": {	// (enrage)
		core: [ SYM, 79, '3:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daispine48.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: { chanceOfEffect: 50, effect: EffectTypeList.eRage },
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daiphant": {	// (slow)
		core: [ SYM, 84, '3:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daispine48.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: { chanceOfEffect: 50, effect: EffectTypeList.eSlow },
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"dailess": {	// (blind)
		core: [ SYM, 89, '3:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daispine48.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: { chanceOfEffect: 50, effect: EffectTypeList.eBlindness },
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"dairain": {	// (drain)
		core: [ SYM, 94, '3:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daispine48.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: { chanceOfEffect: 50, effect: EffectTypeList.eDrain },
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"deepCentipede": {
		core: [ SYM, 24, '4:20', 'evil', 'stab', 'animalHunter', 'multiped', 'dc-mon/animals/giant_centipede.png', 'it' ],
		attitude: Attitude.HUNT,
		tooClose: 9,
		isInsect: true,
		immune: DamageType.POISON,
		loot: '40% chitin, 80% poisonGland',
		naturalWeapon: { chanceOfEffect: 25, effect: EffectTypeList.ePoison },
		senseSight: 2,
		senseSmell: 100,
		scentReduce: 50
	},
	"deepSpider": {
		core: [ SYM, 59, '2:20', 'evil', 'stab', 'animalHunter', 'multiped', 'mon/spider.png', 'it' ],
		attitude: Attitude.AWAIT,
		tooClose: 7,
		isInsect: true,
		isSpider: true,
		loot: '30% spinneret, 70% poisonGland',
		naturalWeapon: { chanceOfEffect: 34, effect: EffectTypeList.ePoisonForever },
		resist: DamageType.POISON,
		senseLiving: true,
		vuln: DamageType.BASH,
	},
	"ethermite": {
		core: [ SYM, 59, '3:20', 'evil', 'bite', 'animalHunter', 'noped', 'dc-mon/shining_eye.png', '*' ],
		attitude: Attitude.HUNT,
		brainMindset: 'pack',
		dodge: 1,
		glow: true,
		invisible: true,
		isPlanar: 1,
		light: 6,
		loot: '50% gem.eSeeInvisible, 30% gem, 20% gem',
		senseInvisible: true,
		sneakAttackMult: 3,
		vuln: 'glass'
	},
	"shade": {
		core: [ SYM, 4, '1.5:16', 'evil', 'rot', 'undeadDumb', 'humanoid', 'mon/shade48.png', '*' ],
		attitude: Attitude.HUNT,
		immune: UndeadImmunity,
		invisible: true,
		isUndead: true,
		isShade: true,
		loot: '20% gem.eSeeInvisible, 30% gem',
		senseInvisible: true,
		sneakAttackMult: 3,
		resist: PhysicalDamage,
		vuln: DamageType.SMITE
	},
	"ghoul": {
		core: [ SYM, 39, '1:2', 'evil', 'rot', 'undeadDumb', 'humanoid', 'dc-mon/undead/ghoul.png', 'it' ],
		attitude: Attitude.HUNT,
		brainMindset: 'greedy',
		greedField: 'isCorpse',
		immune: UndeadImmunity,
		dark: 2,
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
		core: [ SYM, 1, '3:10', 'evil', 'cut', 'sentient', 'humanoid', 'dc-mon/goblin.png', '*' ],
		brainIgnoreClearShots: 70,
		brainMindset: 'greedy',
		greedField: 'isGem',
		isGoblin: true,
		isGoblinMinion: true,
		isEarthChild: true,
		inventoryLoot: '1x potion.eFire',
		loot: '50% coin, 20% weapon.sword, 20% weapon.club, 20% any, 30% pinchOfEarth',
		sayPrayer: 'Oh mighty Thagzog...'
	},
	"goblinWar": { 
		core: [ SYM, 49, '3:8', 'evil', 'cut', 'sentient', 'humanoid', 'dc-mon/goblin.png', '*' ],
		attitude: Attitude.HUNT,
		name: 'goblin warrior',
		brainMindset: 'greedy',
		greedField: 'isGem',
		isGoblin: true,
		isWarGoblin: true,
		isEarthChild: true,
		lootInventory: 'weapon.axe',
		loot: '50% coin, 80% weapon.sword, 20% weapon.club, 30% pinchOfEarth',
		sayPrayer: 'Oh warrior Thagzog...'
	},
	"goblinMut": {
		core: [ SYM, 79, '3:8', 'evil', 'cut', 'sentient', 'humanoid', 'dc-mon/goblin.png', '*' ],
		name: 'goblin mutant',
		brainMindset: 'greedy',
		greedField: 'isGem',
		isGoblin: true,
		isEarthChild: true,
		lootInventory: 'weapon.axe',
		loot: '50% coin, 80% weapon.mace, 30% pinchOfEarth',
		sayPrayer: 'Oh mutant Thagzog...'
	},
	"imp": {
		core: [ SYM, 39, '3:10', 'evil', 'claw', 'demon', 'humanoid', 'dc-mon/demons/imp.png', 'it' ],
		attitude: Attitude.HESITANT,
		dodge: 1,
		glow: 1,
		immune: DamageType.BURN,
		isDemon: true,
		lootInventory: '3x ammo.dart.eFire',
		loot: '30% potion.eFire, 30% impBrain',
		senseInvisible: true,
		travelMode: "fly",
		vuln: DemonVulnerability
	},
	"kobold": {
		core: [ SYM, 14, '4:20', 'evil', 'cut', 'canine', 'humanoid', 'dc-mon/kobold.png', '*' ],
		attitude: Attitude.HESITANT,
		dodge: 1,
		inventoryLoot: '2x dart.eInert',
		isEarthChild: true,
		isKobold: true,
		loot: '50% coin, 4x 50% ammo.dart, 30% weapon.dagger, 30% dogCollar',
		senseSmell: 200,
	},
	"ogreKid": { 
		core: [ SYM, 39, '6:8', 'evil', 'bash', 'simpleton', 'humanoid', 'dc-mon/ogre.png', '*' ],
		name: "ogre child",
		isEarthChild: true,
		inventoryLoot: 'ammo.rock',
		loot: '50% weapon.club, 20% ogreDrool',
		resist: DamageType.CUT,
		speed: 0.75,
		stink: 0.6,
	},
	"ogre": {
		core: [ SYM, 69, '5:5', 'evil', 'bash', 'simpleton', 'humanoid', 'dc-mon/ogre.png', '*' ],
		isEarthChild: true,
		isOgre: true,
		isLarge: true,
		inventoryLoot: launcher({
			ammoType: 'isRock',
			ammoSpec: 'ammo.rock',
			rechargeTime: 2,
			conveyDamageToAmmo: true,
			hitsToKillPlayer: 6,
			name: "rock"
		}),
		loot: '90% coin, 90% coin, 90% coin, 50% weapon.club, 20% ogreDrool',
		resist: [DamageType.CUT,DamageType.STAB].join(','),
		speed: 0.5,
		stink: 0.8,
	},
	"redOoze": {
		core: [ SYM, 19, '3:3', 'evil', 'corrode', 'animalHunter', 'blob', 'dc-mon/jelly.png', 'it' ],
		attitude: Attitude.HUNT,
		brainMindset: 'ravenous',
		name: "red ooze",
		eatenFoodToInventory: true,
		glow: 4,
		immune: OozeImmunity,
		isPlanar: true,
		isOoze: true,
		loot: '90% potion.eAcid, 40% redOozeSlime',
		regenerate: 0.05,
		resist: OozeResistance,
		scale: 0.50,
		growLimit: 3.0,
		speed: 0.75,
		vuln: OozeVulnerability,
		senseSight: 1,
		senseSmell: 200,
	},
	"blueScarab": {
		core: [ SYM, 59, '2:30', 'evil', 'freeze', 'animalHunter', 'multiped', 'dc-mon/animals/boulder_beetle.png', 'it' ],
		namePattern: "blue scarab",
		glow: 3,
		immune: DamageType.FREEZE,
		isPlanar: true,
		loot: '30% gem, 50% scarabCarapace',
		travelMode: "fly",
		vuln: 'glass,'+DamageType.BURN
	},
	"redScarab": {
		core: [ SYM, 19, '2:30', 'evil', 'burn', 'animalHunter', 'multiped', 'dc-mon/animals/boulder_beetle.png', 'it' ],
		namePattern: "red scarab",
		glow: 3,
		immune: DamageType.BURN,
		isPlanar: true,
		loot: '30% gem, 50% scarabCarapace',
		travelMode: "fly",
		vuln: 'glass,'+DamageType.FREEZE
	},
	"shadow": {
		core: [ SYM, 79, '1:12', 'evil', 'rot', 'undead', 'humanoid', 'dc-mon/undead/shadow.png', 'it' ],
		dark: 12,
		immune: ShadowImmunity,
		isUndead: true,
		isSkeleton: true,
		loot: '50% darkEssence, 20% potion.eBlindness',
		speed: 0.75,
		vuln: ['silver',DamageType.SMITE].join(',')
	},
	"skeleton": {
		core: [ SYM, 19, '2:10', 'evil', 'claw', 'undeadDumb', 'humanoid', 'dc-mon/undead/skeletons/skeleton_humanoid_small.png', 'it' ],
		attitude: Attitude.HUNT,
		immune: SkeletonImmunity,
		isUndead: true,
		isSkeleton: true,
		loot: '50% bone, 50% skull',
		vuln: 'silver'+','+DamageType.SMITE
	},
	"skeletonArcher": {
		core: [ SYM, 29, '2:10', 'evil', 'claw', 'undeadDumb', 'humanoid', 'dc-mon/undead/skeletonArcher.png', 'it' ],
		attitude: Attitude.HUNT,
		immune: SkeletonImmunity,
		inventoryLoot: [{ typeFilter:'weapon.bow', rechargeTime: 4, unreal: 1, name: 'unholy bow', isFake: true }],
		isUndead: true,
		isSkeleton: true,
		loot: '50% bone, 50% skull',
		vuln: 'silver'+','+DamageType.SMITE
	},
	"skeletonLg": {
		core: [ SYM, 59, '2:8', 'evil', 'claw', 'undeadDumb', 'humanoid', 'dc-mon/undead/skeletons/skeleton_humanoid_large.png', 'it' ],
		name: 'ogre skeleton',
		attitude: Attitude.HUNT,
		immune: SkeletonImmunity,
		inventoryLoot: '50% spell.eRot',
		isUndead: true,
		isLarge: true,
		loot: '50% bone, 50% skull',
		vuln: 'silver'+','+DamageType.SMITE
	},
	"soldierAnt": {
		core: [ SYM, 1, '2:12', 'evil', 'bite', 'hivemind', 'multiped', 'dc-mon/animals/soldier_ant.png', 'it' ],
		name: "soldier ant",
		brainMindset: 'greedy',
		greedField: 'isAntFood',
		loot: '10% potion, 20% facetedEye, 10% antGrubMush',
		isAnimal: true,
		isSmall: true,
		senseSmell: 200,
		speed: 1.5,
		vuln: 'glass'+','+DamageType.FREEZE,
	},
	"spinyFrog": {
		core: [ SYM, 39, '3:10', 'evil', 'stab', 'animal', 'quadruped', 'dc-mon/animals/spiny_frog.png', 'it' ],
		name: "spiny frog",
		attitude: Attitude.WANDER,
		tooClose: 1,
		immune: [DamageType.POISON,'mud'].join(','),
		isAnimal: true,
		isSpinyFrog: 1,
		loot: '50% frogSpine',
		stink: 0.8,
	},
	"troll": {
		core: [ SYM, 49, '5:4', 'evil', 'claw', 'animalHunter', 'humanoid', 'dc-mon/troll.png', '*' ],
		brainMindset: 'ravenous',
		loot: '50% trollHide, 10% coin, 20% trollBlood',
		isEarthChild: true,
		isLarge: true,
		regenerate: 0.15,
		senseSight: 4,
		stink: 0.4,
		vuln: DamageType.BURN
	},
	"viper": {
		core: [ SYM, 44, '3:16', 'evil', 'bite', 'animalHunter', 'noped', 'dc-mon/animals/viper.png', 'it' ],
		attitude: Attitude.HESITANT,
		dodge: 2,
		isAnimal: true,
		loot: '40% viperVenom',
		senseSmell: 20,
		speed: 2.0,
	},

// LUNAR
	"lunarOne": {
		core: [ SYM, 12, '3:10', 'lunar', 'freeze', 'sentient', 'humanoid', 'dc-mon/deep_elf_demonologist.png', '*' ],
		name: "lunar one",
		immune: DamageType.FREEZE,
		inventoryLoot: '3x 50% potion.eCold',
		isLunarChild: true,
		loot: '2x 50% coin, 40% lunarEssence',
		rarity: 1.0,
		vuln: LunarVulnerabilities
	},
	"lunarReaper": {
		core: [ SYM, 9, '3:10', 'lunar', 'freeze', 'sentient' ,'humanoid', 'dc-mon/deep_elf_high_priest.png', '*' ],
		name: "lunar reaper",
		immune: DamageType.FREEZE,
		isLunarChild: true,
		loot: '2x 50% coin, 40% lunarEssence',
		rarity: 1.0,
		travelType: 'fly',
		vuln: LunarVulnerabilities,
		inventoryLoot: { typeFilter: 'spell.eCold', rechargeTime: 1, hitsToKillPlayer: 3}
	},

// NEUTRAL TEAM
	"bat": {
		core: [ SYM, 1, '2:20', 'neutral', 'bite', 'animal', 'wingedBiped', 'dc-mon/animals/giant_bat.png', 'it' ],
		attitude: Attitude.WANDER,
		dodge: 2,
		isAnimal: true,
		isBat: true,
		loot: '50% batWing',
		brainPackAnimal: true,
		senseInvisible: true,
		senseLiving: true,
		travelMode: "fly"
	},
	"giantSnail": {
		core: [ SYM, 59, '10:100', 'neutral', 'rot', 'animal', 'noped', 'mon/snail.png', 'it' ],
		imgChoices: { moving: { img: 'mon/snail.png' }, hiding: { img: 'mon/snailInShell.png' } },
		imgGet: (self,img) => img || self.imgChoices[self.inShell?'hiding':'moving'].img,
		attitude: Attitude.HUNT,
		brainMindset: 'fleeWhenAttacked',
		immuneInShell: ArmorDefendsAgainst.join(','),
		isAnimal: true,
		isGiant: true,
		isSnail: true,
		tooClose: 1,
		loot: '50% snailSlime',
		scentReduce: -1,	// Makes it always override any scent
		speed: 0.5,
		trail: 'stuff.snailTrail',
		resistInShell: [DamageType.BURN,DamageType.FREEZE,DamageType.POISON,DamageType.SMITE,DamageType.ROT].join(','),
	},
	"sheep": {
		core: [ SYM, 1, '1:20', 'neutral', 'bite', 'animalHerd', 'quadruped', 'dc-mon/animals/sheep.png', 'it' ],
		attitude: Attitude.FEARFUL,
		isAnimal: true,
		isLivestock: true,
		isSheep: true,
		loot: '1x lumpOfMeat, 3x 50% wool',
	}
};


MonsterTypeList.spinyFrog.onAttacked = function(attacker,amount,damageType) {
	if( !attacker || attacker.command == Command.THROW || this.getDistance(attacker.x,attacker.y) > 1 ) {
		return;
	}

	if( attacker.isImmune(StuffList.frogSpine.typeId) ) {
		tell(mSubject,attacker,' ',mVerb,'is',' protected from the ',mObject|mPossessive,this,' spines.');
		return;
	}
	let damage = this.rollDamage(this.naturalMeleeWeapon.damage);
	attacker.takeDamagePassive( this, null, damage, DamageType.POISON, function(attacker,victim,amount,damageType) {
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
	if( !attacker ) return;
	let f = this.findAliveOthers().includeMe().filter( e => e.typeId==this.typeId );
	if( f.count ) {
		let numAlerted = 0;
		f.process( e => {
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
	if( !isGripping && Math.chance(this.gripChance) ) {
		let effect = Object.assign( {}, EffectTypeList.eImmobilize, { name: 'the ambligryp\'s pincer grip' } );
		effectApply( effect, target, this, null );
	}
}

MonsterTypeList.ambligryp.onMove = function(x,y,xOld,yOld) {
	// Remove my grip on any victim.
	DeedManager.end( deed => {
		return deed.source && deed.source.id == this.id && deed.stat == 'immobile';
	});
}


MonsterTypeList.blueScarab.onAttack = function(target) {
	let effect = Object.assign({},EffectTypeList.eVulnerability,{value: DamageType.FREEZE});
	effectApply(effect,target,this,null);
}

MonsterTypeList.redScarab.onAttack = function(target) {
	let effect = Object.assign({},EffectTypeList.eVulnerability,{value: DamageType.BURN});
	effectApply(effect,target,this,null);
}

MonsterTypeList.redOoze.rescale = function() {
	let healthScale = ((Math.max(this.health,this.healthMax) / this.healthMax) - 1) / (this.growLimit-1);
	this.scale = 0.50 + 1.00*healthScale;	// should make the ooze grow when health is beyond max.
	if( this.spriteList ) {
		for( let i=0 ; i<this.spriteList.length ; ++i ) {
			this.spriteList[i].baseScale = this.scale;
		}
	}
	console.log( "Scale is now "+this.scale );
}

MonsterTypeList.redOoze.onAttacked = function() {
	this.rescale.call(this);
}

MonsterTypeList.redOoze.onMove = function(x,y) {
	let f = this.map.findItemAt(x,y).filter( i=>i.isCorpse );
	if( f.first && this.health < this.healthMax*this.growLimit ) {
		tell(mSubject,this,' ',mVerb,'absorb',' ',mObject,f.first,' and ',mVerb,'regain',' strength!');
		let heal = this.healthMax * 0.25;
		this.takeHealing(this,heal,DamageType.CORRODE,true,true);
		this.rescale.call(this)

		let self = this;
		let anim = new Anim({},{
			follow: 	this,
			img: 		this.img,
			duration: 	0.3,
			onInit: 		a => { a.puppet(self.spriteList); },
			onSpriteTick: 	s => {
				let scale = 1.0+s.sSine(s.sPct(),1.5);
				console.log( "Scale="+scale );
				s.sScaleSet(scale);
			},
			onSpriteDone: 	s => { s.sReset(); }
		});

		f.first.destroy();
	}
}

MonsterTypeList.giantSnail.onAttacked = function(attacker,amount,damageType) {
	if( amount > 0 ) {
		this.inShell = true;
		this.immune = this.immuneInShell;
		this.resist = this.resistInShell;
		spriteDeathCallback(this.spriteList);
		this.busy = {
			turns: 10,
			description: 'in its shell',
			onDone: () => {
				this.inShell = false;
				this.immune = '';
				this.resist = '';
				spriteDeathCallback(this.spriteList);
			}
		};
	}
}

(function() {
	// 		core: [ '@', 1, '3:10', 'good', 'cut', 'dc-mon/elf.png', 'he' ],
	for( let typeId in MonsterTypeList ) {
		monsterPreProcess(typeId,MonsterTypeList[typeId]);
	}
}());

Module.add('dataMonsters',function() {

// Monster Events
// onAttacked - fired when the monster gets attacked, even if damage nets to zero.
// onAttack - fires when ever the monster attacks, so you can pile on extra effects.
// onBump - fires if somebody steps into you but doesn't attack you. Like when confused.
// onTouch - fires if somebody is over/upon you.
// onHeal - fires when you get healing. return true to suppress the auto-generated message about healing.

const Control = { AI: "ai", USER: "user", TESTER: "tester", EMPTY: "empty" };

const MonsterTypeDefaults = {
	level: 0, power: '3:10', team: Team.EVIL, damageType: DamageType.CUT, img: "dc-mon/acid_blob.png", pronoun: 'it',
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
	speed: 1,
	travelMode: 'walk', mayWalk: false, mayFly: false,
	type: null, typeId: null,

	//debug only
	observeDistantEvents: false
};


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

let LunarVulnerabilities = ['solarium',DamageType.BURN].join(',');

let DemonImmunity = [DamageType.BURN,Attitude.PANICKED].join(',');
let DemonResistance = ['deepium',DamageType.POISON,DamageType.STAB,DamageType.ROT,'possess',Attitude.PACIFIED].join(',');
let DemonVulnerability = ['ice','solarium',DamageType.SMITE,DamageType.FREEZE,Attitude.ENRAGED].join(',');


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

let BrainMindset = {
	hero: 			'pickup,open,don,fleeWhenHurt',
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

let BrainAbility = {
	hero: 			'cast,gaze,open,pickup,shoot,talk,throw',
	sentient: 		'cast,gaze,open,pickup,shoot,talk,throw',
	simpleton: 		'gaze,open,pickup,shoot,talk,throw',
	demon: 			'cast,gaze,open,pickup,shoot,talk,throw',
	canine:   		'gaze,open,pickup,shoot,talk,throw',
	animal:   		'',
	animalHunter:   '',
	animalHerd: 	'',
	robot: 			'open,pickup,shoot,throw',
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
	humanoidBot: 	'gaze,open,pickup,shoot,throw',
}

let BodySlots = {
	humanoid: 		{ head: 1, neck: 1, arms: 1, hands: 1, fingers: 2, waist: 1, hip: 1, feet: 1, armor: 1, weapon: 1, ammo: 2, shield: 1, skill: 100 },
	quadruped: 		{ head: 1, neck: 1, waist: 1, hip: 1, feet: 2, armor: 1, skill: 100 },
	multiped: 		{ head: 1, neck: 1, waist: 1, hip: 1, fingers: 2, feet: 2, armor: 1, skill: 100 },
	wingedBiped: 	{ head: 1, neck: 1, feet: 1, skill: 100 },
	noped:  		{ head: 1, skill: 100 },
	blob:  			{ skill: 100 },
	humanoidBot: 	{ hip: 1, shield: 1, skill: 100 },
}


const MonsterTypeList = {

// GOOD TEAM
	"player": {
		core: [ '@', 0, '3:10', 'good', 'cut', 'hero', 'humanoid', 'mon/human/solarPriest.png', 'he' ],
		attitude: Attitude.CALM,
		brainMindset: 'pickup,open',
		control: Control.USER,
		experience: 0,
		naturalWeapon: {
			typeFilter: 'weapon.hands',
		},
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
		strictAmmo: true,
		imgChoices: { standard: { img: 'mon/human/solarPriest.png' }, ninja: { img: 'mon/human/ninja.png' }, ninjaSneak: { img: 'mon/human/ninjaSneak.png' } },
		imgGet: (self,img) => {
			if( img ) return img;
			let i2 = self.imgChoices.standard;
			let i1 = self.imgChoices[self.legacyId];
			let i0 = self.imgChoices[self.legacyId+(self.sneak?'Sneak':'')];
			return (i0||i1||i2).img;
		},
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
		isTalker: true,
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
	"solarCenturion": {
		core: [ SYM, 44, '4:20', 'good', 'stab', 'sentient', 'humanoid', 'mon/solarCenturion.png', 'he'  ],
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
		core: [ SYM, 99, '25:2', 'evil', 'burn', 'sentient', 'humanoid', 'dc-mon/hell_knight.png', 'he' ],
		isUnique: true,
		neverPick: true,
		immune: ['eShove',DamageType.BURN,Attitude.PANICKED].join(','),
		inventoryLoot: 'spell.eBurn, spell.eRot, spell.ePoison',
		isDemon: true,
		isLarge: true,
		sayPrayer: 'I shall rule this planet!',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"ambligryp": {
		core: [ SYM, 29, '4:20', 'evil', 'bash', 'animalHunter', 'multiped', 'mon/insect/ambligryp.png', 'it' ],
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
		core: [ SYM, 29, '4:12', 'evil', 'bash', 'robot', 'humanoidBot', 'mon/robot/tinnamaton.png', 'it' ],
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
		core: [ SYM, 59, '6:3', 'evil', 'bash', 'robot', 'humanoidBot', 'mon/robot/brassamaton.png', 'it' ],
		scale: 0.8,
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
		core: [ SYM, 39, '6:8', 'evil', 'stab', 'animalHunter', 'multiped', 'mon/insect/boneScorpion.png', 'it' ],
		attitude: Attitude.AWAIT,
		tooClose: 5,
		isInsect: true,
		isScorpion: true,
		loot: '70% poisonGland',
		naturalWeapon: {
			chanceOfEffect: 64,
			effect: { basis: 'ePoison', singularId: 'gsco', singularOp: 'sum' },
		},
		immune: DamageType.POISON+',eSlow',
		resist: [DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.BASH].join(','),
		vuln: DamageType.FREEZE,
	},
	"demon": {
		core: [ SYM, 49, '3:5', 'evil', 'burn', 'sentient', 'humanoid', 'player/base/draconian_red_f.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: 'ammo.dart.eBurn',
		loot: '30% coin, 50% potion.eBurn, 30% demonScale, 20% pitchfork, 30% demonEye',
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
	"daispine": {	// (stab)
		core: [ SYM,  4, '3:5', 'evil', 'stab', 'demon', 'wingedBiped', 'mon/demon/daispine.png', 'it' ],
		glow: 1,
		light: 2,
		immune: DemonImmunity,
		isDemon: true,
		isDaispine: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		resist: DemonResistance,
		travelMode: 'fly',
		vuln: DemonVulnerability,
	},
	"daibelade": {	// (cut)
		core: [ SYM,  9, '3:5', 'evil', 'cut', 'demon', 'wingedBiped', 'mon/demon/daibelade.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: 'pitchfork',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		resist: DemonResistance,
		travelMode: 'fly',
		vuln: DemonVulnerability,
	},
	"daifahng": {	// (bite)
		core: [ SYM, 14, '8:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daifahng.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daicolasp": {	// (claw)
		core: [ SYM, 19, '3:5', 'evil', 'claw', 'demon', 'wingedBiped', 'mon/demon/daicolasp.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daimaul": {	// (bash)
		core: [ SYM, 24, '3:5', 'evil', 'bash', 'demon', 'wingedBiped', 'mon/demon/daimaul.png', 'it' ],
		glow: 1,
		light: 1,
		immune: DemonImmunity,
		isDemon: true,
		isDaimaul: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		resist: DemonResistance,
		scale: 0.65,
		vuln: DemonVulnerability,
	},
	"daiskorsh": {	// (burn)
		core: [ SYM, 29, '3:5', 'evil', 'burn', 'demon', 'wingedBiped', 'mon/demon/daiskorsh.png', 'it' ],
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
		core: [ SYM, 34, '4:10', 'evil', null, 'demon', 'wingedBiped', 'mon/demon/daileesh.png', 'it' ],
		attitude: Attitude.HUNT,
		naturalWeapon: {
			_effectOnAttack: EffectTypeList.eLeech
		},
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
		core: [ SYM, 39, '3:5', 'evil', 'shock', 'demon', 'wingedBiped', 'mon/demon/dailectra.png', 'it' ],
		corpse: false,
		glow: true,
		light: 12,
		immune: DemonImmunity+','+DamageType.SHOCK,
		isDemon: true,
		isDailectra: true,
		lootInventory: '',
		loot: '3x gem',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daiacrid": {	// (corrode)
		core: [ SYM, 44, '3:16', 'evil', null, 'demon', 'quadruped', 'mon/demon/daiacrid.png', 'it' ],
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
		lootInventory: '',
		loot: '2x 70% acidSlime, 4x acidTrail',
		lootFling: 1,
		resist: DemonResistance,
		trail: 'stuff.acidTrail',
		vuln: DemonVulnerability,
	},
	"daitox": {	// (poison)
		core: [ SYM, 49, '3:20', 'evil', 'stab', 'demon', 'wingedBiped', 'mon/demon/daitox.png', 'it' ],
		immune: DemonImmunity+',poison',
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
		lootInventory: '',
		loot: '3x 30% demonEye',
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daikay": {	// (rot)
		core: [ SYM, 54, '3:30', 'evil', null, 'demon', 'noped', 'mon/demon/daikay.png', 'it' ],
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
		immune: DemonImmunity,
		isDemon: true,
		isDaikay: true,
		lootInventory: '',
		loot: '3x 30% stuff.bone',
		resist: DemonResistance,
		travelMode: 'fly',
		vuln: DemonVulnerability,
	},
	"daitraum": {	// (stun)
		core: [ SYM, 59, '3:4', 'evil', 'bash', 'demon', 'wingedBiped', 'mon/demon/daimaul.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: {
			chanceOfEffect: 15,
			effect: { basis: 'eStun', xDuration: 0.2, singularId: 'daitraum', },
		},
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daishulk": {	// (shove)
		core: [ SYM, 64, '3:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daishulk.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: {
			chanceOfEffect: 50,
			effect: EffectTypeList.eShove
		},
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daibozle": {	// (confuse)
		core: [ SYM, 69, '3:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daibozle.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: {
			chanceOfEffect: 50,
			effect: { basis: 'eConfusion', singularId: 'daibozle' }
		},
		resist: DemonResistance,
		travelMode: 'fly',
		vuln: DemonVulnerability,
	},
	"daisteria": {	// (panic)
		core: [ SYM, 74, '3:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daisteria.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		isDaisteria: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: {
			chanceOfEffect: 50,
			effect: { basis: 'ePanic', singularId: 'daisteria' }
		},
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daiffury": {	// (enrage)
		core: [ SYM, 79, '3:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daifury.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		isDaifury: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: {
			chanceOfEffect: 50,
			effect: { basis: 'eRage', singularId: 'daifury' }
		},
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"daiphant": {	// (slow)
		core: [ SYM, 84, '5:12', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/daiphant.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		isDaiphant: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonEye',
		naturalWeapon: {
			chanceOfEffect: 25,
			effect: { basis: 'eSlow', singularId: 'daiphant' }
		},
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"dailess": {	// (blind)
		core: [ SYM, 89, '3:5', 'evil', 'bite', 'demon', 'multiped', 'mon/demon/dailess.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		isDailess: true,
		lootInventory: '',
		loot: '30% gem, 10% potion, 30% demonEye',
		naturalWeapon: {
			chanceOfEffect: 50,
			effect: { basis: 'eBlindness', singularId: 'dailess' }
		},
		resist: DemonResistance,
		vuln: DemonVulnerability,
	},
	"dairain": {	// (drain)
		core: [ SYM, 94, '3:5', 'evil', 'bite', 'demon', 'wingedBiped', 'mon/demon/dairain.png', 'it' ],
		immune: DemonImmunity,
		isDemon: true,
		isDairain: true,
		lootInventory: '',
		loot: '30% gem, 50% potion, 30% demonScale, 30% demonEye',
		naturalWeapon: {
			chanceOfEffect: 50,
			effect: EffectTypeList.eDrain
		},
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
		naturalWeapon: {
			chanceOfEffect: 25,
			effect: { basis: 'ePoison', singularId: 'deepCent', singularOp: 'sum' }
		},
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
		naturalWeapon: {
			attackVerb: 'sting',
			chanceOfEffect: 34,
			effect: { basis: 'ePoisonForever', singularId: 'deepSpider', singularOp: 'fail' }
		},
		resist: DamageType.POISON,
		senseLiving: true,
		vuln: DamageType.BASH,
	},
	"ethermite": {
		core: [ SYM, 59, '3:12', 'evil', 'bite', 'animalHunter', 'noped', 'mon/planar/ethermite.png', '*' ],
		attitude: Attitude.HUNT,
		brainMindset: 'pack',
		dodge: 1,
		glow: true,
		invisible: true,
		isPlanar: true,
		isEthermite: true,
		light: 6,
		loot: '2% gem.eSeeInvisible, 10% potion.eSeeInvisible, 50% any',
		senseInvisible: true,
		sneakAttackMult: 4,
		vuln: 'glass'
	},
	"shade": {
		core: [ SYM, 4, '1.5:16', 'evil', 'rot', 'undeadDumb', 'humanoid', 'mon/shade.png', '*' ],
		attitude: Attitude.HUNT,
		bloodId: 'bloodBlack',
		immune: UndeadImmunity,
		invisible: true,
		isUndead: true,
		isShade: true,
		loot: '20% gem.eSeeInvisible, 30% gem',
		senseInvisible: true,
		sneakAttackMult: 3,
		resist: Damage.Physical2,
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
		core: [ SYM, 1, '3:10', 'evil', 'cut', 'sentient', 'humanoid', 'mon/earth/goblin.png', '*' ],
		brainIgnoreClearShots: 70,
		brainMindset: 'greedy',
		greedField: 'isGem',
		isGoblin: true,
		isGoblinMinion: true,
		isEarthChild: true,
		inventoryLoot: '1x potion.eBurn',
		loot: '50% coin, 20% weapon.sword, 20% weapon.club, 20% any, 30% pinchOfEarth',
		sayPrayer: 'Oh mighty Thagzog...',
		scale: 0.45,
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
		lootInventory: '3x ammo.dart.eBurn',
		loot: '30% potion.eBurn, 30% impBrain',
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
			ammoDamage: 'convey',
			rechargeTime: 2,
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
	"redFiddler": {
		core: [ SYM, 29, '4:7', 'evil', null, 'animalHunter', 'multiped', 'mon/insect/redFiddler.png', 'it' ],
		namePattern: "red fiddler",
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
		resist: DamageType.BURN,
		isInsect: true,
		isFiddler: true,
		isRedFiddler: true,
		loot: '2x 30% gem',
		travelMode: "walk",
		vuln: 'glass'
	},
	"blueFiddler": {
		core: [ SYM, 39, '4:7', 'evil', null, 'animalHunter', 'multiped', 'mon/insect/blueFiddler.png', 'it' ],
		namePattern: "blue fiddler",
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
		core: [ SYM, 49, '4:7', 'evil', null, 'animalHunter', 'multiped', 'mon/insect/greenFiddler.png', 'it' ],
		namePattern: "green fiddler",
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
	"redFiddler": {
		core: [ SYM, 29, '4:7', 'evil', 'burn', 'animalHunter', 'multiped', 'mon/insect/redFiddler.png', 'it' ],
		namePattern: "red fiddler",
		reach: 5,
		glow: 2,
		resist: DamageType.BURN,
		isPlanar: false,
		loot: '2x 30% gem',
		travelMode: "walk",
		vuln: 'glass'
	},
	"blueScarab": {
		core: [ SYM, 59, '2:30', 'evil', 'shock', 'animalHunter', 'multiped', 'mon/insect/blueScarab.png', 'it' ],
		namePattern: "blue scarab",
		glow: 3,
		immune: DamageType.SHOCK,
		isPlanar: true,
		isInsect: true,
		isScarab: true,
		isBlueScarab: true,
		loot: '30% gem, 50% scarabCarapace',
		travelMode: "fly",
		vuln: 'glass,'+DamageType.BURN
	},
	"redScarab": {
		core: [ SYM, 19, '2:30', 'evil', 'burn', 'animalHunter', 'multiped', 'mon/insect/redScarab.png', 'it' ],
		namePattern: "red scarab",
		glow: 3,
		immune: DamageType.BURN,
		isPlanar: true,
		isInsect: true,
		isScarab: true,
		isRedScarab: true,
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
		core: [ SYM, 1, '2:12', 'evil', 'bite', 'hivemind', 'multiped', 'mon/insect/giantAnt.png', 'it' ],
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
	"bear": {
		core: [ SYM, 9, '6:7', 'evil', 'claw', 'animal', 'quadruped', 'mon/bear.png', 'it' ],
		name: "bear",
		attitude: Attitude.WANDER,
		tooClose: 3,
		isAnimal: true,
		isLarge: true,
		isBear: true,
		loot: '50% lumpOfMeat',
		senseSmell: 200
	},
	"troll": {
		core: [ SYM, 49, '5:4', 'evil', 'claw', 'animalHunter', 'humanoid', 'mon/troll.png', '*' ],
		brainMindset: 'ravenous',
		loot: '50% trollHide, 10% coin, 20% trollBlood',
		isEarthChild: true,
		isLarge: true,
		isTroll: true,
		regenerate: 0.10,
		scale: 0.6,
		senseSight: 3,
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
		inventoryLoot: '3x 50% potion.eFreeze',
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
		inventoryLoot: { typeFilter: 'spell.eFreeze', rechargeTime: 1, hitsToKillPlayer: 3}
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
		immuneInShell: [DamageType.CUT,DamageType.STAB,DamageType.BITE,DamageType.CLAW,DamageType.BASH,DamageType.POISON,DamageType.BURN,DamageType.FREEZE].join(','),
		isAnimal: true,
		isGiant: true,
		isSnail: true,
		tooClose: 1,
		loot: '50% snailSlime',
		scentReduce: -1,	// Makes it always override any scent
		speed: 0.5,
		trail: 'stuff.snailTrail',
		resistInShell: [DamageType.SHOCK,DamageType.SMITE,DamageType.ROT].join(',')
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
	if( !isGripping && Math.chance(this.gripChance) ) {
		let effect = Object.assign( {}, EffectTypeList.eImmobilize, { name: 'the ambligryp\'s pincer grip' } );
		effectApply( effect, target, this, null, 'onAttack' );
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
	effectApply(effect,target,this,null,'onAttack');
}

MonsterTypeList.redScarab.onAttack = function(target) {
	let effect = Object.assign({},EffectTypeList.eVulnerability,{value: DamageType.BURN});
	effectApply(effect,target,this,null,'onAttack');
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

MonsterTypeList.daitox.onTick = function() {
	let tile = adhoc(this.map.tileTypeGet(this.x,this.y),this.map,this.x,this.y);
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
				imageDirty(this);
			},
			onEnd: (deed) => {
				this.inShell = false;
				this.immune = '';
				this.resist = '';
				imageDirty(this);
			}
		};
		effectApply(shellEffect,this,this,null,'attacked');
	}
};

function monsterPreProcess(typeId,m) {
	let brain = null;
	let body = null;
	let naturalDamageType;
	if( m.core ) {
		m.symbol = m.core[0];
		m.level = m.core[1];
		m.power = m.core[2];
		m.team  = m.core[3];
		naturalDamageType = m.core[4];
		brain = m.core[5];
		body  = m.core[6];
		m.img = m.core[7];
		m.pronoun = m.core[8];
		delete m.core;
	}

	console.assert( !brain || (BrainMindset[brain]!==undefined && BrainAbility[brain]!==undefined) );
	console.assert( !body  || (BodyAbility[body]!==undefined && BodySlots[body]!==undefined) );

	// OK, this sucks, but I set isMonsterType here AS WELL AS in fab, because the merge
	// of monsters from places requires it.
	m.isMonsterType = true;
	m.brainMindset = String.combine(',',m.brainMindset,BrainMindset[brain]);
	m.brainAbility = String.combine(',',m.brainAbility,BrainAbility[brain]);
	m.bodyAbility  = String.combine(',',m.bodyAbility, BodyAbility[body]);
	m.bodySlots    = Object.assign( m.bodySlots || {}, BodySlots[body] );

	let blood = {
		isPlanar: 	'bloodYellow',
		isUndead: 	'bloodWhite',
		isDemon: 	'bloodBlack',
		isEarthChild: 'bloodGreen',
		isAnimal: 	'bloodRed',
		isSunChild: 'bloodRed',
		isLunarChild: 'bloodBlue'
	};
	for( let key in blood ) {
		if( m[key] ) {
			m.bloodId = m.bloodId || blood[key];
			break;
		}
	}
	m.bloodId = m.bloodId || 'bloodRed';
	if( !m.isSunChild ) {
		m.senseDarkVision = m.senseDarkVision || Rules.MONSTER_DARK_VISION;
	}
	if( m.isLiving === undefined ) {
		m.isLiving = !m.isUndead && !m.isConstruct;
	}
	if( m.isMindless ) {
		m.immune = String.arAdd(m.immune,MentalAttack+',possess');
	}
	if( !String.arIncludes(m.vuln||'',DamageType.WATER) && !String.arIncludes(m.resist||'',DamageType.WATER) ) {
		m.immune = String.arAdd(m.immune,DamageType.WATER);
	}

	m.inventoryLoot = m.inventoryLoot || [];
	m.inventoryLoot = Array.isArray(m.inventoryLoot) ? m.inventoryLoot : [m.inventoryLoot];
	let damType = naturalDamageType || m.naturalWeapon.damageType || DamageType.CUT;
	m._naturalWeapon = m.naturalWeapon;
	let natWeapon = Object.assign({
		typeFilter: 'fake',
		isNatural: true,
		isMelee: true,
		isWeapon: true,
		quick: 2,
		reach: m.reach || 1,
		damageType: damType,
	}, m.naturalWeapon );
	m.naturalWeapon = natWeapon;

	console.assert( m.stink===undefined || (m.stink>=0 && m.stink<=1) );
}

(() => {
	// 		core: [ '@', 1, '3:10', 'good', 'cut', 'dc-mon/elf.png', 'he' ],
	for( let typeId in MonsterTypeList ) {
		monsterPreProcess(typeId,MonsterTypeList[typeId]);
	}
})();

return {
	Control: Control,
	MonsterTypeDefaults: MonsterTypeDefaults,
	MonsterTypeList: MonsterTypeList,
	monsterPreProcess: monsterPreProcess
}

});

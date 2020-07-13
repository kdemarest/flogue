Module.add('dataJobs',function() {

// Check out this awesomeness: http://rmhh.co.uk/occup/b.html

/*
name - the name of this person's job
loot spec	- 10x 50% typeId.particular ofMatter
	means
		ten time, roll a 50% chance to generate this typedId and pick from things made of a particular kind of matter
*/

let JobTypeList = {
	layman: {
		name: 'Layman',
		isLayman: true,
		attitude: Attitude.WANDER,
		sign: "Just an ordinary person.",
	},
	sentry: {
		name: 'sentry',
		isSentry: true,
		attitude: Attitude.AWAIT,
		tether: 7,
		tooClose: 7,
		sign: "A sentry trying to keep people safe.",
		carrying: 'weapon.sword',
	},
	brewer: {
		name: 'brewer',
		isMerchant: true,
		isMinor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isPotion || item.isStuff || item.ofLiquid,
		colFilter: {slot:1,key:1,icon:1,description:1,price:1},
		sign: "Concoctions to change your outlook!",
		carrying: 
			'6x 70% potion.eHealing, 2x 90% potion.eCureDisease, 2x 90% potion.eCurePoison, 2x 90% potion.eSeeInvisible, '+
			'4x 50% potion.eJump3, 4x 50% potion.eJump4, 1x 50% potion.eHaste, 1x 50% potion.eInvisibility, '+
			'20x 50% potion, 10x 50% stuff ofLiquid, 10x seed, 8x 80% vial'
	},
	botanist: {
		name: 'botanist',
		isMerchant: true,
		isMinor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isSeed,
		colFilter: {slot:1,key:1,icon:1,description:1,price:1},
		sign: "Seeds for those who love to tend and harvest!",
		carrying: '30x seed'
	},
	grocer: {
		name: 'grocer',
		isMerchant: true,
		isMinor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isPotion || item.isEdible || item.ofLiquid,
		colFilter: {slot:1,key:1,icon:1,description:1,price:1},
		sign: "Don't let hunger slow you down!",
		carrying: '20x stuff isEdible, 10x seed'
	},
	scribe: {
		name: 'scribe',
		isMerchant: true,
		isMajor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isSpell || item.isPaper,
		colFilter: {slot:1,key:1,icon:1,description:1,damage:1,bonus:1,charges:1,price:1},
		sign: "Arcane scribing for the gifted!",
		carrying: '20x 50% spell'
	},
	armorer: {
		name: 'armorer',
		isMerchant: true,
		isMajor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isArmor || item.isShield || item.isOre || item.ofMetal,
		colFilter: {slot:1,key:1,icon:1,description:1,armor:1,damage:1,bonus:1,charges:1,price:1},
		sign: "Come back safe and sound!",
		carrying: '15x 50% armor, 6x 50% helm, 6x 50% bracers, 15x 50% shield, 20x 50% armor'
	},
	clothier: {
		name: 'clothier',
		isMerchant: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isCloak || item.isGloves || item.isFabricIngredient,
		colFilter: {slot:1,key:1,icon:1,description:1,armor:1,bonus:1,charges:1,price:1},
		sign: "The finest clothes and cloaks!",
		carrying: '10x cloak, 5x gloves, 10x 50% stuff isFabricIngredient'
	},
	smith: {
		name: 'smith',
		isMerchant: true,
		isMajor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isWeapon || item.isAmmo || item.isOre || item.ofMetal || item.isDart,
		colFilter: {slot:1,key:1,icon:1,description:1,damage:1,bonus:1,charges:1,price:1},
		sign: "Defend yourself, or press the attack!",
		carrying: '20x weapon, 20x 50% weapon, 10x stuff ofMetal, 5x ammo.dart'
	},
	// Bowyers sell bows and arrows, plus a miscellany of thrown or shooting weapons.
	bowyer: {
		name: 'bowyer',
		isMerchant: true,
		isMajor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isBow || item.isAmmo || item.mayThrow,
		colFilter: {slot:1,key:1,icon:1,description:1,damage:1,bonus:1,charges:1,price:1},
		sign: "Shoot from a distance to triumph safely!",
		carrying: '20x 50% weapon.bow, 40x ammo.arrow, 5x weapon mayThrow, 5x 50% weapon mayShoot'
	},
	// Cobblers work with leather primarily to make boots. However, since slings are also leather thay carry those.
	cobbler: {
		name: 'cobbler',
		isMerchant: true,
		isMidsize: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isBoots,
		colFilter: {slot:1,key:1,icon:1,description:1,armor:1,bonus:1,charges:1,price:1},
		sign: "Shoes and boots that last!",
		carrying: '10x boots, 20x 50% boots, 12x 50% weapon.sling, 20x ammo isSlingable'
	},
	// Another leather worker, like the cobbler, gaunters are the only source of gloves.
	// Their leather focus also means they carry slings.
	gaunter: {
		name: 'gaunter',
		isMerchant: true,
		isMidsize: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isGloves || item.isSling,
		colFilter: {slot:1,key:1,icon:1,description:1,bonus:1,price:1},
		sign: "Gloves for any hand!",
		carrying: '10x gloves, 10x 50% gloves, 6x 50% weapon.sling, 10x ammo isSlingable'
	},
	lapidary: {
		name: 'lapidary',
		isMerchant: true,
		isMidsize: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isGem || item.isJewelry,
		colFilter: {slot:1,key:1,icon:1,description:1,bonus:1,price:1},
		sign: "The finest gems, custom cut!",
		carrying: '20x 50% gem'
	},
	jeweler: {
		name: 'jeweler',
		isMerchant: true,
		isMajor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isJewelry || item.isGem || item.isOre,
		colFilter: {slot:1,key:1,icon:1,description:1,bonus:1,price:1},
		sign: "Rings, amulets, you name it!",
		carrying: '10x 50% ring'
	},
	// Known for buying anything. They sell "stuff". the peddler also happens to carry darts.
	peddler: {
		name: 'peddler',
		isMerchant: true,
		isMinor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isTreasure,
		colFilter: {slot:1,key:1,icon:1,description:1,armor:1,damage:1,bonus:1,charges:1,price:1},
		sign: "I sell goods of all kinds!",
		carrying: '1x charm.batFigurine, 10x stuff, 10x 50% stuff, 5x 50% ammo.dart, 2x stuff isLight, 7x 50% vial, 5x 50% charm'
	},
	glassBlower: {
		name: 'glass blower',
		isMerchant: true,
		isMinor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isTreasure && item.matter=='glass',
		colFilter: {slot:1,key:1,icon:1,description:1,armor:1,damage:1,bonus:1,charges:1,price:1},
		sign: "I blow glass objects of both delicacy and strength!",
		carrying: '2x weapon ofGlass, 2x armor ofGlass, 2x helm ofGlass, 2x shield ofGlass, 2x boots ofGlass, 2x bracers ofGlass, 12x 90% vial, 3x stuff.lantern'
	},
	// Miners have enough ore for the player to manufacture things, and they also carry metal objects and pickaxes.
	miner: {
		name: 'miner',
		isMerchant: true,
		isMinor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isOre || item.isArmor || item.isWeapon || item.ofMetal,
		colFilter: {slot:1,key:1,icon:1,description:1,bonus:1,price:1},
		sign: "Raw material from the depths!",
		carrying: '20x ore, 20x 50% ore, 2x weapon.pickaxe, 4x stuff isLight' // This made them use dark lamps!!! , 2x stuff isLight'
	},
	evangelist: {
		name: 'evangelist',
		attitude: Attitude.AWAIT,
		tether: 2,
		sign: "The sun has fled the sky!",
	},
	priest: {
		name: 'priest',
		attitude: Attitude.AWAIT,
		tether: 2,
		sign: "Let us give thanks!",
	}
}

JobTypeList = Type.establish(
	'JobType',
	{
		onFinalize: (jobType,X,checker) => {
			checker.checkLoot(jobType);
		}
	},
	JobTypeList
);


return {
	JobTypeList: JobTypeList
}

});

Module.add('dataJobs',function() {

// Check out this awesomeness: http://rmhh.co.uk/occup/b.html
let JobTypeList = {
	layman: {
		isLayman: true,
		attitude: Attitude.WANDER,
		sign: "Just an ordinary person.",
	},
	sentry: {
		isSentry: true,
		attitude: Attitude.AWAIT,
		tether: 7,
		tooClose: 7,
		sign: "A sentry trying to keep people safe.",
		inventoryLoot: 'weapon.sword',
	},
	brewer: {
		isMerchant: true,
		isMinor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isPotion || item.isStuff || item.ofLiquid,
		colFilter: {slot:1,key:1,icon:1,description:1,price:1},
		sign: "Concoctions to change your outlook!",
		inventoryLoot: '20x 50% potion, 10x 50% stuff ofLiquid'
	},
	grocer: {
		isMerchant: true,
		isMinor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isPotion || item.isEdible || item.ofLiquid,
		colFilter: {slot:1,key:1,icon:1,description:1,price:1},
		sign: "Don't let hunger slow you down!",
		inventoryLoot: '20x stuff isEdible'
	},
	scribe: {
		isMerchant: true,
		isMajor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isSpell || item.isPaper,
		colFilter: {slot:1,key:1,icon:1,description:1,damage:1,bonus:1,charges:1,price:1},
		sign: "Arcane scribing for the gifted!",
		inventoryLoot: '20x 50% spell'
	},
	armorer: {
		isMerchant: true,
		isMajor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isArmor || item.isShield || item.isOre || item.ofMetal,
		colFilter: {slot:1,key:1,icon:1,description:1,armor:1,damage:1,bonus:1,charges:1,price:1},
		sign: "Come back safe and sound!",
		inventoryLoot: '15x 50% armor, 6x 50% helm, 6x 50% bracers, 4x 50% shield, 20x 50% armor'
	},
	clothier: {
		isMerchant: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isCloak || item.isGloves || item.isFabricIngredient,
		colFilter: {slot:1,key:1,icon:1,description:1,armor:1,bonus:1,charges:1,price:1},
		sign: "The finest clothes and cloaks!",
		inventoryLoot: '10x cloak, 5x gloves, 10x 50% stuff isFabricIngredient'
	},
	smith: {
		isMerchant: true,
		isMajor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isWeapon || item.isAmmo || item.isOre || item.ofMetal || item.isDart,
		colFilter: {slot:1,key:1,icon:1,description:1,damage:1,bonus:1,charges:1,price:1},
		sign: "Defend yourself, or press the attack!",
		inventoryLoot: '20x weapon, 20x 50% weapon, 10x stuff ofMetal, 5x ammo.dart'
	},
	// Bowyers sell bows and arrows, plus a miscellany of thrown or shooting weapons.
	bowyer: {
		isMerchant: true,
		isMajor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isBow || item.isAmmo || item.mayThrow,
		colFilter: {slot:1,key:1,icon:1,description:1,damage:1,bonus:1,charges:1,price:1},
		sign: "Shoot from a distance to triumph safely!",
		inventoryLoot: '20x 50% weapon.bow, 40x ammo.arrow, 5x weapon mayThrow, 5x 50% weapon mayShoot'
	},
	// Cobblers work with leather primarily to make boots. However, since slings are also leather thay carry those.
	cobbler: {
		isMerchant: true,
		isMidsize: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isBoots,
		colFilter: {slot:1,key:1,icon:1,description:1,armor:1,bonus:1,charges:1,price:1},
		sign: "Shoes and boots that last!",
		inventoryLoot: '10x boots, 20x 50% boots, 6x 50% weapon.sling, 10x ammo isSlingable'
	},
	// Another leather worker, like the cobbler, gaunters are the only source of gloves.
	// Their leather focus also means they carry slings.
	gaunter: {
		isMerchant: true,
		isMidsize: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isGloves || item.isSling,
		colFilter: {slot:1,key:1,icon:1,description:1,bonus:1,price:1},
		sign: "Gloves for any hand!",
		inventoryLoot: '10x gloves, 10x 50% gloves, 6x 50% weapon.sling, 10x ammo isSlingable'
	},
	lapidary: {
		isMerchant: true,
		isMidsize: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isGem || item.isJewelry,
		colFilter: {slot:1,key:1,icon:1,description:1,bonus:1,price:1},
		sign: "The finest gems, custom cut!",
		inventoryLoot: '20x 50% gem'
	},
	jeweler: {
		isMerchant: true,
		isMajor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isJewelry || item.isGem || item.isOre,
		colFilter: {slot:1,key:1,icon:1,description:1,bonus:1,price:1},
		sign: "Rings, amulets, you name it!",
		inventoryLoot: '10x 50% ring'
	},
	// Known for buying anything. They sell "stuff". the peddler also happens to carry darts.
	peddler: {
		isMerchant: true,
		isMinor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isTreasure,
		colFilter: {slot:1,key:1,icon:1,description:1,armor:1,damage:1,bonus:1,charges:1,price:1},
		sign: "I sell goods of all kinds!",
		inventoryLoot: '10x stuff, 10x 50% stuff, 5x 50% ammo.dart'
	},
	// Miners have enough ore for the player to manufacture things, and they also carry metal objects and pickaxes.
	miner: {
		isMerchant: true,
		isMinor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isOre || item.isArmor || item.isWeapon || item.ofMetal,
		colFilter: {slot:1,key:1,icon:1,description:1,bonus:1,price:1},
		sign: "Raw material from the depths!",
		inventoryLoot: '20x ore, 20x 50% ore, 10x stuff ofMetal, 2x weapon.pickaxe'
	},
	evangelist: {
		attitude: Attitude.AWAIT,
		tether: 2,
		sign: "The sun has fled the sky!",
	},
	priest: {
		attitude: Attitude.AWAIT,
		tether: 2,
		sign: "Let us give thanks!",
	}
}

return {
	JobTypeList: JobTypeList
}

});

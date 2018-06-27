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
		buyTest: item => item.isPotion || item.isStuff,
		colFilter: {slot:1,key:1,icon:1,description:1,price:1},
		sign: "Concoctions to change your outlook!",
		inventoryLoot: '20x potion, 50x 50% potion'
	},
	scribe: {
		isMerchant: true,
		isMajor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isSpell || item.isPaper,
		colFilter: {slot:1,key:1,icon:1,description:1,damage:1,bonus:1,charges:1,price:1},
		sign: "Arcane scribing for the gifted!",
		inventoryLoot: '20x spell, 20x 50% spell'
	},
	armorer: {
		isMerchant: true,
		isMajor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isArmor || item.isShield || item.isOre,
		colFilter: {slot:1,key:1,icon:1,description:1,armor:1,damage:1,bonus:1,charges:1,price:1},
		sign: "Come back safe and sound!",
		inventoryLoot: '20x armor, 5x helm, 5x bracers, 20x 50% armor'
	},
	smith: {
		isMerchant: true,
		isMajor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isWeapon || item.isAmmo || item.isOre,
		colFilter: {slot:1,key:1,icon:1,description:1,damage:1,bonus:1,charges:1,price:1},
		sign: "Defend yourself, or press the attack!",
		inventoryLoot: '20x weapon, 20x 50% weapon'
	},
	bowyer: {
		isMerchant: true,
		isMajor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isBow || item.isAmmo || item.mayThrow,
		colFilter: {slot:1,key:1,icon:1,description:1,damage:1,bonus:1,charges:1,price:1},
		sign: "Shoot from a distance to triumph safely!",
		inventoryLoot: '10x weapon isBow, 20x ammo, 10x weapon mayThrow, 20x 50% weapon, 20x 50% ammo'
	},
	cobbler: {
		isMerchant: true,
		isMidsize: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isBoots,
		colFilter: {slot:1,key:1,icon:1,description:1,armor:1,bonus:1,charges:1,price:1},
		sign: "Shoes and boots that last!",
		inventoryLoot: '10x boots, 20x 50% boots'
	},
	gaunter: {
		isMerchant: true,
		isMidsize: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isGloves,
		colFilter: {slot:1,key:1,icon:1,description:1,bonus:1,price:1},
		sign: "Gloves for any hand!",
		inventoryLoot: '10x gloves, 10x 50% gloves'
	},
	lapidary: {
		isMerchant: true,
		isMidsize: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isGem,
		colFilter: {slot:1,key:1,icon:1,description:1,bonus:1,price:1},
		sign: "The finest gems, custom cut!",
		inventoryLoot: '50x gem, 100x 50% gem'
	},
	jeweler: {
		isMerchant: true,
		isMajor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isRing || item.isGem,
		colFilter: {slot:1,key:1,icon:1,description:1,bonus:1,price:1},
		sign: "Rings, amulets, you name it!",
		inventoryLoot: '40x ring, 100x 50% ring'
	},
	peddler: {
		isMerchant: true,
		isMinor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isStuff,
		colFilter: {slot:1,key:1,icon:1,description:1,armor:1,damage:1,bonus:1,charges:1,price:1},
		sign: "I sell goods of all kinds!",
		inventoryLoot: '100x stuff, 100x 50% stuff'
	},
	miner: {
		isMerchant: true,
		isMinor: true,
		attitude: Attitude.AWAIT,
		tether: 2,
		buyTest: item => item.isOre,
		colFilter: {slot:1,key:1,icon:1,description:1,bonus:1,price:1},
		sign: "Raw material from the depths!",
		inventoryLoot: '200x ore, 100x 50% ore'
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

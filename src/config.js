let ConfigList = {};

ConfigList.ken = () => {
	ScapeList.kenCave = theme => ({
		dim: 				40,
		architecture: 		"cave",
		floorDensity: 		0.48,
		seedPercent: 		0.20,
		passageWander: 		0,
	});
	ScapeList.kenCaveSpindle = theme => ({
		dim: 				60,
		architecture: 		"cave",
		floorDensity: 		0.12,
		seedPercent: 		0.63,
		passageWander: 		0,
		passageWidth2: 		0,
		passageWidth3: 		0
	});

	ScapeList.kenRooms = theme => ({
		dim: 				60,
		architecture: 		"rooms",
		floorDensity: 		0.45,
		circleChance: 		10,
		overlapChance: 		10,
		preferDoors: 		true,
		passageWander: 		30,
		passageWidth2: 		10,
		passageWidth3: 		0
	});
	PlaceTypeList.kenPlace = {
		isMaze: true,
		xLen: 16,
		yLen: 16,
		makeWalled: false,
		wallSymbol:  '#',
		floorSymbol: '.',
		supply: '8x gem',
		flags: { rotate: true },
		symbols: {
		},
		stickers: {
		},
		tileTypes: {
		},
		itemTypes: {
		},
		monsterTypes: {
		},
		inject: {
		}
	};

ThemeList.dwarfTown2 = {
	isDwarfish: true,
	isTown: 	true,
	scapeId: 	'caveTown',
	palette: 	{ basis: 'jaggedCave', passageFloor: 'floorStone' },
	rREQUIRED: 	'dwarfSmithy, dwarfPlaza, market, shopLarge, shopSmall, 2x shopOpenAir, 2x floodOre, floodPit, '+
				'gatewayFromDwarves, 2x dwarfHouseSmall, 2x dwarfHouse, '+
				'70% dwarfTemple, 30% den_dog, 10% camp_human',
	rCOMMON: 	'floodOre, market, shopLarge, shopSmall, shopOpenAir, dwarfHouseSmall',
	rUNCOMMON: 	'floodPit, dwarfHouse, barrelStorage',
	rRARE: 		'firePit, floodWater',
	jobPick: 	{ layman: 10, sentry: 3, grocer: 1, clothier: 1, bowyer: 1, brewer:1 ,scribe:1, armorer: 1, smith: 1, cobbler: 1, gaunter: 1, lapidary: 1, jeweler: 1, peddler: 1 },
	prefer: 	['pit'],
	monsters: 	['isDwarf'],
	enemyDensity: 	0.00,
	friendDensity: 	0.01,
	itemDensity:    0.0001,
}

	ThemeList.kenTheme = {
		scapeId: 		'kenCaveSpindle',
		palette: 		{ basis: 'jaggedCave' },
//		palette: 		{ basis: 'stoneRooms' },
//		rREQUIRED: 		'4x kenPlace',
		placeDensity: 	0.10,
//		rCOMMON: 		'nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit',
//		rUNCOMMON: 		'antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, floodWater, pitEncircle',
//		rRARE: 			'goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre',
//		rEPIC: 			'graveYard',
		monsters: 		['isTroll'], //,'isOoze','isSnail'], //,'isOgre','isKobold','isTroll','isOoze','isDog'],
		prefer: 		null,
		enemyDensity:  	0.05,
		friendDensity: 	0.00001,
	}

	MonsterTypeList.player.inventoryLoot.push('8x ammo.dart, stuff.viperFigurine, stuff.dogFigurine, 2x stuff.centurionFigurine, stuff.voidCandle, 4x potion.eHealing, 10x stuff.poisonSlime, gem.eSeeInvisible, 5x gem, stuff.lumpOfMeat, spell.eShove, spell.ePossess, bow, 10x stuff.lumpOfMeat, 6x ammo.arrow, stuff.snailSlime, 3x potion.eCurePoison, weapon.sword.eCold, weapon.hammer, spell.eTeleport, spell.eFire, boots.eFlight, stuff.sunCrystal');
	MonsterTypeList.player.inventoryWear = 'ring.eMobility, armor, helm, bracers, stuff.oilLamp';
//	MonsterTypeList.player.experience = 100;

	Object.assign( Tweak, {
//		lootFrequency: 0.80,
//		effectChance: 4.0
	});


	return {
		startingDepth: 10,
		themeId: 'kenTheme'
	}
}

class Config {
	constructor(whose,init) {
		let overlay = ConfigList[whose] ? ConfigList[whose]() : {};
		Object.assign(this,init,overlay);
	}
};

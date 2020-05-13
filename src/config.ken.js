Module.add('config.ken',function(X,moduleId) {

	let plugin = new Plugin('ken');

	plugin.ScapeList.kenCave = theme => ({
		dim: 				60,
		architecture: 		"cave",
		floorDensity: 		0.48,
		seedPercent: 		0.20,
		passageWander: 		0,
	});
	plugin.ScapeList.kenTinyCave = theme => ({
		dim: 				30,
		architecture: 		"cave",
		floorDensity: 		0.68,
		seedPercent: 		0.20,
		passageWander: 		0,
	});
	plugin.ScapeList.kenCaveSpindle = theme => ({
		dim: 				60,
		architecture: 		"cave",
		floorDensity: 		0.12,
		seedPercent: 		0.63,
		passageWander: 		0,
		passageWidth2: 		0,
		passageWidth3: 		0
	});

	plugin.ScapeList.kenTinyOpenCave = theme => ({
		dim: 				14,
		architecture: 		"cave",
		floorDensity: 		0.88, //0.45,
		passageWander: 		0,
	});

	plugin.ScapeList.kenTinyComplexCave = theme => ({
		dim: 				30,
		architecture: 		"cave",
		floorDensity: 		0.22, //0.45,
		passageWander: 		0,
	});

	plugin.ScapeList.kenRooms = theme => ({
		dim: 				30,
		architecture: 		"rooms",
		floorDensity: 		0.88, //0.45,
		shapeChances: 		{ circle: 0.1, rect: 0.9 },
		overlapChance: 		10,
		preferDoors: 		true,
		passageWander: 		30,
		passageWidth2: 		10,
		passageWidth3: 		0
	});
	plugin.ScapeList.kenVast = theme => ({
		dim: 				160,
		architecture: 		"rooms",
		floorDensity: 		0.35,
		shapeChances: 		{ circle: 0.6, rect: 0.4 },
		overlapChance: 		20,
		preferDoors: 		true,
		passageWander: 		30,
		passageWidth2: 		10,
		passageWidth3: 		0
	});

	plugin.PlaceTypeList.kenPlace = {
		isKenSpecial: true,
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
		stickerList: {
		},
		tileTypeList: {
		},
		itemTypeList: {
		},
		monsterTypeList: {
		},
		inject: {
		}
	};

	plugin.ThemeList.kenSimple = {
		scapeId: 	'kenCave',
		palette: 	{ basis: 'jaggedCave', passageFloor: 'floorStone' },
		enemyDensity: 	0.00,
		friendDensity: 	0.01,
		itemDensity:    0.01,
	}

	plugin.ThemeList.kenMoon = {
		scapeId: 	'kenCave',
		palette: 	{ basis: 'jaggedCave', passageFloor: 'floorDirt' },
		mapVars:	{
			name: 'Moon',
			isAirless: true,
			passiveEffectList: [
				{ name: 'vacuum', op: 'damage', value: 10, duration: 0, damageType: DamageType.FREEZE }
			]
		},
		enemyDensity: 	0.00,
		friendDensity: 	0.01,
		itemDensity:    0.01,
	}

	plugin.ThemeList.kenDwarfTown = {
		isDwarfish: true,
		isTown: 	true,
		scapeId: 	'kenTinyCave',
		palette: 	{ basis: 'jaggedCave', passageFloor: 'floorStone' },
		rREQUIRED: 	'mushrooms, shopOpenAir',
		jobPick: 	{ miner: 3, grocer: 1, botanist: 1, glassBlower: 1 },
		monsters: 	['isDwarf'],
		enemyDensity: 	0.00,
		friendDensity: 	0.01,
		itemDensity:    0.0001,
	}

	plugin.ThemeList.kenTinyTheme = {
		scapeId: 		'kenTinyComplexCave',
		palette: 		{ basis: 'moon' },
		placeDensity: 	0.00001,
		monsters: 		['isDog','isEarthChild'], //,'isOoze','isSnail'], //,'isOgre','isKobold','isTroll','isOoze','isDog'],
		prefer: 		null,
		itemDensity:    0.00001,
		enemyDensity:  	0.02,
		friendDensity: 	0.000005,
	}

	plugin.ThemeList.kenTheme = {
		scapeId: 		'moonscape',
		palette: 		{ basis: 'moon' },

//		scapeId: 		'kenRooms',		// 'kenCave' or 'kenRooms',
//		palette: 		{ basis: 'jaggedCave' },
//		palette: 		{ basis: 'stoneRooms' },
		rREQUIRED: 		'miniMaze',
		placeDensity: 	0.00001,
//		rCOMMON: 		'nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit',
//		rUNCOMMON: 		'antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, floodWater, pitEncircle',
//		rRARE: 			'goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre',
//		rEPIC: 			'graveYard',
		monsters: 		['isDemon'], //,'isOoze','isSnail'], //,'isOgre','isKobold','isTroll','isOoze','isDog'],
		prefer: 		null,
		itemDensity:    0.05,
		enemyDensity:  	0.001,
		friendDensity: 	0.000001,
	}

	plugin.Rules = {
		//xLootFrequency: 0.80,
		//xLootEffectChance: 4.0
	}

	// This is not a normal plugin action. Only for config.
	//PlaceTypeList.surfaceSunTemple.symbols.Z = { typeFilter: 'portal', toThemeId: 'coreCavernRooms' }; //'daikay'; //'weapon.hammer';
	PlaceTypeList.surfaceSunTemple.symbols.Z = { typeFilter: 'bear' }; //'daikay'; //'weapon.hammer';

	//'100x potion, 100x helm, 100x armor, 100x spell, 100x gem, 100x weapon, 100x cloak, 100x gloves, 100x ammo, 100x shield, 100x ring';
	//'4x potion.eHealing, 4x potion.eSenseXray, 4x potion.eDarkVision, weapon.spear, weapon.sword.eSmite, weapon.stealthBow, weapon.bow.eStun, weapon.bow.eFreeze, 40x ammo.arrow, 10x ammo.dart, 4x shield, spell.eShock/3, gem.eSmite/6, spell.eHealing';
	//'2x potion.eHealing, 4x potion, 2x gem, 2x spell, 1x potion.eSeeInvisible, 3x weapon, weapon.sling, 30x ammo.slingStone, weapon.bow, 40x ammo.arrow, spell.eFreeze';

	let player = {
		// soldier, brawler, monk, archer, ninja, not quite blaster
		mergeWithExistingData: true,
		legacyId: 'brawler', //'ninja',
		carrying: '4x weapon.club, 40x ammo.arrow, spell.eFreeze, 2x spell.eAlliance, 2x spell.eTame, 2x spell.eThrall, lumpOfMeat, 20x potion, 5x weapon, weapon.bow', //'5x wood, 100x part, 4x potion.eWater, 4x part isWing, 4x part isSkin, 4x ore, 3x stuff.leather, 3x oreMalachite, 3x stuff.demonLeather', //stuff.magicMap, 10x potion, 5x part.redOozeSlime, 5x stuff.spinneret, 5x stuff.poisonGland, 10x potion.eWater',
//		wearing:  'shield, armor, helm, bracers, boots, stuff.lamp, cloak.eInvisibility, 2x weapon.glass, 2x weapon.ice, weapon.bow',
		wearing:  'shield, armor, helm, bracers, boots, stuff.lamp, spell.eShove',
		//sensePerception = true,
		//senseAlert: true,
		//senseSmell: 200,
		//senseDarkVision: 8,
		light: 2,
		experience: 1000,
		inject: {
			level: 10,
			//immortal: true,
			//invulnerable: true
		}
	}

	// If you are doing graphics work comment these in. Unlike the rest of the plugin, this directly changes a global variable!
	//IMG_BASE = 'http://localhost:3010/force/';	// forces reprocessing of all images.
	//IMG_BASE = 'http://localhost:3010/tiles/';	// Regular processing that caches.

	plugin.MonsterTypeList.player = player;
	plugin.Config = {
		startingDepth: 2,
//		themeId: 'dwarfTown',
		saveBattery: true,
		playerInject: player.inject
	}

	PluginManager.register( plugin );

return {
}

});

Module.add('config',function() {

let ConfigList = {};

ConfigList.ken = () => {
	ScapeList.kenCave = theme => ({
		dim: 				60,
		architecture: 		"cave",
		floorDensity: 		0.48,
		seedPercent: 		0.20,
		passageWander: 		0,
	});
	ScapeList.kenTinyCave = theme => ({
		dim: 				30,
		architecture: 		"cave",
		floorDensity: 		0.68,
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
	ScapeList.kenVast = theme => ({
		dim: 				160,
		architecture: 		"rooms",
		floorDensity: 		0.35,
		circleChance: 		60,
		overlapChance: 		20,
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

	ThemeList.kenSimple = {
		scapeId: 	'kenCave',
		palette: 	{ basis: 'jaggedCave', passageFloor: 'floorStone' },
		enemyDensity: 	0.00,
		friendDensity: 	0.01,
		itemDensity:    0.01,
	}

	ThemeList.kenDwarfTown = {
		isDwarfish: true,
		isTown: 	true,
		scapeId: 	'kenTinyCave',
		palette: 	{ basis: 'jaggedCave', passageFloor: 'floorStone' },
		rREQUIRED: 	'mushrooms, shopOpenAir',
		jobPick: 	{ layman: 10, sentry: 3, grocer: 1, clothier: 1, bowyer: 1, brewer:1 ,scribe:1, armorer: 1, smith: 1, cobbler: 1, gaunter: 1, lapidary: 1, jeweler: 1, peddler: 1 },
		monsters: 	['isDwarf'],
		enemyDensity: 	0.00,
		friendDensity: 	0.01,
		itemDensity:    0.0001,
	}

	ThemeList.kenTheme = {
		scapeId: 		'kenCave',	//'kenRooms',
		palette: 		{ basis: 'jaggedCave' },
//		palette: 		{ basis: 'stoneRooms' },
//		rREQUIRED: 		'4x kenPlace',
		placeDensity: 	0.00001,
//		rCOMMON: 		'nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit',
//		rUNCOMMON: 		'antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, floodWater, pitEncircle',
//		rRARE: 			'goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre',
//		rEPIC: 			'graveYard',
		monsters: 		['isDemon'], //,'isOoze','isSnail'], //,'isOgre','isKobold','isTroll','isOoze','isDog'],
		prefer: 		null,
		itemDensity:    0.00001,
		enemyDensity:  	0.001,
		friendDensity: 	0.000001,
	}

//	MonsterTypeList.player.inventoryLoot.push('30x weapon ofMetal, 10x stuff ofLiquid, 10x gloves ofLeather');

//	MonsterTypeList.player.inventoryLoot.push('100x potion, 100x helm, 100x armor, 100x spell, 100x gem, 100x weapon, 100x cloak, 100x gloves, 100x ammo, 100x shield, 100x ring');
//	MonsterTypeList.player.inventoryLoot.push('100x helm.dwarven');
//	MonsterTypeList.player.inventoryLoot.push('10x coin');

//	MonsterTypeList.player.inventoryLoot.push('4x potion.eHealing, 4x potion.eSenseXray, 4x potion.eDarkVision, weapon.spear, weapon.sword.eSmite, weapon.stealthBow, weapon.bow.eStun, weapon.bow.eFreeze, 40x ammo.arrow, 10x ammo.dart, 4x shield, spell.eShock/3, gem.eSmite/6, spell.eHealing');
//	MonsterTypeList.player.inventoryLoot.push('2x potion.eHealing, 4x potion, 2x gem, 2x spell, 1x potion.eSeeInvisible, 3x weapon, weapon.sling, 30x ammo.slingStone, weapon.bow, 40x ammo.arrow, spell.eFreeze');
//	MonsterTypeList.player.experience = 100;
//	MonsterTypeList.player.inventoryLoot.push('6x weapon, 50x ammo.arrow, 2x stuff.shovel, stuff.lantern, stuff.candleLamp, stuff.lamp, 2x stuff.solarOrbS, 2x stuff.solarOrbM, 2x stuff.solarOrbL, stuff.sunCrystal');


	MonsterTypeList.player.inventoryWear = 'armor, helm, bracers, boots, stuff.lamp, cloak.eInvisibility, 5x weapon, weapon.bow, ammo.arrow';


	Object.assign( Rules, {
//		xLootFrequency: 0.80,
//		xEffectChance: 4.0
	});

	MonsterTypeList.player.legacyId = 'blaster';
	MonsterTypeList.player.inventoryLoot.push('5x spell, 10x potion, 5x part.redOozeSlime, 5x stuff.spinneret, 5x stuff.poisonGland, 10x potion.eWater');
	MonsterTypeList.player.inventoryLoot.push('spell.eTeleport, spell.eBlink');
//	MonsterTypeList.player.sensePerception = true;
//	MonsterTypeList.player.senseAlert = true;
//	MonsterTypeList.player.senseSmell = 200;
//	MonsterTypeList.player.senseDarkVision = 8;
	MonsterTypeList.player.light = 2;

	// If you are doing graphics work, use this. Otherwise leave it alone to get faster performance.
	//IMG_BASE = 'http://localhost:3010/tiles/';

	return {
//		startingDepth: 1,
//		themeId: 'kenDwarfTown',
		saveBattery: true,
		playerInject: { level: 20 }
	}
}

class Config {
	constructor(whose,init) {
		let overlay = ConfigList[whose] ? ConfigList[whose]() : {};
		Object.assign(this,init,overlay);
	}
};

return {
	Config: Config
}

});

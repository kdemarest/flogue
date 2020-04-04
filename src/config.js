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

	ThemeList.kenMoon = {
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

	ThemeList.kenDwarfTown = {
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

//	MonsterTypeList.player.carrying.push('100x potion, 100x helm, 100x armor, 100x spell, 100x gem, 100x weapon, 100x cloak, 100x gloves, 100x ammo, 100x shield, 100x ring');
//	MonsterTypeList.player.carrying.push('4x potion.eHealing, 4x potion.eSenseXray, 4x potion.eDarkVision, weapon.spear, weapon.sword.eSmite, weapon.stealthBow, weapon.bow.eStun, weapon.bow.eFreeze, 40x ammo.arrow, 10x ammo.dart, 4x shield, spell.eShock/3, gem.eSmite/6, spell.eHealing');
//	MonsterTypeList.player.carrying.push('2x potion.eHealing, 4x potion, 2x gem, 2x spell, 1x potion.eSeeInvisible, 3x weapon, weapon.sling, 30x ammo.slingStone, weapon.bow, 40x ammo.arrow, spell.eFreeze');
//	MonsterTypeList.player.experience = 100;

//	Object.assign( Rules, {
//		xLootFrequency: 0.80,
//		xLootEffectChance: 4.0
//	});

	// soldier, brawler, monk, archer, ninja, not quite blaster
	playerInject = {
		level: 0,
		//immortal: true,
		//invulnerable: true
	};
//	MonsterTypeList.player.legacyId = 'ninja';
//	MonsterTypeList.player.carrying.push('5x spell, 10x potion, 5x part.redOozeSlime, 5x stuff.spinneret, 5x stuff.poisonGland, 10x potion.eWater');
//	MonsterTypeList.player.carrying.push('spell.eTeleport, spell.eBlink');
//	MonsterTypeList.player.sensePerception = true;
//	MonsterTypeList.player.senseAlert = true;
//	MonsterTypeList.player.senseSmell = 200;
//	MonsterTypeList.player.senseDarkVision = 8;
//	MonsterTypeList.player.light = 2;

	MonsterTypeList.player.wearing = 'shield, armor, helm, bracers, boots, stuff.lamp, cloak.eInvisibility, 2x weapon.glass, 2x weapon.ice, weapon.bow';
//	MonsterTypeList.player.carrying.push( '20x seed, 40x ammo.arrow, 4x potion.eBurn, 6x vial');
//	MonsterTypeList.player.carrying.push( '4x weapon.sword, 5x seed');

	//PlaceTypeList.surfaceSunTemple.symbols.Z = 'arborian'; //'weapon.hammer';

	// If you are doing graphics work comment these in.
	//IMG_BASE = 'http://localhost:3010/force/';	// forces reprocessing of all images.
	//IMG_BASE = 'http://localhost:3010/tiles/';	// Regular processing that caches.

	return {
		startingDepth: 1,
//		themeId: 'kenDwarfTown',
		saveBattery: true,
		playerInject: playerInject
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

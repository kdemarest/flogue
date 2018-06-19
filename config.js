let ConfigList = {};

ConfigList.ken = () => {
	ScapeList.kenCave = theme => ({
		dim: 				30,
		architecture: 		"cave",
		floorDensity: 		0.88,
		seedPercent: 		0.20,
		passageWander: 		0,
	});
	ScapeList.kenRooms = theme => ({
		dim: 				40,
		architecture: 		"rooms",
		floorDensity: 		0.25,
		circleChance: 		10,
		overlapChance: 		10,
		preferDoors: 		true,
		passageWander: 		30,
		passageWidth2: 		10,
		passageWidth3: 		0
	});
	PlaceTypeList.kenPlace = {
		map:
			`
			.X..d....
			.ffffff..
			.f....f..
			.f..f.f..
			.f..f.f..
			.ffff.f..
			`,
		flags: { rotate: true },
		symbols: {
			X: { typeFilter: 'marker', playerStartHere: true },
			x: 'brazier',
			p: 'pit',
			f: 'flames',
			L: 'lava',
			M: 'mud',
			d: 'dog',
			m: 'mist'
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

	ThemeList.kenTheme = {
		scapeId: 		'kenRooms',
//		rREQUIRED: 		'floodOre',
		placeDensity: 	0.20,
		rCOMMON: 		'nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit',
		rUNCOMMON: 		'antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, floodWater, pitEncircle',
		rRARE: 			'goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre',
		rEPIC: 			'graveYard',
		monsters: 		['isUndead','isEarthChild','isPlanar','isAnimal'],
		prefer: 		null,
		enemyDensity:  	0.04,
		friendDensity: 	0.00001,
	}

	MonsterTypeList.player.inventoryLoot.push('stuff.lumpOfMeat, weapon.hammer, spell.eFire');
	MonsterTypeList.player.inventoryWear = 'weapon.pickaxe,stuff.oilLamp, shield.eAbsorb';
//	MonsterTypeList.player.experience = 100;

	Object.assign( Tweak, {
//		lootFrequency: 0.80,
//		effectChance: 4.0
	});


	return {
		startingDepth: 3,
		themeId: 'kenTheme'
	}
}

class Config {
	constructor(whose,init) {
		let overlay = ConfigList[whose] ? ConfigList[whose]() : {};
		Object.assign(this,init,overlay);
	}
};

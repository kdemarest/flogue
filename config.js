let ConfigList = {};

ConfigList.ken = () => {
	ScapeList.kenCave = theme => ({
		dim: 				20,
		architecture: 		"cave",
		floorDensity: 		0.88,
		seedPercent: 		0.20,
		passageWander: 		0,
	});
	ScapeList.kenRooms = theme => ({
		dim: 				20,
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
		scapeId: 		'kenCave',
		rREQUIRED: 		'floodPit, trollBridge',
		placeDensity: 	0.20,
//		rCOMMON: 		'nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit',
//		rUNCOMMON: 		'antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, floodWater, pitEncircle',
//		rRARE: 			'goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre',
//		rEPIC: 			'graveYard',
		monsters: 		['isGoblinMinion','isGhoul'], //,'isOoze','isSnail'], //,'isOgre','isKobold','isTroll','isOoze','isDog'],
		prefer: 		null,
		enemyDensity:  	0.03,
		friendDensity: 	0.0001,
	}

	MonsterTypeList.player.inventoryLoot.push('5x gem, stuff.lumpOfMeat, spell.ePossess, bow, 6x ammo.arrow, stuff.snailSlime, 3x potion.eCurePoison, weapon.sword.eCold, weapon.hammer, spell.eTeleport, spell.eFire, stuff.sunCrystal');
	MonsterTypeList.player.inventoryWear = 'armor, helm, boots, bracers, stuff.oilLamp';
	MonsterTypeList.player.experience = 100;

	Object.assign( Tweak, {
//		lootFrequency: 0.80,
//		effectChance: 4.0
	});


	return {
		startingDepth: 9,
		themeId: 'kenTheme'
	}
}

class Config {
	constructor(whose,init) {
		let overlay = ConfigList[whose] ? ConfigList[whose]() : {};
		Object.assign(this,init,overlay);
	}
};

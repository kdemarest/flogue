let ConfigList = {};

ConfigList.ken = () => {
	ScapeList.kenScape = theme => ({
		dim: 				30,
		architecture: 		"cave",
		floorDensity: 		0.88,
		seedPercent: 		0.20,
		wanderingPassage: 	false,
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
		scapeId: 	'kenScape',
		rREQUIRED: 	'floodOre',
		rCOMMON: 	null, //'floodOre',
		rUNCOMMON: 	null, //'floodOre',
		rRARE: 		null, //'firePit, floodWater',
		rEPIC: 		null, //'floodOre',
		prefer: 	null,
		enemyDensity:  0.01,
		friendDensity: 0.00001,
		monsters: 	['isSkeleton']

	}

	MonsterTypeList.player.inventoryLoot.push('stuff.lumpOfMeat, weapon.hammer, spell.eFire');
	MonsterTypeList.player.inventoryWear = 'weapon.pickaxe,stuff.oilLamp, shield.eAbsorb';
//	MonsterTypeList.player.experience = 100;

	Object.assign( Tweak, {
//		lootFrequency: 0.80,
//		effectChance: 4.0
	});


	return {
		startingDepth: 8,
		themeId: 'kenTheme'
	}
}

class Config {
	constructor(whose,init) {
		let overlay = ConfigList[whose] ? ConfigList[whose]() : {};
		Object.assign(this,init,overlay);
	}
};

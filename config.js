let ConfigList = {};

ConfigList.ken = () => {
	ScapeList.kenScape = theme => ({
		dim: 				20,
		architecture: 		"cave",
		floorDensity: 		0.68,
		seedPercent: 		0.20,
		monsterDensity: 	0.03,
		wanderingPassage: 	false,
	});
	PlaceTypeList.kenPlace = {
		map:
			`
			.......
			.LL.MM.
			.......
			..ppp..
			.x...x.
			.....d.
			.x...x.
			..fff..
			.......
			`,
		flags: { rotate: true },
		symbols: {
			x: 'brazier',
			p: 'pit',
			f: 'flames',
			L: 'lava',
			M: 'mud',
			d: 'dog'
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
		rREQUIRED: 	'kenPlace',
		rCOMMON: 	null, //'floodOre',
		rUNCOMMON: 	null, //'floodOre',
		rRARE: 		null, //'firePit, floodWater',
		rEPIC: 		null, //'floodOre',
		prefer: 	null,
		monsters: 	['isGoblin','isPet']

	}

	MonsterTypeList.player.inventoryLoot.push('stuff.lumpOfMeat, weapon.hammer, spell.eFire');
	MonsterTypeList.player.inventoryWear = 'stuff.lantern, shield.eAbsorb';
//	MonsterTypeList.player.experience = 100;

	Object.assign( Tweak, {
		lootFrequency: 0.80,
		effectChance: 4.0
	});


	return {
		startingDepth: 1,
		themeId: 'kenTheme'
	}
}

class Config {
	constructor(whose,init) {
		let overlay = ConfigList[whose] ? ConfigList[whose]() : {};
		Object.assign(this,init,overlay);
	}
};

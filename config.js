let ConfigList = {};

ConfigList.ken = () => {
	ScapeList.kenScape = theme => ({
		dim: 				20,
		architecture: 		"cave",
		floorDensity: 		0.68,
		seedPercent: 		0.20,
		wanderingPassage: 	false,
	});
	PlaceList.kenPlace = {
		map:
			`
			.......
			.x...x.
			.......
			.x...x.
			.......
			`,
		flags: { rotate: true },
		symbols: {
			x: 'brazier'
		},
		stickers: {
		},
		tileTypes: {
		},
		itemTypes: {
		},
		monsterTypes: {
		},
		onEntityCreate: {
		}
	};

	ThemeList.kenTheme = {
		scapes: 	['kenScape'],
		rREQUIRED: 	'kenPlace',
		rCOMMON: 	null, //'floodOre',
		rUNCOMMON: 	null, //'floodOre',
		rRARE: 		null, //'firePit, floodWater',
		rEPIC: 		null, //'floodOre',
		prefer: 	null,
		monsters: 	['isDwarf']

	}
	Object.assign( MonsterTypeList.player, {
		inventoryLoot: MonsterTypeList.player.inventoryLoot+', weapon.hammer, potion.eFlight, spell.eShove',
		inventoryWear: MonsterTypeList.player.inventoryWear+', stuff.lantern, weapon.sword'
	});

	Object.assign( Tweak, {
		lootFrequency: 0.80,
		effectChance: 4.0
	});


	return {
		startingDepth: 40,
		themeId: 'kenTheme'
	}
}

class Config {
	constructor(whose,init) {
		let overlay = ConfigList[whose] ? ConfigList[whose]() : {};
		Object.assign(this,init,overlay);
	}
};

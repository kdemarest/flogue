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
			.......
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
			o: 'ogre',
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
		monsters: 	['isSkeleton','isBat']

	}

	MonsterTypeList.player.inventoryLoot.push('5x weapon.arrow, weapon.hammer, potion.eFlight, spell.eCold, spell.eShove');
	MonsterTypeList.player.inventoryWear = 'stuff.lantern, weapon.bow.eFire, shield.eAbsorb, dart.eStun';

	Object.assign( Tweak, {
		lootFrequency: 0.80,
		effectChance: 4.0
	});


	return {
		startingDepth: 4,
		themeId: 'kenTheme'
	}
}

class Config {
	constructor(whose,init) {
		let overlay = ConfigList[whose] ? ConfigList[whose]() : {};
		Object.assign(this,init,overlay);
	}
};

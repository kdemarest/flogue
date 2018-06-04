function loadConfig(){
	ScapeList.willScape = theme => ({
		dim: 				30,
		architecture: 		"cave",
		floorDensity: 		0.68,
		seedPercent: 		0.20,
		wanderingPassage: 	false,
	});
	ThemeList.willTheme = {
		scapes: 	['caveRandom'],
		rCOMMON: 	'camp.refugee, den.dog',
		rUNCOMMON: 	'handoutStand, floodPit, pitEncircle',
		monsters: 	['isSunChild','isPet']
	};
	//MonsterTypeList.player.inventoryLoot = '36x viperVenom, 12x bones';

	let config = {
		startingLevel: 1,
		themeId: 'willTheme'
	};

	return config;
}
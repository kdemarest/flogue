Module.add('dataThemes',function() {


let PaletteList   = {};

PaletteList.DEFAULT = {
	floor: 			'floorDirt',
	wall:  			'wallCave',
	fillFloor: 		'floorDirt',
	fillWall: 		'wallCave',
	outlineWall: 	'wallCave',
	passageFloor: 	'floorDirt',
	door: 			'door',
	bridge: 		'bridge',
}

PaletteList.jaggedCave = {
	floor: 			'floorDirt',
	wall:  			'wallCave',
	fillFloor: 		'floorDirt',
	fillWall: 		'wallCave',
	outlineWall: 	'wallCave',
	passageFloor: 	'floorDirt',
}

PaletteList.stoneRooms = {
	floor: 			'floorDirt',
	wall:  			'wallCave',
	fillFloor: 		'floorDirt',
	fillWall: 		'wallCave',
	outlineWall: 	'wallCave',
	passageFloor: 	'floorDirt',
}

PaletteList.spookyRooms = {
	floor: 			'floorDirt',
	wall:  			'wallCave',
	fillFloor: 		'floorDirt',
	fillWall: 		'wallCave',
	outlineWall: 	'wallCave',
	passageFloor: 	'floorDirt',
}

PaletteList.plain = {
	floor: 			'floorDirt',
	wall:  			'wallCave',
	fillFloor: 		'floorDirt',
	fillWall: 		'wallCave',
	outlineWall: 	'wallCave',
	passageFloor: 	'floorDirt',
}

PaletteList.moon = {
	floor: 			'floorDirt',
	wall:  			'wallCave',
	fillFloor: 		'floorDirt',
	fillWall: 		'wallCave',
	outlineWall: 	'wallCave',
	passageFloor: 	'floorDirt',
}

let ScapeList     = {};

ScapeList.plainScape = () => ({
	dim: 				60,
	architecture: 		"cave",
	floorDensity: 		95,
	seedPercent: 		0.001,
});

ScapeList.caveRandom = () => ({
	dim: 				Math.randInt(40,80),
	architecture: 		"cave",
	floorDensity: 		Math.rand(0.10,0.70),
	seedPercent: 		Math.rand(0.0001,0.90),
	passageWander: 		50,
});

ScapeList.caveWeblike = () => ({
	dim: 				Math.randInt(30,60),
	architecture: 		"cave",
	floorDensity: 		0.12,
	seedPercent: 		0.63,
	passageWander: 		100,
});

ScapeList.caveMazeLike = () => ({
	dim: 				Math.randInt(30,50),
	architecture: 		"cave",
	floorDensity: 		0.12,
	seedPercent: 		0.63,
	passageWander: 		0,
});

ScapeList.caveSpacious = () => ({
	dim: 				Math.randInt(40,80),
	architecture: 		"cave",
	floorDensity: 		0.68,
	seedPercent: 		0.20,
	passageWander: 		0,
});

ScapeList.caveBroadWinding = () => ({
	dim: 				Math.randInt(40,50),
	architecture: 		"cave",
	floorDensity: 		0.35,
	seedPercent: 		0.50,
	passageWander: 		100,
});

ScapeList.caveRoomsWellConnected = () => ({
	dim: 				Math.randInt(40,50),
	architecture: 		"cave",
	floorDensity: 		0.30,
	seedPercent: 		0.20,
	passageWander: 		100,
});

ScapeList.caveRoomsNarrowlyConnected = () => ({
	dim: 				Math.randInt(30,40),
	architecture: 		"cave",
	floorDensity: 		0.25,
	seedPercent: 		0.15,
	passageWander: 		100,
});

ScapeList.caveTendrils = () => ({
	dim: 				Math.randInt(40,50),
	architecture: 		"cave",
	floorDensity: 		0.20,
	seedPercent: 		0.20,
	passageWander: 		100,
});

ScapeList.caveTownRural = () => ({
	dim: 				Math.randInt(60,80),
	architecture: 		"cave",
	floorDensity: 		0.04,
	seedPercent: 		0.20,
	passageWander: 		0,
});

ScapeList.caveWildlands = () => ({
	dim: 				Math.randInt(70,90),
	architecture: 		"cave",
	floorDensity: 		0.38,
	seedPercent: 		0.30,
	passageWander: 		50,
});


ScapeList.caveTown = () => ({
	dim: 				Math.randInt(50,60),
	architecture: 		"cave",
	floorDensity: 		Math.rand(0.40,0.50),
	seedPercent: 		Math.rand(0.10,0.20),
	passageWander: 		0,
});

ScapeList.caveTownSmall = () => ({
	dim: 				Math.randInt(35,40),
	architecture: 		"cave",
	floorDensity: 		Math.rand(0.20,0.30),
	seedPercent: 		Math.rand(0.10,0.20),
	passageWander: 		0,
});

ScapeList.caveVillage = () => ({
	dim: 				Math.randInt(30,40),
	architecture: 		"cave",
	floorDensity: 		Math.rand(0.10,0.50),
	seedPercent: 		Math.rand(0.10,0.20),
	passageWander: 		0
});

ScapeList.snowyPlains = () => ({
	dim: 				40,
	architecture: 		"cave",
});

ScapeList.moonscape = () => ({
	dim: 				30,
	architecture: 		"cave",
	floorDensity: 		0.80,
	seedPercent: 		0.001,

});


// Within any category of rarity, like rCOMMON, you can give a chance that further alters the probability,
// for example rCOMMON: 'dog, 50% cat'
function themeValidateAndCondition(theme) {
	function extractRarityHash(theme,rarity,supplyMixed) {
		if( !supplyMixed ) {
			return;
		}
		theme['did'+rarity] = true;
		let supplyArray = Array.supplyParse(supplyMixed);
		supplyArray.forEach( supply => {
			console.assert( supply.count==1 );
			console.assert( supply.typeFilter );
			if( theme.rarityHash[supply.typeFilter] ) {
				// This placeId is duplicated in the same or another rarity table.
				debugger;
			}

			//console.log( theme.typeId,supply.typeFilter,'rarity',rarity);
			theme.rarityHash[supply.typeFilter] = rarity * supply.chance/100;
			if( !PlaceTypeList[supply.typeFilter] ) {
				debugger;
			}
		});
		theme['didRarity'+rarity] = true;
	}

	extractRarityHash(theme,rCOMMON,theme.rCOMMON);
	extractRarityHash(theme,rUNCOMMON,theme.rUNCOMMON);
	extractRarityHash(theme,rRARE,theme.rRARE);
	extractRarityHash(theme,rEPIC,theme.rEPIC);
	extractRarityHash(theme,rLEGENDARY,theme.rLEGENDARY);
	//console.log('rarityHash of',theme.typeId,theme.rarityHash);


	console.assert( theme.floorDensity||0  < 1.0);
	console.assert( theme.placeDensity||0  < 1.0);
	console.assert( theme.seedDensity||0   < 1.0);
	console.assert( theme.enemyDensity||0  < 0.3);
	console.assert( theme.friendDensity||0 < 0.3);
	console.assert( theme.itemDensity||0   < 0.3);
	console.assert( theme.palette );
	console.assert( !theme.palette.basis || PaletteList[theme.palette.basis] );
	theme.palette = Object.assign( {}, PaletteList.DEFAULT, PaletteList[theme.palette.basis], theme.palette );

	let supplyArray = Array.supplyParse( theme.rREQUIRED || '' );
	Array.supplyValidate( supplyArray, PlaceTypeList );

	if( window.JobTypeList && theme.jobSupply ) {
		let jobSupply = Array.supplyParse( theme.jobSupply || '' );
		Array.supplyValidate( jobSupply, JobTypeList );
	}
	if( window.JobTypeList && theme.jobPick ) {
		let pt = new Pick.Table().scanKeys(theme.jobPick);
		pt.validate(JobTypeList);
	}
}

let ThemeList = {};

/*
Themes intend you let you theme an area, as follows:
name
description
scapeId			- What is the landscape like, in terms of size, preferred architecture, etc.
palette			- what exact types are the wall, floor, etc.
	placeDensity: 	0.50,
	rREQUIRED: 		'goblinGathering',
	rCOMMON: 		'mushrooms, nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit, floodWater',
	rUNCOMMON: 		'secretChest, hoard_shade, antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 			'goblinGathering, demonNest, hellPortal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 			'graveYard',
	monsters: 		['isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isDemon'],
	enemyDensity: 	0.05,
	friendDensity: 	0.01,
*/


ThemeList.surface = {
	name: 			'the solar temple on the surface',
	description:	'a temple built to an ancient sun god.',
	isUnique: 		true,
	iDescribeMyGates: true,
	scapeId: 		'snowyPlains',
	palette: 		{ basis: 'stoneRooms' },
	rREQUIRED: 		'surfaceSunTemple',
	monsters: 		['isPet'],
	enemyDensity: 	0.0,
	friendDensity: 	0.0,
	itemDensity: 	0.0,

}

ThemeList.coreCavernRooms = {
	description:	'cavernous rooms',
	scapeId: 		'caveRoomsNarrowlyConnected', //'caveRoomsWellConnected',
	palette: 		{ basis: 'jaggedCave' },
	placeDensity: 	0.50,
	rREQUIRED: 		'goblinGathering',
	rCOMMON: 		'mushrooms, nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit, floodWater',
	rUNCOMMON: 		'secretChest, hoard_shade, antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 			'goblinGathering, demonNest, hellPortal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 			'graveYard',
	monsters: 		['isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isDemon'],
	enemyDensity: 	0.05,
	friendDensity: 	0.01,
}

ThemeList.wildlands = {
	name:			'cave wildlands',
	scapeId: 		'caveWildlands', //'caveRoomsWellConnected',
	palette: 		{ basis: 'jaggedCave' },
	placeDensity: 	0.10,
	rCOMMON: 		'mushrooms, nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit, floodWater,'+
					'secretChest, hoard_shade, antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle,'+
					'goblinGathering, demonNest, hellPortal, circle, ruin, swamp, etherHive, firePit, floodOre,'+
					'graveYard, miniMaze',
	monsters: 		['isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isDemon','isConstruct'],
	enemyDensity: 	0.05,
	friendDensity: 	0.01,
}

ThemeList.refugeeCamp = {
	name:		'a refugee camp',
	scapeId: 	'caveBroadWinding',
	palette: 	{ basis: 'jaggedCave' },
	rCOMMON: 	'camp_refugee',
	rUNCOMMON: 	'mushrooms, pen_sheep, handoutStand, floodPit, pitEncircle',
	rRARE: 		'secretChest, den_dog, camp_goblin',
	monsters: 	['isSunChild','isPet','isLivestock'],
	sign: 		'Bring your own supplies. We won\'t feed you.',
	jobPick: 	{ layman: 10, bowyer: 1, grocer: 1, brewer: 1, cobbler: 1, peddler: 1, sentry: 4, evangelist: 1 },
	enemyDensity: 	0.00,
	friendDensity: 	0.15,
	itemDensity:    0.0001,
}

ThemeList.refugeeCampSlaughter = {
	name:		'camp Remembrance',
	description:'a refugee camp at the edge of wild caves',
	scapeId: 	'caveSpacious',
	palette: 	{ basis: 'jaggedCave' },
	placeDensity: 	0.70,
	rREQUIRED: 	'camp_refugee, camp_refugee, camp_goblin, camp_ogre, floodOre',
	rCOMMON: 	'camp_refugee, camp_goblin',
	rUNCOMMON: 	'mushrooms, hoard_shade, pen_sheep, floodPit, pitEncircle, veil, ruin, den_kobold, camp_ogre',
	rRARE: 		'den_dog',
	monsters: 	['isSunChild','isPet','isEarthChild'],
	sign: 		'Refugee Camp "Prosperous Tranquility" Ahead',
	jobPick: 	{ layman: 10, bowyer: 1, grocer: 1, clothier: 1, brewer:1 ,scribe:1, armorer: 1, smith: 1, cobbler: 1, gaunter: 1, lapidary: 1, jeweler: 1, peddler: 1 },
	enemyDensity: 	0.08,
	friendDensity: 	0.08,
}

ThemeList.dwarfVillage = {
	description:	'a modest dwarven village carved from natural caves',
	isDwarfish:		true,
	isTown: 		true,
	scapeId: 		'caveTownSmall',
	palette: 		{ basis: 'jaggedCave', passageFloor: 'floorStone' },
	rREQUIRED: 		'garden, gatewayFromDwarves, dwarfTemple',
	rCOMMON: 		'garden, mushrooms, dwarfSmithy, shopSmall, shopOpenAir, dwarfHouseSmall',
	rUNCOMMON: 		'floodOreSmall, floodPitSmall, dwarfHouse, barrelStorage',
	rRARE: 			'firePit, floodWater',
	jobPick: 		{ layman: 3, miner: 2, sentry: 3, grocer: 1, botanist: 1, clothier: 1, bowyer: 1, brewer:1 ,scribe:1, armorer: 1, smith: 1, cobbler: 1, gaunter: 1, lapidary: 1, jeweler: 1, peddler: 1},
	prefer: 		['pit'],
	monsters: 		['isDwarf'],
	placeDensity:   0.70,
	enemyDensity: 	0.00,
	friendDensity: 	0.01,
	itemDensity:    0.0001,
}

ThemeList.dwarfTown = {
	description:	'a large bustling dwarven town',
	isDwarfish: 	true,
	isTown: 		true,
	scapeId: 		'caveTown',
	palette: 		{ basis: 'jaggedCave', passageFloor: 'floorStone' },
	rREQUIRED: 		'2x garden, mushrooms, dwarfSmithy, dwarfPlaza, market, shopLarge, shopSmall, 2x shopOpenAir, 2x floodOre, floodPit, '+
					'gatewayFromDwarves, 2x dwarfHouseSmall, 2x dwarfHouse, '+
					'dwarfTemple, 30% den_dog, 10% camp_human',
	rCOMMON: 		'mushrooms, garden, floodOre, market, shopLarge, shopSmall, shopOpenAir, dwarfHouseSmall, barrelStorage',
	rUNCOMMON: 		'floodPit, dwarfHouse',
	rRARE: 			'firePit, floodWater',
	jobPick: 		{ layman: 3, miner: 2, sentry: 3, grocer: 1, botanist: 1, clothier: 1, bowyer: 1, brewer:1 ,scribe:1, armorer: 1, smith: 1, cobbler: 1, gaunter: 1, lapidary: 1, jeweler: 1, peddler: 1, glassBlower: 1 },
	prefer: 		['pit'],
	monsters: 		['isDwarf'],
	enemyDensity: 	0.00,
	friendDensity: 	0.01,
	itemDensity:    0.0001,
}

ThemeList.corePits = {
	name:		'treacherous pits',
	description:'a cavernous region of treacherous pits',
	scapeId: 	'caveBroadWinding',
	palette: 	{ basis: 'jaggedCave' },
	rREQUIRED: 	'floodPitLarge, 3x floodPit, 4x mushrooms',
	rCOMMON: 	'floodPit, hoard_shade, nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold',
	rUNCOMMON: 	'mushrooms, secretChest, camp_human, antHive, tinyRoom, trollBridge, trollPit, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle, floodWater',
	rRARE: 		'goblinGathering, demonNest, hellPortal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 		'graveYard, lunarEmbassy',
	monsters: 	['power','isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isLunarChild','isDemon']
}

ThemeList.coreBridges = {
	name:		'strange bridges',
	description:'strange bridges streching over a massive abyss',
	palette: 	{ basis: 'jaggedCave', outlineWall:'pit', fillWall: 'pit' },
	scapeId: 	'caveMazeLike',
	rCOMMON: 	'floodPit, hoard_shade, nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodWater',
	rUNCOMMON: 	'mushrooms, secretChest, camp_human, antHive, trollBridge, trollPit, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 		'goblinGathering, tinyRoom, demonNest, hellPortal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 		'graveYard, lunarEmbassy',
	monsters: 	['power','isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isLunarChild','isDemon']
}

ThemeList.coreMaze = {
	name:		'maze',
	description:'twisting cave passages all different',
	scapeId: 	'caveMazeLike',
	palette: 	{ basis: 'jaggedCave' },
	rCOMMON: 	'mushrooms, demonNest, hoard_shade, nest_blueScarab, trollBridge, nest_viper, camp_ogre, etherHive, tinyRoom, barrelStorage',
	rUNCOMMON: 	'secretChest, floodPit, camp_goblin, den_kobold, nest_bat, antHive, trollPit, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle, miniMaze',
	rRARE: 		'camp_human, goblinGathering, hellPortal, circle, ruin, swamp, firePit, floodOre, floodWater',
	monsters: 	['isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isLunarChild','isDemon']
}

ThemeList.dwarfGoblinBattle = {
	name:		'battle cavern',
	description:'the site of a battle between dwarves and goblin forces',
	dim: 				30,
	architecture: 		"cave",
	floorDensity: 		0.88,
	seedPercent: 		0.20,
	placeDensity: 		0.70,
	passageWander: 		100,
	passageWidth2: 		50,
	palette: 	{ basis: 'jaggedCave' },
	rREQUIRED: 	'troops_dwarf, troops_goblin',
	rCOMMON: 	'floodPit, nest_bat, nest_viper',
	rUNCOMMON: 	'antHive, ruin, patch, veil, pitEncircle, floodOre',
	monsters: 	['isEarthChild','isSunChild','isPlanar','isAnimal'],
	sign: 		'Send reinforcements!'
}

ThemeList.coreCavernSomewhatOpen = {
	name:		'broad, winding caverns',
	scapeId: 	'caveBroadWinding',
	palette: 	{ basis: 'jaggedCave' },
	rCOMMON: 	'mushrooms, hoard_shade, nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit, floodWater',
	rUNCOMMON: 	'secretChest, camp_human, antHive, trollBridge, trollPit, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle, miniMaze',
	rRARE: 		'goblinGathering, demonNest, hellPortal, circle, ruin, swamp, etherHive, firePit, floodOre, barrelStorage',
	rEPIC: 		'graveYard, lunarEmbassy',
	monsters: 	['power','isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isLunarChild','isDemon']
}

ThemeList.coreSea = {
	name:				'underground sea',
	description:		'a vast sea stretches away',
	dim: 				90,
	architecture: 		"cave",
	floorDensity: 		0.58,
	seedPercent: 		0.40,
	placeDensity: 		0.50,
	passageWander: 		100,
	palette: 			{ basis: 'jaggedCave', outlineWall: 'water', fillWall: 'floorDirt' },
	rREQUIRED: 			'mushrooms, floodWater',
	rCOMMON: 			'floodWaterSmall',
	rUNCOMMON: 			'floodWall,miniMaze',
	monsters: 			['power','isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isLunarChild','isDemon'],
	enemyDensity: 		0.005,
	itemDensity: 		0.005,
}

ThemeList.coreSwamp = {
	name:				'swamplands',
	description:		'muddy, grim swamp land fed by dripping ground water',
	dim: 				30,
	architecture: 		"cave",
	floorDensity: 		0.28,
	seedPercent: 		0.40,
	placeDensity: 		0.70,
	passageWander: 		100,
	palette: 			{ basis: 'jaggedCave', outlineWall: 'mud', fillWall: 'mud' },
	rCOMMON: 			'mushrooms, floodMud',
	monsters: 			['power','isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isLunarChild','isDemon']
}

ThemeList.coreRooms = {
	name:				'rooms of shaped stone',
	dim: 				40,
	architecture: 		"rooms",
	floorDensity: 		0.25,
	shapeChances: 		{ circle: 0.1, rect: 0.9 },
	overlapChance: 		10,
	preferDoors: 		true,
	passageWander: 		30,
	passageWidth2: 		10,
	passageWidth3: 		0,
	placeDensity: 		0.35,
	passageWander: 		20,
	palette: 			{ basis: 'stoneRooms' },
	rCOMMON: 			'hoard_shade, nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit, floodWater',
	rUNCOMMON: 			'miniMaze, mushrooms, secretChest, antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 				'goblinGathering, demonNest, hellPortal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 				'graveYard',
	monsters: 			['isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isDemon'],
	enemyDensity: 		0.05,
	friendDensity: 	0.01,
}

ThemeList.coreMorphousRooms = {
	name:				'amorphous stone rooms',
	dim: 				40,
	architecture: 		"rooms",
	floorDensity: 		0.40,
	shapeChances: 		{ circle: 1.0, rect: 0.0 },
	overlapChance: 		100,
	preferDoors: 		true,
	passageWander: 		20,
	passageWidth2: 		0,
	passageWidth3: 		0,
	placeDensity: 		0.35,
	palette: 			{ basis: 'stoneRooms' },
	rCOMMON: 			'mushrooms, hoard_shade, nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit, floodWater',
	rUNCOMMON: 			'secretChest, antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 				'miniMaze, goblinGathering, demonNest, hellPortal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 				'graveYard',
	monsters: 			['isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isDemon'],
	enemyDensity: 		0.02,
	friendDensity: 		0.01,
}

ThemeList.coreMixedRooms = {
	name:				'mixed rooms',
	description:		'cave mixed with carved rooms',
	dim: 				40,
	architecture: 		"rooms",
	floorDensity: 		0.40,
	shapeChances: 		{ circle: 0.5, rect: 0.5 },
	overlapChance: 		10,
	preferDoors: 		true,
	passageWander: 		50,
	passageWidth2: 		10,
	passageWidth3: 		0,
	placeDensity: 		0.35,
	palette: 		{ basis: 'stoneRooms' },
	rCOMMON: 		'mushrooms, hoard_shade, nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit, floodWater',
	rUNCOMMON: 		'secretChest, antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 			'miniMaze, goblinGathering, demonNest, hellPortal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 			'graveYard',
	monsters: 		['isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isDemon'],
	enemyDensity: 	0.05,
	friendDensity: 	0.01,
}

ThemeList.coreHellTheme = {
	name:				'hellish abyss',
	description:		'land of poisonous fumes, pits and forboding',
	dim: 				80,
	architecture: 		"cave",
	floorDensity: 		0.58,
	seedPercent: 		0.30,
	passageWander: 		50,
	passageWidth2: 		50,
	placeDensity: 		0.05,
	palette: 		{ basis: 'jaggedCave' },
	rREQUIRED:  	'6x demonNest, miniMaze',
	rCOMMON: 		'mushrooms, hoard_shade, demonNest, firePit, miniMaze',
	rUNCOMMON: 		'nest_blueScarab, nest_redScarab, collonade, ruin, fountain1, floodPit, pitEncircle',
	rRARE: 			'secretChest, etherHive',
	prefer: 		['flames','mud'],
	monsters: 		['isDemon','isPlanar','isInsect'],
	enemyDensity: 	0.04,
	friendDensity: 	0.01,
}

ThemeList.coreFinalLevel = {
	name:				'deep temple',
	description:		'the looming temple of a dark god',
	dim: 				80,
	architecture: 		"rooms",
	floorDensity: 		0.30,
	shapeChances: 		{ circle: 1.0, rect: 0.0 },
	overlapChance: 		20,
	preferDoors: 		false,
	passageWander: 		100,
	passageWidth2: 		50,
	passageWidth3: 		0,
	placeDensity: 		0.10,
	palette: 		{ basis: 'stoneRooms' },
	rREQUIRED: 		'balgursChamber',
	rCOMMON: 		'demonNest, firePit, miniMaze',
	rUNCOMMON: 		'nest_blueScarab, nest_redScarab, collonade, ruin, fountain1, floodPit, pitEncircle',
	rRARE: 			'etherHive',
	prefer: 		['flames','mud'],
	monsters: 		['isDemon','isPlanar','isInsect'],
	enemyDensity: 	0.20,
	friendDensity: 	0.05,
}

ThemeList.hellTheme = {
	name:			'firey plains',
	description:	'grim plains framed by fire',
	dim: 			80,
	architecture: 	"cave",
	floorDensity: 	0.58,
	seedPercent: 	0.30,
	passageWander: 	50,
	passageWidth2: 	50,
	placeDensity: 	0.05,
	palette: 		{ basis: 'jaggedCave' },
	rREQUIRED:  	'6x demonNest, miniMaze',
	rCOMMON: 		'mushrooms, hoard_shade, demonNest, firePit',
	rUNCOMMON: 		'nest_blueScarab, nest_redScarab, collonade, ruin, fountain1, floodPit, pitEncircle, miniMaze',
	rRARE: 			'secretChest, etherHive',
	prefer: 		['flames','mud'],
	monsters: 		['isDemon','isPlanar','isInsect'],
	enemyDensity: 	0.04,
	friendDensity: 	0.01,
	gateType:		'portal',
}

ThemeList.spooky = {
	name:			'taste of living death',
	description:	'pall of death hangs over this place',
	scapeId: 		'caveRandom',
	palette: 		{ basis: 'spookyRooms' },
	rCOMMON: 		'graveYard, nest_bat, floodMist',
	rUNCOMMON: 		'ruin, nest_viper',
	rRARE: 			'shaft, fountain1, camp_human, swamp, miniMaze',
	rREQUIRED:		'floodMist,floodMist,floodMist',
	rEPIC: 			'hellPortal',
	prefer: 		['mist'],
	monsters: 		['isUndead'],
}

ThemeList.moonTheme = {
	name:			'moon',
	description:	'a bleak and lifeless plain framed by stars',
	isUnique: 		true,
	scapeId: 		'moonscape',
	palette: 		{ basis: 'moon' },
	rCOMMON: 		'mushrooms, garden, floodOre',	// floodOpen
	enemyDensity: 	0.00,
	friendDensity: 	0.01,
	itemDensity: 	0.005,
	monsters: 		['isLunarOne'], //['lunarMoth','isLunarChild'],
	gateType:		'portal',
	mapVars:	{
		name: 'Moon',
		isAirless: true,
		passiveEffectList: [
			{ name: 'vacuum', op: 'damage', value: 10, duration: 0, damageType: DamageType.FREEZE }
		]
	}
}

let themeDefaults = {
	isTheme:		true,
	rarityHash:		{},
	isUnique: 		false,

	palette: 		PaletteList.DEFAULT,

	architecture: 	"cave",
	floorDensity: 	0.68,
	placeDensity: 	0.40,
	seedPercent: 	0.10,

	jobPick: 		{ layman: 10, brewer: 1, peddler: 1, grocer: 1 },

	enemyDensity: 	0.08,
	friendDensity: 	0.00,
	itemDensity: 	0.03,

	containerChance: 80
}

ThemeList = Type.establish(
	"Theme",
	{
		defaults: themeDefaults,
		onRegister: theme => {
			theme.id = theme.typeId;
		},
		onFinalize: theme => {
			themeValidateAndCondition(theme);
		}
	},
	ThemeList
);

return {
	ScapeList: ScapeList,
	PaletteList: PaletteList,
	ThemeList: ThemeList,
}
});

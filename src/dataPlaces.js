Module.add('dataPlaces',function() {

let ScapeList = { };
let PaletteList = { };
let ThemeList = { };
let PlaceTypeList = { };

/*

THe level of a place can be specified, BUT if not the place will be scanned and assigned a level
equal to the highest level monster appearing

jobPick: as each is made it is decremented, meaning that sooner or later all of the types will get made. It
then resets again.

PlaceTypeList.uniqueIdentity = {
	// The map can use any symbols yu want. Just re-map them in the 'symbols' area below.
	// However, . and # are generally floor and wall, just to avoid confusion.
	map:
`
.......
`,
	symbols: {
		A: 'typeId'
		B: { typeFilter: 'weapon.sword', isSpecial: true },
		C: [ 'floor, 5x weapon.arrow, 50% potion', { chance: 20, typeFilter: 'ammo.dart', hasMagicTip: true }, ...]
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
*/
let rCOMMON 	= 1.00;
let rUNCOMMON 	= 0.50;
let rRARE 		= 0.20;
let rEPIC 		= 0.10;
let rLEGENDARY 	= 0.01;

function PlaceMany(prefix,list,templateFn) {
	let count = list.length;
	while( list.length ) {
		let VARIETY = list.pop();
		let placeId = prefix+'_'+VARIETY;
		PlaceTypeList[placeId] = templateFn(VARIETY);
		PlaceTypeList[placeId].rarity /= count;
	}
}

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


// Theme caps are for a 40x40 area. These will be ratiod to the size of the actual map.
// prefer - means that, when a pick choice needs to happen, that theme strongly (maybe 100%) prefers to chose that.
ScapeList.plainScape = () => ({
	dim: 				60,
	architecture: 		"plain",
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
	dim: 				Math.randInt(120,140),
	architecture: 		"cave",
	floorDensity: 		0.48,
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
	architecture: 		"plains",
});

let ThemeDefault = () => ({
	isUnique: 		false,

	palette: 		PaletteList.DEFUALT,

	architecture: 	"cave",
	floorDensity: 	0.68,
	placeDensity: 	0.40,
	seedPercent: 	0.10,

	jobPick: 		{ layman: 10, brewer: 1, peddler: 1, grocer: 1 },

	enemyDensity: 	0.08,
	friendDensity: 	0.00,
	itemDensity: 	0.03,

	containerChance: 50
});

ThemeList.surface = {
	name: 			'the solar temple on the surface',
	isUnique: 		true,
	inControl: 		true,
	scapeId: 		'snowyPlains',
	palette: 		{ basis: 'stoneRooms' },
	rREQUIRED: 		'surfaceSunTemple',
	monsters: 		['isPet'],
	enemyDensity: 	0.0,
	friendDensity: 	0.0,
	itemDensity: 	0.0,

}

ThemeList.coreCavernRooms = {
	scapeId: 		'caveRoomsNarrowlyConnected', //'caveRoomsWellConnected',
	palette: 		{ basis: 'jaggedCave' },
	placeDensity: 	0.50,
	rREQUIRED: 		'goblinGathering',
	rCOMMON: 		'nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit, floodWater',
	rUNCOMMON: 		'secretChest, hoard_shade, antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 			'goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 			'graveYard',
	monsters: 		['isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isDemon'],
	enemyDensity: 	0.05,
	friendDensity: 	0.01,
}

ThemeList.wildlands = {
	scapeId: 		'caveWildlands', //'caveRoomsWellConnected',
	palette: 		{ basis: 'jaggedCave' },
	placeDensity: 	0.10,
	rCOMMON: 		'nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit, floodWater,'+
					'secretChest, hoard_shade, antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle,'+
					'goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre,'+
					'graveYard',
	monsters: 		['isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isDemon','isConstruct'],
	enemyDensity: 	0.05,
	friendDensity: 	0.01,
}

ThemeList.refugeeCamp = {
	scapeId: 	'caveBroadWinding',
	palette: 	{ basis: 'jaggedCave' },
	rCOMMON: 	'camp_refugee',
	rUNCOMMON: 	'pen_sheep, handoutStand, floodPit, pitEncircle',
	rRARE: 		'secretChest, den_dog, camp_goblin',
	monsters: 	['isSunChild','isPet','isLivestock'],
	sign: 		'Bring your own supplies. We won\'t feed you.',
	jobPick: 	{ layman: 10, bowyer: 1, grocer: 1, brewer: 1, cobbler: 1, peddler: 1, sentry: 4, evangelist: 1 },
	enemyDensity: 	0.00,
	friendDensity: 	0.15,
	itemDensity:    0.0001,
}

ThemeList.refugeeCampSlaughter = {
	scapeId: 	'caveSpacious',
	palette: 	{ basis: 'jaggedCave' },
	placeDensity: 	0.70,
	rREQUIRED: 	'camp_refugee, camp_refugee, camp_goblin, camp_ogre, floodOre',
	rCOMMON: 	'camp_refugee, camp_goblin',
	rUNCOMMON: 	'hoard_shade, pen_sheep, floodPit, pitEncircle, veil, ruin, den_kobold, camp_ogre',
	rRARE: 		'den_dog',
	monsters: 	['isSunChild','isPet','isEarthChild'],
	sign: 		'Refugee Camp "Prosperous Tranquility" Ahead',
	jobPick: 	{ layman: 10, bowyer: 1, grocer: 1, clothier: 1, brewer:1 ,scribe:1, armorer: 1, smith: 1, cobbler: 1, gaunter: 1, lapidary: 1, jeweler: 1, peddler: 1 },
	enemyDensity: 	0.08,
	friendDensity: 	0.08,
}

ThemeList.dwarfVillage = {
	isDwarfish: true,
	isTown: 	true,
	scapeId: 	'caveTownSmall',
	palette: 	{ basis: 'jaggedCave', passageFloor: 'floorStone' },
	rREQUIRED: 	'gatewayFromDwarves',
	rCOMMON: 	'dwarfTemple, dwarfSmithy, shopSmall, shopOpenAir, dwarfHouseSmall',
	rUNCOMMON: 	'floodOreSmall, floodPitSmall, dwarfHouse, barrelStorage',
	rRARE: 		'firePit, floodWater',
	jobPick: 	{ layman: 10, sentry: 3, grocer: 1, clothier: 1, bowyer: 1, brewer:1 ,scribe:1, armorer: 1, smith: 1, cobbler: 1, gaunter: 1, lapidary: 1, jeweler: 1, peddler: 1 },
	prefer: 	['pit'],
	monsters: 	['isDwarf'],
	placeDensity:   0.70,
	enemyDensity: 	0.00,
	friendDensity: 	0.01,
	itemDensity:    0.0001,
}

ThemeList.dwarfTown = {
	isDwarfish: true,
	isTown: 	true,
	scapeId: 	'caveTown',
	palette: 	{ basis: 'jaggedCave', passageFloor: 'floorStone' },
	rREQUIRED: 	'dwarfSmithy, dwarfPlaza, market, shopLarge, shopSmall, 2x shopOpenAir, 2x floodOre, floodPit, '+
				'gatewayFromDwarves, 2x dwarfHouseSmall, 2x dwarfHouse, '+
				'70% dwarfTemple, 30% den_dog, 10% camp_human',
	rCOMMON: 	'floodOre, market, shopLarge, shopSmall, shopOpenAir, dwarfHouseSmall, barrelStorage',
	rUNCOMMON: 	'floodPit, dwarfHouse',
	rRARE: 		'firePit, floodWater',
	jobPick: 	{ layman: 10, sentry: 3, grocer: 1, clothier: 1, bowyer: 1, brewer:1 ,scribe:1, armorer: 1, smith: 1, cobbler: 1, gaunter: 1, lapidary: 1, jeweler: 1, peddler: 1 },
	prefer: 	['pit'],
	monsters: 	['isDwarf'],
	enemyDensity: 	0.00,
	friendDensity: 	0.01,
	itemDensity:    0.0001,
}

ThemeList.corePits = {
	scapeId: 	'caveBroadWinding',
	palette: 	{ basis: 'jaggedCave' },
	rREQUIRED: 	'floodPitLarge, 4x floodPit',
	rCOMMON: 	'floodPit, hoard_shade, nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold',
	rUNCOMMON: 	'secretChest, camp_human, antHive, tinyRoom, trollBridge, trollPit, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle, floodWater',
	rRARE: 		'goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 		'graveYard, lunarEmbassy',
	monsters: 	['power','isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isLunarChild','isDemon']
}

ThemeList.coreBridges = {
	palette: 	{ basis: 'jaggedCave', outlineWall:'pit', fillWall: 'pit' },
	scapeId: 	'caveMazeLike',
	rCOMMON: 	'floodPit, hoard_shade, nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodWater',
	rUNCOMMON: 	'secretChest, camp_human, antHive, trollBridge, trollPit, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 		'goblinGathering, tinyRoom, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 		'graveYard, lunarEmbassy',
	monsters: 	['power','isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isLunarChild','isDemon']
}

ThemeList.coreMaze = {
	scapeId: 	'caveMazeLike',
	palette: 	{ basis: 'jaggedCave' },
	rCOMMON: 	'demonNest, hoard_shade, nest_blueScarab, trollBridge, nest_viper, camp_ogre, etherHive, tinyRoom, barrelStorage',
	rUNCOMMON: 	'secretChest, floodPit, camp_goblin, den_kobold, nest_bat, antHive, trollPit, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 		'camp_human, goblinGathering, portal, circle, ruin, swamp, firePit, floodOre, floodWater',
	monsters: 	['isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isLunarChild','isDemon']
}

ThemeList.dwarfGoblinBattle = {
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
	scapeId: 	'caveBroadWinding',
	palette: 	{ basis: 'jaggedCave' },
	rCOMMON: 	'hoard_shade, nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit, floodWater',
	rUNCOMMON: 	'secretChest, camp_human, antHive, trollBridge, trollPit, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 		'goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre, barrelStorage',
	rEPIC: 		'graveYard, lunarEmbassy',
	monsters: 	['power','isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isLunarChild','isDemon']
}

ThemeList.coreSea = {
	dim: 				90,
	architecture: 		"cave",
	floorDensity: 		0.58,
	seedPercent: 		0.40,
	placeDensity: 		0.50,
	passageWander: 		100,
	palette: 			{ basis: 'jaggedCave', outlineWall: 'water', fillWall: 'floor' },
	rREQUIRED: 			'floodWater',
	rCOMMON: 			'floodWaterSmall',
	rUNCOMMON: 			'floodWall',
	monsters: 			['power','isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isLunarChild','isDemon'],
	enemyDensity: 		0.005,
	itemDensity: 		0.005,
}

ThemeList.coreSwamp = {
	dim: 				30,
	architecture: 		"cave",
	floorDensity: 		0.28,
	seedPercent: 		0.40,
	placeDensity: 		0.70,
	passageWander: 		100,
	palette: 			{ basis: 'jaggedCave', outlineWall: 'mud', fillWall: 'mud' },
	rCOMMON: 			'floodMud',
	monsters: 			['power','isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isLunarChild','isDemon']
}

ThemeList.coreRooms = {
	dim: 				40,
	architecture: 		"rooms",
	floorDensity: 		0.25,
	circleChance: 		10,
	overlapChance: 		10,
	preferDoors: 		true,
	passageWander: 		30,
	passageWidth2: 		10,
	passageWidth3: 		0,
	placeDensity: 		0.35,
	passageWander: 		20,
	palette: 		{ basis: 'stoneRooms' },
	rCOMMON: 		'hoard_shade, nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit, floodWater',
	rUNCOMMON: 		'secretChest, antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 			'goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 			'graveYard',
	monsters: 		['isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isDemon'],
	enemyDensity: 	0.05,
	friendDensity: 	0.01,
}

ThemeList.coreMorphousRooms = {
	dim: 				40,
	architecture: 		"rooms",
	floorDensity: 		0.40,
	circleChance: 		100,
	overlapChance: 		100,
	preferDoors: 		true,
	passageWander: 		20,
	passageWidth2: 		0,
	passageWidth3: 		0,
	placeDensity: 		0.35,
	palette: 		{ basis: 'stoneRooms' },
	rCOMMON: 		'hoard_shade, nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit, floodWater',
	rUNCOMMON: 		'secretChest, antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 			'goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 			'graveYard',
	monsters: 		['isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isDemon'],
	enemyDensity: 	0.05,
	friendDensity: 	0.01,
}

ThemeList.coreMixedRooms = {
	dim: 				40,
	architecture: 		"rooms",
	floorDensity: 		0.40,
	circleChance: 		50,
	overlapChance: 		10,
	preferDoors: 		true,
	passageWander: 		50,
	passageWidth2: 		10,
	passageWidth3: 		0,
	placeDensity: 		0.35,
	palette: 		{ basis: 'stoneRooms' },
	rCOMMON: 		'hoard_shade, nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit, floodWater',
	rUNCOMMON: 		'secretChest, antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 			'goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 			'graveYard',
	monsters: 		['isUndead','isEarthChild','isPlanar','isAnimal','isInsect','isDemon'],
	enemyDensity: 	0.05,
	friendDensity: 	0.01,
}

ThemeList.coreHellscape = {
	dim: 				80,
	architecture: 		"cave",
	floorDensity: 		0.58,
	seedPercent: 		0.30,
	passageWander: 		50,
	passageWidth2: 		50,
	placeDensity: 		0.05,
	palette: 		{ basis: 'jaggedCave' },
	rREQUIRED:  	'6x demonNest',
	rCOMMON: 		'hoard_shade, demonNest, firePit',
	rUNCOMMON: 		'nest_blueScarab, nest_redScarab, collonade, ruin, fountain1, floodPit, pitEncircle',
	rRARE: 			'secretChest, etherHive',
	prefer: 		['flames','mud'],
	monsters: 		['isDemon','isPlanar','isInsect'],
	enemyDensity: 	0.04,
	friendDensity: 	0.01,
}

ThemeList.coreFinalLevel = {
	dim: 				80,
	architecture: 		"rooms",
	floorDensity: 		0.30,
	circleChance: 		100,
	overlapChance: 		20,
	preferDoors: 		false,
	passageWander: 		100,
	passageWidth2: 		50,
	passageWidth3: 		0,
	placeDensity: 		0.10,
	palette: 		{ basis: 'stoneRooms' },
	rREQUIRED: 		'balgursChamber',
	rCOMMON: 		'demonNest, firePit',
	rUNCOMMON: 		'nest_blueScarab, nest_redScarab, collonade, ruin, fountain1, floodPit, pitEncircle',
	rRARE: 			'etherHive',
	prefer: 		['flames','mud'],
	monsters: 		['isDemon','isPlanar','isInsect'],
	enemyDensity: 	0.20,
	friendDensity: 	0.05,
}

ThemeList.spooky = {
	scapeId: 	'caveRandom',
	palette: 	{ basis: 'stoneRooms' },
	rCOMMON: 	'graveYard, nest_bat, floodMist',
	rUNCOMMON: 	'ruin, nest_viper',
	rRARE: 		'shaft, fountain1, camp_human, swamp',
	rEPIC: 		'portal',
	prefer: 	['mist'],
	monsters: 	['isUndead'],
}


//=========================
/*
ThemeList.cavern = {
	scapeId: 	'caveRandom',
	rREQUIRED: 	'gatewayToDwarves',
	rCOMMON: 	'nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit, floodWater',
	rUNCOMMON: 	'camp_human, antHive, trollBridge, trollPit, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 		'den_dog, goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit',
	rEPIC: 		'graveYard, lunarEmbassy',
	monsters: 	['power','isUndead','isEarthChild','isPlanar','isAnimal','isLunarChild']
}

ThemeList.thePits = {
	scapeId: 	'caveRandom',
	rCOMMON: 	'floodPit',
	monsters: 	['isUndead'],
	placeDensity: 0.5
}

ThemeList.spookyPits = {
	scapeId: 	'caveRandom',
	rCOMMON: 	'floodPit',
	monsters: 	['isUndead'],
	placeDensity: 0.5
}

ThemeList.ruins = {
	scapeId: 	'caveRandom',
	rCOMMON: 	'camp_ogre, camp_goblin, nest_blueScarab, nest_redScarab',
	rUNCOMMON: 	'collonade, ruin, fountain1, antHive, floodPit, pitEncircle',
	rRARE: 		'floodWater, swamp, demonNest',
	rEPIC: 		'portal',
	monsters: 	['isEarthChild','isAnimal'],
}

ThemeList.hellscape = {
	scapeId: 	'caveRandom',
	rCOMMON: 	'demonNest, firePit',
	rUNCOMMON: 	'nest_blueScarab, nest_redScarab, collonade, ruin, fountain1, floodPit, pitEncircle',
	rRARE: 		'etherHive',
	prefer: 	['flames','mud'],
	monsters: 	['isDemon','isPlanar'],
	//items: 		['isGem'],
}

ThemeList.lunarColony = {
	scapeId: 	'caveRandom',
	rCOMMON: 	'lunarEmbassy',
	rRARE: 		'etherHive',
	rEPIC: 		'portal',
	monsters: 	['isLunarChild','isPlanar'],
}

ThemeList.sunPlane = {
	scapeId: 	'caveRandom',
	rREQUIRED: 	'sunDiscipleTemple',
	rEPIC: 		'portal',
	monsters: 	['isSunChild','isPlanar'],
}
*/

PlaceTypeList.gateUpMinimal = {
	map:
`
#####
#b..#.
#U..+.
#b..#.
#####
`,
	rarity: rUNCOMMON,
	isUtility: true,
	forbidEnemies: true,
	forbidTreasure: true,
	flags: { rotate: false },
	symbols: {
		U: 'stairsUp',
		b: 'brazier',
		'+': { typeFilter: 'door', state: 'shut' },
	}
}

PlaceTypeList.gateUpChamber = {
	map:
`
 #####
##...#.
#U...+.
##...#.
 #####
`,
	rarity: rUNCOMMON,
	isUtility: true,
	forbidEnemies: true,
	forbidTreasure: true,
	flags: { rotate: false },
	symbols: {
		U: 'stairsUp',
		'+': { typeFilter: 'door', state: 'shut' },
	}
}

PlaceTypeList.gateDown = {
	map:
`
 . 
.D.
 . 
`,
	rarity: rUNCOMMON,
	isUtility: true,
	forbidEnemies: true,
	forbidTreasure: true,
	flags: { rotate: false },
	symbols: {
		D: 'stairsDown',
	}
}

PlaceTypeList.gateDownChamber = {
	map:
`
 #####
##pfp##
#ppppp#
#D....+
#ppppp#
##pfp##
 #####
`,
	rarity: rUNCOMMON,
	isUtility: true,
	forbidEnemies: true,
	forbidTreasure: true,
	flags: { rotate: false },
	symbols: {
		D: 'stairsDown',
		p: 'pit',
		f: 'fountain'
	}
}

PlaceTypeList.gateSide = {
	map:
`
ppp
.Gp
ppp
`,
	rarity: rUNCOMMON,
	isUtility: true,
	forbidEnemies: true,
	forbidTreasure: true,
	flags: { rotate: false },
	symbols: {
		G: 'gateway',
		p: 'pit',
	}
}

PlaceTypeList.gatePortal = {
	map:
`
...
.P.
...
`,
	rarity: rUNCOMMON,
	isUtility: true,
	forbidEnemies: true,
	forbidTreasure: true,
	flags: { rotate: false },
	symbols: {
		P: 'portal',
	}
}

PlaceTypeList.fontSolar = {
	map:
`
g..
.S.
..g
`,
	rarity: rUNCOMMON,
	isUtility: true,
	forbidEnemies: true,
	forbidTreasure: true,
	flags: { rotate: true },
	symbols: {
		S: 'fontSolar',
		g: 'gem'
	}
}

PlaceTypeList.fontDeep = {
	map:
`
...
.D.
...
`,
	rarity: rUNCOMMON,
	isUtility: true,
	forbidEnemies: true,
	forbidTreasure: true,
	flags: { rotate: false },
	symbols: {
		D: 'fontDeep',
	}
}

PlaceTypeList.floodMud = {
	floodId: 'mud',
	tilePercent: 0.01,
	sparkId: 'water',
	sparkLimit: 4000,
	sparkDensity: 0.30
}

PlaceTypeList.floodWater = {
	floodId: 'water',
	tilePercent: 0.20,
	sparkId: 'floor',
	sparkLimit: 4,
	sparkDensity: 0.02
}

PlaceTypeList.floodWaterSmall = {
	floodId: 'water',
	tilePercent: 0.10,
	sparkId: 'floor',
	sparkLimit: 4,
	sparkDensity: 0.02
}

PlaceTypeList.floodWaterHuge = {
	floodId: 'water',
	tilePercent: 0.60,
	sparkId: 'floor',
	sparkLimit: 4,
	sparkDensity: 0.02
}

PlaceTypeList.floodIsland = {
	floodId: 'floor',
	tilePercent: 0.20,
	sparkId: 'water',
	sparkLimit: 1,
	sparkDensity: 1.00

}

PlaceTypeList.floodWall = {
	floodId: 'wallCave',
	tilePercent: 0.10,
	sparkId: 'floor',
	sparkLimit: 2,
	sparkDensity: 0.3
}



PlaceTypeList.floodMist = {
	floodId: 'mist',
	tilePercent: 0.20,
}

PlaceTypeList.floodOre = {
	floodId: 'oreVein',
	tilePercent: 0.20,
	sparkId: 'floor',
	sparkLimit: 2,
	sparkDensity: 0.005
}

PlaceTypeList.floodOreSmall = {
	floodId: 'oreVein',
	tilePercent: 0.10,
	sparkId: 'floor',
	sparkLimit: 2,
	sparkDensity: 0.005
}

PlaceTypeList.floodPit = {
	floodId: 'pit',
	tilePercent: 0.20,
	sparkId: 'floor',
	sparkLimit: 4,
	sparkDensity: 0.02
}
PlaceTypeList.floodPitSmall = {
	floodId: 'pit',
	tilePercent: 0.10,
	sparkId: 'floor',
	sparkLimit: 4,
	sparkDensity: 0.02
}
PlaceTypeList.floodPitLarge = {
	floodId: 'pit',
	tilePercent: 0.40,
	sparkId: 'floor',
	sparkLimit: 4,
	sparkDensity: 0.01
}

PlaceTypeList.firePit = {
	floodId: 'pit',
	tilePercent: 0.20,
	sparkId: 'flames',
	sparkLimit: 3,
	sparkDensity: 1.00

}

PlaceTypeList.pitEncircle = {
	floodId: 'floor',
	tilePercent: 0.20,
	sparkId: 'pit',
	sparkLimit: 1,
	sparkDensity: 1.00

}

PlaceTypeList.secretChest = {
	map:
		`
		xxx.
		xc..
		xxx.
		`,
	flags: { rotate: true },
	symbols: {
		c: 'chest',
		x: { typeFilter: 'wallCave', invisible: true, opacity: 0 },
	}
}

PlaceTypeList.goblinGathering = {
	map:
`
.......
.x.P.x.
...A...
..ggg..
.......
`,
	flags: { rotate: true },
	symbols: {
		g: 'goblin',
		A: 'goblinAltar',
		P: 'goblinPriest',
		x: 'brazier'
	},
	stickers: {
		darkPower: { img: "effect/bolt08.png", scale: 0.6, xAnchor: 0.5, yAnchor: 0.5 }
	},
	tileTypes: {
	},
	itemTypes: {
		goblinAltar: { mayWalk: false, mayFly: false, name: "goblin altar", rechargeTime: 4, img: "dc-dngn/altars/dngn_altar_jiyva01.png", neverPick: true }
	},
	monsterTypes: {
		goblinPriest: {
			core: [ SYM, 1, '3:10', 'evil', 'rot', 'sentient', 'humanoid', 'dc-mon/gnoll.png', '*' ],
			attitude: Attitude.WORSHIP,
			brainIgnoreClearShots: 20,
			brainMindset: 'greedy',
			greedField: 'isGem',
			isGoblin: true,
			isEarthChild: true,
			inventoryLoot: '40% spell.eRot',
			loot: '50% coin, 20% weapon.mace, 20% any, 30% pinchOfEarth',
			sayPrayer: 'Oh mighty Thagzog...',
			shout: 'Death to all heretic overworld invaders!',
			resist: DamageType.ROT,
		},
	},
	inject: {
		goblin: { attitude: Attitude.WORSHIP }
	}
};

PlaceTypeList.goblinGathering.itemTypes.goblinAltar.onTick = function(dt) {
	if( !this.rechargeLeft ) {
		let f = new Finder(this.area.entityList,this).filter(e=>e.isGoblin && e.health<e.healthMax/2).shotClear().near(this.x,this.y,6);
		if( f.count ) {
			let entity = pick(f.all);
			let amount = Math.floor(entity.healthMax/2 - entity.health);
			entity.takeHealing(this,amount,DamageType.ROT,true);
			tell( mSubject,this,' ',mVerb,'imbue',' ',mObject,entity,' with dark power.');
			Anim.Homing(this.id,this,entity,StickerList.bloodGreen.img,45,6,0.5,5);
			this.rechargeLeft = this.rechargeTime;
		}
	}
	this.glow = !this.rechargeLeft;
	this.light = this.rechargeLeft ? 0 : 4;
}

PlaceTypeList.surfaceSunTemple = {
	map:
`
        #########
      ###.......###
    ###...........###
   ##...............##
   #........b........#
  ##......b...b......##
  #...................#
 ##...................##
 #.....................#
 #....b.......1.2.3.8.b########
##.....................#..d..##
#F...b....X.A..........D...L.S#
##.....................#.....##
 #....b.......4.5.6.7.b########
 #.....................#
 ##...................##
  #...................#
  ##......b...b......##
   #........b........#
   ##...............##
    ###...........###
      ###.......###
        #########
`,
	flags: { rotate: true, hasWall: true, isUnique: true },
	onLoot: (self,toucher) => {
		effectApply( { basis: 'eKillLabel', value: 'starterChest' }, self.map, self, null, 'loot');
		toucher.name = self.scionName;
	},
	symbols: {
		'1': [{
			typeFilter: 'chest',
			label: 'starterChest',
			isHidden: true,
			sign: 'Legacy of Hathgar the mighty.',
			name: 'Hathgar\'s Chest',
			scionName: 'Scion of Hathgar',
			properNoun: true,
			inventoryLoot: [
				'weapon.sword.eSmite, armor.eInert, 2x potion.eHealing',
				{ typeFilter: 'key', keyId: 'Solar Temple door' }
			],
			onLoot: (self,toucher) => PlaceTypeList.surfaceSunTemple.onLoot(self,toucher)
		}],
		'2': [{
			typeFilter: 'chest',
			label: 'starterChest',
			isHidden: true,
			sign: 'Legacy of Ozymandius the destroyer.',
			name: 'Ozymandius\' Chest',
			scionName: 'Scion of Ozymandius',
			properNoun: true,
			inventoryLoot: [
				'spell.eBurn, spell.eFreeze, cloak.eRechargeFast, 2x potion.eHealing',
				{ typeFilter: 'key', keyId: 'Solar Temple door' }
			],
			onLoot: (self,toucher) => PlaceTypeList.surfaceSunTemple.onLoot(self,toucher)
		}],
		'3': [{
			typeFilter: 'chest',
			label: 'starterChest',
			isHidden: true,
			sign: 'Legacy of Slyndero the clever.',
			name: 'Slyndero\'s Chest',
			scionName: 'Scion of Slyndero',
			properNoun: true,
			inventoryLoot: [
				'gloves.assassinGloves, spell.eTeleport, spell.eInvisibility, potion.eOdorless, gem.eSeeInvisible, 2x potion.eHealing',
				{ typeFilter: 'key', keyId: 'Solar Temple door' }
			],
			onLoot: (self,toucher) => PlaceTypeList.surfaceSunTemple.onLoot(self,toucher)
		}],
		'4': [{
			typeFilter: 'chest',
			label: 'starterChest',
			isHidden: true,
			sign: 'Legacy of Duramure the steadfast.',
			name: 'Duramure\'s Chest',
			scionName: 'Scion of Duramure',
			properNoun: true,
			inventoryLoot: [
				'weapon.hammer.eInert, armor.eInert, shield.eInert, 2x potion.eHealing',
				{ typeFilter: 'key', keyId: 'Solar Temple door' }
			],
			onLoot: (self,toucher) => PlaceTypeList.surfaceSunTemple.onLoot(self,toucher)
		}],
		'5': [{
			typeFilter: 'chest',
			label: 'starterChest',
			isHidden: true,
			sign: 'Legacy of Arithern the accurate.',
			name: 'Arithern\'s Chest',
			scionName: 'Scion of Arithern',
			properNoun: true,
			inventoryLoot: [
				'armor.eInert, weapon.bow.eSmite, 50x ammo.arrow, 5x ammo.dart, 2x potion.eHealing',
				{ typeFilter: 'key', keyId: 'Solar Temple door' }
			],
			onLoot: (self,toucher) => PlaceTypeList.surfaceSunTemple.onLoot(self,toucher)
		}],
		'6': [{
			typeFilter: 'chest',
			label: 'starterChest',
			isHidden: true,
			sign: 'Legacy of Berthold the blessed.',
			name: 'Berthold\'s Chest',
			scionName: 'Scion of Berthold',
			properNoun: true,
			inventoryLoot: [
				'armor.eInert, spell.eHealing, spell.eSmite, shield.eAbsorbRot, stuff.oilLamp, weapon.hammer, 4x potion.eHealing, stuff.lumpOfMeat',
				{ typeFilter: 'key', keyId: 'Solar Temple door' }
			],
			onLoot: (self,toucher) => PlaceTypeList.surfaceSunTemple.onLoot(self,toucher)
		}],
		'7': [{
			// This would work better if I could stash my body in a chest, or something.
			typeFilter: 'chest',
			label: 'starterChest',
			isHidden: true,
			sign: 'Legacy of Gadriin the mindshaper.',
			name: 'Gadriin\'s Chest',
			scionName: 'Scion of Gadriin',
			properNoun: true,
			inventoryLoot: [
				'spell.ePossess, spell.eConfusion, stuff.voidCandle, 4x ammo.dart.eStartle, 2x potion.eHealing, 3x gem, 3x stuff.lumpOfMeat',
				{ typeFilter: 'key', keyId: 'Solar Temple door' }
			],
			onLoot: (self,toucher) => PlaceTypeList.surfaceSunTemple.onLoot(self,toucher)
		}],
		'8': [{
			// This would work better if I could stash my body in a chest, or something.
			typeFilter: 'chest',
			label: 'starterChest',
			isHidden: true,
			sign: 'Legacy of Beowulf the bear.',
			name: 'Beowulf\'s Chest',
			scionName: 'Scion of Beowulf',
			properNoun: true,
			inventoryLoot: [
				'2x stuff.bearFigurine, weapon.sword, 2x potion.eHealing, 4x stuff.lumpOfMeat',
				{ typeFilter: 'key', keyId: 'Solar Temple door' }
			],
			onLoot: (self,toucher) => PlaceTypeList.surfaceSunTemple.onLoot(self,toucher)
		}],
		L: 'stuff.candleLamp',
		X: { typeFilter: 'marker', markerId: 'playerStartHere' },
		D: { typeFilter: 'door', state: 'locked', keyId: 'Solar Temple door' },
		F: "fontSolar",
		A: { typeFilter: 'altar', unhide: 'starterChest', inventoryLoot: 'weapon.solarBlade' },
		b: "brazier",
		S: "stairsDown",
		d: "dog"
	},
}

PlaceTypeList.graveYard = {
	map:
`
..M.M...B.MMM
.Bs....M..s.M
.M..B.M...BM.
.sB.xxxxx.M..
.MM.x*s*x.Bs.
.B..xFS.+....
.sM.x*s.x.M..
BM..xxxxx...M
..B.MM...M...
..M.s..sB..M.
M...B..M.....
`,
	flags: { rotate: true },
	symbols: {
		x: "wallStone",
		M: "mist",
		F: "crystal",
		B: "obelisk",
		s: "skeleton",
		S: "skeletonLg",
	}
}

PlaceTypeList.circle = {
	map:
`
.........
...xxx...
..xxxxx..
.xx...xx.
.xx.c....
.xx...xx.
..xxxxx..
...xxx...
`,
	flags: { rotate: true },
	symbols: {
		x: { pick: ['pit','flames','lava','water','mist','mud','forcefield'] },
		c: 'chest',
	}
}

PlaceTypeList.ruin = {
	map:
`
.o...
.sb.a
a.o..
..*a.
.a...
`,
	flags: { rotate: true },
	symbols: {
		s: 'shadow',
		o: 'columnBroken',
		a: 'columnStump',
		b: 'barrel',
	}
}

PlaceTypeList.tinyRoom = {
	map:
`
.....
.#+#.
.+c+.
.#+#.
.....
`,
	flags: { rotate: false },
	symbols: {
		c: 'chest',
	}
}

PlaceTypeList.shaft = {
	map:
`
...
.s.
...
`,
	flags: { },
	symbols: {
		s: 'shaft'
	}
}

PlaceTypeList.collonade = {
	map:
`
.............
.o....o....o.
.............
.............
.o....o....o.
.............
`,
	flags: { rotate: true },
	symbols: {
		o: { pick: ['columnBroken','columnStump'] }
	}
}

PlaceTypeList.barrelStorage = {
	map:
`
xxxxx
xbbbx
xbbbx
x...x
xx+xx
`,
	flags: { rotate: true },
	symbols: {
		b: 'barrel'
	}
}

PlaceTypeList.fountain1 = {
	map:
`
...
.F.
...
`,
	flags: { rotate: true },
	symbols: {
		'.': 'floorStone',
		F: 'fountain',
	}
}

PlaceTypeList.fountain4 = {
	map:
`
F.F
...
F.F
`,
	flags: { },
	symbols: {
		F: 'fountain',
	}
}

PlaceTypeList.patch = {
	map:
`
..mm..
.mmmm.
..mm..
`,
	flags: { rotate: true },
	symbols: {
		m: { pick: ['mud','grass','pit','flames','water','mist'] }
	}
};

PlaceTypeList.veil = {
	map:
`
mmmm
`,
	flags: { rotate: true },
	symbols: {
		m: { pick: ['flames','mist','mud'] }
	}
};

PlaceTypeList.lunarEmbassy = {
	map:
`
#######.
#...**#.
#g..l.#l
#Al...+.
#g....#l
#..ls.#.
#######
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'#': 'wallStone',
		g: 'gem',
		s: 'spell',
		A: 'altar',
		l: 'lunarOne',
	}
}

PlaceMany( 'hoard', ['shade'], VARIETY => ({
	map:
`
mm
mm
`,
	flags: { rotate: true },
	symbols: {
		m: VARIETY,
	},
	inject: {
		shade: { attitude: Attitude.HUNT },
	}

}));

PlaceMany( 'camp', ['ogre','human','refugee','goblin'], VARIETY => ({
	map:
`
.y.
yuy
.y.
`,
	flags: { rotate: true },
	symbols: {
		y: VARIETY,
		u: 'brazier',
	},
	inject: {
		ogre: { attitude: Attitude.AWAIT, tether: 8, tooClose: 2 },
		human: { attitude: Attitude.WANDER, tether: 1 },
		goblin: { attitude: Attitude.AWAIT, tether: 8, tooClose: 4 }
	}

}));

PlaceMany( 'nest', ['blueScarab','redScarab','viper'], VARIETY => ({
	map:
`
.x-x.
x-y-x
-ycy-
x-.-x
.x-x.
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		x: 'wallCave',
		'-': 'mud',
		c: 'chest',
		y: VARIETY
	},
	inject: {
		viper: { attitude: Attitude.WANDER, tether: 2, tooClose: 2 },
		redScarab: { attitude: Attitude.AGGRESSIVE, tether: 2 },
		blueScarab: { attitude: Attitude.AGGRESSIVE, tether: 2 }
	}
}));

PlaceMany( 'nest', ['bat'], VARIETY => ({
	map:
`
b:::b
:::::
:::::
:::::
b:::b
`,
	flags: { rotate: true },
	symbols: {
		':': 'pit',
		b: VARIETY
	},
	inject: {
		bat: { attitude: Attitude.WANDER, tether: 7 },
	}
}));


PlaceMany( 'den', ['dog','kobold'], VARIETY => ({
	map:
`
 xxxxxx
xxy*.yx
xy.....
x.byxxx
xxxxx  
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		x: "wallCave",
		b: 'barrel',
		y: VARIETY
	},
	inject: {
		dog: { attitude: Attitude.WANDER, tether: 4, tooClose: 1 },
		kobold: { tether: 2 }
	}
}));

PlaceMany( 'pen', ['sheep'], VARIETY => ({
	map:
`
....
.ss.
.ss.
....
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		x: "wallCave",
		s: { typeFilter: VARIETY, attitude: Attitude.WANDER, tether: 2, tooClose: 1 },
	}
}));


PlaceTypeList.swamp = {
	map:
`
.mmmmmmmmmmm.
mmwwwfmmwwwmm
mwwwwwwwwmwmm
mmwwwfmwmwwmm
mwwww*mmwmfmm
mmmwcwmwwwmmm
mfwwwmwfmwwmm
mmfwwf*wwwwmm
mmwmmwmwwmwmm
mmmwfwwwmwwmm
mwwwwmwwwfwwm
mmwmwwmmwwwwm
.mmmmmmmmmmm.
`,
	flags: { rotate: true },
	symbols: {
		m: "mud",
		w: "water",
		f: "spinyFrog",
		c: 'chest',
	},
	inject: {
		spinyFrog: { attitude: Attitude.WANDER, tether: 3, tooClose: 3 },
	}
}
PlaceTypeList.etherHive = {
	map:
`
x..xx
x....
.eee.
....x
xx..x
`,
	flags: { rotate: true },
	symbols: {
		x: "wallCave",
		e: 'ethermite',
	}
}
PlaceTypeList.antHive = {
	map:
`
#.#####
#.#a*a#
#.#aaa#
#.##..#
##.##.#
 ##...#
  #####
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		a: "soldierAnt"
	}
}
PlaceTypeList.demonNest = {
	map:
`

LffLf
fiDff
fLiDL
LDiff
fLffL
`,
	flags: { rotate: true },
	symbols: {
		L: "lava",
		f: "flames",
		D: 'demon',
		i: 'imp'
	}
}
PlaceTypeList.balgursChamber = {
	map:
`
###########
#LLDDDDDLL#
#L..DDD.iL#
#cf..a..fc#
#..i..f...#
#.......i.#
#.i.f...f.#
#..f...f..#
#L.i.f.i.L#
#LL.....LL#
#####F#####
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		L: "lava",
		f: "flames",
		F: 'forcefield',
		D: 'demon',
		i: 'imp',
		a: 'avatarOfBalgur',
		c: 'chest',
	}
}
PlaceTypeList.portal = {
	map:
`
  MMMMM  
 MM,,,MM 
MM,,,,,MM
M,,~c~,,M
M,,,P,,,e
M,,~c~,,M
MM,,,,,MM
 MM,,,MM 
  MMMMM  
`,
	flags: { rotate: true },
	symbols: {
		',': 'grass',
		'~': 'water',
		M: "mist",
		P: "portal",
		e: 'ethermite',
		c: 'chest',
	},
	inject: {
		portal: { themeId: 'hellscape' }
	}
}

PlaceTypeList.trollBridge = {
	map:
`
xxxxx
:::::
..T..
:::::
xxxxx
`,
	flags: { rotate: true },
	symbols: {
		x: 'wallCave',
		T: 'troll', //{ typeFilter: 'troll', attitude: Attitude.AWAIT, tooClose: 2 },
		':': 'pit'
	},
	inject: {
		troll: { attitude: Attitude.AWAIT, tooClose: 2 }
	}
}

PlaceTypeList.trollPit = {
	map:
`
  ::::::
::::...:
..T..c.:
::::...:
  ::::::
`,
	flags: { rotate: true },
	symbols: {
		T: 'troll',
		':': 'pit',
		c: 'chest',
	},
	inject: {
		troll: { attitude: Attitude.AWAIT, tooClose: 2 }
	}
}


PlaceTypeList.sunDiscipleTemple = {
	map:
`
xxxxxxxxxxx...........
x.....x...x...........
x.s...x...x..F..B..G..
xSr...+...x...........
x.s...x...xxxxxxxxxxx.
x.....x...x.........x.
xxxxxxx...x.........x.
x.....x...x.........x.
x.h...x...x...u$....x.
xSaw..+.......KAg...+.
x.b...x...x...u$....x.
x.....x...x.........x.
xxxxxxx...x.........x.
x.....x...x.........x.
x.pp..x...xxxxxxxxxxx.
xS$$..+...x...........
x.pp..x...x..F..B..G..
x.....x...x...........
xxxxxxxxxxx...........
`,
	flags: { rotate: false, hasWall: true },
	symbols: {
		'.': 'floorStone',
		x: "wallStone",
		u: 'brazier',
		S: 'masterStatue',
		K: 'kingStatue',
		A: 'altar',
		F: "crystal",
		G: "ghostStone",
		B: "obelisk",
		'$': 'coin',
		a: 'armor',
		w: 'weapon',
		h: 'helm',
		g: 'gem',
		b: 'boots',
		r: 'ring',
		p: 'potion',
	},
	tileTypes: {
		masterStatue:    { mayWalk: false, mayFly: true, opacity: 0, name: "master statue", img: "dc-mon/statues/silver_statue.png"},
		kingStatue:    { mayWalk: false, mayFly: true, opacity: 0, name: "king statue", img: "dc-mon/statues/wucad_mu_statue.png"},
	}
}

PlaceTypeList.handoutStand = {
	map:
		`
		     xxxxx
		.....,,,bx
		rrrrrp,,bx
		.....,,,bx
		.....x,,,x
		 ....xxpxx
		   ....... 
		`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		r: "refugee",
		p: "philanthropist",
		',': "floorStone",
		x: "wallStone",
		b: 'barrel',
	},
	inject: {
		philanthropist: { attitude: Attitude.AWAIT, tether: 0 },
		refugee: { attitude: Attitude.AWAIT, tether: 2 },
	}
}


PlaceTypeList.gatewayToDwarves = {
	map:
`
xxxxxxx 
xxxGxxx
xb.d.bx
x.....x
x.....x
x.....x
xxx+xxx
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "floorStone",
		x: "wallStone",
		G: "gateway",
		b: "brazier",
		d: "dwarf",
	},
	inject: {
		dwarf: { name: "dwarf herald", attitude: Attitude.WANDER, tether: 3, jobId: 'isSentry'  },
		gateway: { themeId: 'dwarfTown' },
	}
}

PlaceTypeList.gatewayFromDwarves = {
	map:
`
  xxx  
 wxGxw 
 w...w 
ww...ww
wb...bw
ww...ww
 ..... 
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "floorStone",
		x: "wallStone",
		w: "wallCave",
		G: "gateway",
		b: "brazier",
		d: "dwarf",
	}
}

PlaceTypeList.dwarfTemple = {
	map:
`
 xxxxxxx 
 xfcAcfx 
xx.....xx
xb..d..bx
x.......x
xb.....bx
x.......x
xb.....bx
x.......x
xxsx+xxxx
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "floorStone",
		x: "wallStone",
		A: "altar",
		b: "brazier",
		f: "fountain",
		c: 'chest',
		d: { typeFilter: 'dwarf', name: "dwarf cleric", jobId: 'priest' },
		s: [ { typeFilter: 'sign', sign: 'BYJOB' }, { typeFilter: 'wallStone' } ]
	}
}

PlaceTypeList.dwarfHouse = {
	map:
`
xxxxxxxxx
xcbcbcb.x
x.b.b.b.x
x.......x
xxxxxx+xx
x..d....x
xt.d...tx
xt...d.tx
xt.....tx
x.......x
xxxx+xxxx
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "floorStone",
		x: "wallStone",
		t: 'table',
		b: 'bed',
		c: 'chest',
		d: { typeFilter: 'dwarf', attitude: Attitude.WANDER, tether: 3, jobId: 'isSentry'  },
		s: [ { typeFilter: 'sign', sign: 'BYJOB' }, { typeFilter: 'wallStone' } ]
	}
}

PlaceTypeList.dwarfHouseSmall = {
	map:
`
xxxxxxx
xttt.bx
x..d..x
x.....x
x.....x
x.....x
x.....x
xxxx+xx
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "floorStone",
		x: "wallStone",
		d: "dwarf",
		t: 'table',
		b: 'barrel'
	},
	inject: {
		dwarf: { attitude: Attitude.WANDER, tether: 6, jobId: 'isLayman'  }
	}
}

PlaceTypeList.dwarfHouseL = {
	map:
`
xxxxxxxxxxx
x......ttbx
x..d.....bx
x.....xx+xx
x.....x
x.....x
x.....x
xxxx+xx
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "floorStone",
		x: "wallStone",
		d: "dwarf",
		t: 'table',
		b: 'barrel',
	},
	inject: {
		dwarf: { attitude: Attitude.WANDER, tether: 6, jobId: 'isLayman' }
	}
}

PlaceTypeList.market = {
	map:
`
.d...d.
stt.tts
.......
.......
stt.tts
.d...d.
`,
	forbidTreasure: true,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "floorStone",
		t: 'table',
		d: { typeFilter: 'dwarf', jobId: 'isMerchant' },
		s: [ { typeFilter: 'sign', sign: 'BYJOB' }, { typeFilter: 'table' } ]
	},
}

PlaceTypeList.shopSmall = {
	map:
`
xxxxx
xcd.x
bs..b
.....
`,
	forbidTreasure: true,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "floorStone",
		x: "wallStone",
		b: 'brazier',
		c: 'chest',
		d: { typeFilter: 'dwarf', jobId: 'isMidsize' },
		s: { typeFilter: 'sign', sign: 'BYJOB' }
	},
}

PlaceTypeList.shopOpenAir = {
	map:
`
 ... 
.stt.
..d..
.....
`,
	forbidTreasure: true,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "floorStone",
		t: 'table',
		d: { typeFilter: 'dwarf', jobId: 'isMinor' },
		s: [{ typeFilter: 'sign', sign: 'BYJOB' }, { typeFilter: 'table' }]
	},
}

PlaceTypeList.shopLarge = {
	map:
`
xxxxxxx
xcbd..x
xtttttx
x.....x
x.....x
xt....x
xxsx+xx
`,
	forbidTreasure: true,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "floorStone",
		x: "wallStone",
		t: 'table',
		c: 'chest',
		b: 'barrel',
		d: { typeFilter: 'dwarf', attitude: Attitude.WANDER, tether: 2, jobId: 'isMajor' },
		s: [{ typeFilter: 'sign', sign: 'BYJOB' }, {typeFilter: 'wallStone'}]
	},
}



PlaceTypeList.dwarfSmithy = {
	map:
`
 xxxxx
 sfffx 
.......
..d....
.......
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "floorStone",
		x: "wallStone",
		d: { typeFilter: 'dwarf', jobId: 'smith' },
		f: "flames",
		s: [{ typeFilter: 'sign', sign: 'BYJOB' }, {typeFilter: 'wallStone'}]
	}
}

PlaceTypeList.dwarfPlaza = {
	map:
`
 ....
......
..ff..
.dff..
......
 .... 
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "floorStone",
		f: "fountain",
		d: { typeFilter: 'dwarf', jobId: 'evangelist' }
	}
}

PlaceMany( 'troops', ['human','dwarf','goblin','demon'], VARIETY => ({
	map:
`
.tttt.
ttddtt
ttddtt
tttttt
.tttt.
`,
	flags: { rotate: true, hasWall: false },
	symbols: {
		t: VARIETY,
		d: ({
			human: 'dog',
			dwarf: 'dog',
			goblin: 'ogre',
			demon: 'imp'
		})[VARIETY]
	}
}));


PlaceMany( 'camp', ['ogre','human','refugee','goblin'], VARIETY => ({
	map:
`
.y.
yuy
.y.
`,
	flags: { rotate: true },
	symbols: {
		y: VARIETY,
		u: 'brazier',
	},
	inject: {
		ogre: { attitude: Attitude.AWAIT, tether: 8, tooClose: 2 },
		human: { attitude: Attitude.WANDER, tether: 1 },
		goblin: { attitude: Attitude.AWAIT, tether: 8, tooClose: 4 }
	}

}));

return {
	ScapeList: ScapeList,
	PaletteList: PaletteList,
	ThemeDefault: ThemeDefault,
	ThemeList: ThemeList,
	PlaceTypeList: PlaceTypeList,
	rCOMMON: rCOMMON,
	rUNCOMMON: rUNCOMMON,
	rRARE: rRARE,
	rEPIC: rEPIC,
	rLEGENDARY: rLEGENDARY
}

});

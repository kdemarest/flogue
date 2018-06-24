let ScapeList = { };
let ThemeList = { };
let PlaceTypeList = { };

/*

THe level of a place can be specified, BUT if not the place will be scanned and assigned a level
equal to the highest level monster appearing


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
		C: [ 'floor, 5x weapon.arrow, 50% potion', { chance: 20, typeFilter: 'weapon.dart', hasMagicTip: true }, ...]
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
let rPROFUSE	= 1000.00;
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


ScapeList.caveTown = () => ({
	dim: 				Math.randInt(50,60),
	architecture: 		"cave",
	floorDensity: 		Math.rand(0.40,0.50),
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

	floor: 			TileTypeList.floor.symbol,
	wall:  			TileTypeList.wall.symbol,
	door:  			TileTypeList.door.symbol,
	fillFloor:  	TileTypeList.floor.symbol,
	fillWall:  		TileTypeList.wall.symbol,
	outlineWall:  	TileTypeList.wall.symbol,
	passageFloor: 	TileTypeList.floor.symbol,
	bridge: 		TileTypeList.bridge.symbol,
	unknown: 		TILE_UNKNOWN,

	architecture: 	"cave",
	floorDensity: 	0.68,
	placeDensity: 	0.40,
	seedPercent: 	0.10,

	enemyDensity: 	0.08,
	friendDensity: 	0.00,
	itemDensity: 	0.03,
});

ThemeList.surface = {
	name: 			'the solar temple on the surface',
	isUnique: 		true,
	inControl: 		true,
	scapeId: 		'snowyPlains',
	rREQUIRED: 		'surfaceSunTemple',
	monsters: 		['isPet'],
	enemyDensity: 	0.0,
	friendDensity: 	0.0,
	itemDensity: 	0.0,

}

ThemeList.coreCavernRooms = {
	scapeId: 		'caveRoomsNarrowlyConnected', //'caveRoomsWellConnected',
	placeDensity: 	0.70,
	rCOMMON: 		'nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit, floodWater',
	rUNCOMMON: 		'antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 			'goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 			'graveYard',
	monsters: 		['isUndead','isEarthChild','isPlanar','isAnimal'],
	enemyDensity: 	0.05,
	friendDensity: 	0.01,
}

ThemeList.refugeeCamp = {
	scapeId: 	'caveBroadWinding',
	rCOMMON: 	'camp_refugee',
	rUNCOMMON: 	'handoutStand, floodPit, pitEncircle',
	rRARE: 		'den_dog, camp_goblin',
	monsters: 	['isSunChild','isPet'],
	sign: 		'Bring your own supplies. We won\'t feed you.',
	enemyDensity: 	0.00,
	friendDensity: 	0.15,
	itemDensity:    0.0001,
}

ThemeList.refugeeCampSlaughter = {
	scapeId: 	'caveSpacious',
	placeDensity: 	0.70,
	rREQUIRED: 	'camp_refugee, camp_refugee, camp_goblin, camp_ogre, floodOre',
	rCOMMON: 	'camp_refugee, camp_goblin',
	rUNCOMMON: 	'floodPit, pitEncircle, veil, ruin, den_kobold, camp_ogre',
	rRARE: 		'den_dog',
	monsters: 	['isSunChild','isPet','isEarthChild'],
	sign: 		'Refugee Camp "Prosperous Tranquility" Ahead',
	enemyDensity: 	0.08,
	friendDensity: 	0.08,
}

ThemeList.dwarfTown = {
	isDwarfish: true,
	isTown: 	true,
	passageFloor: 'tileStoneFloor',
	scapeId: 	'caveTown',
	rREQUIRED: 	'dwarfSmithy, dwarfPlaza, market, shopLarge, shopSmall, 2x shopOpenAir, 2x floodOre, floodPit, '+
				'gatewayFromDwarves, 2x dwarfHouseSmall, 2x dwarfHouse, '+
				'70% dwarfTemple, 30% den_dog, 10% camp_human',
	rCOMMON: 	'floodOre, market, shopLarge, shopSmall, shopOpenAir, dwarfHouseSmall',
	rUNCOMMON: 	'floodPit, dwarfHouse',
	rRARE: 		'firePit, floodWater',
	jobPick: 	{ brewer:1 ,scribe:1, armorer: 1, smith: 1, cobbler: 1, gaunter: 1, lapidary: 1, jeweler: 1, peddler: 1 },
	prefer: 	['pit'],
	monsters: 	['isDwarf'],
	enemyDensity: 	0.00,
	friendDensity: 	0.01,
	itemDensity:    0.0001,
}

ThemeList.corePits = {
	scapeId: 	'caveBroadWinding',
	rREQUIRED: 	'floodPitLarge, 4x floodPit',
	rCOMMON: 	'floodPit, nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold',
	rUNCOMMON: 	'camp_human, antHive, tinyRoom, trollBridge, trollPit, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle, floodWater',
	rRARE: 		'goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 		'graveYard, lunarEmbassy',
	monsters: 	['power','isUndead','isEarthChild','isPlanar','isAnimal','isLunarChild']
}

ThemeList.coreBridges = {
	outlineWall:'pit',
	fillWall: 	'pit',
	scapeId: 	'caveMazeLike',
	rCOMMON: 	'floodPit, nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodWater',
	rUNCOMMON: 	'camp_human, antHive, trollBridge, trollPit, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 		'goblinGathering, tinyRoom, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 		'graveYard, lunarEmbassy',
	monsters: 	['power','isUndead','isEarthChild','isPlanar','isAnimal','isLunarChild']
}

ThemeList.coreMaze = {
	scapeId: 	'caveMazeLike',
	rCOMMON: 	'demonNest, nest_blueScarab, trollBridge, nest_viper, camp_ogre, etherHive, tinyRoom',
	rUNCOMMON: 	'floodPit, camp_goblin, den_kobold, nest_bat, antHive, trollPit, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 		'camp_human, goblinGathering, portal, circle, ruin, swamp, firePit, floodOre, floodWater',
	monsters: 	['isUndead','isEarthChild','isPlanar','isAnimal','isLunarChild']
}

ThemeList.dwarfGoblinBattle = {
	dim: 				30,
	architecture: 		"cave",
	floorDensity: 		0.88,
	seedPercent: 		0.20,
	placeDensity: 		0.70,
	passageWander: 		100,
	passageWidth2: 		50,
	rREQUIRED: 	'troops_dwarf, troops_goblin',
	rCOMMON: 	'floodPit, nest_bat, nest_viper',
	rUNCOMMON: 	'antHive, ruin, patch, veil, pitEncircle, floodOre',
	monsters: 	['isEarthChild','isSunChild','isPlanar','isAnimal'],
	sign: 		'Send reinforcements!'
}

ThemeList.coreCavernSomewhatOpen = {
	scapeId: 	'caveBroadWinding',
	rCOMMON: 	'nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit, floodWater',
	rUNCOMMON: 	'camp_human, antHive, trollBridge, trollPit, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 		'goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 		'graveYard, lunarEmbassy',
	monsters: 	['power','isUndead','isEarthChild','isPlanar','isAnimal','isLunarChild']
}

ThemeList.coreSea = {
	dim: 				90,
	architecture: 		"cave",
	floorDensity: 		0.88,
	seedPercent: 		0.40,
	placeDensity: 		0.70,
	passageWander: 		100,
	outlineWall: 		'water',
	fillWall: 			'floor',
	rREQUIRED: 			'floodWater',
	rCOMMON: 			'floodWaterSmall',
	monsters: 			['power','isUndead','isEarthChild','isPlanar','isAnimal','isLunarChild']
}

ThemeList.coreSwamp = {
	dim: 				30,
	architecture: 		"cave",
	floorDensity: 		0.28,
	seedPercent: 		0.40,
	placeDensity: 		0.70,
	passageWander: 		100,
	outlineWall: 		'mud',
	fillWall: 			'mud',
	rCOMMON: 			'floodMud',
	monsters: 			['power','isUndead','isEarthChild','isPlanar','isAnimal','isLunarChild']
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
	rCOMMON: 		'nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit, floodWater',
	rUNCOMMON: 		'antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 			'goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 			'graveYard',
	monsters: 		['isUndead','isEarthChild','isPlanar','isAnimal'],
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
	rCOMMON: 		'nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit, floodWater',
	rUNCOMMON: 		'antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 			'goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 			'graveYard',
	monsters: 		['isUndead','isEarthChild','isPlanar','isAnimal'],
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
	rCOMMON: 		'nest_bat, nest_blueScarab, nest_redScarab, nest_viper, camp_ogre, camp_goblin, den_kobold, floodPit, floodWater',
	rUNCOMMON: 		'antHive, trollBridge, trollPit, tinyRoom, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 			'goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit, floodOre',
	rEPIC: 			'graveYard',
	monsters: 		['isUndead','isEarthChild','isPlanar','isAnimal'],
	enemyDensity: 	0.05,
	friendDensity: 	0.01,
}

ThemeList.coreHellscape = {
	dim: 				Math.randInt(80),
	architecture: 		"cave",
	floorDensity: 		0.58,
	seedPercent: 		0.30,
	passageWander: 		50,
	passageWidth2: 		50,
	placeDensity: 		0.05,
	rCOMMON: 		'demonNest, firePit',
	rUNCOMMON: 		'nest_blueScarab, nest_redScarab, collonade, ruin, fountain1, floodPit, pitEncircle',
	rRARE: 			'etherHive',
	prefer: 		['flames','mud'],
	monsters: 		['isDemon','isPlanar'],
	enemyDensity: 	0.10,
	friendDensity: 	0.05,
}

ThemeList.coreFinalLevel = {
	dim: 				Math.randInt(80),
	architecture: 		"rooms",
	floorDensity: 		0.30,
	circleChance: 		100,
	overlapChance: 		20,
	preferDoors: 		false,
	passageWander: 		100,
	passageWidth2: 		50,
	passageWidth3: 		0,
	placeDensity: 		0.10,
	rREQUIRED: 		'balgursChamber',
	rCOMMON: 		'demonNest, firePit',
	rUNCOMMON: 		'nest_blueScarab, nest_redScarab, collonade, ruin, fountain1, floodPit, pitEncircle',
	rRARE: 			'etherHive',
	prefer: 		['flames','mud'],
	monsters: 		['isDemon','isPlanar'],
	enemyDensity: 	0.20,
	friendDensity: 	0.05,
}


//=========================

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

ThemeList.spooky = {
	scapeId: 	'caveRandom',
	rCOMMON: 	'graveYard, nest_bat, floodMist',
	rUNCOMMON: 	'ruin, nest_viper',
	rRARE: 		'shaft, fountain1, camp_human, swamp',
	rEPIC: 		'portal',
	prefer: 	['mist'],
	monsters: 	['isUndead'],
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

PlaceTypeList.gateUpMinimal = {
	map:
`
#####
#b..#
#.U.+
#b..#
#####
`,
	rarity: rUNCOMMON,
	isUtility: true,
	forbidEnemies: true,
	flags: { rotate: false },
	symbols: {
		U: 'stairsUp',
		b: 'brazier',
	}
}

PlaceTypeList.gateUpChamber = {
	map:
`
 #####
##...#
#U...+
##...#
 #####
`,
	rarity: rUNCOMMON,
	isUtility: true,
	forbidEnemies: true,
	flags: { rotate: false },
	symbols: {
		U: 'stairsUp',
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

PlaceTypeList.floodPit = {
	floodId: 'pit',
	tilePercent: 0.20,
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
		goblinPriest: { basis: 'goblin', name: "goblin priest", damage: '2d6+2', damageType: DamageType.ROT, isGoblin: true,
						attitude: Attitude.WORSHIP, shout: 'Death to all heretic overworld invaders!',
						inventoryLoot: 'spell.eRot', senseVis: 7,
						resist: DamageType.ROT,
						img: "dc-mon/gnoll.png" }
	},
	inject: {
		goblin: { attitude: Attitude.WORSHIP }
	}
};

PlaceTypeList.goblinGathering.itemTypes.goblinAltar.onTick = function(dt) {
	if( !this.rechargeLeft ) {
		let f = new Finder(this.area.entityList).filter(e=>e.isGoblin && e.health<e.healthMax/2).near(this.x,this.y,6);
		if( f.count ) {
			let entity = pick(f.all);
			let amount = Math.floor(entity.healthMax - entity.health);
			entity.takeHealing(this,amount,DamageType.ROT,true);
			tell( mSubject,this,' ',mVerb,'imbue',' ',mObject,entity,' with dark power.');
/*
			let dx = this.x - entity.x;
			let dy = this.y - entity.y;
			let deg = deltaToDeg(dx,dy);

			new Anim({
				follow: 	this,
				img: 		stickerList.darkPower.img,
				duration: 	1,
				onInit: 		a => { a.create(12); },
				onSpriteMake: 	s => { s.sVel(Math.rand(deg-90,deg+90),Math.rand(5,10)); s.delay=Math.rand(0,0.5); },
				onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel).sVelTo(dx,dy); }
			});
*/
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
 ##.................##
 #...................#
##...................##
#.....................#
#.....................########
#.....................+..d...#
#...b......F..X..1A...#.pwasS#
#.....................+......#
#.....................########
#.....................#
##...................##
 #...................#
 ##.................##
  #........b........#
  ##...............##
   ###...........###
     ###.......###
       #########
`,
	flags: { rotate: true, hasWall: true, isUnique: true },
	symbols: {
		1: 'stuff.oilLamp',
		X: { typeFilter: 'marker', playerStartHere: true },
		F: "fontSolar",
		A: "altar",
		b: "brazier",
		S: "stairsDown",
		w: "weapon.dagger",
		a: "armor",
		s: "spell.eFire",
		p: "potion.eHealing",
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
		x: "wall",
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
.xx......
.xx...xx.
..xxxxx..
...xxx...
`,
	flags: { rotate: true },
	symbols: {
		x: { pick: ['pit','flames','lava','water','mist','mud','forcefield'] }
	}
}

PlaceTypeList.ruin = {
	map:
`
.o...
.s..a
a.o..
..*a.
.a...
`,
	flags: { rotate: true },
	symbols: {
		s: 'shadow',
		o: 'columnBroken',
		a: 'columnStump'
	}
}

PlaceTypeList.tinyRoom = {
	map:
`
.....
.#+#.
.+.+.
.#+#.
.....
`,
	flags: { rotate: false },
	symbols: {
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

PlaceTypeList.fountain1 = {
	map:
`
...
.F.
...
`,
	flags: { rotate: true },
	symbols: {
		'.': 'tileStoneFloor',
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
		'#': 'tileStoneWall',
		g: 'gem',
		s: 'spell',
		A: 'altar',
		l: 'lunarOne',
	}
}

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
x-.-x
-yyy-
x-.-x
.x-x.
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		x: 'wall',
		'-': 'mud',
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
x.*yxxx
xxxxx  
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		x: "wall",
		y: VARIETY
	},
	inject: {
		dog: { attitude: Attitude.WANDER, tether: 4, tooClose: 1 },
		kobold: { tether: 2 }
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
mmmwmwmwwwmmm
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
		f: "spinyFrog"
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
		x: "wall",
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
#.f..a..f.#
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
	}
}
PlaceTypeList.portal = {
	map:
`
  MMMMM  
 MM,,,MM 
MM,,,,,MM
M,,~*~,,M
M,,*P*,,e
M,,~*~,,M
MM,,,,,MM
 MM,,,MM 
  MMMMM  
`,
	flags: { rotate: true },
	symbols: {
		x: "wall",
		',': 'grass',
		'~': 'water',
		M: "mist",
		P: "portal",
		e: 'ethermite'
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
		x: 'wall',
		T: 'troll',
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
..T..*.:
::::...:
  ::::::
`,
	flags: { rotate: true },
	symbols: {
		T: 'troll',
		':': 'pit'
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
		'.': 'tileStoneFloor',
		x: "tileStoneWall",
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
		tileStoneFloor:      { mayWalk: true,  mayFly: true,  opacity: 0, name: "tile stone floor", img: "dc-dngn/floor/rect_gray1.png", isFloor: true },
		tileStoneWall:       { mayWalk: false, mayFly: false, opacity: 1, name: "tile stone wall", img: "dc-dngn/floor/pedestal_full.png", isWall: true, wantsDoor: true },
		masterStatue:    { mayWalk: false, mayFly: true, opacity: 0, name: "master statue", img: "dc-mon/statues/silver_statue.png"},
		kingStatue:    { mayWalk: false, mayFly: true, opacity: 0, name: "king statue", img: "dc-mon/statues/wucad_mu_statue.png"},
	}
}

PlaceTypeList.handoutStand = {
	map:
		`
		     xxxxx
		.....,,,*x
		rrrrrp,,*x
		.....,,,*x
		.....x,,,x
		 ....xxpxx
		   ....... 
		`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		r: "refugee",
		p: "philanthropist",
		',': "tileStoneFloor",
		x: "tileStoneWall",
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
		'.': "tileStoneFloor",
		x: "tileStoneWall",
		G: "gateway",
		b: "brazier",
		d: "dwarf",
	},
	inject: {
		dwarf: { name: "dwarf herald", attitude: Attitude.WANDER, tether: 3 },
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
		'.': "tileStoneFloor",
		x: "tileStoneWall",
		w: "wall",
		G: "gateway",
		b: "brazier",
		d: "dwarf",
	}
}

PlaceTypeList.dwarfTemple = {
	map:
`
 xxxxxxx 
 xf.A.fx 
xx.....xx
xb..d..bx
x.......x
xb.....bx
x.......x
xb.....bx
x.......x
xxxs+xxxx
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "tileStoneFloor",
		x: "tileStoneWall",
		A: "altar",
		b: "brazier",
		f: "fountain",
		d: { typeFilter: 'dwarf', name: "dwarf cleric", jobId: 'priest', attitude: Attitude.WANDER, tether: 3 },
		s: [ { typeFilter: 'sign', sign: 'BYJOB' }, { typeFilter: 'tileStoneWall' } ]
	}
}

PlaceTypeList.dwarfHouse = {
	map:
`
xxxxxxxxx
x.b.b.b.x
x.b.b.b.x
x.......x
xxxxxx+xx
x..d....x
xt.....tx
xt...d.tx
xt.....tx
x.......x
xxxx+xxxx
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "tileStoneFloor",
		x: "tileStoneWall",
		t: 'table',
		b: 'bed',
		d: { typeFilter: 'dwarf', attitude: Attitude.WANDER, tether: 3 },
		s: [ { typeFilter: 'sign', sign: 'BYJOB' }, { typeFilter: 'tileStoneWall' } ]
	}
}

PlaceTypeList.dwarfHouseSmall = {
	map:
`
xxxxxxx
x.....x
x..d..x
x.....x
x.....x
x.....x
x.....x
xxxx+xx
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "tileStoneFloor",
		x: "tileStoneWall",
		d: "dwarf",
	},
	inject: {
		dwarf: { attitude: Attitude.WANDER, tether: 6 }
	}
}

PlaceTypeList.dwarfHouseL = {
	map:
`
xxxxxxxxxxx
x.........x
x..d......x
x.....xx+xx
x.....x
x.....x
x.....x
xxxx+xx
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "tileStoneFloor",
		x: "tileStoneWall",
		d: "dwarf",
	},
	inject: {
		dwarf: { attitude: Attitude.WANDER, tether: 6 }
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
		'.': "tileStoneFloor",
		t: 'table',
		d: { typeFilter: 'dwarf', attitude: Attitude.WANDER, tether: 2, jobId: 'PICK' },
		s: [ { typeFilter: 'sign', sign: 'BYJOB' }, { typeFilter: 'table' } ]
	},
}

PlaceTypeList.shopSmall = {
	map:
`
xxxxx
x.d.x
bs..b
.....
`,
	forbidTreasure: true,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "tileStoneFloor",
		x: "tileStoneWall",
		b: 'brazier',
		d: { typeFilter: 'dwarf', attitude: Attitude.AWAIT, tether: 2, jobId: 'PICK' },
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
		'.': "tileStoneFloor",
		t: 'table',
		d: { typeFilter: 'dwarf', attitude: Attitude.AWAIT, tether: 2, jobId: 'PICK' },
		s: [{ typeFilter: 'sign', sign: 'BYJOB' }, { typeFilter: 'table' }]
	},
}

PlaceTypeList.shopLarge = {
	map:
`
xxxxxxx
x..d..x
xtttttx
x.....x
x.....x
xt....x
xxs+xxx
`,
	forbidTreasure: true,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "tileStoneFloor",
		x: "tileStoneWall",
		t: 'table',
		d: { typeFilter: 'dwarf', attitude: Attitude.AWAIT, tether: 2, jobId: 'PICK' },
		s: [{ typeFilter: 'sign', sign: 'BYJOB' }, {typeFilter: 'tileStoneWall'}]
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
		'.': "tileStoneFloor",
		x: "tileStoneWall",
		d: { typeFilter: 'dwarf', jobId: 'smith', attitude: Attitude.AWAIT, tether: 2 },
		f: "flames",
		s: [{ typeFilter: 'sign', sign: 'BYJOB' }, {typeFilter: 'tileStoneWall'}]
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
		'.': "tileStoneFloor",
		f: "fountain",
		d: { typeFilter: 'dwarf', jobId: 'evangelist', attitude: Attitude.AWAIT, tether: 2 }
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

let ScapeList = { };
let ThemeList = { };
let PlaceList = { };

/*

THe level of a place can be specified, BUT if not the place will be scanned and assigned a level
equal to the highest level monster appearing


PlaceList.uniqueIdentity = {
	// The map can use any symbols yu want. Just re-map them in the 'symbols' area below.
	// However, . and # are generally floor and wall, just to avoid confusion.
	map:
`
.......
`,
	symbols: {
		A: 'typeId'	// allowed to be a function that picks what type to link to
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
		let placeId = prefix+'.'+VARIETY;
		PlaceList[placeId] = templateFn(VARIETY);
		PlaceList[placeId].rarity /= count;
	}
}

// Theme caps are for a 40x40 area. These will be ratiod to the size of the actual map.
// prefer - means that, when a pick choice needs to happen, that theme strongly (maybe 100%) prefers to chose that.
ScapeList.plainScape = theme => ({
	dim: 				60,
	architecture: 		"plain",
	floorDensity: 		95,
	seedPercent: 		0.001,
	monsterDensity: 	0.0,
	itemDensity: 		0.0
});


ScapeList.caveRandom = theme => ({
	dim: 				Math.randInt(40,80),
	architecture: 		"cave",
	floorDensity: 		Math.rand(0.10,0.70),
	seedPercent: 		Math.rand(0.0001,0.90),
	wanderingPassage: 	Math.chance(50),
});

ScapeList.caveWeblike = theme => ({
	dim: 				Math.randInt(30,60),
	architecture: 		"cave",
	floorDensity: 		0.12,
	seedPercent: 		0.63,
	wanderingPassage: 	true,
});

ScapeList.caveMazelike = theme => ({
	dim: 				Math.randInt(30,60),
	architecture: 		"cave",
	floorDensity: 		0.12,
	seedPercent: 		0.63,
	wanderingPassage: 	false,
});

ScapeList.caveSpacious = theme => ({
	dim: 				Math.randInt(40,80),
	architecture: 		"cave",
	floorDensity: 		0.68,
	seedPercent: 		0.20,
	wanderingPassage: 	false,
});

ScapeList.caveBroadWinding = theme => ({
	dim: 				Math.randInt(40,80),
	architecture: 		"cave",
	floorDensity: 		0.30,
	seedPercent: 		0.60,
	wanderingPassage: 	true,
});

ScapeList.caveTownRural = theme => ({
	dim: 				Math.randInt(60,80),
	architecture: 		"cave",
	floorDensity: 		0.04,
	seedPercent: 		0.20,
	wanderingPassage: 	false,
});


ScapeList.caveTown = theme => ({
	dim: 				Math.randInt(50,60),
	architecture: 		"cave",
	floorDensity: 		Math.rand(0.40,0.50),
	seedPercent: 		Math.rand(0.10,0.20),
	wanderingPassage: 	false,
	palette: {
		passageFloorTypeId: 'tileStoneFloor'
	}
});

ScapeList.caveVillage = theme => ({
	dim: 				Math.randInt(30,40),
	architecture: 		"cave",
	floorDensity: 		Math.rand(0.10,0.50),
	seedPercent: 		Math.rand(0.10,0.20),
	wanderingPassage: 	false
});


ThemeList.gameStart = {
	isUnique: 	true,
	scapes: 	['caveRandom'],
	rCOMMON: 	'camp.human',
	monsters: 	['isPet']
}

ThemeList.surface = {
	isUnique: 	true,
	inControl: 	true,
	scapes: 	['plainScape'],
	rREQUIRED: 	'surfaceSunTemple',
	monsters: 	['isPet']
}

ThemeList.cavern = {
	allowInCore: true,
	scapes: 	['caveRandom'],
	rREQUIRED: 	'gatewayToDwarves',
	rCOMMON: 	'nest.bat, nest.blueScarab, nest.redScarab, nest.viper, camp.ogre, camp.goblin, den.kobold, floodPit, floodWater',
	rUNCOMMON: 	'camp.human, antHive, trollBridge, trollPit, shaft, collonade, fountain1, fountain4, patch, veil, pitEncircle',
	rRARE: 		'den.dog, goblinGathering, demonNest, portal, circle, ruin, swamp, etherHive, firePit',
	rEPIC: 		'graveYard, lunarEmbassy',
	monsters: 	['power','isUndead','isEarthChild','isPlanar','isAnimal','isLunarChild']
}

ThemeList.dwarfTown = {
	scapes: 	['caveTown'], //'caveTownRural','caveVillage'],
	rREQUIRED: 	'3x floodOre, floodPit, gatewayFromDwarves, dwarfHouseSmall, dwarfHouse, 50% dwarfHouse, 90% dwarfSmithy, 70% dwarfTemple, 2x 60% dwarfPlaza, 30% den.dog, 10% camp.human',
	rCOMMON: 	'floodOre',
	//rCOMMON: 	'dwarfHouse, dwarfHouseSmall, dwarfHouseL, pitEncircle, nest.bat, patch, floodMist',
	rRARE: 		'firePit, floodWater',
	prefer: 	['pit'],
	monsters: 	['isDwarf']
}

ThemeList.thePits = {
	allowInCore: true,
	scapes: 	['caveBroadWinding'],
	rCOMMON: 	'floodPit',
	monsters: 	['isUndead'],
	scape: 		{ placeDensity: 0.5 }
}

ThemeList.spooky = {
	allowInCore: true,
	scapes: 	['caveRandom'],
	rCOMMON: 	'graveYard, nest.bat, floodMist',
	rUNCOMMON: 	'ruin, nest.viper',
	rRARE: 		'shaft, fountain1, camp.human, swamp',
	rEPIC: 		'portal',
	prefer: 	['mist'],
	monsters: 	['isUndead'],
}

ThemeList.ruins = {
	allowInCore: true,
	scapes: 	['caveRandom'],
	rCOMMON: 	'camp.ogre, camp.goblin, nest.blueScarab, nest.redScarab',
	rUNCOMMON: 	'collonade, ruin, fountain1, antHive, floodPit, pitEncircle',
	rRARE: 		'floodWater, swamp, demonNest',
	rEPIC: 		'portal',
	monsters: 	['isEarthChild','isAnimal'],
}

ThemeList.hellscape = {
	scapes: 	['caveRandom'],
	rCOMMON: 	'demonNest, firePit',
	rUNCOMMON: 	'nest.blueScarab, nest.redScarab, collonade, ruin, fountain1, floodPit, pitEncircle',
	rRARE: 		'etherHive, balgursChamber',
	prefer: 	['flames','mud'],
	monsters: 	['isDemon','isPlanar'],
	//items: 		['isGem'],
}

ThemeList.refugeeCamp = {
	scapes: 	['caveRandom'],
	rCOMMON: 	'camp.refugee, den.dog',
	rUNCOMMON: 	'handoutStand, floodPit, pitEncircle',
	monsters: 	['isSunChild','isPet']
}

ThemeList.lunarColony = {
	scapes: 	['caveRandom'],
	rCOMMON: 	'lunarEmbassy',
	rRARE: 		'etherHive',
	rEPIC: 		'portal',
	monsters: 	['isLunarChild','isPlanar'],
}

ThemeList.sunPlane = {
	scapes: 	['caveRandom'],
	rREQUIRED: 	'sunDiscipleTemple',
	rEPIC: 		'portal',
	monsters: 	['isSunChild','isPlanar'],
}

PlaceList.floodWater = {
	floodId: 'water',
	tilePercent: 0.20,
	sparkId: 'floor',
	sparkLimit: 4,
	sparkDensity: 0.02
}

PlaceList.floodMist = {
	floodId: 'mist',
	tilePercent: 0.20,
}

PlaceList.floodOre = {
	floodId: 'oreVein',
	tilePercent: 0.20,
	sparkId: 'floor',
	sparkLimit: 2,
	sparkDensity: 0.005
}

PlaceList.floodPit = {
	floodId: 'pit',
	tilePercent: 0.20,
	sparkId: 'floor',
	sparkLimit: 4,
	sparkDensity: 0.02
}

PlaceList.firePit = {
	floodId: 'pit',
	tilePercent: 0.20,
	sparkId: 'flames',
	sparkLimit: 3,
	sparkDensity: 1.00

}

PlaceList.pitEncircle = {
	floodId: 'floor',
	tilePercent: 0.20,
	sparkId: 'pit',
	sparkLimit: 1,
	sparkDensity: 1.00

}

PlaceList.goblinGathering = {
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
						img: "dc-mon/gnoll.png" }
	},
	inject: {
		goblin: { attitude: Attitude.WORSHIP }
	}
};

PlaceList.goblinGathering.itemTypes.goblinAltar.onTick = function(dt,map,entityList) {
	if( !this.rechargeLeft ) {
		let f = new Finder(entityList).filter(e=>e.isGoblin && e.health<e.healthMax/2).near(this.x,this.y,6);
		if( f.count ) {
			let entity = pick(f.all);
			let amount = Math.floor((entity.healthMax/2) - entity.health);
			entity.takeHealing(this,rollDice('1d4'),DamageType.ROT,true);
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

PlaceList.surfaceSunTemple = {
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
#.....................+......#
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
	flags: { rotate: false },
	symbols: {
		1: 'stuff.oilLamp',
		X: { type: 'marker', playerStartHere: true },
		F: "solarFont",
		A: "altar",
		b: "brazier",
		S: "stairsDown",
		w: "weapon.dagger",
		a: "armor",
		s: "spell.eFire",
		p: "potion.eHealing",
	},
}

PlaceList.graveYard = {
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

PlaceList.circle = {
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
		x: function() { return pick(['pit','flames','lava','water','mist','mud','forcefield']); }
	}
}

PlaceList.ruin = {
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

PlaceList.shaft = {
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

PlaceList.collonade = {
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
		o: function() { return pick(['columnBroken','columnStump']); }
	}
}

PlaceList.fountain1 = {
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

PlaceList.fountain4 = {
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

PlaceList.patch = {
	map:
`
..mm..
.mmmm.
..mm..
`,
	flags: { rotate: true },
	symbols: {
		m: function() { return pick(['mud','grass','pit','flames','water','mist']); }
	}
};

PlaceList.veil = {
	map:
`
mmmm
`,
	flags: { rotate: true },
	symbols: {
		m: function() { return pick(['flames','mist','mud']); }
	}
};

PlaceList.lunarEmbassy = {
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
x-y-x
-yyy-
x-y-x
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

PlaceList.swamp = {
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
PlaceList.etherHive = {
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
PlaceList.antHive = {
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
PlaceList.demonNest = {
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
PlaceList.balgursChamber = {
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
PlaceList.portal = {
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

PlaceList.trollBridge = {
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

PlaceList.trollPit = {
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


PlaceList.sunDiscipleTemple = {
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
		p: 'potions',
	},
	tileTypes: {
		tileStoneFloor:      { mayWalk: true,  mayFly: true,  opacity: 0, name: "tile stone floor", img: "dc-dngn/floor/rect_gray1.png", isFloor: true },
		tileStoneWall:       { mayWalk: false, mayFly: false, opacity: 1, name: "tile stone wall", img: "dc-dngn/floor/pedestal_full.png", isWall: true, wantsDoor: true },
		masterStatue:    { mayWalk: false, mayFly: true, opacity: 0, name: "master statue", img: "dc-mon/statues/silver_statue.png"},
		kingStatue:    { mayWalk: false, mayFly: true, opacity: 0, name: "king statue", img: "dc-mon/statues/wucad_mu_statue.png"},
	}
}

PlaceList.handoutStand = {
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


PlaceList.gatewayToDwarves = {
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

PlaceList.gatewayFromDwarves = {
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

PlaceList.dwarfTemple = {
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
xxxx+xxxx
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "tileStoneFloor",
		x: "tileStoneWall",
		A: "altar",
		b: "brazier",
		f: "fountain",
		d: "dwarf",
	},
	inject: {
		dwarf: { name: "dwarf cleric", attitude: Attitude.WANDER, tether: 5 }
	}
}

PlaceList.dwarfHouse = {
	map:
`
xxxxxxxxx
x.......x
x.......x
x..d....x
x.......x
x.......x
x.......x
x....d..x
x.......x
x.......x
xxxx+xxxx
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "tileStoneFloor",
		x: "tileStoneWall",
		d: "dwarf",
	},
	inject: {
		dwarf: { attitude: Attitude.WANDER, tether: 10 }
	}
}

PlaceList.dwarfHouseSmall = {
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

PlaceList.dwarfHouseL = {
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

PlaceList.dwarfSmithy = {
	map:
`
 xxxxx
 xfffx 
.......
..d....
.......
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "tileStoneFloor",
		x: "tileStoneWall",
		d: "dwarf",
		f: "flames",
	},
	inject: {
		dwarf: { job: "not a smith", attitude: Attitude.AWAIT, tether: 2 }
	}
}

PlaceList.dwarfPlaza = {
	map:
`
 ....
......
..ff..
..ff..
......
 .... 
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "tileStoneFloor",
		f: "fountain"
	}
}


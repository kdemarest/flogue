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
	onEntityCreate: {
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
ScapeList.caveRandom = theme => ({
	dim: 				Math.randInt(40,80),
	architecture: 		"cave",
	floorDensity: 		Math.rand(0.10,0.70),
	seedPercent: 		Math.rand(0.0001,0.90),
	mustConnect: 		Math.chance(50),
	wanderingPassage: 	Math.chance(50),
});

ScapeList.caveWeblike = theme => ({
	dim: 				Math.randInt(30,60),
	architecture: 		"cave",
	floorDensity: 		0.12,
	seedPercent: 		0.63,
	mustConnect: 		false,
	wanderingPassage: 	true,
});

ScapeList.caveMazelike = theme => ({
	dim: 				Math.randInt(30,60),
	architecture: 		"cave",
	floorDensity: 		0.12,
	seedPercent: 		0.63,
	mustConnect: 		false,
	wanderingPassage: 	false,
});

ScapeList.caveSpacious = theme => ({
	dim: 				Math.randInt(40,80),
	architecture: 		"cave",
	floorDensity: 		0.68,
	seedPercent: 		0.20,
	mustConnect: 		false,
	wanderingPassage: 	false,
});

ScapeList.caveBroadWinding = theme => ({
	dim: 				Math.randInt(40,80),
	architecture: 		"cave",
	floorDensity: 		0.30,
	seedPercent: 		0.60,
	mustConnect: 		false,
	wanderingPassage: 	true,
});


ThemeList.gameStart = {
	isCore: 	true,
	scapes: 	['caveRandom'],
	rCOMMON: 	['camp.human'],
	monsters: 	['isPet']
}

ThemeList.cavern = {
	isCore: 	true,
	scapes: 	['caveRandom'],
	rCOMMON: 	['nest.bat','nest.blueScarab','nest.redScarab','nest.viper','camp.ogre','camp.goblin','den.kobold'],
	rUNCOMMON: 	['camp.human','antHive','trollBridge','trollPit','shaft','collonade','fountain1','fountain4','patch','veil'],
	rRARE: 		['den.dog','goblinGathering','demonNest','portal','circle','ruin','swamp','etherHive'],
	rEPIC: 		['graveYard','lunarEmbassy'],
	monsters: 	['power','isUndead','isEarthChild','isPlanar','isAnimal','isLunarChild']
}

ThemeList.spooky = {
	isCore: 	true,
	scapes: 	['caveRandom'],
	rCOMMON: 	['graveYard','nest.bat'],
	rUNCOMMON: 	['ruin','nest.viper'],
	rRARE: 		['shaft','fountain1','camp.human','swamp'],
	rEPIC: 		['portal'],
	prefer: 	['mist'],
	monsters: 	['isUndead'],
}

ThemeList.ruins = {
	isCore: 	true,
	scapes: 	['caveRandom'],
	rCOMMON: 	['camp.ogre','camp.goblin','nest.blueScarab','nest.redScarab'],
	rUNCOMMON: 	['collonade','ruin','fountain1','camp.goblin','antHive'],
	rRARE: 		['swamp','demonNest'],
	rEPIC: 		['portal'],
	monsters: 	['isEarthChild','isAnimal'],
}

ThemeList.hellscape = {
	scapes: 	['caveRandom'],
	rCOMMON: 	['demonNest'],
	rUNCOMMON: 	['nest.blueScarab','nest.redScarab','collonade','ruin','fountain1'],
	rRARE: 		['etherHive','balgursChamber'],
	prefer: 	['fire','mud'],
	monsters: 	['isDemon','isPlanar'],
	//items: 		['isGem'],
}

ThemeList.refugeeCamp = {
	scapes: 	['caveRandom'],
	rCOMMON: 	['camp.human','den.dog'],
	monsters: 	['isSunChild','isPet']
}

ThemeList.lunarColony = {
	scapes: 	['caveRandom'],
	rCOMMON: 	['lunarEmbassy'],
	rRARE: 		['etherHive'],
	rEPIC: 		['portal'],
	monsters: 	['isLunarChild','isPlanar'],
}

ThemeList.sunPlane = {
	scapes: 	['caveRandom'],
	rREQUIRED: 	['sunDiscipleTemple'],
	rCOMMON: 	[],
	rEPIC: 		['portal'],
	monsters: 	['isSunChild','isPlanar'],
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
	onEntityCreate: {
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
			animationAdd( new AniPaste({
				entity: entity, xOfs: 0.5, yOfs: 0.5,
				sticker: StickerList.darkPower,
				x: this.x,
				y: this.y,
				duration: 0.8
			}));
			animationAdd( new AniPaste({
				entity: entity, xOfs: 0.5, yOfs: 0.5,
				sticker: StickerList.darkPower,
				x: entity.x,
				y: entity.y,
				duration: 0.8
			}));
			this.rechargeLeft = this.rechargeTime;
		}
	}
	this.glow = !this.rechargeLeft;
	this.light = this.rechargeLeft ? 0 : 4;
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
		F: "crystal"
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
		x: function() { return pick(['pit','fire','lava','water','mist','mud','forcefield']); }
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
		m: function() { return pick(['mud','grass','pit','fire','water','mist']); }
	}
};

PlaceList.veil = {
	map:
`
mmmm
`,
	flags: { rotate: true },
	symbols: {
		m: function() { return pick(['fire','mist','mud']); }
	}
};

PlaceList.lunarEmbassy = {
	map:
`
xxxxxxx.
x...**x.
x^..l.xl
xAl...+.
x^....xl
x..lᵴ.x.
xxxxxxx
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		x: "wall"
	}
}

PlaceMany( 'camp', ['ogre','human','goblin'], VARIETY => ({
	map:
`
.y.
yuy
.y.
`,
	flags: { rotate: true },
	symbols: {
		y: VARIETY
	},
	onEntityCreate: {
		ogre: { attitude: Attitude.AWAIT, tether: 8, tooClose: 2 },
		human: { attitude: Attitude.WANDER, tether: 1 },
		goblin: { attitude: Attitude.AWAIT, tether: 8, tooClose: 4 }
	}

}));

PlaceMany( 'nest', ['blueScarab','redScarab','viper'], VARIETY => ({
	map:
`
.x⋍x.
x⋍y⋍x
⋍yyy⋍
x⋍y⋍x
.x⋍x.
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		x: "wall",
		y: VARIETY
	},
	onEntityCreate: {
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
	onEntityCreate: {
		bat: { attitude: Attitude.WANDER, tether: 7 },
	}
}));


PlaceMany( 'den', ['dog','kobold'], VARIETY => ({
	map:
`
xxxxxxx
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
	onEntityCreate: {
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
	onEntityCreate: {
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
		x: "wall"
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
		f: "fire"
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
#####|#####
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		L: "lava",
		f: "fire"
	}
}
PlaceList.portal = {
	map:
`
..MMMMM..
.MM,,,MM.
MM,,,,,MM
M,,~*~,,M
M,,*P*,,e
M,,~*~,,M
MM,,,,,MM
.MM,,,MM.
..MMMMM..
`,
	flags: { rotate: true },
	symbols: {
		x: "wall",
		P: "portal",
		M: "mist"
	},
	onEntityCreate: {
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
	onEntityCreate: {
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
	},
	onEntityCreate: {
		troll: { attitude: Attitude.AWAIT, tooClose: 2 }
	}
}


PlaceList.sunDiscipleTemple = {
	map:
`
xxxxxxxxxxx...........
x.....x...x...........
x.ᵴ...x...x..F..B..G..
xs=...+...x...........
x.ᵴ...x...xxxxxxxxxxx.
x.....x...x.........x.
xxxxxxx...x.........x.
x.....x...x.........x.
x.[...x...x...u$....x.
xs&†..+.......kA^...+.
x.b...x...x...u$....x.
x.....x...x.........x.
xxxxxxx...x.........x.
x.....x...x.........x.
x.ii..x...xxxxxxxxxxx.
xs$$..+...x...........
x.ii..x...x..F..B..G..
x.....x...x...........
xxxxxxxxxxx...........
`,
	flags: { rotate: false, hasWall: true },
	symbols: {
		'.': "tileStoneFloor",
		x: "tileStoneWall",
		s: "masterStatue",
		k: "kingStatue",
		F: "crystal"
	},
	tileTypes: {
		"tileStoneFloor":      { mayWalk: true,  mayFly: true,  opacity: 0, name: "tile stone floor", img: "dc-dngn/floor/rect_gray1.png", isFloor: true },
		"tileStoneWall":       { mayWalk: false, mayFly: false, opacity: 1, name: "tile stone wall", img: "dc-dngn/floor/pedestal_full.png", isWall: true },
		"masterStatue":    { mayWalk: false, mayFly: true, opacity: 0, name: "master statue", img: "dc-mon/statues/silver_statue.png"},
		"kingStatue":    { mayWalk: false, mayFly: true, opacity: 0, name: "king statue", img: "dc-mon/statues/wucad_mu_statue.png"},
	}
}

(function() {
let PlaceList = {};

/*
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
let rCOMMON 	= 1.00;
let rUNCOMMON 	= 0.50;
let rRARE 		= 0.20;
let rEPIC 		= 0.10;
let rLEGENDARY 	= 0.01;

PlaceList.goblinGathering = {
	rarity: rRARE,
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
		let f = new Finder(entityList).filter(e=>e.isGoblin && e.health<e.healthMax).near(this.x,this.y,6);
		if( f.count ) {
			let entity = pick(f.all);
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
	rarity: rEPIC,
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
		M: "mist"
	}
}

PlaceList.circle = {
	rarity: rRARE,
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

PlaceList.lunarEmbassy = {
	rarity: rEPIC,
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
	flags: { rotate: true },
	symbols: {
		x: "wall"
	}
}

PlaceList.camp = {
	rarity: rCOMMON,
	map:
`
.y.
yuy
.y.
`,
	flags: { rotate: true },
	symbols: {
		y: function() { return pick(['ogre','human']); }
	}
}

PlaceList.nest = {
	rarity: rCOMMON,
	map:
`
⋍xx⋍x
xy⋍⋍x
xy⋍yx
xyy⋍x
.xx⋍.
`,
	flags: { rotate: true },
	symbols: {
		x: "wall",
		y: function() { return pick(['bat','spinyFrog','scarab','viper']); }

	}
}

PlaceList.den = {
	rarity: rCOMMON,
	map:
`
xxxxxxx
xxy*.yx
xy.....
x.*yxxx
xxxxx..
`,
	flags: { rotate: true },
	symbols: {
		x: "wall",
		y: function() { return pick(['dog','kobold']); }

	}
}

PlaceList.swamp = {
	rarity: rCOMMON,
	map:
`
mmmmmmmmmmmmm
mmwwwfmmwwwmm
mwwwwwwwwmwmm
mmwwwfmwmwwmm
mwwwwmmmwmfmm
mmmwmwmwwwmmm
mfwwwmwfmwwmm
mmfwwfwwwwwmm
mmwmmwmwwmwmm
mmmwfwwwmwwmm
mwwwwmwwwfwwm
mmwmwwmmwwwwm
mmmmmmmmmmmmm
`,
	flags: { rotate: true },
	symbols: {
		m: "mud",
		w: "water"
	}
}
PlaceList.etherHive = {
	rarity: rUNCOMMON,
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
PlaceList.demonNest = {
	rarity: rEPIC,
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
	rarity: rLEGENDARY,
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
	flags: { rotate: true },
	symbols: {
		L: "lava",
		f: "fire"
	}
}
PlaceList.portal = {
	rarity: rUNCOMMON,
	map:
`
..MMMMM..
.MM,,,MM.
MM,,,,,MM
M,,~*~,,M
M,,*Ώ*,,e
M,,~*~,,M
MM,,,,,MM
.MM,,,MM.
..MMMMM..
`,
	flags: { rotate: true },
	symbols: {
		x: "wall",
		M: "mist"
	}
}

PlaceList.bridge = {
	rarity: rUNCOMMON,
	map:
`
..:::::::::.
::::::::::::
........T...
:::::::::::.
.:::::::::..
`,
	flags: { rotate: true },
	symbols: {
	}
}

PlaceList.sunDiscipleTemple = {
	rarity: rLEGENDARY,
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
	flags: { rotate: false },
	symbols: {
		'.': "tileStoneFloor",
		x: "tileStoneWall",
		s: "masterStatue",
		k: "kingStatue",
	},
	tileTypes: {
		"tileStoneFloor":      { mayWalk: true,  mayFly: true,  opacity: 0, name: "tile stone floor", img: "dc-dngn/floor/rect_gray1.png", isFloor: true },
		"tileStoneWall":       { mayWalk: false, mayFly: false, opacity: 1, name: "tile stone wall", img: "dc-dngn/floor/pedestal_full.png", isWall: true },
		"masterStatue":    { mayWalk: false, mayFly: true, opacity: 0, name: "master statue", img: "dc-mon/statues/silver_statue.png"},
		"kingStatue":    { mayWalk: false, mayFly: true, opacity: 0, name: "king statue", img: "dc-mon/statues/wucad_mu_statue.png"},
	}
}


	// Export the placelist.
	window.loadPlaceList = () => PlaceList;
})();

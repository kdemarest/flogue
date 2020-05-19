Module.add('dataPlaces',function() {


function determinePlaceLevel(placeType,monsterTypeList) {
	// Be sure to do this afterwards, just in case a place uses a monster from a place further down the list.
	let NO_MONSTERS = -1;
	let level = NO_MONSTERS;
	if( !placeType.map && !placeType.floodId && !placeType.isMaze ) {
		debugger;
	}
	if( placeType.isMaze ) {
		placeType.tileCount = placeType.xLen * placeType.yLen;
	}
	if( placeType.map ) {
		placeType.tileCount = 0;
		for( let i=0 ; i<placeType.map.length ; ++i ) {
			let s = placeType.map.charAt(i);
			if( s=='\t' || s=='\n' || s==Tile.UNKNOWN ) continue;
			placeType.tileCount ++;
			let supplyArray = Array.supplyParse(placeType.symbols[s]);
			supplyArray.forEach( supply => {
				console.assert(supply.typeFilter || supply.pick);
				// We don't check on the pick list. Maybe we should.

				let monster = supply.typeFilter && monsterTypeList ? monsterTypeList[supply.typeFilter.split('.')[0]] : null;
				if( monster ) {
					level = Math.max(level,monster.level||Rules.DEPTH_MIN);
					placeType.comesWithMonsters = true;
				}
			});
		}
	}
	if( !placeType.tileCount && !placeType.tilePercent ) debugger;
	if( placeType.level && level > placeType.level+5 ) {
		console.log("WARNING: Place "+placeType.typeId+" is level "+placeType.level+" but has level "+level+" monsters.");
	}
	placeType.level = placeType.level || level;
	if( placeType.level == NO_MONSTERS ) {
		placeType.level = 'any';
	}
}

function determineAndValidatePlaceSymbolHash(placeType,checker) {
	let symbolHash = {};
	function add(typeId) {
		console.assert( typeId );
		let symbol = TypeIdToSymbol[typeId];
		console.assert(symbol);
		symbolHash[symbol] = true;
	}

	Object.each( placeType.symbols, option => {
		checker.checkSupply( option, placeType.typeId, true );
		let supplyArray = Array.supplyParse(option);
		supplyArray.forEach( supply => {
			if( supply.pick ) {
				supply.pick.forEach( typeFilter => add( typeFilter.split('.')[0] ) );
			}
			else {
				if( supply.carrying ) {
					checker.checkSupply( supply.carrying, placeType.typeId+':'+supply.typeFilter );
				}
				add( supply.typeFilter.split('.')[0] );
			}
		});
	});
	placeType.symbolHash = symbolHash;
}

// We don't establish it yet, so that all the assignments can happen below.
// It is later transformed into a Type.
let PlaceTypeList = {};
/*
THe level of a place can be specified, BUT if not the place will be scanned and assigned a level
equal to the highest level monster appearing

jobPick: as each is made it is decremented, meaning that sooner or later all of the types will get made. It
then resets again.

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
		console.assert( count && Number.isFinite(count) );
		PlaceTypeList[placeId].rarity /= count;
	}
}


/*
PlaceType
=========================================

	// Various flags
	rarity: rUNCOMMON			// Utility places always need to specify their rarity relative to other utilities of similar purpose.
	isUtility: undefined,		// These are never randomly selected. The Plan must specify something that exists within the space.
	forbidEnemies: undefined,	// Never generate enemies in this place?
	forbidTreasure: undefined,	// Never generate treasure in this place?


Mapped Form

	Note that PlaceTypes are allowed to add to the global repositories of types.
	However: .rules, .damageType, and .attitude will NOT allow you to overwrite any global values. An exception will throw.

	// An optional string that describes the walls, floor, and placement of everything in the area.
	// There are default symbols for everything, but the main ones are
		# Wall     . Floor     + Door
	map:
		"#+##\n"+
		"#x.#\n"+
		"#g.D\n"+
		"####",

	// can this thing be rotated?
	flags: { rotate: true }

	// These are letters on your map. To customize you can insert a typeFilter that describes what sort of thing it is (using a supplySpec)
	// and all other variables that are to get merged into the monster/item/time once it is created.
	symbols: {
		g: 'goblin',
		x: 'brazier',
		'D': { typeFilter: 'door', state: 'shut' },
	},

	// Does this place need any stickers to support spells or whatever?
	StickerList: {
		darkPower: { img: "effect/bolt08.png", scale: 0.6, xAnchor: 0.5, yAnchor: 0.5 }
	},

	// Define any new tile types this place uses.
	TileTypeList: {
		masterStatue:    { mayWalk: false, mayFly: true, opacity: 0, name: "master statue", img: "dc-mon/statues/silver_statue.png"},
	},

	// Define any new items that this place requires.
	ItemTypeList: {
		goblinAltar: { mayWalk: false, mayFly: false, name: "goblin altar", rechargeTime: 4, img: "dc-dngn/altars/dngn_altar_jiyva01.png", neverPick: true }
	},

	// Define any monster types you need that don't already exist.
	MonsterTypeList: {
		goblinPriest: { ... see the MonsterType documentation }
	},
	// Describe special attributes for anything getting placed, monster, item, or tile.
	// Note that this goes by TYPE and so all things of that type will get the injection.
	inject: {
		ogre: { attitude: Attitude.AWAIT, tether: 8, tooClose: 2 },
		portal: { toThemeId: 'hellTheme' }
	}

Flooded Form

	You can make places that flood and area with something, then pick random "spark" locations and
	further flood a different tile around those.

	technique: 'flood',
	floodId			- the tile type to flood with
	tilePercent		- what percentage of the entire level should get this treatment
	sparkId			- what tile type will the interior island "sparks" be
	sparkDensity	- What percentage of this flooded area should get sparks?
	sparkLimit		- timeout if your attempt to generate sparks exceeds this

Maze Form

	technique: 'maze',
	isMaze: true,		// Generate a little maze in this area.
	xLen: 16,			
	yLen: 16,
	makeWalled: false,	// Should a wall be generated surrounding this mini maze?
	wallSymbol:  '#',
	floorSymbol: '.',
	supply: '8x gem',	// Any specialy loot to generate in this maze?


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

PlaceTypeList.miniMaze = {
	technique: 'maze',
	isMaze: true,
	xLen: 16,
	yLen: 16,
	makeWalled: false,
	wallSymbol:  '#',
	floorSymbol: '.',
	supply: '8x gem',
	flags: { rotate: true },
	symbols: {
	},
};

PlaceTypeList.microMaze = {
	technique: 'maze',
	isMaze: true,
	xLen: 8,
	yLen: 8,
	makeWalled: false,
	wallSymbol:  '#',
	floorSymbol: '.',
	supply: '2x gem',
	flags: { rotate: true },
	symbols: {
	},
};


PlaceTypeList.floodOpen = {
	technique: 'flood',
	floodId: 'floor',
	tilePercent: 0.01,
	sparkId: 'water',
	sparkLimit: 4000,
	sparkDensity: 0.01
}

PlaceTypeList.floodMud = {
	technique: 'flood',
	floodId: 'mud',
	tilePercent: 0.01,
	sparkId: 'water',
	sparkLimit: 4000,
	sparkDensity: 0.30
}

PlaceTypeList.floodWater = {
	technique: 'flood',
	floodId: 'water',
	tilePercent: 0.20,
	sparkId: 'floor',
	sparkLimit: 4,
	sparkDensity: 0.02
}

PlaceTypeList.floodWaterSmall = {
	technique: 'flood',
	floodId: 'water',
	tilePercent: 0.10,
	sparkId: 'floor',
	sparkLimit: 4,
	sparkDensity: 0.02
}

PlaceTypeList.floodWaterHuge = {
	technique: 'flood',
	floodId: 'water',
	tilePercent: 0.60,
	sparkId: 'floor',
	sparkLimit: 4,
	sparkDensity: 0.02
}

PlaceTypeList.floodIsland = {
	technique: 'flood',
	floodId: 'floor',
	tilePercent: 0.20,
	sparkId: 'water',
	sparkLimit: 1,
	sparkDensity: 1.00

}

PlaceTypeList.floodWall = {
	technique: 'flood',
	floodId: 'wallCave',
	tilePercent: 0.10,
	sparkId: 'floor',
	sparkLimit: 2,
	sparkDensity: 0.3
}



PlaceTypeList.floodMist = {
	technique: 'flood',
	floodId: 'mist',
	tilePercent: 0.20,
}

PlaceTypeList.floodOre = {
	technique: 'flood',
	floodId: 'vein',
	tilePercent: 0.20,
	sparkId: 'floor',
	sparkLimit: 2,
	sparkDensity: 0.005
}

PlaceTypeList.floodOreSmall = {
	technique: 'flood',
	floodId: 'vein',
	tilePercent: 0.10,
	sparkId: 'floor',
	sparkLimit: 2,
	sparkDensity: 0.005
}

PlaceTypeList.floodPit = {
	technique: 'flood',
	floodId: 'pit',
	tilePercent: 0.20,
	sparkId: 'floor',
	sparkLimit: 4,
	sparkDensity: 0.02
}
PlaceTypeList.floodPitSmall = {
	technique: 'flood',
	floodId: 'pit',
	tilePercent: 0.10,
	sparkId: 'floor',
	sparkLimit: 4,
	sparkDensity: 0.02
}
PlaceTypeList.floodPitLarge = {
	technique: 'flood',
	floodId: 'pit',
	tilePercent: 0.40,
	sparkId: 'floor',
	sparkLimit: 4,
	sparkDensity: 0.01
}

PlaceTypeList.firePit = {
	technique: 'flood',
	floodId: 'pit',
	tilePercent: 0.20,
	sparkId: 'flames',
	sparkLimit: 3,
	sparkDensity: 1.00

}

PlaceTypeList.pitEncircle = {
	technique: 'flood',
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
	StickerList: {
		darkPower: { img: "effect/bolt08.png", scale: 0.6, xAnchor: 0.5, yAnchor: 0.5 }
	},
	ItemTypeList: {
		goblinAltar: { mayWalk: false, mayFly: false, name: "goblin altar", rechargeTime: 4, img: "dc-dngn/altars/dngn_altar_jiyva01.png", neverPick: true }
	},
	MonsterTypeList: {
		goblinPriest: {
			core: [ 1, '3:10', 'evil', 'rot', 'sentient', 'humanoid', 'mon/earth/goblinPriest.png', '*' ],
			attitude: Attitude.WORSHIP,
			brainIgnoreClearShots: 20,
			brainMindset: 'greedy',
			greedField: 'isGem',
			isGoblin: true,
			isEarthChild: true,
			carrying: '40% spell.eRot',
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

PlaceTypeList.goblinGathering.ItemTypeList.goblinAltar.onTickRound = function() {
	if( !this.rechargeLeft ) {
		let healAtHealthLevel = 0.70;
		let f = new Finder(this.area.entityList,this).filter(e=>e.isGoblin && e.health<e.healthMax*healAtHealthLevel).shotClear().near(this.x,this.y,6);
		if( f.count ) {
			let entity = pick(f.all);
			let amount = Math.floor(entity.healthMax*healAtHealthLevel - entity.health);
			entity.takeHealing(this,amount,DamageType.ROT,true);
			tell( mSubject,this,' ',mVerb,'imbue',' ',mObject,entity,' with '+amount+'dark power.');
			Anim.Run({
				style:		'Missile',
				delayId:	this.id,
				origin:		this,
				follow:		entity,
				img:		StickerList.bloodGreen.img,
				numPerSec:		10,
				fireDuration:	0.3,
				flightDuration: 0.8
			});
			this.rechargeLeft = this.rechargeTime;
		}
	}
	this.glow = !this.rechargeLeft;
	this.light = this.rechargeLeft ? 0 : 4;
}

let starterChest = function(inject) {
	let basics = {
		typeFilter: 'chest',
		label: 'starterChest',
		isHidden: true,
		sign: 'Legacy of '+inject.properName+' '+inject.title+'. Take the contents of this chest to become a '+inject.legacyId+'.',
		name: inject.properName+'\'s Chest',
		properNoun: true,
		scionName: 'Scion of '+inject.properName,
		onLoot: (self,toucher) => PlaceTypeList.surfaceSunTemple.onLoot(self,toucher)
	};
	inject.infoFn = (info) => {
		info.infoPostfix = '<hr>Perks:<br/>'+(!inject.legacyId ? 'No Perks Yet' : Perk.preview(inject.legacyId).map( (value,index)=>''+index+'. '+value+'<br/>' ).join(''));
	};
	inject.carrying.push({ typeFilter: 'key', keyId: 'Solar Temple door' });
	return [Object.assign( {}, basics, inject )];
}

PlaceTypeList.moonEntry = {
	map:
`
...
.X.
...
`,
	flags: { isUnique: true, rotate: false },
	isUtility: true,
	forbidEnemies: true,
	forbidFriends: true,
	forbidTreasure: true,
	symbols: {
		'X': { typeFilter: 'marker', markerId: 'playerStartHere' }
	}
}


PlaceTypeList.surfaceSunTemple = {
	map:
`
        ##########
      ###........###
    ###............###
   ##................##
   #........b.........#
  ##......b...b.......##
  #....................#
 ##....................##
 #........12345.........#
 #....b........67890AB.b########
##........Y.............#..d..##
#f...b....X.a...........o...l.S#
##......................#.....##
 #....b........HIJKLMN.b########
 #........CDEFG.........#
 ##....................##
  #....................#
  ##......b...b.......##
   #........b.........#
   ##................##
    ###............###
      ###...ZZZ..###
        ##########
`,
	flags: { rotate: true, hasWall: true, isUnique: true },
	onLoot: (self,toucher) => {
		effectApply( { basis: 'eKillLabel', value: 'starterChest' }, self.map, self, null, 'loot');
		toucher.name = self.scionName;
		toucher.legacyId = self.legacyId;
		toucher.grantPerks();
	},
	symbols: {
/*
			legacyId: '',
			properName: '',
			title: '',
			carrying: ['',
			],
*/

		'1': starterChest({
			legacyId: 'airMage',
			properName: 'Aeronia',
			title: 'the typhoon',
			carrying: ['weapon.dagger, 10x ammo.dart, cloak.eRechargeFast',
			]
		}),
		'2': starterChest({
			legacyId: 'soldier',
			properName: 'Hathgar',
			title: 'the mighty',
			carrying: ['weapon.sword.eSmite, armor.eInert, 2x potion.eHealing',
			],
		}),
		'3': starterChest({
			properName: 'Slyndero',
			title: 'the clever',
			legacyId: 'ninja',
			carrying: [
				'gloves.assassinGloves, spell.eTeleport, spell.eInvisibility, potion.eOdorless, gem.eSeeInvisible, 2x potion.eHealing',
			],
		}),
		'4': starterChest({
			legacyId: 'brawler',
			properName: 'Duramure',
			title: 'the steadfast',
			carrying: [
				'weapon.hammer.eInert, armor.eInert, shield.eInert, 2x potion.eHealing',
			],
		}),
		'5': starterChest({
			properName: 'Arithern',
			title: 'the accurate',
			carrying: [
				'armor.eInert, weapon.bow.eBurn, 50x ammo.arrow, 5x ammo.dart, 2x potion.eHealing',
			],
		}),
		'6': starterChest({
			properName: 'Berthold',
			title: 'the blessed',
			carrying: [
				'armor.eInert, spell.eHealing, spell.eSmite, shield.eDeflectRot, stuff.lamp, weapon.hammer, 4x potion.eHealing, stuff.lumpOfMeat',
			],
		}),
		'7': starterChest({
			properName: 'Gadriin',
			title: 'the mindshaper',
			carrying: [
				'spell.ePossess, spell.eConfusion, stuff.voidCandle, 4x ammo.dart.eStartle, 2x potion.eHealing, 3x gem, 3x stuff.lumpOfMeat',
			],
		}),
		'8': starterChest({
			properName: 'Beowulf',
			title: 'the bear',
			carrying: [
				'2x charm.bearFigurine, weapon.sword, 2x potion.eHealing, 4x stuff.lumpOfMeat',
			],
		}),
		'9': starterChest({
			legacyId: 'monk',
			properName: 'Bindi',
			title: 'the Balanced',
			carrying: [
				'1x weapon.staff, 2x potion.eHealing, 4x stuff.lumpOfMeat',
				{ typeFilter: 'key', keyId: 'Solar Temple door' }
			],
		}),
		'0': starterChest({
			properName: 'Ozymandius',
			title: 'the destroyer',
			carrying: [
				'spell.eBurn, spell.eFreeze, cloak.eRechargeFast, 2x potion.eHealing',
			],
		}),
		'A': starterChest({
			properName: 'Nobody',
			title: 'the nothing',
			carrying: [
				'2x potion.eHealing',
			]
		}),
		'B': starterChest({
			properName: 'Nobody',
			title: 'the nothing',
			carrying: [
				'2x potion.eHealing',
			]
		}),
		'C': starterChest({
			properName: 'Nobody',
			title: 'the nothing',
			carrying: [
				'2x potion.eHealing',
			]
		}),
		'D': starterChest({
			properName: 'Nobody',
			title: 'the nothing',
			carrying: [
				'2x potion.eHealing',
			]
		}),
		'E': starterChest({
			properName: 'Nobody',
			title: 'the nothing',
			carrying: [
				'2x potion.eHealing',
			]
		}),
		'F': starterChest({
			properName: 'Nobody',
			title: 'the nothing',
			carrying: [
				'2x potion.eHealing',
			]
		}),
		'G': starterChest({
			properName: 'Nobody',
			title: 'the nothing',
			carrying: [
				'2x potion.eHealing',
			]
		}),
		'H': starterChest({
			properName: 'Nobody',
			title: 'the nothing',
			carrying: [
				'2x potion.eHealing',
			]
		}),
		'I': starterChest({
			properName: 'Nobody',
			title: 'the nothing',
			carrying: [
				'2x potion.eHealing',
			]
		}),
		'J': starterChest({
			properName: 'Nobody',
			title: 'the nothing',
			carrying: [
				'2x potion.eHealing',
			]
		}),
		'K': starterChest({
			properName: 'Nobody',
			title: 'the nothing',
			carrying: [
				'2x potion.eHealing',
			]
		}),
		'L': starterChest({
			properName: 'Nobody',
			title: 'the nothing',
			carrying: [
				'2x potion.eHealing',
			]
		}),
		'M': starterChest({
			properName: 'Nobody',
			title: 'the nothing',
			carrying: [
				'2x potion.eHealing',
			]
		}),
		'N': starterChest({
			properName: 'Nobody',
			title: 'the nothing',
			carrying: [
				'2x potion.eHealing',
			]
		}),
		Y: 'gem',
		Z: 'gem',
		l: 'stuff.candleLamp',
		X: { typeFilter: 'marker', markerId: 'playerStartHere' },
		o: { typeFilter: 'door', state: 'locked', keyId: 'Solar Temple door' },
		f: "fontSolar",
		a: { typeFilter: 'altar', unhide: 'starterChest', carrying: 'weapon.solarBlade' },
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

PlaceTypeList.garden = {
	map:
`
.p.p.
.p.p.
.p.p.
`,
	flags: { rotate: true },
	symbols: {
		p: { pick: ['plant.wheatPlant','plant.barleyPlant','plant.carrotPlant','plant.potatoPlant','plant.peaPlant','plant.beanPlant','plant.cabbagePlant'] },
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

PlaceTypeList.hellPortal = {
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
		portal: { toThemeId: 'hellTheme' }
	}
}

PlaceTypeList.moonPortal = {
	map:
`
...
.P.
...
`,
	forbidEnemies: true,
	forbidTreasure: true,
	symbols: {
		P: 'portal',
	},
	inject: {
		portal: { toThemeId: 'moonTheme', origin: 'PlaceTypeList' }
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
	TileTypeList: {
		masterStatue:    { mayWalk: false, mayFly: true, opacity: 0, name: "master statue", img: "dc-mon/statues/silver_statue.png"},
		kingStatue:    { mayWalk: false, mayFly: true, opacity: 0, name: "king statue", img: "dc-mon/statues/wucad_mu_statue.png"},
	}
}

PlaceTypeList.handoutStand = {
	map:
		`
		     txxxx
		.....,,,bx
		rrrrrp,,bx
		.....,,,bx
		.....t,,,x
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
		t: [ { typeFilter: 'stuff.torch' }, { typeFilter: 'wallStone' } ]
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
xrx+xrx
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
		gateway: { toThemeId: 'dwarfTown' },
		r: [ { typeFilter: 'stuff.torch' }, { typeFilter: 'wallStone' } ]
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
xtsx+xxtx
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
		s: [ { typeFilter: 'sign', sign: 'BYJOB' }, { typeFilter: 'wallStone' } ],
		t: [ { typeFilter: 'stuff.torch' }, { typeFilter: 'wallStone' } ]
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
xrxx+xxrx
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "floorStone",
		x: "wallStone",
		t: 'table',
		b: 'bed',
		c: 'chest',
		d: { typeFilter: 'dwarf', attitude: Attitude.WANDER, tether: 3, jobId: 'isSentry'  },
		s: [ { typeFilter: 'sign', sign: 'BYJOB' }, { typeFilter: 'wallStone' } ],
		r: [ { typeFilter: 'stuff.torch' }, { typeFilter: 'wallStone' } ]
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
xrx+xrx
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "floorStone",
		x: "wallStone",
		d: "dwarf",
		t: 'table',
		b: 'barrel',
		r: [ { typeFilter: 'stuff.torch' }, { typeFilter: 'wallStone' } ]
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
xrx+xrx
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "floorStone",
		x: "wallStone",
		d: "dwarf",
		t: 'table',
		b: 'barrel',
		r: [ { typeFilter: 'stuff.torch' }, { typeFilter: 'wallStone' } ]
	},
	inject: {
		dwarf: { attitude: Attitude.WANDER, tether: 6, jobId: 'isLayman' }
	}
}

PlaceTypeList.market = {
	map:
`
.d.b.d.
stt.tts
.......
.......
stt.tts
.d.b.d.
`,
	forbidTreasure: true,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "floorStone",
		t: 'table',
		b: 'brazier',
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
.str.
..d..
.....
`,
	forbidTreasure: true,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "floorStone",
		t: 'table',
		d: { typeFilter: 'dwarf', jobId: 'isMinor' },
		s: [{ typeFilter: 'sign', sign: 'BYJOB' }, { typeFilter: 'table' }],
		r: [ { typeFilter: 'stuff.torch' }, { typeFilter: 'table' } ]
	},
}

PlaceTypeList.shopLarge = {
	map:
`
xxxxxxx
xcbd..x
xttttlx
x.....x
x.....x
xt....x
xrsx+xx
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
		s: [{ typeFilter: 'sign', sign: 'BYJOB' }, {typeFilter: 'wallStone'}],
		r: [ { typeFilter: 'stuff.torch' }, { typeFilter: 'wallStone' } ],
		l: [ { typeFilter: 'stuff.lamp' }, { typeFilter: 'table' } ]
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
 r..r
......
..ff..
.dff..
......
 r..r 
`,
	flags: { rotate: true, hasWall: true },
	symbols: {
		'.': "floorStone",
		f: "fountain",
		d: { typeFilter: 'dwarf', jobId: 'evangelist' },
		r: 'stuff.lamp'
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

PlaceTypeList = Type.establish(
	'PlaceType',
	{
		onFinalize: (placeType, placeId, checker) => {
			placeType.technique = placeType.technique || 'map';
			determinePlaceLevel(placeType,window.MonsterTypeList);
			determineAndValidatePlaceSymbolHash(placeType,checker);
			Object.each( placeType.symbols || {}, checker.checkLoot );
		}
	},
	PlaceTypeList
);


return {
	PlaceTypeList: PlaceTypeList,
	rCOMMON: rCOMMON,
	rUNCOMMON: rUNCOMMON,
	rRARE: rRARE,
	rEPIC: rEPIC,
	rLEGENDARY: rLEGENDARY
}

});

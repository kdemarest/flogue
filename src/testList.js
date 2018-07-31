Module.add('testList',function() {

let TestList = {};

PlaceTypeList.testRoom = {
	map:
`
#########
#a.....b#
#.......#
#.......#
#...C123#
#.......#
#.......#
#c.....d#
#########
`,
	flags: { rotate: false, hasWall: true, isUnique: true },
	symbols: {
		'a': { typeFilter: 'marker', markerId: 'topLeft' },
		'b': { typeFilter: 'marker', markerId: 'topRight' },
		'c': { typeFilter: 'marker', markerId: 'bottomLeft' },
		'd': { typeFilter: 'marker', markerId: 'bottomRight' },
		'C': { typeFilter: 'marker', markerId: 'center' },
		'1': { typeFilter: 'marker', markerId: 'dist1' },
		'2': { typeFilter: 'marker', markerId: 'dist2' },
		'3': { typeFilter: 'marker', markerId: 'dist3' },
	}
};


ScapeList.testSingleRoom = () => ({
	dim: 				12,
	architecture: 		"none",
});

ThemeList.testSimpleRoom = {
	name: 			'simple one-room theme',
	isUnique: 		true,
	inControl: 		true,
	scapeId: 		'testSingleRoom',
	palette: 		{ basis: 'stoneRooms' },
	rREQUIRED: 		'testRoom',
	enemyDensity: 	0.0,
	friendDensity: 	0.0,
	itemDensity: 	0.0,
}

// CheckPlayerBasics
// Player can get instantiated, with a bunch of items in inventory and wielded.
TestList.checkPlayerBasics = {
	themeId: 'testSimpleRoom',
	depth: 1,
	player: {
		atMarker: 'center',
		inventoryLoot: '1x potion.eHealing',
		inventoryWear:  'armor, helm, bracers, boots',
	},
	check(result,helper) {
		result.expect( 'helper.player.naturalMeleeWeapon', 'player has a natural melee weapon' );
		result.expect( 'helper.inventory(i=>i.isPotion && i.op=="heal")', 'player has a healing potion' );
		result.expect( 'helper.inventory(i=>i.typeId=="armor" && i.inSlot).count', 'player wearing armor' );
		result.expect( 'helper.inventory(i=>i.typeId=="helm" && i.inSlot).count', 'player wearing helm' );
		result.expect( 'helper.inventory(i=>i.typeId=="bracers" && i.inSlot).count', 'player wearing bracers' );
		result.expect( 'helper.inventory(i=>i.typeId=="boots" && i.inSlot).count', 'player wearing boots' );
		result.resolved = true;
	}
}

// SimpleCombat
// Combat with a simple goblin.
TestList.simpleCombat = {
	themeId: 'testSimpleRoom',
	depth: 0,
	player: {
		atMarker: 'center',
		inventoryWear: 'weapon.sword.eInert',
		commandList: [Command.E,Command.E,Command.E,Command.E],
	},
	injectList: [
		{ typeFilter: 'goblin', atMarker: 'dist1', testNeverFlee: true }
	],
	think(entity,helper) {
		if( entity.isUser() ) {
			entity.command = entity.commandList.shift();
			return true;
		}
	},
	check(result,helper) {
		result.expectAt( 0, '!helper.get("goblin").isDead()', 'goblin starts alive' );
		if( helper.player.commandList.length > 0 ) {
			return;
		}
		result.expect( '!helper.get("goblin")', 'goblin is dead' );
		result.resolved = true;
	}
}

// MakeAllMonsters
// Each monster is made one by one and then immediately destroyed.
TestList.makeAllMonsters = {
	themeId: 'testSimpleRoom',
	depth: 0,
	timeLimit: 300,
	player: {
		atMarker: 'center',
		immortal: true,
	},
	tick(helper) {
		if( helper.lastEntity ) {
			helper.lastEntity.vanish = true;
		}
		if( !helper.monList ) {
			helper.monList = Object.keys(MonsterTypeList).filter( typeId=>MonsterTypeList[typeId].control!==Control.USER );
		}
		if( helper.monList.length == 0 ) {
			helper.done = true;
			return;
		}
		let typeId = helper.monList.shift();
		helper.findTypeId = typeId;
		let entity = new Entity( helper.area.depth, MonsterTypeList[typeId], null, helper.area.jobPicker );
		entity.gateTo(helper.area,1,1);
		helper.lastEntity = entity;
	},
	check(result,helper) {
		result.resolved = helper.done;
		if( result.resolved ) return;
		result.expect( '!helper.get(helper.findTypeId).isDead()', helper.findTypeId+' created' );
	}
}

TestList.legacies = {
	themeId: 'testSimpleRoom',
	depth: 0,
	timeLimit: 3300+4000,
	player: {
		atMarker: 'topLeft',
		immortal: true,
	},
	tick(helper) {
		helper.player.legacyId = 'brawler';
		helper.player.inventoryLoot = '2x weapon.club, 10x ammo.rock';

//	MonsterTypeList.player.inventoryLoot = 'armor, helm, bracers, boots, stuff.oilLamp, 2x weapon, shield, weapon.bow';
//	MonsterTypeList.player.legacyId = 'monk';


	}
}

// MakeAllItems
// Every possible item is made, except permutations.
TestList.makeAllItems = {
	themeId: 'testSimpleRoom',
	depth: 0,
	timeLimit: 3300+4000,
	player: {
		atMarker: 'topLeft',
		immortal: true,
	},
	tick(helper) {
		if( helper.lastItem ) {
			helper.lastItem.destroy();
		}
		if( !helper.itemList ) {
			helper.picker = new Picker(helper.area.depth);
			helper.itemList = [];
			let one = { noType:{} };
			Object.each( ItemTypeList, item => {
				if( item.isRandom || !item.isTreasure ) return;
				let varietyHash = item.varieties || one;
				Object.each( varietyHash || one, variety => {
					let materialHash = variety.materials || item.materials || one;
					Object.each( materialHash, material => {
						let qualityHash = variety.qualities || material.qualities || item.qualities || one;
						Object.each( qualityHash, quality => {
							let effectHash = Object.values(variety.effects || material.effects || quality.effects || item.effects || one);
							Object.each( effectHash, effect => {
								let typeFilter = String.combine('.',item.typeId,variety.typeId,material.typeId,quality.typeId,effect.typeId);
								helper.itemList.push(typeFilter);
							});
						});
					});
				});
			});
		}
		if( helper.itemList.length == 0 ) {
			helper.done = true;
			return;
		}
		let typeFilter = helper.itemList.shift();
		helper.findTypeFilter = typeFilter;
		let type = helper.picker.pickItem( typeFilter );
		let item = helper.area.map.itemCreateByType(3,2,type,type.presets,null);
		helper.lastItem = item;
	},
	check(result,helper) {
		result.resolved = helper.done;
		if( result.resolved ) return;
		helper.typeId = helper.findTypeFilter.split('.')[0];
		result.expect( 'helper.get(helper.typeId)', helper.findTypeFilter+' created' );
		result.expect( 'helper.get(helper.typeId).matter !== undefined', helper.findTypeFilter+' has matter' );
	}
}

// PlayFullGame
// Run the plauer through the entire game.
TestList.playFullGame = {
	themeId: false,
	depth: 0,
	timeLimit: 1000*200,
	player: {
		immortal: true,
	},
	findNextDestination(entity,helper,onArrive,onStall) {
		let altar = entity.map.findItem(entity).filter( item => !helper.visited[item.id] && item.isSolarAltar );
		let items = entity.map.findItem(entity).filter( item => !helper.visited[item.id] && (item.isTreasure || (item.isContainer && item.inventory.length)) ).byDistanceFromMe();
		let sites = entity.area.findSite(entity).filter( site => !helper.visited[site.id] ).byDistanceFromMe();
		let stairs = entity.map.findItem(entity).filter( item => !helper.visited[item.id] && item.isStairsDown ).byDistanceFromMe();
		let closer = items.first;
		if( items.first && sites.first && entity.getDistance(sites.first.x,sites.first.y) < entity.getDistance(items.first.x,items.first.y) ) {
			closer = sites.first;
		}
		let desire = altar.first || closer || stairs.first;
		console.assert(desire);
		console.assert(desire.area);
		let closeEnough = desire.isSite || desire.isSolarAltar || (desire.isContainer && !desire.isRemovable) ? 1 : 0;
		entity.testerThing = desire;
		entity.testerStallCount = 0;
		entity.destination = {
			isDestination: true,
			isTesterDirected: true,
			thing: desire,
			area: desire.area,
			x: desire.x,
			y: desire.y,
			site: null,
			closeEnough: closeEnough,
			stallLimit: 4,
			name: desire.name,
			id: 'DEST.'+desire.name+'.'+GetTimeBasedUid(),
			onArrive: onArrive,
			onStall: onStall
		};
	},
	think(entity,helper) {
		if( !entity.isUser() ) {
			return;
		}
		let map = entity.map;
		entity.brainPath = true;
		entity.playerUseAi = true;
		entity.healthMax = 10000;
		entity.strictAmmo = false;
		entity.brainIgnoreClearShots = 30;	// So that we don't spam a spell of confusion endlessly at range...
		entity.health = entity.healthMax;
		entity.pathDistLimit = map.xLen * map.yLen;
		if( entity.inCombat() ) {
			return;
		}
//		let enemyList = entity.findAliveOthersNearby().canPerceiveEntity().isMyEnemy().byDistanceFromMe();
//		if( enemyList.count ) {
//			return;
//		}
		if( entity.destination ) {
			return;
		}
		if( helper.arrived ) {
			let thing = entity.testerThing;
			// Is it a chest? Bump it.
			if( thing.isSolarAltar && (!entity.deathReturn || entity.deathReturn.altarId!==thing.id) ) {
				this.brainState.activity = "Arrived at altar. bumping.";
				let dir = entity.dirToPosNatural(thing.x,thing.y);
				entity.command = Direction.toCommand(dir);
				return true;
			}
			if( thing.isContainer && !thing.isRemovable && thing.inventory.length) {
				this.brainState.activity = "Arrived at container. bumping.";
				let dir = entity.dirToPosNatural(thing.x,thing.y);
				entity.command = Direction.toCommand(dir);
				return true;
			}
			if( thing.isStairsDown && thing.area.id == helper.player.area.id ) {
				this.brainState.activity = "Arrived at stairs. descending.";
				entity.command = Command.ENTERGATE;
				return true;
			}
			helper.visited[thing.id] = true;
			helper.arrived = false;
		}
		let onArrive = () => {
			//debugger;
			helper.arrived = true;
		}
		let onStall = (entity,destination) => {
			if( entity.testerThing.isTreasure || entity.testerThing.isContainer || entity.testerThing.isSite ) {
				// Skip this thing, if we can't reach it.
				//debugger;
				helper.visited[entity.testerThing.id] = true;
				console.log('Skipping '+entity.testerThing.id+'.');
				this.brainState.activity = "Stalled heading towards "+entity.testerThing.id+". Skipping.";
			}
		}

		this.findNextDestination(entity,helper,onArrive,onStall);
	},
	tick(helper) {
		if( !helper.initialized ) {
			helper.visited = {};
			helper.initialized = true;
		}

	},
	check(result,helper) {
		result.resolved = helper.player.area.depth == Rules.DEPTH_MAX;
		if( result.resolved ) return;
	}
}

return {
	TestList: TestList
}

});

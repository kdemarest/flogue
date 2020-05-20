Module.add('testList',function() {

let TestList = {};

Type.register('PlaceType',{ testRoom : {
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
}});


ScapeList.testSingleRoom = () => ({
	dim: 				12,
	architecture: 		"cave",
});

Type.register( 'Theme', { testSimpleRoom: {
	name: 			'simple one-room theme',
	isUnique: 		true,
	iDescribeMyGates: true,
	scapeId: 		'testSingleRoom',
	palette: 		{ basis: 'stoneRooms' },
	rREQUIRED: 		'testRoom',
	enemyDensity: 	0.0,
	friendDensity: 	0.0,
	itemDensity: 	0.0,
}});

// CheckPlayerBasics
// Player can get instantiated, with a bunch of items in inventory and wielded.
TestList.checkPlayerBasics = {
	themeId: 'testSimpleRoom',
	depth: 1,
	player: {
		atMarker: 'center',
		carrying: '1x potion.eHealing',
		wearing:  'armor, helm, bracers, boots',
	},
	check(result,helper) {
		result.expect( helper=>helper.player.naturalMeleeWeapon, 'player has a natural melee weapon' );
		result.expect( helper=>helper.inventory(i=>i.isPotion && i.op=="heal"), 'player has a healing potion' );
		result.expect( helper=>helper.inventory(i=>i.typeId=="armor" && i.inSlot).count, 'player wearing armor' );
		result.expect( helper=>helper.inventory(i=>i.typeId=="helm" && i.inSlot).count, 'player wearing helm' );
		result.expect( helper=>helper.inventory(i=>i.typeId=="bracers" && i.inSlot).count, 'player wearing bracers' );
		result.expect( helper=>helper.inventory(i=>i.typeId=="boots" && i.inSlot).count, 'player wearing boots' );
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
		wearing: 'weapon.sword.eInert',
		commandList: [Command.E,Command.E,Command.E,Command.E],
	},
	injectList: [
		{ typeFilter: 'goblin', atMarker: 'dist1', testNeverFlee: true }
	],
	think(entity,helper) {
		if( entity.isUser ) {
			entity.command = entity.commandList.shift();
			return true;
		}
	},
	tick(helper) {
		helper.player.playerUnderTestControl = true;
	},
	check(result,helper) {
		result.expectAt( 0, helper=>!helper.get("goblin").isDead(), 'goblin starts alive' );
		if( helper.player.commandList.length > 0 ) {
			return;
		}
		result.expect( helper=>!helper.get("goblin"), 'goblin is dead' );
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
		entity.requestGateTo(helper.area,1,1);
		helper.lastEntity = entity;
	},
	check(result,helper) {
		result.resolved = helper.done;
		if( result.resolved ) return;
		result.expect( helper=>!helper.get(helper.findTypeId).isDead(), helper.findTypeId+' created' );
	}
}

// RunAllEffects
// The player runs each effect, independent of items, against a goblin.
TestList.runAllEffects = {
	themeId: 'testSimpleRoom',
	depth: 0,
	timeLimit: 300,
	player: {
		atMarker: 'center',
		immortal: true,
	},
	think(entity,helper) {
		if( entity.id === helper.player.id ) {
			let effect = Object.assign( {}, EffectTypeList[helper.effectTypeId] );
			helper.effect = effect;
			helper.target = (effect.isHarm || effect.isDeb) ? helper.enemy : helper.player;
			helper.effectOp = OpTypeHash[effect.op];
			console.assert( helper.effectOp );
			helper.effectStat = effect.stat;
			helper.effectResult = effectApply( effect, helper.target, helper.player, null, 'test' );

			// Critical to stop the player from attacking, which might halt invisibility or change something...
			entity.command = Command.WAIT;
		}
		else {
			// We need the Goblin to just stand there and take it, not defend actively or attack
			entity.command = Command.WAIT;
		}
		// Indicates that I did all the thinking for you. Don't try to think on your own.
		return true;
	},
	tick(helper) {
		if( !helper.effectList ) {
			helper.effectList = Object.keys(EffectTypeList).filter( effectId => !EffectTypeList[effectId].testSkip );
		}
		if( helper.effectList.length == 0 ) {
			helper.done = true;
			helper.player.playerUnderTestControl = false;
			return;
		}
		let area = helper.area;
		if( helper.enemy ) {
			helper.enemy.testerDestroying = true;
		}

		// Doing this tests onEnd
		DeedManager.end( deed => deed.target.id === helper.player.id );
		helper.player.testerDestroying = true;

		helper.effectTypeId = helper.effectList.shift();
		if( helper.effectTypeId === 'eInvisible' ) {
			debugger;
		}

		helper.makeFreshPlayer();

		helper.enemy = helper.makeEnemy( 'goblin', 'topLeft' );
	},
	check(result,helper) {
		result.resolved = helper.done;
		if( result.resolved ) return;
		let assessEffectResult = helper => {
			let stat = helper.effectStat;
			let target = helper.target;
			if( EffectTypeList[helper.effectTypeId].testVerifyFn ) {
				debugger;
				return EffectTypeList[helper.effectTypeId].testVerifyFn(helper.target);
			}
			if( helper.effectOp.calcFn ) {
				return target[stat] !== target.baseType[stat];
			}
			// Each OpType will have to just figure out how to discover whether its test worked.
			return true;
		}
		result.expect( assessEffectResult, helper.effectTypeId+' functioned', helper.effectResult );
	}
}


TestList.makeAllLegacies = {
	themeId: 'testSimpleRoom',
	depth: 0,
	timeLimit: 3300+4000,
	player: {
		atMarker: 'center',
		immortal: true,
	},
	think(entity,helper) {
		if( entity.id === helper.player.id ) {
			// Here is where we'd use all our skills.
			// Critical to stop the player from attacking, which might halt invisibility or change something...
			entity.command = Command.WAIT;
		}
		else {
			// We need the Goblin to just stand there and take it, not defend actively or attack
			entity.command = Command.WAIT;
		}
		// Indicates that I did all the thinking for you. Don't try to think on your own.
		return true;
	},
	tick(helper) {
		if( !helper.legacyList ) {
			helper.legacyList = Object.keys(LegacyList);
		}
		if( helper.legacyList.length == 0 ) {
			helper.done = true;
			helper.player.playerUnderTestControl = false;
			return;
		}
		if( helper.enemy ) {
			helper.enemy.testerDestroying = true;
		}

		helper.player.testerDestroying = true;

		helper.legacyId = helper.legacyList.shift();

		let playerData = {
			legacyId: helper.legacyId,
			level: 20
		};
		helper.makeFreshPlayer('center',playerData);
		helper.enemy = helper.makeEnemy( 'goblin', 'topLeft' );
	},
	check(result,helper) {
		result.resolved = helper.done;
		if( result.resolved ) return;
		let assessLegacyResult = helper => {
			return true;
		}
		result.expect( assessLegacyResult, helper.legacyId+' created' );
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
		result.expect( helper=>helper.get(helper.typeId), helper.findTypeFilter+' created' );
		result.expect( helper=>helper.get(helper.typeId).matter !== undefined, helper.findTypeFilter+' has matter' );
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
			id: 'DEST.'+desire.name+'.'+Date.makeUid(),
			onArrive: onArrive,
			onStall: onStall
		};
	},
	think(entity,helper) {
		if( !entity.isUser ) {
			return;
		}
		let map = entity.map;
		entity.brainPath = true;
		entity.healthMax = 10000;
		entity.strictAmmo = false;
		entity.brainIgnoreClearShots = 30;	// So that we don't spam a spell of confusion endlessly at range...
		entity.health = entity.healthMax;
		entity.pathDistLimit = map.xLen * map.yLen;
		if( entity.inCombat() ) {
			helper.inCombatCounter++;
			if( helper.inCombatCounter > 100 ) {
				// Maybe I'm fighting something that I can not kill? Probably should check for stillness here
				// as well, but for now lets just kill it.
				let victim = entity.area.entityList.find( e=>e.id==entity.lastAttackTargetId );
				if( victim && !victim.isDead() ) {
					console.log('vanishing a thing I cannot kill.');
					victim.vanish = true;
				}
			}
			return;
		}
		helper.inCombatCounter = 0;
//		let enemyList = entity.findAliveOthersNearby().canPerceiveEntity().isMyEnemy().byDistanceFromMe();
//		if( enemyList.count ) {
//			return;
//		}
		if( entity.destination ) {
			if( !helper.lastDestId || helper.lastDestId !== entity.destination.id ) {
				helper.lastDestId = entity.destination.id;
				helper.lastDestCounter = 0;
			}
			helper.lastDestCounter++;
			if( helper.lastDestCounter > 100 ) {
				console.log('teleporting because stuck heading towards single destination.');
				entity.takeTeleport();
				helper.lastDestCounter = 0;
			}
			return;
		}
		if( helper.arrived ) {
			let thing = entity.testerThing;
			// Is it a chest? Bump it.
			if( thing.isSolarAltar && (!entity.deathReturn || entity.deathReturn.altarId!==thing.id) ) {
				entity.brainState.activity = "Arrived at altar. bumping.";
				let dir = entity.dirToPosNatural(thing.x,thing.y);
				entity.command = Direction.toCommand(dir);
				return true;
			}
			if( thing.isContainer && !thing.isRemovable && thing.inventory.length) {
				entity.brainState.activity = "Arrived at container. bumping.";
				let dir = entity.dirToPosNatural(thing.x,thing.y);
				entity.command = Direction.toCommand(dir);
				return true;
			}
			if( thing.isStairsDown && thing.area.id == helper.player.area.id ) {
				entity.brainState.activity = "Arrived at stairs. descending.";
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
				entity.brainState.activity = "Stalled heading towards "+entity.testerThing.id+". Skipping.";
			}
		}

		this.findNextDestination(entity,helper,onArrive,onStall);
	},
	tick(helper) {
		if( !helper.initialized ) {
			helper.visited = {};
			helper.initialized = true;
		}
		entity.player.playerUnderTestControl = true;
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

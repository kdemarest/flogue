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


TestList.checkPlayerBasics = {
	themeId: 'testSimpleRoom',
	depth: 1,
	player: {
		atMarker: 'center',
		inventoryLoot: '1x potion.eHealing',
		inventoryWear:  'armor, helm, bracers, boots',
		testerCommands: [Command.NONE],
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
TestList.simpleCombat = {
	themeId: 'testSimpleRoom',
	depth: 0,
	player: {
		atMarker: 'center',
		inventoryWear: 'weapon.sword.eInert',
		testerCommands: [Command.E,Command.E,Command.E,Command.E],
	},
	injectList: [
		{ typeFilter: 'goblin', atMarker: 'dist1', testNeverFlee: true }
	],
	check(result,helper) {
		result.expectAt( 0, '!helper.get("goblin").isDead()', 'goblin starts alive' );
		if( !helper.commandsComplete ) {
			return;
		}
		result.expect( '!helper.get("goblin")', 'goblin is dead' );
		result.resolved = true;
	}
}

TestList.makeAllMonsters = {
	themeId: 'testSimpleRoom',
	depth: 0,
	player: {
		atMarker: 'center',
		immortal: true,
	},
	act(helper) {
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

TestList.makeAllItems = {
	themeId: 'testSimpleRoom',
	depth: 0,
	player: {
		atMarker: 'topLeft',
		immortal: true,
	},
	act(helper) {
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
		if( typeFilter == 'weapon.solarBlade.solarium.eInert' ) {
			window._hackHalt = true; //debugger;
		}
		let type = helper.picker.pickItem( typeFilter );
		let item = helper.area.map.itemCreateByType(3,2,type,type.presets,null);
		helper.lastItem = item;
	},
	check(result,helper) {
		result.resolved = helper.done;
		if( result.resolved ) return;
		helper.typeId = helper.findTypeFilter.split('.')[0];
		result.expect( 'helper.get(helper.typeId)', helper.findTypeFilter+' created' );
	}
}

return {
	TestList: TestList
}

});

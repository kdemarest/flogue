Module.add('test',function() {

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


TestList = {};
TestList.checkPlayerBasics = {
	themeId: 'testSimpleRoom',
	depth: 1,
	entities: {
		player: {
			atMarker: 'center',
			inventoryLoot: '1x potion.eHealing',
			inventoryWear:  'armor, helm, bracers, boots, stuff.oilLamp'
		},
	}
}
TestList.first = {
	themeId: 'testSimpleRoom',
	depth: 1,
	entities: {
		player: {
			atMarker: 'center',
			inventoryLoot: '1x potion.eHealing',
			inventoryWear:  'armor, helm, bracers, boots, stuff.oilLamp'
		},
		goblin: {
			atMarker: 'dist1'
		}
	}
}

class Test {
	constructor() {
		this.init = null;
		this.checkSuccess = () => false;
	}
	start(testId,map,player) {
		let test = TestList[testId];
		let gate = {
			x: player.x,
			y: player.y,
			typeId: 'FakeTestGate',
			toAreaId: 'area.'+testId,
			themeId: test.themeId,
		}
		player.actEnterGate(gate);
		player.clearInventory();
		console.assert( player.area.id && player.area.id == gate.toAreaId );
	}

}

class Tester {
	constructor() {
		this.roster = [];

	}

	capturePristinePlayer
	run(testId,area) {
		let player = area.entityList.find( e=>e.userControllingMe );
		console.assert(player);
		let test = new Test().start(testId,area.map,player);
	}
	

return {
	Tester: Tester
}

});

Module.add('tester',function() {

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
	player: {
		atMarker: 'center',
		inventoryLoot: '1x potion.eHealing',
		inventoryWear:  'armor, helm, bracers, boots, stuff.oilLamp',
		testerCommands: [Command.NONE],
	},
	checkState(result,helper) {
		result.expect( 'helper.player.naturalMeleeWeapon', 'player has a natural melee weapon' );
		result.expect( 'helper.inventory(i=>i.typeId=="armor" && i.inSlot).count', 'player wearing armor' );
		result.expect( 'helper.inventory(i=>i.typeId=="helm" && i.inSlot).count', 'player wearing helm' );
		result.expect( 'helper.inventory(i=>i.typeId=="bracers" && i.inSlot).count', 'player wearing bracers' );
		result.expect( 'helper.inventory(i=>i.typeId=="boots" && i.inSlot).count', 'player wearing boots' );
		result.resolved = true;
	}
}
TestList.first = {
	themeId: 'testSimpleRoom',
	depth: 1,
	player: {
		atMarker: 'center',
		inventoryLoot: '1x potion.eHealing',
		inventoryWear:  'armor, helm, bracers, boots, stuff.oilLamp',
		testerCommands: [Command.E,Command.E,Command.E,Command.E],
	},
	injectList: {
		goblin0: { typeFilter: 'goblin', atMarker: 'dist1' }
	},
	checkState(result,helper) {
		result.resolved = true;
	}
}

class TestHelper {
	constructor(area) {
		this.area = area;
	}
	get player() {
		return this.area.entityList.find( e=>e.userControllingMe );
	}
	item(fn) {
		return new Finder(this.area.map.itemList).filter(fn);
	}
	entity(fn) {
		return new Finder(this.area.entityList).filter(fn);
	}
	inventory(fn) {
		return new Finder(this.player.inventory).filter(fn);
	}
}

class TestResult {
	constructor(title,helper) {
		this.title = title;
		this.list = [];
		this.helper = helper;
		this.resolved = false;
	}
	expect( expression, message ) {
		let helper = this.helper;
		let value;
		try {
			value = eval(expression);
			this.list.push( { success: !!value, message: message } );
		} catch(e) {
			this.list.push( { success: false, exception: e, message: message } );
		}
	}
}

class Test {
	constructor(id,logFn) {
		this.id = id;
		this.logFn = logFn;
		this.valueRestore = [];
		this.result = null;
		this.area = null;
	}
	getCommand(entity) {
		entity.command = entity.testerCommands.shift();
	}
	finish() {
		this.logFn(this.result);
		this.valueRestore.forEach( restoreFn => restoreFn() );
	}
	alter(target,overlay) {
		let oldValue = JSON.stringify(target);
		Object.assign( target, overlay );
		this.valueRestore.push( () => {
			Object.strip(target);
			Object.assign(target,JSON.parse(oldValue));
		});
	}
	check() {
		if( !this.result.resolved ) {
			this.checkState( this.result, this.result.helper );
		}
		if( this.result.resolved ) {
			this.finish();
			return true;
		}
	}
	start(testId,user) {
		let test = TestList[testId];
		console.assert( test.themeId );
		this.alter( ThemeList[test.themeId],   test.theme );
		this.alter( MonsterTypeList['player'], test.player );
		this.checkState = test.checkState.bind(test);

		try {
			user.startGame( test.depth, test.themeId, 'player', test.player.atMarker, () => {
				this.area = user.entity.area;
				this.result = new TestResult('Test: '+testId,new TestHelper(this.area));
				user.entity.testControl = (entity) => {
					this.getCommand(entity);
				};
				user.tickWorld(false);
			});
		} catch(e) {
			this.result = {
				title: 'Test: '+testId,
				resolved: true,
				list: [{
					success: false,
					message: 'exception during startup.',
					exception: e
				}]
			}
			this.finish();
		}

		return this;
	}
}

class TestManager {
	constructor() {
		this.roster = [];
		this.test = null;
		this.outputDivId = null;
		this.okCount = 0;
		this.failCount = 0;
	}
	check() {
		if( !this.test ) {
			return;
		}
		let result = this.test.check();

		return result;
	}
	updateStatus() {
		$('#testFail').html(this.failCount);
		$('#testOK').html(this.okCount);
		$('#testInFlight').html(this.test?this.test.id:'');
	}
	log(result) {
		let s = '<b>'+result.title+'</b><br>';
		result.list.forEach( result => {
			console.assert(result.success !== undefined && typeof result.success === 'boolean');
			if( result.success ) {
				this.okCount++;
			}
			else {
				this.failCount++;
			}
			s += result.success ? 'OK  ' : '<b>FAIL<b>';
			s += ' '+result.message;
			if( result.exception ) {
				s += '<br><pre>'+JSON.stringify(result.exception,null,4)+'</pre>';
			}
			s += '<br>';
		});
		$(this.outputDivId).html( s ).show();
		this.updateStatus();
		this.test = null;
	}

	run(roster,area,outputDivId,haltOnError) {
		if( roster === null ) {
			this.roster = Object.keys(TestList);
		}
		else {
			this.roster = Array.isArray(roster) ? roster : [roster];
		}
		this.outputDivId = outputDivId;
		this.updateStatus();
		let user = area.entityList.find( e=>e.userControllingMe ).userControllingMe;
		console.assert(user);

		let intervalHandle = setInterval( () => {
			if( haltOnError && this.failCount > 0 ) {
				return;
			}
			if( !this.test ) {
				let testId = this.roster.shift();
				if( !testId ) {
					clearInterval(intervalHandle);
					return;
				}
				this.test = new Test(testId,this.log.bind(this)).start(testId,user);
			}
		}, 5 );
	}
}
let Tester = new TestManager();

class ViewTester {
	constructor(divId,getPlayerFn) {
		function run(testId) {
			let haltOnError = $('#haltOnError').val();
			Tester.run( testId, getPlayerFn().area, outputDivId, haltOnError );
		}

		let outputDivId = '#testResults';
		$(divId).empty();

		let input = $('<input id="testId" type="text" value="checkPlayerBasics">')
			.appendTo(divId)
			.keydown( function(e) {
				e.stopPropagation();
			})
			.change( function() {
				run( $(this).val() );
			})
			.keyup(function(e) {
				if(e.keyCode == 13) {
					run( $(this).val() );
				}
			})
		;
		let checkbox = $('<input id="testHaltOnError" type="checkbox" checked>Halt on error?')
			.appendTo(divId);
		$('<button>GO</button>')
			.appendTo(divId)
			.click( function() {
				run( $(input).val() );
			});
		$('<button>ALL</button>')
			.appendTo(divId)
			.click( function() {
				run( null );
			});
		$('<pre id="testStatus"><span id="testFail">0</span> fail, <span id="testOK">0</span> OK (<span id="testInFlight"></span>)</pre>')
			.appendTo(divId);
		$('<pre id="'+outputDivId.replace('#','')+'"></pre>')
			.appendTo(divId);
	}
	render() {
	}
}

return {
	Tester: Tester,
	ViewTester: ViewTester
}

});


/*
		if( !test.hardReset ) {
			player.control = Control.TESTER;
			let gate = {
				x: player.x,
				y: player.y,
				gateDir: test.depth - player.area.depth,
				typeId: 'FakeTestGate',
				toAreaId: 'area.'+testId,
				themeId: test.themeId,
			}
			// Clear the inventory of all but light-providers;
			player.inventory.forEach( item => {
				if( item.isNatural || (item.effect && item.effect.stat=='light') ) {
					item.destroy();
				}
			});
			// Halt all non-light deeds on me.
			DeedManager.end( deed => {
				return deed.target.id == player.id && deed.stat !== 'light';
			});
			// If the world has been ticking any prior area, we don't want it interfering
			// with this test.
			delete player.userControllingMe.priorArea;
			player.actEnterGate(gate);
			console.assert( player.area.id && player.area.id == gate.toAreaId );
			// We also don't want the area we just left ticking. 
			delete player.userControllingMe.priorArea;

			player.level = test.depth;
			if( player.inventoryLoot ) {
				player.lootTake( player.inventoryLoot, player.level, null, true );
			}
			console.assert( player.inventory.length >= 1 );	// 1 due to the natural melee weapon.

			if( player.inventoryWear ) {
				player.lootTake( player.inventoryWear, player.level, null, true, item => {
					if( player.mayDon(item) ) {
						player.don(item,item.slot);
					}
				});
			}



			player.userControllingMe.tickWorld(false);
		}
		else {
			console.assert(false);
		}
*/

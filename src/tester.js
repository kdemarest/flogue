Module.add('tester',function() {


class TestHelper {
	constructor(area) {
		this.area = area;
	}
	get player() {
		return this.area.entityList.find( e=>e.userControllingMe );
	}
	get commandsComplete() {
		return this.player.testerCommands.length <= 0;
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
	get(typeId) {
		let e = this.entity( e=>e.typeId==typeId ).first;
		e = e || this.item( e=>e.typeId==typeId ).first;
		e = e || this.inventory( e=>e.typeId==typeId ).first;
		return e;
	}
}

class TestResult {
	constructor(testId,helper) {
		this.testId = testId;
		this.list = [];
		this.helper = helper;
		this.resolved = false;
		this.simTimeStart = Time.simTime;
	}
	get time() {
		return Time.simTime - this.simTimeStart;
	}
	expect( expression, message ) {
		let helper = this.helper;
		let value;
		try {
			value = eval(expression);
			this.list.push({
				success: !!value,
				time: this.time,
				message: message
			});
		} catch(e) {
			debugger;
			this.list.push({
				success: false,
				time: this.time,
				exception: e.message+'\n'+e.stack,
				message: message
			});
			this.resolved = true;
		}
		let success = this.list[this.list.length-1].success;
		if( Tester.haltOnError && !success ) {
			debugger;
			eval(expression);	// just to help with debugging.
		}
		return success;
	}
	expectAt( time, expression, message ) {
		if( this.time !== time ) {
			return;
		}
		return this.expect( expression, message );
	}
}

class Test {
	constructor(id,logFn) {
		this.id = id;
		this.logFn = logFn;
		this.valueRestore = [];
		this.result = null;
		this.area = null;
		this.simTimeStart = 0;
	}
	getCommand(entity) {
		if( Tester.interactiveDebugging && entity.command && entity.command !== Command.NONE && entity.command !== Command.WAIT ) {
			// Leave the command alone - let the user do whatever
			return;
		}
		if( entity.testerCommands && entity.testerCommands.length ) {
			entity.command = entity.testerCommands.shift();
		}
	}
	finish() {
		this.logFn(this.result);
		this.valueRestore.forEach( restoreFn => restoreFn() );
	}
	alter(target,overlay0,overlay1) {
		let oldValue = JSON.stringify(target);
		Object.assign( target, overlay0, overlay1 );
		this.valueRestore.push( () => {
			Object.strip(target);
			Object.assign(target,JSON.parse(oldValue));
		});
	}
	act() {
		if( this.result.resolved || !this.onAct ) {
			return;
		}
		this.onAct( this.result.helper );
	}
	check() {
		if( !this.result.resolved ) {
			this.onCheck( this.result, this.result.helper );
		}
		if( this.result.resolved ) {
			this.finish();
			return true;
		}
	}

	start(testId,user) {
		let test = TestList[testId];
		console.assert( test.themeId );
		this.alter( ThemeList[test.themeId],   test.theme, { injectList: test.injectList } );
		this.alter( MonsterTypeList['player'], test.player );
		this.onCheck = test.check.bind(test);
		this.onAct   = test.act ? test.act.bind(test) : null;

		try {
			user.startGame( test.depth, test.themeId, 'player', test.player.atMarker, () => {
				this.area = user.entity.area;
				this.result = new TestResult(testId,new TestHelper(this.area));
				user.entity.testControl = (entity) => {
					return this.getCommand(entity);
				};
				user.tickWorld(false);
				this.started = true;
			});
		} catch(e) {
			debugger;
			this.result = {
				testId: testId,
				resolved: true,
				list: [{
					success: false,
					time: 0,
					message: 'Startup: '+e.message,
					exception: ''+e.stack
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
		this.entryList = [];
		this.entryFilter = () => true;
		this.haltOnError = true;
		this.interactive = true;
	}
	act(timePasses) {
		if( !this.test ) {
			return;
		}
		return this.test.act(...arguments);
	}
	check() {
		if( !this.test ) {
			return;
		}
		return this.test.check(...arguments);
	}
	updateStatus() {
		$('#testFail').html(this.failCount);
		$('#testOK').html(this.okCount);
		$('#testInFlight').html(this.test?this.test.id:'');
	}
	show() {
		let s = '';
		this.entryList.forEach( entry => {
			if( !this.entryFilter(entry) ) {
				return;
			}
			if( entry.success ) {
				this.okCount++;
			}
			else {
				this.failCount++;
			}
			s += entry.success ? 'OK  ' : '<b>FAIL<b>';
			s += ' '+entry.testId+' @'+entry.time+' '+entry.message;
			if( entry.exception ) {
				s += '<br><pre>'+entry.exception+'</pre>';
			}
			s += '<br>';
		});
		$(this.outputDivId).html( s ).show();
	}
	setFilter(fn) {
		this.entryFilter = fn;
		this.show();
	}
	log(result) {
		console.assert(result.resolved);
		result.list.forEach( entry => {
			console.assert(entry.success !== undefined && typeof entry.success === 'boolean');
			entry.testId = result.testId;
			this.entryList.push(entry);
		});
		this.show();
		this.updateStatus();
		this.test = null;
	}

	run(roster,area,outputDivId) {
		console.assert( !this.test && this.roster.length == 0 );
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

		let myInterval = () => {
			if( this.haltOnError && this.failCount > 0 ) {
				return;
			}
			if( !this.interactive && this.test && this.test.started ) {
				user.tickWorld(true);
			}
			if( !this.test ) {
				let testId = this.roster.shift();
				if( !testId ) {
					clearInterval(intervalHandle);
					return;
				}
				this.test = new Test(testId,this.log.bind(this)).start(testId,user);
			}
		}
		let intervalHandle = setInterval( myInterval, 1 );
	}
}
let Tester = new TestManager();

class ViewTester {
	constructor(divId,getPlayerFn) {
		let run = function(testId) {
			if( Tester.test || Tester.roster.length ) {
				return;
			}
			Tester.haltOnError = $('#testHaltOnError').is(":checked");
			Tester.interactive = $('#testInteractive').is(":checked");
			Tester.run( testId, getPlayerFn().area, outputDivId );
		}.bind(this);

		let outputDivId = '#testResults';
		$(divId).empty();

		let input = $('<input id="testId" type="text" value="makeAllItems">')
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
		$('<button>GO</button>')
			.appendTo(divId)
			.click( function() {
				run( $(input).val() );
			});
		$('<button>ALL</button><br>')
			.appendTo(divId)
			.click( function() {
				run( null );
			});
		$('<input id="testHaltOnError" type="checkbox" '+(Tester.haltOnError?'checked':'')+'> Halt on error?</input><br>')
			.appendTo(divId);
		$('<input id="testInteractive" type="checkbox" '+(Tester.interactive?'checked':'')+'> Interactive debug?</input><br>')
			.appendTo(divId);
		let testStatus = $('<pre id="testStatus"></pre>')
			.appendTo(divId);
		$('<a><span id="testFail">0</span> fail</a>')
			.appendTo(testStatus)
			.click( ()=>Tester.setFilter( entry => entry.success===false ) );
		$('<span>, </span>')
			.appendTo(testStatus);
		$('<a><span id="testOK">0</span> OK </a>')
			.appendTo(testStatus)
			.click( ()=>Tester.setFilter( entry => entry.success===true ) );
		$('<span> (</span>')
			.appendTo(testStatus);
		$('<span id="testInFlight"></span>')
			.appendTo(testStatus);
		$('<span>)</span>')
			.appendTo(testStatus);
		$('<pre id="'+outputDivId.replace('#','')+'"></pre>')
			.appendTo(divId)
			.click( function() { $(this).hide(); } );
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

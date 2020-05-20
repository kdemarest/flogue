Module.add('tester',function() {


class TestHelper {
	constructor(user,test) {
		this.user = user;
		this.test = test;
	}
	get area() {
		return this.user.entity.area;
	}
	set area(value) {
		console.assert(false);
	}
	get player() {
		return this.user.entity;
	}
	set player(value) {
		console.assert(false);
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
	makeFreshPlayer(atMarker,inject=null) {
		let area = this.area;
		let player = new Entity( area.depth, MonsterTypeList.player, inject, area.jobPicker );
		player.light = 8;
		let pos = area.map.pickPosToStartGame(atMarker || this.test.player.atMarker);
		player.requestGateTo(area,...pos);
		player.playerUnderTestControl = true;
		this.user.takeControlOf( player );
		guiMessage( 'setObserver', player );
		return player;
	}
	makeEnemy(typeId,atMarker) {
		let enemy = new Entity( this.area.depth, MonsterTypeList[typeId], null, this.area.jobPicker );
		let pos = this.area.map.pickPosToStartGame(atMarker);
		enemy.requestGateTo(this.area,...pos);
		return enemy;
	}
}

class TestResult {
	constructor(testId,helper) {
		this.testId = testId;
		this.list = [];
		this.helper = helper;
		this.resolved = false;
		this.simTimeStart = Time.sim.time;
	}
	get time() {
		return Time.sim.time - this.simTimeStart;
	}
	expect( expectFn, message, details ) {
		let helper = this.helper;
		let value;
		try {
			value = expectFn(helper);
			this.list.push({
				success: !!value,
				time: this.time,
				message: message,
				details: details
			});
		} catch(e) {
			debugger;
			this.list.push({
				success: false,
				time: this.time,
				exception: e.message+'\n'+e.stack,
				message: message,
				details: details
			});
			this.resolved = true;
		}
		let last = this.list[this.list.length-1];
		console.log(last);
		let success = last.success;
		if( Tester.haltOnError && !success ) {
			// Examine 'last' for details.
			debugger;
			// Step into this to see the assessment fail.
			expectFn(helper);
		}
		return success;
	}
	expectAt( time, expectFn, message ) {
		if( this.time !== time ) {
			return;
		}
		return this.expect( expectFn, message );
	}
}

class Test {
	constructor(id,logFn) {
		this.id = id;
		this.logFn = logFn;
		this.valueRestore = [];
		this.result = null;
		this.area = null;
		this.simTimeLimit = false;
	}
	alter(target,overlay0,overlay1) {
		let oldValue = JSON.stringify(target);
		Object.assign( target, overlay0, overlay1 );
		this.valueRestore.push( () => {
			Object.strip(target);
			Object.assign(target,JSON.parse(oldValue));
		});
	}
	finish() {
		this.logFn(this.result);
		this.valueRestore.forEach( restoreFn => restoreFn() );
	}
	think(entity) {
		if( this.result.resolved || !this.onThink ) {
			return;
		}
		if( Tester.interactive && entity.command && entity.command !== Command.NONE && entity.command !== Command.WAIT ) {
			// Leave the command alone - let the user do whatever
			return;
		}
		return this.onThink( entity, this.result.helper );
	}
	tick() {
		if( !this.result ) {
			return;
		}
		if( this.result.resolved || !this.onTick ) {
			return;
		}
		this.onTick( this.result.helper );
	}
	check() {
		if( this.simTimeLimit !== false && Time.sim.time >= this.simTimeLimit ) {
			debugger;
			this.result.expect( helper=>false, "Test exceeded time limit." );
			this.result.resolved = true;
			this.finish();
			return true;
		}
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
		if( test.themeId !== false ) {
			this.alter( ThemeList[test.themeId], test.theme, { injectList: test.injectList } );
		}
		this.alter( MonsterTypeList['player'], test.player );
		this.onCheck = test.check.bind(test);
		this.onTick   = test.tick ? test.tick.bind(test) : null;
		this.onThink = test.think ? test.think.bind(test) : null;
		this.simTimeLimit = test.timeLimit === false ? false : (Time.sim.time + (test.timeLimit || 100));

		try {
			let config = {
				depth:			test.depth,
				themeId:		test.themeId,
				playerTypeId:	'player',
				playerMarkerId:	test.player.atMarker
			};
			user.startGame( config );
			this.area = user.entity.area;
			this.result = new TestResult(testId,new TestHelper(user,test));
//			user.tickWorld(false);
			this.started = true;

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
	think(entity) {
		console.assert( arguments.length == 1 );
		if( !this.test ) {
			return;
		}
		return this.test.think(entity);
	}
	tick() {
		console.assert( arguments.length == 0 );
		if( !this.test ) {
			return;
		}
		return this.test.tick();
	}
	check() {
		console.assert( arguments.length == 0 );
		if( !this.test ) {
			return;
		}
		return this.test.check();
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

		let testStarterIntervalFn = () => {
			// If a halt is required, don't go starting more tests.
			if( this.haltOnError && this.failCount > 0 ) {
				return;
			}
			if( !this.interactive && this.test && this.test.started ) {
				//user.tickWorld(true);
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
		let intervalHandle = setInterval( testStarterIntervalFn, 1 );
	}
}
let Tester = new TestManager();

class ViewTester {
	constructor(divId,getPlayerFn) {
		this.outputDivId = '#testResults';
		$(divId).empty();
		this.getPlayerFn = getPlayerFn;

		let inputConfig = $('<input id="configId" type="text" value="" style="width:60px;">')
			.appendTo(divId)
			.val(Config.getConfigId())
			.change( function() {
				Config.setConfigId( $(this).val() );
			});

		this.inputTest = $('<input id="testId" type="text" value="makeAllMonsters" style="width:100px;">') //playFullGame">')
			.appendTo(divId)
			.keydown( function(e) {
				e.stopPropagation();
			})
			.change( () => {
				this.run( this.testName );
			})
			.keyup( (e) => {
				if(e.keyCode == 13) {
					this.run(this.testName );
				}
			})
		;
		$('<button>GO</button>')
			.appendTo(divId)
			.click( () => {
				this.run( this.testName );
			});
		$('<button>ALL</button><br>')
			.appendTo(divId)
			.click( () => {
				this.run( null );
			});
		$('<input id="testHaltOnError" type="checkbox" '+(Tester.haltOnError?'checked':'')+'> Halt on error?</input><br>')
			.appendTo(divId)
			.change( function() {
				Tester.haltOnError = $(this).is(":checked");
			});
		$('<input id="testInteractive" type="checkbox" '+(Tester.interactive?'checked':'')+'> Interactive debug?</input><br>')
			.appendTo(divId)
			.change( function() {
				Tester.interactive = $(this).is(":checked");
			});
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
		$('<pre id="'+this.outputDivId.replace('#','')+'"></pre>')
			.appendTo(divId)
			.click( function() { $(this).hide(); } );
	}
	get testName() {
		return $(this.inputTest).val();
	}
	run(testId) {
		if( Tester.test || Tester.roster.length ) {
			return;
		}
		Tester.run( testId, this.getPlayerFn().area, this.outputDivId );
	}
	message(msg,payload) {
		if( msg=='runTest' ) {
			this.run( payload || this.testName );
		}
	}
	render() {
	}
}

return {
	Tester: Tester,
	ViewTester: ViewTester
}

});



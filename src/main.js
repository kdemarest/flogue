
async function main() {

	function userCreate(user) {

		user.tickGui = function(dt) {
			this.autoFavorite();
			this.gui.tick(dt);
			this.gui.render();
		}.bind(user);

		user.onEvent = function(event) {
			this.commandHandler.evalCommand(this.entity,event);
		}.bind(user);

		return user;
	}

	function startGame( config, user ) {
		let startingDepth  = config.startingDepth || 0;
		let playerTypeId   = config.playerTypeId || 'player';
		let playerMarkerId = config.playerMarkerId || 'playerStartHere';

		let gui = Gui.createManager( ()=>user.entity );
		gui.create( function() {
			this.add('full',new ViewFull('#guiControls','#guiMain'));
			this.add('zoom',new ViewZoom('#guiControls'));
			this.add('narrative',new ViewNarrative('#guiNarrative'));
			this.add('sign',new ViewSign('#guiSign'));
			this.add('favorites',new ViewFavorites('#guiFavorites'));
			this.add('spells',new ViewSpells('#guiSpells'));
			this.add('range',new ViewRange());
			this.add('experience',new ViewExperience('#guiExperience'));
			this.add('info',new ViewInfo('#guiInfo'));
			this.add('status',new ViewStatus('#guiStatus'));
			this.add('inventory',new ViewInventory('#guiInventory'));
			this.add('map',new ViewMap('#guiMap'));
			this.add('miniMap',new ViewMiniMap('#guiMiniMap','#guiMiniMapCaption'));
			this.add('tester',new ViewTester('#guiTester',this.getPlayer));
		});
		gui.subscribe( 'user', 'command', user.onEvent.bind(user) );
		user.gui = gui;
		guiMessage('saveBattery',config.saveBattery);

		user.commandHandler = new UserCommandHandler(user,gui.view.inventory,gui.view.range);

		let planList  = new PlanList(PlanData)
		let world     = new World(planList);
		let themeId   = config.themeId || world.plan.findFirst(plan=>plan.depth==startingDepth).themeId;
		let planFind  = plan => plan.depth == startingDepth && plan.themeId == themeId;
		let plan      = world.plan.findFirst(planFind) || world.plan.add({areaId: 'user-'+Date.makeUid(), depth:startingDepth, themeId: themeId, isSpontaneous: true});
		let area      = world.createArea(plan.areaId);
		area.underConstruction = true;
		let player    = new Entity( area.depth, MonsterTypeList[playerTypeId], config.playerInject, area.jobPicker );
		player.visibilityDistance = MapVisDefault;
		player.logId  = 'player';
		//player.watch  = true;

		user.takeControlOf(player);
		Gab.observer = user.entity;
		let startPos = area.map.pickPosToStartGame(playerMarkerId);
		user.entity.requestGateTo(area,...startPos);
		area.underConstruction = false;
		Narrative.addRecipient(
			() => user.entity,
			(observer,entity) => !observer ? true : observer.canPerceiveEntity(entity),
			(message,history) => guiMessage('receive',history,'narrative')
		);
		world.userList.push(user);
		user.world = world;

		// AWAIT IMAGE LOAD

		guiMessage( 'create2DEngine' );
		guiMessage( 'setObserver', user.entity );
		let scene = new Scene();
		guiMessage( 'scene', scene );
		$('#guiLoading').hide();
		$( window ).resize( () => { guiMessage('resize'); });
		$('#guiMain').show();
		tell([user.entity,null,"Welcome to Flogue! Use the arrow keys to move, and '.' to wait."]);
		guiMessage('resize');
		Gui.keyHandler.add( 'main', user.onEvent.bind(user) );
		guiMessage( 'start2DEngine' );
	}

	window.Debug = DebugSetup({
		ai: false,
		anim: false,
		sprite: false,
		command: true,
		cmd: false,
		range: false,
		info: false,
		deed: false,
		item: false,
		vis: false,
		areaBuild: false,
		imgLoader: true,
		mason: true,
	});

	let pseudoRandomSeed = 1236;
	let flogueConfigEnvVariableId = 'flogueConfigId';
	let game = new Game( pseudoRandomSeed, flogueConfigEnvVariableId );
	await game.initPlugins( [ 'pkgPlantsBasic' ] );
	await game.initTypes( checkerFn = ()=>Checker );
	await game.initImages();

	Time.sim = new Time.TimeKeeper();
	let user = userCreate( new HumanUser() );

	startGame( game.config, user );
}

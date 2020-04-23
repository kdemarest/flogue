
async function main() {

	Profile.end('scripts').tell();


	window.Debug = DebugSetup({
		ai: false,
		anim: false,
		sprite: false,
		command: false,
		cmd: false,
		range: false,
		info: false,
		deed: false,
		item: false,
		vis: false,
		areaBuild: false,
		imgLoader: true
	});

	// This executes the initializers for all the static .js files
	Module.realize();
	let User = new HumanUser();

	User.tickGui = function(dt) {
		this.autoFavorite();
		this.gui.tick(dt);
		this.gui.render(dt);
	}.bind(User);

	User.onEvent = function(event) {
		this.commandHandler.evalCommand(this.entity,event);
	}.bind(User);

	User.startGame = function(config) {
		let startingDepth  = config.startingDepth || 0;
		let playerTypeId   = config.playerTypeId || 'player';
		let playerMarkerId = config.playerMarkerId || 'playerStartHere';

		let gui = Gui.createManager( ()=>this.entity );
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
		gui.subscribe( 'user', 'command', this.onEvent.bind(this) );
		this.gui = gui;
		guiMessage('saveBattery',config.saveBattery);

		this.commandHandler = new UserCommandHandler(this,gui.view.inventory,gui.view.range);

		let planList  = new PlanList(PlanData)
		let world     = new World(planList);
		let themeId   = config.themeId || world.plan.findFirst(plan=>plan.depth==startingDepth).themeId;
		let planFind  = plan => plan.depth == startingDepth && plan.themeId == themeId;
		let plan      = world.plan.findFirst(planFind) || world.plan.add({areaId: 'user', depth:startingDepth, themeId: themeId});
		let area      = world.createArea(plan.areaId);
		area.underConstruction = true;
		let player    = new Entity( area.depth, MonsterTypeList[playerTypeId], config.playerInject, area.jobPicker );
		player.visibilityDistance = MapVisDefault;
		player.logId  = 'player';
		//player.watch  = true;

		this.takeControlOf(player);
		Gab.observer = this.entity;
		let startPos = area.map.pickPosToStartGame(playerMarkerId);
		this.entity.requestGateTo(area,...startPos);
		area.underConstruction = false;
		Narrative.addRecipient(
			() => this.entity,
			(observer,entity) => !observer ? true : observer.canPerceiveEntity(entity),
			(message,history) => guiMessage('receive',history,'narrative')
		);
		world.userList.push(this);
		this.world = world;

		// AWAIT IMAGE LOAD

		guiMessage( 'create2DEngine' );
		guiMessage( 'observer', this.entity );
		let scene = new Scene();
		guiMessage( 'scene', scene );
		$('#guiLoading').hide();
		$( window ).resize( () => { guiMessage('resize'); });
		$('#guiMain').show();
		tell([this.entity,null,"Welcome to Flogue! Use the arrow keys to move, and '.' to wait."]);
		guiMessage('resize');
		Gui.keyHandler.add( 'main', this.onEvent.bind(this) );
		guiMessage( 'start2DEngine' );

	}.bind(User);

	let configId = Config.getConfigId();
	let config = new Config(configId);
	window.config = config;

	configId ? PluginManager.addForLoad(config.id,'config.'+config.id+'.js') : null;
	PluginManager.addForLoad('pkgPlantsBasic', 'pkgPlantsBasic.js');
	await PluginManager.loadAll();
	
	// This executes the initializers for all the plugins, putting the data in the PluginManager
	Module.realize();

	// We condition the heck out of our data, and we have to do it in the right order.
	Type.establish('PLUGINS',{});
	Type.register('PLUGINS', PluginManager.list );
	Type.merge();
	Type.finalize();

	window.ImageRepo =  new PixiImageRepo(PIXI.loader);
	ImageRepo.scanTypes();
	setInterval( () => ImageRepo.tick(), 250 );

	// We should convert all this to promises.
	User.startGame( config );
}

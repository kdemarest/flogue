Module.add('game',function(extern){

class Game {
	constructor( seed, configId ) {
		// This executes the initializers for all the static .js files
		Random.Pseudo.seed(seed);

		this.config = new Config(configId);
		this.config.id ? Plugin.Manager.addForLoad('config.'+this.config.id) : null;
	}

	async initPlugins( pluginList ) {
		pluginList.forEach( pluginId => {
			Plugin.Manager.addForLoad(pluginId, pluginId+'.js');
		});
		await Plugin.Manager.loadAll();
	}

	async initTypes( checkerFn ) {
		
		// This executes the initializers for all not-yet-run code, that is, the plugins,
		// putting the data in the Plugin.Manager
		Module.realize();

		// We condition the heck out of our data, and we have to do it in the right order.
		Type.establish('PLUGINS',{});
		Type.register('PLUGINS', Plugin.Manager.list );
		Type.merge();
		Type.finalize( checkerFn() );
	}

	async initImages( interval=250 ) {
		window.ImageRepo = new ImageMaker();
		ImageRepo.scanTypes();
		setInterval( () => ImageRepo.tick(), interval );
	}
}

return {
	Game: Game
}

});
class Gui {
	constructor(getPlayer,getArea) {
		this.getPlayer = getPlayer;
		this.getArea = getArea;
		this.imageRepo = new ImageRepo(PIXI.loader);
		this.imageRepo.load();
	}

	get spectator() {
		let p = this.getPlayer();
		if( p.isDead() ) {
			p.isSpectator = true;
			p.senseXray = true;
			p.light = 12;
		}
		return p;
	}

	create() {
		function worldOverlayAdd(group,x,y,sticker) {
			new Anim( sticker, {
				group: 		group,
				x: 			x,
				y: 			y
			});
		}
		function worldOverlayRemove(fn) {
			return animationRemove(fn);
		}

		this.viewDynamic = DynamicViewList.none;
		this.viewMap = new ViewMap('guiMap',MaxSightDistance,this.imageRepo);
		this.viewMiniMap = new ViewMiniMap('guiMiniMap','guiMiniMapCaption',this.imageRepo);
		this.viewSpells = new ViewSpells('guiSpells');
		this.viewInfo = new ViewInfo('guiInfo')
		this.viewStatus = new ViewStatus('guiStatus');
		this.viewRange = new ViewRange(worldOverlayAdd,worldOverlayRemove);
		this.viewInventory = new ViewInventory('guiInventory',this.imageRepo);

		let keyMap = loadKeyMapping("default");
		this.userCommandHandler = new UserCommandHandler(keyMap,this.viewInventory,this.viewRange);
	}

	makeDynamicGui() {
		let player = this.getPlayer();
		if( !player.guiViewCreator ) {
			return false;
		}
		let onClose = () => {
			this.viewDynamic = ViewList.none;
		}
		let v = {divId: 'guiDynamic', player: player, imageRepo: this.imageRepo, onClose: onClose};
		if( !DynamicViewList[v.view] ) {
			console.log( "Error: No such dynamic view "+v.view+" in "+v );
			delete player.guiViewCreator;
			return false;
		}

		Object.assign(v,player.guiViewCreator);
		this.viewDynamic = DynamicViewList[v.view](v);
		delete player.guiViewCreator;
		return true;
	}

	render() {
		let area = this.getArea();
		let observer = this.spectator;

		area.map.cacheVis();

		this.viewStatus.render(observer,area.entityList);
		this.viewSpells.render(observer);
		this.viewInfo.render(observer);
		this.viewInventory.render(observer);
		this.viewRange.render(observer);
		let drawList = createDrawList(observer,area.map,area.entityList);
		this.viewMap.draw(drawList,observer);
		this.viewMiniMap.render(observer);	// must be after viewMap so the visibility
		this.viewDynamic.render(observer);
	}

	tick() {
		this.makeDynamicGui();
		this.viewDynamic.tick();
	}
}

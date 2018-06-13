class Gui {
	constructor(getPlayer) {
		this.getPlayer = getPlayer;
		this.imageRepo = new ImageRepo(PIXI.loader);
		this.imageRepo.load();
		this.view = {};
		let self = this;
		window.guiMessage = function(target,message,payload) {
			self.message(target,message,payload);
		}
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

	create(onItemChoose) {
		function worldOverlayAdd(group,x,y,sticker) {
			new Anim( sticker, {
				group: 		group,
				x: 			x,
				y: 			y,
				duration: 	true
			});
		}
		function worldOverlayRemove(fn) {
			return animationRemove(fn);
		}

		this.view.dynamic = DynamicViewList.none;
		this.view.full = new ViewFull('#guiControls','#guiMain');
		this.view.zoom = new ViewZoom('#guiControls');
		this.view.narrative = new ViewNarrative('guiNarrative');
		this.view.map = new ViewMap('guiMap',this.imageRepo);
		this.view.sign = new ViewSign('guiSign');
		this.view.miniMap = new ViewMiniMap('guiMiniMap','guiMiniMapCaption',this.imageRepo);
		this.view.spells = new ViewSpells('guiSpells');
		this.view.experience = new ViewExperience('guiExperience')
		this.view.info = new ViewInfo('guiInfo')
		this.view.status = new ViewStatus('guiStatus');
		this.view.range = new ViewRange(worldOverlayAdd,worldOverlayRemove);
		this.view.inventory = new ViewInventory('guiInventory',this.imageRepo,onItemChoose);
	}

	makeDynamicGui() {
		let player = this.getPlayer();
		if( !player.guiViewCreator ) {
			return false;
		}
		let onClose = () => {
			this.view.dynamic = ViewList.none;
		}
		let v = {divId: 'guiDynamic', player: player, imageRepo: this.imageRepo, onClose: onClose};
		if( !DynamicViewList[v.view] ) {
			console.log( "Error: No such dynamic view "+v.view+" in "+v );
			delete player.guiViewCreator;
			return false;
		}

		Object.assign(v,player.guiViewCreator);
		this.view.dynamic = DynamicViewList[v.view](v);
		delete player.guiViewCreator;
		return true;
	}
	message(target,message,payload) {
		if( target && !this.view[target] ) {
			console.log( "Error: Message target "+target+" does not exist." );
			return;
		}
		Object.each( this.view, (view,viewId) => {
			if( view.message && (!target || target==viewId) ) {
				view.message(message,payload);
			}
		});
	}


	render() {
		let area = this.getPlayer().area;
		let observer = this.spectator;

		area.vis.cacheVis();

		this.view.narrative.render();
		this.view.status.render(observer,area.entityList);
		this.view.sign.render(observer);
		this.view.spells.render(observer);
		this.view.experience.render(observer);
		this.view.info.render(observer);
		this.view.inventory.render(observer);
		this.view.range.render(observer);
		this.view.map.render(observer);
		this.view.miniMap.render(observer);	// must be after viewMap so the visibility
		this.view.dynamic.render(observer);
	}

	tick() {
		this.makeDynamicGui();
		this.view.dynamic.tick();
	}
}

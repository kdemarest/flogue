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
		function worldOverlayAdd(group,x,y,img) {
//			console.log(group,x,y,img);
			new Anim( {}, {
				group: 		group,
				x: 			x,
				y: 			y,
				img: 		img,
				duration: 	true
			});
		}
		function worldOverlayRemove(fn) {
			return animationRemove(fn);
		}

		this.view.dynamic = DynamicViewList.none;
		this.view.full = new ViewFull('#guiControls','#guiMain',);
		this.view.zoom = new ViewZoom('#guiControls');
		this.view.narrative = new ViewNarrative('guiNarrative');
		this.view.sign = new ViewSign('guiSign');
		this.view.spells = new ViewSpells('guiSpells');
		this.view.range = new ViewRange();
		this.view.experience = new ViewExperience('guiExperience')
		this.view.info = new ViewInfo('guiInfo')
		this.view.status = new ViewStatus('guiStatus');
		this.view.inventory = new ViewInventory('guiInventory',this.imageRepo,onItemChoose);
		this.view.map = new ViewMap('guiMap',this.imageRepo,worldOverlayAdd,worldOverlayRemove);
		this.view.miniMap = new ViewMiniMap('guiMiniMap','guiMiniMapCaption',this.imageRepo);
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
		console.log(message);
		Object.each( this.view, (view,viewId) => {
			if( view.message && (!target || target==viewId) ) {
				view.message(message,payload);
			}
		});
	}


	render() {
		let area = this.getPlayer().area;
		guiMessage( null, 'observer', this.spectator );

		area.vis.cacheVis();

		this.view.narrative.render();
		this.view.sign.render();
		this.view.spells.render();
		this.view.range.render();
		this.view.experience.render();
		this.view.info.render();
		this.view.status.render(area.entityList);
		this.view.inventory.render();
		this.view.map.render();
		this.view.miniMap.render();	// must be after viewMap so the visibility
		this.view.dynamic.render();
	}

	tick() {
		this.makeDynamicGui();
		this.view.dynamic.tick();
	}
}

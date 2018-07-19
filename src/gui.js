Module.add('gui',function() {

class Gui {
	constructor(getPlayer,imageRepo) {
		this.getPlayer = getPlayer;
		this.view = {};
		this.imageRepo = imageRepo;
		let self = this;
		window.guiMessage = function(message,payload,target) {
			self.message(message,payload,target);
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
		this.onItemChoose = onItemChoose;
		this.view.dynamic = DynamicViewList.none;
		this.view.full = new ViewFull('#guiControls','#guiMain',);
		this.view.zoom = new ViewZoom('#guiControls');
		this.view.narrative = new ViewNarrative('#guiNarrative');
		this.view.sign = new ViewSign('#guiSign');
		this.view.favorites = new ViewFavorites('#guiFavorites',onItemChoose);
		this.view.spells = new ViewSpells('#guiSpells');
		this.view.range = new ViewRange();
		this.view.experience = new ViewExperience('#guiExperience')
		this.view.info = new ViewInfo('#guiInfo')
		this.view.status = new ViewStatus('#guiStatus');
		this.view.inventory = new ViewInventory('#guiInventory',onItemChoose);
		this.view.map = new ViewMap('#guiMap',this.imageRepo);
		this.view.miniMap = new ViewMiniMap('#guiMiniMap','#guiMiniMapCaption',this.imageRepo);
		this.view.tester = new ViewTester('#guiTester',this.getPlayer);
	}

	makeDynamicGui() {
		let player = this.getPlayer();
		if( !player.guiViewCreator ) {
			return false;
		}
		let onClose = () => {
			this.view.dynamic = DynamicViewList.none;
		}
		let v = {
			divId: 'guiDynamic',
			player: player,
			onItemChoose: this.onItemChoose,
			onClose: onClose,
		};
		Object.assign(v,player.guiViewCreator);

		if( v.entity.isMerchant ) {
			this.view.dynamic = new ViewMerchant(v);
		}
		else {
			debugger;
		}
		delete player.guiViewCreator;
		return true;
	}
	message(message,payload,target) {
		//console.log( "guiMessage: "+message );
		if( target && !this.view[target] ) {
			console.log( "Error: Message target "+target+" does not exist." );
			return;
		}
		//console.log(message);
		Object.each( this.view, (view,viewId) => {
			if( view.message && (!target || target==viewId) ) {
				view.message(message,payload);
			}
		});
	}


	render() {
		let area = this.getPlayer().area;
		Gab.setObserver( this.spectator );
		guiMessage( 'observer', this.spectator );

		area.vis.populateLookup();	// This could be maintained progressively, but it hasn't mattered yet.

		this.view.narrative.render();
		this.view.sign.render();
		this.view.favorites.render();
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

return {
	Gui: Gui
}

});

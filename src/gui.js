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

	add(viewId,view) {
		this.view[viewId] = view;
	}


	create(onItemChoose) {
		this.onItemChoose = onItemChoose;
		this.add('full',new ViewFull('#guiControls','#guiMain'));
		this.add('zoom',new ViewZoom('#guiControls'));
		this.add('narrative',new ViewNarrative('#guiNarrative'));
		this.add('sign',new ViewSign('#guiSign'));
		this.add('favorites',new ViewFavorites('#guiFavorites',onItemChoose));
		this.add('spells',new ViewSpells('#guiSpells'));
		this.add('range',new ViewRange());
		this.add('experience',new ViewExperience('#guiExperience'));
		this.add('info',new ViewInfo('#guiInfo'));
		this.add('status',new ViewStatus('#guiStatus'));
		this.add('inventory',new ViewInventory('#guiInventory',onItemChoose));
		this.add('map',new ViewMap('#guiMap',this.imageRepo));
		this.add('miniMap',new ViewMiniMap('#guiMiniMap','#guiMiniMapCaption',this.imageRepo));
		this.add('tester',new ViewTester('#guiTester',this.getPlayer));
	}
	message(message,payload,target) {
		//console.log( "guiMessage: "+message );
		if( target && !this.view[target] ) {
			console.log( "Error: Message target "+target+" does not exist." );
			return;
		}
		//console.log(message);
		if( message == 'open' ) {
			let viewId = payload.view;
			this.add(viewId,new window[viewId](payload,()=>delete this.view[viewId]));
		}
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

		Object.each( this.view, view => {
			if( view.render ) {
				view.render();
			}
		});
	}
	tick() {
		Object.each( this.view, view => {
			if( view.tick ) {
				view.tick();
			}
		});
	}
}

return {
	Gui: Gui
}

});

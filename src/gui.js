Module.add('gui',function() {

class Gui {
	constructor(getPlayer) {
		this.getPlayer = getPlayer;
		this.view = {};
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
		this.add('map',new ViewMap('#guiMap'));
		this.add('miniMap',new ViewMiniMap('#guiMiniMap','#guiMiniMapCaption'));
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
			payload.onItemChoose = this.onItemChoose;
			payload.onClose = ()=>delete this.view[viewClass];
			let viewClass = payload.viewClass;
			this.add(viewClass,new window[viewClass](payload));
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

Gui.layout = function( layoutList ) {
	Object.each( layoutList, (layout,divId) => {
		Object.each( layout, (fn,key) => {
			let me = $(divId);
			if( me.length ) {
				let value = fn($(divId));
				me[key](value);
				//console.log( 'Set '+divId+'.'+key+' = '+value );
			}
		});
	});
}

Gui.keyHandler = new class {
	constructor() {
		this.handlerList = [];
		$(document).keydown( this.trigger.bind(this) );
	}
	trigger(e) {
		for( let i=0 ; i<this.handlerList.length ; ++i ) {
			let propagate = this.handlerList[i].handlerFn(e);
			if( propagate === false ) {
				break;
			}
		}
		e.stopPropagation();
	}
	add( id, handlerFn ) {
		console.assert(id);
		console.assert(handlerFn);
		this.handlerList.unshift({
			id: id,
			handlerFn: handlerFn
		});
	}
	remove( id ) {
		this.handlerList = this.handlerList.filter( handler => handler.id !== id );
	}
}

return {
	Gui: Gui
}

});

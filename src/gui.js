Module.add('gui',function() {

class GuiManager {
	constructor(getPlayer) {
		this.getPlayer = getPlayer;
		this.view = {};
		this.cached = {};

		window.guiMessage = this.message.bind(this);
//		(message,payload,target) => {
//			this.message(message,payload,target);
//		}
	}

	get spectator() {
		let p = this.getPlayer();
		if( p.isDead() ) {
			p.isSpectator = true;
			p.senseXray = 12;
			p.light = 12;
		}
		return p;
	}

	add(viewId,view) {
		console.assert( !this.view[viewId] );
		this.view[viewId] = view;
		view._onRemove = () => {
			view.onClose ? view.onClose() : null;
			Gui.keyHandler.remove( viewId );
			delete this.view[viewId];
		}
		return view;
	}

	subscribe(subscriberId,messageId,fn) {
		this.add( subscriberId, {
			message: (msg,payload) => msg==messageId ? fn(payload) : null
		});
	}

	openView(payload) {
		let viewClass = payload.viewClass;
		let view = new window[viewClass](payload);
		this.add(viewClass,view);
		view.onOpen ? view.onOpen(payload.entity) : null;
	}

	create(fn) {
		this.subscribe('gui','open',this.openView.bind(this));
		fn.call(this);
	}

	message(message,payload,target) {
		//console.log( "guiMessage: "+message );
		if( target && ( !this.view[target] || !this.view[target].message) ) {
			console.log( "Error: Message target "+target+" does not exist or can not handle messages." );
			return;
		}
		if( target ) {
			this.view[target].message(message,payload);
			return;
		}
		Object.each( this.view, (view,viewId) => {
			if( view.message ) {
				view.message(message,payload);
			}
		});
	}

	render() {
		let area = this.getPlayer().area;
		Gab.setObserver( this.spectator );
		guiMessage( 'setObserver', this.spectator );

		area.vis.populateOpacityLookup();	// This could be maintained progressively, but it hasn't mattered yet.

		Object.each( this.view, view => {
			if( view.render && view.dirty ) {
				view.render();
				view.dirty = false;
			}
		});
	}

	tick(dt) {
		Object.each( this.view, view => {
			if( view.tick ) {
				view.tick(dt);
			}
		});
	}
}

class GuiKeyHandler {
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

let Gui = new class {
	constructor() {
		this.manager = null;
		this.keyHandler = new GuiKeyHandler();
		this.cachedContent = {};
	}

	createManager() {
		this.manager = new GuiManager(...arguments);
		return this.manager;
	}

	dirty(...args) {
		args.forEach( value => {
			console.assert(this.manager.view[value]);
			this.manager.view[value].dirty = true;
		});
	}

	layout( layoutList ) {
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
	remove(view) {
		view._onRemove();
	}
	cachedRenderDiv(divId,content,classList) {
		let wasUpdated = false;
		Object.each( classList, (state,className) => {
			if( $(divId).hasClass(className) != state ) {
				$(divId).toggleClass(className);
				wasUpdated = true;
			}
		});
		if( content !== this.cachedContent[divId] ) {
			$(divId).show().html(content);
			this.cachedContent[divId] = content;
			wasUpdated = true;
		}
		return wasUpdated;
	}

	cachedRenderElements(target,source) {
		let wasUpdated = false;
		let targetContent = $(target).html();
		let sourceContent = '<div>'+$(source).html()+'</div>';
		if( targetContent != sourceContent ) {
			$(target).empty();
			$(source).appendTo(target);
			wasUpdated = true;
		}
		return wasUpdated;
	}


}


return {
	Gui: Gui
}

});

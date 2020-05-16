Module.add('viewFavorites',function() {

class ViewFavorites extends ViewObserver {
	constructor(divId) {
		super();
		this.favoriteKey = ['1234567890','!@#$%^&*()'];
		this.favoriteName = [[' 1',' 2',' 3',' 4',' 5',' 6',' 7',' 8',' 9',' 0'],['s1','s2','s3','s4','s5','s6','s7','s8','s9','s0']];
		this.favoriteSet = 0;
		this.divId = divId;
		this.favoriteCandidate = null;
		this.refreshTimer = new Time.TimerSimple( 0.2, ()=>this.dirty=true );

		let self = this;
		$(document).keydown( event => {
			if( event.key == 'Shift' ) {
				guiMessage( 'favoriteSet', 1 );
				event.stopPropagation();
			}
		});
		$(document).keyup( event => {
			if( event.key == 'Shift' ) {
				guiMessage( 'favoriteSet', 0 );
				event.stopPropagation();
			}
		});
	}
	get user() {
		return this.observer.userControllingMe;
	}
	isFavoriteKey(key) {
		return this.favoriteKey[0].includes(key) || this.favoriteKey[1].includes(key);
	}
	message(msg,payload) {
		super.message(msg,payload);

		// Inventory is asking that you set this item as a favorite.
		if( msg == 'favoriteCandidate' ) {
			this.favoriteCandidate = payload;
			if( payload ) {
				this.user.suppressFavorites = true;
				Gui.keyHandler.add( 'ViewFavoritesKeyCapture', (e) => {
					if( this.isFavoriteKey(e.key) ) {
						this.setFavorite(e)
						e.stopPropagation();
					}
				});
			}
			else {
				Gui.keyHandler.remove( 'ViewFavoritesKeyCapture' );
				this.user.suppressFavorites = false;
			}
		}

		// This lets you see the unshifted and shifted favorite sets. It is NOT setting a favorite.
		if( msg == 'favoriteSet' ) {
			let changed = this.favoriteSet != payload;
			this.favoriteSet = payload;
			if( changed ) {
				this.dirty = true;
			}
		}
		if( msg == 'inventoryChange' && payload == this.observer ) {
			this.dirty = true;
		}
	}
	setFavorite(e) {
		if( this.favoriteCandidate ) {
			console.assert( this.user );
			this.user.setFavorite( e.key, this.favoriteCandidate );
			this.dirty = true;
		}
	}
	tick(dt) {
		this.refreshTimer.tick(dt);
	}
	render() {
		let observer = this.observer;

		let content = '';
		let favoriteKeyList = this.favoriteKey[this.favoriteSet];
		for( let i=0 ; i<favoriteKeyList.length ; ++i ) {
			let favoriteName = this.favoriteName[this.favoriteSet][i];
			let key      = favoriteKeyList.charAt(i);
			let name     = favoriteKeyList.charAt(i);
			let favorite = this.user.favoriteMap[key];

			let item = favorite && favorite.itemId ? new Finder(observer.inventory).isId( favorite.itemId ).first : null;
			let hotkey = '<b>'+favoriteName+'</b>';
			let img = '<span class="itemRecharge"></span>';

			if( !item ) {
				let s = '<div class="item unlit">'+img+hotkey+'</div>';
				content += s;
//				$(s).appendTo(this.divId);
				continue;
			}

			if( item.rechargeTime ) {
				let pct = Math.floor( (1 - ( (item.rechargeLeft||0) / (item.rechargeTime||10) )) * 10 )*10;
				img = '<img class="itemRecharge" src="'+IMG_BASE+StickerList['slice'+pct].img+'">';
			}
			if( item.slot ) {
				img = '<img class="itemRecharge" src="'+IMG_BASE+(item.inSlot?'gui/icons/marked':'gui/icons/unmarked')+'.png">';
			}
			let ex = item.explain(null,observer);
			let text = ex.description;
			let lit = observer.isItemSelected(item) && item.isRecharged();
			let unlit = !item.isRecharged();
			let s = '<div class="itemIndex'+i+' item'+(unlit?' unlit':(lit?' lit':''))+'">'+img+hotkey+' '+[ex.condition,text].join(' ')+'</div>';

			content += s;
		}

		let wasUpdated = Gui.cachedRenderDiv( this.divId, content );

		if( wasUpdated ) {
			for( let i=0 ; i<favoriteKeyList.length ; ++i ) {
				let itemId = '.itemIndex'+i;
				let key      = favoriteKeyList.charAt(i);
				let favorite = this.user.favoriteMap[key];
				let item = favorite && favorite.itemId ? new Finder(observer.inventory).isId( favorite.itemId ).first : null;

				$(itemId).off( '.viewFavorites' );
				$(itemId)
					.on( 'click.viewFavorites', null, event => {
						event.key = favorite.key;
						event.commandItem = item;
						guiMessage('command',event);
					})
					.on( 'mouseover.viewFavorites', null, event => {
						//console.log( 'ViewInventory mouseover' );
						guiMessage( 'showInfo', { entity: item, from: 'viewFavorites' } );
					})
					.on( 'mouseout.viewFavorites', null, event => {
						guiMessage( 'hideInfo', { from: 'viewFavorites' } );
					})
				;
			}
		}
	}
}

return {
	ViewFavorites: ViewFavorites
}

});
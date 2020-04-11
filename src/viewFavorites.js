Module.add('viewFavorites',function() {

class ViewFavorites extends ViewObserver {
	constructor(divId,onItemChoose) {
		super();
		this.favoriteKey = ['1234567890','!@#$%^&*()'];
		this.favoriteName = [[' 1',' 2',' 3',' 4',' 5',' 6',' 7',' 8',' 9',' 0'],['s1','s2','s3','s4','s5','s6','s7','s8','s9','s0']];
		this.favoriteSet = 0;
		this.divId = divId;
		this.onItemChoose = onItemChoose;
		this.favoriteCandidate = null;

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
		if( msg == 'favoriteSet' ) {
			let changed = this.favoriteSet != payload;
			this.favoriteSet = payload;
			if( changed ) {
				this.render();
			}
		}
	}
	setFavorite(e) {
		if( this.favoriteCandidate ) {
			console.assert( this.user );
			this.user.setFavorite( e.key, this.favoriteCandidate );
			this.render();
		}
	}
	render() {
		let observer = this.observer;
		$(this.divId).empty();

		let favoriteKeyList = this.favoriteKey[this.favoriteSet];
		for( let i=0 ; i<favoriteKeyList.length ; ++i ) {
			let favoriteName = this.favoriteName[this.favoriteSet][i];
			let key  = favoriteKeyList.charAt(i);
			let name = favoriteKeyList.charAt(i);
			let favorite = this.user.favoriteMap[key];

			let item = favorite && favorite.itemId ? new Finder(observer.inventory).isId( favorite.itemId ).first : null;
			let hotkey = '<b>'+favoriteName+'</b>';
			let img = '<span class="itemRecharge"></span>';

			if( !item ) {
				let s = '<div class="item unlit">'+img+hotkey+'</div>';
				$(s).appendTo(this.divId);
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
			let s = '<div class="item'+(unlit?' unlit':(lit?' lit':''))+'">'+img+hotkey+' '+[ex.condition,text].join(' ')+'</div>';


			$(s).appendTo(this.divId).on( 'click.view', null, event => {
				event.key = favorite.key;
				event.commandItem = item;
				this.onItemChoose(event);
			})
			.on( 'mouseover.view', null, event => {
				//console.log( 'ViewInventory mouseover' );
				guiMessage( 'showInfo', item );
			})
			.on( 'mouseout', null, event => {
				guiMessage( 'hideInfo' );
			});

		}
	}
}

return {
	ViewFavorites: ViewFavorites
}

});
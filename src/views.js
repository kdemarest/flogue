Module.add('views',function() {

class ViewObserver {
	constructor() {
		this.observerDefault = null;
		this.observerOverride = null;
	}
	get observer() {
		return this.observerOverride || this.observerDefault;
	}
	get trueObserver() {
		return this.observerDefault;
	}
	override(observer) {
		this.observerOverride = observer;
	}
	message(msg,payload) {
		if( msg == 'observer' && payload !== this.observer ) {
			this.observerDefault = payload;
		}
	}
}

class ViewNarrative extends ViewObserver {
	constructor(divId) {
		super();
		this.divId = divId;
		this.isBig = false;
		$(this.divId)
//			.mouseover( e => {
//				$(this.divId)
//					.addClass('big')
//					.scrollTop( $(this.divId).prop('scrollHeight') );;
//			})
//			.mouseout( e => {
//				$(this.divId)
//					.removeClass('big')
//					.scrollTop( $(this.divId).prop('scrollHeight') );;
//			})
			.click( e => {
				if( this.isBig ) {
					$(this.divId)
						.removeClass('big')
						.scrollTop( $(this.divId).prop('scrollHeight') );;
					this.isBig = false;
				}
				else {
					$(this.divId)
						.addClass('big')
						.scrollTop( $(this.divId).prop('scrollHeight') );;
					this.isBig = true;
				}
			});
;
	}
	message(msg,payload) {
		super.message(msg,payload);
		if( msg=='receive' ) {
			let history = payload;
			while( history.length > 50 ) {
				history.shift();
			}
			$(this.divId).html( history.join('\n') ).scrollTop( $(this.divId).prop('scrollHeight') );
//			targetElement.display = 'block';
//			targetElement.innerHTML = history.join('\n');
//			targetElement.scrollTop = targetElement.scrollHeight;
		}
	}
	render() {
	}
}

class ViewSign extends ViewObserver {
	constructor(divId) {
		super();
		this.divId = divId;
		$(this.divId).empty();
		this.lastSignId = '';
	}
	message(msg,payload) {
		super.message(msg,payload);
		if( msg=='clearSign' ) {
			$(this.divId).hide();
			guiMessage( 'hide' );
			this.observer.lastBumpedId = null;
		}
	}
	render() {
		let observer = this.observer;
		if( !observer ) {
			return;
		}
		let lastBumpedId = observer.lastBumpedId; 
		let signList = { count:0 };
		if( observer.sign ) {
			signList = new Finder([observer]).filter(e=>e.sign);
		}
		if( !signList.count && lastBumpedId ) {
			// The last entity I bumped, within 3 
			signList = new Finder(observer.entityList,observer).excludeMe().filter(e=>e.sign && e.id==lastBumpedId).nearMe(3);
		}
		if( !signList.count ) {
			// Any entity adjacent to me
			signList = new Finder(observer.entityList,observer).excludeMe().filter(e=>e.sign && !e.isMerchant).nearMe(1).byDistanceFromMe();
		}
		if( !signList.count ) {
			// Any item adjacent to me
			signList = new Finder(observer.map.itemList,observer).excludeMe().filter(e=>e.sign).nearMe(1).byDistanceFromMe();
		}

		let signRemove = () => {
			$(this.divId).hide();
			guiMessage( 'hide' );
			observer.seeingSignOf = null;
		}

		let signId = signList.first ? signList.first.id : '';
		let sign   = !signList.first ? '' : typeof signList.first.sign == 'function' ? signList.first.sign() : signList.first.sign;
		if( !signList.first || !sign ) {
			signRemove();
		}
		else {
			if( sign !== this.lastSign || signId !== this.lastSignId ) {
				$(this.divId).show().html(sign);
				guiMessage( 'show', signList.first );
				this.lastSign = sign;
			}
			observer.seeingSignOf = signList.first;
		}
		this.lastSignId = signId;
	}
}

class ViewSpells extends ViewObserver {
	constructor(spellDivId) {
		super();
		this.MAX_SLOTS = 5;
		this.spellDivId = spellDivId;
	}
	render() {
		if( $(this.spellDivId).length <= 0 ) {
			return;
		}
		let observer = this.observer;
		$(this.spellDivId).empty();
		let spellList = observer.getCastableSpellList();
		for( let i=0 ; i<spellList.all.length && i<this.MAX_SLOTS ; ++i ) {
			let spell = spellList.all[i];
			let pct = Math.floor( (1 - ( (spell.rechargeLeft||0) / (spell.rechargeTime||10) )) * 10 )*10;
			let img = '<img class="spellRecharge" src="'+IMG_BASE+StickerList['slice'+pct].img+'">';
			let text = 'F'+(i+1)+' '+String.capitalize(spell.effect.name)+'\n';
			let lit = observer.isItemSelected(spell) && spell.isRecharged();
			let unlit = !spell.isRecharged();
			$(this.spellDivId).append('<div class="spell'+(unlit?' unlit':(lit?' lit':''))+'">'+img+text+'</div>');
		}
	}
}


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
				guiMessage( 'show', item );
			})
			.on( 'mouseout', null, event => {
				guiMessage( 'hide' );
			});

		}
	}
}

class ViewZoom {
	constructor(divId) {
		let myDiv = $('<img class="guiButton" src="'+IMG_BASE+'gui/icons/magnify.png">').appendTo($(divId));
		myDiv.click( function() {
			guiMessage('zoomInc');
		});
	}
}

class ViewFull {
	constructor(divId,divToExpand) {
		this.divToExpand = divToExpand;
		this.isFull = false;
		function imageGet(index) {
			let iconList = ['gui/icons/screenExpand.png','gui/icons/screenContract.png']
			return IMG_BASE+iconList[index];
		}
		let self = this;
		let myDiv = $('<img class="guiButton" src="'+imageGet(0)+'">').appendTo($(divId));
		myDiv
		.show()
		.click( function(e) {
			if( !self.isFull ) {
				self.enter();
			}
			else {
				self.exit();
			}
			self.isFull = !self.isFull;
			$(myDiv).attr("src",imageGet(self.isFull?1:0));
		});
		// Super special-case for Cmd-Enter, which enters and exits full screen.
		$(document).keydown( function(e) {
			if( e.key == 'Enter' && (e.metaKey || e.altKey) ) {
				$(myDiv).trigger('click');
			}
		});

	}

	enabled() {
		return 
			document.fullscreenEnabled || 
			document.webkitFullscreenEnabled || 
			document.mozFullScreenEnabled ||
			document.msFullscreenEnabled
	}

	enter() {
		var i = $(this.divToExpand).get(0);

		// go full-screen
		if (i.requestFullscreen) {
			i.requestFullscreen();
		} else if (i.webkitRequestFullscreen) {
			i.webkitRequestFullscreen();
		} else if (i.mozRequestFullScreen) {
			i.mozRequestFullScreen();
		} else if (i.msRequestFullscreen) {
			i.msRequestFullscreen();
		}
	}

	exit() {
		// exit full-screen
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
		}
	}
}


class ViewExperience extends ViewObserver {
	constructor(divId) {
		super();
		this.divId = divId;
		$(this.divId).empty();
		this.experience = 0;
		this.level = -1;
	}
	message(msg,payload) {
		super.message(msg,payload);
		if( msg=='show' ) {
			this.override(payload);
			this.render();
		}
		if( msg=='hide' ) {
			this.override(null);
			this.render();
		}
	}
	render() {
		let entity = this.observer;
		if( !entity ) return;

		if( entity.isTileType || entity.isItemType || (entity.isMonsterType && !entity.isUser()) ) {
			let s = String.capitalize(entity.name.replace(/\$/,''));
			if( entity.level !== undefined && (entity.isMonsterType || (entity.isItemType && entity.isTreasure)) ) {
				s += ' Level '+Math.floor(entity.level);
			}
			if( entity.jobId ) {
				s += ' the '+String.capitalize(entity.jobId);
			}
			$(this.divId).show().html('<span class="monName monColor">'+s+'</span>');
			return;
		}

		let level = '<span class="level'+(entity.level>this.level && this.level !==-1 ?' gotLevel':'')+'">Level '+(entity.level+1)+'</span>';
		this.level = entity.level;

		let exp = '';
		if( entity.experience !== undefined ) {
			let eprog = entity.experienceProgress();
			exp = "Exp: <span"+(eprog>=1.0?' class="readyToLevel"':'')+">"+Math.percent( eprog, 0 )+'%</span>';
			if( entity.experience > this.experience ) {
				exp = '<span class="gotExperience">'+exp+'</span> (+'+Math.round(entity.experience-this.experience)+')';
				if( entity.experienceProgress() >= 1.0 ) {
					tell(mSubject|mCares,entity,' can visit a Solar Altar to level up.');
				}
				this.experience = entity.experience;
			}
		}
		$(this.divId).show().html(level+exp);
	}
}

return {
	ViewObserver: ViewObserver,
	ViewExperience: ViewExperience,
	ViewSpells: ViewSpells,
	ViewFavorites: ViewFavorites,
	ViewFull: ViewFull,
	ViewZoom: ViewZoom,
	ViewNarrative: ViewNarrative,
	ViewSign: ViewSign,
}

});

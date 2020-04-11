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
			guiMessage( 'hideInfo' );
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
				guiMessage( 'showInfo', signList.first );
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
		if( msg=='showInfo' ) {
			this.override(payload);
			this.render();
		}
		if( msg=='hideInfo' ) {
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
	ViewFull: ViewFull,
	ViewZoom: ViewZoom,
	ViewNarrative: ViewNarrative,
	ViewSign: ViewSign,
}

});

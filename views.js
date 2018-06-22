function getCastableSpellList(entity) {
	return new Finder(entity.inventory).filter( item=>item.isSpell && item.effect && item.effect.op && !item.effect.isBlank );
}

class ViewObserver {
	constructor() {
		this.observerStack = [];
		this.observerOverride = null;
	}
	get observer() {
		return this.observerOverride || this.observerStack[0];
	}
	get trueObserver() {
		return this.observerStack[0];
	}
	override(observer) {
		this.observerOverride = observer;
	}
	push(observer) {
		this.observerStack.unshift(observer);
	}
	pop(observer) {
		this.observerStack.shift(observer);
	}
	message(msg,payload) {
		if( msg == 'observer' && payload !== this.observer ) {
			this.push(payload);
		}
	}
}

class ViewNarrative extends ViewObserver {
	constructor(divId) {
		super();
		this.divId = divId;
	}
	message(msg,payload) {
		super.message(msg,payload);
		if( msg=='receive' ) {
			let history = payload;
			while( history.length > 50 ) {
				history.shift();
			}
			let targetElement = document.getElementById(this.divId);
			targetElement.display = 'block';
			targetElement.innerHTML = history.join('\n');
			targetElement.scrollTop = targetElement.scrollHeight;
		}
	}
	render() {
	}
}

class ViewSign extends ViewObserver {
	constructor(divId) {
		super();
		this.divId = divId;
	}
	message(msg,payload) {
		super.message(msg,payload);
		if( msg=='clearSign' ) {
			guiMessage( null, 'hide' );
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
		if( lastBumpedId ) {
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
		if( !signList.first ) {
			$('#'+this.divId).hide();
			guiMessage( null, 'hide' );
		}
		else {
			let sign = typeof signList.first.sign == 'function' ? signList.first.sign() : signList.first.sign;
			$('#'+this.divId).show().html(sign);
			guiMessage( null, 'show', signList.first );
		}
	}
}

class ViewSpells extends ViewObserver {
	constructor(spellDivId) {
		super();
		this.MAX_SLOTS = 5;
		this.spellDivId = spellDivId;
	}
	render() {
		let observer = this.observer;
		$('#'+this.spellDivId).empty();
		let spellList = getCastableSpellList(observer);
		for( let i=0 ; i<spellList.all.length && i<this.MAX_SLOTS ; ++i ) {
			let spell = spellList.all[i];
			let pct = Math.floor( (1 - ( (spell.rechargeLeft||0) / (spell.rechargeTime||10) )) * 10 )*10;
			let img = '<img class="spellRecharge" src="tiles/'+StickerList['slice'+pct].img+'">';
			let text = 'F'+(i+1)+' '+spell.effect.name+'\n';
			let lit = observer.commandItem == spell && spell.isRecharged();
			let unlit = !spell.isRecharged();
			$('#'+this.spellDivId).append('<div class="spell'+(unlit?' unlit':(lit?' lit':''))+'">'+img+text+'</div>');
		}
	}
}

class ViewZoom {
	constructor(divId) {
		let myDiv = $('<img class="guiButton" src="tiles/gui/icons/magnify.png">').appendTo($(divId));
		myDiv.click( function() {
			guiMessage('map','zoom',null);
		});
	}
}

class ViewFull {
	constructor(divId,divToExpand) {
		this.divToExpand = divToExpand;
		this.isFull = false;
		this.image = ['tiles/gui/icons/screenExpand.png','tiles/gui/icons/screenContract.png']
		let self = this;
		let myDiv = $('<img class="guiButton" src="'+this.image[0]+'">').appendTo($(divId));
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
			$(myDiv).attr("src",self.image[self.isFull?1:0]);
		});
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
			let s = String.capitalize(entity.name);
			if( entity.jobId ) {
				s += ' the '+String.capitalize(entity.jobId);
			}
			$('#'+this.divId).show().html('<span class="monName monColor">'+s+'</span>');
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
		$('#'+this.divId).show().html(level+exp);
	}
}


class ViewInfo extends ViewObserver {
	constructor(infoDivId) {
		super();
		this.infoDivId = infoDivId;
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

		function test(t,text) {
			if( t ) {
				conditionList.push(text);
			}
		}

		$('#'+this.infoDivId).empty().removeClass('monColor healthWarn healthCritical');
		if( entity.isTileType ) {
			return;
		}

		function itemSummarize(you,item,comp) {
			let mine = you.inventory.find(i=>i.id==item.id)
			let ex = itemExplain(item);
			let s = ex.icon+'<br>';
			s += ex.description+'<br>';
			let dam,arm;
			if( ex.damage ) {
				dam = ex.damage+' '+ex.damageType+' damage'+(ex.aoe ? ' '+ex.aoe : '');
				if( comp ) {
					if( comp.damage > item.damage ) dam = '<span class="worse">'+dam+'</span>';
					if( comp.damage < item.damage ) dam = '<span class="better">'+dam+'</span>';
				}
			}
			if( ex.armor ) {
				arm = ex.armor+' armor';
				if( comp ) {
					if( comp.armor > item.armor ) arm = '<span class="worse">'+arm+'</span>';
					if( comp.armor < item.armor ) arm = '<span class="better">'+arm+'</span>';
				}
			}
			if( dam || arm ) {
				s += dam+arm+'<br>';
			}
			s += (ex.bonus ? ex.bonus+' ' : '')+(ex.recharge ? ex.recharge+' recharge' : '');
			if( !mine ) {
				s = '<div class="monColor">'+s+'</div>';
			}
			return s;
		}

		if( entity.isItemType ) {
			let you = this.trueObserver;
			let item = entity;
			let s = itemSummarize(you,item);
			if( item.slot && !you.inventory.find(i=>i.id==item.id) ) {
				let f = you.getItemsInSlot(item.slot);
				if( f.count ) { s += '<hr>'; }
				f.process( i=>{ s += '<br>'+itemSummarize(you,i,item); });
			}
			$('#'+this.infoDivId).show().html(s);
			return;
		}

		let s = "";
		if( !entity.isUser() ) {
			s += entity.attitude+'<br>';
		}
		s += "Health: "+entity.health+" of "+entity.healthMax+"<br>";
		if( entity.isUser() ) {
			s += "Armor: "+entity.calcReduction(DamageType.CUTS,false)+"M, "+entity.calcReduction(DamageType.STAB,true)+"R<br>";
			let bc = entity.calcShieldBlockChance(DamageType.STAB,true,entity.shieldBonus);
			s += "Shield: "+(entity.shieldBonus?'<span class="shieldBonus">':'')+Math.floor(bc*100)+'%'+(entity.shieldBonus?'</span>':'')+" to block<br>";
			let weapon = entity.calcDefaultWeapon();
			s += "Damage: "+Math.floor(weapon.damage)+" "+weapon.damageType+[' (clumsy)','',' (quick)'][weapon.quick]+"<br>";
		}
		let spd = entity.speed<1 ? ', slow' : ( entity.speed>1 ? ', fast' : '');

		s += (entity.jump>0 ? '<span class="jump">JUMPING</span>' : (entity.travelMode !== 'walk' ? '<b>'+entity.travelMode+'ing</b>' : entity.travelMode+'ing'))+spd+'<br>';
		let conditionList = [];
		test(entity.attitude==Attitude.ENRAGED,'<b>enraged</b>');
		test(entity.attitude==Attitude.CONFUSED,'<b>confused</b>');
		test(entity.attitude==Attitude.PANICKED,'<b>panicked</b>');
		test(entity.invisible,'invis');
		test(entity.senseBlind,'blind');
		test(entity.senseXray,'xray');
		test(entity.senseItems,'treas');
		test(entity.senseLife,'bat');
		test(entity.regenerate>MonsterTypeList[entity.typeId].regenerate,'regen '+Math.floor(entity.regenerate*100)+'%');
		s += conditionList.join(',')+'<br>';
		s += entity.resist ? "Resist: "+entity.resist+'<br>' : '';
		s += entity.immune ? "Immune: "+entity.immune+'<br>' : '';
		s += entity.vuln ? "Vulnerable: "+entity.vuln+'<br>' : '';
		if( entity.isUser() ) {
			s += "Gold: "+Math.floor(entity.coinCount||0)+"<br>";
		}
		if( !entity.isUser() ) {
			s += (entity.history[0]||'')+(entity.history[1]||'')+(entity.history[2]||'');
			$('#'+this.infoDivId).addClass('monColor');
		}
		else {
			let healthRatio = entity.health/entity.healthMax;
			if( healthRatio < 0.15 ) {
				$('#'+this.infoDivId).addClass('healthCritical');
			}
			else
			if( healthRatio < 0.35 ) {
				$('#'+this.infoDivId).addClass('healthWarn');
			}
		}
		$('#'+this.infoDivId).show().append(s);

	}

}

class ViewStatus extends ViewObserver {
	constructor(divId) {
		super();
		this.divId = divId;
		this.slotList = [];
		this.slotMax = 10;
	}

	render(entityList) {
		let observer = this.observer;

		// We both exclude and then prepend the observer to make sure the observer is first in the list.
		let f = new Finder(entityList,observer).isAlive().exclude(observer).prepend(observer)
				.canPerceiveEntity().filter(e=>e.id==observer.id || e.inCombat).byDistanceFromMe().keepTop(this.slotMax);

		// Remove unused slots.
		Array.filterInPlace( this.slotList, slot => {
			if( !f.includesId( slot.entityId ) ) {
				$(slot).remove();
				return false;
			}
			return true;
		});

		// Add new slots
		let self = this;
		f.process( entity => {
			if( !self.slotList.find( div => div.entityId==entity.id ) ) {
				let div = $(
					'<div class="health-bar" data-total="1000" data-value="1000">'+
					'<div class="bar"><div class="hit"></div></div>'+
					'</div>'
				);
				div
				.appendTo('#'+self.divId)
				.show()
				.mouseover( function() {
					guiMessage(null,'show',entity);
				})
				.mouseout( function() {
					guiMessage(null,'hide');
				});
				div.entityId = entity.id;
				div.entityLastHealth = entity.health;
				self.slotList.push(div);
			}
		});

		// Update all slots.
		this.slotList.forEach( slot => {
			let entity = f.getId( slot.entityId );
			showHealthBar( slot, entity.health, slot.entityLastHealth, entity.healthMax, entity.name );
			slot.entityLastHealth = entity.health;
		});
	}
}

class ViewMiniMap extends ViewObserver {
	constructor(divId,captionDivId,imageRepo) {
		super();
		this.divId = divId;
		this.captionDivId = captionDivId;
		this.caption = '';
		this.mapMemoryFn = null;
		this.imageRepo = imageRepo;
		this.drawn = [];
	}
	create(area) {
		$( '#'+this.divId+'Canvas0' ).remove();
		$( '#'+this.divId+'Canvas1' ).remove();
		this.cleared = false;
		this.xLen = area.map.xLen;
		this.yLen = area.map.yLen;
		let dim = Math.max(this.xLen,this.yLen);
		this.scale = Math.max(1,Math.floor( 240/dim ));
		this.xLenCanvas = this.scale*dim;
		this.yLenCanvas = this.scale*dim;
		$( '#'+this.divId)
			.width(this.xLenCanvas)
			.height(this.yLenCanvas)
			.append('<canvas id="'+this.divId+'Canvas0'+'" height="'+this.yLenCanvas+'" width="'+this.xLenCanvas+'"></canvas>')
			.append('<canvas id="'+this.divId+'Canvas1'+'" height="'+this.yLenCanvas+'" width="'+this.xLenCanvas+'"></canvas>')
			.show();
	}
	setArea(area) {
		this.caption = String.capitalize(area.name)+' (Depth '+area.depth+')';
		this.mapMemoryFn = ()=>area.mapMemory;
		this.create(area);
	}
	message(msg,payload) {
		super.message(msg,payload);
		if( msg == 'setArea' ) {
			this.setArea(payload);
		}
	}
	render() {
		let observer = this.observer;
		let site = observer.area.getSiteAt(observer.x,observer.y);
		$('#'+this.captionDivId).show().html(
			this.caption + (site ? '<br>'+site.id+'<br>'+site.denizenList.map( entity=>entity.name ).join(',') : '')
		);

		var canvas0 = document.getElementById(this.divId+'Canvas0');
		var canvas1 = document.getElementById(this.divId+'Canvas1');
		if( !canvas0.getContext || !canvas1.getContext ) {
			debugger;
		}

		let self = this;
		function draw(c,entity,x,y,scale) {
			let imgGet = self.imageRepo.imgGet[entity.typeId];
			if( !imgGet ) debugger;
			if( imgGet ) {
				let imgPath = imgGet(entity);
				if( !entity ) debugger;
				let resource = self.imageRepo.get(imgPath);
				if( resource ) {
					c.drawImage( resource.texture.baseTexture.source, x*self.scale, y*self.scale, scale,scale );
				}
				else {
					console.log( "Unable to find image for "+entity.typeId+" img "+imgPath );
				}
			}
		}

		let unvisitedMap = StickerList.unvisitedMap;
		let c0 = canvas0.getContext("2d");
		let c1 = canvas1.getContext("2d");
		if( !this.cleared ) {
			draw(c0,unvisitedMap,0,0,2000);
			this.cleared = true;
		}
		c1.clearRect(0,0,this.xLenCanvas,this.yLenCanvas);

		let mapMemory = this.mapMemoryFn();
		let drawLate = [];
		for( let y=0 ; y<this.yLen ; ++y ) {
			if( !mapMemory[y] ) {
				continue;
			}
			for( let x=0 ; x<this.xLen ; ++x ) {
				let entity = mapMemory[y][x];
				if( entity ) {
					if( x==observer.x && y==observer.y ) {
						entity = StickerList.observerProxy;
						drawLate.push({entity:entity,x:x,y:y,scale:this.scale*4});
						continue;
					}
					if( entity.gateDir !== undefined ) {
						entity = StickerList[entity.gateDir>0 ? 'gateDownProxy' : 'gateProxy'];
						drawLate.push({entity:entity,x:x,y:y,scale:this.scale*3});
						continue;
					}
				}

				if( this.drawn[y*this.xLen+x] === entity ) {
					continue;
				}
				this.drawn[y*this.xLen+x] = entity;
				if( !entity ) {
					draw(c0,unvisitedMap,x,y,this.scale);
					continue;
				}
				if( entity.isWall && !entity.mineId ) {
					entity = StickerList.wallProxy;
				}
				draw(c0,entity,x,y,this.scale);
			}
		}
		while( drawLate.length ) {
			let d = drawLate.pop();
			draw(c1,d.entity,d.x,d.y,d.scale);
		}
	}
}

function itemExplain(item,buySell) {
	function icon(file) {
		return file ? '<img src="tiles/gui/icons/'+file+'">' : '';
	}
	return {
		level: 			item.level,
		icon: 			icon(item.icon),
		description: 	((item._count||0)>1 ? item._count+'x ' : '')+String.capitalize(item.name),
		damage: 		item.isWeapon ? item.damage : (item.effect && item.effect.op=='damage' ? item.effect.value : ''),
		damageType: 	item.isWeapon ? item.damageType : (item.effect && item.effect.op=='damage' ? item.effect.damageType : ''),
		armor: 			item.isArmor || item.isShield ? item.calcReduction(DamageType.CUTS,item.isShield) : '',
		aoe: 			item && item.effect && item.effect.effectShape && item.effect.effectShape!==EffectShape.SINGLE ? ' ('+item.effect.effectShape+')' : '',
		bonus: 			item.isArmor && item.effect ? item.effect.name : (item.isWeapon && item.effect && item.effect.op=='damage' ? '+'+item.effect.value+' '+item.effect.damageType:''),
		recharge: 		item.rechargeTime ? item.rechargeTime : '',
		price: 			new Picker(item.area.depth).pickPrice(buySell,item),
	};
}


class ViewRange extends ViewObserver {
	constructor() {
		super();
		this.xOfs = 0;
		this.yOfs = 0;
		this.visibleFn = null;
		this.rangeLimit = 0;
		this.active = false;
	}
	clear() {
		this.xOfs = 0;
		this.yOfs = 0;
		guiMessage(null,'overlayRemove',{group: 'guiCrosshair'});
		this.isShotClear = false;
	}
	move(xAdd,yAdd) {
		let x = this.xOfs + xAdd;
		let y = this.yOfs + yAdd;
		if( Math.abs(x) > this.rangeLimit || Math.abs(y) > this.rangeLimit ) {
			return false;
		}
		this.xOfs = x;
		this.yOfs = y;

		if( this.observer ) {
			let observer = this.observer;
			let area = observer.area;
			x = observer.x + x;
			y = observer.y + y;
			if( observer.canPerceivePosition(x,y) ) {
				let entity = new Finder(area.entityList,observer).canPerceiveEntity().at(x,y).first || new Finder(area.map.itemList,observer).canPerceiveEntity().at(x,y).first || adhoc(area.map.tileTypeGet(x,y),area.map,x,y);
				console.log( "viewRange is showing "+entity.name );
				guiMessage(null,'show',entity);
			}
		}
	}
	prime(rangeLimit,visibleFn) {
		let entity = this.observer;
		this.visibleFn = visibleFn;
		this.rangeLimit = rangeLimit;
		if( !this.active ) {
			let f = entity.findAliveOthersNearby().isId(entity.lastAttackTargetId).canPerceiveEntity().canTargetEntity().nearMe(this.rangeLimit);
			if( !f.first ) {
				f = entity.findAliveOthersNearby().isNotMyFriend().canPerceiveEntity().canTargetEntity().nearMe(this.rangeLimit).byDistanceFromMe();
			}
			if( f.first ) {
				this.xOfs = f.first.x-entity.x;
				this.yOfs = f.first.y-entity.y;
			}
			else {
				this.xOfs = 0;
				this.yOfs = 0;
			}
			this.move(0,0);
		}
	}
	message( msg, payload ) {
		super.message(msg,payload);
		if( msg == 'pick' ) {
			this.active = this.visibleFn && this.visibleFn();
			if( this.active ) {
				this.move(payload.xOfs-this.xOfs,payload.yOfs-this.yOfs);
			}
		}
	}

	drawRange(map,sx,sy,tx,ty) {
		let self = this;
		this.isShotClear = true;
		function test(x,y) {
			return map.tileTypeGet(x,y).mayFly;
		}
		function add(x,y,ok) {
			guiMessage(null,'overlayAdd',{ group: 'guiCrosshair', x:x, y:y, img:StickerList[ok?'crosshairYes':'crosshairNo'].img });
			self.isShotClear = self.isShotClear && ok;
		}
		shootRange(sx,sy,tx,ty,test,add);
	}

	render() {
		let observer = this.observer;
		guiMessage( null, 'overlayRemove', { group: 'guiCrosshair' } );
		this.active = this.visibleFn && this.visibleFn();
		if( !this.active && this.activeLast ) {
			// sadly this is the only way to know that we're no longer showing the range...
			guiMessage(null,'hide');
		}
		if( this.active ) {
			//console.log("crosshair at "+(observer.x+this.xOfs)+','+(observer.y+this.yOfs));
			console.log('drawRange');
			this.drawRange(observer.map,observer.x,observer.y,observer.x+this.xOfs,observer.y+this.yOfs);
		}
		this.activeLast = this.active;
	}
}

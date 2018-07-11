function getCastableSpellList(entity) {
	let hasId = {};
	return new Finder(entity.inventory).filter( item=>{
		if( item.isSpell && item.effect && item.effect.op && !item.effect.isBlank ) {
			let ok = !hasId[item.effect.typeId];
			hasId[item.effect.typeId] = 1;
			return ok;
		}
	});
}

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
		this.lastSignId = '';
	}
	message(msg,payload) {
		super.message(msg,payload);
		if( msg=='clearSign' ) {
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

		let signId = signList.first ? signList.first.id : '';
		if( signId !== this.lastSignId ) {
			if( !signList.first ) {
				$('#'+this.divId).hide();
				guiMessage( 'hide' );
			}
			else {
				let sign = typeof signList.first.sign == 'function' ? signList.first.sign() : signList.first.sign;
				$('#'+this.divId).show().html(sign);
				//console.log( 'ViewSign render' );
				guiMessage( 'show', signList.first );
			}
			this.lastSignId = signId;
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
			let img = '<img class="spellRecharge" src="'+IMG_BASE+StickerList['slice'+pct].img+'">';
			let text = 'F'+(i+1)+' '+String.capitalize(spell.effect.name)+'\n';
			let lit = observer.commandItem == spell && spell.isRecharged();
			let unlit = !spell.isRecharged();
			$('#'+this.spellDivId).append('<div class="spell'+(unlit?' unlit':(lit?' lit':''))+'">'+img+text+'</div>');
		}
	}
}

class ViewZoom {
	constructor(divId) {
		let myDiv = $('<img class="guiButton" src="'+IMG_BASE+'gui/icons/magnify.png">').appendTo($(divId));
		myDiv.click( function() {
			guiMessage('zoom',null,'map');
		});
	}
}

class ViewFull {
	constructor(divId,divToExpand) {
		this.divToExpand = divToExpand;
		this.isFull = false;
		this.image = ['screenExpand.png','screenContract.png']
		let self = this;
		let myDiv = $('<img class="guiButton" src="'+IMG_BASE+'gui/icons/'+this.image[0]+'">').appendTo($(divId));
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
			let s = String.capitalize(entity.name.replace(/\$/,''));
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
		let you = this.trueObserver;
		let entity = this.observer;

		function test(conditionList,t,text) {
			if( t ) {
				conditionList.push(text);
			}
		}

		$('#'+this.infoDivId).empty().removeClass('monColor healthWarn healthCritical');
		if( entity.isTileType ) {
			return;
		}

		let specialMessage = '';
		if( entity.id !== you.id ) {
			if( you.senseBlind ) {
				specialMessage = you.nearTarget(entity,1) ? 'Some kind of '+(entity.isMonsterType ? 'creature' : 'item')+'.' : 'You are blind.';
			}
			else
			if( entity.invisible && !you.senseInvisible ) {
				specialMessage = you.nearTarget(entity,1) ? 'An invisible '+(entity.isMonsterType ? 'creature' : 'item')+'.' : 'Unknown.';
			}
			if( specialMessage ) {
				let s = '<div class="monColor">'+specialMessage+'</div>';
				$('#'+this.infoDivId).show().html(s);
				return;
			}
		}

		function itemSummarize(you,item,comp,header=true) {
			let mine = you.inventory.find(i=>i.id==item.id)
			let ex = itemExplain(item);
			let s = '';
			if( header ) {
				s += item.isUnique ? '<img class="itemImage" src="'+IMG_BASE+item.img+'"><br>' :
					ex.icon+'<br>';
				s += ex.description+'<br>';
			}
			let dam='',arm='';
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
			let item = entity;
			let s = '<div class="monColor">';
			s += itemSummarize(you,item,false,!item.inventory && item.isTreasure);
			if( item.slot && !you.inventory.find(i=>i.id==item.id) ) {
				let f = you.getItemsInSlot(item.slot);
				if( f.count ) { s += '<hr>'; }
				f.process( i=>{ s += '<br>'+itemSummarize(you,i,item); });
			}
			if( item.inventory ) {
				s += '<div class="invList">';
				if( item.state == 'shut' ) {
					s += 'Contents unknown';
				}
				else {
					let any = false;
					item.inventory.forEach( item => {
						let ex = itemExplain(item);
						s += (any ? ', ' : '')+'<span>'+ex.description+'</span>';
						any=true;
					});
					if( !any ) {
						s += 'Empty';
					}
				}
				s += '</div>';
			}
			s += "</div>";
			$('#'+this.infoDivId).show().html(s);
			return;
		}

		let s = "";
		if( !entity.isUser() ) {
			s += '['+(this.lastDirAttempt||'-')+'] ';
			s += entity.attitude+' '+(entity.bumpCount||'')+'<br>';
		}
/*
		let poisonMax = 0;
		entity.traverseDeeds( deed => {
			if( poisonMax === true ) return;
			if( deed.damageType == DamageType.POISON ) {
				if( deed.duration === true ) {
					poisonMax = true;
				}
				else {
					poisonMax = Math.max(poisonMax,deed.timeLeft);
				}
			}
		});
*/
		let tRow = function(a,b) {
			return '<tr><td>'+a+'</td><td>'+b+'</td></tr>';
		}

		s += '<div class="monsterImageBackground"><img class="monsterImage" src="'+IMG_BASE+entity.img+'"></div><br>';

		s += '<table>';
//		if( poisonMax ) {
//			s += tRow( 'Health:', '<span class="poison">&nbsp;POISONED ('+(poisonMax===true ? 'FOREVER' : poisonMax)+')&nbsp;</span>' );
//		}
//		else {
			s += tRow( 'Health:', Math.ceil(entity.health)+' of '+Math.ceil(entity.healthMax)+' ('+entity.x+','+entity.y+')' );
//		}
		if( entity.isUser() ) {
			let bc = entity.calcShieldBlockChance(DamageType.STAB,true,entity.shieldBonus);
			let weapon = entity.calcDefaultWeapon();
			let ammo = entity.getFirstItemInSlot(Slot.AMMO);
			let ex = itemExplain(ammo);
			s += tRow( "Armor:", entity.calcReduction(DamageType.CUT,false)+"M, "+entity.calcReduction(DamageType.STAB,true)+"R" );
			s += tRow( "Shield:", (entity.shieldBonus?'<span class="shieldBonus">':'')+Math.floor(bc*100)+'%'+(entity.shieldBonus?'</span>':'')+" to block" );
			s += tRow( "Damage:", 
				Math.floor(weapon.damage)+" "+weapon.damageType+
				[' (clumsy)','',' (quick)'][weapon.getQuick()] +
				( (entity.sneakAttackMult||2)<=2 ? '' : ', Sneak x'+Math.floor(entity.sneakAttackMult) )
			);

			s += tRow( "Ammo:", ex ? ex.description : 'none ready' );
			s += tRow( "Gold:", Math.floor(entity.coinCount||0) );
		}
		s += '</table>';
		let spd = entity.speed<1 ? ', slow' : ( entity.speed>1 ? ', fast' : '');

		s += (entity.jump>0 ? '<span class="jump">JUMPING</span>' : (entity.travelMode !== 'walk' ? '<b>'+entity.travelMode+'ing</b>' : entity.travelMode+'ing'))+spd+'<br>';
		let conditionList = [];
		let senseList = [];
		DeedManager.traverseDeeds( entity, deed => {
			if( deed.op == 'damage' ) {
				conditionList.push('<b>'+deed.name+' '+(typeof deed.timeLeft == 'number' ? deed.timeLeft : '')+'</b>');
			}
		});
		test( conditionList, entity.attitude==Attitude.ENRAGED,'<b>enraged</b>');
		test( conditionList, entity.attitude==Attitude.CONFUSED,'<b>confused</b>');
		test( conditionList, entity.attitude==Attitude.PANICKED,'<b>panicked</b>');
		test( conditionList, entity.map.getLightAt(entity.x,entity.y,1) <= 0,		'shrouded');
		test( conditionList, entity.immobile,				'immobile');
		test( conditionList, entity.invisible,				'invis');
		test( conditionList, (entity.rechargeRate||1)>1,	'manaUp');
		test( conditionList, entity.regenerate>MonsterTypeList[entity.typeId].regenerate,'regen '+Math.floor(entity.regenerate*100)+'%');
		test( senseList, entity.senseBlind,		'blind');
		test( senseList, entity.senseSmell,		'scent');
		test( senseList, entity.senseXray,		'xray');
		test( senseList, entity.senseInvisible,	'invis');
		test( senseList, entity.senseTreasure,	'treasure');
		test( senseList, entity.senseLiving,	'living');
		s += conditionList.join(', ')+'<br>';
		s += senseList.length ? "Senses: "+senseList.join(', ')+'<br>' : '';
		s += entity.resist ? "Resist: "+entity.resist.split(',').join(', ')+'<br>' : '';
		s += entity.immune ? "Immune: "+entity.immune.split(',').join(', ')+'<br>' : '';
		s += entity.vuln ? "Vulnerable: "+entity.vuln.split(',').join(', ')+'<br>' : '';
		if( !entity.isUser() ) {
			s += (entity.history[0]||'')+(entity.history[1]||'')+(entity.history[2]||'');
//			$('#guiPathDebugSummary').html(entity.path ? JSON.stringify(entity.path.status) : 'No Path');
//			$('#guiPathDebug').html(entity.path ? entity.path.render().join('\n') : '');
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
					guiMessage('show',entity);
				})
				.mouseout( function() {
					guiMessage('hide');
				});
				div.entityId = entity.id;
				div.entityLastHealth = entity.health;
				self.slotList.push(div);
			}
		});

		// Update all slots.
		this.slotList.forEach( slot => {
			let entity = f.getId( slot.entityId );
			let color = entity.hasDeed(deed=>deed.damageType==DamageType.POISON) ? '#66cc1a' : '#c54';
			showHealthBar( slot, entity.health, slot.entityLastHealth, entity.healthMax, entity.name, color );
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
		this.imageRepo = imageRepo;
		this.drawn = [];
	}
	create(area) {
		$( '#'+this.divId+'Canvas0' ).remove();
		$( '#'+this.divId+'Canvas1' ).remove();
		this.cleared = false;
		this.drawn = [];
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
		this.create(area);
	}
	message(msg,payload) {
		super.message(msg,payload);
		if( msg == 'setArea' ) {
			this.setArea(payload);
		}
		if( msg == 'resetMiniMap' ) {
			this.setArea(payload);
		}
	}
	render() {
		let observer = this.observer;
		let site = observer.area.getSiteAt(observer.x,observer.y);
		$('#'+this.captionDivId).show().html(
			this.caption // + (site ? '<br>'+site.id+'<br>'+site.denizenList.map( entity=>entity.name ).join(',') : '')
		);

		var canvas0 = document.getElementById(this.divId+'Canvas0');
		var canvas1 = document.getElementById(this.divId+'Canvas1');
		if( !canvas0.getContext || !canvas1.getContext ) {
			debugger;
		}

		let self = this;
		function draw(c,entity,x,y,scale,ctr) {
			let imgGet = self.imageRepo.imgGet[entity.typeId];
			if( !imgGet ) debugger;
			if( imgGet ) {
				let imgPath = imgGet(entity);
				if( !entity ) debugger;
				let resource = self.imageRepo.get(imgPath);
				if( resource ) {
					let image = resource.texture.baseTexture.source;
					if( ctr ) {
						x -= (scale/self.scale)/2;
						y -= (scale/self.scale)/2;
					}
					//let width = image.width * self.scale;
					//let height = image.height * self.scale;
					c.drawImage( image, x*self.scale, y*self.scale, scale,scale );
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

		let drawLate = [];

		observer.entityList.forEach( entity => {
			if( entity.brainMaster && entity.brainMaster.id==observer.id ) {
				drawLate.push({entity:StickerList.friendProxy,x:entity.x,y:entity.y,scale:this.scale*2,ctr:true});
				return;
			}
			if( observer.senseLiving ) {
				let sticker = observer.isMyEnemy(entity) ? StickerList.enemyProxy : StickerList.friendProxy;
				drawLate.push({entity:sticker,x:entity.x,y:entity.y,scale:this.scale});
				return;
			}
		});

		let mapMemory = observer.mapMemory;
		for( let y=0 ; y<this.yLen ; ++y ) {
			for( let x=0 ; x<this.xLen ; ++x ) {
				let mPos = y*this.xLen+x;
				if( x==observer.x && y==observer.y ) {
					drawLate.push({entity:StickerList.observerProxy,x:x,y:y,scale:this.scale*4,ctr:true});
					continue;
				}
				let entity = mapMemory[mPos];
				if( entity ) {
					if( entity.gateDir !== undefined ) {
						let gate = StickerList[entity.gateDir>0 ? 'gateDownProxy' : 'gateProxy'];
						drawLate.push({entity:gate,x:x,y:y,scale:this.scale*3,ctr:true});
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
			draw(c1,d.entity,d.x,d.y,Math.min(d.scale,20),d.ctr);
		}
	}
}

function itemExplain(item,buySell) {
	function order(typeId) {
		return String.fromCharCode(64+ItemSortOrder.indexOf(typeId));
	}
	function icon(file) {
		return file ? '<img src="'+IMG_BASE+'gui/icons/'+file+'">' : '';
	}
	function rechargeImg() {
		if( !item.rechargeTime ) return '';
		let pct = Math.floor( (1 - ( (item.rechargeLeft||0) / (item.rechargeTime||10) )) * 10 )*10;
		return '<img class="spellRecharge" src="'+IMG_BASE+StickerList['slice'+pct].img+'">';
	}

	if( !item ) return false;
	let name = item.name.replace(/\$/,'');
	return {
		item: 			item,
		typeId: 		item.typeId,
		level: 			item.level,
		typeOrder: 		order(item.typeId),
		icon: 			icon(item.icon),
		description: 	((item.bunch||0)>1 ? item.bunch+'x ' : '')+String.capitalize(name),
		bunch: 			((item.bunch||0)>1 ? item.bunch+'x ' : ''),
		name: 			String.capitalize(name),
		damage: 		item.isWeapon ? item.damage : (item.effect && item.effect.op=='damage' ? item.effect.value : ''),
		damageType: 	item.isWeapon ? item.damageType : (item.effect && item.effect.op=='damage' ? item.effect.damageType : ''),
		armor: 			item.isArmor || item.isShield ? item.calcReduction(DamageType.CUT,item.isShield) : '',
		aoe: 			item && item.effect && item.effect.effectShape && item.effect.effectShape!==EffectShape.SINGLE ? ' ('+item.effect.effectShape+')' : '',
		bonus: 			item.isArmor && item.effect ? item.effect.name : (item.isWeapon && item.effect && item.effect.op=='damage' ? '+'+item.effect.value+' '+item.effect.damageType:''),
		recharge: 		item.rechargeTime ? item.rechargeTime : '',
		rechargeLeft: 	rechargeImg(),
		price: 			new Picker(item.area.depth).pickPrice(buySell,item),
		priceWithCommas: (new Picker(item.area.depth).pickPrice(buySell,item)).toLocaleString(),
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
		guiMessage('overlayRemove',{groupId: 'guiCrosshair'});
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
			if( observer.canTargetPosition(x,y) ) {
				let entity = 
					new Finder(area.entityList,observer).canTargetEntity().at(x,y).first || 
					new Finder(area.map.itemList,observer).canTargetEntity().at(x,y).first || 
					adhoc(area.map.tileTypeGet(x,y),area.map,x,y);
				//console.log( "viewRange is showing "+entity.name );
				guiMessage('show',entity);
			}
		}
	}
	prime(rangeLimit,cmd,visibleFn) {
		let entity = this.observer;
		this.visibleFn = visibleFn;
		this.rangeLimit = rangeLimit;
		if( !this.active ) {
			let target;
			if( cmd.commandItem && cmd.commandItem.effect && cmd.commandItem.effect.isHelp ) {
				target = entity;
			}
			else {
				target =
					entity.findAliveOthersNearby().isId(entity.lastAttackTargetId).canTargetEntity().nearMe(this.rangeLimit).first ||
					entity.findAliveOthersNearby().isNotMyFriend().canTargetEntity().nearMe(this.rangeLimit).byDistanceFromMe().first;
			}
			if( target ) {
				this.xOfs = target.x-entity.x;
				this.yOfs = target.y-entity.y;
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
		let areaId = this.observer.area.id;
		function test(x,y) {
			return map.tileTypeGet(x,y).mayFly;
		}
		function add(x,y,ok) {
			guiMessage('overlayAdd',{ groupId: 'guiCrosshair', x:x, y:y, areaId:areaId, img:StickerList[ok?'crosshairYes':'crosshairNo'].img });
			self.isShotClear = self.isShotClear && ok;
		}
		shootRange(sx,sy,tx,ty,test,add);
	}

	render() {
		let observer = this.observer;
		guiMessage( 'overlayRemove', { groupId: 'guiCrosshair' } );
		this.active = this.visibleFn && this.visibleFn();
		if( !this.active && this.activeLast ) {
			// sadly this is the only way to know that we're no longer showing the range...
			guiMessage('hide');
		}
		if( this.active ) {
			//console.log("crosshair at "+(observer.x+this.xOfs)+','+(observer.y+this.yOfs));
			console.log('drawRange');
			this.drawRange(observer.map,observer.x,observer.y,observer.x+this.xOfs,observer.y+this.yOfs);
		}
		this.activeLast = this.active;
	}
}

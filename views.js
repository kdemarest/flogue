function getCastableSpellList(entity) {
	return new Finder(entity.inventory).filter( item=>item.isSpell && item.effect && item.effect.op && !item.effect.isBlank );
}

class ViewNarrative {
	constructor(divId) {
		this.divId = divId;
	}
	message(msg,payload) {
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

class ViewSign {
	constructor(divId) {
		this.divId = divId;
	}
	render(observer) {
		let signList = new Finder(observer.entityList,observer).excludeMe().filter(e=>e.sign).nearMe(1).byDistanceFromMe();
		if( !signList.count ) {
			signList = new Finder(observer.map.itemList,observer).excludeMe().filter(e=>e.sign).nearMe(1).byDistanceFromMe();
		}
		if( !signList.first ) {
			$('#'+this.divId).hide();
		}
		else {
			let sign = typeof signList.first.sign == 'function' ? signList.first.sign() : signList.first.sign;
			$('#'+this.divId).show().html(sign);
		}
	}
}

class ViewSpells {
	constructor(spellDivId) {
		this.MAX_SLOTS = 5;
		this.spellDivId = spellDivId;
	}
	render(observer) {
		$('#'+this.spellDivId).empty();
		let spellList = getCastableSpellList(observer);
		for( let i=0 ; i<spellList.all.length && i<this.MAX_SLOTS ; ++i ) {
			let spell = spellList.all[i];
			let text = 'F'+(i+1)+' '+spell.effect.name+'\n';
			let lit = observer.commandItem == spell && spell.isRecharged();
			let unlit = !spell.isRecharged();
			$('#'+this.spellDivId).append('<div class="spell'+(unlit?' unlit':(lit?' lit':''))+'">'+text+'</div>');
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


class ViewExperience {
	constructor(divId) {
		this.divId = divId;
		this.experience = 0;
		this.level = -1;
	}
	render(entity) {
		$('#'+this.divId);

		let level = '<span class="level'+(entity.level>this.level && this.level !==-1 ?' gotLevel':'')+'">Level '+(entity.level+1)+'</span>';
		this.level = entity.level;

		let exp = '';
		if( entity.experience !== undefined ) {
			exp = "Exp: "+Math.percent( entity.experienceProgress(), 0 )+'%';
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


class ViewInfo {
	constructor(infoDivId) {
		this.infoDivId = infoDivId;
	}
	message(msg,payload) {
		if( msg=='show' ) {
			this.render(payload);
		}
	}
	render(entity) {
		function test(t,text) {
			if( t ) {
				conditionList.push(text);
			}
		}
		$('#'+this.infoDivId).empty().removeClass('healthWarn healthCritical');
		let s = "";
		s += "Health: "+entity.health+" of "+entity.healthMax+"\n";
		s += "Armor: "+entity.calcReduction(DamageType.CUTS,false)+"M, "+entity.calcReduction(DamageType.STAB,true)+"R\n";
		let bc = entity.calcShieldBlockChance(DamageType.STAB,true,entity.shieldBonus);
		s += "Shield: "+(entity.shieldBonus?'<span class="shieldBonus">':'')+Math.floor(bc*100)+'%'+(entity.shieldBonus?'</span>':'')+" to block\n";
		let weapon = entity.calcDefaultWeapon();
		s += "Damage: "+Math.floor(weapon.damage)+" "+weapon.damageType+[' (clumsy)','',' (quick)'][weapon.quick]+"\n";
		s += (entity.jump>0 ? '<span class="jump">JUMPING</span>' : (entity.travelMode !== 'walk' ? '<b>'+entity.travelMode+'ing</b>' : entity.travelMode+'ing'))+'\n';
		let conditionList = [];
		test(entity.invisible,'invis');
		test(entity.speed<1,'slow');
		test(entity.speed>1,'fast');
		test(entity.senseBlind,'blind');
		test(entity.senseXray,'xray');
		test(entity.senseItems,'treas');
		test(entity.senseLife,'bat');
		test(entity.regenerate>MonsterTypeList[entity.typeId].regenerate,'regen '+Math.floor(entity.regenerate*100)+'%');
		test(entity.attitude==Attitude.ENRAGED,'enraged');
		test(entity.attitude==Attitude.CONFUSED,'confused');
		test(entity.attitude==Attitude.PANICKED,'panicked');
		s += conditionList.join(',')+'\n';
		s += entity.resist ? "Resist: "+entity.resist+'\n' : '';
		s += entity.immune ? "Immune: "+entity.immune+'\n' : '';
		s += entity.vuln ? "Vulnerable: "+entity.vuln+'\n' : '';
		s += "Gold: "+Math.floor(entity.goldCount||0)+"\n";
		$('#'+this.infoDivId).show().append(s);
		let healthRatio = entity.health/entity.healthMax;
		if( healthRatio < 0.15 ) {
			$('#'+this.infoDivId).addClass('healthCritical');
		}
		else
		if( healthRatio < 0.35 ) {
			$('#'+this.infoDivId).addClass('healthWarn');
		}

	}

}

class ViewStatus {
	constructor(divId,) {
		this.divId = divId;
		this.slotList = [];
		this.slotMax = 10;
	}

	render(observer,entityList) {
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
					guiMessage('info','show',entity);
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

class ViewMiniMap {
	constructor(divId,captionDivId,imageRepo) {
		this.divId = divId;
		this.captionDivId = captionDivId;
		this.caption = '';
		this.mapMemoryFn = null;
		this.imageRepo = imageRepo;
		this.drawn = [];
	}
	create(area) {
		$( '#'+this.divId+'Canvas' ).remove();
		this.xLen = area.map.xLen;
		this.yLen = area.map.yLen;
		this.scale = Math.max(this.yLen,this.xLen) < 2000 ? 2 : 1;
		let dim = Math.max(this.xLen,this.yLen);
		$( '#'+this.divId)
			.width(dim*this.scale)
			.height(dim*this.scale)
			.append('<canvas id="'+this.divId+'Canvas'+'" height="'+dim*this.scale+'" width="'+dim*this.scale+'"></canvas>')
			.show();
	}
	setArea(area) {
		this.caption = String.capitalize(area.name)+' (Depth '+area.depth+')';
		this.mapMemoryFn = ()=>area.mapMemory;
		this.create(area);
	}
	message(msg,payload) {
		if( msg == 'setArea' ) {
			this.setArea(payload);
		}
	}
	render(observer) {
		let site = observer.area.getSiteAt(observer.x,observer.y);
		$('#'+this.captionDivId).show().html(
			this.caption + (site ? '<br>'+site.id+'<br>'+site.denizenList.map( entity=>entity.name ).join(',') : '')
		);

		var canvas = document.getElementById(this.divId+'Canvas');
		if( !canvas.getContext ) {
			debugger;
		}

		let self = this;
		function draw(entity,x,y,scale) {
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
		let c = canvas.getContext("2d");
		if( !this.cleared ) {
			draw(unvisitedMap,0,0,2000);
			this.cleared = true;
		}

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
					draw(unvisitedMap,x,y,this.scale);
					continue;
				}
				if( entity.isWall && !entity.mineId ) {
					entity = StickerList.wallProxy;
				}
				draw(entity,x,y,this.scale);
			}
		}
		while( drawLate.length ) {
			let d = drawLate.pop();
			draw(d.entity,d.x,d.y,d.scale);
		}
	}
}


class ViewInventory {
	constructor(inventoryDivId,imageRepo,onItemChoose) {
		this.inventoryDivId = inventoryDivId;
		this.imageRepo = imageRepo;
		this.onItemChoose = onItemChoose;
		this.inventory = null;
		this.inventoryFn = null;
		this.inventorySelector = '123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		this.everSeen = {};
		this.allowFilter = null;
		this.filterId = '';
		this.inventoryFn = null;
		this.visibleFn = null;
	}
	getItemByKey(keyPressed) {
		let n = this.inventorySelector.indexOf(keyPressed);
		if( n>=0 && n<this.inventory.count ) {
			return this.inventory.all[n];
		}
		return null;
	}
	prime(inventoryFn,allowFilter,visibleFn) {
		this.allowFilter = allowFilter;
		this.inventoryFn = inventoryFn;
		this.visibleFn = visibleFn;
		return this.div.is(":visible");
	}
	get div() {
		return $('#'+this.inventoryDivId);
	}
	_hide() {
		if( this.userSawInventory ) {
			for( let i=0 ; i<this.inventory.all.length ; ++i ) {
				this.everSeen[this.inventory.all[i].id]=true;
			}
			this.userSawInventory = false;
		}
		this.div.hide();
	}
	render(observer) {
		function order(typeId) {
			return String.fromCharCode(64+ItemSortOrder.indexOf(typeId));
		}
		if( !this.visibleFn || !this.visibleFn() ) {
			this._hide();
			return;
		}

		this.inventoryRaw = this.inventoryFn().isReal();
		if( this.allowFilter && this.filterId ) {
			let filterId = this.filterId;
			this.inventoryRaw.filter( item => ItemFilterGroup[filterId].includes(item.typeId) );
		}

		this.inventoryRaw.all.sort( function(a,b) { 
			let as = order(a.typeId)+' '+a.name;
			let bs = order(b.typeId)+' '+b.name;
			if( as < bs ) return -1;
			if( as > bs ) return 1;
			return 0;
		});

		this.inventory = new Finder([]);
		this.inventoryRaw.process( item => {
			let sid = item.name+'&'+item.inSlot;
			if( !item.inSlot ) {
				let other = this.inventory.find( item => item._sid==sid );
				if( other ) {
					other._count++;
					return;
				}
			}
			item._sid = sid;
			item._count = 1;
			this.inventory.all.push(item);
		});


		function icon(file) {
			return '<img src="tiles/gui/icons/'+file+'">';
		}

		let self = this;
		$(this.div).empty();

		let cat = $('<div class="invCategories"></div>').appendTo(this.div);
		if( this.allowFilter ) {
			ItemFilterOrder.map( filterId => {
				let typeIcon =  $(icon( filterId=='' ? 'all.png' : ItemTypeList[filterId].icon ));
				typeIcon.appendTo(this.div)
				if( self.allowFilter && self.filterId==filterId ) {
					typeIcon.addClass('iconLit');
				}
				typeIcon.click( function() {
					$('.invCategories img').removeClass('iconLit');
					self.filterId = filterId;
					self.render(observer);
				})
				.appendTo(cat);
			});
		}

		let table = $( '<table class="inv"></table>' ).appendTo(this.div);
		let tHead = $('<thead><tr><td></td><td></td><td class="right"></td><td>Description</td><td>Armor</td><td colspan="2">Damage</td><td class="right">Bonus</td><td class="right">Chg</td></tr></thead>' ).appendTo(table);
		let tBody = $('<tbody></tbody>').appendTo(table);
		let lastTypeId = '';
		for( let i=0 ; i<this.inventory.count ; ++i ) {
			let item = this.inventory.all[i];
			let s = '';
			s += '<tr>';
			let spacer = (!lastTypeId || lastTypeId==item.typeId) ? '' : ' class="invSpacer"';
			lastTypeId = item.typeId;;
			s += '<td>'+(item.inSlot ? icon('marked.png') : 
						(item.slot ? icon('unmarked.png') : 
						(!this.everSeen[item.id]?'<span class="newItem">NEW</span>' : ''
						)))+'</td>';
			s += '<td class="right">'+this.inventorySelector.charAt(i)+'.'+'</td>';
			s += '<td'+spacer+'>'+icon(item.icon)+'</td>';
			s += '<td>'+(item._count>1 ? item._count+'x ' : '')+item.name+'</td>';
			//s += '<td>'+(item.slot?item.slot:'&nbsp;')+'</td>';
			s += '<td class="ctr">'+(item.isArmor||item.isShield?item.calcReduction(DamageType.CUTS,item.isShield):'')+'</td>';
			let damage = item.isWeapon ? item.damage : (item.effect && item.effect.op=='damage' ? item.effect.value : '');
			s += '<td class="right">'+damage+'</td>';
			let dtype = item.isWeapon ? item.damageType : (item.effect && item.effect.op=='damage' ? item.effect.damageType : '');
			s += '<td>'+dtype+'</td>';
			let bonus = (item.isWeapon && item.effect && item.effect.op=='damage' ? '+'+item.effect.value+' '+item.effect.damageType:'&nbsp;');
			if( item.isArmor && item.effect ) {
				bonus = item.effect.name;
			}
			s += '<td class="right">'+bonus+'</td>';
			s += '<td class="ctr">'+(item.rechargeTime?item.rechargeTime:'&nbsp;')+'</td>';
			s += '</tr>';

			$(s).appendTo(tBody).click( event => this.onItemChoose(event,item) );
		}
		if( !this.inventory.count ) {
			$("<tr><td colspan=4>Pick up some items by walking upon them.</td></tr>").appendTo(tBody);
		}
		this.userSawInventory = true;
		this.div.show();
	}
}

class ViewRange {
	constructor(worldOverlayAddFn,worldOverlayRemoveFn) {
		this.worldOverlayAddFn = worldOverlayAddFn;
		this.worldOverlayRemoveFn = worldOverlayRemoveFn;
		this.xOfs = 0;
		this.yOfs = 0;
		this.crosshairAnim = null;
		this.visibleFn = null;
		this.rangeLimit = 0;
		this.active = false;
	}
	clear() {
		this.xOfs = 0;
		this.yOfs = 0;
		this.worldOverlayRemoveFn( a => a.group=='guiCrosshair' );
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

	}
	prime(entity,rangeLimit,visibleFn) {
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
		}
	}

	drawRange(map,sx,sy,tx,ty) {
		let self = this;
		this.isShotClear = true;
		function test(x,y) {
			return map.tileTypeGet(x,y).mayFly;
		}
		function add(x,y,ok) {
			self.worldOverlayAddFn('guiCrosshair',x,y,StickerList[ok?'crosshairYes':'crosshairNo']);	
			self.isShotClear = self.isShotClear && ok;
		}
		shootRange(sx,sy,tx,ty,test,add);
	}

	render(observer) {
		this.worldOverlayRemoveFn( a=>a.group=='guiCrosshair' );
		this.active = this.visibleFn && this.visibleFn();
		if( this.active ) {
			//console.log("crosshair at "+(observer.x+this.xOfs)+','+(observer.y+this.yOfs));
			this.drawRange(observer.map,observer.x,observer.y,observer.x+this.xOfs,observer.y+this.yOfs);
		}
	}
}

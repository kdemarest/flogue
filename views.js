function getCastableSpellList(entity) {
	return new Finder(entity.inventory).filter( item=>item.isSpell && item.effect && item.effect.op && !item.effect.isBlank );
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

class ViewInfo {
	constructor(infoDivId) {
		this.infoDivId = infoDivId;
	}
	render(entity) {
		function test(t,text) {
			if( t ) {
				conditionList.push(text);
			}
		}
		$('#'+this.infoDivId).empty().removeClass('healthWarn healthCritical');
		let s = "";
		s += "Health: "+entity.health+" / "+entity.healthMax+"\n";
		s += "Armor: "+entity.calcArmor()+"%\n";
		let weapon = entity.calcWeapon();
		s += "Damage: "+Math.floor(weapon.damage)+" "+weapon.damageType+[' (slow)','',' (quick)'][weapon.quick]+"\n";
		let conditionList = [];
		test(entity.invisible,'invis');
		test(entity.speed<1,'slow');
		test(entity.speed>1,'fast');
		test(entity.travelMode!=='walk',entity.travelMode);
		test(entity.senseBlind,'blind');
		test(entity.senseXray,'xray');
		test(entity.senseItems,'greed');
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
		$('#'+this.infoDivId).append(s);
		let healthRatio = entity.health/entity.healthMax;
		if( healthRatio < 0.15 ) {
			$('#'+this.infoDivId).addClass('healthCritical');
		}
		else
		if( healthRatio < 0.30 ) {
			$('#'+this.infoDivId).addClass('healthWarn');
		}

	}

}

class ViewStatus {
	constructor(statusDivId) {
		this.statusDivId = statusDivId;
		this.slotList = [];
		this.lastHealth = [];
	}

	render(observer,entityList) {
		let SLOT_COUNT = 10;

		let f = new Finder(entityList,observer).isAlive().exclude(observer).prepend(observer).canPerceiveEntity().byDistanceFromMe().keepTop(SLOT_COUNT);
		Array.filterInPlace( this.slotList, slot => f.getId(slot) );
		f.process( entity => {
			if( !this.slotList.includes(entity.id) ) {
				this.slotList.push(entity.id);
			}
		});

		for( let i=0 ; i<SLOT_COUNT ; ++i ) {
			if( i >= this.slotList.length ) {
				$('#health'+i).hide();
				continue;
			}
			let entity = f.getId(this.slotList[i]);
			let newValue = entity.health;
			let lastValue = this.lastHealth[entity.id]!==undefined ? this.lastHealth[entity.id] : newValue;
			$('#health'+i).show();
			showHealthBar('#health'+i,newValue,lastValue,entity.healthMax,entity.name);
			this.lastHealth[entity.id] = newValue;
		}
	}
}

class ViewMiniMap {
	constructor(divId,captionDivId,imageRepo) {
		this.divId = divId;
		this.captionDivId = captionDivId;
		this.caption = '';
		this.mapMemory = null;
		this.imageRepo = imageRepo;
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
			.append('<canvas id="'+this.divId+'Canvas'+'" height="'+dim*this.scale+'" width="'+dim*this.scale+'"></canvas>');
	}
	setArea(area) {
		this.caption = area.id;
		this.mapMemory = area.mapMemory;
		this.create(area);
	}
	render(observer) { 
		$('#'+this.captionDivId).html(this.caption);

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
					c.drawImage(resource.texture.baseTexture.source,x*self.scale,y*self.scale,scale,scale);
				}
				else {
					console.log( "Unable to find image for "+entity.typeId+" img "+imgPath );
				}
			}
		}

		let unvisitedMap = StickerList.unvisitedMap;
		let c = canvas.getContext("2d");
		draw(unvisitedMap,0,0,200);

		let mapMemory = this.mapMemory;
		let drawLate = [];
		for( let y=0 ; y<this.yLen ; ++y ) {
			for( let x=0 ; x<this.xLen ; ++x ) {
				if( !mapMemory[y] || !mapMemory[y][x] ) {
					draw(unvisitedMap,x,y,this.scale);
					continue;
				}
				let entity = mapMemory[y][x];
				if( x==observer.x && y==observer.y ) {
					entity = StickerList.observerProxy;
					drawLate.push({entity:entity,x:x,y:y,scale:this.scale*4});
				}
				else
				if( entity.isWall && !entity.mineId ) {
					entity = StickerList.wallProxy;
				}
				else
				if( entity.gateDir !== undefined ) {
					entity = StickerList[entity.gateDir>0 ? 'gateDownProxy' : 'gateProxy'];
					drawLate.push({entity:entity,x:x,y:y,scale:this.scale*3});
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
	constructor(inventoryDivId,imageRepo) {
		this.inventoryDivId = inventoryDivId;
		this.imageRepo = imageRepo;
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

		this.inventory = this.inventoryFn();
		if( this.allowFilter && this.filterId ) {
			let filterId = this.filterId;
			this.inventory.filter( item => item.typeId==filterId );
		}

		let list = this.inventory.all.sort( function(a,b) { 
			let as = order(a.typeId)+' '+a.name;
			let bs = order(b.typeId)+' '+b.name;
			if( as < bs ) return -1;
			if( as > bs ) return 1;
			return 0;
		});

		function icon(file) {
			return '<img src="tiles/gui/icons/'+file+'">';
		}

		let self = this;
		$(this.div).empty();

		let cat = $('<div class="invCategories"></div>').appendTo(this.div);
		if( this.allowFilter ) {
			let ItemFilterOrder = [''].concat(ItemSortOrder);
			ItemFilterOrder.map( typeId => {
				let typeIcon =  $(icon( typeId=='' ? 'all.png' : ItemTypeList[typeId].icon ));
				typeIcon.appendTo(this.div)
				if( self.allowFilter && self.filterId == typeId ) {
					typeIcon.addClass('iconLit');
				}
				typeIcon.click( function() {
					$('.invCategories img').removeClass('iconLit');
					self.filterId = typeId;
					self.render(observer);
				})
				.appendTo(cat);
			});
		}

		let table = $( '<table class="inv"></table>' ).appendTo(this.div);
		let tHead = $('<thead><tr><td></td><td></td><td class="right"></td><td>Description</td><td>Armor</td><td colspan="2">Damage</td><td class="right">Bonus</td><td class="right">Chg</td></tr></thead>' ).appendTo(table);
		let tBody = $('<tbody></tbody>').appendTo(table);
		for( let i=0 ; i<list.length ; ++i ) {
			let item = list[i];
			let s = '';
			s += '<tr>';
			s += '<td>'+(item.inSlot ? icon('marked.png') : 
						(item.slot ? icon('unmarked.png') : 
						(!this.everSeen[item.id]?'<span class="newItem">NEW</span>' : ''
						)))+'</td>';
			s += '<td class="right">'+this.inventorySelector.charAt(i)+'.'+'</td>';
			s += '<td>'+icon(item.icon)+'</td>';
			s += '<td>'+item.name+'</td>';
			//s += '<td>'+(item.slot?item.slot:'&nbsp;')+'</td>';
			s += '<td class="ctr">'+(item.isArmor?item.calcArmor():'')+'</td>';
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

			$(s).appendTo(tBody).click( function(event) {
				event.commandItem = item;
				onUserEvent(event);
			});;
		}
		if( !list.length ) {
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
			let f = entity.findAliveOthers().canPerceiveEntity().canTargetEntity().isId(entity.lastAttackTargetId).nearMe(this.rangeLimit);
			if( !f.first ) {
				f = entity.findAliveOthers().isNotMyFriend().canPerceiveEntity().canTargetEntity().byDistanceFromMe().nearMe(this.rangeLimit);
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
		function test(x,y) {
			return map.tileTypeGet(x,y).mayFly;
		}
		function add(x,y,ok) {
			self.worldOverlayAddFn('guiCrosshair',x,y,StickerList[ok?'crosshairYes':'crosshairNo']);	
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

function castConvert(cmd,observer,index) {
	let spellList = getCastableSpellList(observer);
	cmd.command = Command.CAST;
	cmd.commandItem = spellList.all[index];
}

//command
//- immediatelyConvertsToAnotherCommand (cast1 through 5)
//- needsItem (determine inventory)
//- converts based on what was picked [eg Inventory command]
//- needsTarget (determine range)
//- passesTimeOnExecution

let CmdTable = {};
CmdTable[Command.INVENTORY] = {
	needsItem: true,
	itemAllowFilter: true,
	itemFilter: observer => () => new Finder(observer.inventory),
	convertOnItemChosen: (cmd) => {
		let command = cmd.command;
		let item = cmd.commandItem;
		if( item.isPotion ) {
			return item.effect && item.effect.isHarm ? Command.THROW : Command.QUAFF;
		}
		if( item.isGem ) {
			return Command.GAZE;
		}
		if( item.isSpell ) {
			return Command.CAST;
		}
		if( item.isCorpse ) {
			return Command.LOOT;
		}
		if( item.slot ) {
			cmd.retain = command;
			return Command.USE;
		}
		return command;
	},
	criteriaToExecute: (cmd,observer) => {
		tell(mSubject,cmd.commandItem,' does nothing. Maybe it has another use?');
		return false;
	},
	passesTimeOnExecution: false
};
CmdTable[Command.QUAFF] = {
	needsItem: true,
	itemFilter: observer => () => new Finder(observer.inventory).isTypeId("potion"),
	criteriaToExecute: (cmd,observer) => cmd.commandItem.effect,
	passesTimeOnExecution: true
};
CmdTable[Command.CAST] = {
	needsItem: true,
	itemFilter: observer => () => getCastableSpellList(observer),
	needsTarget: true,
	targetRange: (item) => item.range || 7,
	criteriaToExecute: (cmd,observer) => {
		if( !cmd.commandItem.isRecharged() ) {
			tell(mSubject|mPronoun|mPossessive,observer,' ',mObject,cmd.commandItem,' is still charging.');
			return false;
		}
		return true;
	},
	passesTimeOnExecution: true
};
CmdTable[Command.THROW] = {
	needsItem: true,
	itemFilter: observer => () => new Finder(observer.inventory).filter( item => item.mayThrow ),
	needsTarget: true,
	targetRange: (item) => item.range || 7,
	passesTimeOnExecution: true
};
CmdTable[Command.DROP] = {
	needsItem: true,
	itemFilter: observer => () =>  new Finder(observer.inventory),
	passesTimeOnExecution: true
};
CmdTable[Command.DEBUGKILL] = {
	needsTarget: true,
	targetRange: (item) => 11,
	passesTimeOnExecution: true
};
CmdTable[Command.USE] = {
	needsItem: true,
	itemFilter: observer => () =>  new Finder(observer.inventory).filter( item => item.slot ),
	passesTimeOnExecution: false
};
CmdTable[Command.GAZE] = {
	needsItem: true,
	itemFilter: observer => () =>  new Finder(observer.inventory).filter( item => item.isGem ),
	criteriaToExecute: (cmd,observer) => cmd.commandItem.effect,
	passesTimeOnExecution: false
};
CmdTable[Command.CAST1] = {
	convertToCommand: (cmd,observer) => castConvert(cmd,observer,0)
}
CmdTable[Command.CAST2] = {
	convertToCommand: (cmd,observer) => castConvert(cmd,observer,1)
}
CmdTable[Command.CAST3] = {
	convertToCommand: (cmd,observer) => castConvert(cmd,observer,2)
}
CmdTable[Command.CAST4] = {
	convertToCommand: (cmd,observer) => castConvert(cmd,observer,3)
}
CmdTable[Command.CAST5] = {
	convertToCommand: (cmd,observer) => castConvert(cmd,observer,4)
}

class Cmd {
	constructor(onCancel,onEnact) {
		this.onCancel = onCancel;
		this.onEnact = onEnact;
		this.clear();
	}
	clear() {
		this.command = Command.NONE;
		this.commandItem = null;
		this.commandTarget = null;
		this.retain = null;
	}
	cancelItem() {
		this.commandItem = null;
		this.commandTarget = null;
		return false;
	}
	cancel() {
		this.onCancel();
		this.clear();
		return false;
	}
	enact() {
		let passesTime = this.passesTimeOnExecution
		let retain = this.retain;
		this.onEnact(this);
		this.clear();
		if( retain ) { this.command = retain; }
		return passesTime;
	}
	get ct() 					{ return CmdTable[this.command]; }
	get convertToCommand() 		{ return this.ct && this.ct.convertToCommand; }
	get needsItem()				{ return this.ct && this.ct.needsItem; }
	get itemAllowFilter()		{ return this.ct && this.ct.itemAllowFilter; }
	get itemFilter()			{ return this.ct && this.ct.itemFilter; }
	get convertOnItemChosen()	{ return this.ct && this.ct.convertOnItemChosen; }
	get needsTarget() 			{ return this.ct && this.ct.needsTarget; }
	get targetRange() 			{ return this.ct && this.ct.targetRange; }
	get criteriaToExecute()		{ return this.ct && this.ct.criteriaToExecute; }
	get passesTimeOnExecution() { return this.ct ? this.ct.passesTimeOnExecution : true; }
}

let keyENTER = "Enter";
let keyESCAPE = "Escape";

class UserCommandHandler {
	constructor(keyToCommand,viewInventory,viewRange) {
		this.viewInventory = viewInventory;
		this.viewRange = viewRange;
		this.keyToCommand = keyToCommand;
		this.cmd = new Cmd(
			() => {
			},
			(c) => {
				this.observer.command = c.command;
				this.observer.commandItem = c.commandItem;;
				this.observer.commandTarget = c.commandTarget;
			}
		);
	}
	pickTarget(dirCommand,observer) {
		if( dirCommand == Command.CANCEL ) {
			return this.cmd.cancel();
		}
		let dir = commandToDirection(dirCommand);
		if( dir !== false ) {
			this.viewRange.move(DirectionAdd[dir].x,DirectionAdd[dir].y);
			return false;
		}
		if( dirCommand == Command.EXECUTE ) {
			let target = new Finder(observer.entityList).at(observer.x+this.viewRange.xOfs,observer.y+this.viewRange.yOfs);
			if( !target.count && !this.cmd.commandItem.mayTargetPosition && (!this.cmd.commandItem.effect || !this.cmd.commandItem.effect.mayTargetPosition) ) {
				return this.cmd.cancel();
			}
			let x = observer.x+this.viewRange.xOfs;
			let y = observer.y+this.viewRange.yOfs;
			this.cmd.commandTarget = target.first || adhoc(observer.map.tileTypeGet(x,y),observer.map,x,y);
			return this.cmd.enact();
		}
	}

	evalCommand(observer,event) {
		this.observer = observer;		// hack!!
		let cmd = this.cmd;

		if( cmd.command == Command.NONE ) {
			let command = this.keyToCommand[event.key] || Command.NONE;
			if( !CmdTable[command] ) {
				observer.command = command;
				observer.commandItem = null;
				observer.commandTarget = null;
				return command !== Command.NONE;
			}
			cmd.command = command;
			if( cmd.convertToCommand ) {
				cmd.convertToCommand(cmd,observer);
			}
		}

		if( cmd.needsItem && !cmd.commandItem ) {
			let keyEval = this.viewInventory.prime( cmd.itemFilter(observer), cmd.itemAllowFilter, () => cmd.needsItem && !cmd.commandItem );
			if( keyEval ) {
				if( this.keyToCommand[event.key] == Command.CANCEL ) {
					return cmd.cancel();
				}
				cmd.commandItem = this.viewInventory.getItemByKey(event.key);
			}
		}

		if( cmd.needsItem && !cmd.commandItem && event.commandItem ) {
			cmd.commandItem = event.commandItem;
			delete event.commandItem;
		}

		if( cmd.commandItem && cmd.convertOnItemChosen ) {
			cmd.command = cmd.convertOnItemChosen(cmd);
		}

		if( cmd.commandItem && cmd.criteriaToExecute ) {
			if( !cmd.criteriaToExecute(cmd,observer) ) {
				return cmd.cancelItem();
			}
		}

		if( cmd.commandItem && !cmd.needsTarget ) {
			return cmd.enact();
		}

		if( cmd.needsTarget && !cmd.commandTarget && (!cmd.needsItem || cmd.commandItem) ) {
			this.viewRange.prime(
				observer,
				cmd.targetRange(cmd.commandItem),
				() => cmd.needsTarget && !cmd.commandTarget && (!cmd.needsItem || cmd.commandItem) );
			let result = this.pickTarget( this.keyToCommand[event.key], observer );
			if( result !== undefined ) {
				return result;
			}
		}

		return false;
	}
}

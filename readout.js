// READOUT

class ViewSpells {
	constructor(spellDivId) {
		this.MAX_SLOTS = 5;
		this.spellDivId = spellDivId;
	}
	getCastableSpellList(entity) {
		return new ItemFinder(entity.inventory).filter( item=>item.isSpell && item.effect && !item.isBlank );
	}
	render(observer) {
		$('#'+this.spellDivId).empty();
		let spellList = this.getCastableSpellList(observer);
		for( let i=0 ; i<spellList.all.length && i<this.MAX_SLOTS ; ++i ) {
			let spell = spellList.all[i];
			let text = 'F'+(i+1)+' '+spell.effect.name+'\n';
			let lit = this.commandItem == spell && spell.isRecharged();
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
		$('#'+this.infoDivId).empty();
		let s = "";
		s += "Health: "+entity.health+" / "+entity.healthMax+"\n";
		s += "Armor: "+entity.calcArmor()+"%\n";
		let weapon,damage,damageType;
		[weapon,damage,damageType] = entity.calcWeapon();
		s += "Damage: "+Math.floor(damage)+" "+damageType+"\n";
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

		let f = new EntityFinder(observer,entityList).isAlive().prepend(observer).canPerceiveEntity().byDistanceFromMe().keepTop(SLOT_COUNT);
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

class ViewInventory {
	constructor(inventoryDivId,imageRepo) {
		this.inventoryDivId = inventoryDivId;
		this.imageRepo = imageRepo;
		this.isOpen = false;
		this.inventory = null;
		this.inventoryFn = null;
		this.inventorySelector = '123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		this.everSeen = {};
	}
	getItemByKey(keyPressed) {
		let n = this.inventorySelector.indexOf(keyPressed);
		if( n>=0 && n<this.inventory.count ) {
			return this.inventory.all[n];
		}
		return null;
	}
	show(inventoryFn) {
		this.inventoryFn = inventoryFn;
		this.isOpen = true;
		this.render();
	}
	hide() {
		if( !this.isOpen ) {
			return;
		}
		for( let i=0 ; i<this.inventory.all.length ; ++i ) {
			this.everSeen[this.inventory.all[i].id]=true;
		}

		$('#'+this.inventoryDivId).hide();
		this.isOpen = false;
	}
	render() {
		function order(typeId) {
			return String.fromCharCode(64+ItemSortOrder.indexOf(typeId));
		}
		if( !this.isOpen ) {
			return;
		}

		this.inventory = this.inventoryFn();
		let list = this.inventory.all.sort( function(a,b) { 
			let as = order(a.typeId)+' '+a.name;
			let bs = order(b.typeId)+' '+b.name;
			if( as < bs ) return -1;
			if( as > bs ) return 1;
			return 0;
		});

		let s = '';
		s += '<table class="inv">';
		s += '<thead>';
		s += '<tr><td></td><td class="right"></td><td>Description</td><td>Slot</td><td class="right">Armor</td><td colspan="2" class="ctr">Damage</td><td class="right">Bonus</td><td class="right">Recharge</td></tr>';
		s += '</thead>';
		s += '<tbody>';
		for( let i=0 ; i<list.length ; ++i ) {
			let item = list[i];
			s += '<tr>';
			s += '<td>'+(item.inSlot ? '&nbsp;*&nbsp;' : (!this.everSeen[item.id]?'<span class="newItem">NEW</span>':'&nbsp;&nbsp;&nbsp;'))+'</td>';
			s += '<td class="right">'+this.inventorySelector.charAt(i)+')'+'</td>';
			s += '<td>'+item.name+'</td>';
			s += '<td>'+(item.slot?item.slot:'&nbsp;')+'</td>';
			s += '<td class="ctr">'+(item.isArmor?item.calcArmor():'&nbsp;')+'</td>';
			let damage = item.isWeapon ? item.damage : (item.effect && item.effect.op=='damage' ? item.effect.value : '&nbsp;');
			s += '<td class="right">'+damage+'</td>';
			let dtype = item.isWeapon ? item.damageType : (item.effect && item.effect.op=='damage' ? item.effect.damageType : '&nbsp;');
			s += '<td>'+dtype+'</td>';
			let bonus = (item.isWeapon && item.effect && item.effect.op=='damage' ? '+'+item.effect.value+' '+item.effect.damageType:'&nbsp;');
			if( item.isArmor && item.effect ) {
				bonus = item.effect.name;
			}
			s += '<td class="right">'+bonus+'</td>';
			s += '<td class="ctr">'+(item.rechargeTime?item.rechargeTime:'&nbsp;')+'</td>';
			s += '</tr>';
		}
		s += '</tbody>';
		s += '</table>';
		if( !s ) {
			s += "<tr><td colspan=4>Pick up some items by walking upon them.</td></tr>";
		}
		$('#'+this.inventoryDivId).show().html(s);
	}
}

class ViewRange {
	constructor(worldOverlayAddFn,worldOverlayRemoveFn) {
		this.worldOverlayAddFn = worldOverlayAddFn;
		this.worldOverlayRemoveFn = worldOverlayRemoveFn;
		this.xOfs = 0;
		this.yOfs = 0;
		this.crosshairAnim = null;
		this.pickingTargetFn = null;
	}
	clear() {
		this.xOfs = 0;
		this.yOfs = 0;
		this.worldOverlayRemoveFn( a => a.group=='guiCrosshair' );
	}
	move(xAdd,yAdd) {
		this.xOfs += xAdd;
		this.yOfs += yAdd;

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
		if( this.pickingTargetFn() ) {
			//console.log("crosshair at "+(observer.x+this.xOfs)+','+(observer.y+this.yOfs));
			this.worldOverlayRemoveFn( a=>a.group=='guiCrosshair' );
			this.drawRange(observer.map,observer.x,observer.y,observer.x+this.xOfs,observer.y+this.yOfs);
		}
	}
}

class UserCommandHandler {
	constructor(viewInventory,viewRange,viewSpells) {
		this.command = Command.NONE;
		this.commandItem = null;
		this.commandTarget = null;
		this.viewInventory = viewInventory;
		this.viewRange = viewRange;
		this.viewSpells = viewSpells;
		let self = this;
		this.viewRange.pickingTargetFn = function() { return self.pickingTarget(); }
	}
	commandClosesInventory(command) {
		return !CommandLeavesInventoryOpen.includes(command);
	}
	commandPassesTime(command) {
		return !CommandIsInstant.includes(command);
	}
	clearCommand(retain) {
		this.command = retain || Command.NONE;
		this.commandItem = null;
		this.commandTarget = null;
		this.viewRange.clear();
		return false;
	}
	enactCommand(observer,retain) {
		observer.command = this.command;
		observer.commandItem = this.commandItem;;
		observer.commandTarget = this.commandTarget;
		if( this.commandClosesInventory(observer.command) ) {
			this.viewInventory.hide();
			this.clearCommand();
		}
		else {
			this.clearCommand(retain);
		}
		return this.commandPassesTime(observer.command);
	}
	pickingTarget() {
		if( this.command === Command.DEBUGKILL ) {
			return true;
		}
		return (this.command == Command.CAST || this.command == Command.THROW ) && this.commandItem;
	}
	evalCommand(observer,event,command) {
		let keyCode = event.keyCode;
		let keyENTER = 13;
		let keyESCAPE = 27;
		let keyONE = 49;

		let dir = commandToDirection(command);

		//
		// PICK A TARGET
		//

		if( this.pickingTarget() ) {
			observer.command = Command.NONE;
			if( this.commandItem && !this.commandItem.isRecharged() ) {
				tell(mSubject|mPronoun|mPossessive,observer,' ',mObject,this.commandItem,' is still charging.');
				this.clearCommand();
				return false;
			}
			let cancel = false;
			if( keyCode == keyESCAPE || this.command == command ) {
				cancel = true;
			}
			else
			if( dir !== false ) {
				this.viewRange.move(DirectionAdd[dir].x,DirectionAdd[dir].y);
				return false;
			}
			else
			if( keyCode == keyENTER ) {
				let target = new Finder(observer.entityList).at(observer.x+this.viewRange.xOfs,observer.y+this.viewRange.yOfs);
				if( !target.count && !this.mayTargetPositon && (!this.commandItem.effect || !this.commandItem.effect.mayTargetPosition)) {
					cancel = true;
				}
				else {
					let x = observer.x+this.viewRange.xOfs;
					let y = observer.y+this.viewRange.yOfs;
					this.commandTarget = target.first || {x:x,y:y,isPosition:true,name:observer.map.tileTypeGet(x,y).name};
					return this.enactCommand(observer);
				}
			}
			if( cancel ) {
				return this.clearCommand();
			}
		}

		//
		// CHOOSE FROM INVENTORY
		//

		if( this.viewInventory.isOpen ) {
			observer.command = Command.NONE;
			if( keyCode == keyESCAPE || this.command == command ) {
				this.viewInventory.hide();
				return this.clearCommand();
			}
			let keyPressed = String.fromCharCode(keyCode);
			if( !event.shiftKey ) {
				keyPressed = keyPressed.toLowerCase();
			}
			let item = this.viewInventory.getItemByKey(keyPressed);
			if( item ) {
				this.commandItem = item;
				if( this.command == Command.DROP ) {
					return this.enactCommand(observer);
				}
				if( this.command == Command.INVENTORY && item.isPotion ) {
					this.command = item.effect && item.effect.isHarm ? Command.THROW : Command.QUAFF;
				}
				if( this.command == Command.INVENTORY && item.isGem && item.effect ) {
					this.command = Command.GAZE;
					return this.enactCommand(observer);
				}
				if( this.command == Command.QUAFF ) {
					return this.enactCommand(observer);
				}
				if( this.command == Command.CAST && !this.commandItem.isRecharged() ) {
					tell(mSubject|mPronoun|mPossessive,observer,' ',mObject,this.commandItem,' is still charging.');
					this.clearCommand(Command.CAST);
					return false;
				}
				if( this.command == Command.INVENTORY && item.isSpell ) {
					this.command = Command.CAST;
					this.viewInventory.hide();
					return false;
				}
				if( this.command == Command.INVENTORY ) {
					if( this.commandItem.autoCommand ) {
						this.command = this.commandItem.autoCommand;
						return this.enactCommand(observer,Command.INVENTORY);
					}
				}
				// for throw and any other that picks items.
				if( this.commandClosesInventory(this.command) ) {
					this.viewInventory.hide();
				}
			}
			return false;
		}
		if( command == Command.INVENTORY ) {
			observer.command = Command.NONE;
			this.command = Command.INVENTORY;
			this.viewInventory.show( ()=>new ItemFinder(observer.inventory) );
			return false;
		}
		if( command == Command.QUAFF ) {
			observer.command = Command.NONE;
			this.command = Command.QUAFF;
			this.viewInventory.show( ()=>new ItemFinder(observer.inventory).isTypeId("potion") );
			return false;
		}
		if( command == Command.THROW ) {
			observer.command = Command.NONE;
			this.command = Command.THROW;
			this.viewInventory.show( ()=>new ItemFinder(observer.inventory).filter( item => item.mayThrow ) );
			return false;
		}
		if( command == Command.DEBUGKILL ) {
			observer.command = Command.NONE;
			this.command = Command.DEBUGKILL;
			return false;
		}
		if( command == Command.DROP ) {
			observer.command = Command.NONE;
			this.command = Command.DROP;
			this.viewInventory.show( ()=>new ItemFinder(observer.inventory) );
			return false;
		}
		if( command == Command.CAST ) {
			observer.command = Command.NONE;
			this.command = Command.CAST;
			this.viewInventory.show( ()=>this.viewSpells.getCastableSpellList(observer) );
			return false;
		}
		let castArray = [Command.CAST1,Command.CAST2,Command.CAST3,Command.CAST4,Command.CAST5];
		if( castArray.includes(command) ) {
			observer.command = Command.NONE;
			let spellList = this.viewSpells.getCastableSpellList(observer);
			let index = castArray.indexOf(command);
			if( !spellList.all[index] ) {
				return false;
			}
			this.command = Command.CAST;
			this.commandItem = spellList.all[index];
			if( !this.commandItem.isRecharged() ) {
				tell(mSubject|mPronoun|mPossessive,observer,' ',mObject,this.commandItem,' is still charging.');
				this.clearCommand();
				return false;
			}

			return false;
		}
		return true;
	}
}

// READOUT

class ViewSpells {
	constructor(spellDivId) {
		this.spellDivId = spellDivId;
	}
	render(observer) {
		$('#'+this.spellDivId).empty();
		let spellList = new ItemFinder(observer.inventory).isTypeId("spell");
		for( let i=0 ; i<spellList.all.length ; ++i ) {
			let text = 'F'+(i+1)+' '+spellList.all[i].effect.name+'\n';
			let lit = this.commandItem == spellList.all[i];
			$('#'+this.spellDivId).append('<div class="spell'+(lit?' lit':'')+'">'+text+'</div>');
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
		s += "Armor: "+Math.floor(entity.calcArmor()*100)+"%\n";
		let weapon,damage,damageType;
		[weapon,damage,damageType] = entity.calcWeapon();
		s += "Damage: "+Math.floor(damage)+" "+damageType+"\n";
		let conditionList = [];
		test(entity.invisible,'invis');
		test(entity.speed<1,'slow');
		test(entity.speed>1,'fast');
		test(entity.travelMode!=='walk',entity.travelMode);
		test(entity.blind,'blind');
		test(entity.regenerate>=entity.type.regenerate,'regen '+Math.floor(entity.regenerate*100)+'%');
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
		this.inventorySelector = '123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	}
	getItemByKey(keyPressed) {
		let n = this.inventorySelector.indexOf(keyPressed);
		if( n>=0 && n<this.inventory.count ) {
			return this.inventory.all[n];
		}
		return null;
	}
	show(f) {
		function order(typeId) {
			return String.fromCharCode(64+ItemSortOrder.indexOf(typeId));
		}
		this.inventory = f;
		f.all.sort( function(a,b) { 
			let as = order(a.typeId)+' '+a.name;
			let bs = order(b.typeId)+' '+b.name;
			if( as < bs ) return -1;
			if( as > bs ) return 1;
			return 0;
		});
		let s = '';
		for( let i=0 ; i<f.all.length ; ++i ) {
			let item = f.all[i];
			s += (item.inSlot ? '*' : ' ')+String.padLeft(this.inventorySelector.charAt(i),2,' ')+'. '+item.name+(item.inSlot?' ('+item.inSlot+')':'')+'\n';
		}
		if( !s ) {
			s += "Pick up some items by walking upon them.";
		}
		$('#'+this.inventoryDivId).show().html(s);
		this.isOpen = true;
	}
	hide() {
		$('#'+this.inventoryDivId).hide();
		this.isOpen = false;
	}
	render() {
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
	constructor(viewInventory,viewRange) {
		this.command = Command.NONE;
		this.commandItem = null;
		this.commandTarget = null;
		this.viewInventory = viewInventory;
		this.viewRange = viewRange;
		let self = this;
		this.viewRange.pickingTargetFn = function() { return self.pickingTarget(); }
	}
	clearCommand() {
		this.command = Command.NONE;
		this.commandItem = null;
		this.commandTarget = null;
		this.viewRange.clear();
		return false;
	}
	enactCommand(observer) {
		observer.command = this.command;
		observer.commandItem = this.commandItem;;
		observer.commandTarget = this.commandTarget;
		this.clearCommand();
		return true;
	}
	pickingTarget() {
		return (this.command == Command.CAST || this.command == Command.THROW) && this.commandItem;
	}
	evalCommand(observer,event,command) {
		let keyCode = event.keyCode;
		let keyENTER = 13;
		let keyESCAPE = 27;
		let keyONE = 49;

		let dir = commandToDirection(command);

		if( this.pickingTarget() ) {
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
				if( !target.count && !this.commandItem.effect.mayTargetPosition) {
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


		if( this.viewInventory.isOpen ) {
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
				this.viewInventory.hide();
				this.commandItem = item;
				if( this.command == Command.QUAFF ) {
					return this.enactCommand(observer);
				}
				if( this.command == Command.CAST && !this.commandItem.isRecharged() ) {
					tell(mSubject|mPronoun|mPossessive,observer,' ',mObject,this.commandItem,' is still charging.');
					this.clearCommand();
					return false;
				}

				if( this.command == Command.INVENTORY ) {
					if( this.commandItem.autoCommand ) {
						this.command = this.commandItem.autoCommand;
						return this.enactCommand(observer);
					}
				}
			}
			return false;
		}
		if( command == Command.INVENTORY ) {
			this.command = Command.INVENTORY;
			this.viewInventory.show(new ItemFinder(observer.inventory))
			return false;
		}
		if( command == Command.QUAFF ) {
			this.command = Command.QUAFF;
			this.viewInventory.show(new ItemFinder(observer.inventory).isTypeId("potion"));
			return false;
		}
		if( command == Command.THROW ) {
			this.command = Command.THROW;
			this.viewInventory.show(new ItemFinder(observer.inventory).filter( item => item.mayThrow ));
			return false;
		}
		if( command == Command.CAST ) {
			this.command = Command.CAST;
			this.viewInventory.show(new ItemFinder(observer.inventory).isTypeId("spell"));
			return false;
		}
		let castArray = [Command.CAST1,Command.CAST2,Command.CAST3,Command.CAST4,Command.CAST5];
		if( castArray.includes(command) ) {
			let spellList = new ItemFinder(observer.inventory).isTypeId("spell");
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

// READOUT

class Readout {
	constructor(spellDivId,inventoryDivId,worldOverlayAddFn,worldOverlayRemoveFn) {
		this.spellDivId = spellDivId;
		this.inventoryDivId = inventoryDivId;
		this.worldOverlayAddFn = worldOverlayAddFn;
		this.worldOverlayRemoveFn = worldOverlayRemoveFn;
		this.lastHealth = [];
		this.slotList = [];
		this.inventoryOpen = false;
		this.inventory = null;
		this.command = Command.NONE;
		this.commandItem = null;
		this.commandTarget = null;
		this.xOfs = 0;
		this.yOfs = 0;
		this.crosshairAnim = null;
		this.inventorySelector = '123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	}
	renderEntityStatus(observer,entityList) {
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
	renderSpells(observer) {
		$('#'+this.spellDivId).empty();
		let spellList = new ItemFinder(observer.inventory).isTypeId("spell");
		for( let i=0 ; i<spellList.all.length ; ++i ) {
			let text = 'F'+(i+1)+' '+spellList.all[i].effect.name+'\n';
			let lit = this.commandItem == spellList.all[i];
			$('#'+this.spellDivId).append('<div class="spell'+(lit?' lit':'')+'">'+text+'</div>');
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

	render(observer,entityList) {
		this.renderEntityStatus(observer,entityList);
		this.renderSpells(observer);
		if( this.pickingTarget() ) {
			console.log("crosshair at "+(observer.x+this.xOfs)+','+(observer.y+this.yOfs));
			this.worldOverlayRemoveFn( a=>a.group=='guiCrosshair' );
			this.drawRange(observer.map,observer.x,observer.y,observer.x+this.xOfs,observer.y+this.yOfs);
		}
	}
	pickingTarget() {
		return (this.command == Command.CAST || this.command == Command.THROW) && this.commandItem;
	}
	showInventory(f) {
		this.inventory = f;
		let s = '';
		for( let i=0 ; i<f.all.length ; ++i ) {
			s += this.inventorySelector.charAt(i)+'. '+f.all[i].name+'\n';
		}
		if( !s ) {
			s += "Pick up some items by walking upon them.";
		}
		$('#'+this.inventoryDivId).show().html(s);
		this.inventoryOpen = true;
	}
	hideInventory() {
		$('#inventory').hide();
		this.inventoryOpen = false;
	}
	clearCommand() {
		this.command = Command.NONE;
		this.commandItem = null;
		this.commandTarget = null;
		this.xOfs = 0;
		this.yOfs = 0;
		this.worldOverlayRemoveFn( a => a.group=='guiCrosshair' );
		return false;
	}
	enactCommand(observer) {
		observer.command = this.command;
		observer.commandItem = this.commandItem;;
		observer.commandTarget = this.commandTarget;
		this.clearCommand();
		return true;
	}
	evalCommand(observer,keyCode,command) {
		let keyENTER = 13;
		let keyESCAPE = 27;
		let keyONE = 49;

		let dir = commandToDirection(command);

		let pickingTarget = this.pickingTarget();

		if( pickingTarget ) {
			let cancel = false;
			if( keyCode == keyESCAPE || this.command == command ) {
				cancel = true;
			}
			else
			if( dir !== false ) {
				this.xOfs += DirectionAdd[dir].x;
				this.yOfs += DirectionAdd[dir].y;
				return false;
			}
			else
			if( keyCode == keyENTER ) {
				let target = new Finder(observer.entityList).at(observer.x+this.xOfs,observer.y+this.yOfs);
				if( !target.count && !this.commandItem.effect.mayTargetPosition) {
					cancel = true;
				}
				else {
					this.commandTarget = target.first || {x:observer.x+this.xOfs,y:observer.y+this.yOfs,isPosition:true};
					return this.enactCommand(observer);
				}
			}
			if( cancel ) {
				return this.clearCommand();
			}
		}


		if( this.inventoryOpen ) {
			if( keyCode == keyESCAPE || this.command == command ) {
				this.hideInventory();
				return this.clearCommand();
			}
			let n = this.inventorySelector.indexOf(String.fromCharCode(keyCode));
			if( n>=0 && n<this.inventory.count ) {
				this.hideInventory();
				this.commandItem = this.inventory.all[n];
				if( this.command == Command.QUAFF ) {
					return this.enactCommand(observer);
				}
			}
			return false;
		}
		if( command == Command.INVENTORY ) {
			this.command = Command.INVENTORY;
			this.showInventory(new ItemFinder(observer.inventory))
			return false;
		}
		if( command == Command.QUAFF ) {
			this.command = Command.QUAFF;
			this.showInventory(new ItemFinder(observer.inventory).isTypeId("potion"));
			return false;
		}
		if( command == Command.THROW ) {
			this.command = Command.THROW;
			this.showInventory(new ItemFinder(observer.inventory).filter( item => item.mayThrow ));
			return false;
		}
		if( command == Command.CAST ) {
			this.command = Command.CAST;
			this.showInventory(new ItemFinder(observer.inventory).isTypeId("spell"));
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
			return false;
		}
		return true;
	}
}

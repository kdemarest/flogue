Module.add('command',function() {

function castConvert(cmd,observer,index) {
	let spellList = observer.getCastableSpellList();
	cmd.command = Command.CAST;
	cmd.commandItem = spellList.all[index];
}

function commandForItemAttack(weapon) {
	if( weapon.mayThrow && (!weapon.inSlot || weapon.inSlot==Slot.AMMO) ) {
		return Command.THROW;
	}
	if( weapon.isSpell || weapon.mayCast ) {
		return Command.CAST;
	}
	if( weapon.mayShoot ) {
		return Command.SHOOT;
	}
	if( !weapon.range || weapon.inSlot == Slot.WEAPON ) {
		return Command.ATTACK;
	}
	if( weapon.isSkill ) {
		return Command.TRIGGER;
	}
	debugger;
	return false;
}


function commandForItem(item) {
	if( item.command ) {
		return item.command;
	}
	if( item.isPotion ) {
		return item.effect && item.effect.isHarm ? Command.THROW : Command.QUAFF;
	}
	if( item.isGem ) {
		return Command.GAZE;
	}
	if( item.isCorpse ) {
		return Command.LOOT;
	}
	// This must be before shoot and throw so that, by default, you are arming yourself
	// from inventory instead of trying to use the thing.
	if( item.slot ) {
		return Command.USE;
	}
	if( item.craftId ) {
		return Command.EXECUTE;
	}
	if( item.isShovel ) {
		return Command.DIG;
	}
	if( item.isSpell || item.mayCast ) {
		return Command.CAST;
	}
	if( item.mayShoot ) {
		return Command.SHOOT;
	}
	if( item.mayThrow && (!item.inSlot || item.inSlot==Slot.AMMO) ) {
		return Command.THROW;
	}
	if( item.isSkill ) {
		return Command.TRIGGER;
	}
	return false;
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
		let item = cmd.commandItem;
		let command = commandForItem(item) || cmd.command;
		if( command == Command.USE ) {
			cmd.retain = Command.INVENTORY; //command;
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
CmdTable[Command.DIG] = {
	needsItem: false,
	needsTarget: () => true,
	targetRange: () => 1,
	passesTimeOnExecution: true
};
CmdTable[Command.CRAFT] = {
	needsItem: true,
	itemFilter: observer => () => new Finder(observer.inventory).filter(observer.craft.filter),
	criteriaToExecute: (cmd,observer) => observer.craft.criteria ? observer.craft.criteria(cmd.commandItem) : true,
	passesTimeOnExecution: false
};
CmdTable[Command.TRIGGER] = {
	needsItem: true,
	itemFilter: observer => () => new Finder(observer.inventory).isTypeId("skill"),
	needsTarget: (cmd) => cmd.commandItem.needsTarget,
	targetRange: (item) => item.owner.getRange(item),
	needsTarget2: (cmd) => !!cmd.commandItem.owner.getRange2(cmd.commandItem),
	target2Range: (item) => item.owner.getRange2(item),
	criteriaToExecute: (cmd,observer) => cmd.commandItem.effect,
	passesTimeOnExecution: (cmd) => cmd.commandItem.passesTime === undefined ? true : cmd.commandItem.passesTime
};
CmdTable[Command.CAST] = {
	needsItem: true,
	itemFilter: observer => () => observer.getCastableSpellList(),
	needsTarget: ()=>true,
	targetRange: (item) => item.owner.getRange(item),
	needsTarget2: (cmd) => !!cmd.commandItem.owner.getRange2(cmd.commandItem),
	target2Range: (item) => item.owner.getRange2(item),
	criteriaToExecute: (cmd,observer) => {
		if( !cmd.commandItem.isRecharged() ) {
			tell(mSubject|mPronoun|mPossessive,observer,' ',mObject|mPossessed,cmd.commandItem,' is still charging.');
			return false;
		}
		return true;
	},
	passesTimeOnExecution: true
};
CmdTable[Command.ATTACK] = {
	needsItem: true,
	pickItem: observer => {
		return observer.calcDefaultWeapon();
	},
	needsTarget: ()=>true,
	targetRange: (item) => item.reach || 1,
	passesTimeOnExecution: true
};
CmdTable[Command.THROW] = {
	needsItem: true,
	itemFilter: observer => () => new Finder(observer.inventory).filter( item => item.mayThrow ),
	needsTarget: ()=>true,
	targetRange: (item) => item.owner.getRange(item),
	passesTimeOnExecution: true
};
CmdTable[Command.SHOOT] = {
	needsItem: true,
	pickItem: observer => {
		let weaponList = observer.getItemsInSlot(Slot.WEAPON);
		if( !weaponList.count || !weaponList.first.mayShoot ) {
			tell(mSubject|mCares,observer,' must select or equip a ranged weapon first.');
			return null;
		}
		return weaponList.first;
	},
	itemFilter: observer => () => new Finder(observer.inventory).filter( item => item.mayShoot ),
	needsTarget: ()=>true,
	targetRange: (item) => item.owner.getRange(item),
	criteriaToExecute: (cmd,observer) => {
		if( !cmd.commandItem.isRecharged() ) {
			tell(mSubject|mPronoun|mPossessive,observer,' ',mObject|mPossessed,cmd.commandItem,' is still charging.');
			return false;
		}
		let weapon = cmd.commandItem;
		let ammo   = observer.hasAmmo(weapon);
		if( !ammo ) {
			tell('Warning: ',mSubject,observer,' ',mVerb,'has',' no suitable ammunition.');
			return false;
		}
		return true;
	},
	passesTimeOnExecution: true
};
CmdTable[Command.DROP] = {
	needsItem: true,
	itemAllowFilter: true,
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
	itemFilter: observer => () =>  new Finder(observer.inventory).filter( item => item.slot || item.command=='use' ),
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
		console.logCmd('Cmd.clear()');
		this.command = Command.NONE;
		this.commandItem = null;
		this.commandTarget = null;
		this.commandTarget2 = null;
		this.commandX = null;
		this.commandY = null;
		this.retain = null;
	}
	cancelItem() {
		console.logCmd('Cmd.cancelItem()');
		this.commandItem = null;
		this.commandTarget = null;
		this.commandTarget2 = null;
		return false;
	}
	cancel() {
		console.logCmd('Cmd.cancel()');
		this.onCancel();
		this.clear();
		return false;
	}
	enact() {
		console.logCmd( 'Cmd.enact()', this.retain ? 'retain '+this.retain : '' );
		let passesTime = typeof this.passesTimeOnExecution === 'function' ? this.passesTimeOnExecution(this) : this.passesTimeOnExecution;
		let retain = this.retain;
		this.onEnact(this);
		this.clear();
		if( retain ) { this.command = retain; }
		return passesTime;
	}
	get ct() 					{ return CmdTable[this.command]; }
	get convertToCommand() 		{ return this.ct && this.ct.convertToCommand; }
	get needsItem()				{ return this.ct && this.ct.needsItem; }
	get pickItem()				{ return this.ct && this.ct.pickItem; }
	get itemAllowFilter()		{ return this.ct && this.ct.itemAllowFilter; }
	get itemFilter()			{ return this.ct && this.ct.itemFilter; }
	get convertOnItemChosen()	{ return this.ct && this.ct.convertOnItemChosen; }
	get needsTarget() 			{ return (this.ct && this.ct.needsTarget) ? this.ct.needsTarget : ()=>false; }
	get targetRange() 			{ return this.ct && this.ct.targetRange; }
	get needsTarget2() 			{ return (this.ct && this.ct.needsTarget2) ? this.ct.needsTarget2 : ()=>false; }
	get target2Range() 			{ return this.ct && this.ct.target2Range; }
	get criteriaToExecute()		{ return this.ct && this.ct.criteriaToExecute; }
	get passesTimeOnExecution() { return this.ct ? this.ct.passesTimeOnExecution : true; }
}

class UserCommandHandler {
	constructor(user,viewInventory,viewRange) {
		this.viewInventory = viewInventory;
		this.viewRange = viewRange;
		this.rangeStatus = {};
		this.user = user;
		this.cmd = new Cmd(
			() => { },
			(c) => {
				console.assert( c.command );
				console.watchCommand( this.observer, 'command: ', c.command, c.commandItem ? c.commandItem.id : '', c.commandTarget ? c.commandTarget.id : '' );
				this.observer.command = c.command;
				this.observer.commandItem = c.commandItem;
				this.observer.commandTarget = c.commandTarget;
				this.observer.commandTarget2 = c.commandTarget2;
				this.observer.commandX = c.commandX === undefined ? null : c.commandX;
				this.observer.commandY = c.commandY === undefined ? null : c.commandY;
			}
		);
		user.gui.subscribe('specialInventoryClose','inventoryClose',()=>{
			if( this.cmd.command == Command.INVENTORY ) {
				this.cmd.command = Command.NONE;
			}
		});

	}
	updateRangeStatus(rangeStatus) {
		console.log(rangeStatus);
		this.rangeStatus = rangeStatus;
	}
	pickTarget(member,dirCommand,observer) {
		if( dirCommand == Command.CANCEL ) {
			guiMessage('viewRangeUnprime');
			return this.cmd.cancel();
		}
		let dir = Direction.fromCommand(dirCommand);
		if( dir !== false ) {
			guiMessage('viewRangeKeyboard',dir);
			return false;
		}
		if( dirCommand == Command.EXECUTE ) {
			if( !this.rangeStatus.inRange ) {
				tell(mSubject,observer,' ',mVerb,'lack',' sufficient range.');
				return;
			}
			if( !this.rangeStatus.isShotClear ) {
				tell(mSubject,observer,' ',mVerb,'lack',' a clear shot.');
				return;
			}
			let x = observer.x+this.rangeStatus.xOfs;
			let y = observer.y+this.rangeStatus.yOfs;

			let target = observer.findAliveOthersOrSelfAt(x,y);
			if( !target.count ) {
				target = observer.map.findItemAt(x,y);
			}
			let item = this.cmd.commandItem;
			let effect = item.effect;
			let mayTargetPos = (
				member == 'commandTarget2' ||
				item.mayTargetPosition || 
				(effect && effect.doesTiles) || 
				(effect && effect.effectShape!==undefined && effect.effectShape!==EffectShape.SINGLE)
			);
			if( !target.count ) {
				if( !mayTargetPos ) {
					return this.cmd.cancel();
				}
				target = new Finder( [observer.map.getTileEntity(x,y)] );
			}
			this.cmd[member] = target.first;
			guiMessage('viewRangeUnprime');
		}
	}

	evalCommand(observer,event) {

		let tellCommand = (text) => {
			console.watchCommand( observer, 'event command: ', observer.command, observer.commandItem ? observer.commandItem.id : '', observer.commandTarget ? observer.commandTarget.id : '' );
		}

		this.observer = observer;		// hack!!

		if( event.command ) {
			observer.command = event.command;
			observer.commandItem = event.commandItem || null;
			observer.commandTarget = event.commandTarget || null;
			observer.commandTarget2 = event.commandTarget2 || null;
			observer.commandX = event.commandX === undefined ? null : event.commandX;
			observer.commandY = event.commandY === undefined ? null : event.commandY;
			tellCommand('event command');
		}

		let cmd = this.cmd;

		if( !cmd.command || cmd.command == Command.NONE ) {
			Object.assign( cmd, this.user.keyToCommand(event.key) );
			if( !cmd.command || cmd.command == Command.NONE ) {
				return false;
			}
			if( !CmdTable[cmd.command] ) {
				observer.command 		= cmd.command;
				observer.commandItem 	= cmd.commandItem || event.commandItem || null;
				observer.commandTarget 	= cmd.commandTarget || event.commandTarget || null;
				observer.commandTarget2 = cmd.commandTarget2 || event.commandTarget2 || null;
				tellCommand('unregulated command');
				this.cmd.clear();
				return observer.command !== Command.NONE;
			}
			if( cmd.convertToCommand ) {
				cmd.convertToCommand(cmd,observer);
			}
		}

		if( cmd.needsItem && !cmd.commandItem && cmd.pickItem ) {
			cmd.commandItem = cmd.pickItem(observer);
		}

		if( cmd.needsItem && !cmd.commandItem ) {
			// The Command.INVENTORY uses this to open your inventory. Remember that prime doesn't
			// actually do anything except organize what the filter, inventory and visibility functions are.
			this.viewInventory.prime(cmd.itemFilter(observer), cmd.itemAllowFilter, () => cmd.needsItem && !cmd.commandItem );
			let isVisible = this.viewInventory.isVisible();
			if( isVisible ) {
				if( this.user.keyToCommand(event.key).command == Command.CANCEL ) {
					return cmd.cancel();
				}
				if( window.useKeysForItems ) {
					cmd.commandItem = this.viewInventory.getItemByKey(event.key);
				}
				event.key = null;	// Stops this event being interpreted by other command thingies. Nasty hack.
			}
		}

		if( cmd.needsItem && !cmd.commandItem && event.commandItem ) {
			cmd.commandItem = event.commandItem;
			delete event.commandItem;
		}

		let preConvert = null;
		if( cmd.commandItem && cmd.convertOnItemChosen ) {
			preConvert = cmd.command;
			cmd.command = cmd.convertOnItemChosen(cmd);
		}

		if( cmd.commandItem && cmd.criteriaToExecute ) {
			if( !cmd.criteriaToExecute(cmd,observer) ) {
				if (preConvert ) {
					cmd.command = preConvert;
					return cmd.cancelItem();
				}
				return cmd.cancel();
			}
		}

		if( cmd.commandItem && cmd.needsTarget(cmd,observer) ) {
			if( cmd.commandItem.targetMe || (cmd.commandItem.effect && cmd.commandItem.effect.targetMe) ) {
				cmd.commandTarget = cmd.commandItem.owner;
			}
		}

		if( cmd.commandItem && !cmd.needsTarget(cmd,observer) ) {
			return cmd.enact();
		}

		if( cmd.needsTarget(cmd,observer) && !cmd.commandTarget && (!cmd.needsItem || cmd.commandItem) ) {
			guiMessage( 'viewRangePrime', {
				rangeLimit: cmd.targetRange(cmd.commandItem),
				autoTargetMe: cmd.commandItem && cmd.commandItem.effect && cmd.commandItem.effect.isHelp,
				visibleFn: () => cmd.needsTarget(cmd,observer) && !cmd.commandTarget,
				rangeStatusFn: this.updateRangeStatus.bind(this)
			});
			let command = event.command ? event.command : this.user.keyToCommand(event.key).command;
			let result = this.pickTarget( 'commandTarget', command, observer );
			if( result !== undefined ) {
				return result;
			}
			event.key = null;
		}

		if( cmd.commandTarget && !cmd.needsTarget2(cmd,observer) ) {
			return cmd.enact();
		}

		if( cmd.needsTarget2(cmd,observer) && !cmd.commandTarget2 && cmd.commandTarget && (!cmd.needsItem || cmd.commandItem) ) {
			guiMessage( 'viewRangePrime', {
				rangeLimit: cmd.target2Range(cmd.commandItem),
				autoTargetMe: cmd.commandItem && cmd.commandItem.effect && cmd.commandItem.effect.isHelp,
				visibleFn: () => cmd.needsTarget2(cmd,observer) && !cmd.commandTarget2,
				rangeStatusFn: this.updateRangeStatus.bind(this)
			});
			let command = event.command ? event.command : this.user.keyToCommand(event.key).command;
			let result = this.pickTarget( 'commandTarget2', command, observer );
			if( result !== undefined ) {
				return result;
			}
		}

		if( cmd.commandTarget2 ) {
			return cmd.enact();
		}

		return false;
	}
}

return {
	commandForItem: commandForItem,
	commandForItemAttack: commandForItemAttack,
	UserCommandHandler: UserCommandHandler
}

});

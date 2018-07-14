
function castConvert(cmd,observer,index) {
	let spellList = getCastableSpellList(observer);
	cmd.command = Command.CAST;
	cmd.commandItem = spellList.all[index];
}

function commandForItem(item) {
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
		return Command.USE;
	}
	if( item.mayThrow ) {
		return Command.THROW;
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
			cmd.retain = command;
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
	targetRange: (item) => item.range || Rules.RANGED_WEAPON_DEFAULT_RANGE,
	criteriaToExecute: (cmd,observer) => {
		if( !cmd.commandItem.isRecharged() ) {
			tell(mSubject|mPronoun|mPossessive,observer,' ',mObject|mPossessed,cmd.commandItem,' is still charging.');
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
	targetRange: (item) => item.range || Rules.RANGED_WEAPON_DEFAULT_RANGE,
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
	needsTarget: true,
	targetRange: (item) => item.range || Rules.RANGED_WEAPON_DEFAULT_RANGE,
	criteriaToExecute: (cmd,observer) => {
		if( !cmd.commandItem.isRecharged() ) {
			tell(mSubject|mPronoun|mPossessive,observer,' ',mObject|mPossessed,cmd.commandItem,' is still charging.');
			return false;
		}
		let weapon = cmd.commandItem;
		let ammo   = observer.hasAmmo(weapon);
		if( !ammo ) {
			tell(mSubject,observer,' ',mVerb,'has',' no suitable ammunition.');
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
	get pickItem()				{ return this.ct && this.ct.pickItem; }
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
	constructor(user,viewInventory,viewRange) {
		this.viewInventory = viewInventory;
		this.viewRange = viewRange;
		this.user = user;
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
			if( !this.viewRange.isShotClear ) {
				tell(mSubject,observer,' ',mVerb,'lack',' a clear shot.');
				return;
			}
			let target = observer.findAliveOthersOrSelfAt(observer.x+this.viewRange.xOfs,observer.y+this.viewRange.yOfs);
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
		let zeroTime = [Command.BUY,Command.SELL,Command.CRAFT,Command.NONE];

		this.observer = observer;		// hack!!

		if( event.command ) {
			observer.command = event.command;
			observer.commandItem = event.commandItem || null;
			observer.commandTarget = event.commandTarget || null;
			return !zeroTime.includes(event.command);
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
			if( !cmd.commandItem ) {
				let keyEval = this.viewInventory.prime( cmd.itemFilter(observer), cmd.itemAllowFilter, () => cmd.needsItem && !cmd.commandItem );
				if( keyEval ) {
					if( this.user.keyToCommand(event.key).command == Command.CANCEL ) {
						return cmd.cancel();
					}
					cmd.commandItem = this.viewInventory.getItemByKey(event.key);
				}
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

		if( cmd.commandItem && !cmd.needsTarget ) {
			return cmd.enact();
		}

		if( cmd.needsTarget && !cmd.commandTarget && (!cmd.needsItem || cmd.commandItem) ) {
			this.viewRange.prime(
				cmd.targetRange(cmd.commandItem),
				cmd,
				() => cmd.needsTarget && !cmd.commandTarget && (!cmd.needsItem || cmd.commandItem) );
			let result = this.pickTarget( this.user.keyToCommand(event.key).command, observer );
			if( result !== undefined ) {
				return result;
			}
		}

		return false;
	}
}

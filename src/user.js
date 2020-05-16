Module.add('user',function() {

class HumanUser {
	constructor() {
		// WARNING: It is important not to depend on any other data in this constructor.
		this.isHumanUser = true;
		this.entity = null;
		this.commandHandler = null;
		this.areaMap = {};
		this.favoriteMap = {};
		this.keyMap = new KeyMap();
	}
	clearFavorite(favorite) {
		favorite.command = null;
		favorite.itemId  = null;
		favorite.autoSet = null;
	}
	setFavorite(key,item,autoSet) {
		Object.each( this.favoriteMap, favorite => {
			if( item && favorite.itemId == item.id ) {
				this.clearFavorite(favorite);
			}
		});
		if( !item ) {
			if( this.favoriteMap[key] ) {
				this.clearFavorite( this.favoriteMap[key] );
			}
		}
		else {
			let unbunchList = [Command.SHOOT,Command.ATTACK,Command.CAST];
			if( (item.isWeapon || item.isSpell) && unbunchList.includes(commandForItemAttack(item)) ) {
				item = item.single();
			}

			this.favoriteMap[key] = {
				key: key,
				command: commandForItem(item) || Command.INVENTORY,
				itemId: item.id,
				autoSet: autoSet
			}
		}
	}
	autoFavorite() {
		let fav = function(key,getItemList,index=0) {
			if( !this.favoriteMap[key] || !this.favoriteMap[key].command ) {
				let item = getItemList().all[index];
				if( !item || Object.find( this.favoriteMap, fav => fav.itemId == item.id ) ) {
					return;
				}
				this.setFavorite(key,item,true);
				return true;
			}
		}.bind(this);

		Object.each( this.favoriteMap, favorite => {
			if( favorite.autoSet ) {
				this.clearFavorite(favorite);
			}
		});
		let f = () => new Finder(this.entity.inventory);
		fav( '1', () => f().filter(item=>item.isWeapon && !item.mayShoot && item.slot == Slot.WEAPON && !item.isFake && !item.isNatural).byDamage('desc') );
		fav( '3', () => f().filter(item=>item.mayShoot && item.ammoSpec && !item.isFake).byDamage('desc') );
		fav( '4', () => f().filter(item=>item.isShield && !item.isFake).byLevel('desc') );
		fav( '5', () => f().filter(item=>item.isPotion && item.effect && item.effect.op == 'heal' && !item.isFake ) );
		let spellList = this.entity.getCastableSpellList();
		let i = 0;
		i += fav( '6', () => f().filter( item=>item.isSpell || item.isAutoFavorite), i ) ? 1 : 0;
		i += fav( '7', () => f().filter( item=>item.isSpell || item.isAutoFavorite), i ) ? 1 : 0;
		i += fav( '8', () => f().filter( item=>item.isSpell || item.isAutoFavorite), i ) ? 1 : 0;
		i += fav( '9', () => f().filter( item=>item.isSpell || item.isAutoFavorite), i ) ? 1 : 0;
		i += fav( '0', () => f().filter( item=>item.isSpell || item.isAutoFavorite), i ) ? 1 : 0;
	}
	isItemSelected(item) {
		return this.commandHandler.cmd.commandItem && this.commandHandler.cmd.commandItem.id == item.id;
	}

	keyToCommand(key) {
		if( !this.suppressFavorites ) {
			let favorite = this.favoriteMap[key];
			if( favorite && favorite.command ) {
				let command = favorite.command;
				let item = !favorite.itemId ? null : this.entity.inventory.find( item=>item.id==favorite.itemId );
				if( item && command == 'use' ) {
					// Super mega hack until I am sure this works.
					if( command == 'use' ) {
						if( item.isWeapon || item.isSpell ) {
							if( item.slot && !item.inSlot ) {
								this.entity.actUse(item);
							}
							command = commandForItemAttack(item);
						}
						else {
							command = commandForItem(item);
						}
					}
				}
				let cmd = {
					command: command,
					commandItem: item,
					commandTarget: null,
					commandTarget2: null
				};
				return cmd;
			}
		}
		return {
			command: this.keyMap.keyToCommand[key]
		}
	}
	getAreaMap(areaId) {
		this.areaMap[areaId] = this.areaMap[areaId] || [];
		return this.areaMap[areaId];
	}
	takeControlOf(newEntity) {
		if( this.entity ) {
			this.entity.userControllingMe = null;
		}

		this.entity = newEntity;
		this.entity.userControllingMe = this;
		if( newEntity.area ) {
			newEntity.area.world.setTickingAreas(newEntity.area.id);
		}
	}
}

return {
	HumanUser: HumanUser
}

});

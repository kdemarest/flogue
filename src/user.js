Module.add('user',function() {

class HumanUser {
	constructor() {
		this.isHumanUser = true;
		this.entity = null;
		this.priorArea = null;
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
		fav( '1', () => f().filter(item=>item.isWeapon && !item.mayShoot && item.slot == Slot.WEAPON && !item.isFake).byDamage('desc') );
		fav( '3', () => f().filter(item=>item.mayShoot && item.ammoSpec && !item.isFake).byDamage('desc') );
		fav( '4', () => f().filter(item=>item.isShield && !item.isFake).byLevel('desc') );
		fav( '5', () => f().filter(item=>item.isPotion && item.effect && item.effect.op == 'heal' && !item.isFake ) );
		let spellList = this.entity.getCastableSpellList();
		let i = 0;
		i += fav( '6', () => spellList, i ) ? 1 : 0;
		i += fav( '7', () => spellList, i ) ? 1 : 0;
		i += fav( '8', () => spellList, i ) ? 1 : 0;
		i += fav( '9', () => spellList, i ) ? 1 : 0;
		i += fav( '0', () => spellList, i ) ? 1 : 0;
	}
	isItemSelected(item) {
		return this.commandHandler.cmd.commandItem && this.commandHandler.cmd.commandItem.id == item.id;
	}

	keyToCommand(key) {
		if( !this.suppressFavorites ) {
			let favorite = this.favoriteMap[key];
			if( favorite && favorite.command ) {
				let cmd = {
					command: favorite.command,
					commandItem: !favorite.itemId ? null : this.entity.inventory.find( item=>item.id==favorite.itemId ),
					commandTarget: null
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
		if( newEntity.area && newEntity.area.id !== this.entity.area.id ) {
			this.priorArea = this.entity.area;
		}
		if( this.entity ) {
			this.entity.userControllingMe = null;
		}
		this.entity = newEntity;
		this.entity.userControllingMe = this;
	}
	onAreaChange(area) {
		guiMessage('setArea',area);
		this.priorArea = this.entity.area;
	}
}

return {
	HumanUser: HumanUser
}

});

class HumanUser {
	constructor() {
		this.isHumanUser = true;
		this.entity = null;
		this.priorArea = null;
		this.commandHandler = null;
		this.areaMap = {};
		this.favoriteMap = {};
		this.keyMap = loadKeyMapping();
	}
	setFavorite(key,item) {
		Object.each( this.favoriteMap, favorite => {
			if( favorite.itemId == item.id ) {
				favorite.command = null;
				favorite.itemId  = null;
			}
		});
		this.favoriteMap[key] = {
			key: key,
			command: commandForItem(item) || Command.INVENTORY,
			itemId: item.id
		}
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
			command: this.keyMap[key]
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

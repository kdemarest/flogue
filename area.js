class AreaBuilder {
	constructor(picker) {
		this.picker = picker;
	}

	buildMap(picker,scape,palette,injectList,siteList) {
		let masonMap = Mason.buildMap(picker,scape,palette,injectList,siteList);
		return masonMap.renderToString();
	}

	populate(map,density,safeToMakeFn,makeFn) {
		map.traverse( (x,y) => {
			let type = map.tileTypeGet(x,y);
			if( type.isFloor && Math.rand(0,1)<density && safeToMakeFn(x,y) ) {
				makeFn(x,y);
			}
		});
	}

	extractEntitiesFromMap(map,entityList,gateList,injectList,itemMakeFn) {
		let noEntity = {};
		let itemCount = 0;
		let entityCount = 0;

		map.traverse( (x,y) => {
			// Note that this code uses the SIMPLEST function that do NOT assume
			// what is on the map...
			let symbol = map.tileSymbolGet(x,y);

			let entityType = SymbolToType[symbol];
			if( !entityType ) {
				debugger;
			}
			// CREATE MONSTERS
			let inject = injectList[''+x+','+y] || noEntity;
			if( entityType && entityType.isMonsterType ) {
				let fnName = entityType.brain == 'user' ? 'unshift' : 'push';
				// WARNING: Set the underlying tile symbol first so that the entity you're placing doesn't collide with it.
				map.tileSymbolSetFloor(x,y)
				let entity = new Entity( map, entityList, entityType, { x:x, y:y }, inject );
				entityList[fnName]( entity );
				++entityCount;
				//console.log("Extracted "+entity.typeId+" with attitude "+entity.attitude,inject );
			}
			// CREATE ITEMS
			if( entityType && entityType.isItemType ) {
				// WARNING: Set the underlying tile symbol first so that the entity you're placing doesn't collide with it.
				map.tileSymbolSetFloor(x,y);
				let item = itemMakeFn(x,y,entityType,null,inject);	// the null means you have to generate presets for this item.
				if( item.isTreasure ) { 
					++itemCount;
				}
			}
		});

		// When there is only one monster, we are probably testing, so watch it.
		if( entityList.length == 2 ) {
			// zero will be the player
			entityList[entityList.length-1].watch = true;
		}
		return [entityCount,itemCount];
	}
};

class Area {
	constructor(areaId,level,theme,isCore) {
		this.id = areaId;
		this.level = level;
		this.isCore = isCore;
		this.theme = theme;
		this.mapMemory = [];
	}

	build(palette) {

		let self = this;
		PickerSetTheme(this.theme);	// WARNING! Horrible hack. But it works for now.

		function makeMonster(x,y,inject) {
			let entityType = picker.pick(picker.monsterTable);
			let entity = new Entity( self.map, self.entityList, entityType, { x:x, y:y }, inject );
			console.log("Created "+entity.typeId+" with attitude "+entity.attitude );
			self.entityList.push(entity);
			return entity;
		}
		function makeItem(x,y,type,presets,inject) {
			if( x===undefined || y===undefined ) debugger;
			if( type && type.isRandom ) {
				type = null;
			}
			if( !type ) {
				let obj = picker.pick(picker.itemTable,type ? type.typeId : null);
				if( obj === false ) {
					debugger;
				}
				type = obj.item;
				presets = obj.presets;
			}

			let item = self.map.itemCreateByType(x,y,type,presets,inject);
			if( item.x===undefined ) debugger;
			//console.log( item.name+' created at ('+x+','+y+') on '+self.map.tileTypeGet(x,y).typeId );
			if( item.gateDir !== undefined ) {
				self.gateList.push(item);
			}
			return item;
		}
		function safeToMake(x,y) {
			let tile = self.map.tileTypeGet(x,y);
			if( !tile.mayWalk ) return false;
			let item = self.map.findItem().at(x,y);
			if( item.count ) return false;
			let entity = new Finder(self.entityList).at(x,y);
			return !entity.count;
		}

		let picker = new Picker(this.level,this.theme);
		this.builder = new AreaBuilder(picker);

		let scapeId = pick(this.theme.scapes);
		let scape = ScapeList[scapeId]();
		scape = Object.assign(
			{
				placeDensity: 0.40,
				monsterDensity: 0.01,
				itemDensity: 0.04
			}, 
			scape,
			this.theme.scape,
			{
				palette: Object.assign( {}, scape.palette, this.theme.palette ),
				level: this.level,
				entranceCount: 1,
				exitCount: 1
			}
		);
		this.scape = scape;

		let injectList = [];
		this.siteList = [];
		let tileRaw = loadLevel(this.id) || this.builder.buildMap(picker,scape,palette,injectList,this.siteList);

		this.map = new Map(tileRaw,[]);
		this.map.level = this.level;
		this.entityList = [];
		this.gateList = [];

		let entityCount,itemCount;
		[entityCount,itemCount] = this.builder.extractEntitiesFromMap(this.map,this.entityList,this.gateList,injectList,makeItem);
		let monsterDensity = scape.floorDensity * (scape.monsterDensity - entityCount/(this.map.getArea()*scape.floorDensity));
		this.builder.populate( this.map, monsterDensity, safeToMake, makeMonster );
		let itemDensity = scape.floorDensity * (scape.itemDensity - itemCount/(this.map.getArea()*scape.floorDensity));
		this.builder.populate( this.map, itemDensity, safeToMake, makeItem );
		return this;
	}
	getGate(id) {
		let g = this.gateList.filter( g => g.id==id );
		return g[0];
	}
	getUnusedGateByTypeId(typeId) {
		let g = this.gateList.filter( g => g.typeId==typeId && !g.toAreaId );
		return !g.length ? null : g[0];
	}
}

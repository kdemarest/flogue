class AreaBuilder {
	constructor() {
	}

	buildMap(scape,palette,requiredPlaces,placeRarityTable,injectList,siteList) {
		let masonMap = Mason.masonConstruct(scape,palette,requiredPlaces,placeRarityTable,injectList,siteList);
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

	extractEntitiesFromMap(map,gateList,injectList,itemMakeFn) {
		let noEntity = {};
		let treasureCount = 0;
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
				// WARNING: Set the underlying tile symbol first so that the entity you're placing doesn't collide with it.
				map.tileSymbolSetFloor(x,y)
				let entity = new Entity( map.area.depth, entityType, inject );
				entity.gateTo(map.area,x,y);
				++entityCount;
				//console.log("Extracted "+entity.typeId+" with attitude "+entity.attitude,inject );
			}
			// CREATE ITEMS
			if( entityType && entityType.isItemType ) {
				// WARNING: Set the underlying tile symbol first so that the entity you're placing doesn't collide with it.
				map.tileSymbolSetFloor(x,y);
				let item = itemMakeFn(x,y,entityType,null,inject);	// the null means you have to generate presets for this item.
				if( item.isTreasure ) { 
					++treasureCount;
				}
			}
		});

		return [entityCount,treasureCount];
	}
};

class Area {
	constructor(areaId,depth,theme,isCore) {
		this.id = areaId;
		this.depth = depth;
		this.isCore = isCore;
		this.theme = theme;
		this.mapMemory = [];
	}

	build(palette) {

		let self = this;

		function makeMonster(x,y,inject) {
			let picker = new Picker(self.depth);
			let entityType = picker.pick(picker.monsterTable(self.theme.monsters),null,'!isUnique');
			let entity = new Entity( self.depth, entityType, inject );
			entity.gateTo(self,x,y);
			console.log("Created "+entity.typeId+" with attitude "+entity.attitude );
			return entity;
		}
		function makeItem(x,y,type,presets,inject) {
			if( x===undefined || y===undefined ) debugger;
			if( type && type.isRandom ) {
				type = null;
			}
//			if( type && type.isCorpse ) debugger;
			if( !type  || !presets ) {
				let filterString = [type ? type.typeId : '',!type || type.isTreasure ? 'isTreasure' : ''].join(' ');
				let picker = new Picker(self.depth);
				type = picker.pickItem( filterString );
				if( type === false ) {
					debugger;
				}
				console.log("Pick item "+type._id);
				presets = type.presets;
//				if( type && type.isCorpse ) debugger;
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

		this.builder = new AreaBuilder();

		let scapeId = pick(this.theme.scapes);
		let scape = ScapeList[scapeId]();
		scape = Object.assign(
			{
				depth: this.depth,
				placeDensity: 0.40,
				monsterDensity: 0.01,
				itemDensity: 0.04
			}, 
			scape,
			this.theme.scape,
			{
				palette: Object.assign( {}, scape.palette, this.theme.palette ),
				entranceCount: 1,
				exitCount: 1
			}
		);
		this.scape = scape;

		let injectList = [];
		this.siteList = [];
		let tileRaw = loadLevel(this.id) || this.builder.buildMap(
			scape,
			palette,
			this.theme.rREQUIRED,
			this.theme.rarityTable,
			injectList,
			this.siteList
		);

		this.map = new Map(this,tileRaw,[]);
		this.entityList = [];
		this.gateList = [];

		let entityCount,treasureCount;
		[entityCount,treasureCount] = this.builder.extractEntitiesFromMap(this.map,this.gateList,injectList,makeItem);
		let monsterDensity = scape.floorDensity * (scape.monsterDensity - entityCount/(this.map.getSurfaceArea()*scape.floorDensity));
		this.builder.populate( this.map, monsterDensity, safeToMake, makeMonster );
		let itemDensity = scape.floorDensity * (scape.itemDensity - treasureCount/(this.map.getSurfaceArea()*scape.floorDensity));
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

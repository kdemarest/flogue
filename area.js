function areaBuild(area,tileQuota) {
	let picker = new Picker(area.depth);

	function makeMonster(type,x,y,inject) {
		type = type || picker.pick(picker.monsterTable(area.theme.monsters),null,'!isUnique');
		let entity = new Entity( area.depth, type, inject );
		entity.gateTo(area,x,y);
		return entity;
	}
	function makeItem(type,x,y,presets,inject) {
		console.assert( x!==undefined && y!==undefined );
		type = type && !type.isRandom ? type : null;
		if( !type || !presets ) {
			let filterString = inject && inject.type ? inject.type : (type ? type.typeId : '');
			if( !type || type.isTreasure ) {
				filterString += ' isTreasure';
			}
			type = picker.pickItem( filterString );
			console.assert( type );
			presets = type.presets;
		}

		let item = area.map.itemCreateByType(x,y,type,presets,inject);
		if( type.gateDir !== undefined ) {
			console.log( "Gate "+type.typeId+" at ("+x+","+y+") leads to "+(!inject ? 'TBD' : inject.toAreaId+' / '+inject.toGateId) );
			console.log( "The item says "+item.toAreaId+' / '+item.toGateId );
		}
		console.assert( item.x!==undefined );
		return item;
	}
	function safeToMake(map,x,y) {
		let tile = map.tileTypeGet(x,y);
		if( !tile.mayWalk ) return false;
		let item = map.findItem().at(x,y);
		if( item.count ) return false;
		let entity = new Finder(area.entityList).at(x,y);
		return !entity.count;
	}

	function extractEntitiesFromMap(map,injectList,makeMonsterFn,makeItemFn) {
		let noEntity = {};
		map.traverse( (x,y,type) => {
			let pos = ''+x+','+y;
			let inject = injectList[pos];
			if( type && type.isMonsterType ) {
				map.tileSymbolSetFloor(x,y)
				makeMonsterFn( type, x, y, inject ? inject[type.typeId] : null ); 
				if( inject ) inject[type.typeId].injected = true;
			}
			if( type && type.isItemType ) {
				map.tileSymbolSetFloor(x,y);
				makeItemFn(type,x,y,null,inject ? inject[type.typeId]: null);	// the null means you have to generate presets for this item.
				if( inject ) inject[type.typeId].injected = true;
			}
		});
	}

	function populate(map,density,safeToMakeFn,makeFn) {
		map.traverse( (x,y,type) => {
			if( type.isFloor && Math.rand(0,1)<density && safeToMakeFn(map,x,y) ) {
				makeFn(null,x,y);
			}
		});
	}

	let scapeDefault = {
		depth: area.depth,
		placeDensity: 0.40,
		monsterDensity: 0.01,
		itemDensity: 0.04
	};
	let paletteDefault = {
		floor: 			TileTypeList.floor.symbol,
		wall:  			TileTypeList.wall.symbol,
		door:  			TileTypeList.door.symbol,
		fillFloor:  	TileTypeList.floor.symbol,
		fillWall:  		TileTypeList.wall.symbol,
		outlineWall:  	TileTypeList.wall.symbol,
		passageFloor: 	TileTypeList.floor.symbol,
		unknown: 		TILE_UNKNOWN,
	};

	let scapeId = pick(area.theme.scapes);
	let scape = Object.assign( {}, scapeDefault, ScapeList[scapeId](), area.theme.scape );
	let palette = Object.assign( {}, paletteDefault, scape.palette, area.theme.palette );

	let injectList = [];
	area.siteList = [];

	let masonMap = Mason.masonConstruct(
		scape,
		palette,
		area.theme.rREQUIRED,
		area.theme.rarityTable,
		tileQuota,
		injectList,
		area.siteList
	);

	area.map = new Map(area,masonMap.renderToString(),[]);
	area.entityList = [];

	extractEntitiesFromMap(area.map,injectList,makeMonster,makeItem);
	Object.each( injectList, (inject,pos) => {
		Object.each( inject, (type,typeId) => {
			if( !type.injected ) {
				console.log("ERROR: Failed inject of "+typeId+" at "+pos+" payload "+JSON.stringify(type));
			}
		});
	});


	let entityCount = area.map.count( (x,y,type) => type.isMonsterType ? 1 : 0 );
	let treasureCount = area.map.count( (x,y,type) => type.isTreasure ? 1 : 0 );

	let monsterDensity = scape.floorDensity * (scape.monsterDensity - entityCount/(area.map.getSurfaceArea()*scape.floorDensity));
	populate( area.map, monsterDensity, safeToMake, makeMonster );

	let itemDensity = scape.floorDensity * (scape.itemDensity - treasureCount/(area.map.getSurfaceArea()*scape.floorDensity));
	populate( area.map, itemDensity, safeToMake, makeItem );

	area.gateList = area.map.itemList.filter( item => item.gateDir !== undefined );

	return area;
}

class Area {
	constructor(areaId,depth,theme) {
		console.assert( areaId );
		console.assert( depth>=0 );
		console.assert( typeof theme == 'object' );
		this.id = areaId;
		this.depth = depth;
		this.theme = theme;
		this.mapMemory = [];
		this.picker = new Picker(depth);
	}
	build(tileQuota) {
		return areaBuild(this,tileQuota);
	}
	getGate(id) {
		let g = this.gateList.filter( g => g.id==id );
		return g[0];
	}
	getGateThatLeadsTo(id) {
		let g = this.gateList.filter( g => g.toGateId==id );
		return g[0];
	}
	getUnusedGateByTypeId(typeId) {
		let g = this.gateList.filter( g => g.typeId==typeId && !g.toAreaId );
		return !g.length ? null : g[0];
	}
}

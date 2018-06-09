function areaBuild(area,theme,tileQuota) {
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
			// Note that even thought the type might be set here the inject.typeId is allowed to override it.
			// In practice they won't be different, but the inject.typeId might be a specifier like "weapon.sword"
			let filterString = inject && inject.typeId ? inject.typeId : (type ? type.typeId : '');
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

	function populate(map,count,safeToMakeFn,makeFn) {
		let floorList = [];
		map.traverse( (x,y,type) => {
			if( type.isFloor && safeToMakeFn(map,x,y) ) {
				floorList.push(x,y);
			}
		});
		console.assert( floorList.length );
		while( floorList.length && count>0 ) {
			let index = Math.randInt(0,floorList.length/2)*2;
			makeFn(null,floorList[index+0],floorList[index+1]);
			floorList.splice(index,2);
			--count;
		}
	}

	function validateInjectList(injectList) {
		Object.each( injectList, (inject,pos) => {
			Object.each( inject, (type,typeId) => {
				if( !type.injected ) {
					console.log("ERROR: Failed inject of "+typeId+" at "+pos+" payload "+JSON.stringify(type));
				}
			});
		});
	}

	let injectList = [];
	area.siteList = [];

	let masonMap = Mason.masonConstruct(
		area.theme,
		tileQuota,
		injectList,
		area.siteList
	);

	area.map = new Map(area,masonMap.renderToString(),[]);
	area.entityList = [];

	extractEntitiesFromMap(area.map,injectList,makeMonster,makeItem);
	validateInjectList(injectList);

	let totalFloor = area.map.count( (x,y,type) => type.isFloor && safeToMake(area.map,x,y) ? 1 : 0);
	let totalMons  = area.entityList.length;
	let totalItems = area.map.itemList.filter( item => item.isTreasure ).length;

	let owedMons   = Math.round( (totalFloor*theme.monsterDensity) - totalMons );
	let owedItems  = Math.round( (totalFloor*theme.itemDensity) - totalItems );

	console.log( "Map has "+totalFloor+" floor. It is owed "+owedMons+"+"+totalMons+" monsters, and "+owedItems+"+"+totalItems+" items." );
	populate( area.map, owedMons, safeToMake, makeMonster );
	populate( area.map, owedItems, safeToMake, makeItem );

	area.gateList = area.map.itemList.filter( item => item.gateDir !== undefined );

	if( Gab ) {
		Gab.entityPostProcess(area);
	}

	return area;
}

class Area {
	constructor(areaId,depth,theme) {
		console.assert( areaId );
		console.assert( depth>=0 );
		console.assert( typeof theme == 'object' );
		this.id = areaId;
		this.isArea = true;
		this.depth = depth;
		this.theme = theme;
		this.mapMemory = [];
		this.picker = new Picker(depth);
	}
	build(tileQuota) {
		return areaBuild(this,this.theme,tileQuota);
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

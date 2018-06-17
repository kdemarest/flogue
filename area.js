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
			let filterString = inject && inject.typeFilter ? inject.typeFilter.replace(/random/,'') : (type ? type.typeId : '');
			if( !type || type.isTreasure ) {
				filterString += ' isTreasure';
			}
			type = picker.pickItem( filterString.trim() );
			console.assert( type );
			presets = type.presets;
		}

		let item = area.map.itemCreateByType(x,y,type,presets,inject);
		if( type.gateDir !== undefined ) {
//			console.log( "Gate "+type.typeId+" at ("+x+","+y+") leads to "+(!inject ? 'TBD' : inject.toAreaId+' / '+inject.toGateId) );
//			console.log( "The item says "+item.toAreaId+' / '+item.toGateId );
		}
		console.assert( item.x!==undefined );
		return item;
	}
	function safeToMake(map,x,y) {
		let tile = map.tileTypeGet(x,y);
		if( !tile.mayWalk || tile.isProblem ) return false;
		let item = map.findItemAt(x,y);
		if( item.count ) return false;
		let entity = new Finder(area.entityList).at(x,y);
		return !entity.count;
	}

	function extractEntitiesFromMap(map,injectList,makeMonsterFn,makeItemFn) {
		let noEntity = {};
		map.traverse( (x,y,mapType) => {
			let pos = ''+x+','+y;
			let inject = injectList[pos];
			if( !inject ) {
				inject = [{ typeFilter: mapType.typeId }];
			}
			// WARNING! There is no way, currently, to tweak EACH type's probability, so I don't
			// pass a Tweak in here.
			let tileSet = false;
			inject.forEach( make => {
				console.assert(make.typeFilter);
				let typeId = make.typeFilter.split('.')[0];
				if( TileTypeList[typeId] ) {
					console.assert( !tileSet );
					map.tileSymbolSet(x,y,TileTypeList[typeId].symbol);
					tileSet = true;
					return;
				}
				if( MonsterTypeList[typeId] ) {
					if( !tileSet ) { map.tileSymbolSetFloor(x,y); tileSet=true; }
					makeMonsterFn( MonsterTypeList[typeId], x, y, make );
					return;
				}
				if( !tileSet ) { map.tileSymbolSetFloor(x,y); tileSet = true; }
				// If you want a random item, use the item type "random" which is hard-coded to select a
				// random item. If you want to specify any item with 'silver' you simply can not.
				console.assert( ItemTypeList[typeId] );
				makeItemFn( ItemTypeList[typeId], x, y, null, make );	// the null means you have to generate presets for this item.
			});

		});
	}

	function populateAmong(floorList,count,safeToMakeFn,makeFn) {
		console.assert( count <= floorList.length/2 );
		console.assert( floorList.length );
		while( floorList.length && count>0 ) {
			let index = Math.randInt(0,floorList.length/2)*2;
			makeFn(null,floorList[index+0],floorList[index+1]);
			floorList.splice(index,2);
			--count;
		}
	}

	function populate(map,count,safeToMakeFn,makeFn) {
		let floorList = [];
		map.traverse( (x,y,type) => {
			if( type.isFloor && safeToMakeFn(map,x,y) ) {
				floorList.push(x,y);
			}
		});
		populateAmong( floorList, count, safeToMakeFn, makeFn );
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

	let totalFloor = area.map.count( (x,y,type) => type.isFloor && safeToMake(area.map,x,y) ? 1 : 0);
	let totalMons  = area.entityList.length;
	let totalItems = area.map.itemList.filter( item => item.isTreasure ).length;

	let owedMons   = Math.round( (totalFloor*theme.monsterDensity) - totalMons );
	let owedItems  = Math.round( (totalFloor*theme.itemDensity) - totalItems );

	console.log( "Map has "+totalFloor+" floor. It is owed "+owedMons+"+"+totalMons+" monsters, and "+owedItems+"+"+totalItems+" items." );

	area.siteList.forEach( site => {
		if( site.isPlace && site.place.comesWithMonsters ) {
			return;
		}
		if( site.isPlace || site.isRoom ) {
			populateAmong( site.marks, 1, safeToMake, makeMonster );
			owedMons--;
			populateAmong( site.marks, 1, safeToMake, makeItem );
			owedItems--;
		}
	});

	populate( area.map, Math.max(0,owedMons), safeToMake, makeMonster );
	populate( area.map, Math.max(0,owedItems), safeToMake, makeItem );

	area.gateList = area.map.itemList.filter( item => item.gateDir !== undefined );

	if( Gab ) {
		Gab.entityPostProcess(area);
	}

	if( Vis ) {
		area.vis = new Vis(()=>area.map);
	}

	return area;
}

function tick(speed,map,entityList) {

	function orderByTurn() {
		let list = [[],[],[]];	// players, pets, others
		entityList.map( entity => {
			let group = ( entity.isUser() ? 0 : (entity.brainPet && entity.team==Team.GOOD ? 1 : 2 ));
			list[group].push(entity);
		});
		list[2].sort( (a,b) => a.speed-b.speed );
		return [].concat(list[0],list[1],list[2]);
	}

	function tickItemList(itemList,dt) {
		for( let item of itemList ) {
			if( item.rechargeLeft > 0 ) {
				item.rechargeLeft = Math.max(0,item.rechargeLeft-1);
			}
			if( item.onTick ) {
				item.onTick.call(item,dt,map,entityList);
			}
		}
	}

	function checkDeaths(entityList) {
		Array.filterInPlace( entityList, entity => {
			if( entity.isDead() ) {
				entity.die();
				return false;
			}
			return true;
		});
	}

	if( speed === false ) {
		let player = entityList.find( entity => entity.isUser() );
		player.act(false);
		DeedManager.calc(player);
		clearCommands(entityList);
		return;
	}

	let entityListByTurnOrder = orderByTurn(entityList);
	let dt = 1 / speed;
	for( let entity of entityListByTurnOrder ) {
		DeedManager.tick(entity,dt);
		entity.actionCount += entity.speed / speed;
		while( entity.actionCount >= 1 ) {
			entity.calcVis();
			entity.think();
			entity.act();
			tickItemList(entity.inventory,dt,map,entityList);
			DeedManager.calc(entity);
			entity.actionCount -= 1;
		}
	}
	map.actionCount += 1 / speed;
	while( map.actionCount >= 1 ) {
		tickItemList(map.itemList,dt,map,entityList);
		map.actionCount -= 1;
	}
	DeedManager.cleanup();
	checkDeaths(entityList);
	clearCommands(entityList);
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
		this.map = null;
		this.entityList = null;
		this.siteList = null;
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
	tick(speed) {
		tick( speed, this.map, this.entityList );
	}
	siteFind(x,y) {
		let found;
		this.siteList.forEach( site => {
			if( !site.marks ) return;
			for( let i=0 ; i<site.marks.length ; i+=2 ) {
				if( site.marks[i+0]==x && site.marks[i+1]==y ) {
					found = site;
					return false;
				}
			}
		});
		return found;
	}
}

function areaBuild(area,theme,tileQuota,isEnemyFn) {
	let picker = new Picker(area.depth);

	function makeMonster(type,x,y,presets,inject,criteriaFn) {
		console.assert( presets === null );

		type = type || picker.pick(picker.monsterTable(area.theme.monsters,criteriaFn),null,'!isUnique');
		let entity = new Entity( area.depth, type, inject, area.jobPicker );
		entity.gateTo(area,x,y);
		let site = area.getSiteAt(x,y);
		if( site ) {
			//if( site.place && site.place.forbidEnemies ) debugger;
			site.denizenList.push(entity);
			entity.homeSiteId = site.id;
			entity.tether = entity.tether || 2+Math.floor(Math.sqrt(site.marks.length));
			if( entity.team == Team.EVIL && entity.attitude==Attitude.AGGRESSIVE ) {
				entity.attitude = Attitude.AWAIT;
			}
		}

		return entity;
	}
	function makeItem(type,x,y,presets,inject,criteriaFn) {
		console.assert( x!==undefined && y!==undefined );
		type = type && !type.isRandom ? type : null;
		if( !type || !presets ) {
			// Note that even thought the type might be set here the inject.typeId is allowed to override it.
			// In practice they won't be different, but the inject.typeId might be a specifier like "weapon.sword"
			let filterString = inject && inject.typeFilter ? inject.typeFilter.replace(/random/,'') : (type ? type.typeId : '');
			if( !type || type.isTreasure ) {
				filterString += ' isTreasure';
			}
			type = picker.pickItem( filterString.trim(), criteriaFn );
			console.assert( type );
			presets = type.presets;
		}

		let item = area.map.itemCreateByType(x,y,type,presets,inject);
		if( type.gateDir !== undefined ) {
//			console.log( "Gate "+type.typeId+" at ("+x+","+y+") leads to "+(!inject ? 'TBD' : inject.toAreaId+' / '+inject.toGateId) );
//			console.log( "The item says "+item.toAreaId+' / '+item.toGateId );
		}
		console.assert( item.x!==undefined );

		let site = area.getSiteAt(x,y);
		if( site ) {
//			if( site.place && site.place.forbidTreasure ) debugger;
			site.treasureList.push(item);
		}

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
					//console.assert( !tileSet );
					map.tileSymbolSet(x,y,TileTypeList[typeId].symbol);
					tileSet = true;
					return;
				}
				if( MonsterTypeList[typeId] ) {
					if( !tileSet && !MonsterTypeList[typeId].noFloor ) { map.tileSymbolSetFloor(x,y); tileSet=true; }
					makeMonsterFn( MonsterTypeList[typeId], x, y, null, make, null );
					return;
				}
				if( !tileSet && !ItemTypeList[typeId].noFloor ) { map.tileSymbolSetFloor(x,y); tileSet = true; }
				// If you want a random item, use the item type "random" which is hard-coded to select a
				// random item. If you want to specify any item with 'silver' you simply can not.
				console.assert( ItemTypeList[typeId] );
				makeItemFn( ItemTypeList[typeId], x, y, null, make, null );	// the null means you have to generate presets for this item.
			});

		});
	}

	function populateAmong(map,floorList,count,safeToMakeFn,makeFn,criteriaFn) {
		floorList = [].concat(floorList);
		//console.assert( count <= floorList.length/2 );
		//console.assert( floorList.length );
		let madeList = [];
		while( floorList.length && madeList.length<count ) {
			let index = Math.randInt(0,floorList.length/2)*2;
			let x = floorList[index+0];
			let y = floorList[index+1];
			if( safeToMakeFn(map,x,y) ) {
				let e = makeFn(null,x,y,null,null,criteriaFn);
				if( e ) madeList.push(e);
			}
			floorList.splice(index,2);
		}
		return madeList;
	}

	function populate(map,count,safeToMakeFn,makeFn,criteriaFn) {
		let floorList = [];
		map.traverse( (x,y,type) => {
			if( type.isFloor && safeToMakeFn(map,x,y) ) {
				floorList.push(x,y);
			}
		});
		return populateAmong( map, floorList, count, safeToMakeFn, makeFn, criteriaFn );
	}

	function populateInRooms( siteList, map, count, safeToMakeFn, makeFn, criteriaFn, includeFn ) {
		let countOriginal = count;
		let nearList = [];
		//console.log('Sites: '+(siteList.filter(site=>site.isPlace||site.isRoom).length));
		siteList.forEach( site => {
			if( !includeFn(site) ) {
				return;
			}
			if( site.isPlace || site.isRoom ) {
				if( count > 0 ) {
					let toMake = 1;
					let madeList = populateAmong( map, site.marks, toMake, safeToMakeFn, makeFn, criteriaFn );
					if( madeList.length < toMake ) {
						nearList.push( site.id );
					}
					count -= madeList.length;
				}
			}
		});
		nearList.forEach( siteId => {
			let site = siteList.find( site=>site.isNear==siteId && includeFn(site) );
			if( site && count > 0 ) {
				let toMake = 1;
				let madeList = populateAmong( site.marks, toMake, safeToMakeFn, makeFn );
				count -= madeList.length;
			}
		});
		return countOriginal-count;
	}

	function postProcess(map, entityList) {
		map.traverse( (x,y,tile) => {
			if( tile.imgChoose ) {
				let tile = map.toEntity(x,y);
				tile.imgChoose.call(tile,map,x,y);
			}
		});
		new Finder( map.itemList ).process( item => {
			if( item.isSign && item.sign=='BYJOB' ) {
				new Finder(entityList,item).filter(entity=>entity.jobId).closestToMe().process( entity => {
					item.sign = String.capitalize(JobTypeList[entity.jobId].name);
				});
			}
			if( item.imgChoose ) {
				item.imgChoose.call(item,map,item.x,item.y);
			}
		});
		new Finder( entityList ).process( entity => {
			new Finder( entity.inventory ).process( item => {
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
	let isFriendFn = (e) => !isEnemyFn(e);
	
	extractEntitiesFromMap(area.map,injectList,makeMonster,makeItem);

	let totalFloor    = area.map.count( (x,y,type) => type.isFloor && safeToMake(area.map,x,y) ? 1 : 0);
	let totalEnemies  = Array.count( area.entityList, isEnemyFn );
	let totalFriends  = Array.count( area.entityList, isFriendFn );
	let totalItems    = Array.count( area.map.itemList, item => item.isTreasure );

	let owedEnemies   = Math.round( (totalFloor*theme.enemyDensity) );
	let owedFriends   = Math.round( (totalFloor*theme.friendDensity) );
	let owedItems     = Math.round( (totalFloor*theme.itemDensity) );

	console.log( "Map has "+totalFloor+" floor:" );
	console.log( "Enemies: ("+totalFloor+"x"+theme.enemyDensity+")="+owedEnemies+"-"+totalEnemies+"="+(owedEnemies-totalEnemies)+" enemies owed" );
	console.log( "Friends: ("+totalFloor+"x"+theme.friendDensity+")="+owedFriends+"-"+totalFriends+"="+(owedFriends-totalFriends)+" friends owed" );
	console.log( "Items  : ("+totalFloor+"x"+theme.itemDensity+")="+owedItems+"-"+totalItems+"="+(owedItems-totalItems)+" items owed" );

	totalEnemies += populateInRooms( area.siteList, area.map, owedEnemies-totalEnemies, safeToMake, makeMonster, isEnemyFn, site => {
		return !(site.isPlace && (site.place.comesWithMonsters || site.place.forbidEnemies));
	});

	totalFriends += populateInRooms( area.siteList, area.map, owedFriends-totalFriends, safeToMake, makeMonster, isFriendFn, site => {
		return !(site.isPlace && site.place.comesWithMonsters);
	});

	totalItems += populateInRooms( area.siteList, area.map, owedItems-totalItems, safeToMake, makeItem, e=>e.isTreasure, site => {
		return !(site.isPlace && (site.place.comesWithItems || site.place.forbidTreasure));
	});

	console.log( "Enemies: ("+totalFloor+"x"+theme.enemyDensity+")="+owedEnemies+"-"+totalEnemies+"="+(owedEnemies-totalEnemies)+" enemies owed" );
	console.log( "Friends: ("+totalFloor+"x"+theme.friendDensity+")="+owedFriends+"-"+totalFriends+"="+(owedFriends-totalFriends)+" friends owed" );
	console.log( "Items  : ("+totalFloor+"x"+theme.itemDensity+")="+owedItems+"-"+totalItems+"="+(owedItems-totalItems)+" items owed" );

	populate( area.map, Math.max(0,owedEnemies-totalEnemies), (map,x,y) => {
		let site = area.getSiteAt(x,y);
		if( site && site.place && site.place.forbidEnemies ) {
			return false;
		}
		return safeToMake(map,x,y);
	}, makeMonster, isEnemyFn );
	populate( area.map, Math.max(0,owedFriends-totalFriends), safeToMake, makeMonster, isFriendFn );
	populate( area.map, Math.max(0,owedItems-totalItems), (map,x,y) => {
		let site = area.getSiteAt(x,y);
		if( site && site.place && site.place.forbidTreasure ) {
			return false;
		}
		return safeToMake(map,x,y);
	}, makeItem, e=>e.isTreasure );

	postProcess(area.map, area.entityList);

//	area.siteList.forEach( site => {
//		console.log( "Site "+site.id+" ["+site.marks.length+"] monsters: "+site.denizenList.length+" items: "+site.treasureList.length );
//	});

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
		for( let entity of entityList ) {
			let group = ( entity.isUser() ? 0 : (entity.brainPet && entity.team==Team.GOOD ? 1 : 2 ));
			list[group].push(entity);
		}
		//list[2].sort( (a,b) => a.speed-b.speed );
		return [].concat(list[0],list[1],list[2]);
	}

	function tickItemList(itemList,dt) {
		for( let item of itemList ) {
			if( item.rechargeLeft > 0 ) {
				item.rechargeLeft = Math.max(0,item.rechargeLeft-1);
			}
			if( item.onTick ) {
				item.onTick.call(item,dt);
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

//On really huge maps entityList gets to be aroound 400 entities.
//So, do we really want to tick all of them? Or do we put them all on some
//kind of deferred schedule... And then only tick the last level around the gate that
//was used to get to the current level...

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

		if( theme.jobPick ) {
			this.jobPickTable = new PickTable().scanKeys(theme.jobPick);
			this.jobPicker = () => {
				if( this.jobPickTable.noChances() ) {
					this.jobPickTable.reset();
				}
				let jobId = this.jobPickTable.pick();
				this.jobPickTable.forbidLast();
				return jobId;
			}
		}


	}
	build(tileQuota) {
		return areaBuild(this,this.theme,tileQuota, (e) => e.team==Team.EVIL );
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
	getSiteAt(x,y) {
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

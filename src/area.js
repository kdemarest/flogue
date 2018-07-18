Module.add('area',function() {


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
				entity.attitudeBase = Attitude.AWAIT;
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
		if( item.bunchSize ) {
			item.bunch = item.bunchSize;
		}
		let container = area.map.findChosenItemAt(x,y,item=>item.isContainer);
		if( container && item.isContainer ) {
//			debugger;
			item.destroy();
			return null;
		}

		// NOTE: We want to count gaps here because we don't want impassable containers  blocking up passageways.
		// WARNING! What we really want is to do all this ad-hoc chest and barrel business AFTER
		// scanning the entire level. That way they won't interfere with place-created containers.
		if( !container && item.isContainable() && Math.chance(theme.containerChance||0) && area.map.countGaps(x,y)<=1 ) {
			let containerTypeId = Math.chance(50) ? 'barrel' : 'chest';
			container = area.map.itemCreateByType(x,y,ItemTypeList[containerTypeId],{},{});
		}
		if( container ) {
			let itemList = area.map.findItemAt(x,y).isContainable();
			itemList.forEach( item => item.giveTo(container,x,y) );
		}
		if( type.gateDir !== undefined ) {
//			console.log( "Gate "+type.typeId+" at ("+x+","+y+") leads to "+(!inject ? 'TBD' : inject.toAreaId+' / '+inject.toGateId) );
//			console.log( "The item says "+item.toAreaId+' / '+item.toGateId );
		}
		console.assert( item.x!==undefined );

		let site = area.getSiteAt(x,y);
		if( site ) {
//			if( site.place && site.place.forbidTreasure ) debugger;
			if( !site.treasureList.find( i=>i.id==item.id ) ) {
				// Check id because it might have been aggregated!
				site.treasureList.push(item);
			}
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
					// If this tile has more than just a spec for itself, then we better
					// make it isPosition so that it can be given all the other member vars.
					if( Object.countMembers(make) > 1 ) {
						let entity = map.toEntity(x,y);
						Object.assign( entity, make );
					}
					tileSet = true;
					return;
				}
				let m = MonsterTypeList[typeId];
				if( MonsterTypeList[typeId] ) {
					if( !tileSet ) {
						if( m.underMe ) map.tileSymbolSet(x,y,TypeIdToSymbol[m.underMe]);
						else map.tileSymbolSetFloor(x,y,map.defaultFloorSymbol);
						tileSet=true;
					}
					makeMonsterFn( m, x, y, null, make, null );
					return;
				}
				let i = ItemTypeList[typeId];
				if( !tileSet ) {
					if( i.underMe ) map.tileSymbolSet(x,y,TypeIdToSymbol[i.underMe]);
					else map.tileSymbolSetFloor(x,y,map.defaultFloorSymbol);
					tileSet=true;
				}
				// If you want a random item, use the item type "random" which is hard-coded to select a
				// random item. If you want to specify any item with 'silver' you simply can not.
				console.assert( i );
				makeItemFn( i, x, y, null, make, null );	// the null means you have to generate presets for this item.
			});

		});
	}

	function populateAmong(map,preferList,floorList,count,safeToMakeFn,makeFn,criteriaFn) {
		//console.assert( count <= floorList.length/2 );
		//console.assert( floorList.length );
		let madeList = [];

		function tryMake(list,index) {
			let x = list[index+0];
			let y = list[index+1];
			if( safeToMakeFn(map,x,y) ) {
				let e = makeFn(null,x,y,null,null,criteriaFn);
				if( e ) madeList.push(e);
			}
			list.splice(index,2);
		}

		while( preferList.length && madeList.length<count ) {
			tryMake(preferList,Math.randInt(0,preferList.length/2)*2);
		}

		while( floorList.length && madeList.length<count ) {
			tryMake(floorList,Math.randInt(0,floorList.length/2)*2);
		}
		return madeList;
	}

	function populate(map,preferFn,count,safeToMakeFn,makeFn,criteriaFn) {
		let floorList = [];
		map.traverse( (x,y,type) => {
			if( type.isFloor && safeToMakeFn(map,x,y) ) {
				floorList.push(x,y);
			}
		});
		let preferList = preferFn(map,floorList);
		return populateAmong( map, preferList, floorList, count, safeToMakeFn, makeFn, criteriaFn );
	}

	function populateInRooms( siteList, map, preferFn, count, safeToMakeFn, makeFn, criteriaFn, includeFn ) {
		let countOriginal = count;
		let nearList = [];
		//console.log('Sites: '+(siteList.filter(site=>site.isPlace||site.isRoom).length));
		siteList.forEach( site => {
			if( !includeFn(site) ) {
				return;
			}
			if( (site.isPlace || site.isRoom) && includeFn(site) ) {
				if( count > 0 ) {
					let toMake = 1;
					let floorList = [].concat(site.marks);
					let preferList = preferFn(map,floorList);
					let madeList = populateAmong( map, preferList, floorList, toMake, safeToMakeFn, makeFn, criteriaFn );
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
				let floorList = [].concat(site.marks);
				let preferList = preferFn(map,floorList);
				let madeList = populateAmong( map, preferList, floorList, toMake, safeToMakeFn, makeFn, criteriaFn );
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
				console.assert( typeof tile.img == 'string' );
			}
		});
		new Finder( map.itemList ).forEach( item => {
			if( item.isSign && item.sign=='BYJOB' ) {
				new Finder(entityList,item).filter(entity=>entity.jobId).closestToMe().forEach( entity => {
					item.sign = String.capitalize(JobTypeList[entity.jobId].name);
				});
			}
			if( item.imgChoose ) {
				item.imgChoose.call(item,map,item.x,item.y);
				console.assert( typeof item.img == 'string' );
			}
		});
		new Finder( entityList ).forEach( entity => {
			new Finder( entity.inventory ).forEach( item => {
			});
		});
	}

	function preferNone(map,floorList) {
		return [];
	}

	function preferAlcoves(map,floorList) {
		let preferList = [];
		Array.filterPairsInPlace( floorList, (x,y) => {
			let c = map.count8( x, y, (x,y,tile)=>tile.isWall );
			if( c >= 5 ) {
				preferList.push(x,y);
				return false;
			}
			return true;
		});
		return preferList;
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

	area.siteList.forEach( site => {
		if( !site.marks ) return;
		for( let i=0 ; i<site.marks.length ; i+=2 ) {
			let x = site.marks[i+0];
			let y = site.marks[i+1];
			area.map.siteLookup[y*area.map.xLen+x] = site;
		}
	});

	extractEntitiesFromMap(area.map,injectList,makeMonster,makeItem);

	let totalFloor    = area.map.count( (x,y,type) => type.isFloor && safeToMake(area.map,x,y) ? 1 : 0);
	let totalEnemies  = Array.count( area.entityList, isEnemyFn );
	let totalFriends  = Array.count( area.entityList, isFriendFn );
	let totalItems    = Array.count( area.map.itemList, item => {
		let n = item.isTreasure ? 1 : 0;
		if( item.inventory ) {
			n += Array.count( item.inventory, item => item.isTreasure );
		}
		return n;
	});

	let owedEnemies   = Math.round( (totalFloor*theme.enemyDensity) );
	let owedFriends   = Math.round( (totalFloor*theme.friendDensity) );
	let owedItems     = Math.round( (totalFloor*theme.itemDensity) );

	console.log( "Map has "+totalFloor+" floor:" );
	console.log( "Enemies: ("+totalFloor+"x"+theme.enemyDensity+")="+owedEnemies+"-"+totalEnemies+"="+(owedEnemies-totalEnemies)+" enemies owed" );
	console.log( "Friends: ("+totalFloor+"x"+theme.friendDensity+")="+owedFriends+"-"+totalFriends+"="+(owedFriends-totalFriends)+" friends owed" );
	console.log( "Items  : ("+totalFloor+"x"+theme.itemDensity+")="+owedItems+"-"+totalItems+"="+(owedItems-totalItems)+" items owed" );

	totalEnemies += populateInRooms( area.siteList, area.map, preferNone, owedEnemies-totalEnemies, safeToMake, makeMonster, isEnemyFn, site => {
//		console.log( 'pop room consider site '+(!site?'none':site.id) );
		return !(site.isPlace && (site.place.comesWithMonsters || site.place.forbidEnemies));
	});

	totalFriends += populateInRooms( area.siteList, area.map, preferNone, owedFriends-totalFriends, safeToMake, makeMonster, isFriendFn, site => {
		return !(site.isPlace && site.place.comesWithMonsters);
	});

	totalItems += populateInRooms( area.siteList, area.map, preferAlcoves, owedItems-totalItems, safeToMake, makeItem, e=>e.isTreasure, site => {
		return !(site.isPlace && (site.place.comesWithItems || site.place.forbidTreasure));
	});

	console.log( "Enemies: ("+totalFloor+"x"+theme.enemyDensity+")="+owedEnemies+"-"+totalEnemies+"="+(owedEnemies-totalEnemies)+" enemies owed" );
	console.log( "Friends: ("+totalFloor+"x"+theme.friendDensity+")="+owedFriends+"-"+totalFriends+"="+(owedFriends-totalFriends)+" friends owed" );
	console.log( "Items  : ("+totalFloor+"x"+theme.itemDensity+")="+owedItems+"-"+totalItems+"="+(owedItems-totalItems)+" items owed" );

	populate( area.map, preferNone, Math.max(0,owedEnemies-totalEnemies), (map,x,y) => {
		let site = area.getSiteAt(x,y);
		if( site && site.place && site.place.forbidEnemies ) {
			return false;
		}
//		console.log( 'pop consider ('+x+','+y+') site='+(!site?'none':site.id) );
		return safeToMake(map,x,y);
	}, makeMonster, isEnemyFn );
	populate( area.map, preferNone, Math.max(0,owedFriends-totalFriends), safeToMake, makeMonster, isFriendFn );
	populate( area.map, preferAlcoves, Math.max(0,owedItems-totalItems), (map,x,y) => {
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

	if( Light.Caster ) {
		area.lightCaster = new Light.Caster( area.vis );
	}

	return area;
}

function tick(speed,map,entityListRaw) {

	function orderByTurn(entityList) {
		let list = [[],[],[]];	// players, pets, others
		for( let entity of entityList ) {
			let group = ( entity.isUser() ? 0 : (entity.brainPet && entity.team==Team.GOOD ? 1 : 2 ));
			list[group].push(entity);
		}
		//list[2].sort( (a,b) => a.speed-b.speed );
		return [].concat(list[0],list[1],list[2]);
	}

	function tickItemList(_itemList,dt,rechargeRate) {
		console.assert(rechargeRate);
		let itemList = _itemList.slice();	// Any item might get destroyed during this process.
		for( let item of itemList ) {
			item.tick(dt,rechargeRate);
		}
	}

	function checkDeaths(entityListNotAuthoritative) {
		// This is complicated, as death always is. Anyone could have moved to a different area,
		// so we have to prune the CORRECT entity list
		entityListNotAuthoritative.forEach( entity => {
			if( entity.isDead() ) {
				let died = entity.die();
				if( died ) {
					let killId = entity.id;
					Array.filterInPlace( entity.entityList, entity => entity.id!=killId );
				}
			}
		});
	}

	if( speed === false ) {
		let player = entityListRaw.find( entity => entity.isUser() );
		player.calculateVisbility();
		player.act(false);
		// Time is not passing, so do not tick items.
		DeedManager.calc(player);
		player.clearCommands();
		return;
	}

//On really huge maps entityList gets to be aroound 400 entities.
//So, do we really want to tick all of them? Or do we put them all on some
//kind of deferred schedule... And then only tick the last level around the gate that
//was used to get to the current level...

	let entityListByTurnOrder = orderByTurn(entityListRaw);
	let dt = 1 / speed;
	for( let entity of entityListByTurnOrder ) {
		DeedManager.tick(entity,dt);
		entity.actionCount += entity.speed / speed;
		while( entity.actionCount >= 1 ) {
			entity.calculateVisbility();
			entity.think();
			entity.act();
			// DANGER! At this moment the entity might have changed areas!
			tickItemList(entity.inventory,dt,entity.rechargeRate||1);
			DeedManager.calc(entity);
			entity.actionCount -= 1;
		}
	}
	DeedManager.tick(null,dt);	// this ticks the positions...
	map.actionCount += 1 / speed;
	while( map.actionCount >= 1 ) {
		// WARNING! There is some risk that an item could tick twice here, or not at all, if an entity caused something to
		// pop out of another entity's inventory. But the harm seems small. I hope.
		tickItemList(map.itemList,dt,1);
		map.actionCount -= 1;
	}
	DeedManager.cleanup();
	entityListByTurnOrder.forEach( entity => entity.clearCommands() );
	checkDeaths(entityListByTurnOrder);
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
		this.picker = new Picker(depth);

		// NOTE: Move this into the areaBuild() at some point.
		if( theme.jobPick ) {
			this.jobPickTable = new Pick.Table().scanKeys(theme.jobPick);
			this.jobPicker = (filter) => {
				let pickTable = this.jobPickTable;
				if( pickTable.noChances() ) {
					pickTable.reset();
				}
				if( filter ) {
					// WARNING! All of the QUALIFYING jobs might have already
					// been driven to zero. So reset and let its chance numbers go negative.
					pickTable = new Pick.Table().scanPickTable(this.jobPickTable,(jobId,chance) => JobTypeList[jobId][filter] ? chance : 0);
					if( pickTable.noChances() ) {
						let temp = new Pick.Table().scanKeys(theme.jobPick);
						pickTable = new Pick.Table().scanPickTable(temp,(jobId,chance) => JobTypeList[jobId][filter] ? chance : 0);
					}
				}
				let jobId = pickTable.pick();
				// NUANCE! The index in the filtered table will just HAPPEN to be identical due to the implementation of scanPickTable.
				this.jobPickTable.indexPicked = pickTable.indexPicked;
				this.jobPickTable.decrementLast(1);		// won't have effect apply if a filter is present!!
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
	castLight() {
		// Darkvision hack... which sadly works great.
		// The RIGHT way to do this is for the createDrawList, just before it
		// starts compiling, to say if( obs.darkVision > obs.light ) castOne( obs.x, obs.y, obs.darkVision )
		// Observer might not exist in this area! So make a throw-away object if so.
		let observer = this.entityList.find( e=>e.userControllingMe ) || {};
		let oldLight = observer.light;
		observer.light = Math.max(observer.darkVision||0,observer.light||0);

		this.lightCaster.castAll(
			this.map,
			this.vis.opacityLookup,
			this.entityList,
			this.map.itemList,
			Animation.list.filter( a=>a.areaId==this.areaId )
		);

		observer.light = oldLight;
	}
	tick(speed) {
		tick( speed, this.map, this.entityList );
		this.castLight();
	}
	pickSite(fn) {
		let list = this.siteList.filter( fn );
		let n = Math.randInt(0,list.length);
		return list[n];
	}
	getSiteAt(x,y) {
		return this.map.getSiteAt(x,y);
	}
}

return {
	Area: Area
}

});

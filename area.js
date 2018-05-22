class AreaBuilder {
	constructor(level) {
		this.level = level;
	}

	buildTables() {
		this.monster = [];
		this.item = [];

		function add(count,typeId) {
			while( count-- ) {
				table.push(typeId);
			}
		}
		for( let typeId in MonsterTypeList ) {
			let m = MonsterTypeList[typeId];
			if( m.level > this.level || m.neverPick ) {
				continue;
			}
			let chance = Math.floor(Math.clamp(Math.chanceToAppearSimple(m.level,this.level) * 100000, 1, 100000));
			chance *= (m.rarity || 1);
			this.monster.push(chance,m);
		}

		let one = { nothing: { skip:true, level:0 } };
		Object.each(ItemTypeList, item => {
			let startIndex = this.item.length;
			let chanceTotal = 0;
			Object.each( item.varieties || one, v => {
				Object.each( item.materials || one, m => {
					Object.each( item.qualities || one, q => {
						Object.each( item.effectChoices || one, e => {
							let level = (item.level||0) + (v.level||0) + (m.level||0) + (q.level||0) + (e.level||0);
							if( level > this.level || item.neverPick || v.neverPick || m.neverPick || q.neverPick || e.neverPick ) {
								return;
							}
							let chance = Math.floor(Math.clamp(Math.chanceToAppearSigmoid(level,this.level) * 100000, 1000, 100000));
							chance *= (v.rarity||1) * (m.rarity||1) * (q.rarity||1) * (e.rarity||1);
							chanceTotal += chance;
							let obj = { typeId: item.typeId, item: item, presets: {} };
							if( !v.skip ) obj.presets.variety = v;
							if( !m.skip ) obj.presets.material = m;
							if( !q.skip ) obj.presets.quality = q;
							if( !e.skip ) obj.presets.effectType = e;
							this.item.push(chance,obj);
						});
					});
				});
			});
			// Now rebalance because the number of varieties should not tilt the chance...
			if( chanceTotal ) {
				let ratio = (100000 / chanceTotal) * (item.rarity||1);
				console.log(item.typeId+' balanced by '+ratio);
				for( let i=startIndex ; i<this.item.length ; i+=2 ) {
					this.item[i] = Math.clamp(Math.floor(this.item[i]*ratio),1,100000);
				}
			}
		});
	}

	pick(tableName,typeId) {
		let table = this[tableName];
		let total = 0;
		for( let i=0 ; i<table.length ; i += 2 ) {
			if( !typeId || table[i+1].typeId == typeId ) {
				total += table[i];
			}
		}
		if( !total ) {
			return false;
		}
		let n = Math.rand(0,total);
		let i = -2;
		do {
			i += 2;
			if( !typeId || table[i+1].typeId == typeId ) {
				n -= table[i];
			}
		} while( n>0 );
		if( i>table.length ) {
			debugger;
		}

		return table[i+1];
	}

	buildMap(style) {
		let tileRaw = Mason.buildMap(style,TileTypeList,MonsterTypeList,ItemTypeList);
		return tileRaw;
	}

	populate(map,density,makeFn) {
		map.traverse( (x,y) => {
			let symbol = map.tileSymbolGet(x,y);
			if( symbol == TileTypeList.floor.symbol && Math.rand(0,1)<density ) {
				makeFn(x,y,null);
			}
		});
	}

	preparePlaceForInjection(place) {

		// If any of the symbols are pickable, get that done.
		for( let s in place.symbols ) {
			if( typeof place.symbols[s] == 'function' ) {
				place.symbols[s] = place.symbols[s].call(place);
			}
		}

		// Replace map symbols with allocated symbols
		place.mapOriginal = place.map.trim();
		let map = '';
		for( let i=0 ; i<place.mapOriginal.length ; ++i ) {
			let s = place.mapOriginal.charAt(i);
			if( s=='\t' ) { continue; }
			if( s=='\n' ) { map+=s; continue; }
			let mappedToTypeId = place.symbols[s];
			// Check if the place chose to used ad-hoc symbology for something
			if( mappedToTypeId ) {
				s = TypeToSymbol[mappedToTypeId];
			}
			if( !SymbolToType[s] ) debugger;	// By now we should have resolved what this symbol maps to
			map += s;
		}
		place.map = new SimpleMap(map);

		if( place.flags && place.flags.rotate ) {
			place.map.rotate(Math.randInt(0,4));
		}
	}

	injectPlaces(map,numPlaces) {
		let entityInject = {};
		let placeReps = numPlaces;
		while( placeReps-- ) {
			let place = Object.assign( {}, pick(PlaceSourceList) );
			console.log("Trying place "+place.id);
			this.preparePlaceForInjection(place);
			let fitReps = 300;
			let x,y;
			do {
				[x,y] = map.pickPos(0,0,place.map.xLen,place.map.yLen);
				console.log('('+x+','+y+')');
			} while( !map.fit(x,y,place.map) && --fitReps );
			if( fitReps ) {
				map.inject(x,y,place.map,function(x,y,symbol) {
					let typeId = SymbolToType[symbol];
					if( !typeId ) debugger;
					if( place.onEntityCreate && place.onEntityCreate[typeId] ) {
						entityInject[''+x+','+y] = place.onEntityCreate[typeId];
					}
				});
			}
		}
		return entityInject;
	}

	extractEntitiesFromMap(map,entityList,gateList,entityInject,itemMakeFn) {
		let noEntity = {};

		map.traverse( (x,y) => {
			// Note that this code uses the SIMPLEST function that do NOT assume
			// what is on the map...
			let symbol = map.tileSymbolGet(x,y);

			let entityType = SymbolToType[symbol];
			if( !entityType ) {
				debugger;
			}
			// CREATE MONSTERS
			let inject = entityInject[''+x+','+y] || noEntity;
			if( entityType && entityType.isMonsterType ) {
				let fnName = entityType.brain == 'user' ? 'unshift' : 'push';
				entityList[fnName]( new Entity( map, entityList, entityType, { x:x, y:y }, inject ) );
				map.tileSymbolSet(x,y,TileTypeList.floor.symbol)
			}
			// CREATE ITEMS
			if( entityType && entityType.isItemType ) {
				itemMakeFn(x,y,entityType,inject);
				// WARNING: We could set this more carefully, like by checking around it and using majority
				// of passable tiles.
				map.tileSymbolSet(x,y,TileTypeList.floor.symbol);
			}
		});

		// When there is only one monster, we are probably testing, so watch it.
		if( entityList.length == 2 ) {
			// zero will be the player
			entityList[entityList.length-1].watch = true;
		}
	}
};

class Area {
	constructor(areaId,level,entrance) {
		this.id = areaId;
		this.level = level;
		this.mapMemory = [];
		this.builder = new AreaBuilder(level);
		this.builder.buildTables();
		let sideDimension = Math.randInt(40,150);
		//let tileRaw = loadLevel('test');

		let style = {
			architecture: "cave",
			entrance: entrance,
			level: level,
			dim: sideDimension,
			floorDensity: Math.rand(0.40,0.70),
			monsterDensity: 0.01,
			itemDensity: level==1 ? 0.20 : 0.01
		};

		let self = this;
		function makeMonster(x,y) {
			let entityType = self.builder.pick('monster');
			self.entityList.push( new Entity( self.map, self.entityList, entityType, { x:x, y:y } ) );
		}
		function makeItem(x,y,type,inject) {
			if( type && type.isRandom ) {
				type = null;
			}
			let obj = self.builder.pick('item',type ? type.typeId : null);
			if( obj === false ) {
				obj = { item: type };
			}
			let item = new Item( self.map, obj.item, { x:x, y:y }, inject, obj.presets );
			self.map.itemList.push( item );
			if( item.gateDir !== undefined ) {
				self.gateList.push(item);
			}
		}

		let tileRaw = this.builder.buildMap(style);
		this.map = new Map(tileRaw,[]);
		this.map.level = level;

		let numPlacesToInject = Math.floor(sideDimension/1);
		let entityInject = this.builder.injectPlaces(this.map,numPlacesToInject);
		this.entityList = [];
		this.gateList = [];

		this.builder.populate( this.map, style.monsterDensity, makeMonster );
		this.builder.populate( this.map, style.itemDensity, makeItem );
		this.builder.extractEntitiesFromMap(this.map,this.entityList,this.gateList,entityInject,makeItem);
		return this;
	}
	getGate(gateDir,onlyUnused) {
		let g = this.gateList.filter( g => g.gateDir==gateDir && (!onlyUnused || !g.toAreaId) );
		if( !g.length ) debugger;
		return g[0];
	}
}

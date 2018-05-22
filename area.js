class Picker {
	constructor(level) {
		this.level = level;
	}

	buildPlaceTable() {
		let placeTable = [];
		for( let placeId in PlaceSourceList ) {
			let p = PlaceSourceList[placeId];
			if( p.level > this.level || p.neverPick ) {
				continue;
			}
			let placeLevel = p.level || this.level;
			let chance = Math.floor(Math.clamp(Math.chanceToAppearSimple(placeLevel,this.level) * 100000, 1, 100000));
			chance *= (p.rarity || 1);
			placeTable.push(chance,p);
		}
		return placeTable;
	}

	buildMonsterTable() {
		let monsterTable = [];
		for( let typeId in MonsterTypeList ) {
			let m = MonsterTypeList[typeId];
			if( m.level > this.level || m.neverPick ) {
				continue;
			}
			let chance = Math.floor(Math.clamp(Math.chanceToAppearSimple(m.level,this.level) * 100000, 1, 100000));
			chance *= (m.rarity || 1);
			monsterTable.push(chance,m);
		}
		return monsterTable;
	}

	buildItemTable() {
		let itemTable = [];

		let one = { nothing: { skip:true, level:0 } };
		Object.each(ItemTypeList, item => {
			let startIndex = itemTable.length;
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
							itemTable.push(chance,obj);
						});
					});
				});
			});
			// Now rebalance because the number of varieties should not tilt the chance...
			if( chanceTotal ) {
				let ratio = (100000 / chanceTotal) * (item.rarity||1);
				console.log(item.typeId+' balanced by '+ratio);
				for( let i=startIndex ; i<itemTable.length ; i+=2 ) {
					itemTable[i] = Math.clamp(Math.floor(itemTable[i]*ratio),1,100000);
				}
			}
		});
		return itemTable;
	}

	pick(table,typeId) {
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


}

class AreaBuilder {
	constructor(picker) {
		this.picker = picker;
	}

	buildMap(style) {
		let tileRaw = Mason.buildMap(style,TileTypeList,MonsterTypeList,ItemTypeList);
		return tileRaw;
	}

	populate(map,density,makeFn) {
		map.traverse( (x,y) => {
			let type = map.tileTypeGet(x,y);
			if( type.isFloor && Math.rand(0,1)<density ) {
				makeFn(x,y);
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

	injectPlaces(map,numPlaces,pickPlaceFn) {
		let entityInject = {};
		let placeReps = numPlaces;
		while( placeReps-- ) {
			let place = Object.assign( {}, pickPlaceFn() );
			console.log("Trying place "+place.id);
			this.preparePlaceForInjection(place);
			let fitReps = 100;
			let x,y;
			do {
				[x,y] = map.pickPos(0,0,place.map.xLen,place.map.yLen);
				//console.log('('+x+','+y+')');
			} while( !map.fit(x,y,place.map) && --fitReps );
			if( fitReps ) {
				map.inject(x,y,place.map,function(x,y,symbol) {
					let type = SymbolToType[symbol];
					if( !type ) debugger;
					if( place.onEntityCreate && place.onEntityCreate[type.typeId] ) {
						entityInject[''+x+','+y] = place.onEntityCreate[type.typeId];
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

		let picker = new Picker(level);
		picker.monsterTable = picker.buildMonsterTable();
		picker.itemTable = picker.buildItemTable();
		picker.placeTable = picker.buildPlaceTable();
		this.builder = new AreaBuilder(picker);

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
			let entityType = picker.pick(picker.monsterTable);
			self.entityList.push( new Entity( self.map, self.entityList, entityType, { x:x, y:y } ) );
		}
		function makeItem(x,y,type,inject,presets) {
			if( !type || type.isRandom ) {
				let obj = picker.pick(picker.itemTable,type ? type.typeId : null);
				if( obj !== false ) {
					type = obj.item;
					presets = obj.presets;
				}
			}

			if( self.map.tileTypeGet(x,y).typeId === 'wall' ) {
				debugger;
			}
			let item = self.map.itemCreateByType(x,y,type,inject,presets);
			console.log( item.name+' created at ('+x+','+y+') on '+self.map.tileTypeGet(x,y).typeId );
			if( item.gateDir !== undefined ) {
				self.gateList.push(item);
			}
		}
		function pickPlace() {
			return picker.pick(picker.placeTable);
		}

		let tileRaw = loadLevel(areaId) || this.builder.buildMap(style);
		this.map = new Map(tileRaw,[]);
		this.map.level = level;

		let numPlacesToInject = Math.floor(sideDimension/1);
		let entityInject = this.builder.injectPlaces(this.map,numPlacesToInject,pickPlace);
		this.entityList = [];
		this.gateList = [];

		//this.builder.populate( this.map, style.monsterDensity, makeMonster );
		//this.builder.populate( this.map, style.itemDensity, makeItem );
		this.builder.extractEntitiesFromMap(this.map,this.entityList,this.gateList,entityInject,makeItem);
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


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
			console.log("Trying to place "+place.id);
			this.preparePlaceForInjection(place);
			let fitReps = 100;
			let x,y;
			let clear;
			do {
				[x,y] = map.pickPos(0,0,place.map.xLen,place.map.yLen);
				clear = map.fit(x,y,place.map);
			} while( !clear && --fitReps );
			if( clear ) {
				console.log('Placed at ('+x+','+y+')');
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
			placeDensity: 0.2,
			floorDensity: Math.rand(0.40,0.70),
			monsterDensity: 0.01, //Monster Density
			itemDensity: level==1 ? 0.20 : 0.03 //Item Density

		};

		let self = this;
		function makeMonster(x,y) {
			let entityType = picker.pick(picker.monsterTable);
			self.entityList.push( new Entity( self.map, self.entityList, entityType, { x:x, y:y } ) );
		}
		function makeItem(x,y,type,inject,presets) {
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

			if( self.map.tileTypeGet(x,y).typeId === 'wall' ) {
				debugger;
			}
			let item = self.map.itemCreateByType(x,y,type,inject,presets);
			//console.log( item.name+' created at ('+x+','+y+') on '+self.map.tileTypeGet(x,y).typeId );
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

		let numPlacesToInject = Math.floor(Math.sqrt(this.map.xLen*this.map.yLen)*style.placeDensity);
		let entityInject = this.builder.injectPlaces(this.map,numPlacesToInject,pickPlace);
		this.entityList = [];
		this.gateList = [];

		this.builder.populate( this.map, style.monsterDensity, makeMonster );
		this.builder.populate( this.map, style.itemDensity, makeItem );
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

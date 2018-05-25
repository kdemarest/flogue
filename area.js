
class AreaBuilder {
	constructor(picker) {
		this.picker = picker;
	}

	buildMap(scape,palette) {
		let map = Mason.buildMap(scape,palette);
		let tileRaw = map.renderToString();
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
		let tileCount = 0;

		// If any of the symbols are pickable, get that done.
		for( let s in place.symbols ) {
			if( typeof place.symbols[s] == 'function' ) {
				place.symbols[s] = place.symbols[s].call(place);
				console.log(place.id+" chose "+s+"="+place.symbols[s]);
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
				if( !TypeToSymbol[mappedToTypeId] ) {
					console.log('ERROR: Place '+place.id+' uses unknown type '+mappedToTypeId);
					map += TileTypeList.floor.symbol;
					continue;
				}
				s = TypeToSymbol[mappedToTypeId];
			}
			if( !SymbolToType[s] ) {
				console.log('ERROR: unknown symbol ['+s+']');
				map += TileTypeList.floor.symbol;
				debugger;	// By now we should have resolved what this symbol maps to
				continue;
			}
			map += s;
		}
		place.map = new SimpleMap(map);

		if( place.flags && place.flags.rotate ) {
			place.map.rotate(Math.randInt(0,4));
		}
		return tileCount;
	}

	injectPlaces(map,numPlaceTiles,pickPlaceFn) {
		let entityInject = {};
		let reps = 40;
		while( numPlaceTiles && reps-- ) {
			// WARNING! Important for this to be a DEEP copy.
			let place = jQuery.extend(true, {}, pickPlaceFn());

			console.log("Trying to place "+place.id);
			let tileCount = this.preparePlaceForInjection(place);
			let fitReps = 100;
			let x,y;
			let fits;
			do {
				[x,y] = map.pickPos(0,0,place.map.xLen,place.map.yLen);
				fits = map.fit(x,y,place.map);
			} while( !fits && --fitReps );
			if( fits ) {
				console.log('Placed at ('+x+','+y+')');
				map.inject(x,y,place.map,function(x,y,symbol) {
					let type = SymbolToType[symbol];
					if( !type ) debugger;
					if( place.onEntityCreate && place.onEntityCreate[type.typeId] ) {
						entityInject[''+x+','+y] = place.onEntityCreate[type.typeId];
					}
				});
				numPlaceTiles -= tileCount;
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
				// WARNING: Set the underlying tile symbol first so that the entity you're placing doesn't collide with it.
				map.tileSymbolSetFloor(x,y)
				entityList[fnName]( new Entity( map, entityList, entityType, { x:x, y:y }, inject ) );
			}
			// CREATE ITEMS
			if( entityType && entityType.isItemType ) {
				// WARNING: Set the underlying tile symbol first so that the entity you're placing doesn't collide with it.
				map.tileSymbolSetFloor(x,y);
				itemMakeFn(x,y,entityType,null,inject);	// the null means you have to generate presets for this item.
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
	constructor(areaId,level,theme,isCore) {
		this.id = areaId;
		this.level = level;
		this.isCore = isCore;
		this.theme = theme;
		this.mapMemory = [];
	}

	build(palette) {

		let self = this;
		let placeCount = [];
		PickerSetTheme(this.theme);	// WARNING! Horrible hack. But it works for now.

		function makeMonster(x,y) {
			let entityType = picker.pick(picker.monsterTable);
			self.entityList.push( new Entity( self.map, self.entityList, entityType, { x:x, y:y } ) );
		}
		function makeItem(x,y,type,presets,inject) {
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
			//console.log( item.name+' created at ('+x+','+y+') on '+self.map.tileTypeGet(x,y).typeId );
			if( item.gateDir !== undefined ) {
				self.gateList.push(item);
			}
		}

		function pickPlace() {
			let reps = 5;
			let place;
			do {
				place = picker.pick(picker.placeTable);
			} while( reps-- && Math.chance((placeCount[place.id]||0)*30) );
			placeCount[place.id] = (placeCount[place.id]||0)+1;
			return place;
		}

		let picker = new Picker(this.level,this.theme);
		this.builder = new AreaBuilder(picker);

		let scapeId = pick(this.theme.scapes);
		let scape = Object.assign(
			{
				placeDensity: 0.20,
				monsterDensity: 0.01,
				itemDensity: 0.008
			}, 
			ScapeList[scapeId](),
			{
				level: this.level,
				entranceCount: 1,
				exitCount: 1
			}
		);
		this.scape = scape;

		let tileRaw = loadLevel(this.id) || this.builder.buildMap(scape,palette);

		this.map = new Map(tileRaw,[]);
		this.map.level = this.level;

		let numPlaceTiles = Math.floor(this.map.xLen*this.map.yLen*scape.floorDensity*scape.placeDensity);
		let entityInject = this.builder.injectPlaces(this.map,numPlaceTiles,pickPlace);
		this.entityList = [];
		this.gateList = [];

		this.builder.populate( this.map, scape.monsterDensity, makeMonster );
		this.builder.populate( this.map, scape.itemDensity, makeItem );
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

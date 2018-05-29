
let Place = {
	selectSymbols: function(place) {
		// If any of the symbols are pickable, get that done.
		for( let s in place.symbols ) {
			if( typeof place.symbols[s] == 'function' ) {
				place.symbols[s] = place.symbols[s].call(place);
				console.log(place.id+" chose "+s+"="+place.symbols[s]);
			}
		}
	},
	generateMap: function(place) {
		if( !place.map && !place.floodId ) debugger;
		if( !place.map ) {
			return;
		}
		// Replace map symbols with allocated symbols
		place.mapOriginal = place.map;
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
			if( !SymbolToType[s] && s!==TILE_UNKNOWN ) {
				console.log('ERROR: unknown symbol ['+s+']');
				map += TileTypeList.floor.symbol;
				debugger;	// By now we should have resolved what this symbol maps to
				continue;
			}
			map += s;
		}
		place.map = new SimpleMap(map);
	},
	rotateIfNeeded: function(place) {
		if( place.flags && place.flags.rotate && place.map ) {
			place.map.rotate(Math.randInt(0,4));
		}
	}
};


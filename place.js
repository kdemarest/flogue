
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
		let y=0;
		let x=-1;
		for( let i=0 ; i<place.mapOriginal.length ; ++i ) {
			let s = place.mapOriginal.charAt(i);
			if( s=='\t' ) { continue; }
			if( s=='\n' ) { map+=s; ++y; x=-1; continue; }
			++x;
			let typeId;
			let option = place.symbols[s];
			if( typeof option == 'string' ) {
				typeId = option.split('.')[0];
				if( option.indexOf('.')>=0 ) {
					option = { type: option };
				}
			}
			if( option !== undefined && typeof option == 'object' ) {
				console.assert( option.type );
				let pPos = ''+x+','+y;
				typeId = option.type.split('.')[0];
				place.inject = (place.inject||{});
				place.inject[pPos] = place.inject[pPos] || {};
				place.inject[pPos][typeId] = option;
			}
			// Check if the place chose to used ad-hoc symbology for something
			if( typeId ) {
				if( !TypeIdToSymbol[typeId] ) {
					console.log('ERROR: Place '+place.id+' uses unknown type '+typeId);
					map += TileTypeList.floor.symbol;
					continue;
				}
				s = TypeIdToSymbol[typeId];
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


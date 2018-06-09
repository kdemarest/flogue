
class Place {
	constructor(place) {
		Object.assign( this, place );
		this.inject = this.inject || {};
	}
	selectSymbols() {
		// If any of the symbols are pickable, get that done.
		for( let s in this.symbols ) {
			if( Array.isArray(this.symbols[s]) ) {
				this.symbols[s] = pick(this.symbols[s]);
				console.log(this.id+" chose "+s+"="+this.symbols[s]);
			}
		}
	}
	generateStringMap() {
		if( !this.map && !this.floodId ) debugger;
		if( !this.map ) {
			return;
		}
		// Replace map symbols with allocated symbols
		if( typeof this.map === 'string' ) {
			this.mapOriginal = this.map;
		}
		this.selectSymbols();
		let map = '';
		let y=0;
		let x=-1;
		for( let i=0 ; i<this.mapOriginal.length ; ++i ) {
			let s = this.mapOriginal.charAt(i);
			if( s=='\t' ) { continue; }
			if( s=='\n' ) { map+=s; ++y; x=-1; continue; }
			++x;
			let typeId;
			let option = this.symbols[s];

			// When you specify symbol.w: 'weapon.dagger' this triggers
			if( typeof option == 'string' ) {
				typeId = option.split('.')[0];
				if( option.indexOf('.')>=0 ) {
					option = { typeId: option };
				}
			}
			// When you specify symbol.w: { typeId: 'weapon.dagger', isWonderful: true } this triggers
			if( option !== undefined && typeof option == 'object' ) {
				console.assert( option.typeId );
				let pPos = ''+x+','+y;
				typeId = option.typeId.split('.')[0];
				this.inject[pPos] = this.inject[pPos] || {};
				this.inject[pPos][typeId] = option;
			}
			// Check if the place chose to used ad-hoc symbology for something
			if( typeId ) {
				if( !TypeIdToSymbol[typeId] ) {
					console.log('ERROR: Place '+this.id+' uses unknown type '+typeId);
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
		return map;
	}
	generateMap() {
		if( !this.map && !this.floodId ) debugger;
		if( !this.map ) {
			return;
		}
		let mapString = this.generateStringMap();
		this.map = new SimpleMap(mapString);
	}
	rotateIfNeeded(rotation) {
		if( this.flags && this.flags.rotate && this.map ) {
			if( rotation === undefined || rotation === null ) {
				rotation = Math.randInt(0,4);
			}
			this.map.rotate(rotation,this.inject);
		}
	}
	mayPick(depth) {
		if( this.neverPick || (this.level != 'any' && this.level > depth) ) {
			return false;
		}
		return true;
	}
	calcChance(depth,rarity) {
		let placeLevel = (this.level=='any' ? depth : this.level);
		let appear = Math.floor(Math.clamp(Math.chanceToAppearSimple(placeLevel,depth) * 100000, 1, 100000));
		return appear * (rarity || 1);
	}
	containsAny(symbolArray) {
		if( !this.map ) {
			return false;
		}
		for( let i=0 ; i<symbolArray.length ; ++i ) {
			if( this.symbolHash[symbolArray[i]] ) {
				return true;
			}
		}
		return false;
	}

};

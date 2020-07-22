Module.add('place',function() {


class Place {
	constructor(place) {
		Object.assign( this, place );
		this.inject = this.inject || {};
	}
	generateStringMap(DefaultFloor,DefaultWall) {

		function containsAnyFieldExcept(obj,fieldList) {
			for( let key in obj ) {
				if( !fieldList.includes(key) ) {
					return true;
				}
			}
			return false;
		}

		if( !this.map && !this.floodId ) debugger;
		if( !this.map ) {
			return;
		}
		// Replace map symbols with allocated symbols
		if( typeof this.map === 'string' ) {
			let temp = this.map.replace(/\t/g,'');
			let lines = temp.split('\n');
			Array.filterInPlace( lines, line => line.trim().length > 0 );
			this.mapOriginal = lines.join('\n');
		}

		let pickCache = {};
		// WEIRD! If a floor type is to be chosen, it MUST be chosen NOW so that we can
		// make paths properly without worrying about blocking. This means we also have to
		// pick all the monsters AND any blocking items that might be possible.

		let map = '';
		let y=0;
		let x=-1;
		for( let i=0 ; i<this.mapOriginal.length ; ++i ) {
			let s = this.mapOriginal.charAt(i);
			if( s=='\t' ) { continue; }
			if( s=='\n' ) { map+=s; ++y; x=-1; continue; }
			++x;
			let supplyMixed = this.symbols[s];
			if( supplyMixed !== undefined ) {
				let supplyArray = Array.supplyParse( supplyMixed );
				let makeArray = Array.supplyToMake( supplyArray, 1.0, pickArray => {
					// This makes terrain choices persist, picked the same every time.
					if( !pickCache[s] ) {
						pickCache[s] = pick(pickArray);
					}
					return pickCache[s];
				});
				let typeId = makeArray[0].typeFilter.split('.')[0];
				//if( typeId == 'marker' ) debugger;

				// We are trying to determine whether an inject even NEEDS to get made. The criteria are tricky.
				if( makeArray.length > 1 || makeArray[0].count > 1 || makeArray[0].typeFilter.indexOf('.')>=0 || containsAnyFieldExcept(makeArray[0],['typeFilter','count']) ) {
					let pPos = ''+x+','+y;
					this.inject[pPos] = this.inject[pPos] || [];
					this.inject[pPos].push(...makeArray);
				}
				else {
					//console.log("Chose not to inject "+makeArray[0].typeFilter);
				}

				s = TypeIdToSymbol[typeId];
				if( !s ) {
					debugger;
					console.log('ERROR: Place '+this.id+' uses unknown type '+typeId);
					map += TileTypeList.floorCave.symbol;
					continue;
				}
			}
			if( s == Tile.FLOOR ) {
				s = DefaultFloor;
			}
			if( s == Tile.WALL ) {
				s = DefaultWall;
			}
			if( !SymbolToType[s] && s!==Tile.UNKNOWN ) {
				console.log('ERROR: unknown symbol ['+s+']');
				map += TileTypeList.floorCave.symbol;
				debugger;	// By now we should have resolved what this symbol maps to
				continue;
			}
			map += s;
		}
		return map;
	}
	generateMap(DefaultFloor,DefaultWall) {
		if( !this.map && !this.floodId ) debugger;
		if( !this.map ) {
			return;
		}
		let mapString = this.generateStringMap(DefaultFloor,DefaultWall);
		this.map = new SimpleMap(mapString,false,Tile.UNKNOWN);
	}
	rotateIfNeeded(rotation) {
		if( this.flags && this.flags.rotate && this.map ) {
			if( rotation === undefined || rotation === null ) {
				rotation = Random.Pseudo.intRange(0,4);
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
		let appear = Math.floor(Math.clamp(ChanceToAppear.Simple(placeLevel,depth) * 100000, 1, 100000));
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

return {
	Place: Place
}

});
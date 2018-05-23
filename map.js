let TILE_UNKNOWN = ' ';

function isItem(e) { return e instanceof Item; }

// MAP
class SimpleMap {
	constructor(tileRaw) {
		this.isMap = true;
		if( TILE_UNKNOWN != ' ' ) debugger;
		this.tile = tileRaw.replace(/ /g,TileTypeList.floor.symbol).split('\n');
		while( this.tile[this.tile.length-1].trim() == '' ) {
			this.tile.length -= 1;
		}
		this.yLen = this.tile.length;
		let xLen = 0;
		for( let y=0 ; y<this.yLen ; ++y ) {
			xLen = Math.max(xLen,this.tile[y].length);
		}
		this.xLen = xLen;
		// Make all rows the same length.
		for( let y=0 ; y<this.yLen ; ++y ) {
			while( this.tile[y].length < this.xLen ) {
				this.tile[y] += TileTypeList.wall.symbol;
			}
		}
	}
	setDimensions(xLen,yLen) {
		this.xLen = xLen;
		this.yLen = yLen;
	}
	inBounds(x,y) {
		return x>=0 && x<this.xLen && y>=0 && y<this.yLen;
	}
	pickPos(xa,ya,xb,yb) {
		return [Math.randInt(0+xa,this.xLen-xb),Math.randInt(0+ya,this.yLen-yb)];
	}
	pickPosBy(xa,ya,xb,yb,fn) {
		let x;
		let y;
		do {
			x = Math.randInt(0+xa,this.xLen-xb)
			y = Math.randInt(0+ya,this.yLen-yb);
		} while( !fn(x,y,this.tileTypeGet(x,y)) );
		return [x,y];
	}

	// Rotate in 90 degree increments clockwise. 0=none, 1=90, 2=180, 3=270
	rotate(cw) {
		cw = cw % 4;
		let m = [];
		for( let y=0 ; y<this.yLen ; ++y ) {
			for( let x=0 ; x<this.xLen ; ++x ) {
				let c = this.tile[y][x];
				if( cw & 1 ) { m[x] = m[x] || []; } else { m[y] = m[y] || []; }
				switch(cw) {
					case 0: m[y] = m[y] || []; m[y][x] = c; break;
					case 1: m[x] = m[x] || []; m[x][this.yLen-1-y] = c; break;
					case 2: m[this.yLen-1-y] = m[this.yLen-1-y] || []; m[this.yLen-1-y][this.xLen-1-x] = c; break;
					case 3: m[this.xLen-1-x] = m[this.xLen-1-x] || []; m[this.xLen-1-x][y] = c; break;
				}
			}
		}
		if( cw == 1 || cw == 3 ) {
			this.setDimensions(this.yLen,this.xLen);
		}
		this.tile = [];
		for( let y=0 ; y<this.yLen ; ++y ) {
			this.tile[y] = m[y].join('');
		}
	}
	fit(px,py,placeMap) {
		if( px<0 || py<0 || px+placeMap.xLen>this.xLen || py+placeMap.yLen>this.yLen ) {
			return false;
		}
		let floor = TileTypeList.floor.symbol;
		let wall = TileTypeList.wall.symbol;
		//debugger;
		for( let y=0 ; y<placeMap.yLen ; ++y ) {
			for( let x=0 ; x<placeMap.xLen ; ++x ) {
				let pSym = placeMap.tileSymbolGet(x,y);
				if( pSym !== TILE_UNKNOWN ) {
					let mSym = this.tileSymbolGet(px+x,py+y);
//					if( pSym == wall && mSym == floor )
//						return false;
					if( mSym == wall && pSym != wall )
						return false;
					if( mSym != floor )
						return false;
				}
			}
		}
		return true;
	}
	inject(px,py,placeMap,fn) {
		for( let y=0 ; y<placeMap.yLen ; ++y ) {
			for( let x=0 ; x<placeMap.xLen ; ++x ) {
				let pSym = placeMap.tileSymbolGet(x,y);
				if( pSym === undefined ) {
					debugger;
				}
				if( pSym !== TILE_UNKNOWN ) {
					fn(px+x,py+y,pSym);
					this.tileSymbolSet(px+x,py+y,pSym);
				}
			}
		}
	}
	toString() {
		return this.tile.join('\n');
	}
	traverse(fn) {
		for( let y=0 ; y<this.yLen ; ++ y ) {
			for( let x=0 ; x<this.xLen ; ++x ) {
				let go = fn.call(this,x,y);
				if( go === false ) {
					return this;
				}
			}
		}
		return this;
	}

	tileSymbolSet(x,y,symbol) {
		if( !this.inBounds(x,y) ) {
			debugger;
		}
		this.tile[y] = this.tile[y].substr(0,x)+symbol+this.tile[y].substr(x+1);
	}
	tileSymbolSetFloor(x,y) {
		if( !this.inBounds(x,y) ) {
			debugger;
		}
		let most = {};
		let best = false;
		for( let dir=0 ; dir<DirectionCount ; ++dir ) {
			let dx = x+DirectionAdd[dir].x;
			let dy = y+DirectionAdd[dir].y;
			if( this.inBounds(dx,dy) ) {
				let symbol = this.tileSymbolGet(dx,dy);
				if( SymbolToType[symbol].isFloor ) {
					most[symbol] = (most[symbol]||0)+1;
					if( !best || most[symbol] > most[best] ) {
						best = symbol;
					}
				}
			}
		}
		let symbol = best || TileTypeList.floor.symbol;
		this.tileSymbolSet(x,y,symbol);
	}
	tileSymbolGet(x,y) {
		if( !this.inBounds(x,y) ) { debugger; }
		return this.tile[y].charAt(x);
	}
	tileTypeGet(x,y) {
		if( !this.inBounds(x,y) ) {
			return false;
		}
		let symbol = this.tileSymbolGet(x,y);
		if( SymbolToType[symbol].isItemType ) {
			// WARNING! This only happens when you are processing the map to
			// extract entities!!
			let f = new ItemFinder(this.itemList).at(x,y);
			if( f.count ) {
				return f.first;
			}
		}
		return SymbolToType[symbol];
	}
	tileTypeGetDir(x,y,dir) {
		x += DirectionAdd[dir].x;
		y += DirectionAdd[dir].y;
		return this.tileTypeGet(x,y);
	}
}


class Map extends SimpleMap {
	constructor(tile,itemList) {
		super(tile);
		this.actionCount = 0;
		this.itemList = itemList;
	}
	pickPosEmpty() {
		console.log("Picking random location for "+type.typeId);
		let pos = this.pickPosBy(0,0,0,0,(x,y,type)=>type.isFloor);
		return pos;
	}

	itemCreateByType(x,y,type,presets,inject) {
		if( type.isRandom ) debugger;
		let item = new Item( this, type, { x:x, y:y }, presets, inject );
		this.itemList.push(item);
		return item;
	}
	itemCreateByTypeId(x,y,typeId,presets,inject) {
		return this.itemCreateByType(x,y,ItemTypeList[typeId],presets,inject);
	}

	_itemRemove(item) {
		if( !this.itemList.includes(item) ) {
			debuger;
		}
		Array.filterInPlace( this.itemList, i => i.id!=item.id )
		//this.tileSymbolSet(item.x,item.y,TileTypeList['floor'].symbol);
	}
	_itemTake(item) {
		if( this.itemList.includes(item) ) {
			debuger;
		}
		this.itemList.push(item);
		//this.tileSymbolSet(item.x,item.y,item.symbol);
	}
}


function shootRange(x1,y1,x2,y2,testFn,onStep) {
	// Define differences and error check
	var dx = Math.abs(x2 - x1);
	var dy = Math.abs(y2 - y1);
	var sx = (x1 < x2) ? 1 : -1;
	var sy = (y1 < y2) ? 1 : -1;
	var err = dx - dy;

	let ok = true;
	onStep(x1,y1,ok);
	while (!((x1 == x2) && (y1 == y2))) {
		var e2 = err << 1;
		if (e2 > -dy) {
			err -= dy;
			x1 += sx;
		}
		if (e2 < dx) {
			err += dx;
			y1 += sy;
		}
		ok = ok && testFn(x1,y1);
		onStep(x1,y1,ok);
	}
	return ok;
}

function shoot(map,px,py,sx,sy,tx,ty,blind) {
	if( sx==tx && sy==ty ) {
		return true;
	}
	if( blind ) {
		return false;
	}
	let sxInt = Math.floor(sx);
	let syInt = Math.floor(sy);
	let dx = tx-sx;
	let dy = ty-sy;
	let dist = Math.sqrt(dx*dx+dy*dy);
	let x = sx;
	let y = sy;
	let step = 0.25;
	dx = dx / (dist/step);
	dy = dy / (dist/step);
	// Always allowed to see itself.
	dist -= 0.5;
	let wallAmount = 0;
	while( dist > 0 ) {
		let xInt = Math.floor(x);
		let yInt = Math.floor(y);
		let atPlayer = (xInt==px && yInt==py);
		if( !atPlayer ) {
			wallAmount += map.tileTypeGet(xInt,yInt).opacity;
			if( wallAmount >= 1 ) { return false; }
		}
		x += dx;
		y += dy;
		dist -= step;
	}
	return true;
}

function shoot4(map,px,py,x,y,blind) {
	let tl = shoot(map,px,py,px,py,x,y,blind);
	let tr = shoot(map,px,py,px+0.95,py+0.00,x+0.95,y+0.00,blind);
	let bl = shoot(map,px,py,px+0.00,py+0.95,x+0.00,y+0.95,blind);
	let br = shoot(map,px,py,px+0.95,py+0.95,x+0.95,y+0.95,blind);
	let isVisible = tl || tr || bl || br;
	return isVisible;
}


function calcVis(map,px,py,sightDistance,blind,cachedVis,mapMemory) {

	let a = cachedVis || [];
	let q = [];

	if( mapMemory ) {
		for( let item of map.itemList ) {
			q[item.y*map.xLen+item.x] = item;
		}
	}

	for( let y=0 ; y<map.yLen ; ++y ) {
		a[y] = a[y] || [];
		for( let x=0 ; x<map.xLen ; ++x ) {
			if( Math.abs(y-py)>sightDistance || Math.abs(x-px)>sightDistance ) {
				a[y][x] = false;
				continue;
			}
			a[y][x] = shoot4(map,px,py,x,y,blind);
			if( mapMemory && a[y][x] ) {
				let item = q[y*map.xLen+x];
				mapMemory[y] = mapMemory[y] || [];
				mapMemory[y][x] = item ? item : map.tileTypeGet(x,y);
			}
		}
	}
	a[py][px] = true;
	return a;
}

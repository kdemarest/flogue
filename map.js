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
	getSurfaceArea() {
		return this.xLen*this.yLen;
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
	toString() {
		return this.tile.join('\n');
	}
	traverse(fn) {
		for( let y=0 ; y<this.yLen ; ++ y ) {
			for( let x=0 ; x<this.xLen ; ++x ) {
				let go = fn.call(this,x,y,this.tileTypeGet(x,y));
				if( go === false ) {
					return this;
				}
			}
		}
		return this;
	}
	count(fn) {
		let c = 0;
		this.traverse( (x,y,type) => c += fn(x,y,type) );
		return c;
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
		let type = SymbolToType[symbol];
		console.assert(type);
		return type;
	}
	tileTypeGetDir(x,y,dir) {
		x += DirectionAdd[dir].x;
		y += DirectionAdd[dir].y;
		return this.tileTypeGet(x,y);
	}
}


class Map extends SimpleMap {
	constructor(area,tile,itemList) {
		super(tile);
		this.area = area;
		this.actionCount = 0;
		this.tileEntity = [];
		this.itemList = itemList;
		this.visCache = [];
		this.cacheVis();
		this.initSprites();
	}
	get entityList() {
		return this.area.entityList;
	}
	cacheVis() {
		this.traverse( (x,y) => {
			this.visSet(x,y,this.tileTypeGet(x,y).opacity||0);
		});
		this.itemList.forEach( item => this.visSet( item.x, item.y, Math.max( this.visGet(item.x,item.y), item.opacity||0 ) ) );
	}
	initSprites() {
		this.tileSprite = [];
		this.traverse( (x,y) => {
			this.tileSprite[y] = this.tileSprite[y] || [];
			this.tileSprite[y][x] = [];
		});
	}
	toEntity(x,y,adhocEntity) {
		if( !this.tileEntity[y] ) {
			this.tileEntity[y] = this.tileEntity[y] || [];
			if( !this.tileEntity[y][x] ) {
				adhocEntity = adhocEntity || adhoc( SymbolToType[tileSymbolGet(x,y)], this, x, y );
				this.tileEntity[y][x] = adhocEntity;
				console.log('Tile entity ('+x+','+y+') '+adhocEntity.typeId);
			}
		}
		return this.tileEntity[y][x];
	}
	visGet(x,y) {
		if( !this.inBounds(x,y) ) {
			return false;
		}
		return this.visCache[y*this.xLen+x];
	}
	visSet(x,y,opacity) {
		if( !this.inBounds(x,y) ) {
			return false;
		}
		return this.visCache[y*this.xLen+x] = opacity;
	}
	tileTypeGet(x,y) {
		if( !this.inBounds(x,y) ) {
			return false;
		}

		if( this.tileEntity[y] && this.tileEntity[y][x] ) {
			return this.tileEntity[y][x];
		}
		let symbol = this.tileSymbolGet(x,y);
		return SymbolToType[symbol];
	}
	tileSymbolSet(x,y,symbol) {
		super.tileSymbolSet(x,y,symbol);

		if( this.tileEntity[y] && this.tileEntity[y][x] ) {
			let e = this.tileEntity[y][x];
			if( e.symbol !== symbol ) {
				// If my type has changed, reflect that in the tileEntity. This is a COMPLEX problem, because
				// some elements in the OLD type might not exist in the NEW type and vice-versa.
				for( let key in SymbolToType[e.symbol] ) {
					e[key] = null;
				}
				Object.assign(e,SymbolToType[symbol]);
				e.spriteList = null;
			}
		}
	}

	pickPosEmpty() {
		let pos = this.pickPosBy(0,0,0,0,(x,y,type)=>type.isFloor);
		return pos;
	}
	pickDirWalkable(x,y) {
		let list = [];
		for( let dir=0 ; dir<DirectionCount ; ++dir ) {
			let type = this.tileTypeGetDir(x,y,dir);
			if( type && type.mayWalk ) {
				list.push(dir);
			}
		}
		return list.length ? pick(list) : false;
	}
	findItem(me) {
		return new Finder(this.itemList,me);
	}
	spiralFind(x,y,fn) {
		let dir = 0;
		let span = 0.5;
		let remain = span;
		let reps = 4*this.getSurfaceArea();	// mult by 4 because you might have started in a corner
		do {
			x += DirectionAdd[dir].x;
			y += DirectionAdd[dir].y;
			if( fn(x,y,this.tileTypeGet(x,y)) ) {
				return [x,y];
			}
			remain -= 1;
			if( remain <= 0 ) {
				dir = (dir + 2) % 8;
				span += 0.5;
				remain = span;
			}
		} while( --reps > 0 );
		return false;
	}

	itemCreateByType(x,y,type,presets,inject) {
		if( x===undefined ) debugger;
		if( type.isRandom ) debugger;
		if( !this.tileTypeGet(x,y).mayWalk ) {
			let dir = this.pickDirWalkable(x,y);
			if( dir !== false ) {
				x += DirectionAdd[dir].x;
				y += DirectionAdd[dir].y;
			}
		}
		let item = new Item( this.area.depth, type, presets, inject );
		item.giveTo(this,x,y);
		return item;
	}
	itemCreateByTypeId(x,y,typeId,presets,inject) {
		return this.itemCreateByType(x,y,ItemTypeList[typeId],presets,inject);
	}

	_itemRemove(item) {
		if( !this.itemList.includes(item) ) {
			debugger;
		}
		Array.filterInPlace( this.itemList, i => i.id!=item.id );
		spriteDeathCallback( item.spriteList );
		//this.tileSymbolSet(item.x,item.y,TileTypeList['floor'].symbol);
	}
	_itemTake(item,x,y) {
		if( this.itemList.includes(item) ) {
			debugger;
		}
		this.itemList.push(item);
		item.x = x;
		item.y = y;
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
			wallAmount += map.visGet(xInt,yInt); // map.tileTypeGet(xInt,yInt).opacity;
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


function calcVis(map,px,py,sightDistance,blind,xray,cachedVis,mapMemory) {

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
			a[y][x] = xray ? true : shoot4(map,px,py,x,y,blind);
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

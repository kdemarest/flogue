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
	rotate(cw,inject) {
		let injectOld = Object.assign( {}, inject );
		Object.each( inject, (val,key) => delete inject[key] );
		cw = cw % 4;
		let m = [];
		for( let y=0 ; y<this.yLen ; ++y ) {
			for( let x=0 ; x<this.xLen ; ++x ) {
				let c = this.tile[y][x];
				let tx,ty;
				if( cw & 1 ) { m[x] = m[x] || []; } else { m[y] = m[y] || []; }
				switch(cw) {
					case 0: tx=x; 				ty=y; 					break;
					case 1: tx=this.yLen-1-y; 	ty=x; 					break;
					case 2: tx = this.xLen-1-x; ty = this.yLen-1-y;		break;
					case 3: tx = y; 			ty = this.xLen-1-x;		break;
				}
				m[ty] = m[ty] || [];
				m[ty][tx] = c;
				if( injectOld[''+x+','+y] ) {
					inject[''+tx+','+ty] = injectOld[''+x+','+y];
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
	renderToString() {
		let s = '';
		this.traverse( (x,y) => {
			s += this.tileSymbolGet(x,y) || '?';
			if( x==this.xLen-1 ) {
				s += '\n';
			}
		});
		return s;
	}
}



class Map extends SimpleMap {
	constructor(area,tileRaw,itemList) {
		super(tileRaw);
		this.area = area;
		this.actionCount = 0;
		this.tileEntity = [];
		this.itemList = itemList || [];
		this.itemLookup = [];
		this.itemLookupStaticNop = [];
		this.itemList.forEach( item => {
			let lPos = item.y*this.xLen+item.x;
			this.itemLookup[lPos] = (this.itemLookup[lPos] || []);
			this.itemLookup[lPos].push(item);
		});
		this.walkLookup = []
		this.calcWalkableAll();
		this.initSprites();
	}
	get entityList() {
		return this.area.entityList;
	}
	initSprites() {
		this.tileSprite = [];
		this.traverse( (x,y) => {
			this.tileSprite[y] = this.tileSprite[y] || [];
			this.tileSprite[y][x] = [];
		});
	}
	calcWalkable(x,y) {
		let lPos = y*this.xLen+x;
		let itemList = this.itemLookup[lPos] || this.itemLookupStaticNop;
		let ask = null;
		let prob = Prob.NONE;
		itemList.forEach( item => {
			if( item.isProblem ) {
				ask = item;
			}
			else
			if( !item.mayWalk ) {
				prob = Prob.WALL;
			}
		});
		let tile = this.tileTypeGet(x,y);
		if( tile.isProblem ) {
			ask = ask || tile;
		}
		else
		if( !tile.mayWalk ) {
			prob = Prob.WALL;
		}
		this.walkLookup[lPos] = ask && prob !== Prob.WALL ? ask : prob;
	}

	calcWalkableAll() {
		let walk = [];
		this.traverse( (x,y) => this.calcWalkable(x,y) );
	}
	setObstacle(x,y,prob) {
		let lPos = y*this.xLen+x;
		this.walkLookup[lPos] = prob;
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
		this.calcWalkable(x,y);
	}
	pickPosToStartGame() {
		let f = new Finder(this.itemList).filter( item => item.playerStartHere );
		if( !f.count ) {
			console.log( "No player start marker found. Searching for stairsUp." );
			f = new Finder(this.itemList).filter( item => item.typeId=='stairsUp' );
			if( !f.first ) {
				f = new Finder(this.itemList).filter( item => item.typeId=='stairsDown' );
				console.assert(f.first);
			}
		}
		return [f.first.x,f.first.y];
	}

	pickPosEmpty() {
		let pos = this.pickPosBy(0,0,0,0,(x,y,type)=>type && type.isFloor);
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
			let tile = this.tileTypeGet(x,y);
			if( tile && fn(x,y,tile) ) {
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
		let tile = this.tileTypeGet(x,y);
		if( !tile || (!tile.mayWalk && !type.allowPlacementOnBlocking) ) {
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

	findItemAt(x,y) {
		if( !this.inBounds(x,y) ) return false;
		return new Finder(this.itemLookup[y*this.xLen+x] || this.itemLookupStaticNop);
	}

	_itemRemove(item) {
		if( !this.itemList.includes(item) ) {
			debugger;
		}
		Array.filterInPlace( this.itemList, i => i.id!=item.id );
		Array.filterInPlace( this.itemLookup[item.y*this.xLen+item.x], i => i.id!=item.id );
		spriteDeathCallback( item.spriteList );
		this.calcWalkable(item.x,item.y);
		//this.tileSymbolSet(item.x,item.y,TileTypeList['floor'].symbol);
	}
	_itemTake(item,x,y) {
		if( this.itemList.includes(item) ) {
			debugger;
		}
		this.itemList.push(item);
		let lPos = y*this.xLen+x;
		this.itemLookup[lPos] = (this.itemLookup[lPos] || []);
		this.itemLookup[lPos].push(item);
		item.x = x;
		item.y = y;
		this.calcWalkable(x,y);
		//this.tileSymbolSet(item.x,item.y,item.symbol);
	}
}


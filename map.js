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
		let reps = 1000;
		do {
			x = Math.randInt(0+xa,this.xLen-xb)
			y = Math.randInt(0+ya,this.yLen-yb);
		} while( reps-- && !fn(x,y,this.tileTypeGet(x,y)) );
		if( !reps ) return false;
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
					delete injectOld[''+x+','+y];
				}
			}
		}
		Object.each( injectOld, (val,key) => inject[key] = val );
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
	traverseNear(cx,cy,dist,fn) {
		let sy = Math.max(cy-dist,0);
		let ey = Math.min(cy+dist,this.yLen-1);
		let sx = Math.max(cx-dist,0);
		let ex = Math.min(cx+dist,this.xLen-1);
		for( let y=sy ; y<=ey ; ++y ) {
			for( let x=sx ; x<=ex ; ++x ) {
				if( fn(x,y) === false ) return;
			}
		}
		return this;
	}
	count(fn) {
		let c = 0;
		this.traverse( (x,y,type) => c += fn(x,y,type) );
		return c;
	}
	count8(cx,cy,fn) {
		let c = 0;
		for( let dir=0 ; dir<8 ; ++dir ) {
			let x = cx+DirectionAdd[dir].x;
			let y = cy+DirectionAdd[dir].y;
			if( !this.inBounds(x,y) ) continue;
			let tile = this.tileTypeGet(x,y);
			if( fn(x,y,tile) ) {
				c++;
			}
		}
		return c;
	}
	dirChoose(x,y,ratingFn) {
		let bestDir = false;
		let bestRating = null;
		for( let dir=0 ; dir<DirectionCount ; ++dir ) {
			let dx = x+DirectionAdd[dir].x;
			let dy = y+DirectionAdd[dir].y;
			if( this.inBounds(dx,dy) ) {
				let rating = ratingFn(dx,dy,bestRating);
				if( rating !== false ) {
					bestDir = dir;
					bestRating = rating;
				}
			}
		}
		return bestDir;
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
		this.itemListHidden = [];
		this.itemLookup = [];
		this.itemLookupStaticNop = [];
		this.itemList.forEach( item => {
			let lPos = item.y*this.xLen+item.x;
			this.itemLookup[lPos] = (this.itemLookup[lPos] || []);
			this.itemLookup[lPos].push(item);
		});
		this.entityLookup = [];		
		this.entityLookupStaticNop = [];
		this.walkLookup = this.calcLookup([],pWalk(this));
		// This ignores the first-round stink anything might generate. And really, everything "should" have been
		// walking around for a while, so we should make fake prior-stink trails for everything. But ya know.
		this.scentLookup = [];
		this.siteLookup = [];
		this.lightCache = [];
		
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
	calcLookup(lookup,testFn) {
		let xLen = this.xLen;
		this.traverse( (x,y) => {
			let lPos = y*this.xLen+x;
			lookup[lPos] = testFn(x,y);
		});
		return lookup;
	}
	scentLeave(x,y,entity,timeReduction=0) {
		// WARNING: Don't make any monster that uses smell have ANY stink. It will
		// mask the scent of its prey with its own smell!
		if( !entity.isMonsterType && !entity.stink ) {
			return false;
		}
		let time = Time.simTime - timeReduction;
		let lPos = (y*this.xLen+x)*2;
		if( time >= (this.scentLookup[lPos+0] || 0) ) {
			this.scentLookup[lPos+0] = time;
			this.scentLookup[lPos+1] = entity;
		}
		if( !entity.stink ) {
			return 1;
		}
		// NOTICE: You do NOT want the surrounding stink to ever be as much as the stink you are currently
		// laying, because pathfinding needs decreasing values to follow.
		let stinkTime = Math.floor(time-(10*Math.clamp(1-entity.stink,0.0,0.98)));
		this.traverseNear(x,y,1, (x,y) => {
			let tile = this.tileTypeGet(x,y);
			if( !tile.mayWalk || tile.isProblem ) {
				return;
			}
			let lPos = (y*this.xLen+x)*2;
			if( stinkTime >= (this.scentLookup[lPos+0] || 0) ) {
				this.scentLookup[lPos+0] = stinkTime;
				this.scentLookup[lPos+1] = entity;
			}
		});
		return 2;
	}
	scentClear(x,y) {
		let lPos = (y*this.xLen+x)*2;
		if( this.scentLookup[lPos] ) {
			this.scentLookup[lPos+0] = -SCENT_AGE_LIMIT;
			this.scentLookup[lPos+1] = null;
		}
	}
	scentGetAge(x,y) {
		return Time.simTime-(this.scentLookup[(y*this.xLen+x)*2+0] || SCENT_AGE_LIMIT);
	}
	scentIncAge(x,y,amount) {
		console.assert(amount);
		let lPos = (y*this.xLen+x)*2;
		this.scentLookup[(y*this.xLen+x)*2+0] -= amount;
	}
	scentGetEntity(x,y,maxScentAge=SCENT_AGE_LIMIT,excludeId) {
		maxScentAge = Math.min(maxScentAge,SCENT_AGE_LIMIT);
		let lPos = (y*this.xLen+x)*2;
		let simTime = this.scentLookup[lPos+0];
		if( !simTime || simTime < Time.simTime-maxScentAge ) {
			return null;
		}
		let found = this.scentLookup[lPos+1];
		if( found.id == excludeId ) {
			return null;
		}
		return found;
	}

	calcWalkable(x,y) {
		let lPos = y*this.xLen+x;
		let testFn = pWalk(this);
		this.walkLookup[lPos] = testFn(x,y);
	}

	// This is used in testing, but not the main game.
	setObstacle(x,y,prob) {
		let lPos = y*this.xLen+x;
		this.walkLookup[lPos] = prob;
	}
	toEntity(x,y,adhocEntity) {
		this.tileEntity[y] = this.tileEntity[y] || [];
		if( !this.tileEntity[y][x] ) {
			adhocEntity = adhocEntity || adhoc( SymbolToType[this.tileSymbolGet(x,y)], this, x, y );
			this.tileEntity[y][x] = adhocEntity;
			//console.log('Tile entity ('+x+','+y+') '+adhocEntity.typeId);
		}
		console.assert(this.tileEntity[y][x]);
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
	spiralFind(x,y,fn) {
		let dir = 0;
		let span = 0.5;
		let remain = span;
		let reps = 4*this.getSurfaceArea();	// mult by 4 because you might have started in a corner
		let tile = this.tileTypeGet(x,y);
		if( tile && fn(x,y,tile) ) {
			return [x,y];
		}

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

	getSiteAt(x,y) {
		if( !this.inBounds(x,y) ) {
			return false;
		}
		return this.siteLookup[y*this.xLen+x];
	}

	getLightAt(x,y,defaultValue=0) {
		if( !this.inBounds(x,y) ) {
			return defaultValue;
		}
		let lPos = y*this.xLen+x;
		let light = this.lightCache[lPos];	// note, this should NEVER have MEMORY_MAP_FLAG inside it.
		return light === undefined ? defaultValue : light;
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
		item = item.giveTo(this,x,y);
		return item;
	}
	itemCreateByTypeId(x,y,typeId,presets,inject) {
		return this.itemCreateByType(x,y,ItemTypeList[typeId],presets,inject);
	}

	isItemAt(x,y) {
		// This has a TINY little flow, in that the left and right sides wrap around. But it is used
		// during pathfind, so we're going to let this little problem slide.
		let i = this.itemLookup[y*this.xLen+x];
		return i && i.length;
	}
	findItem(me) {
		return new Finder(this.itemList,me);
	}
	findFirstItemAt(x,y) {
		if( !this.inBounds(x,y) ) return false;
		return this.itemLookup[y*this.xLen+x];
	}
	findItemAt(x,y) {
		if( !this.inBounds(x,y) ) return false;
		return new Finder(this.itemLookup[y*this.xLen+x] || this.itemLookupStaticNop);
	}
	findChosenItemAt(x,y,fn) {
		if( this.inBounds(x,y) ) {
			let a = this.itemLookup[y*this.xLen+x];
			if( a ) {
				return a.find(fn);
			}
		}
	}

	isEntityAt(x,y) {
		// This has a TINY little flow, in that the left and right sides wrap around. But it is used
		// during pathfind, so we're going to let this little problem slide.
		let e = this.entityLookup[y*this.xLen+x];
		return e && e.length;
	}
	findEntityAt(x,y) {
		if( !this.inBounds(x,y) ) return false;
		return new Finder(this.entityLookup[y*this.xLen+x] || this.entityLookupStaticNop);
	}
	_entityRemove(entity) {
		//console.log( '- '+entity.name+' ('+entity.x+','+entity.y+')' );
		let lPos = entity.y*this.xLen+entity.x;
		Array.filterInPlace( this.entityLookup[lPos], e => e.id!=entity.id );
	}
	_entityInsert(entity) {
		//console.log( '+ '+entity.name+' ('+entity.x+','+entity.y+')' );
		let lPos = entity.y*this.xLen+entity.x;
		this.entityLookup[lPos] = (this.entityLookup[lPos] || []);
		this.entityLookup[lPos].push(entity);
	}

	_itemRemove(item) {
		if( !this.itemList.includes(item) ) {
			debugger;
		}
		Array.filterInPlace( this.itemList, i => i.id!=item.id );
		Array.filterInPlace( this.itemLookup[item.y*this.xLen+item.x], i => i.id!=item.id );
		spriteDeathCallback( item.spriteList );
		this.calcWalkable(item.x,item.y);
		this.traverse( (x,y) => {
			let lPos = (y*this.xLen+x)*2;
			if( this.scentLookup[lPos+1] == item ) {
				this.scentLookup[lPos+0] = SCENT_AGE_LIMIT;
				this.scentLookup[lPos+1] = null;
			}
		});
		//this.tileSymbolSet(item.x,item.y,TileTypeList['floor'].symbol);
	}
	_itemTake(item,x,y) {
		if( this.itemList.includes(item) ) {
			debugger;
		}
		// NUANCE! You must set the item's x,y in order for _addToList to bunch properly.
		item.x = x;
		item.y = y;
		if( item.isHidden ) {
			this.itemListHidden.push(item);
			return item;
		}
		item = item._addToList(this.itemList);
		let lPos = y*this.xLen+x;
		this.itemLookup[lPos] = (this.itemLookup[lPos] || []);
		if( !this.itemLookup[lPos].find( i=>i.id==item.id ) ) {
			// we have to try to find this because _addToList might have aggregated it!
			this.itemLookup[lPos].push(item);
		}
		this.calcWalkable(x,y);
		this.scentLeave(x,y,item);
		//this.tileSymbolSet(item.x,item.y,item.symbol);
		return item;
	}
}


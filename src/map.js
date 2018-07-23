Module.add('map',function() {

// MAP
class SimpleMap {
	constructor(tileRaw,replaceBlanks,padSymbol) {
		this.isMap = true;
		if( Tile.UNKNOWN != ' ' ) debugger;
		
		let temp = tileRaw.replace(/\t/g,'');;
		temp = replaceBlanks ? temp.replace(/ /g,padSymbol) : temp;
		this.tile = temp.split('\n').filter( line => line.trim().length > 0 );
		this.yLen = this.tile.length;
		let xLen = 0;
		for( let y=0 ; y<this.yLen ; ++y ) {
			xLen = Math.max(xLen,this.tile[y].length);
		}
		this.xLen = xLen;
		// Make all rows the same length.
		for( let y=0 ; y<this.yLen ; ++y ) {
			while( this.tile[y].length < this.xLen ) {
				this.tile[y] += padSymbol;
			}
		}
	}

	setDimensions(xLen,yLen) {
		this.xLen = xLen;
		this.yLen = yLen;
	}
	get xMin() {
		return 0;
	}
	get yMin() {
		return 0;
	}
	get xMax() {
		return this.xLen-1;
	}
	get yMax() {
		return this.yLen-1;
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
				let go = fn.call(this,x,y,this.tileTypeGetFastUnsafe(x,y));
				if( go === false ) {
					return this;
				}
			}
		}
		return this;
	}
	symbolFindPosition(symbol) {
		let pos = null;
		this.traverse( (x,y,tile) => {
			if( tile.symbol == symbol ) {
				pos = [x,y];
				return false;
			}
		});
		return pos;
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
			let x = cx+Direction.add[dir].x;
			let y = cy+Direction.add[dir].y;
			if( !this.inBounds(x,y) ) continue;
			let tile = this.tileTypeGet(x,y);
			if( fn(x,y,tile) ) {
				c++;
			}
		}
		return c;
	}
	testPassable(x,y) {
		let tile = this.tileTypeGet(x,y);
		return tile !== false && (tile.mayWalk || tile.isRemovable);
	}
	countGaps(x,y) {
		let swaps = 0;
		let lastPassable = this.testPassable(x+Direction.add[7].x,y+Direction.add[7].y);
		for( let dir=0 ; dir < 8 ; ++dir ) {
			let passable = this.testPassable(x+Direction.add[dir].x,y+Direction.add[dir].y);
			if( passable != lastPassable ) ++swaps;
			lastPassable = passable;
		}
		return swaps / 2;
	}

	dirChoose(x,y,ratingFn) {
		let bestDir = false;
		let bestRating = null;
		for( let dir=0 ; dir<Direction.count ; ++dir ) {
			let dx = x+Direction.add[dir].x;
			let dy = y+Direction.add[dir].y;
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
	tileSymbolSetFloor(x,y,defaultFloorSymbol) {
		console.assert( defaultFloorSymbol );
		if( !this.inBounds(x,y) ) {
			debugger;
		}
		let most = {};
		let best = false;
		for( let dir=0 ; dir<Direction.count ; ++dir ) {
			let dx = x+Direction.add[dir].x;
			let dy = y+Direction.add[dir].y;
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
		let symbol = best || defaultFloorSymbol;
		this.tileSymbolSet(x,y,symbol);
	}
	tileSymbolGetFastUnasfe(x,y) {
		return this.tile[y].charAt(x);
	}
	tileSymbolGet(x,y) {
		if( !this.inBounds(x,y) ) { debugger; }
		return this.tile[y].charAt(x);
	}
	tileTypeGetFastUnsafe(x,y) {
		let symbol = this.tileSymbolGet(x,y);
		if( symbol == Tile.UNKNOWN ) {
			return false;
		}
		let type = SymbolToType[symbol];
		console.assert(type);
		return type;
	}
	tileTypeGet(x,y) {
		if( !this.inBounds(x,y) ) {
			return false;
		}
		return this.tileTypeGetFastUnsafe(x,y);
	}
	tileTypeGetDir(x,y,dir) {
		x += Direction.add[dir].x;
		y += Direction.add[dir].y;
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

SimpleMap.fillTextMap = function(xLen,yLen,symbol) {
	let s = '';
	while( yLen-- ) {
		let x = xLen;
		while( x-- ) {
			s += symbol;
		}
		s += '\n';
	}
	return s;
}




class Map extends SimpleMap {
	constructor(area,tileRaw,itemList) {
		super(tileRaw,true,TileTypeList.wallCave.symbol);
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
	get defaultFloorSymbol() {
		return TypeIdToSymbol[this.area.theme.palette.floor];
	}
	initSprites() {
		this.tileSprite = [];
		this.traverse( (x,y) => {
			this.tileSprite[y] = this.tileSprite[y] || [];
			this.tileSprite[y][x] = {};
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
		let tile = this.tileTypeGet(x,y);
		if( tile.noScent ) {
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
			this.scentLookup[lPos+0] = -Rules.SCENT_AGE_LIMIT;
			this.scentLookup[lPos+1] = null;
		}
	}
	scentGetAge(x,y) {
		return Time.simTime-(this.scentLookup[(y*this.xLen+x)*2+0] || Rules.SCENT_AGE_LIMIT);
	}
	scentIncAge(x,y,amount) {
		console.assert(amount);
		let lPos = (y*this.xLen+x)*2;
		this.scentLookup[(y*this.xLen+x)*2+0] -= amount;
	}
	scentGetEntity(x,y,maxScentAge=Rules.SCENT_AGE_LIMIT,excludeId) {
		maxScentAge = Math.min(maxScentAge,Rules.SCENT_AGE_LIMIT);
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

	testPassable(x,y) {
		if( !super.testPassable(x,y) ) return false;
		let impassableItems = this.findItemAt(x,y).filter( item => !item.mayWalk && item.isRemovable !== false );
		return impassableItems.count <= 0;
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
	tileTypeGetFastUnasfe(x,y) {
		if( this.tileEntity[y] && this.tileEntity[y][x] ) {
			return this.tileEntity[y][x];
		}
		let symbol = this.tileSymbolGetFastUnasfe(x,y);
		return SymbolToType[symbol];
	}

	tileTypeGet(x,y) {
		if( !this.inBounds(x,y) ) {
			return false;
		}
		return this.tileTypeGetFastUnsafe(x,y);
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
	pickMarker(atMarker) {
		let f = new Finder(this.itemList).filter( item => item.markerId == atMarker );
		return f.first;
	}
	pickPosToStartGame(atMarker) {
		let f = new Finder(this.itemList).filter( item => item.markerId == atMarker );
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
		for( let dir=0 ; dir<Direction.count ; ++dir ) {
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
			x += Direction.add[dir].x;
			y += Direction.add[dir].y;
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
				x += Direction.add[dir].x;
				y += Direction.add[dir].y;
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
	findItemsNear(x,y,dist) {
		let itemList = [];
		this.traverseNear(x,y,dist,(x,y)=> {
			let temp = this.itemLookup[y*this.xLen+x];
			if( temp && temp.length ) {
				itemList.push(...temp);
			}
		});
		return itemList;
	}
	findFirstItemAt(x,y) {
		if( !this.inBounds(x,y) ) return false;
		let itemList = this.itemLookup[y*this.xLen+x];
		if( !itemList.length ) return false;
		return itemList[0];
	}
	findItemAt(x,y) {
		if( !this.inBounds(x,y) ) return new Finder([]);
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
		// This has a TINY little flaw, in that the left and right sides wrap around. But it is used
		// during pathfind, so we're going to let this little problem slide.
		let e = this.entityLookup[y*this.xLen+x];
		return e && e.length;
	}
	findEntityArrayAt(x,y) {
		if( !this.inBounds(x,y) ) return this.entityLookupStaticNop;
		return this.entityLookup[y*this.xLen+x] || this.entityLookupStaticNop;
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
		//if( !this.itemList.includes(item) ) {
		//	debugger;
		//}
		Array.filterInPlace( this.itemList, i => i.id!=item.id );
		Array.filterInPlace( this.itemLookup[item.y*this.xLen+item.x], i => i.id!=item.id );
		spriteDeathCallback( item.spriteList );
		this.calcWalkable(item.x,item.y);
		if( Rules.removeScentOfTheDead ) {
			this.traverse( (x,y) => {
				let lPos = (y*this.xLen+x)*2;
				if( this.scentLookup[lPos+1] == item ) {
					this.scentLookup[lPos+0] = Rules.SCENT_AGE_LIMIT;
					this.scentLookup[lPos+1] = null;
				}
			});
		}
		//this.tileSymbolSet(item.x,item.y,TileTypeList['floor'].symbol);
	}
	_itemTake(item,x,y) {
		if( this.itemList.includes(item) ) {
			debugger;
		}
		// NUANCE! You must set the item's x,y in order for _addToListAndBunch to bunch properly.
		item.x = x;
		item.y = y;
		if( item.isHidden ) {
			this.itemListHidden.push(item);
			return item;
		}
		item = item._addToListAndBunch(this.itemList);
		let lPos = y*this.xLen+x;
		this.itemLookup[lPos] = (this.itemLookup[lPos] || []);
		if( !this.itemLookup[lPos].find( i=>i.id==item.id ) ) {
			// we have to try to find this because _addToListAndBunch might have aggregated it!
			this.itemLookup[lPos].push(item);
		}
		this.calcWalkable(x,y);
		this.scentLeave(x,y,item);
		//this.tileSymbolSet(item.x,item.y,item.symbol);
		return item;
	}
}

return {
	SimpleMap: SimpleMap,
	Map: Map
}

});

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
		console.assert(xLen==Math.toTile(xLen));
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
		// OK not to convert this toTile, I think...
		return x>=0 && x<this.xLen && y>=0 && y<this.yLen;
	}
	pickPos(xa,ya,xb,yb) {
		return [Math.randInt(0+xa,this.xLen-xb),Math.randInt(0+ya,this.yLen-yb)];
	}
	pickPosBy(xa,ya,xb,yb,fn) {
		// xa and so on are "distance to indent from the edges for this pick"
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
		cx = Math.toTile(cx);
		cy = Math.toTile(cy);
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
		console.assert(cx==Math.toTile(cx));
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
		console.assert(x==Math.toTile(x));
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
		x=Math.toTile(x);
		y=Math.toTile(y);

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
		x=Math.toTile(x);
		y=Math.toTile(y);

		if( !this.inBounds(x,y) ) {
			debugger;
		}
		this.tile[y] = this.tile[y].substr(0,x)+symbol+this.tile[y].substr(x+1);
	}
	tileSymbolSetFloor(x,y,defaultFloorSymbol) {
		x=Math.toTile(x);
		y=Math.toTile(y);

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
		x=Math.toTile(x);
		y=Math.toTile(y);
		return this.tile[y].charAt(x);
	}
	tileSymbolGet(x,y) {
		if( !this.inBounds(x,y) ) { debugger; }
		return this.tileSymbolGetFastUnasfe(x,y);
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


/**
name				- What the user will see
rechargeRate		- 1.0 default. Higher means things in this area recharge faster.

*/

class Map extends SimpleMap {
	constructor(area,tileRaw,itemList,mapVars) {
		super(tileRaw,true,TileTypeList.wallCave.symbol);
		this.area = area;
		this.actionCount = 0;
		this.tileEntity = [];
		this.itemList = itemList || [];
		this.itemListHidden = [];
		this._itemLookup = [];
		this.itemLookupStaticNop = [];
		this.itemList.forEach( item => {
			this.itemLookupAdd(item.x,item.y,item);
		});
		this._entityLookup = [];		
		this.entityLookupStaticNop = [];
		this.walkLookup = this.calcLookup([],pWalk(this));
		// This ignores the first-round stink anything might generate. And really, everything "should" have been
		// walking around for a while, so we should make fake prior-stink trails for everything. But ya know.
		this._scentLookup = [];
		this.siteLookup = [];
		this.isAirless = false;
		this.passiveEffectList = [];
		this.name = "Earth";
		Object.assign( this, mapVars );
	}

	lPos(x,y) {
		console.assert(Number.isFinite(x));
		console.assert(Number.isFinite(y));
		return Math.toTile(y)*this.xLen+Math.toTile(x);
	}
	lPosOf(entity) {
		console.assert(Number.isFinite(entity.x));
		console.assert(Number.isFinite(entity.y));
		return Math.toTile(entity.y)*this.xLen+Math.toTile(entity.x);
	}

	//
	// Item Lookup
	//
	itemLookupAdd(x,y,item) {
		let lPos = this.lPos(x,y);
		if( !this._itemLookup[lPos] ) {
			this._itemLookup[lPos] = [item];
		}
		else {
			if( !this._itemLookup[lPos].find( i=>i.id==item.id ) ) {
				// we have to try to find this because _addToListAndBunch might have aggregated it!
				this._itemLookup[lPos].push(item);
			}
		}
	}
	itemLookupRemove(item) {
		let lPos = this.lPosOf(item);
		Array.filterInPlace( this._itemLookup[lPos], i => i.id!=item.id );
	}
	itemLookupGet(x,y) {
		let lPos = this.lPos(x,y);
		return this._itemLookup[lPos];
	}

	//
	// Entity Lookup
	//
	_entityLookupAdd(entity,x,y) {
		let lPos = this.lPos(x,y);
		if( !this._entityLookup[lPos] ) {
			this._entityLookup[lPos] = [entity];
		}
		else {
			if( !this._entityLookup[lPos].find( i=>i.id==entity.id ) ) {
				// we have to try to find this because _addToListAndBunch might have aggregated it!
				this._entityLookup[lPos].push(entity);
			}
		}
	}
	_entityLookupRemove(entity,x,y) {
		let lPos = this.lPos(x,y);
		Array.filterInPlace( this._entityLookup[lPos], i => i.id!=entity.id );
	}
	_entityLookupGet(x,y) {
		let lPos = this.lPos(x,y);
		return this._entityLookup[lPos];
	}

	//
	// Scent
	//
	scentGet(x,y) {
		let lPos = this.lPos(x,y)*2;
		return this._scentLookup[lPos]||0;
	}
	scentGetEntity(x,y) {
		let lPos = this.lPos(x,y)*2;
		return this._scentLookup[lPos+1]||0;
	}
	scentSet(x,y,time,entity) {
		let lPos = this.lPos(x,y)*2;
		this._scentLookup[lPos+0] = time;
		if( entity !== undefined ) {
			this._scentLookup[lPos+1] = entity;
		}
	}
	get entityList() {
		return this.area.entityList;
	}
	allEntitiesNear(x,y,dist) {
		let clip = new ClipRect().setCtr(x,y,dist);
		let list = [];
		this.entityList.forEach( entity => clip.contains(entity.x,entity.y) ? list.push(entity) : null );
		this.itemList.forEach( item => clip.contains(item.x,item.y) ? list.push(item) : null );
		this.map.traverseNear( x, y, dist, (x,y) => {
			let tile = this.map.getTileEntity(x,y);
			list.push(tile);
		});
		return list;
	}

	get defaultFloorSymbol() {
		return TypeIdToSymbol[this.area.theme.palette.floor];
	}
	calcLookup(lookup,testFn) {
		let xLen = this.xLen;
		this.traverse( (x,y) => {
			let lPos = y*this.xLen+x;
			lookup[lPos] = testFn(x,y);
		});
		return lookup;
	}
	scentLeave(x,y,entity,timeReductionPercent=0) {
		// WARNING: Don't make any monster that uses smell have ANY stink. It will
		// mask the scent of its prey with its own smell!
		if( !entity.isMonsterType && !entity.stink ) {
			return false;
		}
		let tile = this.tileTypeGet(x,y);
		if( tile.noScent ) {
			return false;
		}
		let time = Time.simTime - Math.floor((timeReductionPercent/100)*Rules.SCENT_AGE_LIMIT);
		if( time >= this.scentGet(x,y) ) {
			this.scentSet(x,y,time,entity);
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
			if( stinkTime >= this.scentGet(x,y) ) {
				this.scentSet(x,y,stinkTime,entity);
			}
		});
		return 2;
	}
	scentClear(x,y) {
		if( this.scentGet(x,y) ) {
			this.scentSet(x,y,-Rules.SCENT_AGE_LIMIT,null);
		}
	}
	scentGetAge(x,y) {
		return Time.simTime-(this.scentGet(x,y) || Rules.SCENT_AGE_LIMIT);
	}
	scentIncAge(x,y,amount) {
		console.assert(amount);
		this.scentSet(x,y,this.scentGet(x,y)-amount);
	}
	scentGetEntitySmelled(x,y,maxScentAge=Rules.SCENT_AGE_LIMIT,excludeId) {
		maxScentAge = Math.min(maxScentAge,Rules.SCENT_AGE_LIMIT);
		let simTime = this.scentGet(x,y);
		if( !simTime || simTime < Time.simTime-maxScentAge ) {
			return null;
		}
		let found = this.scentGetEntity(x,y);
		if( found && found.id == excludeId ) {
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
		let lPos = this.lPos(x,y);
		let testFn = pWalk(this);
		this.walkLookup[lPos] = testFn(x,y);
	}

	getWalkable(x,y) {
		let lPos = this.lPos(x,y);
		return this.walkLookup[lPos];
	}

	// This is used in testing, but not the main game.
	setObstacle(x,y,prob) {
		let lPos = this.lPos(x,y);
		this.walkLookup[lPos] = prob;
	}

	_tileProxy(tileType,x,y) {
		if( !tileType.isTileType || tileType.isTileEntity || tileType === false ) {
			// You only need to make adhoc versions of TILES, because they lack (x,y) coords.
			// This also means no permanent data can exist in them.
			debugger;
			return tileType;
		}
		x = Math.toTile(x);
		y = Math.toTile(y);
		return Object.assign( {}, tileType, { 
			id: this.area.id+'.'+x+','+y,
			x: x,
			y: y,
			area: this.area,
			map: this,
			isTileEntity: true
		});
	}


	getTileEntity(x,y) {
		x = Math.toTile(x);
		y = Math.toTile(y);
		this.tileEntity[y] = this.tileEntity[y] || [];
		if( !this.tileEntity[y][x] ) {
			let tileEntity = this._tileProxy( this.tileTypeGet(x,y), x, y );
			this.tileEntity[y][x] = tileEntity;
			//console.log('Tile entity ('+x+','+y+') '+adhocEntity.typeId);
		}
		console.assert(this.tileEntity[y][x]);
		return this.tileEntity[y][x];
	}

	findTileArrayNear(x,y,dist) {
		let result = [];
		this.traverseNear( x, y, dist, (x,y) => {
			result.push(this.getTileEntity(x,y));
		});
		return result;
	}

	tileTypeGetFastUnasfe(x,y) {
		x = Math.toTile(x);
		y = Math.toTile(y);
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
		x = Math.toTile(x);
		y = Math.toTile(y);
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
		if( !f.first ) {
			console.log( "No player start marker found. Searching for stairsUp." );
			f = new Finder(this.itemList).filter( item => item.typeId=='stairsUp' );
		}
		if( !f.first ) {
			f = new Finder(this.itemList).filter( item => item.typeId=='stairsDown' );
		}
		if( !f.first ) {
			let entity = {};
			let maySafelyExist = pWalk(this,true);
			let x,y;
			[x,y] = this.spiralFind(1,1,(x,y,tile) => {
				return maySafelyExist(x,y) === Problem.NONE
			});
			f = { first: {x:x,y:y} };
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
		x = Math.toTile(x);
		y = Math.toTile(y);

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
		return this.siteLookup[this.lPos(x,y)];
	}

	getLightAt(x,y,defaultValue=0) {
		if( !this.inBounds(x,y) ) {
			return defaultValue;
		}
		let lPos = this.lPos(x,y);
		let light = this.area.lightCaster.lightMap[lPos];
		//let light = this.lightCache[lPos];	// note, this should NEVER have MEMORY_MAP_FLAG inside it.
		return light === undefined ? defaultValue : light;
	}

	itemCreateByType(x,y,type,presets,inject) {
		// Not strictly necessary. It all depends on whether we eventually want to
		// have non-aligned items.
		x = Math.toTile(x);
		y = Math.toTile(y);

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

	isItemAtFastUnsafe(x,y) {
		// This has a two flaws:
		// 1. It wraps around
		// 2. It assumes x and y are both integers for the indexing.
		// but it is used during pathfind, so we're going to let this little problem slide.
		let i = this.itemLookupGet(x,y);
		return i && i.length;
	}

	isItemAt(x,y) {
		// This has a TINY little flaw, in that the left and right sides wrap around. But it is used
		// during pathfind, so we're going to let this little problem slide.
		return this.isItemAtFastUnsafe(x,y);
	}
	findItem(me) {
		return new Finder(this.itemList,me);
	}
	findItemsNear(x,y,dist) {
		// WARNING: If we go to floating point coordinate this will be pretty weak sauce.
		let itemList = [];
		this.traverseNear(x,y,dist,(x,y)=> {
			let temp = this.itemLookupGet(x,y);
			if( temp && temp.length ) {
				itemList.push(...temp);
			}
		});
		return itemList;
	}
	findFirstItemAt(x,y) {
		if( !this.inBounds(x,y) ) return false;
		let itemList = this.itemLookupGet(x,y);
		if( !itemList.length ) return false;
		return itemList[0];
	}
	findItemAt(x,y) {
		if( !this.inBounds(x,y) ) return new Finder([]);
		return new Finder(this.itemLookupGet(x,y) || this.itemLookupStaticNop);
	}
	findItemNear(x,y,dist) {
		let result = [];
		this.traverseNear( x, y, dist, (x,y) => {
			result.push( ...(this.itemLookupGet(x,y) || this.itemLookupStaticNop) );
		});
		return new Finder(result);
	}
	findChosenItemAt(x,y,fn) {
		if( this.inBounds(x,y) ) {
			let a = this.itemLookupGet(x,y);
			if( a ) {
				return a.find(fn);
			}
		}
	}

	isEntityAt(x,y) {
		// This has a TINY little flaw, in that the left and right sides wrap around. But it is used
		// during pathfind, so we're going to let this little problem slide.
		let e = this._entityLookupGet(x,y);
		return e && e.length;
	}
	findEntityArrayAt(x,y) {
		if( !this.inBounds(x,y) ) return this.entityLookupStaticNop;
		return this._entityLookupGet(x,y) || this.entityLookupStaticNop;
	}
	findEntityArrayNear(x,y,dist) {
		let result = [];
		this.traverseNear( x, y, dist, (x,y) => {
			result.push( ...(this._entityLookupGet(x,y) || this.entityLookupStaticNop) );
		});
		return result;
	}
	_entityRemove(entity,x,y) {
		//console.log( '- '+entity.name+' ('+entity.x+','+entity.y+')' );
		if( entity.light && entity.area ) {
			entity.area.lightDirty = true;
		}

		//console.log('entityRemove',entity.name,x,y);
		this._entityLookupRemove(entity,x,y);
	}
	_entityInsert(entity,x,y) {
		//console.log( '+ '+entity.name+' ('+entity.x+','+entity.y+')' );
		if( entity.light && entity.area ) {
			entity.area.lightDirty = true;
		}
		//console.log('entityInsert',entity.name,x,y);
		this._entityLookupAdd(entity,x,y);
		guiMessage('stageEntityNotice',entity,'map');
	}

	_itemRemove(item) {
		//if( !this.itemList.includes(item) ) {
		//	debugger;
		//}
		if( item.light ) {
			this.area.lightDirty = true;
		}

		Array.filterInPlace( this.itemList, i => i.id!=item.id );
		this.itemLookupRemove(item);

		Scene.detach( item.spriteList );
		this.calcWalkable(item.x,item.y);
		if( Rules.removeScentOfTheDead ) {
			this.traverse( (x,y) => {
				if( this.scentGetEntity(x,y) === item ) {
					this.scentSet(x,y,Rules.SCENT_AGE_LIMIT,null);
				}
			});
		}
	}
	_itemTake(item,x,y) {

		// WARNING
		// Do not change x and y toTile here. Items are set to the position of their
		// owner every round, and the owner could be anywhere.

		if( this.itemList.includes(item) ) {
			debugger;
		}

		if( item.onPutInWorld ) {
			item.onPutInWorld.call(item,x,y,this);
		}

		if( item.dead ) {
			return null;
		}
		// NUANCE! You must set the item's x,y in order for _addToListAndBunch to bunch properly.
		item.x = x;
		item.y = y;
		if( item.isHidden ) {
			this.itemListHidden.push(item);
			return item;
		}

		item = item._addToListAndBunch(this.itemList);
		this.itemLookupAdd(x,y,item);
		this.calcWalkable(x,y);
		this.scentLeave(x,y,item);
		//this.tileSymbolSet(item.x,item.y,item.symbol);
		if( item.light ) {
			this.area.lightDirty = true;
		}
		guiMessage('stageEntityNotice',item,'map');

		return item;
	}
}

return {
	SimpleMap: SimpleMap,
	Map: Map
}

});

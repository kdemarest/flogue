Module.add('path',function() {

function pWalk(map,ignoreEntity) {
	let nulItem = {};
	return function(x,y) {
		if( !ignoreEntity && map.isEntityAt(x,y) ) {
			return Problem.ENTITY;
		}
		if( !map.isItemAtFastUnsafe(x,y) ) {
			let tile = map.tileTypeGet(x,y);
			if( !tile.mayWalk ) return Problem.WALL;
			if( tile.isProblem ) return tile;
			return Problem.NONE;
		}

		let itemBlocking = map.findChosenItemAt( x, y, item => !item.mayWalk && !item.isRemovable );
		if( itemBlocking ) {
			if( itemBlocking.isDoor ) {
				return itemBlocking;	// isProblem will get called upon this.
			}
			return Problem.WALL;
		}
		let tile = map.tileTypeGet(x,y);
		if( !tile.mayWalk ) return Problem.WALL;
		let itemProblem = map.findChosenItemAt( x, y, item => item.isProblem );
		if( itemProblem ) return itemProblem;
		if( tile.isProblem ) return tile;
		return Problem.NONE;
	}
}

function pWalkQuick(map) {
	let xLen = map.xLen;
	return function(x,y) {
		return map.walkLookup[map.lPos(x,y)];
	}
}

function pVerySafe(map,fn) {
	return function(x,y) {
		let tile = map.tileTypeGet(x,y);
		if( !tile.mayWalk || tile.isProblem ) return false;
		let item = map.findChosenItemAt(x,y,item=>!item.mayWalk || item.isProblem);
		if( item ) return false;
		let entity = new Finder(map.area.entityList).near(x,y,2);
		if( entity.count ) return false;
		return fn ? fn(x,y) : true;
	}
}


class Path {
	constructor(map,distLimit,isOrtho,avoidMetric=10,testFn) {
		this.map = map;
		this.distLimit = distLimit === null || distLimit === undefined ? map.xLen*map.yLen : distLimit;
		this.isOrtho = isOrtho
		this.avoidMetric = avoidMetric;
		this.testFn = testFn || pWalkQuick(map);
		this.grid = null;
		this.sx = null;
		this.sy = null;
		this.ex = null;
		this.ey = null;
		this.path = [];
	}
	get xLen() {
		return this.map.xLen;
	}
	leadsTo(x,y) {
		x = Math.toTile(x);
		y = Math.toTile(y);
		return this.ex==x && this.ey==y;
	}
	gridGet(x,y) {
		console.assert(x==Math.floor(x));
		return this.grid[y*this.xLen+x] || Problem.NONE;
	}
	render() {
		let pathSummary = [];
		let px = this.exActual;
		let py = this.eyActual;
		for( let i=this.path.length-1 ; i>=0 ; i-=3 ) {
			let dir = this.path[i];
			px -= Direction.add[dir].x;
			py -= Direction.add[dir].y;
			pathSummary[py*this.xLen+px] = '*';
		};

		let stepChar = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
		let s = '';
		this.map.traverse( (x,y) => {
			let g = this.gridGet(x,y);
			let c = ( g==Problem.WALL ? '#' : ( g==Problem.NONE ? '.' : stepChar.charAt(g) ) );
			if( x==this.sx && y==this.sy ) {
				c = '+';
			}
			else
//			if( x==this.ex && y==this.ey ) {
//				c = '=';
//			}
//			else
//			if( x==this.exActual && y==this.eyActual ) {
//				c = '-';
//			}
//			else
			if( pathSummary[y*this.xLen+x] ) {
				c = pathSummary[y*this.xLen+x];
			}
			s += c;  // this.tileSymbolGet(x,y) || '?';
			if( x==this.xLen-1 ) {
				s += '\n';
			}
		});
		return s.split('\n');
	}
	stillOnIt(x,y) {
		x = Math.toTile(x);
		y = Math.toTile(y);
		let p = this.path;
		console.assert(p);
		if( p.length <= 0 ) {
			return false;
		}
		for( let i=0 ; i<p.length ; i += 3 ) {
			if( p[i+0] == x && p[i+1] == y ) {
				return true;
			}
		}
		return false;
	}
	getDirFrom(x,y) {
		x = Math.toTile(x);
		y = Math.toTile(y);
		let p = this.path;
		console.assert(p);
		if( p.length <= 0 ) {
			return false;
		}
		for( let i=0 ; i<p.length ; i += 3 ) {
			if( p[i+0] == x && p[i+1] == y ) {
				return p[i+2];
			}
		}
		return false;
	}
	findPath(entity,sx,sy,ex,ey,closeEnough=0,onStep) {

		sx = Math.toTile(sx);
		sy = Math.toTile(sy);
		ex = Math.toTile(ex);
		ey = Math.toTile(ey);
		this.status = {};

		if( this.testFn(ex,ey) == Problem.WALL || this.testFn(ex,ey) == Problem.DEATH ) {
			this.status.illegalEnd = this.testFn(ex,ey) == Problem.WALL ? 'wall' : 'death';
			this.success = false;
			return this.success;
		}


		let self = this;

		this.sx = sx;
		this.sy = sy;
		this.ex = ex;
		this.ey = ey;
		this.exActual = ex;
		this.eyActual = ey;
		this.grid = [];
		this.path = [];

		// We capture the actual min/maxes because the MasonMap is allowed to go into negatives.
		let xMin 	= this.map.xMin;
		let yMin 	= this.map.yMin;
		let xMax 	= this.map.xMax;
		let yMax 	= this.map.yMax;
		let xLen 	= this.map.xLen;
		let dirStep = this.isOrtho ? 2 : 1;
		let avoidMetric = this.avoidMetric;
		let grid 	= this.grid;
		let testFn 	= this.testFn;
		let distLimit = this.distLimit;

		function flood() {

			function fill(x,y,dist) {
				let lPos = y*xLen+x;
				let v = grid[lPos];
				if( v===undefined ) {
					v=testFn(x,y);
				}
				if( typeof v !== 'number' ) {
					v = v.isProblem(entity,v);
					console.assert( (v>=0 && v<=1) || v == Problem.DEATH );

// This seems to make us fall down pits a lot... I think pits need a different marking than DEATH.
//					if( entity.immortal && v == Problem.DEATH ) {
//						v = Problem.NEARDEATH;
//					}
				}
				if( v >= 1 ) {
					return false;	// 1 or greater means you have already visited, or tht you will die/hit wall entering this square
				}
				let myDist = Math.floor(dist+1+v*avoidMetric);
				grid[lPos] = myDist;	// or if isProblem, more than 1
				if( myDist > distLimit ) {
					self.status.reachedLimit = 1;
					return false;
				}
				hotTiles.push(myDist,x,y);
				++numMade;
				return true;
			}

			let hotTiles = [];
			let numMade = 0;
			let numDone = 0;
			let dist = 1;		// This MUST start at 1, because all legal-move grid positions are n>=0 && n<1.0
			let lPos = sy*xLen+sx;
			console.assert( grid[lPos] === undefined );
			let initialTest = testFn(sx,sy);
			console.assert( initialTest !== undefined );
			grid[lPos] = dist;
			hotTiles.push(dist,sx,sy);
			++numMade;

			let reps = 10000;
			while( reps-- && numDone < numMade) {
				if( onStep ) onStep();

				for( let i=0 ; i<hotTiles.length ; i+=3 ) {
					let curDist = hotTiles[i];
					if( curDist != dist ) {
						continue;
					}
					let x = hotTiles[i+1];
					let y = hotTiles[i+2];
					++numDone;

					let testEdge = x<=xMin || y<=yMin || x>=xMax || y>=yMax;

					for( let dir=0; dir<8 ; dir += dirStep ) {
						let nx = x + Direction.add[dir].x;
						let ny = y + Direction.add[dir].y;
						if( testEdge && (nx<xMin || ny<xMin || nx>xMax || ny>yMax) ) continue;
						let ok = fill(nx,ny,dist);
						if( !ok ) {
							continue;
						}
						let dx = nx-ex;
						let dy = ny-ey;
						if( dx >= -closeEnough && dx<=closeEnough && dy>=-closeEnough && dy<=closeEnough ) {
							// Move the end, so that we can back-search from it.
							self.exActual = nx;
							self.eyActual = ny;
							self.closeEnough = closeEnough;
							return true;
						}
					}
				}
				dist += 1;
			}
			if( reps <=0 ) self.status.exceededReps = 1;
			else self.status.floodFoundNoPath = 1;
			return false;
		}

		let found = flood();
		if( !found ) {
			this.success = false;
			return this.success;
		}

		this.success = true;

		{
			// WARNING! These might not be the same as what was passed in, due to closeEnough. That is OK!
			let x = this.exActual;
			let y = this.eyActual;
			let reps = 1000;
			let favor = [0,1,0,1,0,1,0,1];
			while( --reps && !(x==sx && y==sy) ) {
				let bestDir = -1;
				let bestValue = 999999;
				let testEdge = x<=xMin || y<=yMin || x>=xMax || y>=yMax;
				for( let dir=0 ; dir<8 ; dir += dirStep ) {
					let nx = x + Direction.add[dir].x;
					let ny = y + Direction.add[dir].y;
					if( testEdge && (nx<xMin || ny<xMin || nx>xMax || ny>yMax) ) continue;
					let lPos = ny*xLen+nx;
					let v = grid[lPos];
					if( v >= 1 && v < Problem.WALL  ) {
						v = v*100+favor[dir];
						if( v < bestValue ) {
							bestDir = dir;
							bestValue = v;
						}
					}
				}
				x += Direction.add[bestDir].x;
				y += Direction.add[bestDir].y;

				this.path.unshift(x,y,(bestDir+4)%8);
				if( onStep ) onStep();
			}
			if( reps <=0 ) {
				this.success = false;
				this.status.pathTooLong = 1;
			}
			if( this.path.length == 0 ) {
				this.status.zeroLengthPath = 1;
			}
		}
		return this.success;
	}
}

return {
	Path: Path,
	pWalk: pWalk,
	pVerySafe: pVerySafe
}

});

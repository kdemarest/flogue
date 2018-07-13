
function pWalk(map) {
	let nulItem = {};
	return function(x,y) {
		if( map.isEntityAt(x,y) ) {
			return Prob.ENTITY;
		}
		if( !map.isItemAt(x,y) ) {
			let tile = map.tileTypeGet(x,y);
			if( !tile.mayWalk ) return Prob.WALL;
			if( tile.isProblem ) return tile;
			return Prob.NONE;
		}

		let itemBlocking = map.findChosenItemAt( x, y, item => !item.mayWalk );
		if( itemBlocking ) return Prob.WALL;
		let tile = map.tileTypeGet(x,y);
		if( !tile.mayWalk ) return Prob.WALL;
		let itemProblem = map.findChosenItemAt( x, y, item => item.isProblem );
		if( itemProblem ) return itemProblem;
		if( tile.isProblem ) return tile;
		return Prob.NONE;
	}
}

function pWalkQuick(map) {
	let xLen = map.xLen;
	return function(x,y) {
		return map.walkLookup[y*xLen+x];
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
		this.xLen = map.xLen;
		this.yLen = map.yLen;
		this.distLimit = distLimit === null ? xLen*yLen : distLimit;
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
	leadsTo(x,y) {
		return this.ex==x && this.ey==y;
	}
	gridGet(x,y) {
		return this.grid[y*this.xLen+x] || Prob.NONE;
	}
	render() {
		let pathSummary = [];
		let px = this.exActual;
		let py = this.eyActual;
		for( let i=this.path.length-1 ; i>=0 ; i-=3 ) {
			let dir = this.path[i];
			px -= DirectionAdd[dir].x;
			py -= DirectionAdd[dir].y;
			pathSummary[py*this.xLen+px] = '*';
		};

		let stepChar = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
		let s = '';
		this.map.traverse( (x,y) => {
			let g = this.gridGet(x,y);
			let c = ( g==Prob.WALL ? '#' : ( g==Prob.NONE ? '.' : stepChar.charAt(g) ) );
			if( x==this.sx && y==this.sy ) {
				c = 'S';
			}
			else
			if( x==this.ex && y==this.ey ) {
				c = 'E';
			}
			else
			if( x==this.exActual && y==this.eyActual ) {
				c = 'e';
			}
			else
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

		let self = this;

		this.sx = sx;
		this.sy = sy;
		this.ex = ex;
		this.ey = ey;
		this.exActual = ex;
		this.eyActual = ey;
		this.grid = [];
		this.path = [];

		this.status = {};

		let xLen 	= this.xLen;
		let yLen 	= this.yLen;
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
					console.assert( (v>=0 && v<=1) || v == Prob.DEATH );
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

					let testEdge = x<=0 || y<=0 || x>=xLen-1 || y>= yLen-1;

					for( let dir=0; dir<8 ; dir += dirStep ) {
						let nx = x + DirectionAdd[dir].x;
						let ny = y + DirectionAdd[dir].y;
						if( testEdge && (nx<0 || ny<0 || nx>=xLen || ny>=yLen) ) continue;
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
				let testEdge = x<=0 || y<=0 || x>=xLen-1 || y>= yLen-1;
				for( let dir=0 ; dir<8 ; dir += dirStep ) {
					let nx = x + DirectionAdd[dir].x;
					let ny = y + DirectionAdd[dir].y;
					if( testEdge && (nx<0 || ny<0 || nx>=xLen || ny>=yLen) ) continue;
					let lPos = ny*xLen+nx;
					let v = grid[lPos];
					if( v >= 1 && v < Prob.WALL  ) {
						v = v*100+favor[dir];
						if( v < bestValue ) {
							bestDir = dir;
							bestValue = v;
						}
					}
				}
				x += DirectionAdd[bestDir].x;
				y += DirectionAdd[bestDir].y;

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


class Path {
	constructor(map) {
		this.map = map;
		this.xLen = map.xLen;
		this.yLen = map.yLen;
		this.grid = null;
		this.gridInit = map.walkLookup;
		this.sx = null;
		this.sy = null;
		this.ex = null;
		this.ey = null;
		this.path = [];
	}
	gridGet(x,y) {
		return this.grid[y*this.xLen+x] || Prob.NONE;
	}
	renderToString() {
		let pathSummary = [];
		let px = this.ex;
		let py = this.ey;
		for( let i=this.path.length-1 ; i>=0 ; i-- ) {
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
			if( pathSummary[y*this.xLen+x] ) {
				c = pathSummary[y*this.xLen+x];
			}
			s += c;  // this.tileSymbolGet(x,y) || '?';
			if( x==this.xLen-1 ) {
				s += '\n';
			}
		});
		return s;
	}
	findPath(entity,sx,sy,ex,ey,onStep) {

		let self = this;

		this.sx = sx;
		this.sy = sy;
		this.ex = ex;
		this.ey = ey;
		this.grid = [].concat(this.gridInit);
		this.path = [];

		let xLen = this.xLen;
		let yLen = this.yLen;
		let grid = this.grid;

		function flood() {

			function fill(x,y,dist) {
				let lPos = y*xLen+x;
				let v = grid[lPos];
				if( typeof v !== 'number' ) {
					v = v.isProblem(entity,v);
					console.assert( (v>=0 && v<=1) || v == Prob.DEATH );
				}
				if( v >= 1 ) {
					return false;	// 1 or greater means you have already visited, or tht you will die/hit wall entering this square
				}
				let myDist = Math.floor(dist+1+v*10);
				grid[lPos] = myDist;	// or if isProblem, more than 1
				hotTiles.push(myDist,x,y);
				++numMade;
				return true;
			}


			let hotTiles = [];
			let numMade = 0;
			let numDone = 0;
			let dist = 1;		// This MUST start at 1, because all legal-move grid positions are n>=0 && n<1.0
			let lPos = sy*xLen+sx;
			console.assert( grid[lPos] !== undefined );
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

					for( let dir=0; dir<8 ; dir += 1 ) {
						let nx = x + DirectionAdd[dir].x;
						let ny = y + DirectionAdd[dir].y;
						if( testEdge && (nx<0 || ny<0 || nx>=xLen || ny>=yLen) ) continue;
						let ok = fill(nx,ny,dist);
						if( !ok ) continue;
						if( nx == ex && ny == ey ) {
							return true;
						}
					}
				}
				dist += 1;
			}
			return false;
		}

		let found = flood();
		if( !found ) {
			return false;
		}

		{
			let x = ex;
			let y = ey;
			let reps = 1000;
			let favor = [0,1,0,1,0,1,0,1];
			while( --reps && !(x==sx && y==sy) ) {
				let bestDir = -1;
				let bestValue = 999999;
				let testEdge = x<=0 || y<=0 || x>=xLen-1 || y>= yLen-1;
				for( let dir=0 ; dir<8 ; dir += 1 ) {
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
				this.path.unshift((bestDir+4)%8);
				x += DirectionAdd[bestDir].x;
				y += DirectionAdd[bestDir].y;
				if( onStep ) onStep();
			}
		}
		return this.path.length;
	}
}


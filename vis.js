function getTrueDistance(dx,dy) {
	return Math.sqrt(dx*dx+dy*dy);
}


class Vis {
	constructor(getMapFn) {
		this.getMapFn = getMapFn;
		this.visCache = [];
		this.cacheVis();
		this.shootCache = {};
	}
	cacheVis() {
		let map = this.getMapFn();
		console.assert(map);
		map.traverse( (x,y) => {
			this.visSet( map, x, y, map.tileTypeGet(x,y).opacity||0 );
		});
		map.itemList.forEach( item => this.visSet( map, item.x, item.y, Math.max( this.visGet(map,item.x,item.y), item.opacity||0 ) ) );
	}
	visGet(map,x,y) {
		if( !map.inBounds(x,y) ) {
			return false;
		}
		return this.visCache[y*map.xLen+x];
	}
	visSet(map,x,y,opacity) {
		if( !map.inBounds(x,y) ) {
			return false;
		}
		return this.visCache[y*map.xLen+x] = opacity;
	}
	shoot(px,py,sx,sy,tx,ty,spots) {
		let map = this.getMapFn();
		if( sx==tx && sy==ty ) {
			if( spots ) return spots;
			return true;
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
		dist -= 0.5; //0.5;
		let wallAmount = 0;
		while( dist > 0 ) {
			let xInt = Math.floor(x);
			let yInt = Math.floor(y);
			let atPlayer = (xInt==px && yInt==py);
			if( !atPlayer ) {
				if( spots ) {
					if( !spots.length || !(spots[spots.length-2]==xInt-px && spots[spots.length-1]==yInt-py) ) {
						spots.push(xInt-px,yInt-py);
					}
				}
				else {
					console.assert(map.inBounds(xInt,yInt));
					wallAmount += this.visGet(map,xInt,yInt); // map.tileTypeGet(xInt,yInt).opacity;
					if( wallAmount >= 1 ) { return false; }
				}
			}
			x += dx;
			y += dy;
			dist -= step;
		}
		if( spots ) return spots;
		return true;
	}

	fast(px,py,spot) {
		if( !spot.length ) return true;
		let xLen = this.getMapFn().xLen;
		let vc = this.visCache;;
		let wallAmount = 0;
		for( let i=0 ; i<spot.length ; i+=2 ) {
			let x = (px+spot[i+0]);
			let y = (py+spot[i+1]);
			wallAmount += vc[y*xLen+x];
			if( wallAmount >= 1 ) { return false; }
		}
		return true;
	}

	shoot4(px,py,x,y,blind) {
		if( blind ) {
			return px==x && py==y;
		}
		let dx = x-px;
		let dy = y-py;
		let cIndex = ''+dx+','+dy;
		if( !this.shootCache[cIndex] ) {
			console.log('Caching '+cIndex);
			let tl = this.shoot(px,py,px,py,x,y,[]);
			let tr = this.shoot(px,py,px+0.95,py+0.00,x+0.95,y+0.00,[]);
			let bl = this.shoot(px,py,px+0.00,py+0.95,x+0.00,y+0.95,[]);
			let br = this.shoot(px,py,px+0.95,py+0.95,x+0.95,y+0.95,[]);
			this.shootCache[cIndex] = {
				tl: tl,
				tr: tr,
				bl: bl,
				br: br
			};
		}

		let tl = this.fast(px,py,this.shootCache[cIndex].tl);
		let tr = this.fast(px,py,this.shootCache[cIndex].tr);
		let bl = this.fast(px,py,this.shootCache[cIndex].bl);
		let br = this.fast(px,py,this.shootCache[cIndex].br);
		let isVisible = tl || tr || bl || br;
		return isVisible;
	}

	generateProList() {

		function atanDeg(y,x) {
			return Math.floor( Math.atan2(y,x)/(2*Math.PI)*360 + 720 ) % 360;
		}

		let d = MaxSightDistance;
		let proList = [];
		for( let y=-d ; y<=d ; ++y ) {
			for( let x=-d ; x<=d ; ++x ) {
				if( x==0 && y==0 ) continue;
				let q = 0.50;
				let dist = getTrueDistance(x,y);
				let nearDist = Math.min(getTrueDistance(x-q,y-q),getTrueDistance(x-q,y+q),getTrueDistance(x+q,y-q),getTrueDistance(x+q,y+q));
				let mid = atanDeg(y,x);
				let a = atanDeg(y-q,x-q);
				let b = atanDeg(y-q,x+q);
				let c = atanDeg(y+q,x-q);
				let d = atanDeg(y+q,x+q);
				let left = mid;
				let right = mid;
				for( let i=0 ; i<120 ; ++i ) {
					let l0 = (360+mid-i)%360;
					let r0 = (360+mid+i)%360;
					if( l0 == a ) left = a;
					if( l0 == b ) left = b;
					if( l0 == c ) left = c;
					if( l0 == d ) left = d;
					if( r0 == a ) right = a;
					if( r0 == b ) right = b;
					if( r0 == c ) right = c;
					if( r0 == d ) right = d;
				}
				console.assert(left!==right);
				let span = 0;
				for( let i = left ; i!=right ; i = (i+1) % 360 ) {
					++span;
				}
				proList.push({x:x,y:y,dist:dist,mid:mid,span:span,left:left,right:right,nearDist:nearDist});
			}
		}
		Array.shuffle(proList);	// This is so that the sort is less predictable for equal distances.
		proList.sort( (a,b) => a.dist-b.dist );
		return proList;
	}

	calcVis(px,py,sightDistance,blind,xray,cachedVis,mapMemory) {
		let map = this.getMapFn();
		let xLen = map.xLen;

		let a = cachedVis || [];
		let q = [];

		if( mapMemory ) {
			for( let item of map.itemList ) {
				q[item.y*map.xLen+item.x] = item;
			}
		}

		// Remember all block sweeps, and their distance.
		if( !this.proList ) {
			this.proList = this.generateProList();
		}

		let defaultValue = false; //xray && !blind;
		map.traverse( (x,y) => { a[y] = a[y] || []; a[y][x] = defaultValue; } );
		a[py][px] = true;
//		if( xray || blind ) return;

		let vc = this.visCache;
		let sweep = [];
		let opacity = [];
		for( let i=0 ; i<360 ; ++i ) {
			sweep[i] = 40*40;
			opacity[i] = 0;
		}

		let done = false;
		this.proList.forEach( pro => {
			if( done ) return;
			let x = pro.x;
			let y = pro.y;
			if( x<-sightDistance || y<-sightDistance || x>sightDistance || y>sightDistance ) {
				done=true;
				return;
			}
			x += px;
			y += py;
			if( x<0 || x>=map.xLen || y<0 || y>=map.yLen ) return;
			let dist = pro.dist;
			let nearDist = pro.nearDist;
			{
				// The block only needs to be 20% visible to be considered visible.
				let v = pro.span*0.05;
				for( let i = pro.left ; i!=pro.right ; i = (i+1) % 360 ) {
					if( sweep[i] >= nearDist || opacity[i] < 1 ) {
						--v;
						if( v<=0 ) break;
					}
				}
				if( v > 0 ) {
					return;
				}
			}
			if( mapMemory ) {
				let item = q[y*map.xLen+x];
				mapMemory[y] = mapMemory[y] || [];
				mapMemory[y][x] = item ? item : map.tileTypeGet(x,y);
			}
			a[y][x] = true;
			let opa = vc[y*xLen+x];
			if( opa>0 ) {
				let i = pro.left;
				while( i!=pro.right ) {
					sweep[i] = Math.min(sweep[i],dist);
					opacity[i] += opa;
					i = (i+1) % 360;
				}
			}
		});

		return a;
	}
}

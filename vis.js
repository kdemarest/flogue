class Vis {
	constructor(getMapFn) {
		this.getMapFn = getMapFn;
		this.visCache = [];
		this.cacheVis();
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
	shoot(px,py,sx,sy,tx,ty,blind) {
		let map = this.getMapFn();
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
				wallAmount += this.visGet(map,xInt,yInt); // map.tileTypeGet(xInt,yInt).opacity;
				if( wallAmount >= 1 ) { return false; }
			}
			x += dx;
			y += dy;
			dist -= step;
		}
		return true;
	}

	shoot4(px,py,x,y,blind) {
		let tl = this.shoot(px,py,px,py,x,y,blind);
		let tr = this.shoot(px,py,px+0.95,py+0.00,x+0.95,y+0.00,blind);
		let bl = this.shoot(px,py,px+0.00,py+0.95,x+0.00,y+0.95,blind);
		let br = this.shoot(px,py,px+0.95,py+0.95,x+0.95,y+0.95,blind);
		let isVisible = tl || tr || bl || br;
		return isVisible;
	}


	calcVis(px,py,sightDistance,blind,xray,cachedVis,mapMemory) {
		let map = this.getMapFn();

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
				a[y][x] = xray ? true : this.shoot4(px,py,x,y,blind);
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
}

(function() {
	const Dir = { N: 0, NE: 1, E: 2, SE: 3, S: 4, SW: 5, W: 6, NW: 7 };
	const DirAdd = [
		{ x:0,  y:-1 },
		{ x:1,  y:-1 },
		{ x:1,  y:0 },
		{ x:1,  y:1 },
		{ x:0,  y:1 },
		{ x:-1, y:1 },
		{ x:-1, y:0 },
		{ x:-1, y:-1 }
	];

	let ZoneChar = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	let NO_ZONE = -1;

	let TileType = {
		Unknown: '?',
		Floor: ' ',
		Wall: '#'
	};
	let T = TileType;

	// This is an attempt, maybe useless, to avoid exceeding the stack limits.
	let _tile,_xMin,_yMin,_xMax,_yMax,_count,_step,_zone;
	function _zapZone(x,y) {
		_tile[y][x].zone = NO_ZONE;
		_tile[y][x].tile = T.Unknown;
		++_count;
		for( let dir=0; dir<DirAdd.length ; dir += _step ) {
			let nx = x + DirAdd[dir].x;
			let ny = y + DirAdd[dir].y;
			if( nx<_xMin || ny<_yMin || nx>_xMax || ny>_yMax ) continue;
			if( !_tile[ny] || !_tile[ny][nx] || _tile[ny][nx].zone !== _zone ) continue;
			_zapZone(nx,ny);
		}
	}


	class Area {
		constructor(whoseGrid) {
			this.xMin = 0;
			this.yMin = 0;
			this.xMax = 0;
			this.yMax = 0;
			this.tile = whoseGrid || [];

		}
		xLen() { return this.xMax-this.xMin+1; }
		yLen() { return this.yMax-this.yMin+1; }
		setDimensions(xLen,yLen) {
			if( yLen === undefined ) {
				yLen = xLen;
			}
			this.xMin = 0;
			this.yMin = 0;
			this.xMax = this.xMin+xLen-1;
			this.yMax = this.yMin+yLen-1;
			this.fillWeak(T.Unknown);
			return this;
		}
		getVal(key,x,y) {
			x = Math.floor(x);
			y = Math.floor(y);
			if( !this.tile[y] ) {
				return;
			}
			if( !this.tile[y][x] ) {
				return;
			}
			return this.tile[y][x][key];
		}
		getTile(x,y) {
			x = Math.floor(x);
			y = Math.floor(y);
			if( !this.tile[y] ) {
				return T.Unknown;
			}
			if( !this.tile[y][x] ) {
				return T.Unknown;
			}
			return this.tile[y][x].tile || T.Unknown;
		}
		getZone(x,y) {
			x = Math.floor(x);
			y = Math.floor(y);
			if( !this.tile[y] ) {
				return NO_ZONE;
			}
			if( !this.tile[y][x] ) {
				return NO_ZONE;
			}
			return this.tile[y][x].zone;
		}
		ext(x,y) {
			this.xMin = Math.min(x,this.xMin);
			this.yMin = Math.min(y,this.yMin);
			this.xMax = Math.max(x,this.xMax);
			this.yMax = Math.max(y,this.yMax);
		}
		setVal(key,x,y,value) {
			x = Math.floor(x);
			y = Math.floor(y);
			this.ext(x,y);
			this.tile[y] = this.tile[y] || [];
			this.tile[y][x] = this.tile[y][x] || {};
			this.tile[y][x][key] = value;
			return this;
		}
		setAll(x,y,obj) {
			x = Math.floor(x);
			y = Math.floor(y);
			this.ext(x,y);
			this.tile[y] = this.tile[y] || [];
			this.tile[y][x] = obj;
			return this;
		}
		getAll(x,y) {
			x = Math.floor(x);
			y = Math.floor(y);
			if( !this.tile[y] ) {
				return;
			}
			return this.tile[y][x];
		}
		setTile(x,y,tileType,zone=NO_ZONE) {
			x = Math.floor(x);
			y = Math.floor(y);
			this.ext(x,y);
			this.tile[y] = this.tile[y] || [];
			this.tile[y][x] = this.tile[y][x] || {};
			this.tile[y][x].tile = tileType;
			this.tile[y][x].zone = zone;
			return this;
		}
		setZone(x,y,zone) {
			x = Math.floor(x);
			y = Math.floor(y);
			this.ext(x,y);
			this.tile[y] = this.tile[y] || [];
			this.tile[y][x] = this.tile[y][x] || {};
			this.tile[y][x].zone = zone;
			return this;
		}
		area() {
			return this.xLen() * this.yLen();
		}
		traverse(fn,xsInset=0,ysInset=0,xeInset=0,yeInset=0) {
			if( xsInset+xeInset >= this.xLen() ) { debugger; }
			if( ysInset+yeInset >= this.yLen() ) { debugger; }
			for( let y=this.yMin+ysInset ; y<=this.yMax-yeInset ; ++ y ) {
				for( let x=this.xMin+xsInset ; x<=this.xMax-xeInset ; ++x ) {
					let go = fn.call(this,x,y);
					if( go === false ) {
						return this;
					}
				}
			}
			return this;
		}
		findFirst(tileType) {
			let fx,fy;
			this.traverse( (x,y)=> {
				if( this.getTile(x,y)==tileType ) {
					fx=x;
					fy=y;
					return false;
				}
			});
			return [fx,fy];
		}
		getExtents() {
			let xMin = 999999;
			let yMin = 999999;
			let xMax = -999999;
			let yMax = -999999;
			let any = false;
			this.traverse( (x,y) => {
				if( this.getTile(x,y) != T.Unknown ) {
					xMin = Math.min(x,xMin);
					yMin = Math.min(y,yMin);
					xMax = Math.max(x,xMax);
					yMax = Math.max(y,yMax);
					any = true;
				}
			});
			if( !any ) {
				// Always return at least 1x1
				xMin = 0; yMin = 0; xMax = 0; yMax = 0;
			}
			return [xMin,yMin,xMax,yMax];
		}
		expandExtents(amount) {
			this.xMin -= amount;
			this.yMin -= amount;
			this.xMax += amount;
			this.yMax += amount;
		}
		copyFrom(area,xMin,yMin,xMax,yMax) {
			area.traverse( (x,y) => {
				if( x>=xMin && x<=xMax && y>=yMin && y<=yMax ) {
					let obj = area.getAll(x,y);
					if( obj && obj.tile !== T.Unknown ) {
						this.setAll(x-xMin,y-yMin,obj);
					}
				}
			});
			return this;
		}
		sizeToExtents() {
			let xMin,yMin,xMax,yMax;
			[xMin,yMin,xMax,yMax] = this.getExtents();
			let area = new Area();
			area.copyFrom(this,xMin,yMin,xMax,yMax);
			Object.assign(this,area);
		}
		randPos(expand=0) {
			let xExpand = expand;
			let yExpand = expand;
			let x = Math.randInt(this.xMin-xExpand,this.xMax+1+xExpand);
			let y = Math.randInt(this.yMin-yExpand,this.yMax+1+yExpand);
			return [x,y];
		}
		count(tileType) {
			let c = 0;
			this.traverse( (x,y) => c += (this.getTile(x,y)==tileType ? 1 : 0) );
			return c;
		}
		placeRandom(tile,onTile,amount=1) {
			while( amount ) {
				let pos = this.randPos();
				if( this.getTile(pos[0],pos[1]) == onTile ) {
					this.setTile(pos[0],pos[1],tile);
					--amount;
				}
			}
			return this;

		}
		placeEntrance(tile) {
			let amount = 1;
			while( amount ) {
				let x,y;
				[x,y] = this.randPos();
				if( this.getTile(x,y) == T.Floor && this.countAdjacent(x,y,T.Floor)>=3 && this.countAdjacent(x,y,T.Wall)>=1 ) {
					this.setTile(x,y,tile);
					--amount;
				}
			}
			return this;

		}
		removeZoneFlood(x,y,zone,ortho) {
			_tile = this.tile;
			_step = ortho ? 2 : 1;
			_count = 0;
			_xMin = this.xMin;
			_yMin = this.yMin;
			_xMax = this.xMax;
			_yMax = this.yMax;
			_zone = zone;
			_zapZone(x,y);
			return _count;
		}

		flood(x,y,zone,ortho) {
			function expand(x,y) {
				for( let dir=0; dir<DirAdd.length ; dir += step ) {
					let nx = x + DirAdd[dir].x;
					let ny = y + DirAdd[dir].y;
					if( nx<self.xMin || ny<self.yMin || nx>self.xMax || ny>self.yMax ) continue;
					let t = self.getAll(nx,ny);
					if( t.tile !== T.Floor || t.zone == zone) { continue; }
					t.zone = zone;
					++count;
					hotTiles.push(nx,ny);
				}
			}
			let self = this;
			let step = ortho ? 2 : 1;
			let t = self.getAll(x,y);
			if( t.tile !== T.Floor ) { return 0; }
			t.zone = zone;
			let count = 1;
			let hotTiles = [x,y];
			do {
				expand( hotTiles.shift(), hotTiles.shift() );
			} while( hotTiles.length );

			return count;
		}
		floodAll(ortho) {
			let zoneList = [];
			let zone = 0;

			this.clearZones();

			this.traverse( (x,y) => {
				if( this.getZone(x,y) == NO_ZONE && this.getTile(x,y) == T.Floor ) {
					zoneList[zone] = { x:x, y:y, zone: zone, count: this.flood(x,y,zone,ortho) };
					++zone;
				}
			});

			let zoneBySizeDescending = zoneList.sort( (a,b) => b.count-a.count );
			return zoneBySizeDescending;
		}
		gather(fn) {
			let list = [];
			this.traverse( (x,y) => {
				if( fn(x,y) ) {
					list.push(x,y);
				}
			});
			return list;
		}
		countAdjacent(x,y,tileType) {
			x = Math.floor(x);
			y = Math.floor(y);
			let count = 0;
			for( let dir=0 ; dir<DirAdd.length ; ++dir ) {
				if( this.getTile(x+DirAdd[dir].x,y+DirAdd[dir].y) == tileType ) {
					++count;
				}
			}
			return count;
		}
		countOrtho(x,y,tileType) {
			x = Math.floor(x);
			y = Math.floor(y);
			let count = 0;
			for( let dir=0 ; dir<DirAdd.length ; dir += 2 ) {
				if( this.getTile(x+DirAdd[dir].x,y+DirAdd[dir].y) == tileType ) {
					++count;
				}
			}
			return count;
		}
		tweakOrtho(find,surroundedBy,howMany,become) {
			let count = 0;
			let any = true;
			let reps = 999999;
			while( any && reps--) {
				any = false;
				this.traverse( (x,y) => {
					if( this.getTile(x,y)==find && this.countOrtho(x,y,surroundedBy)>=howMany ) {
						this.setTile(x,y,become);
						any = true;
						++count;
					}
				});
			}
			return count;
		}
		removeSingletonWalls(limit=4) {
			this.tweakOrtho(T.Unknown,T.Floor,limit,T.Floor);
			return this;
		}
		removeDiagnoalQuads() {
			let any;
			do {
				any = false;
				this.traverse( (x,y) => {
					let a = this.getTile(x,y);
					let b = this.getTile(x+1,y);
					let c = this.getTile(x,y+1);
					let d = this.getTile(x+1,y+1);
					if( a==d && b==c && a!=b ) {
						if( a!=T.Floor ) {
							this.setTile(x,y,T.Floor);
						}
						else {
							this.setTile(x+1,y,T.Floor);
						}
						any = true;
					}
				},0,0,1,1);
			} while( any );
			return this;
		}
		wallify() {
			this.traverse( (x,y)=> {
				if( this.getTile(x,y)!=T.Floor && this.countAdjacent(x,y,T.Floor)>0 ) {
					this.setTile(x,y,T.Wall);
				}
			},-1,-1,-1,-1);
			return this;
		}
		clearZones(zone=NO_ZONE) {
			this.traverse( (x,y) => this.setZone(x,y,zone) );
		}
		fill(tileType) {
			this.traverse( (x,y) => this.setTile(x,y,tileType) );
			return this;
		}
		fillWeak(tileType) {
			this.traverse( (x,y) => {
				let tile = this.getTile(x,y);
				if( !tile || tile==T.Unknown ) {
					this.setTile(x,y,tileType);
				}
			});
			return this;
		}
		convert(tileFrom,tileTo) {
			this.traverse( (x,y) => {
				if( this.getTile(x,y) == tileFrom ) {
					this.setTile(x,y,tileTo);
				}
			});
		}
		paste(area,xPos,yPos,zone) {
			xPos = Math.floor(xPos);
			yPos = Math.floor(yPos);
			this.traverse( (x,y) => {
				let tile = this.getTile(x,y);
				if( tile !== T.Unknown ) {
					area.setTile(xPos+x,yPos+y,tile);
					area.setZone(xPos+x,yPos+y,zone==NO_ZONE ? this.getZone(x,y) : zone);
				}
			});
			return this;
		}

		renderToString(zones) {
			let s = '';
			let yLast = this.yMin;
			this.traverse( (x,y) => {
				if( y !== yLast ) {
					s += '\n';
				}
				if( zones ) {
					s += ZoneChar.charAt(this.getZone(x,y)+1);
				}
				else {
					s += this.getTile(x,y);
				}
				yLast = y;
			});
			return s;
		}
		render(zones) {
			let s = this.renderToString(zones);
			document.getElementById('map').innerHTML = s;
		}
	}

	function repeat(n,fn) {
		while(n-- > 0 ) {
			fn(n);
		}
	}

	class Cave extends Area {
		makeAmoeba(percentToEat,mustConnect=true) {
			let i=0;
			percentToEat = Math.clamp(percentToEat,0.02,1.0);
			let floorToMake = Math.ceil(this.area() * percentToEat);
			let floorMade = 0;
			let makeChance = 30;

			repeat( Math.max(1,floorToMake/8), n => {
				this.setTile(...this.randPos(-3),T.Floor);
				++floorMade;
			});
			//yield i++;

			let reps = 100000;
			let zoneList = [];

			function more() {
				if( !reps-- ) { return false; }
				if( floorMade < floorToMake ) { return true; }
				if( mustConnect ) {
					if( zoneList.length != 1 ) { return true; }
				}
				return false;
			}

			while( more.call(this) ) {
				let list = this.gather( (x,y) => this.countOrtho(x,y,T.Floor) > 0 );
				console.log("Gathered "+list.length);
				console.log("floor="+floorMade+' of '+floorToMake);

				while( list.length ) {
					let y = list.pop();
					let x = list.pop();
					if( Math.randInt(0,100) < makeChance ) {
						this.setTile(x,y,T.Floor);
						++floorMade;
					}
				}
				//yield i++;

				console.log("floor="+floorMade+' of '+floorToMake);
				let removeCount = 0;
				zoneList = this.floodAll();
				console.log( zoneList.length+' zones');
				while( zoneList.length && zoneList[zoneList.length-1].count < floorMade-floorToMake ) {
					let z = zoneList.pop();
					let count = this.removeZoneFlood(z.x,z.y,z.zone);
					if( count !== z.count ) {
						debugger;
					}
					floorMade -= count;
					removeCount += 1;
				}
				// yield i++;
				console.log("Removed "+removeCount+'. now floor='+floorMade);
				console.log( zoneList.length+' zones remain');
			}
			this.removeDiagnoalQuads();
			// yield i++;
			this.removeSingletonWalls(3);
			// yield i++;
			this.wallify();
			// yield i++;
			this.sizeToExtents();
			// yield i++;
			return this;
		}
		makeDroplets() {

		}
	}


	class Map extends Area {

	}

	function buildMap(style,TileTypeList,MonsterTypeList,ItemTypeList) {

		T.Floor = TileTypeList.floor.symbol;
		T.Wall = TileTypeList.wall.symbol;
		T.Unknown = "\0";
		let map = new Map();
		const cave = new Cave();
		cave.setDimensions(style.dim);
		cave.makeAmoeba(style.floorDensity);
		cave.paste(map,1,1);
		map.convert(T.Unknown,T.Wall);

		map.placeEntrance(ItemTypeList.stairsDown.symbol);
		if( style.entrance ) {
			map.placeEntrance(style.entrance.symbol);
		}
		return map.renderToString();
	}

	function buildMapSlow() {
		let map = new Map();
		const cave = new Cave().setDimensions(150); //Math.randIntBell(5,50));
		let maker = cave.makeAmoeba(Math.rand(0.40, 0.70));
		let m;

		function makeMore() {
			m = maker.next();
			if( m.done ) {
				return false;
			}
			map.fill(T.Unknown);
			cave.paste(map,1,1);
			map.render();
		}

		document.addEventListener( "keydown", makeMore, false );
		makeMore();
	}

	window.Mason = {
		buildMap: buildMap,
		buildMapSlow: buildMapSlow
	};
})();
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
		Unknown: ' ',
		Floor: '.',
		Wall: '#'
	};
	let T = TileType;

	function deltasToDirPredictable(dx,dy) {
		if( dy < 0 ) return dx==0 ? Dir.N : (dx<0 ? Dir.NW : Dir.NE);
		if( dy > 0 ) return dx==0 ? Dir.S : (dx<0 ? Dir.SW : Dir.SE);
		return dx==0 ? false : (dx<0 ? Dir.W : Dir.E);
	} 
	function deltasToDirNaturalOrtho(dx,dy) {
		let ax = Math.abs(dx);
		let ay = Math.abs(dy);
		if( Math.rand(0,ax+ay) < ay ) { dx=0; } else { dy=0; }
		return deltasToDirPredictable(dx,dy);
	}


	class Mason {
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
		getZoneId(x,y) {
			x = Math.floor(x);
			y = Math.floor(y);
			if( !this.tile[y] ) {
				return NO_ZONE;
			}
			if( !this.tile[y][x] ) {
				return NO_ZONE;
			}
			return this.tile[y][x].zoneId;
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
		setTile(x,y,tileType,zoneId=NO_ZONE) {
			x = Math.floor(x);
			y = Math.floor(y);
			this.ext(x,y);
			this.tile[y] = this.tile[y] || [];
			this.tile[y][x] = this.tile[y][x] || {};
			this.tile[y][x].tile = tileType;
			this.tile[y][x].zoneId = zoneId;
			return this;
		}
		setZoneId(x,y,zoneId) {
			x = Math.floor(x);
			y = Math.floor(y);
			this.ext(x,y);
			this.tile[y] = this.tile[y] || [];
			this.tile[y][x] = this.tile[y][x] || {};
			this.tile[y][x].zoneId = zoneId;
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
		copyFrom(area,xMin,yMin,xMax,yMax,tx,ty) {
			area.traverse( (x,y) => {
				if( x>=xMin && x<=xMax && y>=yMin && y<=yMax ) {
					let obj = area.getAll(x,y);
					if( obj && obj.tile !== T.Unknown ) {
						this.setAll(tx+x-xMin,ty+y-yMin,obj);
					}
				}
			});
			return this;
		}
		moveInjectList(injectList,dx,dy) {
			let newInjectList = [];
			for( let key in injectList ) {
				let pos = key.split(',');
				let x = parseInt(pos[0])+dx;
				let y = parseInt(pos[1])+dy;
				newInjectList[''+x+','+y] = injectList[key];
			}
			// Very important here to NOT replace the inject list, but only mondify it.
			for(var key in injectList) {
				delete injectList[key];
			}
			Object.assign(injectList,newInjectList);
		}
		sizeToExtentsWithBorder(injectList,border) {
			let xMin,yMin,xMax,yMax;
			[xMin,yMin,xMax,yMax] = this.getExtents();
			let area = new Mason();
			area.setDimensions(xMax-xMin+1+border*2,yMax-yMin+1+border*2);
			let tx = border;
			let ty = border;
			area.copyFrom(this,xMin,yMin,xMax,yMax,tx,ty);
			Object.assign(this,area);

			this.moveInjectList(injectList,border-xMin,border-yMin);
		}
		randPos(expand=0) {
			let xExpand = expand;
			let yExpand = expand;
			let x = Math.randInt(this.xMin-xExpand,this.xMax+1+xExpand);
			let y = Math.randInt(this.yMin-yExpand,this.yMax+1+yExpand);
			return [x,y];
		}
		randPos4(xa=0,ya=0,xb=0,yb=0) {
			return [Math.randInt(this.xMin+xa,this.xMax+1+xb),Math.randInt(this.yMin+ya,this.xMax+1+yb)];
		}

		count(tileType) {
			let c = 0;
			this.traverse( (x,y) => c += (this.getTile(x,y)==tileType ? 1 : 0) );
			return c;
		}
		countNonWallNonUnkown() {
			let c = 0;
			this.traverse( (x,y) => {
				let tile = this.getTile(x,y);
				c += (tile!=T.Wall && tile!=T.Unknown ? 1 : 0);
		});
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
		countAdjacentFloorish(x,y) {
			x = Math.floor(x);
			y = Math.floor(y);
			let count = 0;
			for( let dir=0 ; dir<DirAdd.length ; ++dir ) {
				let tile = this.getTile(x+DirAdd[dir].x,y+DirAdd[dir].y);
				if( tile != T.Unknown && tile != T.Wall ) {
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
		zoneFlood(x,y,zoneId,ortho,toZoneId=NO_ZONE) {
			function zap(x,y) {
				for( let dir=0; dir<DirAdd.length ; dir += step ) {
					let nx = x + DirAdd[dir].x;
					let ny = y + DirAdd[dir].y;
					if( nx<self.xMin || ny<self.yMin || nx>self.xMax || ny>self.yMax ) continue;
					let t = self.getAll(nx,ny);
					if( t.zoneId !== zoneId) { continue; }
					t.zoneId = toZoneId;
					++count;
					hotTiles.push(nx,ny);
				}
			}
			let self = this;
			let step = ortho ? 2 : 1;
			let t = self.getAll(x,y);
			if( t.zoneId !== zoneId ) debugger;
			t.zoneId = toZoneId;
			let count = 1;
			let hotTiles = [x,y];
			do {
				zap( hotTiles.shift(), hotTiles.shift() );
			} while( hotTiles.length );

			return count;
		}

		flood(x,y,zoneId,ortho,keepTiles) {
			function expand(x,y) {
				for( let dir=0; dir<DirAdd.length ; dir += step ) {
					let nx = x + DirAdd[dir].x;
					let ny = y + DirAdd[dir].y;
					if( nx<self.xMin || ny<self.yMin || nx>self.xMax || ny>self.yMax ) continue;
					let t = self.getAll(nx,ny);
					if( t.tile == T.Unknown || t.tile==T.Wall || (SymbolToType[t.tile].isTileType && !SymbolToType[t.tile].mayWalk) || t.zoneId == zoneId) { continue; }
					t.zoneId = zoneId;
					++count;
					hotTiles.push(nx,ny);
				}
			}
			let self = this;
			let step = ortho ? 2 : 1;
			let t = self.getAll(x,y);
			if( t.tile == T.Unknown || t.tile == T.Wall ) { return 0; }
			t.zoneId = zoneId;
			let count = 1;
			let hotTiles = [x,y];
			let index = 0;
			do {
				expand( hotTiles[index++], hotTiles[index++] );
			} while( index < hotTiles.length );

			return keepTiles ? hotTiles : { length: hotTiles.length };
		}
		floodAll(ortho,keepTiles) {
			let zoneList = [];
			let zoneId = 0;

			this.clearZones();

			this.traverse( (x,y) => {
				if( this.getZoneId(x,y) == NO_ZONE && this.getTile(x,y) == T.Floor ) {
					let z = this.flood(x,y,zoneId,ortho,keepTiles);
					zoneList[zoneId] = { x:x, y:y, zoneId: zoneId, tiles: z, count: z.length/2 };
					++zoneId;
				}
			});

			let zoneBySizeDescending = zoneList.sort( (a,b) => b.count-a.count );
			return zoneBySizeDescending;
		}
		findCenter(zone) {
			let x = 0;
			let y = 0;
			zone.tiles.map( t => { x+=t.x; y+=t.y; } );
			return { x: x/zone.tiles.length, y:y/zone.tiles.length };
		}

		spiralFindOther(x,y,avoidZoneId,haltAtLength) {
			let dir = 0;
			let span = 0.5;
			let remain = span;
			let sameZoneCount = 0;
			let count = 0;
			let countLimit = 4*this.xLen()*this.yLen();	// mult by 4 because you might have started in a corner
			let sx = x;
			let sy = y;
			do {
				count += 1;
				if( count >= haltAtLength ) {
					return false;
				}
				x += DirAdd[dir].x;
				y += DirAdd[dir].y;
				let zoneId = this.getZoneId(x,y);
				if( count <= 8 ) {
					if( zoneId == avoidZoneId ) {
						sameZoneCount++;
						if( sameZoneCount==8 ) {
							// Halt early because the first eight tiles were all my zone, that is,
							// I am an interior tile!
							return false;
						}
					}
				}
				if( zoneId != NO_ZONE && zoneId != avoidZoneId) {
					return {x:sx,y:sy,zoneId:avoidZoneId,tx:x,ty:y,tZoneId:zoneId,count:count};
				}
				remain -= 1;
				if( remain <= 0 ) {
					dir = (dir + 2) % 8;
					span += 0.5;
					remain = span;
				}
			} while( count < countLimit );
			return false;
		}

		zoneLink(x,y,tx,ty,zoneId,linkFn) {
			// to - from
			let reps = 9999;
			while( reps-- ) {
				let dir = linkFn(tx-x,ty-y);
				x += DirAdd[dir].x;
				y += DirAdd[dir].y;
				if( x==tx && y==ty ) {
					return;
				}
				this.setTile(x,y,T.Floor);
				this.setZoneId(x,y,zoneId);
			}
		}

		findProximity(zoneList) {
			// Find the closest tile for every single tile in every zone, that is on the edge.
			let proximity = [];
			for( let zone of zoneList) {
				let maxLength = 4*this.xLen()*this.yLen();
				for( let tileIndex=0 ; tileIndex<zone.tiles.length ; tileIndex += 2 ) {
					let x = zone.tiles[tileIndex];
					let y = zone.tiles[tileIndex+1];
					let result = this.spiralFindOther(x,y,zone.zoneId,maxLength);
					if( result !== false ) {
						proximity.push(result);
					}
				}
			}

			// Sort them so that the closest are first.
			proximity.sort( (a,b) => a.count-b.count );
			return proximity;
		}

		connectAll(wanderLink) {
			let i = 0;
			let reps = 100;
			do {
				let zoneList = this.floodAll(true,true);
				if( zoneList.length <= 1 ) {
					break;
				}

				let proximity = this.findProximity(zoneList);


				// Now, in order, make connections.
				let link = {};
				while( proximity.length ) {
					let p = proximity.shift();
					let pair = Math.min(p.zoneId,p.tZoneId)+'-'+Math.max(p.zoneId,p.tZoneId);
					if( link[pair] ) {
						//console.log('skipping '+pair);
						continue;
					}
					let lean = Math.chance(50);
					function deltasToDirStrict(dx,dy) {
						if( dx && dy ) {
							if( lean ) { dx=0; } else { dy=0; }
						}
						return deltasToDirPredictable(dx,dy);
					}
					this.zoneLink(p.x,p.y,p.tx,p.ty,p.zoneId,wanderLink?deltasToDirNaturalOrtho:deltasToDirStrict);
					console.log("Linked "+pair);
					link[pair] = true;
				}
			} while( reps-- );
		}

		fit(px,py,expand,placeMap) {
			if( px<0 || py<0 || px+placeMap.xLen>this.xLen || py+placeMap.yLen>this.yLen ) {
				return false;
			}
			for( let y=0-expand ; y<placeMap.yLen+expand ; ++y ) {
				for( let x=0-expand ; x<placeMap.xLen+expand ; ++x ) {
					let tile = this.getTile(px+x,py+y);
					if( tile !== T.Unknown ) {
						return false;
					}
				}
			}
			return true;
		}
		inject(px,py,placeMap,fn) {
			for( let y=0 ; y<placeMap.yLen ; ++y ) {
				for( let x=0 ; x<placeMap.xLen ; ++x ) {
					let pSym = placeMap.tileSymbolGet(x,y);
					if( pSym === undefined ) {
						debugger;
					}
					let mSym = this.getTile(px+x,py+y)
					if( mSym !== TILE_UNKNOWN ) {
						debugger;
					}
					fn(px+x,py+y,pSym);
					this.setTile(px+x,py+y,pSym);
				}
			}
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
				if( this.getTile(x,y)==T.Unknown && this.countAdjacentFloorish(x,y)>0 ) {
					this.setTile(x,y,T.Wall);
				}
			},-1,-1,-1,-1);
			return this;
		}
		clearZones(zoneId=NO_ZONE) {
			this.traverse( (x,y) => this.setZoneId(x,y,zoneId) );
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
/*
		paste(area,xPos,yPos,zoneId) {
			xPos = Math.floor(xPos);
			yPos = Math.floor(yPos);
			this.traverse( (x,y) => {
				let tile = this.getTile(x,y);
				if( tile !== T.Unknown ) {
					area.setTile(xPos+x,yPos+y,tile);
					area.setZoneId(xPos+x,yPos+y,zoneId==NO_ZONE ? this.getZoneId(x,y) : zoneId);
				}
			});
			return area;
		}
*/
		renderToString(drawZones) {
			let s = '';
			let yLast = this.yMin;
			this.traverse( (x,y) => {
				if( y !== yLast ) {
					s += '\n';
				}
				if( drawZones ) {
					let c = ZoneChar.charAt(this.getZoneId(x,y)+1);
					if( c == ' ' && this.getTile(x,y) !== T.Unknown ) {
						c = this.getTile(x,y);
					}
					s += c;
				}
				else {
					s += this.getTile(x,y);
				}
				yLast = y;
			});
			return s;
		}
	}

	function repeat(n,fn) {
		while(n-- > 0 ) {
			fn(n);
		}
	}

	function makeAmoeba(map,percentToEat,seedPercent,mustConnect=true) {
		let i=0;
		percentToEat = Math.clamp(percentToEat||0,0.01,1.0);
		seedPercent = Math.clamp(seedPercent||0,0.001,1.0);
		let floorToMake = Math.max(1,Math.ceil(map.area() * percentToEat));
		let floorMade = 0;
		let makeChance = 30;

		let seedToMake = Math.max(1,floorToMake*seedPercent);

		map.traverse( (x,y) => {
			let tile = map.getTile(x,y);
			if( tile != T.Wall && tile != T.Unknown ) {
				seedToMake--;
				floorMade++;
			}
		});

		while( seedToMake>0 ) {
			let x,y;
			[x,y] = map.randPos(-3),T.Floor
			if( map.getTile(x,y) == T.Unknown ) {
				map.setTile(x,y,T.Floor);
				--seedToMake;
				++floorMade;
			}
		}

		let reps = 50;
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
			let list = map.gather( (x,y) => {
				let tile = map.getTile(x,y);
				return tile == T.Unknown && map.countOrtho(x,y,T.Floor) > 0;
			});
			console.log("Gathered "+list.length);
			console.log("floor="+Math.floor(floorMade/map.area()*100)+'% of '+Math.floor(floorToMake/map.area()*100)+'%');

			while( list.length ) {
				let y = list.pop();
				let x = list.pop();
				if( Math.randInt(0,100) < makeChance ) {
					map.setTile(x,y,T.Floor);
					++floorMade;
				}
			}

			console.log("floor="+Math.floor(floorMade/map.area()*100)+'% of '+Math.floor(floorToMake/map.area()*100)+'%');
			console.log("floor-likes = floor="+Math.floor(map.countNonWallNonUnkown()/map.area()*100)+'%');
			let removeCount = 0;
			zoneList = map.floodAll();
			console.log( zoneList.length+' zones');
			while( zoneList.length && zoneList[zoneList.length-1].count < floorMade-floorToMake ) {
				let zone = zoneList.pop();
				let count = map.zoneFlood(zone.x,zone.y,zone.zoneId,false,NO_ZONE,T.Unknown);
				if( count !== zone.count ) {
					debugger;
				}
				floorMade -= count;
				removeCount += 1;
			}
			if( removeCount ) {
				console.log("Removed "+removeCount+'. now floor='+floorMade);
				console.log( zoneList.length+' zones remain');
			}
		}
		map.removeDiagnoalQuads();
		map.removeSingletonWalls(3);
		return this;
	}

	function makeRooms(map,floorDensity,maxRoomScale) {
		floorDensity = Math.clamp(floorDensity,0.02,1.0);
		let minRoomX = 3;
		let minRoomY = 3;
		let maxRoomX = Math.clamp(map.xLen() * maxRoomScale,minRoomX,map.xLen()-2);
		let maxRoomY = Math.clamp(map.yLen() * maxRoomScale,minRoomY,map.yLen()-2);
		let floorToMake = Math.ceil(map.area() * floorDensity);
		let floorMade = 0;

		while( floorToMake > 0 ) {
			let xLen = Math.randInt(minRoomX,maxRoomX);
			let yLen = Math.randInt(minRoomY,maxRoomY);
			let fit = false;
			--floorToMake;
		}

	}

	function positionPlaces(map,picker,numPlaceTiles,injectList) {

		function pickPlace() {
			// We try to resist picking the same place multiple times on a level.
			let reps = 5;
			let place;
			do {
				place = picker.pick(picker.placeTable);
			} while( reps-- && Math.chance((placeUsed[place.id]||0)*30) );
			placeUsed[place.id] = (placeUsed[place.id]||0)+1;
			return place;
		}

		function tryToFit(place) {
			// WARNING! Important for this to be a DEEP copy.
			place = jQuery.extend(true, {}, place);

			console.log("Trying to place "+place.id);
			Place.selectSymbols(place);
			Place.generateMap(place);
			Place.rotateIfNeeded(place);
			let fitReps = 300;
			let x,y;
			let fits;
			do {
				[x,y] = map.randPos4(0,0,-place.map.xLen,-place.map.yLen);
				let expand = place.hasWall ? 0 : 1;
				fits = map.fit(x,y,expand,place.map);
			} while( !fits && --fitReps );
			if( !fits ) debugger;
			if( fits ) {
				console.log('Placed at ('+x+','+y+')');
				map.inject(x,y,place.map,function(x,y,symbol) {
					let type = SymbolToType[symbol];
					if( !type ) debugger;
					if( place.onEntityCreate && place.onEntityCreate[type.typeId] ) {
						//console.log(type.typeId+' at '+x+','+y+' will get ',place.onEntityCreate[type.typeId]);
						injectList[''+x+','+y] = place.onEntityCreate[type.typeId];
					}
				});
				return true;
			}
			return false;
		}

		let placeUsed = [];	// used to avoid duplicating places too much
		let placeRosterRequired = picker.placesRequired;
		placeRosterRequired.map( place => { numPlaceTiles -= place.tileCount; } );

		let placeRosterRandom = [];
		let reps = 1000;
		while( numPlaceTiles>0 && --reps) {
			let place = pickPlace();
			placeRosterRandom.push(place);
			numPlaceTiles -= place.tileCount;
		}
		if( !reps ) debugger;

		placeRosterRandom.sort( (a,b) => b.tileCount-a.tileCount );
		let placeRoster = placeRosterRequired.concat(placeRosterRandom);

		for( let place of placeRoster ) {
			let success = tryToFit(place);
			if( !success && placeRosterRequired.includes(place) ) {
				debugger;
			}
		}
	}


	function runImmediate(maker) {
		while( !maker.next().done ) {
		}
	}

	function runSlow(maker,callback) {
		function makeMore() {
			if( maker.next().done ) {
				return false;
			}
			callback(maker);
		}

		document.addEventListener( "keydown", makeMore, false );
		makeMore();
	}

	function buildMap(picker,scape,palette,injectList,onStep) {
		let drawZones = false;
		function render() {
			let s = map.renderToString(drawZones);
			onStep(s);
		}
		palette = palette || {};

		T.Floor = palette.floor || T.Floor;
		T.Wall = palette.wall || T.Wall;
		T.Unknown = palette.unknown || T.Unknown;
		if( T.Floor == T.Wall || T.Floor == T.Unknown || T.Wall == T.Unknown ) {
			debugger;
		}

		let map = new Mason();
		map.setDimensions(scape.dim);

		let numPlaceTiles = Math.floor(map.xLen()*map.yLen()*scape.floorDensity*scape.placeDensity);
		positionPlaces(map,picker,numPlaceTiles,injectList);

		if( scape.architecture == 'cave' ) {
			makeAmoeba(map,scape.floorDensity,scape.seedPercent,scape.mustConnect);
		}
//		if( scape.architecture == 'rooms' ) {
//			makeRooms(map,scape.floorDensity,scape.maxRoomScale);
//		}

		map.connectAll(scape.wanderingPassage);
		map.wallify();
		map.sizeToExtentsWithBorder(injectList,1);
		map.convert(T.Unknown,T.Wall);

		for( let i=0; i<scape.entranceCount; ++i ) {
			map.placeEntrance(palette.entrance);
		}
		for( let i=0; i<scape.exitCount; ++i ) {
			map.placeEntrance(palette.exit);
		}
		return map;
	}


	window.Mason = {
		buildMap: buildMap
	};
})();
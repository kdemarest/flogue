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
		Wall: '#',
		Door: '+'
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

	function isUnknown(tile) {
		return tile == T.Unknown;
	}
	function isFloor(tile) {
		return tile !== T.Unknown && SymbolToType[tile].isFloor;
	}
	function isWall(tile) {
		return tile !== T.Unknown && SymbolToType[tile].isWall;
	}
	function isDoor(tile) {
		return tile !== T.Unknown && SymbolToType[tile].isDoor;
	}
	function isBlocking(tile) {
		return tile !== T.Unknown && !(SymbolToType[tile].mayWalk || SymbolToType[tile].isMonsterType);
	}
	function isWalkable(tile) {
		return tile !== T.Unknown && (SymbolToType[tile].mayWalk || SymbolToType[tile].isMonsterType);
	}
	function isBlockingOrUnknown(tile) {
		return isUnknown(tile) || isBlocking(tile);
	}
	function wantsDoor(tile) {
		return tile !== T.Unknown && SymbolToType[tile].wantsDoor;
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
				if( !isUnknown(this.getTile(x,y)) ) {
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
					if( obj && !isUnknown(obj.tile) ) {
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

		countAll(testFn) {
			let c = 0;
			this.traverse( (x,y) => c += (testFn(this.getTile(x,y)) ? 1 : 0) );
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
				if( isFloor(this.getTile(x,y)) && this.count8(x,y,isFloor)>=3 && this.count8(x,y,isWall)>=1 ) {
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
		count8(x,y,testFn) {
			x = Math.floor(x);
			y = Math.floor(y);
			let count = 0;
			for( let dir=0 ; dir<DirAdd.length ; ++dir ) {
				let tile = this.getTile(x+DirAdd[dir].x,y+DirAdd[dir].y);
				if( testFn(tile) ) {
					++count;
				}
			}
			return count;
		}
		count4(x,y,testFn) {
			x = Math.floor(x);
			y = Math.floor(y);
			let count = 0;
			for( let dir=0 ; dir<DirAdd.length ; dir += 2 ) {
				let tile = this.getTile(x+DirAdd[dir].x,y+DirAdd[dir].y);
				if( testFn(tile) ) {
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

		flood(x,y,ortho,keepTiles,testFn,assignFn) {
			function expand(x,y) {
				for( let dir=0; dir<DirAdd.length ; dir += step ) {
					let nx = x + DirAdd[dir].x;
					let ny = y + DirAdd[dir].y;
					if( nx<self.xMin || ny<self.yMin || nx>self.xMax || ny>self.yMax ) continue;
					let t = self.getAll(nx,ny);
					if( !testFn(nx,ny,t.tile,t.zoneId) ) { continue; }
					assignFn(nx,ny,t);
					++count;
					hotTiles.push(nx,ny);
				}
			}
			let self = this;
			let step = ortho ? 2 : 1;
			let t = self.getAll(x,y);
			if( !testFn(x,y,t.tile) ) { return 0; }
			assignFn(x,y,t);
			let count = 1;
			let hotTiles = [x,y];
			let index = 0;
			do {
				expand( hotTiles[index++], hotTiles[index++] );
			} while( index < hotTiles.length );

			return keepTiles ? hotTiles : { length: hotTiles.length };
		}
		twoOnlyOpposed(x,y,testFn) {
			let n = testFn(this.getTile(x,y-1));
			let s = testFn(this.getTile(x,y+1));
			let e = testFn(this.getTile(x-1,y));
			let w = testFn(this.getTile(x+1,y));
			if( n && s && !e && !w ) return true;
			if( e && w && !n && !s ) return true;
			return false;
		}
		countGaps(x,y) {
			let swaps = 0;
			let lastWalkable = isWalkable(this.getTile(x+DirAdd[7].x,y+DirAdd[7].y));
			for( let dir=0 ; dir < 8 ; ++dir ) {
				let tile = this.getTile(x+DirAdd[dir].x,y+DirAdd[dir].y);
				let walkable = isWalkable(tile);
				if( walkable != lastWalkable ) ++swaps;
				lastWalkable = walkable;
			}
			return swaps / 2;
		}

		floodSpread(x,y,count,sparkTile,sparkLimit,sparkRatio,keepTiles,assignFn) {
			let remain = count;
			let ch = 100;
			let tileList = this.flood( x, y, true, true,
				(x,y,tile) => Math.chance(ch) && remain>0 && (isUnknown(tile) /*|| isWalkable(tile)*/) && this.countGaps(x,y)<=1, 
				(x,y,t) => { --remain; ch = Math.max(70,ch-1); assignFn(x,y,t); }
			);
			let spot = Math.max(1,(count-remain)*sparkRatio);
			Array.shufflePairs(tileList);
			for( let i=0 ; i<tileList.length && spot>0 ; i+=2 ) {
				let x = tileList[i];
				let y = tileList[i+1];
				if( this.count8(x,y,isUnknown)>=sparkLimit ) {
					this.setTile(x,y,sparkTile); //FloorFill);
					--spot;
					--remain;	// YES! This is allowed to overflow the count.
				}
			}
			return count-remain;
		}

		floodAll(ortho,keepTiles) {
			let zoneList = [];
			let zoneId = 0;

			this.clearZones();

			this.traverse( (x,y) => {
				if( this.getZoneId(x,y) == NO_ZONE && isFloor(this.getTile(x,y)) ) {
					let z = this.flood( x, y, ortho, keepTiles,
						(x,y,tile,z) => isWalkable(tile) && (z===undefined || z != zoneId),
						(x,y,t) => t.zoneId = zoneId
					);
					
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
				let tile = this.getTile(x,y);
				if( wantsDoor(tile) && this.count8(x,y,isDoor)<=0 ) {
					// If this is a tile marked for doors, then make a door.
					this.setTile(x,y,T.Door);
				}
				else 
				if( !isWalkable(tile) ) {
					// Only mar the area if it is NOT already walkable.
					this.setTile(x,y,T.PassageFloor);
				}

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
//					console.log("Linked "+pair);
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
					if( !isUnknown(tile) ) {
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


		removeSingletonUnknowns(limit=4) {
			let count = 0;
			let any = true;
			let reps = 10;
			while( any && reps--) {
				any = false;
				this.traverse( (x,y) => {
					if( isUnknown(this.getTile(x,y)) && this.count4(x,y,isWalkable)>=3 ) {
						this.setTile(x,y,this.majorityNear(x,y,isFloor) || T.FillFloor);
						any = true;
						++count;
					}
				});
			}
			return count;
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
					if( isUnknown(a) || isUnknown(b) || isUnknown(c) || isUnknown(d) ) {
						return;
					}
					if( a==d && b==c && a!=b ) {
						if( isWall(a) ) {
							this.setTile(x,y,this.majorityNear(x,y,isFloor) || T.FillFloor);
							any = true;
						}
						else
						if( isWall(b) ) {
							this.setTile(x+1,y,this.majorityNear(x,y,isFloor) || T.FillFloor);
							any = true;
						}
					}
				},0,0,1,1);
			} while( any );
			return this;
		}
		majorityNear(x,y,testFn) {
			let most = {};
			let best = false;
			for( let dir=0 ; dir<DirectionCount ; ++dir ) {
				let dx = x+DirectionAdd[dir].x;
				let dy = y+DirectionAdd[dir].y;
				let tile = this.getTile(dx,dy);
				if( testFn(tile) ) {
					most[tile] = (most[tile]||0)+1;
					if( !best || most[tile] > most[best] ) {
						best = tile;
					}
				}
			}
			return best;
		}
		removePointlessDoors() {
			this.traverse( (x,y)=> {
				let tile = this.getTile(x,y);
				if( isDoor(tile) ) {
					if( !this.twoOnlyOpposed(x,y,isBlocking) ) {
						this.setTile(x,y,this.majorityNear(x,y,isWall) || T.FillWall);
					}
				}
			},-1,-1,-1,-1);
			return this;
		}
		wallify(wallTile) {
			this.traverse( (x,y)=> {
				if( isUnknown(this.getTile(x,y)) && this.count8(x,y,isWalkable)>0 ) {
					this.setTile(x,y,wallTile);
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
				if( !tile || isUnknown(tile) ) {
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
					if( c == ' ' && !isUnknown(this.getTile(x,y)) ) {
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

	function makeAmoeba(map,percentToEat,seedPercent,mustConnect) {
		let i=0;
		percentToEat = Math.clamp(percentToEat||0,0.01,1.0);
		seedPercent = Math.clamp(seedPercent||0,0.001,1.0);
		let floorToMake = Math.max(1,Math.ceil(map.area() * percentToEat));
		let floorMade = 0;
		let makeChance = 30;

		let seedToMake = Math.max(1,floorToMake*seedPercent);

		map.traverse( (x,y) => {
			let tile = map.getTile(x,y);
			if( !isWall(tile) && !isUnknown(tile) ) {
				seedToMake--;
				floorMade++;
			}
		});

		while( seedToMake>0 ) {
			let x,y;
			[x,y] = map.randPos(-3);
			if( isUnknown(map.getTile(x,y)) ) {
				map.setTile(x,y,T.FillFloor);
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
				return isUnknown(tile) && map.count4(x,y,isWalkable) > 0;
			});
//			console.log("Gathered "+list.length);
//			console.log("floor="+Math.floor(floorMade/map.area()*100)+'% of '+Math.floor(floorToMake/map.area()*100)+'%');

			while( list.length ) {
				let y = list.pop();
				let x = list.pop();
				if( Math.randInt(0,100) < makeChance ) {
					map.setTile(x,y,T.FillFloor);
					++floorMade;
				}
			}

//			console.log("floor="+Math.floor(floorMade/map.area()*100)+'% of '+Math.floor(floorToMake/map.area()*100)+'%');
//			console.log("floor-likes = floor="+Math.floor(map.countAll(isWalkable)/map.area()*100)+'%');
			let removeCount = 0;
			zoneList = map.floodAll();
//			console.log( zoneList.length+' zones');
			while( zoneList.length && zoneList[zoneList.length-1].count < floorMade-floorToMake ) {
				let zone = zoneList.pop();
				let count = map.zoneFlood(zone.x,zone.y,zone.zoneId,false,NO_ZONE,T.Unknown);
				if( count !== zone.count ) {
					debugger;
				}
				floorMade -= count;
				removeCount += 1;
			}
//			if( removeCount ) {
//				console.log("Removed "+removeCount+'. now floor='+floorMade);
//				console.log( zoneList.length+' zones remain');
//			}
		}
		// We no longer remove diagonal quads because it runs the risk of harming somebody's
		// carefully crafted place...
		//map.removeDiagnoalQuads();
		map.removeSingletonUnknowns();
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



	function positionPlaces(depth,map,numPlaceTiles,requiredPlaces,placeRarityTable,injectList,siteList) {

		function generatePlacesRequired(requiredPlaces) {
			let chanceList = String.chanceParse( requiredPlaces || '' );
			let table = Array.chancePick(chanceList);
			return table;
		}

		// Contains entries from PlaceList
		function placeTable(rarityTable) {
			let table = [];
			for( let placeId in PlaceList ) {
				let place = PlaceList[placeId];
				if( place.neverPick || (place.level != 'any' && place.level > depth) ) {
					continue;
				}
				if( !rarityTable[placeId] ) {
					continue;
				}
				let placeLevel = (place.level=='any' ? depth : place.level);
				let chance = Math.floor(Math.clamp(Math.chanceToAppearSimple(placeLevel,depth) * 100000, 1, 100000));
				chance *= (rarityTable[placeId] || 1);
				table.push(chance,place);
			}
			return table;
		}

		function pickPlace(placeRarityTable) {
			// We try to resist picking the same place multiple times on a level.
			let table = placeTable(placeRarityTable);
			let reps = 5;
			let place;
			do {
				place = Array.pickFromPaired(table);
			} while( reps-- && Math.chance((placeUsed[place.id]||0)*30) );
			placeUsed[place.id] = (placeUsed[place.id]||0)+1;
			return place;
		}

		function tryToFit(place,numPlaceTiles) {
			// WARNING! Important for this to be a DEEP copy.
			place = jQuery.extend(true, {}, place);

//			console.log("Trying to place "+place.id);
			Place.selectSymbols(place);
			Place.generateMap(place);
			Place.rotateIfNeeded(place);

			let x,y;
			function findTheFit() {
				let fitReps = 300;
				let fits;
				//
				// Find a place the 
				//
				do {
					[x,y] = map.randPos4( 0, 0, place.map ? -place.map.xLen : 0, place.map ? -place.map.yLen : 0);
					if( place.floodId ) {
						fits = isUnknown(map.getTile(x,y)) && map.count8(x,y,isUnknown)==8;
					}
					else {
						let expand = place.hasWall ? 0 : 1;
						fits = map.fit( x, y, expand, place.map );
					}
				} while( !fits && --fitReps );
				return fits;
			}
			let fits = findTheFit();

			if( !fits ) {
				numPlaceTiles += place.tileCount;
			}
			else
			{
				let siteMarks = [];
//				console.log('Placed at ('+x+','+y+')');
				if( place.floodId ) {
					let floodTile = TypeToSymbol[place.floodId];
					let sparkTile = TypeToSymbol[place.sparkId];
					let sparkDensity = place.sparkDensity || 0;
					let sparkLimit = place.sparkLimit;
					let tilesMade = map.floodSpread( x, y, place.tileCount, sparkTile, sparkLimit, sparkDensity, false, 
						(x,y,t) => { siteMarks.push(x,y); t.tile=floodTile; } );
					numPlaceTiles += (place.tileCount-tilesMade);
					//if( tilesMade < place.tileCount ) {
					//	debugger;
					//}
				}
				else {
					map.inject( x, y, place.map, function(x,y,symbol) {
						siteMarks.push(x,y);
						let type = SymbolToType[symbol];
						if( !type ) debugger;
						if( place.onEntityCreate && place.onEntityCreate[type.typeId] ) {
							//console.log(type.typeId+' at '+x+','+y+' will get ',place.onEntityCreate[type.typeId]);
							injectList[''+x+','+y] = place.onEntityCreate[type.typeId];
						}
					});
				}
				return [numPlaceTiles,siteMarks];
			}
			return [numPlaceTiles];
		}

		let placeUsed = [];	// used to avoid duplicating places too much
		let placeRosterRequired = generatePlacesRequired(requiredPlaces).map( placeId => PlaceList[placeId] );
		placeRosterRequired.map( place => { numPlaceTiles -= place.tileCount; } );

		let placeRosterRandom = [];
		let reps = 1000;
		while( numPlaceTiles>0 && --reps) {
			let place = pickPlace(placeRarityTable);
			placeRosterRandom.push(place);
			numPlaceTiles -= place.tileCount;
		}
		if( !reps ) debugger;

		// SUBTLE: Notice that the required places do NOT get sorted. The user has control over which
		// places get generated first.
		placeRosterRandom.sort( (a,b) => b.tileCount-a.tileCount );
		let placeRoster = placeRosterRequired.concat(placeRosterRandom);

		reps = 20;
		do {
			while( numPlaceTiles > 0 ) {
				let place = pickPlace(placeRarityTable);
				placeRoster.push(place);
				numPlaceTiles -= place.tileCount;
			}

			while( placeRoster.length ) {
				let place = placeRoster.shift();
				let siteMarks;
				[numPlaceTiles,siteMarks] = tryToFit(place,numPlaceTiles);
				if( !siteMarks && placeRosterRequired.includes(place) ) {
					// A so-called "required" place didn't get built.
					console.log( "Required place "+place.id+" did not fit." );
				}
				if( siteMarks ) {
					let site = Object.assign({}, place.site, { id: GetUniqueEntityId(), marks: siteMarks, placeId: place.id });
					siteList.push(site);
					for( let i=0 ; i<site.marks.length ; i+=2 ) {
						map.getAll(site.marks[i],site.marks[i+1]).siteId = siteList.length-1;
					}
				}
			}
		} while( numPlaceTiles > 0 && --reps );
		if( !reps ) debugger;
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

	function paletteCommit(palette,scape) {
		let tileTypes = ['floor','wall','door','fillFloor','fillWall','outlineWall','passageFloor','entrance','exit','unknown'];
		scape.palette = scape.palette || {};
		for( let tileType of tileTypes ) {
			let t = scape.palette[tileType+'TypeId'];
			if( t ) palette[tileType] = TypeToSymbol[t];
			let TileType = String.capitalize(tileType);	// Floor
			T[TileType] = palette[tileType] || T[TileType];
		}

		if( T.Floor == T.Wall || T.Floor == T.Unknown || T.Wall == T.Unknown || T.Door == T.Unknown ) {
			debugger;
		}

		if( !SymbolToType[T.PassageFloor].mayWalk || !SymbolToType[T.PassageFloor].isFloor ) {
			debugger;	// illegal. any fill floor must be marked isFloor and be walkable
		}
		if( !SymbolToType[T.FillFloor].mayWalk || !SymbolToType[T.FillFloor].isFloor ) {
			debugger;	// illegal. any fill floor must be marked isFloor and be walkable
		}
		if( SymbolToType[T.FillWall].mayWalk || !SymbolToType[T.FillWall].isWall ) {
			debugger;	// illegal. any fill wall must be marked isWall and be not walkable
		}
		if( SymbolToType[T.OutlineWall].mayWalk || !SymbolToType[T.OutlineWall].isWall ) {
			debugger;	// illegal. any fill wall must be marked isWall and be not walkable
		}
	}

	function masonConstruct(scape,palette,requiredPlaces,placeRarityTable,injectList,siteList,onStep) {
		let drawZones = false;
		function render() {
			let s = map.renderToString(drawZones);
			onStep(s);
		}

		palette = paletteCommit( palette || {}, scape );


		let map = new Mason();
		map.setDimensions(scape.dim);

		let numPlaceTiles = Math.floor(map.xLen()*map.yLen()*scape.floorDensity*scape.placeDensity);
		positionPlaces(scape.depth,map,numPlaceTiles,requiredPlaces,placeRarityTable,injectList,siteList);

		if( scape.architecture == 'cave' ) {
			makeAmoeba(map,scape.floorDensity,scape.seedPercent,scape.mustConnect);
		}

		// Now finalize the sites.
		let zoneList = map.floodAll(true,false);
		map.traverse( (x,y) => {
			let zoneId = map.getZoneId(x,y);
			if( zoneId !== NO_ZONE ) {
				let t = map.getAll(x,y);
				if( t.siteId !== undefined ) {
					zoneList[zoneId].siteCount = (zoneList[zoneId].siteCount||0)+1;
				}
			}
		});
		zoneList.map( zone => {
			if( !zone.siteCount ) {
				let site = Object.assign({}, { id: GetUniqueEntityId(), marks: zone.tile, isWilderness: true });
				siteList.push(site);
			}
		});

		// At this point we could probably flood a bit to figure out all the places in more detail...

//		if( scape.architecture == 'rooms' ) {
//			makeRooms(map,scape.floorDensity,scape.maxRoomScale);
//		}

		map.connectAll(scape.wanderingPassage);
		map.removePointlessDoors();
		map.wallify(T.OutlineWall);
		map.sizeToExtentsWithBorder(injectList,1);
		map.convert(T.Unknown,T.FillWall);

		for( let i=0; i<scape.entranceCount; ++i ) {
			map.placeEntrance(T.Entrance);
		}
		for( let i=0; i<scape.exitCount; ++i ) {
			map.placeEntrance(T.Exit);
		}
		return map;
	}


	window.Mason = {
		masonConstruct: masonConstruct
	};
})();
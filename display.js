

let GlobalRenderCache = [];
function createDrawList(observer,map,entityList,asType) {

	// Recalc this here, just in case.
	let vis = observer.calcVis();

	function spillLight(px,py,x,y,light) {
		let d2 = (MonsterTypeDefaults.sightDistance*2)+1;
		if( light == 'glow' ) {
			let fx = x+0;
			let fy = y+0;
			let rx = px+x-d;
			let ry = py+y-d;
			let rfx = px+fx-d;
			let rfy = py+fy-d;
			if( fx>=0 && fx<d2 && fy>=0 && fy<d2 && rx>=0 && rx<map.xLen && ry>=0 && ry<map.yLen ) {
				a[fy][fx][0] = displaySightDistance;
			}
			return;
		}
		for( let ly=-light ; ly<=light ; ++ly ) {
			for( let lx=-light ; lx<=light ; ++lx ) {
				let fx = x+lx;
				let fy = y+ly;
				let rx = px+x-d;
				let ry = py+y-d;
				let rfx = px+fx-d;
				let rfy = py+fy-d;
				if( fx>=0 && fx<d2 && fy>=0 && fy<d2 && rx>=0 && rx<map.xLen && ry>=0 && ry<map.yLen ) {
					let lightReaches = shoot4(map,rx,ry,rfx,rfy,false);
					if( lightReaches ) {
						a[fy][fx][0] = Math.max(a[fy][fx][0],light+1-Math.max(Math.abs(lx),Math.abs(ly)));
					}
					if( a[fy][fx][0] === undefined ) {
						debugger;
					}
				}
			}
		}
	}

	let displaySightDistance = MonsterTypeDefaults.sightDistance;

	//let convert = { '#': '█' };
	let py = observer.y;
	let px = observer.x;
	let d = displaySightDistance;
	let d2 = (displaySightDistance*2)+1
	let a = GlobalRenderCache || [];

	// Initialize the array, and clear all light levels.
	for( let y=py-d ; y<=py+d ; ++y ) {
		a[y-(py-d)] = a[y-(py-d)] || [];
		for( let x=px-d ; x<=px+d ; ++x ) {
			let tx = x-(px-d);
			let ty = y-(py-d);
			a[ty][tx] = a[ty][tx] || [];
			a[ty][tx][0] = 0;
			a[ty][tx].length = 1;
		}
	}

	function testLight(x,y,light) {
		if( !light ) { return; }
		let inBounds = x>=0 && x<map.xLen && y>=0 && y<map.yLen;
		if( inBounds ) {
			let ty = y-(py-d);
			let tx = x-(px-d);
			if( tx>=0 && tx<d2 && ty>=0 && ty<d2 ) {
				spillLight(px,py,tx,ty,light);
			}
		}
	}

	let p = [];
	let q = [];
	// Remember all monsters in the area
	for( let entity of entityList ) {
		if( observer.canPerceiveEntity(entity) ) {
			let e = ( entity.id == observer.id && observer.invisible ) ? StickerList.invisibleObserver : entity;
			p[entity.y*map.xLen+entity.x] = e;
		}
		testLight(entity.x,entity.y,entity.light)
	}
	// Remember all items in the area
	for( let item of map.itemList ) {
		q[item.y*map.xLen+item.x] = item;
		testLight(item.x,item.y,item.light)
	}
	for( let anim of animationList ) {
		testLight(anim.xGet(),anim.yGet(),anim.light)
	}

	let visId = {};

	// Now assign tile layers, and remember that [0] is the light level. Tiles
	// that shine light will do so in this loop.
	for( let y=py-d*2 ; y<=py+d*2 ; ++y ) {
		let ty = y-(py-d);
		for( let x=px-d*2 ; x<=px+d*2 ; ++x ) {
			let tx = x-(px-d);
			let inBounds = x>=0 && x<map.xLen && y>=0 && y<map.yLen;
			let visible = inBounds && vis[y][x];
			let mapSymbol;
			let item;
			let entity;
			if( inBounds ) {
				mapSymbol = map.tile[y][x];
				item =      q[y*map.xLen+x];
				entity =    p[y*map.xLen+x];

				if( SymbolToType[mapSymbol].isTileType ) {
					spillLight(px,py,tx,ty,SymbolToType[mapSymbol].light || 0);
				}
			}
			if( tx>=0 && tx<d2 && ty>=0 && ty<d2 ) {
				if( !visible ) {
					a[ty][tx][0] = 0;		// debatable whether we should pretend there is zero light here.
					a[ty][tx].length = 1;
				}
				else {
					let aa = a[ty][tx];
					if( (item || SymbolToType[mapSymbol]).typeId !== 'floor' ) {
						aa.push(TileTypeList.floor);
					}
					aa.push( item || SymbolToType[mapSymbol] );
					aa.push( entity );

					if( item ) { visId[item.id] = item; }
					if( entity ) { visId[entity.id] = entity; }
				}
			}
		}
	}

	for( let anim of animationList ) {
		if( anim.entity && !visId[anim.entity.id] ) {
			continue;
		}
		let tx = Math.floor(anim.xGet()-(px-d));
		let ty = Math.floor(anim.yGet()-(py-d));
		if( tx>=0 && tx<d2 && ty>=0 && ty<d2 ) {
			a[ty][tx].push(anim);
		}
	}

	GlobalRenderCache = a;
	return a;
}

let tileDim = 32;
function DefaultImgGet(self) {
	return self.img;
}
class Display {
	constructor(divId,sightDistance) {
		this.image = {};
		this.divId = divId;
		this.sd = sightDistance;
		this.d = ((sightDistance*2)+1);
		this.tileWidth  = tileDim * this.d;
		this.tileHeight = tileDim * this.d;
		this.app = new PIXI.Application(this.tileWidth, this.tileHeight, {backgroundColor : 0x000000});
		this.imgGet = [];
		this.ready = false;
		document.getElementById(this.divId).appendChild(this.app.view);
		let imageList = [];
		let exists = {};

		function add(imgPath) {
			if( imgPath === undefined ) {
				debugger;
			}
			if( !imgPath ) {
				return;
			}
			imgPath = 'tiles/'+imgPath;
			if( !exists[imgPath] ) {
				imageList.push(imgPath);
				exists[imgPath] = true;
			}
		}

		for( let symbol in SymbolToType ) {
			let type = SymbolToType[symbol];
			this.imgGet[type.typeId] = type.imgGet || DefaultImgGet;
			if( type.imgChoices ) {
				let imgGet = this.imgGet[type.typeId];
				for( let key in type.imgChoices ) {
					add( imgGet(null,type.imgChoices[key].img) );
				}
			}
			else {
				add(type.img);
			}
		}

		for( let sticker in StickerList ) {
			add(StickerList[sticker].img);
		}

		let self = this;
		function setup() {
			self.ready = true;
		}

		animationDeathCallback = function(sprite) {
			self.app.stage.removeChild(sprite);
		}

		PIXI.loader
			.add(imageList)
			.load(setup);

		this.app.ticker.add(function(delta) {
			// but only if real time is not stopped.
			animationTick(delta/60);
		});
	}
	draw(drawList,observer) {
		while(this.app.stage.children[0]) {
			this.app.stage.removeChild(this.app.stage.children[0]);
		}
		let dHalf = this.sd;
		let lightAlpha = [];
		for( let i=0 ; i<this.sd+2 ; ++i ) {
			lightAlpha[i] = Math.clamp(i/this.sd,0.0,1.0);
		}

		function make(x,y,entity,imgPath,light) {
			if( !imgPath ) {
				return;
			}
			let resource = PIXI.loader.resources['tiles/'+imgPath];
			if( !resource ) {
				return;
			}
			let sprite = new PIXI.Sprite( resource.texture );
			sprite.anchor.set(entity.xAnchor||0,entity.yAnchor||0);
			sprite.x = x*32;
			sprite.y = y*32;
			sprite.scale._x = (entity.scale||1);
			sprite.scale._y = (entity.scale||1);
			sprite.alpha = (entity.alpha||1) * lightAlpha[light];
			this.app.stage.addChild(sprite);
			return sprite;
		}

		for( let y=0 ; y<this.d ; ++y ) {
			for( let x=0 ; x<this.d ; ++x ) {
				let tile = drawList[y][x];
				let light = tile[0];
				for( let i=1 ; i<tile.length ; ++i ) {
					let entity = tile[i];
					if( !entity ) continue;
					if( entity.isAnimation ) {
						entity.sprite = make.call(this,entity.xGet()-(observer.x-this.sd),entity.yGet()-(observer.y-this.sd),entity,entity.imgGet(entity),light);
					}
					else
					if( this.imgGet[entity.typeId] ) {
						let imgPath = this.imgGet[entity.typeId](entity);
						make.call(this,x,y,entity,imgPath,entity.glow ? dHalf : light);
					}
					else {
						debugger;
					}
				}
			}
		}
	}
}

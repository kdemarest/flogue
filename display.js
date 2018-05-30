

let GlobalRenderCache = [];
function createDrawList(observer,map,entityList,asType) {

	// Recalc this here, just in case.
	let vis = observer.calcVis();

	function spillLight(px,py,x,y,light) {
		let d2 = (displaySightDistance*2)+1;
		if( light == 'glow' ) {
			let fx = x+0;
			let fy = y+0;
			let rx = px+x-d;
			let ry = py+y-d;
			let rfx = px+fx-d;
			let rfy = py+fy-d;
		if( typeof fy==='undefined' || fy===undefined ) debugger;
			if( fx>=0 && fx<d2 && fy>=0 && fy<d2 && rx>=0 && rx<map.xLen && ry>=0 && ry<map.yLen ) {
				a[fy][fx][0] = displaySightDistance;
			}
			return;
		}
		let range = Math.abs(light);
		for( let ly=-range ; ly<=range ; ++ly ) {
			for( let lx=-range ; lx<=range ; ++lx ) {
				let fx = x+lx;
				let fy = y+ly;
				let rx = px+x-d;
				let ry = py+y-d;
				let rfx = px+fx-d;
				let rfy = py+fy-d;
				if( fx>=0 && fx<d2 && fy>=0 && fy<d2 && rx>=0 && rx<map.xLen && ry>=0 && ry<map.yLen ) {
					let lightReaches = observer.senseXray || shoot4(map,rx,ry,rfx,rfy,false);
					if( lightReaches ) {
						if( light < 0 ) {
							let b = Math.max(Math.abs(lx),Math.abs(ly));
							a[fy][fx][0] = Math.max(0,a[fy][fx][0]+light+b);
						}
						else {
							a[fy][fx][0] = Math.max(a[fy][fx][0],light+1-Math.max(Math.abs(lx),Math.abs(ly)));
						}
					}
					//if( a[fy][fx][0] === undefined ) {
					//	debugger;
					//}
				}
			}
		}
	}

	let displaySightDistance = MaxSightDistance;

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
		testLight(entity.x,entity.y,entity.light||0);
	}
	// Remember all items in the area
	for( let item of map.itemList ) {
		q[item.y*map.xLen+item.x] = item;
		testLight(item.x,item.y,item.light)
	}
	for( let anim of animationList ) {
		testLight(anim.x,anim.y,anim.light)
	}
	for( let entity of entityList ) {
		testLight(entity.x,entity.y,-(entity.dark||0));
	}


	let visId = {};
	let mapMemoryLight = 2;
	let revealLight = 7;		// Assumes max light is about 10.

	// Now assign tile layers, and remember that [0] is the light level. Tiles
	// that shine light will do so in this loop.
	//let dChar = '';
	//let debug = '';
	for( let y=py-d*2 ; y<=py+d*2 ; ++y ) {
		let ty = y-(py-d);
		for( let x=px-d*2 ; x<=px+d*2 ; ++x ) {
			let tx = x-(px-d);
			let inBounds = x>=0 && x<map.xLen && y>=0 && y<map.yLen;
			let visible = inBounds && vis[y][x];
			let inPane = tx>=0 && tx<d2 && ty>=0 && ty<d2;
			let tile;
			let item;
			let entity;

			if( inBounds ) {
				tile =		map.tileTypeGet(x,y);
				item =      q[y*map.xLen+x];
				entity =    p[y*map.xLen+x];
				if( !tile.isTileType ) {
					debugger;
				}
				spillLight(px,py,tx,ty,tile.light || 0);
			}

			if( !inBounds ) {
				//dChar = '-';
				if( inPane ) {
					//dChar = 'a';
					a[ty][tx].length = 0;
				}
			}

			if( inPane && inBounds ) {
				let aa = a[ty][tx];
				if( !visible ) {
					//dChar = 'i';
					aa[0] = mapMemoryLight;
					if( observer.mapMemory && observer.mapMemory[y] && observer.mapMemory[y][x] ) {
						aa[1] = observer.mapMemory[y][x];
						aa.length = 2;
					}
					else {
						aa.length = 1;
					}
					if( item && observer.senseItems ) {
						aa.push(item);
						aa[0] = revealLight;
					}
					if( entity && observer.senseLife ) {
						aa.push(entity);
						aa[0] = revealLight;
					}
				}
				else {
					//dChar = 'T';
					aa.push(tile);
					if( item ) { aa.push(item); visId[item.id] = item;}
					if( entity ) { aa.push(entity); visId[entity.id] = entity;}
				}
			}
			//else
			//	dChar = 'p';
			//debug += dChar;
		}
		//debug += '<<\n';
	}
	//console.log(debug);

	for( let anim of animationList ) {
		if( anim.entity && !visId[anim.entity.id] ) {
			continue;
		}
		let tx = Math.floor(anim.x-(px-d));
		let ty = Math.floor(anim.y-(py-d));
		if( tx>=0 && tx<d2 && ty>=0 && ty<d2 ) {
			a[ty][tx].push(anim);
		}
	}

	GlobalRenderCache = a;
	return a;
}

let TILE_DIM = 32;
function DefaultImgGet(self) {
	return self.img;
}
class ImageRepo {
	constructor(loader) {
		this.imgGet = [];
		this.ready = false;
		this.loader = loader;
	}
	load() {
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

		// Pre-load all of the images by running the real imagGets with the SECOND variable forced to each
		// variation of imgChoices. It is the responsibilty of the type to implement this properly.
		for( let symbol in SymbolToType ) {
			let type = SymbolToType[symbol];
			this.imgGet[type.typeId] = type.imgGet || DefaultImgGet;
			if( type.imgGet && !type.imgChoices ) debugger;
			if( type.imgChoices ) {
				let imgGet = this.imgGet[type.typeId];
				for( let key in type.imgChoices ) {
					add( imgGet(null,type.imgChoices[key].img) );
				}
			}
			else {
				add(type.img);
			}
			if( type.icon ) {
				add( 'gui/icons/'+type.icon );
			}
		}

		for( let sticker in StickerList ) {
			this.imgGet[sticker] = StickerList[sticker].imgGet || DefaultImgGet;
			add(StickerList[sticker].img);
		}

		let self = this;
		function setup() {
			self.ready = true;
		}

		this.loader
			.add(imageList)
			.load(setup);

	}
	get(imgPath) {
		let resource = this.loader.resources['tiles/'+imgPath];
		if( !resource ) debugger;
		return resource;
	}
}

let spriteDeathCallback;
let spriteCreate;
let spriteAttach;
let spriteOnStage;

class ViewMap {
	constructor(divId,sightDistance,imageRepo) {
		this.divId = divId;
		this.sd = sightDistance;
		this.d = ((sightDistance*2)+1);
		this.tileWidth  = TILE_DIM * this.d;
		this.tileHeight = TILE_DIM * this.d;
		this.areaId = null;
		this.app = new PIXI.Application(this.tileWidth, this.tileHeight, {backgroundColor : 0x000000});
		document.getElementById(this.divId).appendChild(this.app.view);

		this.imageRepo = imageRepo;

		let self = this;

		spriteDeathCallback = function(spriteList) {
			if( !spriteList ) return;
			Array.filterInPlace( spriteList, sprite => {
				sprite.refs--;
				if( sprite.refs <= 0 ) {
					if( sprite.keepAcrossAreas ) {
						return true;
					}
					self.app.stage.removeChild(sprite);
				}
				return false;
			});
		};

		spriteCreate = function(spriteList,imgPath) {
			let resource = self.imageRepo.get(imgPath);
			if( !resource ) {
				debugger;
				return;
			}
			let sprite = new PIXI.Sprite( resource.texture );
			sprite.onStage = false;
			sprite.refs = 1;
			spriteList.push(sprite);
			return sprite;
		}

		spriteAttach = function(spriteList,sprite) {
			sprite.refs = (sprite.refs||0)+1;
			spriteList.push(sprite);
		}

		spriteOnStage = function(sprite,value) {
			if( value == sprite.onStage ) {
				return;
			}
			self.app.stage[value?'addChild':'removeChild'](sprite);
			sprite.onStage = value;
			return sprite;
		}

		this.app.ticker.add(function(delta) {
			// but only if real time is not stopped.
			animationTick(delta/60);
		});

		$('#'+this.divId).mousemove( function(event) {
			var offset = $(this).offset();
			let x = (event.pageX - offset.left);
			var y = (event.pageY - offset.top);
			event.xMap = x;
			event.yMap = y;
		});
	}

	draw(drawList,observer) {
		if( this.areaId != world.area.id ) {
			// In theory we would traverse all the entities, items, tiles and their inventories and
			// destroy all their spriteLists... for now let them linger.
			//this.resetSprites();
			this.areaId = world.area.id;
		}
		let maxLight = MaxSightDistance;
		let glowLight = maxLight;
		let staticTileEntity = { isStaticTile: true };
		let staticContext = { x:0, y:0, light: 0 };

		//let debug = '';

		for( let child of this.app.stage.children ) {
			child.visible = false;
		}

		function make(x,y,entity,imgGet,zOrder,light) {

			entity.spriteList = entity.spriteList || [];

			for( let i=0 ; i<(entity.spriteCount || 1) ; ++i ) {
				if( !entity.spriteList[i] ) {
					let sprite = spriteCreate( entity.spriteList, imgGet(entity) );
					sprite.keepAcrossAreas = entity.isUser && entity.isUser();
					sprite.anchor.set(entity.xAnchor||0.5,entity.yAnchor||0.5);
				}
				let sprite = entity.spriteList[i];
				spriteOnStage(sprite,true);
				if( sprite.refs == 1 ) {	// I must be the only controller, so...
					sprite.zOrder 	= zOrder;
					sprite.visible 	= true;
					sprite.x 		= x+(32/2);
					sprite.y 		= y+(32/2);
					sprite.scale._x = (entity.scale||1) * (sprite.scale.amount||1);
					sprite.scale._y = (entity.scale||1) * (sprite.scale.amount||1);
					sprite.alpha 	= (entity.alpha||1) * LightAlpha[light];
					//debug += '123456789ABCDEFGHIJKLMNOPQRS'.charAt(light);
				}
			}
		}

		// These are the world coordinate offsets
		let wx = (observer.x-this.sd);
		let wy = (observer.y-this.sd);

		for( let y=0 ; y<this.d ; ++y ) {
			for( let x=0 ; x<this.d ; ++x ) {
				if( !drawList[y] || !drawList[y][x] ) {
					//debug += '-';
					continue;
				}
				let tile = drawList[y][x];
				let light = observer.isSpectator ? maxLight : tile[0];
				for( let i=1 ; i<tile.length ; ++i ) {
					let entity = tile[i];
					if( !entity ) continue;
					if( typeof entity !== 'object' ) debugger;
					if( entity.isAnimation ) {
						entity.drawUpdate(observer.x-this.sd, observer.y-this.sd, light, this.app.stage.addChild);
					}
					else
					{
						let imgGet = this.imageRepo.imgGet[entity.typeId];

						if( imgGet ) {

							if( entity.isTileType && !entity.isPosition ) {
								entity.spriteList = observer.map.tileSprite[y+wy][x+wx];
							}

							let imgGet = this.imageRepo.imgGet[entity.typeId];
							let lightAfterGlow = entity.glow ? Math.max(light,glowLight) : light;
							make.call(this,x*32,y*32,entity,imgGet,i,lightAfterGlow);

							if( entity.isTileType && !entity.isPosition ) {
								observer.map.tileSprite[y+wy][x+wx] = staticTileEntity.spriteList;
								delete entity.spriteList;
							}

						}
						else {
							debugger;
						}
					}
				}
			}
			//debug += '\n';
		}
		//console.log(debug);

		this.app.stage.children.sort( (a,b) => a.zOrder-b.zOrder );
	}
}

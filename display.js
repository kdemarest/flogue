

let GlobalRenderCache = [];
function createDrawList(observer,map,entityList,asType) {

	// Recalc this here, just in case.
	let vis = observer.calcVis();
	let areaVis = observer.area.vis;

	function spillLight(px,py,x,y,light) {
		let d2 = (displaySightDistance*2)+1;
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
					let lightReaches = observer.senseXray || areaVis.shoot4(rfx,rfy,rx,ry,false);
					if( lightReaches ) {
						if( light < 0 ) {
							let b = Math.max(Math.abs(lx),Math.abs(ly));
							a[fy][fx][0] = Math.max(light,a[fy][fx][0]+Math.min(0,light+b));
						}
						else {
							a[fy][fx][0] = Math.max(a[fy][fx][0],light+1-Math.max(Math.abs(lx),Math.abs(ly)));
						}
					}
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
			// We need to let pretty much anything that makes light spill light
			// this assumes that a value of 'light' also spills that same distance
			let range = Math.abs(light);
			if( tx>=-range && tx<d2+range && ty>=-range && ty<d2+range ) {
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
		testLight(item.x,item.y,item.light)
	}

// All animations, from any source, start when the object is GATED into the world.
// Each turn, they are all paused, and then if they are near enough AND visible
// the animation is turned on.

	for( let anim of animationList ) {
		testLight(anim.x,anim.y,anim.light);
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
			let visible = inBounds && vis[y] && vis[y][x];
			let inPane = tx>=0 && tx<d2 && ty>=0 && ty<d2;
			let tile;
			let itemList;
			let entity;

			if( inBounds ) {
				tile =		map.tileTypeGet(x,y);
				console.assert(tile);
				itemFind =  map.findItemAt(x,y);
				entity =    p[y*map.xLen+x];
				if( !tile.isTileType ) {
					debugger;
				}
				if( tile.light ) {
					spillLight(px,py,tx,ty,tile.light || 0);
				}
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
					if( itemFind.count && observer.senseItems ) {
						itemFind.process( item => {
							if( item.isTreasure ) {
								aa.push(item);
								aa[0] = revealLight;
							}
						});
					}
					if( entity && observer.senseLife && !entity.isUndead ) {
						aa.push(entity);
						aa[0] = revealLight;
					}
				}
				else {
					//dChar = 'T';
					aa.push(tile);
					if( itemFind.count ) {
						itemFind.process( item => {
							aa.push(item);
							visId[item.id] = item;
						});
					}
					if( entity ) { aa.push(entity); visId[entity.id] = entity; }
				}
			}
			//else
			//	dChar = 'p';
			//debug += dChar;
		}
		//debug += '<<\n';
	}
	//console.log(debug);

	for( let entity of entityList ) {
		testLight(entity.x,entity.y,-(entity.dark||0));
	}

	for( let item of map.itemList ) {
		testLight(item.x,item.y,-(item.dark||0));
	}

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

		function scanIcon(typeList,member) {
			for( let t in typeList ) {
				if( typeList[t][member] ) {
					add(typeList[t][member]);
				}
			}
		}
		function scan(typeList,member) {
			for( let t in typeList ) {
				if( typeList[t][member] ) {
					self.imgGet[t] = typeList[t].imgGet || DefaultImgGet;
					add(typeList[t][member]);
				}
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

		let self = this;
		scan(StickerList,'img');
		scan(WeaponList,'img');
		scanIcon(EffectTypeList,'icon');

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
let spriteMakeInWorld;

class ViewMap extends ViewObserver {
	constructor(divId,imageRepo,worldOverlayAddFn,worldOverlayRemoveFn) {
		super();
		this.worldOverlayAddFn = worldOverlayAddFn;
		this.worldOverlayRemoveFn = worldOverlayRemoveFn;
		this.divId = divId;
		this.imageRepo = imageRepo;
		this.app = new PIXI.Application(10, 10, {backgroundColor : 0x000000});
		document.getElementById(this.divId).appendChild(this.app.view);
		this.setDimensions();
		this.hookEvents();
		this.spriteHooks();
	}

	hookEvents() {
		let self = this;
		$('#'+this.divId+' canvas').mousemove( function(e) {
			let offset = $(this).offset(); 
			let mx = Math.floor((e.pageX - offset.left)/TILE_DIM);
			let my = Math.floor((e.pageY - offset.top)/TILE_DIM);

			if( self.observer ) {
				let observer = self.observer;
				let area = observer.area;
				let x = (observer.x-self.sd) + mx;
				let y = (observer.y-self.sd) + my;
				guiMessage( null, 'hide' );
				if( observer.canPerceivePosition(x,y) ) {
					let entity = new Finder(area.entityList,observer).at(x,y).canPerceiveEntity().first || new Finder(area.map.itemList,observer).at(x,y).canPerceiveEntity().first || adhoc(area.map.tileTypeGet(x,y),area.map,x,y);
					if( entity ) {
						console.log( x,y,entity.name);
						guiMessage( null, 'show', entity );
						guiMessage( null, 'pick', { xOfs: x-observer.x, yOfs: y-observer.y } );
					}
				}
			}
		});
		$('#'+this.divId+' canvas').mouseout( function(e) {
			guiMessage(null,'hide',null);
			console.log('mouse out of canvas');
		});
		$('#'+this.divId+' canvas').click( function(e) {
			var e = $.Event("keydown");
			e.key = 'Enter';
			$(document).trigger(e);
		});
	}

	spriteHooks() {
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

		spriteCreate = function(spriteList,imgPath,mayReuse) {
			let resource = self.imageRepo.get(imgPath);
			if( !resource ) {
				debugger;
				return;
			}
			let sprite = new PIXI.Sprite( resource.texture );
			sprite.onStage = false;
			sprite.refs = 1;
			let allocated = false;
			if( mayReuse ) {
				for( let i=0 ; i<spriteList.length ; ++i ) {
					if( spriteList[i].dead ) {
						spriteList[i] = sprite;
						allocated = true;
						break;
					}
				}
			}
			if( !allocated ) {
				spriteList.push(sprite);
			}
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

		spriteMakeInWorld = function(entity,xWorld,yWorld) {

			function make(x,y,entity,imgGet,light) {

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
						let zOrder = (entity.isTileType ? 10 : (entity.isItemType ? (entity.isGate ? 20 : (entity.isDecor ? 22 : 24)) : (entity.isMonsterType ? 30 : 40)));
						sprite.zOrder 	= zOrder;
						sprite.visible 	= true;
						sprite.x 		= x+(TILE_DIM/2);
						sprite.y 		= y+(TILE_DIM/2);
						sprite.baseScale= entity.scale||1;
						sprite.transform.scale.set( sprite.baseScale * (TILE_DIM/32) );
						sprite.alpha 	= (entity.alpha||1) * LightAlpha[light];
						//debug += '123456789ABCDEFGHIJKLMNOPQRS'.charAt(light);
					}
				}
				if( entity.puppetMe ) {
					entity.puppetMe.puppet(entity.spriteList);
					delete entity.puppetMe;
				}
			}
			
			let glowLight = MaxSightDistance;
			this.staticTileEntity = this.staticTileEntity || { isStaticTile: true };

			// These are the world coordinate offsets
			let wx = (this.observer.x-this.sd);
			let wy = (this.observer.y-this.sd);
			let x = xWorld - wx;
			let y = yWorld - wy;
			let light = x>=0 && y>=0 && x<this.d && y<this.d ? this.drawListCache[y][x][0] : 0;

			if( entity.isTileType && !entity.isPosition ) {
				entity.spriteList = this.observer.map.tileSprite[yWorld][xWorld];
			}

			let imgGet = this.imageRepo.imgGet[entity.typeId];
			let lightAfterGlow = entity.glow ? Math.max(light,glowLight) : light;
			make.call(this,x*TILE_DIM,y*TILE_DIM,entity,imgGet,lightAfterGlow);

			if( entity.isTileType && !entity.isPosition ) {
				this.observer.map.tileSprite[yWorld][xWorld] = this.staticTileEntity.spriteList;
				delete entity.spriteList;
			}
		}.bind(this);

		this.app.ticker.add(function(delta) {
			// but only if real time is not stopped.
			animationTick(delta/60);
		});
	}

	setDimensions() {
		this.sd = MaxSightDistance;
		this.d = ((this.sd*2)+1);
		let tileWidth  = TILE_DIM * this.d;
		let tileHeight = TILE_DIM * this.d;

		this.app.renderer.view.style.width = tileWidth + "px";
		this.app.renderer.view.style.height = tileHeight + "px";
		this.app.renderer.resize(tileWidth,tileHeight);
	}
	setZoom(_zoom) {
		this.zoom = _zoom % 3;
		let oldDim = TILE_DIM;
		if( this.zoom == 0 ) { TILE_DIM=32 ; MaxSightDistance=11; }
		if( this.zoom == 1 ) { TILE_DIM=48 ; MaxSightDistance=8; }
		if( this.zoom == 2 ) { TILE_DIM=64 ; MaxSightDistance=6; }
		//document.documentElement.style.setProperty('--TILE_DIM', TILE_DIM);
		//document.documentElement.style.setProperty('--TILE_SPAN', MaxSightDistance*2+1);
		this.setDimensions();
		for( let child of this.app.stage.children ) {
			child.x = ((child.x-(oldDim/2)) / oldDim) * TILE_DIM + TILE_DIM/2;
			child.y = ((child.y-(oldDim/2)) / oldDim) * TILE_DIM + TILE_DIM/2;
			child.transform.scale.set( child.baseScale * (TILE_DIM/32) );
		}
		this.observer.sightDistance = MaxSightDistance;
	}

	message(msg,payload) {
		super.message(msg,payload);
		if( msg=='zoom' ) {
			this.setZoom(this.zoom+1);
			this.render();
		}
		if( msg == 'overlayRemove' ) {
			this.worldOverlayRemoveFn( a => a.group==payload.group );
		}
		if( msg == 'overlayAdd' ) {
			this.worldOverlayAddFn(payload.group,payload.x,payload.y,payload.img);	
		}
		if( msg == 'show' ) {
			if( !payload.isItemType || (payload.owner && payload.owner.isMap) ) {
				this.worldOverlayRemoveFn( a => a.group=='guiSelect' );
				this.worldOverlayAddFn('guiSelect', payload.x,payload.y, StickerList.selectBox.img);	
			}
			this.render();
		}
		if( msg == 'hide' ) {
			this.worldOverlayRemoveFn( a => a.group=='guiSelect' );
			console.log('ViewMap hide');
			this.render();
		}
		if( msg == 'render' ) {
			this.render();
		}
	}

	draw(drawList) {

		let maxLight = MaxSightDistance;
		this.drawListCache = drawList;
		let observer = this.observer;

		if( this.zoom === undefined ) {
			this.setZoom(1);
		}

		//let debug = '';

		for( let child of this.app.stage.children ) {
			child.visible = false;
		}

		let wx = (this.observer.x-this.sd);
		let wy = (this.observer.y-this.sd);
		for( let y=0 ; y<this.d ; ++y ) {
			for( let x=0 ; x<this.d ; ++x ) {
				if( !this.drawListCache[y] || !this.drawListCache[y][x] ) {
					//debug += '-';
					continue;
				}
				let tile = this.drawListCache[y][x];
				for( let i=1 ; i<tile.length ; ++i ) {
					let entity = tile[i];
					if( !entity ) continue;
					if( typeof entity !== 'object' ) debugger;
					if( entity.isAnimation ) {
						let light = observer.isSpectator ? maxLight : tile[0];
						entity.drawUpdate(observer.x-this.sd, observer.y-this.sd, light, this.app.stage.addChild);
					}
					else
					{
						let imgGet = this.imageRepo.imgGet[entity.typeId];
						if( imgGet ) {
							spriteMakeInWorld(entity,wx+x,wy+y);
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
	render() {
		//var focused =  $( document.activeElement ) ;
		//if( !focused || focused.length == 0 ) {
		//	console.log('re-focused from ',focused);
		//	$('#'+this.divId+' canvas').focus();
		//}

		let observer = this.observer;
		let area = observer.area;
		let drawList = createDrawList(observer,area.map,area.entityList);
		this.draw(drawList);
	}
}

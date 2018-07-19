Module.add('viewMap',function() {

let MapMemoryLight = 3;
let MONSTER_SCALE_VARIANCE_MIN = 0.75;
let MONSTER_SCALE_VARIANCE_MAX = 1.00;


function handleScent(map,px,py,senseSmell) {

	guiMessage( 'overlayRemove', { groupId: 'scent' } );

	if( senseSmell) {
		for( let y=py-d*2 ; y<=py+d*2 ; ++y ) {
			let ty = y-(py-d);
			for( let x=px-d*2 ; x<=px+d*2 ; ++x ) {
				let inBounds = x>=0 && x<map.xLen && y>=0 && y<map.yLen;
				if( !inBounds ) continue;
				let tx = x-(px-d);
				let inPane = tx>=0 && tx<d2 && ty>=0 && ty<d2;
				if( !inPane ) continue;

				let smelled = map.scentGetEntity(x,y,senseSmell);
				if( !smelled ) continue;

				let age = map.scentGetAge(x,y);
				let alpha = 0.0 + Math.clamp(1-(age/senseSmell),0,1) * 0.6;
				if( !alpha ) continue;

				new Anim( {}, {
					groupId: 		'scent',
					x: 				x,
					y: 				y,
					area: 			map.area,
					img: 			smelled.img,
					duration: 		true,
					onSpriteMake: 	s => { s.sScaleSet(0.4*(smelled.scale||1)).sAlpha(alpha); s.glow=1; }
				});
			}
		}
	}
}


function createDrawList(observer,drawListCache) {

	// Recalc this here, just in case.
	let map = observer.map;
	let visCache = observer.calculateVisbility();
	let areaVis = observer.area.vis;
	let entityList = map.area.entityList;
	let lightMap = map.area.lightCaster.lightMap;

	//let convert = { '#': '█' };
	let py = observer.y;
	let px = observer.x;
	let d = MapVis;
	let d2 = (d*2)+1
	let a = drawListCache || [];

	// Initialize the array, and clear all light levels.
	for( let y=py-d ; y<=py+d ; ++y ) {
		a[y-(py-d)] = a[y-(py-d)] || [];
		for( let x=px-d ; x<=px+d ; ++x ) {
			let tx = x-(px-d);
			let ty = y-(py-d);
			a[ty][tx] = a[ty][tx] || [];
			a[ty][tx][0] = lightMap[y*map.xLen+x];
			a[ty][tx][1] = false;
			a[ty][tx].length = 2;
		}
	}


	handleScent(map,px,py,observer.senseSmell,observer.area.id);


	let visId = {};
	let revealLight = 7;		// Assumes max light is about 10.
	let mapMemory = observer.mapMemory;

	// Now assign tile layers, and remember that [0] is the light level. Tiles
	// that shine light will do so in this loop.
	//let dChar = '';
	//let debug = '';
	console.assert( map.defaultFloorSymbol );
	let lastFloor = SymbolToType[map.defaultFloorSymbol];
	console.assert( lastFloor );
	//if( observer.senseXray ) debugger;
	for( let y=py-d*2 ; y<=py+d*2 ; ++y ) {
		let ty = y-(py-d);
		for( let x=px-d*2 ; x<=px+d*2 ; ++x ) {
			let tx = x-(px-d);
			let inBounds = x>=0 && x<map.xLen && y>=0 && y<map.yLen;
			let visible = inBounds && visCache[y] && visCache[y][x];
			let inPane = tx>=0 && tx<d2 && ty>=0 && ty<d2;
			let tile;
			let itemList;
			let entity;
			let smelled;

			if( inBounds ) {
				tile =		map.tileTypeGet(x,y);
				if( tile.isFloor ) {
					lastFloor = tile;
				}
				console.assert(tile);
				itemFind =  map.findItemAt(x,y);

				//if( x==px && y==py ) debugger;

				let pos = y*map.xLen+x;
				let temp = map.entityLookup[pos];
				entity = temp && temp.length ? temp[0] : null;
				if( entity ) { //&& observer.canPerceiveEntity(entity) ) {
					entity = ( entity.id == observer.id && entity.invisible ) ? StickerList.invisibleObserver : entity;
				}
				else
					entity = null;

				if( !entity && observer.senseSmell ) {
					smelled = map.scentGetEntity(x,y,observer.senseSmell);
				}
				if( !tile.isTileType ) {
					debugger;
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
				console.assert( aa.length >= 2 );
				if( !visible || aa[0] <= 0 || aa[0] === undefined ) {
					//dChar = 'i';
					let mPos = y*map.xLen+x;
					if( mapMemory && mapMemory[mPos] ) {
						aa[1] = true;
						aa[2] = mapMemory[mPos];
						aa.length = 3;
					}
					//else {
					//	aa.length = 2;
					//}
					if( itemFind.count && observer.senseTreasure ) {
						itemFind.forEach( item => {
							if( item.isTreasure ) {
								aa.push(item);
								aa[0] = revealLight;
							}
						});
					}
					if( entity && observer.senseLiving && entity.isLiving ) {
						aa.push(entity);
						aa[0] = revealLight;
					}
				}
				else {
					//dChar = 'T';
					console.assert( aa.length >= 2 );
					if( tile.addFloor ) {
						aa.push(lastFloor);
					}
					aa.push(tile);
					if( itemFind.count ) {
						itemFind.forEach( item => {
							aa.push(item);
							visId[item.id] = item;
						});
					}
					if( entity ) {
						aa.push(entity);
						visId[entity.id] = entity;
					}
				}
			}
			//else
			//	dChar = 'p';
			//debug += dChar;
		}
		//debug += '<<\n';
	}
	//console.log(debug);

	map.area.animationManager.forEach( anim => {
		if( anim.entity && !visId[anim.entity.id] ) {
			return;
		}
		let tx = Math.floor(anim.x-(px-d));
		let ty = Math.floor(anim.y-(py-d));
		if( tx>=0 && tx<d2 && ty>=0 && ty<d2 ) {
			a[ty][tx].push(anim);
		}
	});

	map.traverseNear( px, py, d, (x,y) => {
		let ty = y-(py-d);
		let tx = x-(px-d);
		if( a[ty][tx].length < 1 ) return;
		let light = a[ty][tx][0];
		let lPos = y*map.xLen+x;
		map.lightCache[lPos] = light;
	});

	drawListCache = a;
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
			imgPath = IMG_BASE+imgPath;
			if( !exists[imgPath] ) {
				imageList.push(imgPath);
				exists[imgPath] = true;
			}
		}

		function scan(typeId,type,member) {
			if( type[member] ) {
				if( typeId ) {
					self.imgGet[typeId] = type.imgGet || DefaultImgGet;
				}
				add(type[member]);
			}
		}

		function scanIcon(typeList,member) {
			for( let t in typeList ) {
				scan(null,typeList[t],member);
			}
		}
		function scanTypeList(typeList,member) {
			for( let t in typeList ) {
				let type = typeList[t];
				scan( t, type, member );
				if( type.effect ) {
					scan( null, type.effect, 'icon' );
					scan( null, type.effect, 'iconCloud' );
					scan( null, type.effect, 'iconOver' );
				}
			}
		}


		// Pre-load all of the images by running the real imagGets with the SECOND variable forced to each
		// variation of imgChoices. It is the responsibilty of the type to implement this properly.
		for( let symbol in SymbolToType ) {
			let type = SymbolToType[symbol];
			console.assert( this.imgGet[type.typeId] === undefined );
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
		scanTypeList(StickerList,'img');
		Object.each( ItemTypeList, itemType => {
			if( !itemType.imgGet ) {
				scanTypeList( itemType.qualities || {},'img');
				scanTypeList( itemType.materials || {},'img');
				scanTypeList( itemType.varieties || {},'img');
				scanTypeList( itemType.effects || {},'img');
			}
		});
		scanIcon(EffectTypeList,'icon');

		function setup() {
			self.ready = true;
		}

		this.loader
			.add(imageList)
			.load(setup);

	}
	get(imgPath) {
		let resource = this.loader.resources[IMG_BASE+imgPath];
		if( !resource ) debugger;
		return resource;
	}
}

let _viewMap = null;

let spriteDeathCallback = function(spriteList) {
	if( !spriteList ) return;
	Array.filterInPlace( spriteList, sprite => {
		sprite.refs--;
		if( sprite.refs <= 0 ) {
			if( sprite.keepAcrossAreas ) {
				return true;
			}
			_viewMap.app.stage.removeChild(sprite);
		}
		return false;
	});
};

let spriteCreate = function(spriteList,imgPath,mayReuse) {
	if( !imgPath ) {
		debugger;
	}
	let resource = _viewMap.imageRepo.get(imgPath);
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

let spriteAttach = function(spriteList,sprite) {
	sprite.refs = (sprite.refs||0)+1;
	spriteList.push(sprite);
}

let spriteOnStage = function(sprite,value) {
	if( value == sprite.onStage ) {
		return;
	}
	if( value && _viewMap.app.stage.children.find( s => s==sprite ) ) {
		debugger;
	}
	_viewMap.app.stage[value?'addChild':'removeChild'](sprite);
	sprite.onStage = value;
	return sprite;
}

let spriteMakeInWorld = function(entity,xWorld,yWorld,darkVision,senseInvisible) {

	function make(x,y,entity,imgGet,light,doTint,doGrey,numSeed) {

		entity.spriteList = entity.spriteList || [];

		for( let i=0 ; i<(entity.spriteCount || 1) ; ++i ) {
			if( !entity.spriteList[i] ) {
				let img = imgGet(entity,null,numSeed);
				if( !img ) {
					debugger;
					imgGet(entity);	//helps with debugging.
				}
				//console.log( "Create sprite "+entity.typeId,x/Tile.DIM,y/Tile.DIM);
				let sprite = spriteCreate( entity.spriteList, img );
				sprite.keepAcrossAreas = entity.isUser && entity.isUser();
				sprite.anchor.set(entity.xAnchor||0.5,entity.yAnchor||0.5);
				sprite.baseScale = entity.scale || Tile.DIM/sprite.width;
				if( entity.isMonsterType && !entity.scale) {
					sprite.baseScale *= Math.rand(MONSTER_SCALE_VARIANCE_MIN,MONSTER_SCALE_VARIANCE_MAX);
				}
			}
			let sprite = entity.spriteList[i];
			let onStage = !entity.invisible || senseInvisible;
			spriteOnStage(sprite,onStage);
			if( sprite.refs == 1 ) {	// I must be the only controller, so...
				let zOrder = entity.zOrder || (entity.isWall ? Tile.zOrder.WALL : (entity.isFloor ? Tile.zOrder.FLOOR : (entity.isTileType ? Tile.zOrder.TILE : (entity.isItemType ? (entity.isGate ? Tile.zOrder.GATE : (entity.isDecor ? Tile.zOrder.DECOR : Tile.zOrder.ITEM)) : (entity.isMonsterType ? Tile.zOrder.MONSTER : Tile.zOrder.OTHER)))));
				sprite.zOrder 	= zOrder;
				sprite.visible 	= true;
				sprite.x 		= x+(Tile.DIM/2);
				sprite.y 		= y+(Tile.DIM/2);
				sprite.transform.scale.set( sprite.baseScale );
				sprite.alpha 	= (entity.alpha||1) * Light.Alpha[Math.floor(light)];
				//debug += '123456789ABCDEFGHIJKLMNOPQRS'.charAt(light);
			}
			if( doTint ) {
				sprite.filters = this.desaturateFilterArray;
				sprite.tint = 0xAAAAFF;
			}
			else
			if( doGrey ) {
				sprite.filters = this.desaturateFilterArray;
				sprite.tint = 0xFFFFFF;
			}
			else {
				sprite.filters = this.resetFilterArray;
				sprite.tint = 0xFFFFFF;
			}
		}
		if( entity.puppetMe ) {
			entity.puppetMe.puppet(entity.spriteList);
			delete entity.puppetMe;
		}
	}

	let self = _viewMap;
	// This can happen at game start, before anything has been told to observe.
	if( !self.observer ) {
		return;
	}
	
	let glowLight = MaxVis;
//			self.staticTileEntity = self.staticTileEntity || { isStaticTile: true };

	// These are the world coordinate offsets
	let wx = (self.observer.x-self.sd);
	let wy = (self.observer.y-self.sd);
	let x = xWorld - wx;
	let y = yWorld - wy;
	let doTint = false;
	let doGrey = false;
	let light = x>=0 && y>=0 && x<self.d && y<self.d ? self.drawListCache[y][x][0] : 0;
	let isMemory = x>=0 && y>=0 && x<self.d && y<self.d ? self.drawListCache[y][x][1] : false;
	if( isMemory ) {
		doTint = true;
		light = MapMemoryLight;
	}
	else
	if( darkVision ) {
		doGrey = true;
	}

	if( entity.isTileType && !entity.isPosition ) {
		entity.spriteList = self.observer.map.tileSprite[yWorld][xWorld][entity.typeId];
	}

	let imgGet = self.imageRepo.imgGet[entity.typeId];
	let lightAfterGlow = entity.glow ? Math.max(light,glowLight) : light;
	make.call(
		self,
		x*Tile.DIM,
		y*Tile.DIM,
		entity,
		imgGet,
		lightAfterGlow,
		doTint,
		doGrey,
		self.randList[xWorld&0xFF]+7+self.randList[yWorld&0xFF]
	);

	if( entity.isTileType && !entity.isPosition ) {
//				self.observer.map.tileSprite[yWorld][xWorld] = self.staticTileEntity.spriteList;
		self.observer.map.tileSprite[yWorld][xWorld][entity.typeId] = entity.spriteList;
//				delete entity.spriteList;
	}
}



class ViewMap extends ViewObserver {
	constructor(divId,imageRepo) {
		super();
		this.divId = divId;
		this.imageRepo = imageRepo;
		this.app = new PIXI.Application(10, 10, {backgroundColor : 0x000000});
		this.desaturateFilter = new PIXI.filters.ColorMatrixFilter();
		this.desaturateFilter.desaturate();
		this.desaturateFilterArray = [this.desaturateFilter];
		this.resetFilter = new PIXI.filters.ColorMatrixFilter();
		this.resetFilter.reset();
		this.resetFilterArray = [this.resetFilter];
		this.randList = [];
		for( let i=0 ; i<256 ; ++i ) {
			this.randList.push( Math.randInt( 0, 1023 ) );
		}

		document.getElementById(this.divId).appendChild(this.app.view);
		this.setDimensions();
		this.hookEvents();
		_viewMap = this;

		let self = this;
		this.app.ticker.add(function(delta) {
			// but only if real time is not stopped.
			if( self.observer && self.observer.area ) {
				self.observer.area.animationManager.tickRealtime(delta/60);
			}
		});
		this.drawListCache = [];
	}

	hookEvents() {
		let self = this;
		$('#'+this.divId+' canvas').mousemove( function(e) {

			let offset = $(this).offset(); 
			let mx = Math.floor((e.pageX - offset.left)/Tile.DIM);
			let my = Math.floor((e.pageY - offset.top)/Tile.DIM);

			if( !self.observer ) {
				return;
			}
			let observer = self.observer;
			let area = observer.area;
			let x = (observer.x-self.sd) + mx;
			let y = (observer.y-self.sd) + my;
			//console.log( "ViewMap mousemove detected ("+x+','+y+')' );
			guiMessage( 'hide' );
			if( !observer.canTargetPosition(x,y) ) {
				return;
			}
			let entity =
				new Finder(area.entityList,observer).at(x,y).canTargetEntity().first ||
				new Finder(area.map.itemList,observer).at(x,y).canTargetEntity().first ||
				adhoc(area.map.tileTypeGet(x,y),area.map,x,y);
			if( !entity ) {
				return;
			}
			//console.log( x,y,entity.name);
			guiMessage( 'show', entity );
			guiMessage( 'pick', { xOfs: x-observer.x, yOfs: y-observer.y } );
			if( entity.isMonsterType ) {
				console.log( entity.history.join('\n') );
			}
		});
		$('#'+this.divId+' canvas').mouseout( function(e) {
			guiMessage('hide');
			//console.log('mouse out of canvas');
		});
		$('#'+this.divId+' canvas').click( function(e) {
			var e = $.Event("keydown");
			e.key = 'Enter';
			$(document).trigger(e);
		});
	}

	setDimensions() {
		this.sd = MaxVis;
		this.d = ((this.sd*2)+1);
		let tileWidth  = Tile.DIM * this.d;
		let tileHeight = Tile.DIM * this.d;

		this.app.renderer.view.style.width = tileWidth + "px";
		this.app.renderer.view.style.height = tileHeight + "px";
		this.app.renderer.resize(tileWidth,tileHeight);
	}
	setZoom(_zoom) {
		this.zoom = _zoom % 3;
		let oldDim = Tile.DIM;
		if( this.zoom == 0 ) { Tile.DIM=32 ; MaxVis=11; }
		if( this.zoom == 1 ) { Tile.DIM=48 ; MaxVis=8; }
		if( this.zoom == 2 ) { Tile.DIM=64 ; MaxVis=6; }
		//document.documentElement.style.setProperty('--Tile.DIM', Tile.DIM);
		//document.documentElement.style.setProperty('--TILE_SPAN', MaxVis*2+1);
		this.setDimensions();
		for( let child of this.app.stage.children ) {
			child.x = ((child.x-(oldDim/2)) / oldDim) * Tile.DIM + Tile.DIM/2;
			child.y = ((child.y-(oldDim/2)) / oldDim) * Tile.DIM + Tile.DIM/2;
			child.transform.scale.set( child.baseScale );
		}
	}

	worldOverlayAdd(groupId,x,y,area,img) {
		console.assert( x!==undefined && y!==undefined && area !==undefined && img !==undefined );
		console.assert( area.isArea );
//			console.log(groupId,x,y,img);
		new Anim( {}, {
			groupId: 	groupId,
			x: 			x,
			y: 			y,
			area: 		area,
			img: 		img,
			duration: 	true
		});
	}

	worldOverlayRemove(fn) {
		// Hmm, this really isn't exactly right. We seem to need something that goes through
		// ALL the areas and removes these animations, because... What if the removal
		// intends an area we're not in?
		return this.observer.area.animationManager.remove(fn);
	}

	message(msg,payload) {
		super.message(msg,payload);
		if( msg=='zoom' ) {
			this.setZoom(this.zoom+1);
			this.render();
		}
		if( msg == 'overlayRemove' ) {
			this.worldOverlayRemove( a => a.groupId==payload.groupId );
		}
		if( msg == 'overlayAdd' ) {
			this.worldOverlayAdd(payload.groupId,payload.x,payload.y,payload.area,payload.img);	
		}
		if( msg == 'show' ) {
			if( !payload.isItemType || (payload.owner && payload.owner.isMap) ) {
				this.worldOverlayRemove( a => a.groupId=='guiSelect' );
				this.worldOverlayAdd('guiSelect', payload.x, payload.y, payload.area, StickerList.selectBox.img);	
			}
			this.render();
		}
		if( msg == 'hide' ) {
			this.worldOverlayRemove( a => a.groupId=='guiSelect' );
			//console.log('ViewMap hide');
			this.render();
		}
		if( msg == 'render' ) {
			this.render();
		}
	}

	draw(drawList) {

		let maxLight = MaxVis;
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
		observer.area.animationManager.clip.set(
			this.observer.x - this.sd*1.5,
			this.observer.y - this.sd*1.5,
			this.observer.x + this.sd*1.5,
			this.observer.y + this.sd*1.5
		);


		for( let y=0 ; y<this.d ; ++y ) {
			for( let x=0 ; x<this.d ; ++x ) {
				if( !this.drawListCache[y] || !this.drawListCache[y][x] ) {
					//debug += '-';
					continue;
				}
				let tile = this.drawListCache[y][x];
				// Start at 2 because 0 is reserved for light values, 
				// and 1 is reserved for the mapMemory flag.
				for( let i=2 ; i<tile.length ; ++i ) {
					let entity = tile[i];
					if( !entity ) continue;
					if( typeof entity !== 'object' ) debugger;
					if( entity.isAnimation ) {
						let light = observer.isSpectator ? maxLight : tile[0];
						entity.drawUpdate(observer.x-this.sd, observer.y-this.sd, light, this.app.stage.addChild);
					}
					else
					{
						//if( wx+x==this.observer.x && wy+y == this.observer.y ) debugger;
						let imgGet = this.imageRepo.imgGet[entity.typeId];
						if( imgGet ) {
							spriteMakeInWorld(entity,wx+x,wy+y,this.observer.darkVision,this.observer.senseInvisible);
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
		//$('#guiDebug2').html(this.app.stage.children.length);

//		this.app.stage.children.forEach( sprite => sprite.sortKey = sprite.zOrder*10000*10000+sprite.y*10000+sprite.x );
		this.app.stage.children.forEach( sprite => sprite.sortKey = sprite.zOrder );
		this.app.stage.children.sort( (a,b) => a.sortKey-b.sortKey );
	}

	render() {
		//var focused =  $( document.activeElement ) ;
		//if( !focused || focused.length == 0 ) {
		//	console.log('re-focused from ',focused);
		//	$('#'+this.divId+' canvas').focus();
		//}

		let observer = this.observer;
		let area = observer.area;
		let drawList = createDrawList(observer,this.drawListCache);
		this.draw(drawList);
	}
}

return {
	ImageRepo: ImageRepo,
	ViewMap: ViewMap,
	spriteCreate: spriteCreate,
	spriteAttach: spriteAttach,
	spriteOnStage: spriteOnStage,
	spriteMakeInWorld: spriteMakeInWorld,
	spriteDeathCallback: spriteDeathCallback
}

});

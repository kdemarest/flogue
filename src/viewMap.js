Module.add('viewMap',function() {

let MONSTER_SCALE_VARIANCE_MIN = 0.75;
let MONSTER_SCALE_VARIANCE_MAX = 1.00;


class Pane extends ClipRect {
	constructor(observerFn) {
		this.visionTiles = null;	// was .sd
	}
	get sizeInTiles() {				// was .d
		return this.visionTiles*2+1;
	}
	get tileDim() {
		return Tile.DIM;
	}
	setVisionTiles(visionTiles) {
		this.visionTiles = visionTiles;
	}
	inSightOf(observer,x,y) {
		let d = this.sizeInTiles / 2.0;
		return x>=observer.x-d && x<=observer.x+d && y>=observer.y-d && y<=observer.y+d;
	}
}


function handleScent(map,px,py,senseSmell,ofs,visibilityDistance) {

	px = Math.toTile(px);
	py = Math.toTile(py);

	guiMessage( 'overlayRemove', { groupId: 'scent' } );

	if( !senseSmell) {
		return;
	}

	let d = visibilityDistance;
	let d2 = (d*2)+1
	for( let y=py-d*2 ; y<=py+d*2 ; ++y ) {
		let ty = y-(py-d);
		for( let x=px-d*2 ; x<=px+d*2 ; ++x ) {
			let inBounds = x>=0 && x<map.xLen && y>=0 && y<map.yLen;
			if( !inBounds ) continue;
			let tx = x-(px-d);
			let inPane = tx>=0 && tx<d2 && ty>=0 && ty<d2;
			if( !inPane ) continue;

			let smelled = map.scentGetEntitySmelled(x,y,senseSmell);
			if( !smelled ) continue;

			let age = map.scentGetAge(x,y);
			let alpha = 0.0 + Math.clamp(1-(age/senseSmell),0,1) * 0.6;
			if( !alpha ) continue;

			new Anim( {}, {
				groupId: 		'scent',
				x: 				x-ofs,
				y: 				y,
				area: 			map.area,
				img: 			smelled.img,
				duration: 		true,
				onSpriteMake: 	s => { s.sScaleSet(0.4*(smelled.scale||1)).sAlpha(alpha); s.glow=1; }
			});
		}
	}
}

function handlePerception(observer,visCache,map,px,py,sensePerception,senseAlert,ofs) {
	console.assert(visCache);

	px = Math.toTile(px);
	py = Math.toTile(py);

	guiMessage( 'overlayRemove', { groupId: 'perc' } );

	if( !sensePerception && !senseAlert ) {
		return;
	}

	let f = observer.findAliveOthersNearby(MaxVis*2).filter( e => observer.isMyEnemy(e) && !observer.isHiddenEntity(e) );

	let d = observer.visibilityDistance;
	let d2 = (d*2)+1
	for( let y=py-d*2 ; y<=py+d*2 ; ++y ) {
		let ty = y-(py-d);
		for( let x=px-d*2 ; x<=px+d*2 ; ++x ) {
			let inBounds = x>=0 && x<map.xLen && y>=0 && y<map.yLen;
			if( !inBounds ) continue;
			let tx = x-(px-d);
			let inPane = tx>=0 && tx<d2 && ty>=0 && ty<d2;
			if( !inPane ) continue;

			let visible = inBounds && visCache[y] && visCache[y][x];
			if( !visible ) {
				continue;
			}
			let tile = map.tileTypeGet(x,y);
			if( tile.isWall ) {
				continue;
			}
			// WARNING: The sneak and light must be the same as those used in entity.canTargetEntity
			let perc = sensePerception && f.all.find( e => e.canTargetPosition(x,y,e.area,observer.sneak||0,(observer.light||0) * Rules.noticeableLightRatio) );
			let alarm = senseAlert && f.all.find( e => e.testTooClose(x,y,observer.sneak) );
			if( !perc && !alarm ) {
				continue;
			}

			new Anim( {}, {
				groupId: 		'perc',
				x: 				x+ofs,
				y: 				y,
				area: 			map.area,
				img: 			alarm ? StickerList.alert.img : StickerList.perception.img,
				duration: 		true,
				onSpriteMake: 	s => { s.sScaleSet(0.3).sAlpha(0.1); }
			});
		}
	}
}

let Scene = new class {
	constructor() {
		this.spriteList = {};
		this.viewMap = null;
	}
	get stage() {
		return this.viewMap ? this.viewMap.app.stage : null;
	}
	attach(spriteList,sprite,mayReuse) {
		sprite.refs = (sprite.refs||0)+1;

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
	}
	detach(spriteList) {
		if( !spriteList ) return;
		Array.filterInPlace( spriteList, sprite => {
			sprite.refs--;
			if( sprite.refs <= 0 ) {
				Scene.viewMap.app.stage.removeChild(sprite);
				sprite.onStage = false;		// maybe needed?
			}
			return false;
		});
	}
	dirty(entity) {
		if( !entity.spriteList ) {
			return;
		}
		return Scene.detach(entity.spriteList);
	}

	create(spriteList,imgPath,mayReuse) {
		if( !imgPath ) {
			debugger;
		}
		let resource = ImageRepo.get(imgPath);
		if( !resource ) {
			debugger;
			return;
		}
		let sprite = new PIXI.Sprite( resource.texture );
		sprite.resource = resource;
		sprite.onStage = false;
		sprite.refs = 0;
		this.attach( spriteList, sprite, ayReuse);
		return sprite;
	}
	spriteOnStage(sprite,value) {
		console.assert(Scene.stage);

		if( value == sprite.onStage ) {
			return;
		}
		Scene.stage[value?'addChild':'removeChild'](sprite);
		sprite.onStage = value;
		return sprite;
	}
	spriteUpdate(sprite,xWorld,yWorld) {
		debugger;
		// needs re-write.
		// Aims to set sprite.x and .y to an appropriate screen coord.
		// steal code from entitySprite.update for this
	}
}

/*
function createDrawList(observer,drawListCache) {

	console.log('createDrawList');

	// Recalc this here, just in case.
	let map = observer.map;
	let visCache = observer.calculateVisbility();
	let areaVis = observer.area.vis;
	let entityList = map.area.entityList;
	let lightMap = map.area.lightCaster.lightMap;

	//let convert = { '#': '█' };
	let px = Math.toTile(observer.x);
	let py = Math.toTile(observer.y);
	let d =  observer.visibilityDistance;
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

	let ofs = (observer.senseSmell && (observer.sensePerception || observer.senseAlert)) ? 0.2 : 0;
	handleScent(map,px,py,observer.senseSmell,ofs,observer.visibilityDistance);
	handlePerception(observer,visCache,map,px,py,observer.sensePerception,observer.senseAlert,ofs);

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
			let itemFind;

			if( inBounds ) {
				tile =		map.tileTypeGet(x,y);
				if( tile.isFloor ) {
					lastFloor = tile;
				}
				console.assert(tile);
				itemFind = map.findItemAt(x,y);

				let temp = map._entityLookupGet(x,y);
				entity = temp && temp.length ? temp[0] : null;
				if( entity ) { //&& observer.canPerceiveEntity(entity) ) {
					entity = ( entity.id == observer.id && entity.invisible ) ? StickerList.invisibleObserver : entity;
				}
				else
					entity = null;

				if( !entity && observer.senseSmell ) {
					smelled = map.scentGetEntitySmelled(x,y,observer.senseSmell);
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
					let mPos = map.lPos(x,y);
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

	let anyLight = false;
	map.traverseNear( px, py, d, (x,y) => {
		console.assert( px==Math.floor(px) && x==Math.floor(x) );
		let ty = y-(py-d);
		let tx = x-(px-d);
		if( a[ty][tx].length < 1 ) return;
		let light = a[ty][tx][0];
		let lPos = ty*map.xLen+tx;
		map.lightCache[lPos] = light;
		anyLight = anyLight || light;
	});
	if( !anyLight ) {
		debugger;
	}

	drawListCache = a;
	return a;
}
*/


class EntitySprite {
	constructor() {
		this.entity    = null;
		this.sprite    = null;
		this.xAnchor   = 0.5;
		this.yAnchor   = 0.5;
		this.baseScale = null;
		this.alpha     = 1.0;
		this.zOrder    = Tile.zOrder.WALL;
		this.observer  = null;
		this.inPane    = false;
		this.age       = 0;
	}

	get xWorld() {
		return this.entity.x;
	}

	get yWorld() {
		return this.entity.y;
	}

	get xWorldTile() {
		return Math.toTile(this.xWorld);
	}

	get yWorldTile() {
		return Math.toTile(this.yWorld);
	}

	get isMemory() {
		console.assert(this.entity.area.id==this.observer.area.id);
		let mPos = this.entity.map.lPos(this.xWorld,this.yWorld);
		return this.observer.mapMemory && this.observer.mapMemory[mPos];
	}

	get isDarkVision() {
		return this.observer.senseDarkVision && !this.isMemory;
	}

	get light() {
		let revealLight = 7;		// Assumes max light is about 10.
		let glowLight   = MaxVis;
		let memoryLight = 1;

		if( this.entity.isTreasure && this.observer.senseTreasure ) {
			return revealLight;
		}

		if( this.entity.isLiving && this.observer.senseLiving ) {
			return revealLight;
		}

		let lPos = this.entity.map.lPos(this.xWorldTile,this.yWorldTile);
		let light = this.entity.map.area.lightCaster.lightMap[lPos];
		let lightAfterGlow = this.entity.glow ? Math.max(light,glowLight) : light;
		return lightAfterGlow;
	}

	get visible() {
		if( this.entity.id == this.observer.id ) return true;
		if( this.entity.isTreasure && this.observer.senseTreasure ) return true;
		if( this.entity.isLiving && this.observer.senseLiving ) return true;
		if( this.entity.invisible && !this.observer.senseInvisible ) return false;
		if( this.observer.senseBlind ) return false;
		return this.observer.visCache[this.yWorldTile][this.xWorldTile];
	}
	
	get numSeed() {
		return ViewMap.randList[this.xWorldTile&0xFF]+7+ViewMap.randList[this.yWorldTile&0xFF];
	}

	update(observer) {
		this.observer = observer;
		if( this.inPane || this.entity.puppetMe ) {

			this.sprite.age = 0;

			this.sprite.x = (this.xWorld-observer.x)*Tile.DIM+(Tile.DIM/2);
			this.sprite.y = (this.yWorld-observer.y)*Tile.DIM+(Tile.DIM/2);

			this.sprite.anchor.set(this.xAnchor,this.yAnchor);
			this.sprite.transform.scale.set( this.baseScale );

			this.sprite.alpha  = this.alpha * Light.Alpha[Math.floor(light)];
			this.sprite.zOrder = this.zOrder;

			let showSprite = true;
			if( this.visible ) {
				this.sprite.filters = ViewMap.saveBattery ? null : this.isDarkVision ? this.desaturateFilterArray : this.resetFilterArray;
				this.sprite.tint = 0xFFFFFF;
				this.sprite.visible = true
			}
			else if( this.isMemory ) {
				this.sprite.filters = ViewMap.saveBattery ? null : this.desaturateFilterArray;
				this.sprite.tint = 0x8888FF;
			}
			else showSprite = false;
			this.sprite.visible = showSprite;
		}

		if( this.entity.puppetMe ) {
			this.entity.puppetMe.puppet(this.sprite);
			delete this.entity.puppetMe;
		}

	}

	init(entity) {
		console.assert(entity);
		this.entity = entity;
		//this._xWorld = _xWorld===null ? entity.x : _xWorld;
		//this._yWorld = _yWorld===null ? entity.y : _yWorld;

		let imgGetFn = ImageRepo.imgGet[entity.typeId] || ImageRepo.get;
		this.sprite  = new PIXI.Sprite( imgGetFn(entity,null,this.numSeed).texture );
		this.sprite.refs = 0;
		this.sprite.age  = 0;
		this.entity.spriteList = [];
		Scene.attach( entity.spriteList, this.sprite );

		this.xAnchor    = entity.xAnchor || 0.5;
		this.yAnchor    = entity.yAnchor || 0.5;
		this.baseScale	= (entity.scale || 1) * Tile.DIM/this.sprite.width;
		this.zOrder     = entity.zOrder || (entity.isWall ? Tile.zOrder.WALL : (entity.isFloor ? Tile.zOrder.FLOOR : (entity.isTileType ? Tile.zOrder.TILE : (entity.isItemType ? (entity.isGate ? Tile.zOrder.GATE : (entity.isDecor ? Tile.zOrder.DECOR : Tile.zOrder.ITEM)) : (entity.isMonsterType ? Tile.zOrder.MONSTER : Tile.zOrder.OTHER)))));
		this.alpha      = entity.alpha===undefined ? 1.0 : entity.alpha;
		return this;
	}
}

make guiMessages that tell of added monsters and and items added to or removed from the map
- then the draw csn just call .update()

entering a new tile makes you re-traverse the map, only

class AreaScene {
	constructor() {
		this.entitySpriteList  = [];
		this.observer = null;
		this.stage = null;
		this.pane  = null;
		this.sortDirty = false;
	}

	freshen(observer,stage,pane) {
		this.observer = observer;
		this.stage    = stage;
		this.pane     = pane;
	}

	get area() {
		return this.observer.area;
	}

	get map() {
		return this.area.map;
	}

	ageAndPrune() {
		let ageOfDeath = 5;
		let killList = this.stage.children.filter( sprite => (sprite.age++) > ageOfDeath );
		killList.forEach( sprite => this.stage.removeChild(sprite) );
	}

	check(entity) {
		let inPane = this.pane.inSightOf(this.observer,entity.x,entity.y) && entity.area.id==this.observer.area.id;
		if( inPane && !entity.entitySprite ) {
			entity.entitySprite = new EntitySprite().init(entity);
			this.sortDirty = true;
		}
		if( entity.entitySprite ) {
			entity.entitySprite.inPane = inPane;
		}
		if( inPane ) {
			this.entitySpriteList.push(entity.entitySprite);
		}
	}

	checkMap() {
		this.map.traverse( (x,y) => {
			let inPane = this.pane.inSightOf(this.observer,x,y);
			if( inPane ) {
				let entity = this.map.toTileEntity(x,y);
				this.check(entity);
			}
		});
	}

	checkAll(pane,observer) {

		this.entitySpriteList.length = 0;

		pane.setObserver(observer);

		this.area.entityList.forEach( entity => {
			addAndUpdate(entity);
		});

		this.area.map.itemList.forEach( item => {
			addAndUpdate(item);
		});

		checkMap();

	}

	tick(dt) {
		Time.tickOnTheSecond( dt, this, () => this.prune() );
	}

	draw(drawList) {

		if( this.sortDirty ) {
			this.stage.children.sort( (a,b) => a.zOrder-b.zOrder );
			this.sortDirty = false;
		}

/*
		observer.area.animationManager.clip.set(
			this.observer.x - this.sd*1.5,
			this.observer.y - this.sd*1.5,
			this.observer.x + this.sd*1.5,
			this.observer.y + this.sd*1.5
		);

		for anim in animList {
			let light = observer.isSpectator ? maxLight : tile[0];
			anim.drawUpdate(observer.x-this.sd, observer.y-this.sd, light, this.app.stage.addChild);
		}
*/

		this.entitySpriteList.forEach( entitySprite => {
			entitySprite.update(this.observer);
		});
	}
}



class ViewMap extends ViewObserver {
	constructor(divId) {
		super();
		this.divId = divId;
		this.pixiDestroy();
		ViewMap.randList = [];
		for( let i=0 ; i<256 ; ++i ) {
			ViewMap.randList.push( Math.randInt( 0, 1023 ) );
		}
		Scene.viewMap = this;

		this.app			= null;
		this.drawListCache	= [];
		this.pane			= new Pane();
		this.areaScene		= new AreaScene();
	}

	pixiDestroy() {
		$(this.divId).empty();
		if( ViewMap.globalPixiApp ) {
			ViewMap.globalPixiApp.destroy(true,{children:true,texture:false,baseTexture:false});
		}
		this.app = null;
	}
	pixiCreate() {
		// 10,10 is just a fake dimensions. The resize will figure that out.
		this.app = new PIXI.Application(10, 10, {backgroundColor : 0x000000});
		ViewMap.globalPixiApp = this.app;

		ViewMap.desaturateFilter = new PIXI.filters.ColorMatrixFilter();
		ViewMap.desaturateFilter.desaturate();
		ViewMap.desaturateFilterArray = [this.desaturateFilter];
		ViewMap.resetFilter = new PIXI.filters.ColorMatrixFilter();
		ViewMap.resetFilter.reset();
		ViewMap.resetFilterArray = [this.resetFilter];

		let pixiView = $(this.divId)[0].appendChild(this.app.view);
		this.hookEvents();

		console.assert( this.app.stage );

		// Don't start rendering until we first try to render.
		this.app.ticker.stop()
		this.pixiTimerPaused = true;

		// Note that pixi defaults to 16.66ms, or just slightly better than 60fps
		this.app.ticker.add( delta =>  {
			let dt = delta / 60;	// that is just how pixi rolls.
			if( this.observer && this.observer.area ) {
				this.observer.area.world.tickRealtime(dt);
				this.observer.area.animationManager.tickRealtime(dt);
			}
		});
	}

	hookEvents() {
		let self = this;
		let myCanvas = $(this.divId+' canvas');
		console.assert(myCanvas.length);

		$(myCanvas).mousemove( function(e) {
			let offset = $(this).offset(); 
			let mx = Math.floor((e.pageX - offset.left)/Tile.DIM);
			let my = Math.floor((e.pageY - offset.top)/Tile.DIM);

			if( !self.observer ) {
				return;
			}
			let observer = self.observer;
			let area = observer.area;
			let xLeft = (observer.x-self.pane.visionTiles) + mx;
			let yTop  = (observer.y-self.pane.visionTiles) + my;
			//console.log( "ViewMap mousemove detected ("+x+','+y+')' );
			
			guiMessage( 'viewRangeMouse', { xOfs: xLeft-observer.x, yOfs: yTop-observer.y } );
		});
		$(myCanvas).mouseout( function(e) {
			guiMessage('hideInfo',{from:'viewMap'});
			//console.log('mouse out of canvas');
		});
		$(myCanvas).click( function(e) {
			var e = $.Event("keydown");
			e.key = 'Enter';
			Gui.keyHandler.trigger(e);
//			$(document).trigger(e);
		});
	}

	setZoom(_zoom) {
		this.zoom = _zoom % 5;
		if( this.zoom == 0 ) { this.setMapVis(11); }
		if( this.zoom == 1 ) { this.setMapVis(8); }
		if( this.zoom == 2 ) { this.setMapVis(6) }
		if( this.zoom == 3 ) { this.setMapVis(4) }
		if( this.zoom == 4 ) { this.setMapVis(3) }
	}

	worldOverlayAdd(groupId,x,y,area,img) {
		console.assert( x!==undefined && y!==undefined && area !==undefined && img !==undefined );
		console.assert( area.isArea );
		//console.log('overlay add '+groupId);
		new Anim( {}, {
			groupId: 	groupId,
			x: 			x,
			y: 			y,
			area: 		area,
			img: 		img,
			duration: 	true
		});
	}

	worldOverlayRemove(fn,note) {
		// Hmm, this really isn't exactly right. We seem to need something that goes through
		// ALL the areas and removes these animations, because... What if the removal
		// intends an area we're not in?
		return this.observer.area.animationManager.remove(fn,note);
	}

	setMapVis(mapVis) {
		if( !this.observer || !this.app ) {
			debugger;
			return;
		}
		console.assert( mapVis );
		this.observer.visibilityDistance = mapVis;
		MaxVis = mapVis;	// This is questionable - it limits how far monsters can perceive you, which maybe shouldn't change with screen sizing

		Gui.layout({
			'#mapContainer': {
				height: self => $(window).height() - self.offset().top
			}
		});

		let w = $('#mapContainer').width();
		let h = $('#mapContainer').height();
		let smallestDim = Math.min(w,h);
		let mapTileDim = mapVis*2+1;

		Tile.DIM = Math.floor(smallestDim / mapTileDim);

		this.pane.setVisionTiles(MaxVis);

		console.assert( !isNaN(this.pane.visionTiles) );
		let tileWidth  = Tile.DIM * this.pane.sizeInTiles;
		let tileHeight = Tile.DIM * this.pane.sizeInTiles;

		this.app.renderer.view.style.width  = tileWidth  + "px";
		this.app.renderer.view.style.height = tileHeight + "px";
		this.app.renderer.resize(tileWidth,tileHeight);

		if( this.observer ) {
			this.observer.area.castLight();
		}
		this.dirty = true;
	}

	message(msg,payload) {
		super.message(msg,payload);
		if( msg=='create2DEngine') {
			if( !this.app ) {
				this.pixiCreate();
			}
		}
		if( msg=='start2DEngine' ) {
			// This is the one place where a direct call to render is allowed.
			this.render();
			if( this.pixiTimerPaused ) {
				this.app.ticker.start()
				this.pixiTimerPaused = false;
			}
		}
		if( msg=='saveBattery' ) {
			ViewMap.saveBattery = payload;
		}
		if( msg=='zoomInc' ) {
			this.setZoom(this.zoom+1);
		}
		if( msg=='zoomPush' ) {
			this.zoomStack = (this.zoomStack || []);
			this.zoomStack.push(this.zoom);
			this.setZoom(payload.zoom);
		}
		if( msg=='zoomPop' ) {
			this.setZoom(this.zoomStack.pop());
		}
		if( msg == 'resize' ) {
			this.setMapVis(this.observer.visibilityDistance);
		}
		if( msg == 'setArea' ) {
			if( this.observer ) {
				this.setMapVis(this.observer.visibilityDistance);
			}
		}
		if( msg == 'stageEntityMoved' ) {
			console.assert(payload.typeId);
			this.areaScene.check(entity);
		}
		if( msg == 'overlayRemove' ) {
			this.worldOverlayRemove( a => a.groupId==payload.groupId,'message '+payload.groupId,payload );
		}
		if( msg == 'overlayAdd' ) {
			this.worldOverlayAdd(payload.groupId,payload.x,payload.y,payload.area,payload.img);	
		}
		if( msg == 'showCrosshair' ) {
			if( !payload.isItemType || (payload.owner && payload.owner.isMap) ) {
				this.worldOverlayRemove( a => a.groupId=='viewRangeSelect', 'removing guiSelect' );
				this.worldOverlayAdd('viewRangeSelect', payload.x, payload.y, payload.area, StickerList.selectBox.img);	
			}
			this.dirty = true;
		}
		if( msg == 'hideCrosshair' ) {
			this.worldOverlayRemove( a => a.groupId=='viewRangeSelect',' from hideInfo' );
			//console.log('ViewMap hide');
			this.dirty = true;
		}
		// It just so happens that SOME perks grants benefits that require re-render.
		// But the map view might not even be set up yet! So check for an observer.
		if( msg == 'render' && this.observer ) {
			debugger;
			this.dirty = true;
		}
	}

	tick(dt) {
		this.areaScene.freshen( this.observer, this.stage, this.pane );
		//console.log('viewMap dt=',dt);
		this.recalcDrawList = this.dirty || !this.drawListCache;
		this.dirty = true;

		this.areaScene.tick(dt);
	}

	render() {
		let observer = this.observer;
		let drawList = this.recalcDrawList ? assembleAllSpritesIntoList(this.pane,observer,this.drawListCache) : this.drawListCache;
		if( observer.zoom && observer.zoom != this.zoom ) {
			this.setZoom(observer.zoom);
		}

		// Yes, this really gets called on the very first render.
		if( this.zoom === undefined ) {
			this.setZoom(1);
		}

		this.draw(drawList);
	}
}

return {
	ViewMap: ViewMap,
	Scene: Scene
}

});

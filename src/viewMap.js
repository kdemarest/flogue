Module.add('viewMap',function() {

let MONSTER_SCALE_VARIANCE_MIN = 0.75;
let MONSTER_SCALE_VARIANCE_MAX = 1.00;


class Pane {
	constructor() {
		this.visionTiles = null;	// was .sd
	}
	get sizeInTiles() {				// was .d
		return this.visionTiles*2+1;
	}
	get tileDim() {
		return Tile.DIM;
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

			new Anim({
				groupId: 		'scent',
				at:				{ x: x-ofs, y: y, area: map.area },
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

			new Anim({
				groupId: 		'perc',
				at:				{ x: x+ofs, y: y, area: map.area },
				img: 			alarm ? StickerList.alert.img : StickerList.perception.img,
				duration: 		true,
				onSpriteMake: 	s => { s.sScaleSet(0.3).sAlpha(0.1); }
			});
		}
	}
}

let Scene = new class {
	constructor() {
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
		let resource = ImageRepo.getResource(imgPath);
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

class EntitySprite extends Sprite {
	constructor() {
		super();
		this.entity    = null;
	}

	get area() {
		return this.entity.area;
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

	get isDarkVision() {
		return this.observer.senseDarkVision && !this.isMemory;
	}

	testLight() {
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
		let light = this.entity.map.area.lightCaster.lightMap[lPos] || 0;
		let lightAfterGlow = this.entity.glow ? Math.max(light,glowLight) : light;
		return lightAfterGlow;
	}

	testMemory() {
		console.assert(this.entity.area.id==this.observer.area.id);
		let mPos = this.entity.map.lPos(this.xWorld,this.yWorld);
		return this.observer.mapMemory && this.observer.mapMemory[mPos];
	}

	testSensed() {
		// Order matters here.
		if( this.entity.id == this.observer.id ) return true;
		if( this.observer.senseTreasure && this.entity.isTreasure ) return true;
		if( this.observer.senseLiving && this.entity.isLiving ) return true;
		if( this.observer.senseSmell && (this.entity.scentReduce||0)<100 && this.observer.nearTarget(this.entity,1.5) ) return true;

		if( !this.observer.senseInvisible && this.entity.invisible ) return false;
		if( this.observer.senseBlind ) return false;

		return !this.observer.visCache ? false : this.observer.visCache[this.yWorldTile][this.xWorldTile];
	}
	
	updateMovement(dt) {
		if( this.entity.xMove === undefined ) {
			return;
		}
		if( this.entity.moveInstantly ) {
			this.xVisual    = this.entity.xMove;
			this.yVisual    = this.entity.yMove;
			// Don't clear moveInstantly yet. We might care later how we got here.
		}
		if( this.xVisual!=this.entity.xMove || this.yVisual!=this.entity.yMove ) {
			let dx = this.entity.xMove-this.xVisual;
			let dy = this.entity.yMove-this.yVisual;
			let dist = Distance.get(dx,dy);
			let tilesPerSecond = this.entity.speedMove;
			let travel = dt*tilesPerSecond;
			if( dist < travel ) {
				this.xVisual = this.entity.xMove;
				this.yVisual = this.entity.yMove;
			}
			else {
				this.xVisual += (dx/dist)*travel;
				this.yVisual += (dy/dist)*travel;
			}
		}
		if( this.entity.isUser ) {
			this.entity.xVisualOrigin = this.xVisual;
			this.entity.yVisualOrigin = this.yVisual;
		}
	}

	updateSprite(pane) {
		super.updateSprite(pane);

		if( this.entity.invisible != this.sprite._invisible ) {
			this.sprite.setTexture( 
				ImageRepo.getResourceByImg(
					this.entity.invisible ? 
					StickerList.invisibleObserver.img :
					ImageRepo.getImg(this.entity)
				).texture
			);
			this.sprite._invisible = this.entity.invisible;
		}

		if( this.sensed ) {
			this.sprite.filters = ViewMap.saveBattery ? null : this.isDarkVision ? this.desaturateFilterArray : this.resetFilterArray;
			this.sprite.tint = 0xFFFFFF;
		}
		else if( this.memoried ) {
			this.sprite.filters = ViewMap.saveBattery ? null : this.desaturateFilterArray;
			this.sprite.tint = 0x8888FF;
		}

	}

	update(dt,observer,pane) {
		if( this.dead ) {
			return;
		}
		this.observer = observer;

		if( this.area.id !== this.observer.area.id ) {
			return this.dead = true;
		}

		if( this.entity.isItemType && !this.entity.owner.isMap ) {
			return this.dead = true;
		}

		this.inPane = pane.inSightOf(this.observer,this.entity.x,this.entity.y) && this.entity.area.id==this.observer.area.id;

		this.updateMovement(dt);

		if( this.inPane ) {
			this.age = 0;

			let light = Math.floor(this.testLight());
			console.assert(Light.Alpha[light]!==undefined);
			this.alpha = Light.Alpha[Math.floor(light)];

			this.sensed   = this.testSensed();
			this.memoried = this.sensed ? false : this.testMemory();
			this.visible  = this.sensed || this.memoried;
		}
		else {
			this.visible = false;
		}

		super.updateSprite(pane);
	}

	init(entity) {
		console.assert(entity);
		this.entity  = entity;
		this.xVisual = entity.x;
		this.yVisual = entity.y;

		this.initSpriteByImg( ImageRepo.getImg(entity) );

		this.xAnchor    = entity.xAnchor || 0.5;
		this.yAnchor    = entity.yAnchor || 0.5;
		this.scale		= entity.scale || 1;
		this.alpha  	= entity.alpha===undefined ? 1.0 : entity.alpha;
		this.zOrder     = entity.zOrder || (entity.isWall ? Tile.zOrder.WALL : (entity.isFloor ? Tile.zOrder.FLOOR : (entity.isTileType ? Tile.zOrder.TILE : (entity.isItemType ? (entity.isGate ? Tile.zOrder.GATE : (entity.isDecor ? Tile.zOrder.DECOR : Tile.zOrder.ITEM)) : (entity.isMonsterType ? Tile.zOrder.MONSTER : Tile.zOrder.OTHER)))));
		return this;
	}
}


class AreaScene {
	constructor() {
		this.observer	= null;
		this.stage		= null;
		this.pane  		= new Pane();
		this.sortDirty	= false;
	}

	get entitySpriteList() {
		return this.observer.area.entitySpriteList;
	}

	get area() {
		return this.observer.area;
	}

	get map() {
		return this.area.map;
	}

	get visionTiles() {
		return this.pane.visionTiles;
	}

	manageEntitySpriteList(dt) {
		let ageOfDeath = 5;
		for( let id in this.entitySpriteList ) {
			let e = this.entitySpriteList[id];
			if( e.dead || e.age > ageOfDeath ) {
				this.stage.removeChild(e.sprite);
				delete this.entitySpriteList[id];
				continue;
			}
			// My age was just reset during an update, so I should be on stage.
			if( e.age == 0 && e.sprite.parent !== this.stage ) {
				this.stage.addChild(e.sprite);
			}
			e.age += dt;
		}
	}

	check(entity) {
		let inPane = this.pane.inSightOf(this.observer,entity.x,entity.y) && entity.area.id==this.observer.area.id;
		if( inPane && !this.entitySpriteList[entity.id] ) {
			this.entitySpriteList[entity.id] = new EntitySprite().init(entity);
			this.sortDirty = true;
		}
	}

	checkMap() {
		this.map.traverseNear( this.observer.x, this.observer.y, this.visionTiles, (x,y) => {
			let entity = this.map.getTileEntity(x,y);
			this.check(entity);
		});
	}

	checkEnterTile() {
return;
		let ofs = (observer.senseSmell && (observer.sensePerception || observer.senseAlert)) ? 0.2 : 0;
		handleScent(
			map,
			this.observer.x,
			this.observer.y,
			observer.senseSmell,
			ofs,
			observer.visibilityDistance
		);
		handlePerception(
			observer,
			visCache,
			map,
			this.observer.x,
			this.observer.y,
			observer.sensePerception,
			observer.senseAlert,
			ofs
		);
	}

	checkAll() {
		console.log('checkAll');

		this.checkEnterTile();

		this.area.entityList.forEach( entity => {
			this.check(entity);
		});

		this.area.map.itemList.forEach( item => {
			this.check(item);
		});

		this.checkMap();

	}

	checkEntityNotice(entity) {
		// The word 'moved' means that it changed states onto or off of the map.
		if( entity.isUser ) {
			this.checkAll();
			return;
		}
		this.check(entity);
	}

	update(dt) {

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
		// Put newbs on stage, or cull any that are too old.
		this.manageEntitySpriteList(dt);

		// Update values into the sprites themselves
		let list = [];
		let done = {};
		let addWithDependency = es => {
			if( done[es.id] ) return;
			if( es.dependsOn ) addWithDependency( es.dependsOn );
			list.push(es);
		}
		Object.each( this.entitySpriteList, addWithDependency );

		list.forEach( entitySprite => {
			entitySprite.update(dt,this.observer,this.pane);
		});

		// Sort according to zOrder.
		if( this.sortDirty ) {
			this.stage.children.sort( (a,b) => a.zOrder-b.zOrder );
			this.sortDirty = false;
		}
	}
}



class ViewMap extends ViewObserver {
	constructor(divId) {
		super();
		this.divId = divId;
		this.pixiDestroy();
		Scene.viewMap = this;

		this.app			= null;
		this.drawListCache	= [];
		this.areaScene		= new AreaScene();
	}

	onSetObserver(observer) {
		this.areaScene.observer = observer;
	}

	get visionTiles() {
		return this.areaScene.pane.visionTiles;
	}

	set visionTiles(visionTiles) {
		this.areaScene.pane.visionTiles = visionTiles;
	}

	get sizeInTiles() {
		return this.areaScene.pane.sizeInTiles;
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
		this.areaScene.stage = this.app.stage;

		// Don't start rendering until we first try to render.
		this.app.ticker.stop()
		this.pixiTimerPaused = true;

		// Note that pixi defaults to 16.66ms, or just slightly better than 60fps
		this.app.ticker.add( delta =>  {
			let dt = delta / 60;	// that is just how pixi rolls.
			if( this.observer && this.observer.area ) {
				this.observer.area.animationManager.tickRealtime(dt);
				this.observer.area.world.tickRealtime(dt);
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
			let xLeft = (observer.x-self.visionTiles) + mx;
			let yTop  = (observer.y-self.visionTiles) + my;
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
		new Anim({
			groupId: 	groupId,
			at:			{ x: x, y: y, area: area },
			img: 		img,
			duration: 	true,
			onInit:		a=>a.create(1)
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

		this.visionTiles = MaxVis;

		console.assert( !isNaN(this.visionTiles) );
		let tileWidth  = Tile.DIM * this.sizeInTiles;
		let tileHeight = Tile.DIM * this.sizeInTiles;

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
		if( msg == 'stageEntityMoved' ) {
			if( this.observer ) {
				this.areaScene.checkEntityNotice(payload);
			}
		}
	}

	tick(dt) {
		if( this.dirty ) {
			this.areaScene.checkAll();
		}

		// Yes, this really gets called on the very first render.
		if( this.zoom === undefined ) {
			this.setZoom(1);
		}

		//console.log('viewMap dt=',dt);
		this.recalcDrawList = this.dirty || !this.drawListCache;
		this.dirty = true;

		this.areaScene.update(dt);
	}

	render() {
	}
}

return {
	ViewMap: ViewMap,
	Scene: Scene
}

});

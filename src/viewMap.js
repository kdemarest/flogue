Module.add('viewMap',function() {

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
				onInit:			a => a.create(1),
				onSpriteMake: 	s => { s.sScale(0.4*(smelled.scale||1)).sAlpha(alpha); s.glow=1; }
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
				onInit:			a => a.create(1),
				onSpriteMake: 	s => { s.sScale(0.3).sAlpha(0.2); }
			});
		}
	}
}



class ViewMap extends Scene {
	constructor(divId) {
		super();
		this.divId = divId;
		this.pixiDestroy();
		this.app	= null;
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
		ViewMap.globalPixiApp = new PIXI.Application(10, 10, {backgroundColor : 0x000000});
		this.app = ViewMap.globalPixiApp;

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
			//console.log('delta=',delta);
			delta = Math.floor(delta);
			let dtWall720 = (delta*Time.one720) / 60;
			console.assert( Number.isInteger(dtWall720) );
			if( this.observer && this.observer.area ) {
				this.observer.area.world.tick720(dtWall720);
			}
		});
	}

	get stage() {
		return this.app.stage;
	}

	spriteRemove(sprite) {
		console.assert(sprite && sprite.pixiSprite);
		if( !sprite.isPuppeteer ) {
			if( sprite.watch ) {
				console.watchSprite(sprite,'pixiSpriteRemove('+sprite.id+')');
			}
			this.stage.removeChild(sprite.pixiSprite);
		}
		super.spriteRemove(sprite);
	}

	spriteAdd(sprite) {
		console.assert(sprite && sprite.pixiSprite);
		super.spriteAdd(sprite);
		this.stage.addChild(sprite.pixiSprite);
	}


	hookEvents() {
		let self = this;
		let myCanvas = $(this.divId+' canvas');
		console.assert(myCanvas.length);

		let mouseToWorld = (e) => {
			let offset = $(myCanvas).offset();
			let mx = Math.floor((e.pageX - offset.left)/this.pane.tileDim);
			let my = Math.floor((e.pageY - offset.top)/this.pane.tileDim);
			let observer = this.observer;
			let area = observer.area;
			let x = (observer.x-this.pane.visionTiles) + mx;
			let y = (observer.y-this.pane.visionTiles) + my;
			return [x,y];
		}

		$(myCanvas).mousemove( e => {
			if( !this.observer ) {
				return;
			}
			let [xLeft,yTop] = mouseToWorld(e);
			guiMessage( 'viewRangeMouse', { xOfs: xLeft-this.observer.x, yOfs: yTop-this.observer.y } );
		});
		$(myCanvas).mouseout( function(e) {
			guiMessage('hideInfo',{from:'viewMap'});
			//console.log('mouse out of canvas');
		});
		$(myCanvas).click( function(e) {
			let [x,y] = mouseToWorld(e);
			e.command = Command.EXECUTE;
			e.commandX = x;
			e.commandY = y;

			Gui.keyHandler.trigger(e);
//			$(document).trigger(e);
		});
	}

	get mapViewWidthInTiles() {
		return $('#mapContainer').width() / this.pane.tileDim;
	}

	configureMapView(mapVis) {
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

		let mapContainerWidth = $('#mapContainer').width();
		let mapContainerHeight = $('#mapContainer').height();
		super.configureDimensions(
			mapContainerWidth,
			mapContainerHeight,
			mapVis
		);

		// The width is weird, because we want to be able to draw all the way to the info box when pickup items
		let w = this.pane.widthInPixels+(mapContainerWidth-this.pane.widthInPixels)/2
		this.app.renderer.view.style.width  = this.pane.widthInPixels + "px";
		this.app.renderer.view.style.height = this.pane.heightInPixels + "px";
		this.app.renderer.resize( this.pane.widthInPixels, this.pane.heightInPixels);

		if( this.observer ) {
			this.observer.area.castLight();
		}
		this.dirty = true;
	}

	setZoom(_zoom) {
		this.zoom = _zoom % 5;
		if( this.zoom == 0 ) { this.configureMapView(11); }
		if( this.zoom == 1 ) { this.configureMapView(8); }
		if( this.zoom == 2 ) { this.configureMapView(6) }
		if( this.zoom == 3 ) { this.configureMapView(4) }
		if( this.zoom == 4 ) { this.configureMapView(3) }
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

	checkEnterTile() {
		super.checkEnterTile();
		let ofs = (this.observer.senseSmell && (this.observer.sensePerception || this.observer.senseAlert)) ? 0.2 : 0;
		handleScent(
			this.observer.map,
			this.observer.x,
			this.observer.y,
			this.observer.senseSmell,
			ofs,
			this.observer.visibilityDistance
		);
		handlePerception(
			this.observer,
			this.observer.visCache,
			this.observer.map,
			this.observer.x,
			this.observer.y,
			this.observer.sensePerception,
			this.observer.senseAlert,
			ofs
		);
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
			this.configureMapView(this.observer.visibilityDistance);
		}
		if( msg == 'overlayRemove' ) {
			this.worldOverlayRemove( a => a.groupId==payload.groupId,'message '+payload.groupId,payload );
		}
		if( msg == 'overlayAdd' ) {
			this.worldOverlayAdd(payload.groupId,payload.x,payload.y,payload.area,payload.img);	
		}
		if( msg == 'showCrosshair' ) {
			if( !payload.isItemType || (payload.owner && payload.owner.isMap) ) {
				console.logRange('showCrosshair');
				this.worldOverlayRemove( a => a.groupId=='viewRangeSelect', 'from showCrosshair' );
				this.worldOverlayAdd('viewRangeSelect', payload.x, payload.y, payload.area, StickerList.selectBox.img);	
			}
			this.dirty = true;
		}
		if( msg == 'hideCrosshair' ) {
			console.logRange('hideCrosshair');
			this.worldOverlayRemove( a => a.groupId=='viewRangeSelect',' from hideCrosshair' );
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

		// Yes, this really gets called on the very first render.
		if( this.zoom === undefined ) {
			this.setZoom(1);
		}

		this.observer.area.animationManager.clip.set(
			this.observer.x - this.sd*1.5,
			this.observer.y - this.sd*1.5,
			this.observer.x + this.sd*1.5,
			this.observer.y + this.sd*1.5
		);

		super.tick(dt);

		// Sort according to zOrder.
		this.stage.children.sort( (a,b) => a.zOrder-b.zOrder );

	}

	render() {
	}
}

return {
	ViewMap: ViewMap
}

});

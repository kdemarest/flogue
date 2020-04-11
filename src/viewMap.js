Module.add('viewMap',function() {

let MapMemoryLight = 1;
let MONSTER_SCALE_VARIANCE_MIN = 0.75;
let MONSTER_SCALE_VARIANCE_MAX = 1.00;


function handleScent(map,px,py,senseSmell,ofs,visibilityDistance) {

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

				let temp = map.entityLookupGet(x,y);
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


let _viewMap = null;

let spriteDeathCallback = function(spriteList) {
	if( !spriteList ) return;
	Array.filterInPlace( spriteList, sprite => {
		sprite.refs--;
		if( sprite.refs <= 0 ) {
			_viewMap.app.stage.removeChild(sprite);
			sprite.onStage = false;		// maybe needed?
		}
		return false;
	});
};

let imageDirty = function(entity) {
	if( !entity.spriteList ) {
		return;
	}
	return spriteDeathCallback(entity.spriteList);
}


let spriteCreate = function(spriteList,imgPath,mayReuse) {
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

let spriteDetach = function(spriteList,sprite) {
	sprite.refs = (sprite.refs||0)-1;
	spriteList.push(sprite);
}

let spriteOnStage = function(sprite,value) {
	if( !_viewMap.app ) {
		return;
	}
	if( value == sprite.onStage ) {
		return;
	}
//	if( value && _viewMap.app.stage.children.find( s => s==sprite ) ) {
//		debugger;
//	}
	_viewMap.app.stage[value?'addChild':'removeChild'](sprite);
	sprite.onStage = value;
	return sprite;
}

let spriteMakeInWorld = function(entity,xWorld,yWorld,indexOrder=0,senseDarkVision,senseInvisible) {

	function make(x,y,entity,imgGet,light,doTint,doGrey,numSeed,indexOrder) {

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
				sprite.entity = entity;
				sprite.anchor.set(entity.xAnchor||0.5,entity.yAnchor||0.5);
				sprite.baseScale = (entity.scale || 1) * Tile.DIM/sprite.width;
				if( entity.isMonsterType && !entity.scale) {
					sprite.baseScale *= Math.rand(MONSTER_SCALE_VARIANCE_MIN,MONSTER_SCALE_VARIANCE_MAX);
				}
//				if( entity.isMushroom ) {
//					sprite.baseScale *= Math.rand(0.6,1.0);
//				}
			}
			let sprite = entity.spriteList[i];
			let onStage = !entity.invisible || senseInvisible;
			spriteOnStage(sprite,onStage);
			if( sprite.refs == 1 ) {	// I must be the only controller, so...
				let zOrder = entity.zOrder || (entity.isWall ? Tile.zOrder.WALL : (entity.isFloor ? Tile.zOrder.FLOOR : (entity.isTileType ? Tile.zOrder.TILE : (entity.isItemType ? (entity.isGate ? Tile.zOrder.GATE : (entity.isDecor ? Tile.zOrder.DECOR : Tile.zOrder.ITEM)) : (entity.isMonsterType ? Tile.zOrder.MONSTER : Tile.zOrder.OTHER)))));
				sprite.zOrder 	= zOrder;
				sprite.visible 	= true;
				sprite.x 		= x*Tile.DIM+(Tile.DIM/2);
				sprite.y 		= y*Tile.DIM+(Tile.DIM/2);
				sprite.transform.scale.set( sprite.baseScale );
				if( sprite.flip ) sprite.scale.x = -sprite.scale.x;
				sprite.alpha 	= (entity.alpha||1) * Light.Alpha[Math.floor(light)];
				//debug += '123456789ABCDEFGHIJKLMNOPQRS'.charAt(light);
			}
			if( doTint ) {
				if( !ViewMap.saveBattery ) {
					sprite.filters = this.desaturateFilterArray;
				}
				sprite.tint = 0xAAAAFF;
			}
			else
			if( doGrey ) {
				if( !ViewMap.saveBattery ) {
					sprite.filters = this.desaturateFilterArray;
				}
				sprite.tint = 0xFFFFFF;
			}
			else {
				if( !ViewMap.saveBattery ) {
					sprite.filters = this.resetFilterArray;
				}
				sprite.tint = 0xFFFFFF;
			}
			//sprite.sortKey = sprite.y*10000+sprite.indexOrder*100+sprite.zOrder;
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
	if( senseDarkVision ) {
		doGrey = true;
	}

	if( entity.isTileType && !entity.isPosition ) {
		entity.spriteList = self.observer.map.tileSprite[yWorld][xWorld][entity.typeId];
	}

	let imgGet = ImageRepo.imgGet[entity.typeId];
	let lightAfterGlow = entity.glow ? Math.max(light,glowLight) : light;
	make.call(
		self,
		x,
		y,
		entity,
		imgGet,
		lightAfterGlow,
		doTint,
		doGrey,
		self.randList[xWorld&0xFF]+7+self.randList[yWorld&0xFF],
		indexOrder
	);

	if( entity.isTileType && !entity.isPosition ) {
		self.observer.map.tileSprite[yWorld][xWorld][entity.typeId] = entity.spriteList;
	}
}



class ViewMap extends ViewObserver {
	constructor(divId) {
		super();
		this.divId = divId;
		this.pixiDestroy();
		this.randList = [];
		for( let i=0 ; i<256 ; ++i ) {
			this.randList.push( Math.randInt( 0, 1023 ) );
		}
		_viewMap = this;

		this.drawListCache = [];
	}

	pixiDestroy() {
		$(this.divId).empty();
		if( ViewMap.globalPixiApp ) {
			ViewMap.globalPixiApp.destroy(true,{children:true,texture:false,baseTexture:false});
		}
		this.app = null;
	}
	pixiCreate() {
		this.app = new PIXI.Application(10, 10, {backgroundColor : 0x000000});
		ViewMap.globalPixiApp = this.app;

		this.desaturateFilter = new PIXI.filters.ColorMatrixFilter();
		this.desaturateFilter.desaturate();
		this.desaturateFilterArray = [this.desaturateFilter];
		this.resetFilter = new PIXI.filters.ColorMatrixFilter();
		this.resetFilter.reset();
		this.resetFilterArray = [this.resetFilter];

		let pixiView = $(this.divId)[0].appendChild(this.app.view);
		this.hookEvents();


		// Don't start rendering until we first try to render.
		this.app.ticker.stop()
		this.pixiTimerPaused = true;

		this.app.ticker.add( delta =>  {
			// but only if real time is not stopped.
			if( this.observer && this.observer.area ) {
				this.observer.area.animationManager.tickRealtime(delta/60);
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
			let x = (observer.x-self.sd) + mx;
			let y = (observer.y-self.sd) + my;
			//console.log( "ViewMap mousemove detected ("+x+','+y+')' );
			
			guiMessage( 'viewRangeMouse', { xOfs: x-observer.x, yOfs: y-observer.y } );
		});
		$(myCanvas).mouseout( function(e) {
			guiMessage('hideInfo');
			//console.log('mouse out of canvas');
		});
		$(myCanvas).click( function(e) {
			var e = $.Event("keydown");
			e.key = 'Enter';
			Gui.keyHandler.trigger(e);
//			$(document).trigger(e);
		});
	}

	resizeAllSprites() {

		let area = this.observer.area;
		area.entityList.forEach( entity => {
			spriteDeathCallback(entity.spriteList);
			entity.inventory.forEach( item => {
				spriteDeathCallback(item.spriteList);
			});
		});
		area.map.itemList.forEach( item => {
			spriteDeathCallback(item.spriteList);
			(item.inventory||[]).forEach( item => {
				spriteDeathCallback(item.spriteList);
			});
		});
		area.map.traverse( (x,y) => {
//			let tile = area.map.tileTypeGetFastUnasfe(x,y);
//			spriteDeathCallback(tile.spriteList);
			if( area.map.tileEntity[y] && area.map.tileEntity[y][x] ) {
				spriteDeathCallback(area.map.tileEntity[y][x].spriteList);
			}
			if( area.map.tileSprite[y] && area.map.tileSprite[y][x] ) {
				for( let typeId in area.map.tileSprite[y][x] ) {
					spriteDeathCallback(area.map.tileSprite[y][x][typeId]);
				}
			}
		});
		Object.each( SymbolToType, type => spriteDeathCallback(type.spriteList) );

		let temp = this.app.stage.children.slice();
		temp.forEach( child => {
			this.app.stage.removeChild(child);
			child.onStage = false;
		});

		// Clears the stage, for certain.
	}

//		for( let child of this.app.stage.children ) {
//			child.x = ((child.x-(oldDim/2)) / oldDim) * Tile.DIM + Tile.DIM/2;
//			child.y = ((child.y-(oldDim/2)) / oldDim) * Tile.DIM + Tile.DIM/2;
//			child.baseScale = (child.entity||{}).scale || Tile.DIM/child.width;
//			child.transform.scale.set( child.baseScale );
//		}
//	}
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
		console.log('overlay add '+groupId);
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

		this.sd = MaxVis;
		this.d = ((this.sd*2)+1);

		console.assert( !isNaN(this.d) );
		let tileWidth  = Tile.DIM * this.d;
		let tileHeight = Tile.DIM * this.d;

		this.app.renderer.view.style.width = tileWidth + "px";
		this.app.renderer.view.style.height = tileHeight + "px";
		this.app.renderer.resize(tileWidth,tileHeight);

		this.resizeAllSprites();
		if( this.observer ) {
			this.observer.area.castLight();
		}
		this.render();
	}

	message(msg,payload) {
		super.message(msg,payload);
		if( msg=='saveBattery' ) {
			ViewMap.saveBattery = payload;
		}
		if( msg=='zoomInc' ) {
			this.setZoom(this.zoom+1);
			this.render();
		}
		if( msg=='zoomPush' ) {
			this.zoomStack = (this.zoomStack || []);
			this.zoomStack.push(this.zoom);
			this.setZoom(payload.zoom);
			this.render();
		}
		if( msg=='zoomPop' ) {
			this.setZoom(this.zoomStack.pop());
			this.render();
		}
		if( msg == 'resize' ) {
			this.setMapVis(this.observer.visibilityDistance);
		}
		if( msg == 'setArea' ) {
			if( this.observer ) {
				this.setMapVis(this.observer.visibilityDistance);
				this.render();
			}
		}
		if( msg == 'removeFromStage' ) {
			spriteDeathCallback(payload.spriteList);
		}
		if( msg == 'overlayRemove' ) {
			this.worldOverlayRemove( a => a.groupId==payload.groupId,'message '+payload.groupId,payload );
		}
		if( msg == 'overlayAdd' ) {
			this.worldOverlayAdd(payload.groupId,payload.x,payload.y,payload.area,payload.img);	
		}
		if( msg == 'showInfo' ) {
			if( !payload.isItemType || (payload.owner && payload.owner.isMap) ) {
				this.worldOverlayRemove( a => a.groupId=='guiSelect', 'removing guiSelect' );
				this.worldOverlayAdd('guiSelect', payload.x, payload.y, payload.area, StickerList.selectBox.img);	
			}
			this.render();
		}
		if( msg == 'hideInfo' ) {
			this.worldOverlayRemove( a => a.groupId=='guiSelect',' from hideInfo' );
			//console.log('ViewMap hide');
			this.render();
		}
		// It just so happens that SOME perks grants benefits that require re-render.
		// But the map view might not even be set up yet! So check for an observer.
		if( msg == 'render' && this.observer ) {
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

		if( observer.godSight ) {
			for( let child of this.app.stage.children ) {
				child.visible = true;
			}
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
						let imgGet = ImageRepo.imgGet[entity.typeId];
						if( imgGet ) {
							spriteMakeInWorld(
								entity,
								wx+x,
								wy+y,
								i,
								this.observer.senseDarkVision,
								this.observer.senseInvisible
							);
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

//		this.app.stage.children.forEach( sprite => sprite.sortKey = (sprite.y-sprite.anchor.y*sprite.height)*100+sprite.zOrder );
		this.app.stage.children.forEach( sprite => sprite.sortKey = sprite.zOrder );
		this.app.stage.children.sort( (a,b) => a.sortKey-b.sortKey );
	}

	render() {
		//var focused =  $( document.activeElement ) ;
		//if( !focused || focused.length == 0 ) {
		//	console.log('re-focused from ',focused);
		//	$(this.divId+' canvas').focus();
		//}
		if( !this.app ) {
			this.pixiCreate();
		}

		let actualRender = () => {

			let observer = this.observer;
			let drawList = createDrawList(observer,this.drawListCache);
			if( observer.zoom && observer.zoom != this.zoom ) {
				this.setZoom(observer.zoom);
			}

			this.draw(drawList);
			if( this.pixiTimerPaused ) {
				this.app.ticker.start()
				this.pixiTimerPaused = false;
			}
		}

		if( this.justWait ) {
			return;
		}
		this.justWait = setTimeout(()=> {
			actualRender();
			this.justWait = null;
		},1);
	}
}

return {
	ViewMap: ViewMap,
	spriteCreate: spriteCreate,
	spriteAttach: spriteAttach,
	spriteDetach: spriteDetach,
	spriteOnStage: spriteOnStage,
	spriteMakeInWorld: spriteMakeInWorld,
	spriteDeathCallback: spriteDeathCallback,
	imageDirty: imageDirty
}

});

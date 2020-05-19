Module.add('viewMinimap',function() {

class ViewMiniMap extends ViewObserver {
	constructor(divId,captionDivId) {
		super();
		this.divId = divId;
		this.captionDivId = captionDivId;
		this.caption = '';
		this.drawn = [];
		this.created = false;
		this.refreshTimer = new Time.TimerSimple( 0.2, ()=>this.dirty=true );
	}
	create(area) {
		$( this.divId+'Canvas0' ).remove();
		$( this.divId+'Canvas1' ).remove();
		this.cleared = false;
		this.drawn = [];
		this.xLen = area.map.xLen;
		this.yLen = area.map.yLen;
		let canvasDim = 240;
		this.yLenCanvas = canvasDim;
		this.xLenCanvas = canvasDim;
		let dim = Math.max(this.xLen,this.yLen);
		this.scale = Math.max(1,canvasDim/dim);
//		this.xLenCanvas = this.scale*dim;
//		this.yLenCanvas = this.scale*dim;
		$( this.divId)
			.width(this.xLenCanvas)
			.height(this.yLenCanvas)
			.append('<canvas id="'+this.divId.replace('#','')+'Canvas0'+'" height="'+this.yLenCanvas+'" width="'+this.xLenCanvas+'"></canvas>')
			.append('<canvas id="'+this.divId.replace('#','')+'Canvas1'+'" height="'+this.yLenCanvas+'" width="'+this.xLenCanvas+'"></canvas>')
			.show();
		this.created = true;
	}
	changeArea(area) {
		this.caption = String.capitalize(area.name)+' (Depth '+area.depth+')';
		this.create(area);
	}
	lPos(x,y) {
		return Math.toTile(y)*this.xLen+Math.toTile(x);
	}
	message(msg,payload) {
		super.message(msg,payload);
		if( msg == 'changeArea' ) {
			this.changeArea(payload.area);
		}
		if( msg == 'revealInvisible' ) {
			let target = payload;
			this.drawn[this.lPos(target.x,target.y)] = null;
			if( target.isWall ) {
				// Sadly this gets special-cased because of the way I use mmWall...
				var canvas0 = $(this.divId+'Canvas0')[0];
				let c0 = canvas0.getContext("2d");
				this.draw(c0,StickerList.mmWall,target.x,target.y,this.scale);
			}
		}
		if( msg == 'revealMinimap' ) {
			let map = this.observer.map;
			map.traverse( (x,y) => {
				let mapMemory = this.observer.mapMemory;
				if( mapMemory ) {
					let type = map.findItemAt(x,y).filter( item=>!item.isTreasure ).first || map.tileTypeGet(x,y);
					let mPos = y*map.xLen+x;
					mapMemory[mPos] = type;
				}
			});
		}
		if( msg == 'resetMinimap' ) {
			this.drawn = [];
		}
	}
	draw( c, entity, x, y, scale, ctr ) {
		console.assert(entity);
		let resource = ImageRepo.getResource(entity);
		if( resource ) {
			let image = resource.texture.baseTexture.source;
			if( ctr ) {
				x -= (scale/this.scale)/2;
				y -= (scale/this.scale)/2;
			}
			c.drawImage( image, x*this.scale, y*this.scale, scale,scale );
		}
		else {
			console.log( "Unable to find image for "+entity.typeId+" img "+imgPath );
			return false;
		}
	}

	tick(dt) {
		this.refreshTimer.tick(dt);
	}

	render() {

		if( !this.created ) {
			return;
		}

		let large = function(mult) {
			return Math.clamp(this.scale,2,5)*mult;
		}.bind(this);

		let observer = this.observer;
		let site = observer.area.getSiteAt(observer.x,observer.y);
		$(this.captionDivId).show().html(
			this.caption  + (site ? '<br>'+site.id+'<br>'+site.denizenList.map( entity=>entity.name ).join(',') : '')
		);

		var canvas0 = $(this.divId+'Canvas0')[0];
		var canvas1 = $(this.divId+'Canvas1')[0];
		if( !canvas0.getContext || !canvas1.getContext ) {
			debugger;
		}

		let self = this;

		let unvisitedMap = StickerList.unvisitedMap;
		let c0 = canvas0.getContext("2d");
		let c1 = canvas1.getContext("2d");
		if( !this.cleared ) {
			this.draw(c0,unvisitedMap,0,0,2000);
			this.cleared = true;
		}
		c1.clearRect(0,0,this.xLenCanvas,this.yLenCanvas);

		let drawLate = [];

		observer.entityList.forEach( entity => {
			if( entity.brainMaster && entity.brainMaster.id==observer.id ) {
				drawLate.push({
					entity:StickerList.mmFriend, x:entity.x, y:entity.y, scale:large(2), ctr:true
				});
				return;
			}
			if( observer.senseLiving && entity.isLiving ) {
				let sticker = observer.isMyEnemy(entity) ? StickerList.mmEnemy : StickerList.mmFriend;
				drawLate.push({
					entity:sticker, x:entity.x, y:entity.y, scale:large(1.5)
				});
				return;
			}
		});

		let mapMemory = observer.mapMemory;
		let defaultFloor = SymbolToType[observer.map.defaultFloorSymbol];
		console.assert( observer.map.defaultFloorSymbol );
		console.assert( defaultFloor );
		for( let y=0 ; y<this.yLen ; ++y ) {
			for( let x=0 ; x<this.xLen ; ++x ) {
				let mPos = y*this.xLen+x;
				if( Distance.isAt(observer.x,observer.y,x,y) ) {
					drawLate.push({
						entity:StickerList.mmObserver, x:x, y:y, scale:large(4), ctr:true
					});
					continue;
				}
				let entity = mapMemory[mPos];
				if( entity ) {
					if( entity.gateDir !== undefined && (!entity.invisible || observer.senseInvisible) ) {
						let stickerId = 'mmGate';
						if( entity.gateDir>0 ) stickerId = 'mmGateDown';
						if( ThemeList[entity.toThemeId].isTown ) stickerId = 'mmGateTown';
						drawLate.push({
							entity:StickerList[stickerId], x:x, y:y, scale:large(3), ctr:true
						});
						continue;
					}
				}

				if( this.drawn[this.lPos(x,y)] === entity ) {
					continue;
				}
				this.drawn[this.lPos(x,y)] = entity;
				if( !entity ) {
					draw(c0,unvisitedMap,x,y,this.scale);
					continue;
				}
				if( entity.isWall && !entity.mineId ) {
					let show = !entity.invisible || observer.senseInvisible;
					entity = show ? StickerList.mmWall : defaultFloor;
				}
				this.draw(c0,entity,x,y,this.scale);
			}
		}
		while( drawLate.length ) {
			let d = drawLate.pop();
			this.draw(c1,d.entity,d.x,d.y,d.scale,d.ctr);
		}
	}
}

return {
	ViewMiniMap: ViewMiniMap
}

});

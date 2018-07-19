Module.add('viewMinimap',function() {

class ViewMiniMap extends ViewObserver {
	constructor(divId,captionDivId,imageRepo) {
		super();
		this.divId = divId;
		this.captionDivId = captionDivId;
		this.caption = '';
		this.imageRepo = imageRepo;
		this.drawn = [];
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
	}
	setArea(area) {
		this.caption = String.capitalize(area.name)+' (Depth '+area.depth+')';
		this.create(area);
	}
	message(msg,payload) {
		super.message(msg,payload);
		if( msg == 'setArea' ) {
			this.setArea(payload);
		}
		if( msg == 'resetMiniMap' ) {
			this.setArea(payload);
		}
		if( msg == 'reveal' ) {
			let target = payload;
			this.drawn[target.y*this.xLen+target.x] = null;
			if( target.isWall ) {
				// Sadly this gets special-cased because of the way I use Wall Proxy...
				var canvas0 = $(this.divId+'Canvas0')[0];
				let c0 = canvas0.getContext("2d");
				this.draw(c0,StickerList.wallProxy,target.x,target.y,this.scale);
			}
		}
	}
	draw( c, entity, x, y, scale, ctr ) {
		let imgGet = this.imageRepo.imgGet[entity.typeId];
		if( !imgGet ) debugger;
		if( imgGet ) {
			let imgPath = imgGet(entity);
			if( !entity ) debugger;
			let resource = this.imageRepo.get(imgPath);
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
	}

	render() {
		let observer = this.observer;
		let site = observer.area.getSiteAt(observer.x,observer.y);
		$(this.captionDivId).show().html(
			this.caption // + (site ? '<br>'+site.id+'<br>'+site.denizenList.map( entity=>entity.name ).join(',') : '')
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
				drawLate.push({entity:StickerList.friendProxy,x:entity.x,y:entity.y,scale:this.scale*2,ctr:true});
				return;
			}
			if( observer.senseLiving && entity.isLiving ) {
				let sticker = observer.isMyEnemy(entity) ? StickerList.enemyProxy : StickerList.friendProxy;
				drawLate.push({entity:sticker,x:entity.x,y:entity.y,scale:this.scale});
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
				if( x==observer.x && y==observer.y ) {
					drawLate.push({entity:StickerList.observerProxy,x:x,y:y,scale:this.scale*4,ctr:true});
					continue;
				}
				let entity = mapMemory[mPos];
				if( entity ) {
					if( entity.gateDir !== undefined && (!entity.invisible || observer.senseInvisible) ) {
						let gate = StickerList[entity.gateDir>0 ? 'gateDownProxy' : 'gateProxy'];
						drawLate.push({entity:gate,x:x,y:y,scale:this.scale*3,ctr:true});
						continue;
					}
				}

				if( this.drawn[y*this.xLen+x] === entity ) {
					continue;
				}
				this.drawn[y*this.xLen+x] = entity;
				if( !entity ) {
					draw(c0,unvisitedMap,x,y,this.scale);
					continue;
				}
				if( entity.isWall && !entity.mineId ) {
					let show = !entity.invisible || observer.senseInvisible;
					entity = show ? StickerList.wallProxy : defaultFloor;
				}
				this.draw(c0,entity,x,y,this.scale);
			}
		}
		while( drawLate.length ) {
			let d = drawLate.pop();
			this.draw(c1,d.entity,d.x,d.y,Math.min(d.scale,20),d.ctr);
		}
	}
}

return {
	ViewMiniMap: ViewMiniMap
}

});

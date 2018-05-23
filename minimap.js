class ViewMiniMap {
	constructor(divId,imageRepo) {
		this.divId = divId;
		this.areaId = '';
		this.map = null;
		this.imageRepo = imageRepo;
	}
	create() {
		$( '#'+this.divId+'Canvas' ).remove();
		this.map = world.mapMemory;
		this.xLen = world.area.map.xLen;
		this.yLen = world.area.map.yLen;
		this.scale = Math.max(this.yLen,this.xLen) < 2000 ? 2 : 1;
		$( '#'+this.divId)
			.width(this.xLen*this.scale)
			.height(this.yLen*this.scale)
			.append('<canvas id="'+this.divId+'Canvas'+'" height="'+this.yLen*this.scale+'" width="'+this.xLen*this.scale+'"></canvas>');
		this.areaId = world.area.id;
	}
	render(observer) { 
		if( this.areaId !== world.area.id ) {
			this.create();
		}

		var canvas = document.getElementById(this.divId+'Canvas');
		if( !canvas.getContext ) {
			debugger;
		}

		let self = this;
		function draw(entity,x,y,scale) {
			let imgGet = self.imageRepo.imgGet[entity.typeId];
			if( !imgGet ) debugger;
			if( imgGet ) {
				let imgPath = imgGet(entity);
				if( !entity ) debugger;
				let resource = self.imageRepo.get(imgPath);
				c.drawImage(resource.texture.baseTexture.source,x*self.scale,y*self.scale,scale,scale);
			}
		}

		let c = canvas.getContext("2d");
		let mapMemory = world.area.mapMemory;
		let drawLate = [];
		for( let y=0 ; y<this.yLen ; ++y ) {
			for( let x=0 ; x<this.xLen ; ++x ) {
				if( !mapMemory[y] || !mapMemory[y][x] ) continue;
				let entity = mapMemory[y][x];
				if( entity.isWall ) {
					entity = StickerList.wallProxy;
				}
				if( x==observer.x && y==observer.y ) {
					entity = StickerList.observerProxy;
					drawLate.push({entity:entity,x:x,y:y,scale:this.scale*4});
				}
				if( entity.gateDir !== undefined ) {
					entity = StickerList.gateProxy;
					drawLate.push({entity:entity,x:x,y:y,scale:this.scale*3});
				}
				draw(entity,x,y,this.scale);
			}
		}
		while( drawLate.length ) {
			let d = drawLate.pop();
			draw(d.entity,d.x,d.y,d.scale);
		}
	}
}

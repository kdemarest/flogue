class MiniMap {
	constructor(divId,imageRepo) {
		this.divId = divId;
		this.areaId = '';
		this.map = null;
		this.imageRepo = imageRepo;
	}
	create() {
		$( this.divId ).remove();
		this.map = world.mapMemory;
		this.xLen = world.area.map.xLen;
		this.yLen = world.area.map.yLen;
		this.scale = Math.max(this.yLen,this.xLen) < 2000 ? 2 : 1;
		$( '#miniMap')
			.width(this.xLen*this.scale)
			.height(this.yLen*this.scale)
			.append('<canvas id="miniMapCanvas" height="'+this.yLen*this.scale+'" width="'+this.xLen*this.scale+'"></canvas>');
		this.areaId = world.area.id;
	}
	draw(observer) { 
		if( this.areaId !== world.area.id ) {
			this.create();
		}

		var canvas = document.getElementById("miniMapCanvas"); 
		if( !canvas.getContext ) {
			debugger;
		}

		var c = canvas.getContext("2d");
		let mapMemory = world.area.mapMemory;
		for( let y=0 ; y<this.yLen ; ++y ) {
			for( let x=0 ; x<this.xLen ; ++x ) {
				if( !mapMemory[y] || !mapMemory[y][x] ) continue;
				let entity = mapMemory[y][x];
				if( entity.isWall ) {
					entity = StickerList.wallProxy;
				}
				if( x==observer.x && y==observer.y ) {
					entity = StickerList.observerProxy;
				}
				if( entity.gateDir !== undefined ) {
					entity = StickerList.gateProxy;
				}
				let imgGet = this.imageRepo.imgGet[entity.typeId];
				if( imgGet ) {
					let imgPath = imgGet(entity);
					let resource = this.imageRepo.get(imgPath);
					c.drawImage(resource.texture.baseTexture.source,x*this.scale,y*this.scale,this.scale,this.scale);
				}
			}
		}
	}
}

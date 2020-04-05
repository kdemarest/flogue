Module.add('imageRepo',function() {

function DefaultImgGet(self) {
	return self.img;
}

class PixiImageRepo {
	constructor(loader) {
		this.imgGet = [];
		this.ready = false;
		this.loader = loader;
	}
	load() {
		if( this.ready ) {
			return true;
		}
		let imageList = [];
		let exists = {};

		function add(imgPath) {
			if( imgPath === undefined ) {
				debugger;
			}
			if( !imgPath ) {
				return;
			}
			//console.log(imgPath);
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
			for( let typeId in typeList ) {
				let type = typeList[typeId];
				scan( typeId, type, member );
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
				add( type.icon );
			}
		}

		let self = this;
		scanTypeList(StickerList,'img');
		Object.each( ItemTypeList, itemType => {
			if( !itemType.noScan ) {
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
	imgPath(entity) {
		let imgGet = this.imgGet[entity.typeId];
		let imgPath = IMG_BASE+imgGet(entity);
		return imgPath;
	}
}

return {
	PixiImageRepo: PixiImageRepo
}

});

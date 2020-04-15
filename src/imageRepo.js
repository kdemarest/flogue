Module.add('imageRepo',function() {

function DefaultImgChooseFn(self) {
	return self.img;
}

class PixiImageRepo {
	constructor(loader) {
		this.imgChooseFnList = [];
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
					self.imgChooseFnList[typeId] = type.imgChooseFn || DefaultImgChooseFn;
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
			console.assert( this.imgChooseFnList[type.typeId] === undefined );
			this.imgChooseFnList[type.typeId] = type.imgChooseFn || DefaultImgChooseFn;
			if( type.imgChooseFn && !type.imgChoices ) {
				// if you make a chooseFn then you MUST enumerate all possible imgChoices so that
				// we can scan through and pre-load them.
				debugger;
			}
			if( type.imgChoices ) {
				let imgChooseFn = this.imgChooseFnList[type.typeId];
				for( let key in type.imgChoices ) {
					add( type.imgChoices[key].img || type.imgDefault );
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

	getImg(entity) {
		let imgChooseFn = this.imgChooseFnList[entity.typeId] || DefaultImgChooseFn;
		return imgChooseFn(entity);
	}

	getResourceByImg(imgWithoutBase) {
		let resource = this.loader.resources[IMG_BASE+imgWithoutBase];
		if( !resource ) debugger;
		return resource;
	}

	getResource(entity) {
		return this.getResourceByImg( this.getImg(entity) );
	}

	getImgFullPath(entity) {
		return IMG_BASE+this.getImg(entity);
	}
}

return {
	PixiImageRepo: PixiImageRepo
}

});

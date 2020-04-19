Module.add('imageRepo',function() {

let HourglassURI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAM0lEQVQ4T2NkoBAwUqifYdQABhqHQVHGz/+gWOqbwY4zsPHGAsUGEJNGRtMBrdMBMbEAAGSoCBGxzugoAAAAAElFTkSuQmCC";

let imgSTANDBY		= 1;
let imgREQUESTED	= 2;
let imgPENDING		= 3;
let imgLOADED		= 4;
let imgSPREAD		= 5;

function DefaultImgChooseFn(self) {
	return self.img;
}

class PixiImageRepo {
	constructor(loader) {
		this.imgPathList		= {};
		this.imgChooseFnList	= {};
		this.loader  			= loader;
		this.loading 			= false;
		this.placeholderResource = {
			isPlaceholder: true,
			texture: PIXI.Texture.fromImage(HourglassURI)
		};
	}
	scanTypes() {

		let addImg = (img) => {
			if( img === undefined ) {
				debugger;
			}
			if( !img ) {
				return;
			}
			//console.log(imgPath);
			let imgPath = IMG_BASE+img;
			this.imgPathList[imgPath] = this.imgPathList[imgPath] || imgSTANDBY;
		}

		function scan(typeId,type,member) {
			if( type[member] ) {
				if( typeId ) {
					self.imgChooseFnList[typeId] = type.imgChooseFn || DefaultImgChooseFn;
				}
				addImg(type[member]);
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
				for( let key in type.imgChoices ) {
					addImg( type.imgChoices[key].img || type.imgDefault );
				}
			}
			else {
				addImg(type.img);
			}
			if( type.icon ) {
				addImg( type.icon );
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

		console.log('Found',Object.count(this.imgPathList));
	}

	request(imgPath) {
		console.assert( this.imgPathList[imgPath] === imgSTANDBY );
		this.imgPathList[imgPath] = imgREQUESTED;
	}

	tick() {
		if( this.loading ) {
			return;
		}

		let addList = [];
		Object.each( this.imgPathList, (state,imgPath) => {
			if( state == imgREQUESTED ) {
				addList.push(imgPath);
				this.imgPathList[imgPath] = imgPENDING;
			}
		});

		if( addList.length ) {
			this.loading = true;
			this.loader.add(addList).load( ()=>this.onLoadComplete() );
		}
	}

	onLoadComplete() {
		Object.each( this.imgPathList, (state,imgPath) => {
			if( state == imgPENDING ) {
				this.imgPathList[imgPath] = imgLOADED;
				let img = imgPath.substring( IMG_BASE.length )
				guiMessage( 'imgLoaded', img );
				this.imgPathList[imgPath] = imgSPREAD;
			}
		});
		this.loading = false;
	}

	getImg(entity) {
		let imgChooseFn = this.imgChooseFnList[entity.typeId] || DefaultImgChooseFn;
		entity.img = imgChooseFn(entity);
		return entity.img;
	}

	getResourceByImg(imgWithoutBase) {
		let imgPath = IMG_BASE+imgWithoutBase;
		let state = this.imgPathList[imgPath];
		if( state === undefined ) {
			// Not a detected img!
			debugger;
		}
		if( state == imgLOADED || state == imgSPREAD ) {
			return this.loader.resources[imgPath];
		}
		if( state == imgSTANDBY ) {
			this.request(imgPath);
		}
		return this.placeholderResource;
	}

	getResource(entity) {
		return this.getResourceByImg( this.getImg(entity) );
	}

	getImgFullPath(entity) {
		return IMG_BASE+this.getImg(entity);
	}

	createSprite(img) {
		let resource = this.getResourceByImg(img);
		let pixiSprite = new PIXI.Sprite(resource.texture);
		if( resource.isPlaceholder ) {
			pixiSprite.awaitingImg = img;
		}
		return pixiSprite;
	}
}

return {
	PixiImageRepo: PixiImageRepo
}

});

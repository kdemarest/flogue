Module.add('imageRepo',function() {

let HourglassURI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAM0lEQVQ4T2NkoBAwUqifYdQABhqHQVHGz/+gWOqbwY4zsPHGAsUGEJNGRtMBrdMBMbEAAGSoCBGxzugoAAAAAElFTkSuQmCC";

let imgSTANDBY		= 1;
let imgREQUESTED	= 2;
let imgPENDING		= 3;
let imgPROCESSING	= 4;
let imgREADY		= 5;

function DefaultImgChooseFn(self) {
	return self.img;
}

function imageLoad(imgUrl,onLoadFn) {
	let img = new Image();
	img.onload = ()=>onLoadFn(img);
	img.src = imgUrl;
	return img;
}


class PixiImageRepo {
	constructor(onLoadFn) {
		this.imgList			= {};
		this.imgStateList		= {};
		this.onLoadFn			= onLoadFn;
		this.placeholderResource = {
			isPlaceholder: true,
			texture: PIXI.Texture.fromImage(HourglassURI)
		};
		this.placeholderResource.isPlaceholder = true;
	}
	scanTypes() {

		let addImgPath = (img) => {
			if( img === undefined ) {
				debugger;
			}
			if( !img ) {
				return;
			}

			//console.log(imgPath);
			let imgStem = (typeof img === 'string' ? img : img.src );
			if( imgStem.substring(0,1) == '/' ) {
				imgStem = imgStem.substr(1);
			}
			this.imgList[imgStem] = img;
			let imgPath = IMG_BASE + imgStem;
			this.imgStateList[imgPath] = this.imgStateList[imgPath] || imgSTANDBY;
		}

		function scanForIcons(type) {
			if( type.icon ) 				{ addImgPath( type.icon ); }
			if( type.effect ) {
				if( type.effect.icon )		{ addImgPath( type.effect.icon ); }
				if( type.effect.iconCloud )	{ addImgPath( type.effect.iconCloud ); }
				if( type.effect.iconOver )	{ addImgPath( type.effect.iconOver ); }
			}
		}

		// Pick up all icons
		Type.traverse( (type,typeId,policy) => {
			scanForIcons(type);
			['qualities','materials','varieties','effects'].forEach( member => {
				if( type[member] ) {
					Object.each( type[member], ref => {
						scanForIcons( ref );
					});
				}
			});
		});

		// Find all the img URLs
		Type.traverse( (type,typeId,policy) => {
			['qualities','materials','varieties','effects'].forEach( member => {
				if( type[member] ) {
					Object.each( type[member], ref => {
						if( ref.img ) {
							addImgPath( ref.img );
						}
					});
				}
			});
			if( type.imgChoices ) {
				for( let key in type.imgChoices ) {
					if( type.imgChoices[key].img ) {
						addImgPath( type.imgChoices[key].img || type.imgDefault );
					}
				}
			}
			if( type.img ) {
				addImgPath(type.img);
			}
		});

		console.log('Found',Object.count(this.imgStateList));
	}

	request(imgPath) {
		console.assert( this.imgStateList[imgPath] === imgSTANDBY );
		this.imgStateList[imgPath] = imgREQUESTED;
	}

	getStateList(stateList) {
		Object.each( this.imgStateList, (state,imgPath) => {
			if( state == imgREQUESTED ) {
				stateList.requested.push(imgPath);
			}
			if( state == imgPENDING ) {
				stateList.pending.push(imgPath);
			}
			if( state == imgREADY ) {
				stateList.ready.push(imgPath);
			}
		});
		return stateList;
	}

	requestAll() {
		Object.each( this.imgStateList, (state,imgPath) => {
			this.request( imgPath );
		});
	}

	tick() {
		Object.each( this.imgStateList, (state,imgPath) => {
			if( state == imgREQUESTED ) {
				this.imgStateList[imgPath] = imgPENDING;
				let imgStem = imgPath.substring( IMG_BASE.length )
				Jimp.read( imgPath ).then( buffer => {
					this.imgStateList[imgPath] = imgPROCESSING;
					this.onLoadFn( imgStem, buffer, this.imgList[imgStem] );
				});
			}
		});
	}
}

PixiImageRepo.isValidImg = (img) => {
	return typeof img === 'string' || typeof img.src === 'string';
}

class ImageMaker {
	constructor(imageRepo) {
		this.resources = {};
		this.repo = new PixiImageRepo( this.postProcess.bind(this) );
		this.imgChooseFnList	= {};
		this.resetMinimapHandle = null;
	}

	async postProcess( imgStem, jimpImage, img ) {

		if( typeof img !== 'string' ) {
			debugger;
			if( img.resize === undefined ) {
				img.resize = false;
			}
			if( img.size === undefined ) {
				img.size = false;
			}
			if( img.autocrop === undefined ) {
				img.autocrop = false;
			}
			await filterImageInPlace(jimp,jimpImage,img);
		}

		let nativeImageData = await jimpImage.getBase64Async( Jimp.AUTO );

		let imgPath = IMG_BASE+imgStem;
		let nativeImage = new Image(jimpImage.bitmap.width, jimpImage.bitmap.height);
		nativeImage.onload = async () => {
			this.resources[imgStem] = {
				texture: PIXI.Texture.from( nativeImage )
			};

			console.log('img ready',imgStem);

			this.repo.imgStateList[imgPath] = imgREADY;
			guiMessage( 'imgReady', imgStem );

			clearTimeout( this.resetMinimapHandle );
			this.resetMinimapHandle = setTimeout( ()=>guiMessage('resetMinimap'), 1000 );
		}
		nativeImage.src = nativeImageData;
	}


	scanTypes() {
		this.repo.scanTypes();
		Type.traverse( (type,typeId,policy) => {
			if( !type.img && !type.imgChoices ) {
				return;
			}
			console.assert( this.imgChooseFnList[typeId] === undefined );
			this.imgChooseFnList[typeId] = type.imgChooseFn || DefaultImgChooseFn;
			if( type.imgChooseFn && !type.imgChoices ) {
				// if you make a chooseFn then you MUST enumerate all possible imgChoices so that
				// we can scan through and pre-load them.
				debugger;
			}
		});
	}

	getImg(entity) {
		let imgChooseFn = this.imgChooseFnList[entity.typeId] || DefaultImgChooseFn;
		entity.img = imgChooseFn(entity);
		return entity.img;
	}

	getResourceByImg(img) {
		let isString = typeof img === 'string';
		let imgStem = isString ? img : img.src;
		let imgPath = IMG_BASE+imgStem;
		let state = this.repo.imgStateList[imgPath];
		if( state === undefined ) {
			// Not a detected img!
			debugger;
		}
		if( state == imgREADY ) {
			return this.resources[imgStem];
		}
		if( state == imgSTANDBY ) {
			this.repo.request(imgPath);
		}
		return this.repo.placeholderResource;
	}
	getResource(entity) {
		return this.getResourceByImg( this.getImg(entity) );
	}

	getImgFullPath(entity) {
		let imgStem = this.getImg(entity);
		return IMG_BASE + (typeof imgStem === 'string' ? imgStem : imgStem.src);
	}

	createSprite(img) {
		let resource = this.getResourceByImg(img);
		let pixiSprite = new PIXI.Sprite(resource.texture);
		if( resource.isPlaceholder ) {
			pixiSprite.awaitingImg = img;
		}
		return pixiSprite;
	}

	tick() {
		this.repo.tick();
	}
}

return {
	PixiImageRepo: PixiImageRepo,
	ImageMaker: ImageMaker
}

});

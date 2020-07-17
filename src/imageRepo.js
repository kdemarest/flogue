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
		// These are the three functions we call from the loader, so it must conform
		// in its interface to meet this usage.
		console.assert( loader.add );
		console.assert( loader.load );
		console.assert( loader.resources );

		this.imgStateList		= {};
		this.loader  			= loader;
		this.loading 			= false;
		this.placeholderResource = {
			isPlaceholder: true,
			texture: PIXI.Texture.fromImage(HourglassURI)
		};
		this.placeholderResource.isPlaceholder = true;
	}
	scanTypes() {

		let addImgPath = (imgStem) => {
			if( imgStem === undefined ) {
				debugger;
			}
			if( !imgStem ) {
				return;
			}

			//console.log(imgPath);
			let imgPath = IMG_BASE + (typeof imgStem === 'string' ? imgStem : imgStem.src );
			this.imgStateList[imgPath] = this.imgStateList[imgPath] || imgSTANDBY;
		}

		function normalize(obj,key) {
			return;


			console.assert( obj && key );
			if( typeof obj[key] === 'string' ) {
				obj[key] = {
					src: obj[key]
				}
			}
		}

		function scanForIcons(type) {
			if( type.icon ) 				{ addImgPath( type.icon ); }
			if( type.effect ) {
				if( type.effect.icon )		{ addImgPath( type.effect.icon ); }
				if( type.effect.iconCloud )	{ addImgPath( type.effect.iconCloud ); }
				if( type.effect.iconOver )	{ addImgPath( type.effect.iconOver ); }
			}
		}

		// Normalize all uses of .img so that they point to URLs uniformly
		Type.traverse( (type,typeId,policy) => {
			normalize( type, 'img' );
			['imgChoices','qualities','materials','varieties','effects'].forEach( member => {
				if( type[member] ) {
					Object.each( type[member], (X,key) => normalize( type[member][key], 'img' ) );
				}
			});
			normalize( type, 'icon' );
			if( type.effect ) {
				normalize( type.effect, 'icon' );
				normalize( type.effect, 'iconCloud' );
				normalize( type.effect, 'iconOver' );
			}
		});

		// Pick up all icons
		Type.traverse( (type,typeId,policy) => {
			scanForIcons(type);
			['qualities','materials','varieties','effects'].forEach( member => {
				if( type[member] ) {
					scanForIcons( type[member] );
				}
			});
		});

		// Find all the img URLs
		Type.traverse( (type,typeId,policy) => {
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
			if( state == imgLOADED || state == imgSPREAD ) {
				stateList.loaded.push(imgPath);
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
		if( this.loading ) {
			return;
		}

		let addList = [];
		Object.each( this.imgStateList, (state,imgPath) => {
			if( state == imgREQUESTED ) {
				addList.push(imgPath);
				this.imgStateList[imgPath] = imgPENDING;
			}
		});

		if( addList.length ) {
			console.logImgLoader('Loading '+addList.length);
			this.loading = true;
			this.loader.add(addList).load( ()=>this.onLoadComplete() );
		}
	}

	onLoadComplete() {
		Object.each( this.imgStateList, (state,imgPath) => {
			if( state == imgPENDING ) {
				this.imgStateList[imgPath] = imgLOADED;
				let img = imgPath.substring( IMG_BASE.length )
				console.logImgLoader('Loader propagating',img);
				guiMessage( 'imgLoaded', img );
				this.imgStateList[imgPath] = imgSPREAD;
			}
		});
		guiMessage('resetMinimap');
		this.loading = false;
		console.logImgLoader('Loading complete');
	}

}

PixiImageRepo.isValidImg = (img) => {
	return typeof img === 'string' || typeof img.src === 'string';
}

class ImageMaker {
	constructor(imageRepo) {
		this.repo = imageRepo;
		this.imgChooseFnList	= {};
	}

	scanTypes() {
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

	getResourceByImg(imgStem) {
		let imgPath = IMG_BASE+(typeof imgStem === 'string' ? imgStem : imgStem.src);
		let state = this.repo.imgStateList[imgPath];
		if( state === undefined ) {
			// Not a detected img!
			debugger;
		}
		if( state == imgLOADED || state == imgSPREAD ) {
			return this.repo.loader.resources[imgPath];
		}
		if( state == imgSTANDBY ) {
			this.repo.request(imgPath);
		}
		return this.repo.placeholderResource;
	}
/*
let renderer = PIXI.autoDetectRenderer();
let renderTexture = PIXI.RenderTexture.create({ width: 256, height: 256 });
let sprite = PIXI.Sprite.from( myImageUrl );

// maybe sprite.setTransform()

// or maybe...
//sprite.position.x = 0;
//sprite.position.y = 0;
//sprite.anchor.x = 0;
//sprite.anchor.y = 0;

renderer.render(sprite, renderTexture);
*/

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

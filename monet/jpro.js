Module.add('jpro',function() {

const DirAdd = [
	{ x:0,  y:-1 },
	{ x:1,  y:-1 },
	{ x:1,  y:0 },
	{ x:1,  y:1 },
	{ x:0,  y:1 },
	{ x:-1, y:1 },
	{ x:-1, y:0 },
	{ x:-1, y:-1 }
];

let RectTemplate = {
	xMin: null,
	xMax: null,
	yMin: null,
	yMax: null
};

function colorToHex(str) {
	let strHex = str.replace('#','');
	let color = parseInt( strHex, 16 );
	return color;
}

function hexToRgba(hex) {
	let r = (hex & 0xFF000000)>>>24;
	let g = (hex & 0x00FF0000)>>>16;
	let b = (hex & 0x0000FF00)>>>8;
	let a = (hex & 0x000000FF);
	return { r:r, g:g, b:b, a:a }
}

function rgbaToHex(rgba) {
	return (rgba.r<<24 | rgba.g<<16 | rgba.b<<8 | rgba.a)>>>0;
}

function colorClose(r,g,b,color,threshold) {
	return Math.abs(r-color.r)<=threshold && Math.abs(g-color.g)<=threshold && Math.abs(b-color.b)<=threshold;
}

async function jimpCreate(jimp,xLen,yLen) {
	return new Promise( ( resolve, reject ) => {
		try {
			new jimp( xLen, yLen, ( error, image ) => {
				if ( error ) reject( error );
				resolve( image );
			});
		} catch ( error ) {
			reject( error );
		}
	});
}

class ImageProxy {
	constructor(image) {
		this.image = image;
	}
	get data() {
		return this.image.bitmap.data;
	}
	get xLen() {
		return this.image.bitmap.width;
	}
	get yLen() {
		return this.image.bitmap.height;
	}
	getPixel(x,y) {
		let idx = (this.xLen * y + x) << 2;
		let hex = this.data.readUInt32BE(idx);
		return hex;
	}
	setPixel(x,y,hex) {
		let idx = (this.xLen * y + x) << 2;
		this.data.writeUInt32BE(hex, idx);
	}
	inBounds(x,y) {
		return x>=0 && x<this.xLen && y>=0 && y<this.yLen;
	}
	traverse8(x,y,testFn) {
		for( let dir=0 ; dir<DirAdd.length ; ++dir ) {
			testFn(x+DirAdd[dir].x,y+DirAdd[dir].y);
		}
	}
	count8(x,y,testFn) {
		let count = 0;
		for( let dir=0 ; dir<DirAdd.length ; ++dir ) {
			if( testFn(x+DirAdd[dir].x,y+DirAdd[dir].y) ) {
				++count;
			}
		}
		return count;
	}
	sum8Alpha(x,y) {
		let sum = 0;
		for( let dir=0 ; dir<DirAdd.length ; ++dir ) {
			let px = x+DirAdd[dir].x;
			let py = y+DirAdd[dir].y;
			// Out of bounds are assumed to be transparent.
			if( this.inBounds(px,py) ) {
				sum += this.getPixel(px,py) & 0xFF;
			}
		}
		return sum;
	}
	sum8AlphaRef(x,y,ref) {
		let sum = 0;
		let xLen = this.xLen;
		for( let dir=0 ; dir<DirAdd.length ; ++dir ) {
			let px = x+DirAdd[dir].x;
			let py = y+DirAdd[dir].y;
			// Out of bounds are assumed to be transparent.
			if( this.inBounds(px,py) ) {
				sum += ref[py*xLen+px] ? 0xff : 0;
			}
		}
		return sum;
	}
	gather(inset,fn) {
		let list = [];
		let count = 0;
		this.image.scan( 0+inset, 0+inset, this.xLen-inset*2, this.yLen-inset*2, function(x,y,i) {
			++count;
			if( fn(x,y,i) ) {
				list.push(x,y);
			}
		});
		//console.log("gather checked",count);
		return list;
	}
	flood(xStart, yStart, criteriaFn) {
		let done = [];
		let list = [];
		let xLen = this.xLen;
		let yLen = this.yLen;
		let live = 0;
		let add = (x,y) => {
			let index = y*xLen+x;
			if( done[index] || x<0 || x>=xLen || y<0 || y>=yLen || !criteriaFn(x,y) ) {
				return;
			}
			done[index] = true;
			list.push(x,y);
		}
		add(xStart,yStart);

		let tail = 0;
		while( tail < list.length ) {
			let x = list[tail+0];
			let y = list[tail+1];
			add(x+0,y-1);
			add(x+1,y-1);
			add(x+1,y+0);
			add(x+1,y+1);
			add(x+0,y+1);
			add(x-1,y+1);
			add(x-1,y+0);
			add(x-1,y-1);
			tail += 2;
		}

		return list;
	}
	processPairs(list,fn) {
		for( let i=0 ; i<list.length ; i+=2 ) {
			let x = list[i+0];
			let y = list[i+1];
			fn(x,y,i);
		}
	}

	blit(a) {
		for( let i=0 ; i<a.length ; i+=3 ) {
			this.setPixel( a[i+0], a[i+1], a[i+2] );
		}		
	}
	testRgba(x,y,fn) {
		let hex = this.getPixel( x, y );
		let r = (hex & 0xFF000000)>>>24;
		let g = (hex & 0x00FF0000)>>>16;
		let b = (hex & 0x0000FF00)>>>8;
		let a = (hex & 0x000000FF);
		return fn(r,g,b,a);
	}
	mixRgb(x,y,colorRgba,pct,forceA) {
		function proRata(a,b,pct) {
			return Math.round( (a*(1-pct) + b*pct) );
		}
		let result = {r:0, g:0, b:0, a:0};
		this.testRgba( x, y, (r,g,b,a)=>{
			result.r = proRata(r,colorRgba.r,pct);
			result.g = proRata(g,colorRgba.g,pct);
			result.b = proRata(b,colorRgba.b,pct);
			result.a = forceA;
		});
		return result;
	}
	eyedropper(x,y) {
		let color = {r:0, g:0, b:0, a:0};
		this.testRgba( x, y, (r,g,b,a)=>{ color.r=r; color.g=g; color.b=b; color.a=a; } );
		return color;
	}
	strip(threshold) {
		console.log( 'Stripping '+threshold );
		let count = 0;
		this.gather( 0, (x,y,i) => {
			let a = this.getPixel( x, y ) & 0xFF;
			if( a <= threshold ) {
				this.setPixel( x, y, 0x00000000 );
				++count;
			}
		});
		console.log( count+' stripped' );
	}
	bgRemove(data) {
		let isFind   = (r,g,b,a) => colorClose(r,g,b,base,data.find);
		let isRemove = (r,g,b,a) => colorClose(r,g,b,base,data.remove);
		let percent  = this.xLen*this.yLen*(data.percent||0);
		let count = 0;
		let spots = 0;
		let self = this;

		let base = this.eyedropper(2,2);	// kind of an arbitrary place to guess the background.
		console.log('base=',base);

		this.image.scan( 0, 0, this.xLen, this.yLen, function(x,y) {
			if( self.testRgba(x,y,isFind) ) {
				let list = self.flood( x, y, (x,y)=>self.testRgba(x,y,isRemove) );
				if( list.length >= percent ) {
					self.processPairs( list, (x,y)=>self.setPixel(x,y,data.color||0x00000000) );
					count += list.length;
					++spots;
				}
			}
		});
		console.log( count+' bgRemoved in '+spots+' spots' );
	}
	ungradient(threshold) {
		let test0 = (r,g,b,a) => Math.abs(r-base0.r)<threshold && g>=Math.abs(g-base0.g)<threshold && Math.abs(b-base0.b)<threshold
		let test1 = (r,g,b,a) => Math.abs(r-base1.r)<threshold && g>=Math.abs(g-base1.g)<threshold && Math.abs(b-base1.b)<threshold
		let isAlike = (r,g,b,a) => {
			let alike = a>0x10 && (test0(r,g,b,a) || test1(r,g,b,a));
			if( alike && driftRatio ) {
				base1.r = Math.round(base1.r*(1-driftRatio)+r*driftRatio);
				base1.g = Math.round(base1.g*(1-driftRatio)+g*driftRatio);
				base1.b = Math.round(base1.b*(1-driftRatio)+b*driftRatio);
			}
			return alike;
		}
		let driftRatio = 0.10;		// How strongly do we drift, from 0.0 (never chnge base) to 1.0 (just jump to the new color)
		let base0 = {r:0,g:0,b:0};
		let base1;
		let count = 0;

		for( let y=0 ; y<this.yLen ; ++y ) {
			this.testRgba( 2, y, (r,g,b)=>{ base0.r=r; base0.g=g; base0.b=b; } );
			base1 = Object.assign( {}, base0 );
			for( let x=0 ; x<this.xLen ; ++x ) {
				if( this.testRgba(x,y,isAlike) ) {
					this.setPixel(x,y,0x00000000);
					++count;
				}
			}
		}
		console.log( count+' ungradiented' );
	}
	autocrop(marginPct,threshold) {
		let self = this;
		let rect = Object.assign( {}, RectTemplate );
		this.image.scan( 0, 0, this.xLen, this.yLen, function(x,y) {
			let hex = self.getPixel( x, y ) & 0xFF;
			if( hex >= threshold ) {
				if( rect.xMin===null || x<rect.xMin ) rect.xMin = x;
				if( rect.xMax===null || x>rect.xMax ) rect.xMax = x;
				if( rect.yMin===null || y<rect.yMin ) rect.yMin = y;
				if( rect.yMax===null || y>rect.yMax ) rect.yMax = y;
			}
		});
		let xLen = (rect.xMax-rect.xMin)+1;
		let yLen = (rect.yMax-rect.yMin)+1;
		//console.log('xLen',xLen,'yLen',yLen);
		let margin = Math.floor( Math.max( marginPct*xLen, marginPct*yLen ));
		//console.log('margin',margin);

		let x0 = Math.max(0,rect.xMin-margin);
		let y0 = Math.max(0,rect.yMin-margin);
		let x1 = Math.min(this.xLen-x0,xLen+margin*2);
		let y1 = Math.min(this.yLen-y0,yLen+margin*2);
		//console.log(x0,y0,x1,y1);
		this.image.crop(x0,y0,x1,y1);

		console.log('Autocropped to '+x1+'x'+y1);
	}
	cropMargin(marginPct) {
		let xMargin = Math.floor(this.xLen * marginPct.x);
		let yMargin = Math.floor(this.yLen * marginPct.y);

		let x0 = Math.max(0,0+xMargin);
		let y0 = Math.max(0,0+yMargin);
		let x1 = Math.min(this.xLen,this.xLen-xMargin*2);
		let y1 = Math.min(this.yLen,this.yLen-yMargin*2);
		//console.log(x0,y0,x1,y1);
		this.image.crop(x0,y0,x1,y1);

		console.log('cropMargin to '+x1+'x'+y1);
	}

	despeckle(reps) {
		let alone = 1;
		let isOpaque = (x,y) => this.inBounds(x,y) && (this.getPixel(x,y) & 0xFF) > 0x00;
		let count = 0;
		while( reps-- ) {
			let speckles = this.gather( 0, (x,y) => isOpaque(x,y) && this.count8(x,y,isOpaque)<=alone );
			this.processPairs( speckles, (x,y) => this.setPixel(x,y,0x00000000) );
			count += speckles.length/2;
		}
		console.log('despeckle removed',count);
	}
	edgeFade(thicknessPct,threshold,outline) {
		let thickness = Math.round(this.xLen * thicknessPct);
		let result = [];
		let isDone = [];
		let xLen = this.xLen;
		let isOpaque = (x,y,i) => {
			if( !this.inBounds(x,y) || isDone[y*xLen+x] ) {
				return false;
			}
			let a = this.getPixel(x,y) & 0xFF;
			return a>threshold;
		}
		console.log(outline);
		let outlineRgba = !outline ? false : hexToRgba( colorToHex(outline.color) );
		if( outlineRgba ) {
			console.log( 'edgeFade mixing with color ', outlineRgba );
		}
		let layer = 0;
		while( layer < thickness ) {
			let edges = this.gather( 0, (x,y) => isOpaque(x,y) && this.count8(x,y,isOpaque)<8 );
			//console.log( 'edgeFade '+layer+' = '+(edges.length/2) );
			this.processPairs( edges, (x,y) => {
				let pct = ((layer+1)/(thickness+1));
				let hex;
				if( outlineRgba ) {
					// If we are outlining, then we want to mix with the outline color
					hex = rgbaToHex( this.mixRgb( x, y, outlineRgba, pct, 255 ) );
				}
				else {
					// But if no outline, we want to fade the alpha
					hex = this.getPixel(x,y);
					let a = Math.floor( (hex & 0xFF) * pct );
					hex = ((hex & ~0xFF) | (a&0xFF)) >>> 0;
				}
				result.push( x, y, hex );
				isDone[y*xLen+x] = true;
			});
			++layer;
		}
		return result;
	}

	outline(thicknessPct,threshold,color,glow,antialias) {
		let thickness = Math.round(this.xLen * thicknessPct);
		let result = [];
		let hasPixel = [];
		let xLen = this.xLen;
		let isOpaque = (x,y,i) => {
			if( !this.inBounds(x,y) ) {
				return false;
			}
			let a = this.getPixel(x,y) & 0xFF;
			return a>threshold || hasPixel[y*xLen+x];
		}
		let totalThickness = thickness;
		while( thickness>0 ) {
			let hex = colorToHex(color);
			if( glow ) {
				let a = Math.floor( (hex & 0xFF) * (thickness / totalThickness) );
				hex = ((hex & ~0xFF) | (a&0xFF)) >>> 0;
			}
			let testEdge = (x,y,i) => !isOpaque(x,y) && this.count8(x,y,isOpaque)>0;
			let edges = this.gather( 0, testEdge );
			let rStart = result.length;
			for( let i=0 ; i<edges.length ; i+=2 ) {
				let x = edges[i+0];
				let y = edges[i+1];
				result.push( x, y, hex );
				hasPixel[y*xLen+x] = 1;
			}
			if( antialias && thickness == 1 /* last layer */ ) {
				console.log('Outline is antialiasing');
				for( let i=0 ; i<edges.length ; i+=2 ) {
					let x = edges[i+0];
					let y = edges[i+1];
					let hex = result[rStart+i+2];
					let a = Math.floor(this.sum8AlphaRef(x,y,hasPixel) / 8) >>> 0;
					hex = ((hex & ~0xFF) | (a&0xFF)) >>> 0;
					let index = (i/2) * 3;
					result[rStart+index+2] = hex;
				}
			}

			--thickness;
		}
		return result;
	}

/*
Floor height should be two pixels below the lowest pixel,
unless this thing is flying. We can take a guess at that maybe.

the pixel's distance above the floor scales both the x and y distances

y = py - heightAboveFloor/2;
x = px + heightAboveFloor/2;
*/

	shadow(threshold,flying,xRatio,yRatio,color) {
		let result = [];
		let isOpaque = (x,y,i) => {
			let a = this.getPixel(x,y) & 0xFF;
			return a>threshold;
		}

		let hex = colorToHex(color);
		console.assert( hex & 0xFF );

		let body = this.gather( 0, (x,y,i) => isOpaque(x,y) );
		//console.log( 'Shadow found '+body.length+' shadow-casting pixels.' );
		let floor = 0;
		for( let i=0 ; i<body.length ; i+=2 ) {
			floor = Math.max( floor, body[i+1] );
		}
		floor += 2;
		floor = Math.min( this.yLen-1, floor );
		let yOffset = flying ? (this.yLen-1-floor) : 0;
		let countOut = 0;
		let countCovered = 0;
		let countShadow = 0;
		for( let i=0 ; i<body.length ; i+=2 ) {
			let x = body[i+0];
			let y = body[i+1];
			let height = floor-y;
			let dxPct = 1 - (x/(this.xLen-1));
			let dyPct = 1 - (y/(this.yLen-1));
			let sx = x + Math.floor(height * xRatio * dxPct);
			let sy = yOffset + floor - Math.floor(height * yRatio);
			if( !this.inBounds(sx,sy) ) {
				countOut++;
				continue;
			}			
			if( (this.getPixel(sx,sy) & 0xFF) > threshold ) {
				countCovered++;
				continue;
			}
			result.push( sx, sy, hex );
			countShadow++;
		}
		//console.log( 'Shadow: '+countOut+' out, '+countCovered+' covered, '+countShadow+' shadows.' );
		return result;
	}
}


async function filterImageInPlace(jimp,image,filter) {
	//console.log( "The image is "+image.bitmap.width+'x'+image.bitmap.height );

	let proxy = new ImageProxy(image);

	image.background(0x00000000);

	if( filter.cropMargin ) {
		proxy.cropMargin( filter.cropMargin );
	}

	if( filter.bgRemove ) {
		proxy.bgRemove( filter.bgRemove );
	}

	if( filter.ungradient ) {
		proxy.ungradient( filter.ungradient );
	}

	if( filter.strip ) {
		proxy.strip( filter.strip );
	}

	if( filter.despeckle ) {
		proxy.despeckle( filter.despeckle );
	}

	if( filter.autocrop !== undefined && filter.autocrop !== false && filter.autocrop !== null ) {
		proxy.autocrop( filter.autocrop, filter.strip || 0xA0 );
	}

	if( filter.resize !== false ) {
		let margin = filter.outline && filter.outline.thickness ? filter.outline.thickness : 0;
		let dimSquare = Math.max(image.bitmap.width,image.bitmap.height);
		dimSquare = Math.round(dimSquare*(1+(2*margin)));

		if( dimSquare != image.bitmap.width || dimSquare != image.bitmap.height ) {
			console.log('resize from '+image.bitmap.width+'x'+image.bitmap.height+' to '+dimSquare+'x'+dimSquare+'; margin '+margin);
			let x = Math.floor((dimSquare-image.bitmap.width) * 0.5);
			let y = Math.floor((dimSquare-image.bitmap.height) * 0.5);
			let temp = await jimpCreate(jimp,dimSquare,dimSquare);
			temp.blit( image, x, y );
			image = temp;
			proxy.image = image;
		}
	}

	let dim = filter.size || 92;
	image.scaleToFit(dim,dim,jimp.RESIZE_HERMITE);
	console.log('scale to '+dim+'x'+dim);

	if( filter.flying ) { filter.outline.flying = filter.flying; } 
	if( filter.glow ) 	{ filter.shadow = false; filter.outline.glow = true; filter.outline.color = filter.glow; } 

	if( filter.normalize ) {
		image.normalize();
	}
	if( filter.contrast ) {
		image.contrast( filter.contrast );
	}
	if( filter.brightness ) {
		image.brightness( filter.brightness );
	}
	if( filter.desaturate ) {
		image.color([
			{ apply: 'desaturate', params: [ Math.floor( filter.desaturate * 100 ) ] }
		]);
	}
	if( filter.recolor ) {
		image.color( Array.isArray(filter.recolor) ? filter.recolor : [filter.recolor] );
	}

	let blits = [];
	if( filter.edgeFade ) {
		blits.push( proxy.edgeFade( filter.edgeFade, 0x20, filter.outline ) );
	}
	let shadow = filter.shadow;
	if( shadow ) {
		blits.push( proxy.shadow( shadow.threshold, shadow.flying, shadow.xRatio, shadow.yRatio, shadow.color ) );
	}
	let outline = filter.outline;
	if( outline ) {
		blits.push( proxy.outline( outline.thickness, outline.threshold, outline.color, outline.glow, outline.antialias ) );
	}
	while( blits.length ) {
		let blitList = blits.shift();
		proxy.blit( blitList );
	}

	return image;
}

let _exports = {
	filterImageInPlace: filterImageInPlace
}

if( typeof module !== 'undefined' ) {
	module.exports = _exports;
}
else {
	return _exports;
}

});

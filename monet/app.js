/*
To view a processed image:

localhost:3010/tiles/mon/frog.png
or
localhost:3010/force/mon/frog.png

- /force/ will force the images to reprocess, while /tiles/ cachesfor faster processing.
- Caching includes:
  - Check datestamp of source in ../tsrc/mon/frog.png vs target in ../tiles/mon/frog.png
  - comparing with the last filter I used, stored in ../lastFilterSent.json
- if later, gets the processing data (which it reads fresh every time) from config.js
- processes and outputs as needed, returning the file to the called
- auto-reloads filter.js so that when it changes it will re-process.
*/

const util 		= require('util');
const path 		= require('path');
const fs 		= require('fs');
const vm		= require('vm');
const request	= require('request');
const express 	= require('express');
const jimp 		= require('jimp');
const watch     = require('node-watch');

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

let pathSource = '../tsrc/';
let pathTarget = '../tiles/';
let lfsFileName = pathSource+'lastFilterSent.json';

let DirSpec = {};
let FilterSpec = {};
let FilterDefault = {};
let PortraitImport = {};
let LastFilterSent = {};

let RectTemplate = {
	xMin: null,
	xMax: null,
	yMin: null,
	yMax: null
};


Object.deepAssign = function(target,...args) {

	function merge( target, source ) {
		for( let key in source ) {
			let value = source[key];
			if( typeof value == 'object' && value !== null ) {
				if( Array.isArray(value) && !Array.isArray(target[key]) ) {
					target[key] = [];
				}
				if( typeof target[key] !== 'object' || target[key] === null ) {
					target[key] = {};
				}
				merge( target[key], value );
				continue;
			}
			//console.log(key,value);
			target[key] = value;
		}
	}

	//console.log( 'TARGET', target );
	for( let i=0 ; i <args.length ; ++i ) {
		let src = args[i];
		//console.log( 'SRC', src );
		if( !src || typeof src != 'object' || src == null ) continue;
		merge( target, src );
	}
	//console.log( 'RESULT', target );
	return target;
}

Object.each = function(obj,fn) {
	for( let key in obj ) {
		fn(obj[key],key);
	}
}

function colorToHex(str) {
	let strHex = str.replace('#','');
	let color = parseInt( strHex, 16 );
	return color;
}

function getSourcePath(fileName) {
	return pathSource+fileName;
}

function getTargetPath(fileName) {
	return pathTarget+fileName;
}

function delay(ms) {
	let promise = new Promise( function( resolve, reject ) {
		setTimeout( resolve, ms );
	});
	return promise;
}

function throwError(details) {
	throw { error: true, details: details };
}

let fileLocks = {};

async function getFileTimeMs(path) {
	let promise = new Promise( function(resolve,reject) {
		fs.stat( path, function( err, stats ) {
			if( err ) reject(err);
			else resolve(stats.mtimeMs);
		});
	});
	return promise;
}

async function testTimestamps(fileName,outOfDateAction) {
	let sourcePath = getSourcePath(fileName);
	let targetPath = getTargetPath(fileName);

	if( !fs.existsSync(sourcePath) ) {
		throw {
			benign: true,
			details: 'Source file not found ['+sourcePath+']'
		};
	}

	let sourceTimeMs = await getFileTimeMs(sourcePath);
	let targetExists = fs.existsSync(targetPath);
	let targetTimeMs = !targetExists ? 0 : await getFileTimeMs(targetPath);

	return targetTimeMs < sourceTimeMs;
}

async function jimpRead(filePath) {
	let promise = new Promise( function( resolve, reject ) {
		jimp.read( filePath, function( err, image ) {
			if( err ) reject(err);
			else resolve(image);
		});
	});
	return promise;
}

async function jimpWrite(filePath,image) {
	let promise = new Promise( function( resolve, reject ) {
		image.write( filePath, function( err ) {
			if( err ) reject(err);
			else resolve();
		});
	});
	return promise;
}

async function jimpCreate(xLen,yLen) {
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


function fileNameAlter(name,fn) {
	let parts = name.split('/');
	let fname = parts[parts.length-1].split('.');
	fname[0] = fn(fname[0]);
	parts[parts.length-1] = fname.join('.');
	return parts.join('/');
}

function sumData(data) {
	let total = 0;
	for( let i=0 ; i<data.length ; i+=4 ) {
		total += data.readUInt32BE(i);
	}
	return total;
}

function close(a,b,c) {
	return Math.abs(a-b)<c;
}

function colorClose(r,g,b,color,threshold) {
	return Math.abs(r-color.r)<=threshold && Math.abs(g-color.g)<=threshold && Math.abs(b-color.b)<=threshold;
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
	testRGBA(x,y,fn) {
		let hex = this.getPixel( x, y );
		let r = (hex & 0xFF000000)>>>24;
		let g = (hex & 0x00FF0000)>>>16;
		let b = (hex & 0x0000FF00)>>>8;
		let a = (hex & 0x000000FF);
		return fn(r,g,b,a);
	}
	eyedropper(x,y) {
		let color = {r:0, g:0, b:0, a:0};
		this.testRGBA( x, y, (r,g,b,a)=>{ color.r=r; color.g=g; color.b=b; color.a=a; } );
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
			if( self.testRGBA(x,y,isFind) ) {
				let list = self.flood( x, y, (x,y)=>self.testRGBA(x,y,isRemove) );
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
			this.testRGBA( 2, y, (r,g,b)=>{ base0.r=r; base0.g=g; base0.b=b; } );
			base1 = Object.assign( {}, base0 );
			for( let x=0 ; x<this.xLen ; ++x ) {
				if( this.testRGBA(x,y,isAlike) ) {
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
	edgeFade(thicknessPct,threshold) {
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
		let layer = 0;
		while( layer < thickness ) {
			let edges = this.gather( 0, (x,y) => isOpaque(x,y) && this.count8(x,y,isOpaque)<8 );
			//console.log( 'edgeFade '+layer+' = '+(edges.length/2) );
			this.processPairs( edges, (x,y) => {
				let hex = this.getPixel(x,y);
				let a = Math.floor( (hex & 0xFF) * ((layer+1)/(thickness+1)) );
				hex = ((hex & ~0xFF) | (a&0xFF)) >>> 0;
				result.push( x, y, hex );
				isDone[y*xLen+x] = true;
			});
			++layer;
		}
		return result;
	}

	outline(thicknessPct,threshold,color,glow) {
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
			let edges = this.gather( 0, (x,y,i) => !isOpaque(x,y) && this.count8(x,y,isOpaque)>0 );
			for( let i=0 ; i<edges.length ; i+=2 ) {
				let x = edges[i+0];
				let y = edges[i+1];
				result.push( x, y, hex );
				hasPixel[y*xLen+x] = 1;
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


async function filterImageInPlace(image,filter) {
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
			let temp = await jimpCreate(dimSquare,dimSquare);
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
		blits.push( proxy.edgeFade( filter.edgeFade, 0x20 ) );
	}
	let shadow = filter.shadow;
	if( shadow ) {
		blits.push( proxy.shadow( shadow.threshold, shadow.flying, shadow.xRatio, shadow.yRatio, shadow.color ) );
	}
	let outline = filter.outline;
	if( outline ) {
		blits.push( proxy.outline( outline.thickness, outline.threshold, outline.color, outline.glow ) );
	}
	while( blits.length ) {
		let blitList = blits.shift();
		proxy.blit( blitList );
	}

	return image;
}

function asyncRequest(url) {
	return new Promise(function (resolve, reject) {
		request(url, function (error, res, body) {
			if (!error && res.statusCode == 200) {
				resolve(body);
			} else {
				reject(error);
			}
		});
	});
}

function stringify(s) {
	return JSON.stringify(s,null,"\t");
}

let lfsHandle = null;
function lfsDefer() {
	clearTimeout(lfsHandle);
	lfsHandle = setTimeout( () => {
		console.log('Saving lastFilterSent.');
		fs.writeFile(lfsFileName,stringify(LastFilterSent),'utf8',()=>{});
	},5000);
}

async function processImageAsNeeded(fileName,dirSpec,forceProcessing) {

	while( fileLocks[fileName] ) {
		console.log('Waiting on locked file '+fileName);
		await delay(2000);
	}
	fileLocks[fileName] = (fileLocks[fileName]||0)+1;

	let image = null;
	try {
		let filter = Object.deepAssign( {}, FilterDefault, dirSpec, FilterSpec[fileName] );
		let filterString = stringify(filter);

		let sourcePath = getSourcePath(fileName);
		let image;

		if( filter.url ) {
			let lastFilter = JSON.parse(LastFilterSent[fileName] || '{}');
			if( !fs.existsSync(sourcePath) || filter.url!==lastFilter.url ) {
				console.log('Fetching',filter.url);
				image = await jimpRead(filter.url);
				await jimpWrite( sourcePath, image );		// This handles conversion to the new image type automagically
			}
		}

		let isFirstLoad = image;
		let isFilterChange  = filterString !== LastFilterSent[fileName];
		let isOutOfDate = await testTimestamps(fileName);
		if( forceProcessing || isFirstLoad || isFilterChange || isOutOfDate ) {
			image = image || await jimpRead(sourcePath);
			console.log( 'Filtering '+sourcePath+' due to '+(isFirstLoad?'first load ':'')+(isFilterChange?'filter change ':'')+(isOutOfDate?'out of date':'forceProcessing') );
			console.log( filterString );
			image = await filterImageInPlace(image,filter);
			let targetPath = getTargetPath(fileName);
			console.log( 'Writing to '+targetPath );
			await jimpWrite( targetPath, image );
			LastFilterSent[fileName] = filterString;
			lfsDefer();
		}
	}
	catch( e ) {
		if( !e ) {
			console.log('e is',e);
		}
		if( e.benign || e.errno==-2 ) {
			console.log( 'Allow '+e.details );
		}
		else {
			console.log( 'Error '+util.inspect(e) );
		}
	}

	console.assert( fileLocks[fileName] !== undefined && fileLocks[fileName]>0 );
	fileLocks[fileName] = fileLocks[fileName] - 1;
	return image;
}

async function loadFilterSpec(filePath) {
	fs.readFile(filePath, 'utf8', function(err, data) {  
		if (err) throw err;
		const sandbox = {
			FilterSpec: null,
			DirSpec: null,
			FilterDefault: null,
			PortraitImport: null,
		};
		try {
			const script = new vm.Script( data );
			const context = new vm.createContext(sandbox);
			script.runInContext( context, { lineOffset: 0, displayErrors: true } );
			FilterSpec     = sandbox.FilterSpec;
			DirSpec        = sandbox.DirSpec;
			FilterDefault  = sandbox.FilterDefault;
			PortraitImport = sandbox.PortraitImport;
		}
		catch(e) {
			console.log('filters.js',e.message,'in line', e.stack.split('<anonymous>:')[1].split('\n\n')[0]);
			FilterSpec = null;	
		}
	});
}


function getDirSpec(fileName) {
	let dirSpec = false;
	Object.each( DirSpec, (value,dir) => {
		if( fileName.startsWith(dir) ) {
			dirSpec = value;
		}
	});
	return dirSpec;
}

let Portrait = new class {
	constructor() {
		this.portraitDir = '../tsrc/portrait';
		this.htmlFile = 'portrait.html';
		this.template = null;
		this.portraitList = [];
	}
	get fetchUrl() {
		return PortraitImport.fetchUrl || 'https://www.thispersondoesnotexist.com/image';
	}
	get tempFile() {
		return PortraitImport.tempFile || 'portraitTemp'+PortraitImport.extension;
	}
	portraitPath(name) {
		return path.join(__dirname,this.portraitDir,name);
	}
	async preload(overrideExtension) {
		let extensionRegex = new RegExp( /\.(png|jpg)$/, 'i' ); 
		fs.readdir(this.portraitPath(''), (err, files) => {
			//console.log(files);
			if (err) {
				return console.log('Unable to scan directory: ' + err);
			} 
			files.forEach( file => {
				if( !file.match( extensionRegex ) ) {
					//console.log('excluding',file);
					return;
				}
				//console.log( 'adding',file );
				this.portraitList.push( file );
			});
		});
	}


	async oneTimeConvert(req,res) {
		let ext = '.png';
		this.preload(ext);
		console.log('oneTimeConvert of',this.portraitList.length,'from',this.portraitPath(''),' *'+ext);
		let result = '';
		console.log('Please wait for this operation');
		for( let index in this.portraitList ) {
			let file = this.portraitList[index];
			let image = await jimpRead(this.portraitPath(file));

			await image
				.resize(PortraitImport.size, PortraitImport.size) // resize
				.quality(PortraitImport.quality) // set JPEG quality
			;

			file = file.split('.')[0]+PortraitImport.extension;
			let s = 'write '+this.portraitPath(file)+'<br>';
			console.log(s);
			result += s;
			await jimpWrite( this.portraitPath(file), image );
		}
		res.send(result);
	}

	async loadHtml() {
		this.template = await fs.promises.readFile(this.htmlFile, 'utf8');
		//console.log(this.template);
	}
	async fetch(cwd,req,res,next) {
		console.log('Fetching new face');
		let image = await jimpRead(this.fetchUrl);
		console.log('saving temp to',this.tempFile);

		await image
			.resize(PortraitImport.size, PortraitImport.size) // resize
    		.quality(PortraitImport.quality) // set JPEG quality
    	;

		await jimpWrite( this.tempFile, image );

		// Load and send the HTML
		await this.loadHtml();
		console.log('html file is',this.htmlFile);
		let html = this.template
			.replace( '[/*FILE_LIST*/]', JSON.stringify(this.portraitList) )
			.replace( '[PORTRAIT_TEMP_FILE]', this.tempFile )
		;
		res.send( html );
	}
	async saveAs(nameRaw) {
		let count = 0;
		let name = () => nameRaw+count+PortraitImport.extension;
		while( fs.existsSync(this.portraitPath(name())) ) ++count;
		console.log('renaming',this.tempFile, this.portraitPath(name()) );
		await fs.promises.rename( this.tempFile, this.portraitPath(name()) );
		this.portraitList.unshift(name().replace(PortraitImport.extension,''));
	}
}

async function run() {

	let filterFilePath = 'filters.js';
	await loadFilterSpec(filterFilePath);

	const app = express();
	app.cwd = process.cwd().replace( '/monet', '' );

	watch( filterFilePath, {}, async function(evt,name) {
		console.log( 'Reload '+filterFilePath );
		await loadFilterSpec(filterFilePath);
		console.log( 'Done reloading '+filterFilePath );
	});

	// Someday we should be ultra-thorough and, if the app has changed timestamp, compare against its date all.
	// For now just use /force/* - see below.
	// let appFilePath = 'app.js';
	// let appTimeMs = await getFileTimeMs(appFilePath);

	try {
		LastFilterSent = JSON.parse(fs.readFileSync(lfsFileName, 'utf8'));
	} catch(e) {
		LastFilterSent = {};
	}

	app.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	});


	let processImage = async (req, res, forceProcessing, next) => {
		let fileName = req.params[0];
		let filePath = app.cwd+'/tiles/'+fileName;

		if( !FilterSpec ) {
			console.log('Invalid FilterSpec. Unable to serve',fileName);
			return next(e);
		}
		try {
			let dirSpec = getDirSpec(fileName);
			if( dirSpec ) {
				await processImageAsNeeded(fileName,dirSpec,forceProcessing);
			}
			console.log( "sending "+filePath );
			res.sendFile( filePath );
		} catch(e) {
			console.log('Error processing',fileName);
			return next(e);
		}
	}

	await Portrait.preload();
	await Portrait.loadHtml();
	let portrait = async function(req,res,next) {
		if( req.query.name ) {
			Portrait.saveAs(req.query.name);
		}
		Portrait.fetch(app.cwd,req,res,next);
	}

	//
	// For regular image processing
	//
	app.get('/tiles/*', async (req, res, next) => await processImage(req,res,false,next));
	app.get('/force/*', async (req, res, next) => await processImage(req,res,true,next));

	//
	// For interactively viewing and choosing portraits
	//
	app.use('/public', express.static(path.join(__dirname, '.')));
	app.use('/src',  express.static(path.join(__dirname, '../src')));
	app.get('/portrait', async (req, res, next) => await portrait(req,res,true,next));

	app.get('/oneTimeConvert', async (req,res,next) => { Portrait.oneTimeConvert(req,res); } );

	let port = 3010;
	app.listen(port, () => console.log('Monet listening on port '+port+'.'))
}

run();

/*
To Do:
- recipe generation code
- figure out how to generate faces using nothgin but a random seed, so save download time
- figure out how to put stuff on faces, like a monocle, hat, beard, etc.

Interesting art tools
https://trianglify.io/ - creates a poly mesh with pretty colors

Style Transfer
https://magenta.tensorflow.org/blog/2018/12/20/style-transfer-js/

Make faces low poly
https://snorpey.github.io/triangulation/

Nice cartoon and style processing. Use their "Artsy" tool and choose "Underpainting DLX"
https://www.befunky.com/create/

Tensorflow facial recognition in NodeJS
https://github.com/justadudewhohacks/face-api.js

Face Crafting Code
https://github.com/SummitKwan/transparent_latent_gan
https://blog.insightdatascience.com/generating-custom-photo-realistic-faces-using-ai-d170b1b59255
DEmo: https://www.kaggle.com/kdemarest/tl-gan-demo/edit

*/



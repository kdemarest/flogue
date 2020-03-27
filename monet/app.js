

/**

localhost:3010/tiles/mon/frog.png
- comes to app.js
- checks datestamp of source in ../tilesrc/mon/frog.png vs target in ../tiles/mon/frog.png
- if later, gets the processing data (which it reads fresh every time) from config.js
- processes and outputs as needed, returning the file
**/

const util 		= require('util');
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

let DirSpec = {};
let FilterSpec = {};
let FilterDefault = {};
let LastFilterSent = {};

Object.deepAssign = function(target,...args) {

	function merge( target, source ) {
		for( let key in source ) {
			let value = source[key];
			if( typeof value == 'object' && value !== null ) {
				if( typeof target[key] !== 'object' || target[key] === null ) {
					target[key] = {};
				}
				merge( target[key], value );
				continue;
			}
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
	return '../tsrc/'+fileName;
}

function getTargetPath(fileName) {
	return '../tiles/'+fileName;
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

class ImageProxy {
	constructor(image) {
		this.image = image;
		this.data = this.image.bitmap.data;
		this.xLen = this.image.bitmap.width;
		this.yLen = this.image.bitmap.height;
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
		this.image.scan( 0+inset, 0+inset, this.xLen-inset*2, this.yLen-inset*2, function(x,y,i) {
			if( fn(x,y,i) ) {
				list.push(x,y);
			}
		});
		return list;
	}
	blit(a) {
		for( let i=0 ; i<a.length ; i+=3 ) {
			this.setPixel( a[i+0], a[i+1], a[i+2] );
		}		
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
	sweep(fn) {
		let count = 0;
		this.gather( 0, (x,y,i) => {
			let hex = this.getPixel( x, y );
			let r = (hex & 0xFF000000)>>>24;
			let g = (hex & 0x00FF0000)>>>16;
			let b = (hex & 0x0000FF00)>>>8;
			let a = (hex & 0x000000FF);
			let result = fn(r,g,b,a);
			if( result !== undefined && result !== null ) {
				this.setPixel( x, y, result );
				++count;
			}
		});
		console.log( count+' swept' );
	}

	edgeFade(thickness,threshold) {
		let result = [];
		let isDone = [];
		let isOpaque = (x,y,i) => {
			if( !this.inBounds(x,y) || isDone[y*this.xLen+x] ) {
				return false;
			}
			let a = this.getPixel(x,y) & 0xFF;
			return a>threshold;
		}
		let layer = 0;
		while( layer < thickness ) {
			let edges = this.gather( 0, (x,y,i) => isOpaque(x,y) && this.count8(x,y,isOpaque)<8 );
			for( let i=0 ; i<edges.length ; i+=2 ) {
				let x = edges[i+0];
				let y = edges[i+1];
				let hex = this.getPixel(x,y);
				let a = Math.floor( (hex & 0xFF) * ((layer+1)/(thickness+1)) );
				hex = ((hex & ~0xFF) | (a&0xFF)) >>> 0;
				result.push( x, y, hex );
				isDone[y*this.xLen+x] = 1;
			}
			++layer;
		}
		return result;
	}

	outline(thickness,threshold,color,glow) {
		let result = [];
		let hasPixel = [];
		let isOpaque = (x,y,i) => {
			if( !this.inBounds(x,y) ) {
				return false;
			}
			let a = this.getPixel(x,y) & 0xFF;
			return a>threshold || hasPixel[y*this.xLen+x];
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
				hasPixel[y*this.xLen+x] = 1;
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

	image.background(0x00000000);

	let dimSquare = Math.max(image.bitmap.width,image.bitmap.height);
	if( dimSquare != image.bitmap.width || dimSquare != image.bitmap.height ) {
		console.log('resize from '+image.bitmap.width+'x'+image.bitmap.height+' to '+dimSquare+'x'+dimSquare);
		image.contain(dimSquare,dimSquare);
	}
	let dim = Math.ceil(dimSquare/filter.size) * filter.size;
	image.scaleToFit(dim,dim,jimp.RESIZE_HERMITE);



	if( filter.flying ) { filter.outline.flying = filter.flying; } 
	if( filter.glow ) 	{ filter.shadow = false; filter.outline.glow = true; filter.outline.color = filter.glow; } 

	if( filter.normalize ) {
		image.normalize();
	}
	if( filter.brightness ) {
		image.brightness( filter.brightness );
	}
	if( filter.contrast ) {
		image.brightness( filter.contrast );
	}
	if( filter.desaturate ) {
		image.color([
			{ apply: 'desaturate', params: [ Math.floor( filter.desaturate * 100 ) ] }
		]);
	}
	if( filter.recolor ) {
		image.color( filter.recolor );
	}

	let proxy = new ImageProxy(image);

	if( filter.sweepFn ) {
		proxy.sweep( filter.sweepFn );
	}

	if( filter.strip ) {
		proxy.strip( filter.strip );
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


async function processAsNeeded(fileName,dirSpec) {

	while( fileLocks[fileName] ) {
		console.log('Waiting on locked file '+fileName);
		await delay(2000);
	}
	fileLocks[fileName] = (fileLocks[fileName]||0)+1;

	let image = null;
	try {
		let filter = Object.deepAssign( {}, FilterDefault, dirSpec, FilterSpec[fileName] );
		let filterString = JSON.stringify(filter);

		let sourcePath = getSourcePath(fileName);
		let image;

		if( filter.url ) {
			if( !fs.existsSync(sourcePath) ) {
				image = await jimpRead(filter.url);
				await jimpWrite( sourcePath, image );		// This handles conversion to the new image type, eg jpg to png
			}
		}

		let isOutOfDate = !!image || filterString !== LastFilterSent[fileName] || await testTimestamps(fileName);
		if( isOutOfDate ) {
			image = image || await jimpRead(sourcePath);
			console.log( 'Filtering '+sourcePath );
			console.log( filterString );
			await filterImageInPlace(image,filter);
			let targetPath = getTargetPath(fileName);
			console.log( 'Writing to '+targetPath );
			await jimpWrite( targetPath, image );
			LastFilterSent[fileName] = filterString;
		}
	}
	catch( e ) {		
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
			FilterDefault: null
		};
		try {
			const script = new vm.Script( data );
			const context = new vm.createContext(sandbox);
			script.runInContext( context, { lineOffset: 0, displayErrors: true } );
			FilterSpec    = sandbox.FilterSpec;
			DirSpec       = sandbox.DirSpec;
			FilterDefault = sandbox.FilterDefault;
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

	app.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	});


	app.get('/tiles/*', async (req, res, next) => {
		let fileName = req.params[0];
		if( !FilterSpec ) {
			console.log('Invalid FilterSpec. Unable to serve',fileName);
			return next(e);
		}
		try {
			let fileName = req.params[0];
			let filePath = app.cwd+'/tiles/'+fileName;
			let dirSpec = getDirSpec(fileName);
			console.log(dirSpec);
			if( dirSpec ) {
				console.log( "processing "+filePath );
				await processAsNeeded(fileName,dirSpec);
			}
			console.log( "sending "+filePath );
			res.sendFile( filePath );
		} catch(e) {
			console.log('Error processing',fileName);
			return next(e);
		}
	});


	let port = 3010;
	app.listen(port, () => console.log('Monet listening on port '+port+'.'))
}

run();

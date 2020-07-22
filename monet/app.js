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
- auto-relxoads filter.js so that when it changes it will re-process.
- be sure to run with nodemon, not just node, so that code changes reload.
*/

Module = {
	add: (id,fn)=>fn()
}

const util 		= require('util');
const path 		= require('path');
const fs 		= require('fs');
const vm		= require('vm');
const express 	= require('express');
const jimp 		= require('jimp');
const watch     = require('node-watch');
//const ImageProxy = require('jpro').ImageProxy;
const filterImageInPlace = require('./jpro').filterImageInPlace;

let pathSource = '../tsrc/';
let pathTarget = '../tiles/';
let lfsFileName = pathSource+'lastFilterSent.json';

let DirSpec = {};
let FilterSpec = {};
let FilterDefault = {};
let PortraitImport = {};
let LastFilterSent = {};

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

function fileNameAlter(name,fn) {
	let parts = name.split('/');
	let fname = parts[parts.length-1].split('.');
	fname[0] = fn(fname[0]);
	parts[parts.length-1] = fname.join('.');
	return parts.join('/');
}

/*
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
*/



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
			image = await filterImageInPlace(jimp,image,filter);
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
	app.cwd = process.cwd().replace( /[\\\/]monet/, '' );

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
console.log('sent',filePath);
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



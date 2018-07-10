

/**

localhost:3000/tiles/mon/frog.png
- comes to app.js
- checks datestamp of source in ../tilesrc/mon/frog.png vs target in ../tiles/mon/frog.png
- if later, gets the processing data (which it reads fresh every time) from config.js
- processes and outputs as needed, returning the file
**/

const util 		= require('util');
const fs 		= require('fs');
const express 	= require('express');


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
			resolve(stats.mtimeMs);
		});
	});
	return promise;
}

async function testTimestamps(fileName,outOfDateAction) {
	let sourcePath = '../tsrc/'+fileName;
	let targetPath = '../tiles/'+fileName;

	if( !fs.existsSync(sourcePath) ) {
		return throwError( 'Source file not found ['+sourcePath+']' );
	}

	let sourceTimeMs = await getFileTimeMs(sourcePath);
	let targetExists = fs.existsSync(targetPath);
	let targetTimeMs = targetExists ? 0 : await getFileTimeMs(targetPath);

	return targetTimeMs < sourceTimeMs;
}

async function fetchAndProcess(fileName) {

	while( fileLocks[fileName] ) {
		console.log('Waiting on locked file '+fileName);
		await delay(2000);
	}
	fileLocks[fileName] = (fileLocks[fileName]||0)+1;

	try {
		let isOutOfDate = await testTimestamps(fileName);
		if( isOutOfDate ) {
			await process(fileName);
		}
		fetch(fileName);
	}
	catch( e ) {
		console.log("Error "+util.inspect(e));
	}

	console.assert( fileLocks[fileName] !== undefined && fileLocks[fileName]>0 );
	fileLocks[fileName] = fileLocks[fileName] - 1;
}

async function main() {
	console.log( "starting." );
	await fetchAndProcess( "mon/daispine.png" );
	console.log( "done." );
}

main();


/*

const app 		= express();

app.get('/', (req, res) => {
	res.send('Hello World!');
});


let port = 3000;
app.listen(port, () => console.log('Monet listening on port '+port+'.'))
*/

/*
var Jimp = require("jimp");

let tileDir = '../tiles/';

// open a file called "lenna.png"
Jimp.read( tileDir + "mon/demon/daispine96p.png", function (err, lenna) {
    if (err) throw err;
    lenna.resize(256, 256)            // resize
         .quality(60)                 // set JPEG quality
         .greyscale()                 // set greyscale
         .write("lena-small-bw.jpg"); // save
});
*/
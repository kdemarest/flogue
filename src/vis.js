function getTrueDistance(dx,dy) {
	return Math.sqrt(dx*dx+dy*dy);
}

function arcListGenerate() {

	function atanDeg(y,x) {
		return Math.floor( Math.atan2(y,x)/(2*Math.PI)*360 + 720 ) % 360;
	}

	let d = MaxVis;
	let arcList = [];
	arcList.push({x:0,y:0,dist:0,mid:0,span:360,left:0,right:359,nearDist:0});

	for( let y=-d ; y<=d ; ++y ) {
		for( let x=-d ; x<=d ; ++x ) {
			if( x==0 && y==0 ) continue;
			let q = 0.50;
			let dist = getTrueDistance(x,y);
			let nearDist = Math.min(getTrueDistance(x-q,y-q),getTrueDistance(x-q,y+q),getTrueDistance(x+q,y-q),getTrueDistance(x+q,y+q));
			let mid = atanDeg(y,x);
			let a = atanDeg(y-q,x-q);
			let b = atanDeg(y-q,x+q);
			let c = atanDeg(y+q,x-q);
			let d = atanDeg(y+q,x+q);
			let left = mid;
			let right = mid;
			let maxDegreesOccludableByAdjacentSquare = 120;
			for( let i=0 ; i<maxDegreesOccludableByAdjacentSquare ; ++i ) {
				let l0 = (360+mid-i)%360;
				let r0 = (360+mid+i)%360;
				if( l0 == a ) left = a;
				if( l0 == b ) left = b;
				if( l0 == c ) left = c;
				if( l0 == d ) left = d;
				if( r0 == a ) right = a;
				if( r0 == b ) right = b;
				if( r0 == c ) right = c;
				if( r0 == d ) right = d;
			}
			console.assert(left!==right);
			let span = 0;
			for( let i = left ; i!=right ; i = (i+1) % 360 ) {
				++span;
			}
			arcList.push({x:x,y:y,dist:dist,mid:mid,span:span,left:left,right:right,nearDist:nearDist});
		}
	}
	Array.shuffle(arcList);	// This is so that the sort is less predictable for equal distances.
	arcList.sort( (a,b) => a.dist-b.dist );
	return arcList;
}

function arcListTraverse( arcList, map, px, py, distLimit, onVisit ) {
	console.assert( arcList && map && px && py && distLimit && onVisit );
	let done = false;
	arcList.every( arc => {
		let xRel = arc.x;
		let yRel = arc.y;
		if( xRel<-distLimit || yRel<-distLimit || xRel>distLimit || yRel>distLimit ) {
			return false;	// exits the every() statement
		}
		let x = px + xRel;
		let y = py + yRel;
		if( x<0 || x>=map.xLen || y<0 || y>=map.yLen ) {
			return true;
		}
		return onVisit( arc, x, y, xRel, yRel ) !== false;
	});
}




class Vis {
	constructor(getMapFn) {
		this.getMapFn = getMapFn;
		this.opacityLookup = [];	// Warning! The LightCaster needs this to not change.
		this.populateLookup();
		this.shootCache = {};
		this.arcList = arcListGenerate();
	}
	populateLookup() {
		let map = this.getMapFn();
		console.assert(map);
		map.traverse( (x,y) => {
			this.visSet( map, x, y, map.tileTypeGet(x,y).opacity||0 );
		});
		map.itemList.forEach( item => {
			this.visSet( map, item.x, item.y, Math.max( this.visGet(map,item.x,item.y), item.opacity||0 ) );
		});
	}
	visGet(map,x,y) {
		if( !map.inBounds(x,y) ) {
			return false;
		}
		return this.opacityLookup[y*map.xLen+x];
	}
	visSet(map,x,y,opacity) {
		if( !map.inBounds(x,y) ) {
			return false;
		}
		return this.opacityLookup[y*map.xLen+x] = opacity;
	}
	/**
	This pre-generates the little arc segments for every single block in a square
	from -MaxVis to +MaxVis.
		(x,y) is the position of the block relative to 0,0
		dist  is the distance, in real sqrt() terms, from the center
		mid   is the midpoint of the block, exacty in its center
		left  is the left side of the arc
		right is the right side of the arc
		span  is the number of degrees (or whatever unit we choose) of the entire left-to-right arc
		nearDist is the distance from center to the very nearest part of the block
	**/

	calcVis(px,py,senseSight,blind,xray,senseInvisible,visGrid,mapMemory) {
		let map = this.getMapFn();
		let xLen = map.xLen;
		let itemLookup = map.itemLookup;

		visGrid = visGrid || [];

		// Start everything hidden by default, unless we have xray vision or are blind.
		// With xray and not blind, this will all be set to true.
		// If either one is set we can leaver early.
		let defaultValue = xray && !blind;
		map.traverse( (x,y) => {
			visGrid[y] = visGrid[y] || [];
			visGrid[y][x] = defaultValue;
		});
		visGrid[py][px] = true;
		if( xray || blind ) return visGrid;

		let rayCircle = new RayCircle( senseSight * senseSight );
		let atCenter = true;

		let onVisit = (arc,x,y) => {
			let isVisible = atCenter || rayCircle.arcTest( arc.left, arc.right, arc.nearDist, arc.span*0.05 );
			if( !isVisible ) return;

			if( mapMemory && map.getLightAt(x,y,0) > 0 ) {
				let pos = y*xLen+x;
				let tile = map.tileTypeGet(x,y);
				let temp = itemLookup[pos];
				let item = temp ? temp[0] : null;
				if( item && item.invisible && !senseInvisible ) {
					item = null;
				}
				mapMemory[pos] = item ? item : tile;
			}
			visGrid[y][x] = true;

			let opacityHere = this.opacityLookup[y*xLen+x];
			if( opacityHere>0 && !atCenter ) {
				rayCircle.arcSet( arc.left, arc.right, arc.dist, opacityHere );
			}
			atCenter = false;
		}
		arcListTraverse( this.arcList, map, px, py, senseSight, onVisit );

		return visGrid;
	}
}

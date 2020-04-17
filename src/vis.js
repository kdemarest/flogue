Module.add('vis',function() {

class Vis {
	constructor(getMapFn) {
		this.getMapFn = getMapFn;
		this.opacityLookup = [];	// Warning! The Light.Caster needs this to not change.
		this.populateOpacityLookup();
		//this.shootCache = {};
	}
	populateOpacityLookup() {
		let map = this.getMapFn();
		console.assert(map);
		map.traverse( (x,y) => {
			this._visSet( map, x, y, map.tileTypeGet(x,y).opacity||0 );
		});
		map.itemList.forEach( item => {
			let x = Math.toTile(item.x);
			let y = Math.toTile(item.y);
			this._visSet( map, x, y, Math.max( this._visGet(map,x,y), item.opacity||0 ) );
		});
	}
	// For internal use only
	_visGet(map,x,y) {
		if( !map.inBounds(x,y) ) {
			return false;
		}
		return this.opacityLookup[y*map.xLen+x];
	}
	// For internal use only
	_visSet(map,x,y,opacity) {
		if( !map.inBounds(x,y) ) {
			return false;
		}
		return this.opacityLookup[y*map.xLen+x] = opacity;
	}
	flush(visGrid) {
		// maybe we will never need this. It would flush the opacityLookup.
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

	calcVis(px,py,senseSight,senseDarkVision,blind,xrayDist,senseInvisible,visGrid,mapMemory) {		

		function canSee(x,y) {
			return map.getLightAt(x,y,0) > 0 || Distance.isNear(x-px,y-py,senseDarkVision+0.5);
		}
		function remember(x,y) {
			let tile = map.tileTypeGet(x,y);
			let temp = map.itemLookupGet(x,y);
			let item = temp ? temp[0] : null;
			if( item && item.invisible && !senseInvisible ) {
				item = null;
			}
			console.assert(x==Math.floor(x));
			let pos = Math.floor(y)*xLen+Math.floor(x);
			mapMemory[pos] = item ? item : tile;
		}

		px = Math.toTile(px);
		py = Math.toTile(py);

		let map = this.getMapFn();
		let xLen = map.xLen;
		senseDarkVision = senseDarkVision || 0;

		visGrid = visGrid || [];

		// Start everything hidden by default, unless we have xray vision and are not blind.
		// With xray and not blind, this will all be set to true.
		// If either one is set we can leaver early.
		map.traverse( (x,y) => {
			visGrid[y] = visGrid[y] || [];
			visGrid[y][x] = false;
		});

//		map.traverseNear( x, y, senseSight, (x,y) => {
//			let visible = !blind && Distance.isNear(x-px,y-py,xrayDist);
//			visGrid[y][x] = visible;
//			// With xRay vision I get to remember everything I can see through walls.
//			if( visible && mapMemory && canSee(x,y) && x>=px-senseSight && y>=py-senseSight && x<=px+senseSight && y<=py+senseSight ) {
//				remember(x,y);
//			}
//		});

		visGrid[py][px] = true;
		if( mapMemory ) { remember(px,py); }
		if( blind ) return visGrid;

		let rayCircle = new Light.RayCircle( senseSight * senseSight );
		let atCenter = true;

		let numVisible = 0;
		let onVisit = (arc,x,y) => {
			let isVisible = atCenter || rayCircle.arcTest( arc.left, arc.right, arc.nearDist, arc.span*0.05 );
			let isXray    = false;
			if( !isVisible && xrayDist ) {
				isXray = Distance.isNear(x-px,y-py,xrayDist);
			}
			if( !isVisible && !isXray ) return;

			if( mapMemory && canSee(x,y) ) {
				remember(x,y);
			}
			visGrid[y][x] = true;
			++numVisible;

			let opacityHere = this.opacityLookup[y*xLen+x];
			if( opacityHere>0 && !atCenter ) {
				rayCircle.arcSet( arc.left, arc.right, arc.dist, opacityHere );
			}
			atCenter = false;
		}
		Light.arcListTraverse( map, px, py, senseSight, onVisit );
		return visGrid;
	}
}

return {
	Vis: Vis
}


});
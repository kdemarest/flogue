Module.add('vis',function() {

class Vis {
	constructor(getMapFn) {
		this.getMapFn = getMapFn;
		this.opacityLookup = [];	// Warning! The Light.Caster needs this to not change.
		this.populateLookup();
		this.shootCache = {};
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

		let rayCircle = new Light.RayCircle( senseSight * senseSight );
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
		Light.arcListTraverse( map, px, py, senseSight, onVisit );

		return visGrid;
	}
}

return {
	Vis: Vis
}


});
function RayCircle(maxDist) {
	let sweep = [];
	let opacity = [];
	for( let i=0 ; i<360 ; ++i ) {
		sweep[i] = maxDist;
		opacity[i] = 0;
	}

	function arcTest( left, right, nearDist, unitsRequired ) {
		// The block only needs to be 20% visible to be considered visible.
		for( let i = left ; i!=right ; i = (i+1) % 360 ) {
			// This angle of arc isn't blocked closer to the origin yet,
			// and the square we're passing through is not opaque
			if( sweep[i] >= nearDist || opacity[i] < 1 ) {
				--unitsRequired;
				if( unitsRequired<=0 ) {
					// We are visible enough (defined by v's initial value) so stop checking
					break;
				}
			}
		}
		if( unitsRequired > 0 ) {
			// This square is not visible.
			return false;
		}
		return true;
	}

	function arcSet( left, right, dist, opacityHere ) {
		let i = left;
		while( i!=right ) {
			sweep[i] = Math.min(sweep[i],dist);
			opacity[i] += opacityHere;
			i = (i+1) % 360;
		}
	}
	return {
		arcTest: arcTest,
		arcSet: arcSet
	}
}


class LightCaster {
	constructor() {
		this.opacityLookup = null;;
		this.lightMap = [];
		this.arcList = arcListGenerate();
	}
	cast(map,opacityLookup,x,y,light) {
		console.assert( map && opacityLookup );
		let maxReach = Math.abs(light);
		let xLen = map.xLen;
		let rayCircle = new RayCircle( maxReach*maxReach );
		let atCenter = true;

		arcListTraverse( this.arcList, map, x, y, maxReach, (arc, x, y, xRel, yRel) => {
			let lightReaches = atCenter || rayCircle.arcTest( arc.left, arc.right, arc.nearDist, arc.span*0.05 );
			if( !lightReaches ) return;

			let pos = y*xLen+x;
			let value = this.lightMap[pos] || 0;
			if( light < 0 ) {
				value = Math.max( light, value + Math.min(0,light+arc.dist+0.3) );
			}
			else {
				value = Math.max( value, light+1-arc.dist+0.5 );
			}
			this.lightMap[pos] = value;

			let opacityHere = opacityLookup[pos];
			if( opacityHere>0 && !atCenter ) {
				rayCircle.arcSet( arc.left, arc.right, arc.dist, opacityHere );
			}
			atCenter = false;
		});
	}

	gather(lightList,darkList,entityList) {
		entityList.forEach( entity => {
			if( entity.light > 0 ) lightList.push(entity);
			if( entity.dark  > 0 ) darkList.push(entity);
		});
	}

	castAll(map,opacityLookup,entityList,itemList,animList) {
		console.assert( map && opacityLookup && entityList && itemList && animList );
		this.lightMap = [];
		let lightList = [];
		let darkList = [];
		this.gather( lightList, darkList, entityList );
		this.gather( lightList, darkList, itemList );
		this.gather( lightList, darkList, animList );

		map.traverse( (x,y,tile) => tile.light > 0 ? this.cast( map, opacityLookup, x, y, tile.light ) : null );
		lightList.forEach( e => this.cast( map, opacityLookup, e.x, e.y, e.light ) );

		map.traverse( (x,y,tile) => tile.dark > 0 ? this.cast( map, opacityLookup, x, y, -tile.dark ) : null );
		darkList.forEach( e => this.cast( map, opacityLookup, e.x, e.y, -e.dark ) );
	}
}



Module.add('viewRange',function() {

class ViewRange extends ViewObserver {
	constructor() {
		super();
		this.xOfs = 0;
		this.yOfs = 0;
		this.picking = null;
	}
	get active() {
		return true;	// this.active = this.visibleFn && this.visibleFn();
	}
	moveByKeyboard(xAdd,yAdd) {
		let xOfs = this.xOfs + xAdd;
		let yOfs = this.yOfs + yAdd;
		this.moveToOfs(xOfs,yOfs);
	}
	moveByMouse(xOfs,yOfs) {
		this.moveToOfs(xOfs,yOfs);
	}
	moveToOfs(xOfs,yOfs) {
		let observer = this.observer;
		if( !observer ) {
			debugger;
			return;
		}

		if( !observer.map.inBounds(observer.x+xOfs,observer.y+yOfs) ) {
			return;
		}

		this.xOfs = xOfs;
		this.yOfs = yOfs;


		let area = observer.area;
		let tx = observer.x + this.xOfs;
		let ty = observer.y + this.yOfs;

		let entity = null;
		if( this.picking ) {
			let isShotClear,inRange;
			[isShotClear,inRange] = this.determineShot(observer.map,observer.x,observer.y,tx,ty);
			entity = 
				new Finder(area.entityList,observer).isAt(tx,ty).canTargetEntity().first || 
				new Finder(area.map.itemList,observer).isAt(tx,ty).canTargetEntity().first || 
				area.map.getTileEntity(tx,ty);

			this.picking.rangeStatusFn({
				isShotClear: isShotClear,
				inRange: inRange,
				xOfs: this.xOfs,
				yOfs: this.yOfs
			});
		}
		else {
			entity = 
				new Finder(area.entityList,observer).isAt(tx,ty).canPerceiveEntity().first || 
				new Finder(area.map.itemList,observer).isAt(tx,ty).canPerceiveEntity().first || 
				area.map.getTileEntity(tx,ty);
		}

		console.assert( entity );

		guiMessage( 'showInfo', { entity: entity, from: 'viewRange' } );
		if( entity.isMonsterType ) {
			console.log( entity.history.join('\n') );
		}

		let mapAsk = ''+this.xOfs+','+this.yOfs;
		if( this.lastMapAsk != mapAsk ) {
			console.log('range moved');
			this.dirty = true;
			this.lastMapAsk = mapAsk;
		}
	}
	unprime() {
		this.picking.rangeStatusFn({
			isShotClear: true,
			inRange: true,
			xOfs: 0,
			yOfs: 0
		});
		this.picking = null;
		this.dirty = true;
	}

	prime(payload) {
		let entity     = this.observer;
		let wasPicking = !!this.picking;
		let picking    = Object.assign({},payload);
		if( !wasPicking ) {
			let autoTarget;
			if( picking.autoTargetMe ) {
				autoTarget = entity;
			}
			else {
				autoTarget =
					entity.findAliveOthersNearby().isId(entity.lastAttackTargetId).canTargetEntity().nearMe(picking.rangeLimit).first ||
					entity.findAliveOthersNearby().isMyEnemy().canTargetEntity().nearMe(picking.rangeLimit).byDistanceFromMe().first ||
					entity.findAliveOthersNearby().isNotMyFriend().canTargetEntity().nearMe(picking.rangeLimit).byDistanceFromMe().first;
			}
			this.picking = picking;
			let xOfs = autoTarget ? autoTarget.x-entity.x : 0;
			let yOfs = autoTarget ? autoTarget.y-entity.y : 0;
			this.moveToOfs(xOfs,yOfs);
		}
		this.dirty = true;
	}
	message( msg, payload ) {
		super.message(msg,payload);
		if( msg == 'viewRangePrime' ) {
			this.prime(payload);
		}
		if( msg == 'viewRangeUnprime' ) {
			this.unprime();
		}
		if( msg == 'viewRangeKeyboard' ) {
			let dir = payload;
			this.moveByKeyboard(Direction.add[dir].x,Direction.add[dir].y);
		}
		if( msg == 'viewRangeMouse' ) {
			this.moveByMouse(payload.xOfs,payload.yOfs); //(payload.xOfs-this.xOfs,payload.yOfs-this.yOfs);
		}
	}

	determineShot(map,sx,sy,tx,ty,draw=null) {
		let test = (x,y) => {
			return map.tileTypeGet(x,y).mayFly;
		}
		let add = (x,y,ok) => {
			let xOfs = x-this.observer.x;
			let yOfs = y-this.observer.y;
			if( this.picking && Math.abs(xOfs) > this.picking.rangeLimit || Math.abs(yOfs) > this.picking.rangeLimit ) {
				inRange = false;
				ok = false;
			}
			draw ? draw(x,y,ok) : null;
			isShotClear = isShotClear && ok;
		}
		let inRange = true;
		let isShotClear = true;
		shootRange(sx,sy,tx,ty,test,add);
		return [isShotClear,inRange];
	}

	drawRange(map,sx,sy,tx,ty) {
		let area = this.observer.area;
		function draw(x,y,ok) {
			guiMessage('overlayAdd',{
				groupId: 'viewRangePicking',
				x:x,
				y:y,
				area:area,
				img:StickerList[ok?'crosshairYes':'crosshairNo'].img
			});
		}
		this.determineShot(map,sx,sy,tx,ty,draw);
	}

	render() {
		let observer = this.observer;

		// This just erases all the matching sprites
		guiMessage( 'overlayRemove', { groupId: 'viewRangePicking', note: 'from viewRange' } );
		if( this.picking ) {
			//console.log("crosshair at "+(observer.x+this.xOfs)+','+(observer.y+this.yOfs));
			//console.log('drawRange');
			this.drawRange(observer.map,observer.x,observer.y,observer.x+this.xOfs,observer.y+this.yOfs);
		}
	}
}

return {
	ViewRange: ViewRange
}

});

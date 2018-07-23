Module.add('viewRange',function() {

class ViewRange extends ViewObserver {
	constructor() {
		super();
		this.xOfs = 0;
		this.yOfs = 0;
		this.visibleFn = null;
		this.rangeLimit = 0;
		this.active = false;
	}
	clear() {
		this.xOfs = 0;
		this.yOfs = 0;
		guiMessage('overlayRemove',{groupId: 'guiCrosshair'});
		this.isShotClear = false;
	}
	move(xAdd,yAdd) {
		let x = this.xOfs + xAdd;
		let y = this.yOfs + yAdd;
		if( Math.abs(x) > this.rangeLimit || Math.abs(y) > this.rangeLimit ) {
			return false;
		}
		this.xOfs = x;
		this.yOfs = y;

		if( this.observer ) {
			let observer = this.observer;
			let area = observer.area;
			x = observer.x + x;
			y = observer.y + y;
			if( observer.canTargetPosition(x,y) ) {
				let entity = 
					new Finder(area.entityList,observer).canTargetEntity().shotClear().at(x,y).first || 
					new Finder(area.map.itemList,observer).canTargetEntity().shotClear().at(x,y).first || 
					adhoc(area.map.tileTypeGet(x,y),area.map,x,y);
				//console.log( "viewRange is showing "+entity.name );
				guiMessage('show',entity);
			}
		}
	}
	prime(rangeLimit,cmd,visibleFn) {
		let entity = this.observer;
		this.visibleFn = visibleFn;
		this.rangeLimit = rangeLimit;
		if( !this.active ) {
			let target;
			if( cmd.commandItem && cmd.commandItem.effect && cmd.commandItem.effect.isHelp ) {
				target = entity;
			}
			else {
				target =
					entity.findAliveOthersNearby().isId(entity.lastAttackTargetId).canTargetEntity().nearMe(this.rangeLimit).first ||
					entity.findAliveOthersNearby().isMyEnemy().canTargetEntity().nearMe(this.rangeLimit).byDistanceFromMe().first ||
					entity.findAliveOthersNearby().isNotMyFriend().canTargetEntity().nearMe(this.rangeLimit).byDistanceFromMe().first;
			}
			if( target ) {
				this.xOfs = target.x-entity.x;
				this.yOfs = target.y-entity.y;
			}
			else {
				this.xOfs = 0;
				this.yOfs = 0;
			}
			this.move(0,0);
		}
	}
	message( msg, payload ) {
		super.message(msg,payload);
		if( msg == 'pick' ) {
			this.active = this.visibleFn && this.visibleFn();
			if( this.active ) {
				this.move(payload.xOfs-this.xOfs,payload.yOfs-this.yOfs);
			}
		}
	}

	drawRange(map,sx,sy,tx,ty) {
		let self = this;
		this.isShotClear = true;
		let area = this.observer.area;
		function test(x,y) {
			return map.tileTypeGet(x,y).mayFly;
		}
		function add(x,y,ok) {
			guiMessage('overlayAdd',{ groupId: 'guiCrosshair', x:x, y:y, area:area, img:StickerList[ok?'crosshairYes':'crosshairNo'].img });
			self.isShotClear = self.isShotClear && ok;
		}
		shootRange(sx,sy,tx,ty,test,add);
	}

	render() {
		let observer = this.observer;
		guiMessage( 'overlayRemove', { groupId: 'guiCrosshair' } );
		this.active = this.visibleFn && this.visibleFn();
		if( !this.active && this.activeLast ) {
			// sadly this is the only way to know that we're no longer showing the range...
			guiMessage('hide');
		}
		if( this.active ) {
			//console.log("crosshair at "+(observer.x+this.xOfs)+','+(observer.y+this.yOfs));
			console.log('drawRange');
			this.drawRange(observer.map,observer.x,observer.y,observer.x+this.xOfs,observer.y+this.yOfs);
		}
		this.activeLast = this.active;
	}
}

return {
	ViewRange: ViewRange
}

});

Module.add('eSprite',function() {

class EntitySprite extends Sprite {
	constructor() {
		super();
		this.entity = null;
		this.age	= 0
	}

	get id() {
		return this.entity.id;
	}

	get area() {
		return this.entity.area;
	}

	get xWorld() {
		return this.entity.x;
	}

	get yWorld() {
		return this.entity.y;
	}

	get xWorldTile() {
		return Math.toTile(this.xWorld);
	}

	get yWorldTile() {
		return Math.toTile(this.yWorld);
	}

	get isDarkVision() {
		return this.observer.senseDarkVision && !this.isMemory;
	}

	testLight() {
		let revealLight = 7;		// Assumes max light is about 10.
		let glowLight   = MaxVis;
		let memoryLight = 1;

		if( this.entity.isTreasure && this.observer.senseTreasure ) {
			return revealLight;
		}

		if( this.entity.isLiving && this.observer.senseLiving ) {
			return revealLight;
		}

		let lPos = this.entity.map.lPos(this.xWorldTile,this.yWorldTile);
		let light = this.entity.map.area.lightCaster.lightMap[lPos] || 0;
		let lightAfterGlow = this.entity.glow ? Math.max(light,glowLight) : light;
		return lightAfterGlow;
	}

	testMemory() {
		console.assert(this.entity.area.id==this.observer.area.id);
		let mPos = this.entity.map.lPos(this.xWorld,this.yWorld);
		return this.observer.mapMemory && this.observer.mapMemory[mPos];
	}

	testSensed() {
		// Order matters here.
		if( this.entity.id == this.observer.id ) return true;
		if( this.observer.senseTreasure && this.entity.isTreasure ) return true;
		if( this.observer.senseLiving && this.entity.isLiving ) return true;
		if( this.observer.senseSmell && (this.entity.scentReduce||0)<100 && this.observer.nearTarget(this.entity,1.5) ) return true;

		if( !this.observer.senseInvisible && this.entity.invisible ) return false;
		if( this.observer.senseBlind ) return false;

		return !this.observer.visCache ? false : this.observer.visCache[this.yWorldTile][this.xWorldTile];
	}
	
	updateMovement(dt) {
		if( this.entity.xMove === undefined ) {
			return;
		}
		if( this.entity.moveInstantly ) {
			this.xVisual    = this.entity.xMove;
			this.yVisual    = this.entity.yMove;
			// Don't clear moveInstantly yet. We might care later how we got here.
		}
		if( this.xVisual!=this.entity.xMove || this.yVisual!=this.entity.yMove ) {
			let dx = this.entity.xMove-this.xVisual;
			let dy = this.entity.yMove-this.yVisual;
			let dist = Distance.get(dx,dy);
			let tilesPerSecond = this.entity.speedMove;
			let travel = dt*tilesPerSecond;
			if( dist < travel ) {
				this.xVisual = this.entity.xMove;
				this.yVisual = this.entity.yMove;
			}
			else {
				this.xVisual += (dx/dist)*travel;
				this.yVisual += (dy/dist)*travel;
			}
		}
		if( this.entity.isUser ) {
			this.entity.xVisualOrigin = this.xVisual;
			this.entity.yVisualOrigin = this.yVisual;
		}
	}

	updatePixiSprite(pane) {
		super.updatePixiSprite(pane);

		if( this.entity.spriteDirty ) {
			this.pixiSprite.texture = ImageRepo.getResourceByImg( ImageRepo.getImg(this.entity) ).texture;
			this.entity.spriteDirty = false;
		}

		if( this.entity.invisible != this.pixiSprite._invisible ) {
			this.pixiSprite.texture =
				ImageRepo.getResourceByImg(
					this.entity.invisible ? 
					StickerList.invisibleObserver.img :
					ImageRepo.getImg(this.entity)
				).texture
			;
			this.pixiSprite._invisible = this.entity.invisible;
		}

		if( this.sensed ) {
			this.pixiSprite.filters = ViewMap.saveBattery ? null : this.isDarkVision ? this.desaturateFilterArray : this.resetFilterArray;
			this.pixiSprite.tint = 0xFFFFFF;
		}
		else if( this.memoried ) {
			this.pixiSprite.filters = ViewMap.saveBattery ? null : this.desaturateFilterArray;
			this.pixiSprite.tint = 0x8888FF;
		}

	}

	init(entity) {
		console.assert(entity);
		this.watch = this.watch || entity.watch;

		this.entity  = entity;
		this.xVisual = entity.x;
		this.yVisual = entity.y;

		this.initSpriteByImg( ImageRepo.getImg(entity) );

		this.xAnchor    = entity.xAnchor || 0.5;
		this.yAnchor    = entity.yAnchor || 0.5;
		this.scale		= entity.scale || 1;
		this.alpha  	= entity.alpha===undefined ? 1.0 : entity.alpha;
		this.zOrder     = entity.zOrder || (entity.isWall ? Tile.zOrder.WALL : (entity.isFloor ? Tile.zOrder.FLOOR : (entity.isTileType ? Tile.zOrder.TILE : (entity.isItemType ? (entity.isGate ? Tile.zOrder.GATE : (entity.isDecor ? Tile.zOrder.DECOR : Tile.zOrder.ITEM)) : (entity.isMonsterType ? Tile.zOrder.MONSTER : Tile.zOrder.OTHER)))));
		return this;
	}

	tick(dt,observer,pane) {

		if( this.entity.watch ) {
			let a = 1;
		}

		if( this.dead ) {
			return;
		}

		if( this.entity.dead ) {
			return this.die('my entity was dead');
		}

		this.observer = observer;

		if( this.area.id !== this.observer.area.id ) {
			return this.die('out of area');
		}

		if( this.entity.isItemType && !this.entity.owner.isMap ) {
			return this.die('item no longer on map');
		}

		this.inPane = pane.inSightOf(this.observer,this.entity.x,this.entity.y) && this.entity.area.id==this.observer.area.id;

		this.updateMovement(dt);

		if( this.inPane ) {
			this.age = 0;

			let light = Math.floor(this.testLight());
			console.assert(Light.Alpha[light]!==undefined);
			this.alpha = Light.Alpha[Math.floor(light)];

			this.sensed   = this.testSensed();
			this.memoried = this.sensed ? false : this.testMemory();
			this.visible  = this.sensed || this.memoried;
			console.watchSprite( this, 'in Pane. visible='+this.visible );
		}
		else {
			this.visible = false;
			console.watchSprite( this, 'out of Pane.' );
			this.age += dt;
			let ageOfDeath = 5;
			if( this.age > ageOfDeath ) {
				return this.die('old age');
			}
		}

		this.updatePixiSprite(pane);
	}
}

return {
	EntitySprite: EntitySprite
}

});

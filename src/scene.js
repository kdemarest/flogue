Module.add('scene',function() {


class Pane {
	constructor() {
		this.tileDim     = 32;
		this._visionTiles = null;	// was .sd
	}
	get visionTiles() {
		return this._visionTiles;
	}
	set visionTiles(value) {
		console.assert( !isNaN(value) );
		this._visionTiles = value;
	}
	get sizeInTiles() {				// was .d
		return this.visionTiles*2+1;
	}
	get widthInTiles() {
		return this.sizeInTiles;
	}
	get heightInTiles() {
		return this.sizeInTiles;
	}
	get widthInPixels() {
		return this.tileDim * this.widthInTiles;
	}
	get heightInPixels() {
		return this.tileDim * this.heightInTiles;
	}
	inSightOf(observer,x,y) {
		let d = this.sizeInTiles / 2.0;
		return x>=observer.x-d && x<=observer.x+d && y>=observer.y-d && y<=observer.y+d;
	}
}

class Scene extends ViewObserver {
	constructor() {
		super();
		this.pane  		= new Pane();
		this.spriteList = {};
	}

	get area() {
		return this.observer.area;
	}

	get map() {
		return this.area.map;
	}

	get visionTiles() {
		return this.pane.visionTiles;
	}

	configureDimensions(width,height,mapVis) {

		let smallestDim = Math.min(width,height);
		let mapTileDim  = mapVis*2+1;

		this.pane.tileDim     = Math.floor(smallestDim / mapTileDim);
		this.pane.visionTiles = mapVis;
	}

	get stage() {
		console.assert(false);
	}

	spriteExists( id ) {
		return this.spriteList[id];
	}

	spriteAdd( sprite ) {
		console.assert( sprite.id );
		console.assert( !this.spriteExists(sprite.id) );
		this.spriteList[sprite.id] = sprite;
		if( this.spriteList[sprite.id].watch ) {
			console.watchSprite( this, 'spriteAdd('+sprite.id+')');
		}
	}

	spriteRemove( sprite ) {
		console.assert( this.spriteExists(sprite.id) );
		delete this.spriteList[sprite.id];
	}

	spriteGetById(id) {
		return this.spriteList[id];
	}

	spriteFromEntity(entity) {
		if( !this.spriteExists(entity.id) ) {
			this.spriteAdd( new EntitySprite().init(entity) );
		}
		return this.spriteGetById(entity.id);
	}

	entitySpriteSetMember(entity,member,value) {
		let sprite = this.spriteGetById(entity.id);
		if( !sprite ) {
			return false;
		}
		sprite[member] = value;
	}

	traverse(fn) {
		Object.each( this.spriteList, fn );
	}

	changeArea(area,areaPrior) {
		// Technically this shouldn't be needed, because the sprite can check it just as well.
		this.traverse( sprite => sprite.dead = (sprite.dead || sprite.area.id!=area.id) ); 
	}

	prune() {
		this.traverse( (sprite,id) => sprite.dead ? this.spriteRemove(sprite) : null );
	}

	check(entity) {
		let inPane = this.pane.inSightOf(this.observer,entity.x,entity.y) && entity.area.id==this.observer.area.id;
		if( inPane ) {
			this.spriteFromEntity(entity);
		}
	}

	checkMap() {
		this.map.traverseNear( this.observer.x, this.observer.y, this.visionTiles, (x,y) => {
			let entity = this.map.getTileEntity(x,y);
			this.check(entity);
		});
	}

	checkEnterTile() {
return;
		let ofs = (observer.senseSmell && (observer.sensePerception || observer.senseAlert)) ? 0.2 : 0;
		handleScent(
			map,
			this.observer.x,
			this.observer.y,
			observer.senseSmell,
			ofs,
			observer.visibilityDistance
		);
		handlePerception(
			observer,
			visCache,
			map,
			this.observer.x,
			this.observer.y,
			observer.sensePerception,
			observer.senseAlert,
			ofs
		);
	}

	checkAll() {
		//console.log('checkAll');

		this.checkEnterTile();

		this.area.entityList.forEach( entity => {
			this.check(entity);
		});

		this.area.map.itemList.forEach( item => {
			this.check(item);
		});

		this.checkMap();

	}

	sceneEntityNotice(entity) {
		if( entity.watch ) {
			console.watchSprite( entity, 'sceneEntityNotice('+entity.id+')');
		}
		// The word 'moved' means that it changed states onto or off of the map.
		if( entity.isUser ) {
			this.checkAll();
			return;
		}
		this.check(entity);
	}

	message(msg,payload) {
		super.message(msg,payload);

		if( msg == 'dirty' ) {
			debugger;	// The payload is an entity whose sprite we want to poke.
		}
		if( msg == 'sceneEntityNotice' ) {
			if( this.observer ) {
				this.sceneEntityNotice(payload);
			}
		}
		if( msg == 'changeArea' ) {
			this.changeArea(payload.area,payload.areaPrior);
		}
		if( msg == 'spriteAdd' ) {
			this.spriteAdd( payload );
		}
		if( msg == 'spriteRemove' ) {
			this.spriteRemove( payload );
		}
		if( msg == 'spriteSetMember' ) {
			console.assert( payload.entity && payload.member && payload.value!==undefined );
			this.entitySpriteSetMember( payload.entity, payload.member, payload.value );
		}
		if( msg == 'sceneFn' ) {
			payload(this);
		}
	}

	getOrderedSpriteList(spriteList) {
		let list = [];
		let done = {};
		let addWithDependency = sprite => {
			if( done[sprite.id] ) return;
			if( sprite.dependsOn ) {
				if( sprite.watch ) {
					//console.log( 'Sprite '+sprite.id+' depends on '+sprite.dependsOn.id );
				}
				addWithDependency( sprite.dependsOn );
			}
			list.push(sprite);
		}
		Object.each( spriteList, addWithDependency );
		return list;
	}

	tick(dt) {

/*
		for anim in animList {
			let light = observer.isSpectator ? maxLight : tile[0];
			anim.drawUpdate(observer.x-this.sd, observer.y-this.sd, light, this.app.stage.addChild);
		}
*/
		if( this.dirty ) {
			this.checkAll();
		}

		// Put newbs on stage, or cull any that are too old.
		this.prune();

		// Update values into the sprites themselves
		let list = this.getOrderedSpriteList( this.spriteList );

		list.forEach( entitySprite => {
			entitySprite.tick(dt,this.observer,this.pane);
		});

		// Some will be newly self-killed, so prune again...
		this.prune();
	}
}

return {
	Pane: Pane,
	Scene: Scene
}

});

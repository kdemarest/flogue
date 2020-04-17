Module.add('sprite',function() {

class Sprite {
	constructor() {
		this.xVisual   = 0;
		this.yVisual   = 0;
		this.pixiSprite = null;
		this.xAnchor   = 0.5;
		this.yAnchor   = 0.5;
		this.scale     = 1.0;
		this.alpha     = 1.0;
		this.zOrder    = Tile.zOrder.WALL;
		this.observer  = null;
		this.inPane    = false;
		this.dead      = false;
	}

	get id() {
		console.assert(false);
	}

	get scene() {
		console.assert(false);
	}

	get xVisualOrigin() {
		return this.observer.xVisualOrigin===undefined ? this.observer.x : this.observer.xVisualOrigin;
	}

	get yVisualOrigin() {
		return this.observer.yVisualOrigin===undefined ? this.observer.y : this.observer.yVisualOrigin;
	}

	get visible() {
		return this.pixiSprite.visible;
	}

	set visible(value) {
		this.pixiSprite.visible = value;
	}

	initSpriteByImg(img) {
		this.pixiSprite  = new PIXI.Sprite( ImageRepo.getResourceByImg(img).texture );
	}

	updatePixiSprite(pane) {
		console.assert( !this.dead );
		if( this.watch ) {
			console.log('updatePixiSprite('+this.id+')');
		}
		this.pixiSprite.x = (this.xVisual-this.xVisualOrigin)*pane.tileDim+pane.sizeInTiles/2*pane.tileDim;
		this.pixiSprite.y = (this.yVisual-this.yVisualOrigin)*pane.tileDim+pane.sizeInTiles/2*pane.tileDim;

		this.pixiSprite.zOrder  = this.zOrder;
		this.pixiSprite.alpha   = this.alpha;

		this.pixiSprite.anchor.set(this.xAnchor,this.yAnchor);
		this.pixiSprite.transform.scale.set( this.scale * pane.tileDim/this.pixiSprite._texture.width );

	}

	tick(dt,observer,pane) {
		console.assert(false);
	}

}

return {
	Sprite: Sprite
}

});

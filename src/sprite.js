Module.add('sprite',function() {

class Sprite {
	constructor() {
		this.xVisual   = 0;
		this.yVisual   = 0;
		this.sprite    = null;
		this.xAnchor   = 0.5;
		this.yAnchor   = 0.5;
		this.scale     = 1.0;
		this.alpha     = 1.0;
		this.zOrder    = Tile.zOrder.WALL;
		this.visible   = true;
		this.observer  = null;
		this.inPane    = false;
		this.dead      = false;
		this.age       = 0;
	}
	get xVisualOrigin() {
		return this.observer.xVisualOrigin===undefined ? this.observer.x : this.observer.xVisualOrigin;
	}

	get yVisualOrigin() {
		return this.observer.yVisualOrigin===undefined ? this.observer.y : this.observer.yVisualOrigin;
	}

	initSpriteByImg(img) {
		this.sprite  = new PIXI.Sprite( ImageRepo.getResourceByImg(img).texture );
	}

	updateSprite(pane) {
		console.assert( !this.dead );
		this.sprite.x = (this.xVisual-this.xVisualOrigin)*pane.tileDim+pane.sizeInTiles/2*pane.tileDim;
		this.sprite.y = (this.yVisual-this.yVisualOrigin)*pane.tileDim+pane.sizeInTiles/2*pane.tileDim;

		this.sprite.zOrder  = this.zOrder;
		this.sprite.alpha   = this.alpha;
		this.sprite.visible = this.visible;

		this.sprite.anchor.set(this.xAnchor,this.yAnchor);
		this.sprite.transform.scale.set( this.scale * Tile.DIM/this.sprite._texture.width );

	}

	update(dt,observer,pane) {
		console.assert(false);
	}

}

return {
	Sprite: Sprite
}

});

class AniPaste {
	constructor(data) {
		Object.assign(this,data);
		this.isAnimation = true;
		this.dead = false;
		this.alpha = this.sticker.alpha===undefined ? 1 : this.sticker.alpha;
		this.scale = this.sticker.scale || 1;
		this.xAnchor = this.sticker.xAnchor===undefined ? 0.5 : this.sticker.xAnchor;
		this.yAnchor = this.sticker.yAnchor===undefined ? 0.5 : this.sticker.yAnchor;
	}
	xGet() {
		return (this.entity ? this.entity.x : this.x) + (this.xOfs||0);
	}
	yGet() {
		return (this.entity ? this.entity.y : this.y) + (this.yOfs||0);
	}
	imgGet() {
		if( this.dead ) {
			return null;
		}
		return this.sticker.img;
	}
	die() {
		this.dead = true;
		animationDeathCallback(this.sprite);
	}
	tick(delta) {
		if( this.dead ) {
			return;
		}
		if( this.onTick ) {
			this.onTick.call(this,delta);
		}
		if( this.duration !== true ) {
			this.duration -= delta;
			if( this.duration <= 0 ) {
				this.die();
			}
		}
	}
}


let animationList = [];
let animationDeathCallback;
function animationAdd(anim) {
	animationList.push(anim);
	return anim;
}
function animationRemove(fn) {
	animationList.map( anim => { if( fn(anim) ) anim.die(); } );
}
function animationTick(delta) {
	animationList.map( anim => anim.tick(delta) );
	Array.filterInPlace( animationList, anim => !anim.dead );
}

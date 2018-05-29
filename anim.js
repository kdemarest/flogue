class AniPaste {
	constructor(data) {
		let init = {
			alpha: data.sticker.alpha===undefined ? 1 : data.sticker.alpha,
			scale: data.sticker.scale || 1,
			xAnchor: data.sticker.xAnchor===undefined ? 0.5 : data.sticker.xAnchor,
			yAnchor: data.sticker.yAnchor===undefined ? 0.5 : data.sticker.yAnchor
		};
		Object.assign(this,init,data);
		this.isAnimation = true;
		this.dead = false;
	}
	xGet() {
		return (this.entity ? this.entity.x : this.x);
	}
	yGet() {
		return (this.entity ? this.entity.y : this.y);
	}
	imgGet(self) {
		if( self.dead ) {
			return null;
		}
		return self.sticker.img;
	}
	die() {
		this.dead = true;
		spriteDeathCallback(this.spriteList);
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

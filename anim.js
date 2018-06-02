let deltaToDeg = function(dx,dy) {
	// WARNING!!! This should really be -dy. BUT since the world itself is already upside down, we flip dy AGAIN.
	let rad = Math.atan2(dy,dx);	// yes, y param first.
	return toDeg(rad);
}
let toDeg = function(rad) {
	return -rad/(2*Math.PI)*360+90;
}
let toRad = function(deg) {
	return -deg/360*2*Math.PI+(Math.PI/2);
}
let sScale = function(a) {
	this.scale._x += this.delta*a;
	this.scale._y += this.delta*a;
	return this;
}
let sScaleSet = function(absScale) {
	this.scale._x = absScale;
	this.scale._y = absScale;
	return this;
}
let sReset = function() {
	this.rx = 0;
	this.ry = 0;
	this.qx = 0;
	this.qy = 0;
}
let sPos = function(x,y) {
	this.rx = x;
	this.ry = y;
	return this;
}
let sPosDeg = function(deg,dist) {
	let rad = toRad(deg);
	this.rx = Math.cos(rad)*dist;
	this.ry = Math.sin(rad)*dist;
	return this;
}
let sMove = function(dx=this.xVel,dy=this.yVel) {
	this.rx += this.delta*dx;
	this.ry += this.delta*dy;
	return this;
}
let sQuiver = function(rate,range=0.5) {
	this.quiver = (this.quiver||0) - this.delta;
	if( this.quiver <= 0 ) {
		let rad = Math.rand(0,2*Math.PI);
		this.qx = Math.cos(rad)*range;
		this.qy = Math.sin(rad)*range;
		this.quiver += rate;
	}
	return this;
}
let sVel = function(deg,vel) {
	this.deg = deg;
	this.vel = vel * 32;
	this.xVel = (this.xVel||0) + Math.cos(toRad(deg)) * vel;
	this.yVel = (this.yVel||0) + Math.sin(toRad(deg)) * vel;
	return this;
}

//(10,5) in 4 seconds
//(10/11.18) / 4
//(5/11.18) / 4

let sVelTo = function(dx,dy,duration) {
	this.xVel = (this.xVel||0) + dx/duration;
	this.yVel = (this.yVel||0) + dy/duration;
	return this;
}
let sGrav = function(amt) {
	this.yVel += this.delta*amt;
	return this;
}
let sAlpha = function(amt) {
	this.alphaChanged = true;
	this.alpha = amt * this.light;
}


let sRot = function(deg) {
	this.rotation += (deg/360*2*Math.PI)*this.delta;
	return this;
}
let sSine = function(scale) {
	return (1+Math.sin( (270/360*2*Math.PI) + (this.elapsed/this.duration)*2*Math.PI ))/2*scale;
}
//let sBell = function(scale) {
//	return (1+Math.sin( (270/360*2*Math.PI) + (this.elapsed/this.duration)*2*Math.PI ))/2*scale;
//}

class Anim {
	constructor(sticker,data) {
		Object.assign(this,{ delay: 0, alpha: 1, scale: 1, isAnim: 1 }, sticker, data);
		this.isAnimation = true;
		this.dead = false;
		this.delta = 0;
		if( this.x === undefined && this.follow ) {
			this.x = this.follow.x;
			this.y = this.follow.y;
		}
		if( this.x === undefined ) debugger;
		if( this.y === undefined ) debugger;
		this.spriteList = [];
		if( this.onInit ) {
			this.onInit(this);
		}
		else {
			this.spriteAdd(this.img);
		}
		animationAdd(this);
	}
	sprites(fn) {
		return this.spriteList.forEach( fn );
	}
	create(numSprites,imgChance) {
		if( this.dead ) return;
		let imgArray = String.chanceParse( imgChance || this.img );
		while( numSprites-- ) {
			let img = Array.chancePick(imgArray);
			this.spriteAdd(img);
		}
	}
	puppetOnExist(entity) {
		entity.puppetMe = this;
	}
	puppet(spriteList) {
		if( this.dead ) return;
		if( !spriteList ) {
			this.die();
			return this;
		}
		this.isPuppeteer = true;
		spriteList.forEach( sprite => {
			spriteAttach(this.spriteList,sprite);
			this.spriteInit(sprite);
			this.spriteBind(sprite);
			if( this.onSpriteMake ) { this.onSpriteMake(sprite,this); }
		});
		return this;
	}
	die() {
		if( this.dead ) return;
		this.dead = true;
		if( this.isPuppeteer ) {
			this.spriteList.forEach( (s,i) => {
				if( this.onSpriteDone ) {
					this.onSpriteDone(s);
				}
				this.spriteCalc(s);	// very useful if your onSpriteDone() performed a reset.
			});
		}

		spriteDeathCallback(this.spriteList);
	}
	spriteInit(sprite) {
		if( this.dead ) return;
		sprite.rx = sprite.rx || 0;
		sprite.ry = sprite.ry || 0;
		sprite.qx = sprite.qx || 0;
		sprite.qy = sprite.qy || 0;
		sprite.elapsed = 0;
		sprite.duration = this.duration;
	}
	spriteBind(sprite) {
		if( this.dead ) return;
		if( sprite.sScale ) return;
		sprite.sReset 	= sReset.bind(sprite);
		sprite.sScale	= sScale.bind(sprite);
		sprite.sScaleSet= sScaleSet.bind(sprite);
		sprite.sPos 	= sPos.bind(sprite);
		sprite.sPosDeg 	= sPosDeg.bind(sprite);
		sprite.sMove 	= sMove.bind(sprite);
		sprite.sQuiver 	= sQuiver.bind(sprite);
		sprite.sVel 	= sVel.bind(sprite);
		sprite.sVelTo 	= sVelTo.bind(sprite);
		sprite.sGrav 	= sGrav.bind(sprite);
		sprite.sRot 	= sRot.bind(sprite);
		sprite.sSine 	= sSine.bind(sprite);
		sprite.sAlpha 	= sAlpha.bind(sprite);
	}
	spriteAdd(img) {
		if( this.dead ) return;
		let sprite = spriteCreate(this.spriteList,img);
		this.spriteInit(sprite);
		this.spriteBind(sprite);
		sprite.anchor.set(0.5,0.5);
		sprite.scale._x = this.scale || 1;
		sprite.scale._y = this.scale || 1;
		sprite.zOrder = 10;
		sprite.visible = false;
		if( this.onSpriteMake ) { this.onSpriteMake(sprite,this); }
		spriteOnStage( sprite, true );
		return sprite;
	}

	drawUpdate(xBase, yBase, light ) {
		if( this.dead ) return;
		this.xBase = xBase;
		this.yBase = yBase;

		this.sprites( s => {
			s.light = s.glow ? 1 : light;
			if( !s.alphaChanged ) {
				s.alpha = s.light;
			}
			s.visible = this.isPuppeteer || this.delay<=0;	// required because the gui draw starts each render by setting all to not visible
			this.spriteCalc(s);	// required because if the anim is later in the draw order than the object, the object might not reset the sprite in time.
		});
	}
	spriteCalc(s) {
		let e = this.delay<=0;
		s.x = (this.x-this.xBase+(e?s.rx+s.qx:0)+0.5)*32;
		s.y = (this.y-this.yBase+(e?s.ry+s.qy:0)+0.5)*32;
	}
	tick(delta) {
		if( this.dead ) {
			return;
		}
		this.delta = delta;
		if( this.follow && !this.follow.dead ) {
			this.x = this.follow.x;
			this.y = this.follow.y;
		}
		if( this.delay>0 ) {
			this.delay -= delta;
			if( this.delay>0 ) return;
			this.sprites( s => {
				s.visible = this.isPuppeteer || this.delay<=0;
				this.spriteCalc(s);
			});
		}
		if( this.onTick ) {
			this.onTick(this,delta);
			if( this.dead ) return;
		}
		let onSpriteTick = this.onSpriteTick;
		this.sprites( s=> {
			s.delta = delta;
			s.elapsed += delta;
			if( onSpriteTick ) { onSpriteTick( s, this ); }
			this.spriteCalc(s);
		});

		if( typeof this.duration === 'function' ) {
			if( this.duration(this,delta) === 'die' ) {
				return this.die();
			}
		}

		if( typeof this.duration === 'object' ) {
			if( this.duration.dead ) {
				return this.die();
			}
		}

		if( typeof this.duration === 'number' ) {
			this.duration -= delta;
			if( this.duration <= 0 ) {
				return this.die();
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

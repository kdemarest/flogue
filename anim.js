let _test = function(a,b) {
	console.assert( Math.abs(a-b) < 0.0001 );
}

let toDeg = function(rad) {
	let d = (rad/(2*Math.PI)) * 360 + 90;
	if( d >= 360 ) d -= 360;
	return d;
}
let toRad = function(deg) {
	let r = (3*Math.PI/2)+(deg/360)*2*Math.PI;
	if( r >= 2*Math.PI ) r -= 2*Math.PI;
	return r;
}

_test( toRad(0), 3*Math.PI/2 );
_test( toRad(90), 0 );
_test( toRad(180), Math.PI/2 );
_test( toRad(270), Math.PI );

_test( toDeg(toRad(0)), 0 );
_test( toDeg(toRad(90)), 90 );
_test( toDeg(toRad(180)), 180 );
_test( toDeg(toRad(240)), 240 );
_test( toDeg(toRad(37)), 37 );

_test( Math.cos(toRad(0)), 0 );
_test( Math.cos(toRad(90)), 1 );
_test( Math.sin(toRad(0)), -1 );
_test( Math.sin(toRad(90)), 0 );


let deltaToDeg = function(dx,dy) {
	// WARNING!!! This should really be -dy. BUT since the world itself is already upside down, we flip dy AGAIN.
	let rad = Math.atan2(dy,dx);	// yes, y param first.
	return toDeg(rad);
}
_test( deltaToDeg(1,-1), 45 );
_test( deltaToDeg(0,-1), 0 );
_test( deltaToDeg(0,1), 180 );

let sScale = function(a) {
	this.transform.scale.set(this.transform.scale.get()+this.delta*a);
	return this;
}
let sScaleSet = function(absScale) {
	this.transform.scale.set(this.baseScale*absScale*(TILE_DIM/32));
	return this;
}
let sReset = function() {
	this.rx = 0;
	this.ry = 0;
	this.qx = 0;
	this.qy = 0;
	this.xVel = 0;
	this.yVel = 0;
	this.sScaleSet(1.0);
	return this;
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
	console.log( "Q=",this.quiver );
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
	this.vel = vel * TILE_DIM;
	this.xVel = (this.xVel||0) + Math.cos(toRad(deg)) * vel;
	this.yVel = (this.yVel||0) + Math.sin(toRad(deg)) * vel;
	return this;
}

//(10,5) in 4 seconds
//(10/11.18) / 4
//(5/11.18) / 4

let sVelTo = function(dx,dy,duration) {
	console.log( "vel for ("+dx+','+dy+') A '+this.xVel+','+this.yVel );
	this.xVel = (this.xVel||0) + dx/duration;
	this.yVel = (this.yVel||0) + dy/duration;
	console.log( "vel for ("+dx+','+dy+') B '+this.xVel+','+this.yVel );
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
let sPct = function() {
	if( typeof this.duration == 'number' ) {
		return this.elapsed/this.duration;
	}
	return 0;
}	

let sRot = function(deg) {
	this.rotation += (deg/360*2*Math.PI)*this.delta;
	return this;
}
let sSine = function(pct,scale) {
	return (1+Math.sin( (270/360*2*Math.PI) + pct*2*Math.PI ))/2*scale;
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
		this.createAccumulator = 0;
		this.spritesMade = 0;
		this.spritesAlive = 0;
		this.elapsed = 0;
		if( this.x === undefined && this.follow ) {
			if( this.follow.inVoid ) {
				// Don't try to animate on this thing. It is in the void.
				return false;
			}
			if( this.follow.isTileType && !this.follow.isPosition ) {
				debugger;
			}
			this.x = this.follow.x;
			this.y = this.follow.y;
		}
		console.assert( this.duration !== undefined );
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
	create(numSprites) {
		if( this.dead ) return;
		while( numSprites-- ) {
			this.spriteAdd(this.img);
		}
	}
	createPerSec(numSprites,untilSecond) {
		if( untilSecond !== undefined && this.elapsed > untilSecond ) {
			return;
		}
		this.createAccumulator += this.delta * numSprites;
		while( this.createAccumulator > 0 ) {
			this.create(1);
			this.createAccumulator -= 1;
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
				delete s.dead;
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
		console.assert( this.duration !== undefined );
		console.assert( typeof this.duration !== 'number' || !isNaN(this.duration) );
		sprite.baseScale = sprite.baseScale || 1;
		sprite.rx = sprite.rx || 0;
		sprite.ry = sprite.ry || 0;
		sprite.qx = sprite.qx || 0;
		sprite.qy = sprite.qy || 0;
		sprite.xVel = 0;
		sprite.yVel = 0;
		sprite.quiver = 0;
		sprite.elapsed = 0;
		sprite.duration = typeof this.duration === 'number' ? this.duration : true;
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
		sprite.sPct 	= sPct.bind(sprite);
		sprite.sSine 	= sSine.bind(sprite);
		sprite.sAlpha 	= sAlpha.bind(sprite);
	}
	spriteAdd(img) {
		if( this.dead ) return;
		let sprite = spriteCreate(this.spriteList,img);
		this.spriteInit(sprite);
		this.spriteBind(sprite);
		sprite.anchor.set(0.5,0.5);
		sprite.zOrder = 10;
		sprite.visible = false;
		if( this.onSpriteMake ) { this.onSpriteMake(sprite,this); }
		spriteOnStage( sprite, true );
		this.drawUpdate(this.xBase,this.yBase,10);	// just pick a visible light level until the main drawUpdate can get to it.
		this.spritesMade++;
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
		s.x = (this.x-this.xBase+((e?s.rx+s.qx:0)+0.5)*this.scale)*TILE_DIM;
		s.y = (this.y-this.yBase+((e?s.ry+s.qy:0)+0.5)*this.scale)*TILE_DIM;
	}
	tick(delta) {
		if( this.dead ) {
			return;
		}
		this.delta = delta;
		this.elapsed += delta;
		if( this.follow && !this.follow.dead ) {
			this.x = this.follow.x;
			this.y = this.follow.y;
		}
		if( this.delay>0 ) {
			this.delay -= delta;
			if( this.delay>0 ) return;
			this.sprites( s => {
				s.visible = (this.isPuppeteer || this.delay<=0) && !s.dead;
				this.spriteCalc(s);
			});
		}
		if( this.onTick ) {
			this.onTick(this,delta);
			if( this.dead ) return;
		}
		let onSpriteTick = this.onSpriteTick;
		this.spritesAlive = 0;
		this.sprites( s=> {
			s.delta = delta;
			s.elapsed += delta;
			if( typeof s.duration == 'number' && s.elapsed > s.duration ) {
				s.dead = true;
				if( !this.isPuppeteer ) {
					s.visible = false;
				}
			}
			if( s.dead ) return;
			this.spritesAlive++;
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

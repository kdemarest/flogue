let _test = function(a,b) {
	console.assert( Math.abs(a-b) < 0.0001 );
}

let radNorm = function(rad) {
	while( rad >= Math.PI ) rad -= Math.PI*2;
	while( rad <= -Math.PI ) rad += Math.PI*2;
	return rad;
}

let degNorm = function(deg) {
	deg += 360*10;
	return deg % 360;
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

let degTo = function(e0,e1) {
	let dx = e1.x - e0.x ;
	let dy = e1.y - e0.y;
	return deltaToDeg(dx,dy);
}


_test( deltaToDeg(1,-1), 45 );
_test( deltaToDeg(0,-1), 0 );
_test( deltaToDeg(0,1), 180 );

let sScale = function(a) {
	this.transform.scale.set(this.transform.scale.get()+this.delta*a);
	return this;
}
let sScaleSet = function(absScale) {
	this.transform.scale.set(this.baseScale*absScale);
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
//	console.log( "Q=",this.quiver );
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
//	console.log( "vel for ("+dx+','+dy+') A '+this.xVel+','+this.yVel );
	this.xVel = (this.xVel||0) + dx/duration;
	this.yVel = (this.yVel||0) + dy/duration;
//	console.log( "vel for ("+dx+','+dy+') B '+this.xVel+','+this.yVel );
	return this;
}
let sHoming = function(strength) {
	let dx = this.rxTarget-this.rx;
	let dy = this.ryTarget-this.ry;
	console.assert( this.delta >= 0 );
	console.assert( strength >= 0 );
	let vx = dx*strength*this.delta;
	let vy = dy*strength*this.delta;
	console.log( 'x: '+Math.floor(this.rx)+' -> '+Math.floor(this.rxTarget)+' adds '+vx+'  dx='+dx );
	this.xVel = (this.xVel||0) + vx;
	this.yVel = (this.yVel||0) + vy;
	return this;
}

let sPursuit = function(turnRateDeg) {
	let dx = this.rxTarget-this.rx;
	let dy = this.ryTarget-this.ry;

	let drad = Math.atan2(dy,dx);
	let vrad = Math.atan2(this.yVel,this.xVel);
	let speed = Math.sqrt(this.xVel*this.xVel+this.yVel*this.yVel);

	let oldvrad = vrad;
	vrad = radNorm(vrad-drad);
	let turnDir = -Math.sign(vrad);
	let s = Math.sign(vrad);
	vrad += this.delta * turnDir * (turnRateDeg/360)*(Math.PI*2)
	if( Math.sign(vrad) == -s ) vrad = 0;
	if( vrad == 0 ) {
		// go faster!
		speed = speed * (1+(2*this.delta));
	}
	else {
		// slow down
		speed = speed * (1-(1*this.delta));
	}

	vrad = radNorm(vrad+drad);
	console.log(vrad,drad);
	let rad = vrad;

	this.xVel = Math.cos(rad)*speed;
	this.yVel = Math.sin(rad)*speed;

	return this;
}
let sArrived = function(howClose=0.2) {
	let dx = this.rxTarget-this.rx;
	let dy = this.ryTarget-this.ry;
	this.dxLast = dx;
	this.dyLast = dy;
	return (dx*dx+dy*dy) <= howClose*howClose;
}
let sGrav = function(amt) {
	this.yVel += this.delta*amt;
	return this;
}
let sAlpha = function(amt) {
	this.alphaChanged = true;
	// KEN WARNING
	this.alpha = amt; // * this.light;
	if( this.alpha !== amt ) debugger;
	return this;
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
		Object.assign(this,{ delay: 0, scale: 1, isAnim: 1 }, sticker, data);
		this.isAnimation = true;
		this.dead = false;
		this.delta = 0;
		this.createAccumulator = 0;
		this.spritesMade = 0;
		this.spritesAlive = 0;
		this.elapsed = 0;
		if( (this.at && this.at.inVoid) || (this.follow && this.follow.inVoid) || (this.target && this.target.inVoid) ) {
			// Don't try to animate on this thing. It is in the void.
			return false;
		}
		if( this.at ) {
			console.assert( this.at.x!==undefined && this.at.y!==undefined && this.at.area!==undefined );
			this.x = this.at.x;
			this.y = this.at.y;
			this.areaId = this.at.area.id;
		}
		if( this.x === undefined && this.follow ) {
			if( this.follow.isTileType && !this.follow.isPosition ) {
				debugger;
			}
			console.assert( this.follow.x!==undefined && this.follow.y!==undefined && this.follow.area!==undefined );
			this.x = this.follow.x;
			this.y = this.follow.y;
			this.areaId = this.follow.area.id;
		}
		console.assert( this.duration !== undefined );
		if( this.x === undefined ) debugger;
		if( this.y === undefined ) debugger;
		if( this.areaId === undefined || typeof this.areaId !== 'string') debugger;

		if( this.target ) {
			console.assert( this.target.x!==undefined && this.target.y!==undefined );
			this.rxTarget = (this.target.x-this.x);
			this.ryTarget = (this.target.y-this.y);
		}

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
			if( this.onSpriteMake ) {
				this.onSpriteMake(sprite,this);
			}
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
		sprite.baseScale = sprite.baseScale || TILE_DIM/sprite.width;
		sprite.rx = sprite.rx || 0;
		sprite.ry = sprite.ry || 0;
		sprite.rxTarget = this.rxTarget || 0;
		sprite.ryTarget = this.ryTarget || 0;
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
		sprite.sHoming 	= sHoming.bind(sprite);
		sprite.sPursuit = sPursuit.bind(sprite);
		sprite.sArrived = sArrived.bind(sprite);
		sprite.sGrav 	= sGrav.bind(sprite);
		sprite.sRot 	= sRot.bind(sprite);
		sprite.sPct 	= sPct.bind(sprite);
		sprite.sSine 	= sSine.bind(sprite);
		sprite.sAlpha 	= sAlpha.bind(sprite);
	}
	spriteAdd(img) {
		if( this.dead ) return;
		let sprite = spriteCreate(this.spriteList,img,true);
		this.spriteInit(sprite);
		this.spriteBind(sprite);
		sprite.anchor.set(0.5,0.5);
		sprite.zOrder = 100;
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
		let self = this;

		this.sprites( s => {
			s.light = s.glow ? 1 : light;
			if( !s.alphaChanged ) {
				s.alpha = s.light;
			}
			s.visible = self.isPuppeteer || self.delay<=0;	// required because the gui draw starts each render by setting all to not visible
			this.spriteCalc(s);	// required because if the anim is later in the draw order than the object, the object might not reset the sprite in time.
		});
	}
	spriteCalc(s) {
		let e = this.delay<=0;
		s.x = (this.x-this.xBase+((e?s.rx+s.qx:0)+0.5)*this.scale)*TILE_DIM;
		s.y = (this.y-this.yBase+((e?s.ry+s.qy:0)+0.5)*this.scale)*TILE_DIM;
	}
	tick(delta) {

		function spriteKill(s) {
			s.dead = true;
			s.visible = this.isPuppeteer;
			if( !s.visible ) {
				spriteOnStage(s,false);
			}
		}

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
				s.visible = this.isPuppeteer || !s.dead;
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
				return spriteKill.call(this,s);
			}
			if( s.dead ) return;
			this.spritesAlive++;
			if( onSpriteTick ) {
				if( onSpriteTick( s, this ) === false ) {
					return spriteKill.call(this,s);
				}
			}
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

function animFloatUp(target,icon,delay,duration=0.4) {
	if( icon !== false ) {
		return new Anim( {}, {
			follow: 	target,
			img: 		icon || StickerList.bloodBlue.img,
			duration: 	0.4,
			delay: 		delay || 0,
			onInit: 		a => { a.create(1); },
			onSpriteMake: 	s => { s.sVelTo(0,-1,0.4).sScaleSet(0.75); },
			onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel).sAlpha(1-Math.max(0,(2*s.elapsed/s.duration-1))); }
		});
	}
}

function animOver(target,icon,delay) {
	return new Anim( {}, {
		follow: 	target,
		img: 		icon,
		duration: 	0.2,
		delay: 		delay || 0,
		onInit: 		a => { a.create(1); },
		onSpriteMake: 	s => { s.sScaleSet(0.75); },
		onSpriteTick: 	s => { }
	});
}

function animAt(x,y,area,icon,delay) {
	return new Anim( {}, {
		x: 			x,
		y: 			y,
		areaId: 	area.id,
		img: 		icon,
		duration: 	0.2,
		delay: 		delay || 0,
		onInit: 		a => { a.create(1); },
		onSpriteMake: 	s => { s.sScaleSet(0.75); },
		onSpriteTick: 	s => { }
	});
}

function animAbove(target,icon,delay=0) {
	return new Anim( {}, {
		follow: 	target,
		img: 		icon,
		duration: 	0.2,
		delay: 		delay || 0,
		onInit: 		a => { a.create(1); },
		onSpriteMake: 	s => { s.sScaleSet(0.75).sPos(0,-1); },
		onSpriteTick: 	s => { }
	});
}

function animFly(sx,sy,ex,ey,area,img,delay) {
	let dx = ex-sx;
	let dy = ey-sy;
	let rangeDuration = Math.max(0.1,Math.sqrt(dx*dx+dy*dy) / 10);
	return new Anim({
		x: 			sx,
		y: 			sy,
		areaId: 	area.id,
		img: 		img,
		duration: 	rangeDuration,
		onInit: 		a => { a.create(1); },
		onSpriteMake: 	s => { s.sVelTo(dx,dy,rangeDuration); },
		onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel); }
	});
}

function animFountain(entity,num=40,duration=2,velocity=3,img) {
	return new Anim({},{
		follow: 	entity,
		img: 		img,
		duration: 		a => a.spritesMade && a.spritesAlive==0,
		onInit: 		a => { },
		onTick: 		a => a.createPerSec(num,duration),
		onSpriteMake: 	s => s.sScaleSet(0.30).sVel(Math.rand(-30,30),Math.rand(velocity,2*velocity)).duration=1,
		onSpriteTick: 	s => s.sMove(s.xVel,s.yVel).sGrav(10)
	});
}

function animHoming(entity,target,offAngle=45,num=40,duration=2,velocity=3,img) {
	let dx = target.x - entity.x ;
	let dy = target.y - entity.y;
	let deg = deltaToDeg(dx,dy);

	return new Anim({},{
		follow: 	entity,
		target: 	target,
		img: 		img,
		duration: 		a => a.spritesMade && a.spritesAlive==0,
		onInit: 		a => { },
		onTick: 		a => a.createPerSec(num,duration),
		onSpriteMake: 	s => s.sScaleSet(0.30).sVel(deg+Math.rand(-offAngle,offAngle),Math.rand(velocity,2*velocity)).duration=duration,
		onSpriteTick: 	s => !s.sPursuit(90*duration).sMove(s.xVel,s.yVel).sArrived(0.3),
	});
}

function animBlam(target, fromDeg, arc, img, delay ) {
	return new Anim({},{
		follow: 	target,
		img: 		img,
		delay: 		delay,
		duration: 	0.2,
		onInit: 		a => { a.create(4+Math.floor(7*mag)); },
		onSpriteMake: 	s => { s.sScaleSet(0.20+0.10*mag).sVel(Math.rand(deg-arc,deg+arc),4+Math.rand(0,3+7*mag)); },
		onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel); }
	});
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

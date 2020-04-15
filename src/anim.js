Module.add('anim',function() {


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

class AnimSprite extends Sprite {
	sScale(a) {
		this.scale += this.dt*a;
		return this;
	}
	sScaleSet(absScale) {
		this.scale = absScale;
		return this;
	}
	sReset() {
		this.rx = 0;
		this.ry = 0;
		this.qx = 0;
		this.qy = 0;
		this.xVel = 0;
		this.yVel = 0;
		this.sScaleSet(1.0);
		return this;
	}
	sPosRel(x,y) {
		this.rx = x;
		this.ry = y;
		return this;
	}
	sPosRelDeg(deg,dist) {
		let rad = toRad(deg);
		this.rx = Math.cos(rad)*dist;
		this.ry = Math.sin(rad)*dist;
		return this;
	}
	sMoveRel(dx=this.xVel,dy=this.yVel) {
		this.rx += this.dt*dx;
		this.ry += this.dt*dy;
		return this;
	}
	sQuiver(rate,range=0.5) {
		this.quiver = (this.quiver||0) - this.dt;
		if( this.quiver <= 0 ) {
			let rad = Math.rand(0,2*Math.PI);
			this.qx = Math.cos(rad)*range;
			this.qy = Math.sin(rad)*range;
			this.quiver += rate;
		}
		return this;
	}
	sVel(deg,vel) {
		this.deg = deg;
		this.vel = vel * Tile.DIM;
		this.xVel = (this.xVel||0) + Math.cos(toRad(deg)) * vel;
		this.yVel = (this.yVel||0) + Math.sin(toRad(deg)) * vel;
		return this;
	}
	sVelTo(dx,dy,duration) {
		this.xVel = (this.xVel||0) + dx/duration;
		this.yVel = (this.yVel||0) + dy/duration;
		return this;
	}
	sGrav(amt) {
		this.yVel += this.dt*amt;
		return this;
	}
	sAlpha(amt) {
		this.alpha = amt; // * this.light;
		return this;
	}
	sPct() {
		if( typeof this.duration == 'number' ) {
			return this.elapsed/this.duration;
		}
		return 0;
	}	
	sRot(deg) {
		this.rotation += (deg/360*2*Math.PI)*this.dt;
		return this;
	}
	sRotSet(deg) {
		this.rotation = (deg/360*2*Math.PI);
		return this;
	}
	sSine(pct,scale) {
		return (1+Math.sin( (270/360*2*Math.PI) + pct*2*Math.PI ))/2*scale;
	}

	constructor(anim) {
		super();
		this.id         = null;		// filled in elsewhere
		this._xWorld    = null;
		this._yWorld    = null;
		this.rx 		= 0;
		this.ry 		= 0;
		this.qx			= 0;
		this.qy			= 0;
		this.xVel		= 0;
		this.yVel		= 0;
		this.quiver		= 0;
		this.elapsed	= 0;
		this.duration 	= true;
		this.light      = 0;

		this.anim = anim;
	}

	get delay() {
		return this.anim.delay;
	}

	get manager() {
		return this.anim.manager;
	}

	get area() {
		return this.anim.area;
	}

	get xWorld() {
		return this.follow ? this.follow.x : this._xWorld;
	}

	get yWorld() {
		return this.follow ? this.follow.y : this._yWorld;
	}

	update( dt, observer, pane ) {
		if( this.dead ) {
			return;
		}
		this.dt = dt;
		this.observer = observer;
		console.assert( !this.follow || this._xWorld===null );
		if( this.delay ) {
			return;
		}

		this.elapsed += dt;
		if( Number.isFinite(this.duration) && this.elapsed > this.duration ) {
			return this.dead = true;
		}

		if( this.area.id !== this.observer.area.id || !this.manager.clip.contains(this.x,this.y) ) {
			return this.dead = true;
		}

		this.inPane = pane.inSightOf(this.observer,this.xWorld,this.yWorld);

		// Allow some control of the sprite. Be sure this is BEFORE the assignment of xVisual.
		if( this.anim.onSpriteTick ) {
			if( this.anim.onSpriteTick( this ) === false ) {
				return this.dead = true;
			}
		}

		this.xVisual = this.xWorld + this.rx + this.qx + 0.5;
		this.yVisual = this.yWorld + this.ry + this.qy + 0.5;

		this.updateSprite(pane);
	}

	init(sprite,duration) {
		this.duration = Number.isFinite(duration) ? duration : true;
		if( this.anim.at ) {
			this._xWorld = this.anim.at.x;
			this._yWOrld = this.anim.at.y;
		}
		this.sprite = sprite;

		this.xAnchor    = this.anim.xAnchor!==undefined ? this.anim.xAnchor : 0.5;
		this.yAnchor    = this.anim.yAnchor!==undefined ? this.anim.yAnchor : 0.5;
		this.scale		= this.anim.scale  !==undefined ? this.anim.scale : 1.0;
		this.alpha  	= this.anim.alpha  !==undefined ? this.anim.alpha : 1.0;
		this.zOrder     = Tile.zOrder.ANIM;
		return this;

	}
}


class Anim {
	constructor(data0, data1) {
		Object.assign(this, { isAnim: 1, puppet: null }, data0, data1 );

		console.assert( this.at || this.follow );

		this.id =  'anim.'+((this.follow ? this.follow.id : '') || (this.at ? this.at.id : '') || Date.makeUid());

		this.isAnimation	= true;
		this.dead			= false;
		this.dt				= 0;
		this.createAccumulator = 0;
		this.elapsed		= 0;

		console.assert( this.x === undefined && this.y === undefined );
		console.assert( !this.puppet );	// you aren't allowed to specify your puppet directly. Use takePuppet in onInit

		// In Void? Don't try to Animate on this thing. Some aspect of it is in the void.
		if( (this.at && this.at.inVoid) || (this.follow && this.follow.inVoid) || (this.target && this.target.inVoid) ) {
			return false;
		}

		// Validate the (optional) start point
		console.assert( !this.at || (this.at.x!==undefined && this.at.y!==undefined && this.at.area!==undefined) );

		// Validate the (optional) follow.
		console.assert( !this.follow || (this.follow.x!==undefined && this.follow.y!==undefined && this.follow.area!==undefined) );

		// Validate the (optional) target
		console.assert( !this.target || (this.target.x!==undefined && this.target.y!==undefined) );

		// Start at 'follow', but only if (x,y) not otherwise specified
		if( this.follow && this.follow.isTileType && !this.follow.isTileEntity ) {
			debugger;
		}

		// Validate duration
		console.assert( this.duration !== undefined );

		// Delay
		if( this.delay === undefined && this.delayId ) {
			if( typeof this.duration == 'number' ) {
				this.delay = this.manager.delay.get(this.delayId);
				if( !this.manager.delay.group[this.delayId] ) {
					let add = this.delayAdd === undefined ? this.duration : this.delayAdd;
					this.manager.delay.add(this.delayId,add || this.duration);
				}
			}
			// Otherwise make it delay until it is done.
		}
		if( this.delay === undefined ) {
			this.delay = 0;
		}

		// My Sprites!
		this.spriteList = [];

		// OnInit - if you want any sprites made, do it yourself!
		this.onInit(this);

		// These get destroyed by flagging themselves dead and then the animation
		// manager's regular tick will prune them.
		this.manager.add(this);
	}

	get xWorld() {
		return this.follow ? this.follow.x : this.at.x;
	}

	get yWorld() {
		return this.follow ? this.follow.y : this.at.y;
	}

	get area() {
		return this.follow ? this.follow.area : this.at.area;
	}

	get manager() {
		return this.area.animationManager;
	}

	get spritesMade() {
		return this.spriteList.length;
	}

	get spritesAlive() {
		return this.spriteList.reduce( (total,sprite) => total + (sprite.dead ? 0 : 1) );
	}

	get entitySpriteList() {
		return this.area.entitySpriteList;
	}

	spriteAdd( animSprite ) {
		if( this.dead ) return;
		let spriteId = ''+this.spriteList.length+this.id;
		console.assert( !this.entitySpriteList[spriteId] );
		animSprite.id = spriteId;
		this.entitySpriteList[spriteId] = animSprite;
		this.spriteList.push( animSprite );
		if( this.onSpriteMake ) {
			this.onSpriteMake(animSprite,this);
		}
		return animSprite;
	}

	create(numSprites) {
		if( this.dead ) return;
		console.assert( this.img );
		while( numSprites-- ) {
			this.spriteAdd(
				new AnimSprite(this).init(
					new PIXI.Sprite(ImageRepo.getResourceByImg(this.img).texture)
				),
				this.duration
			);
		}
		return this;
	}

	createPerSec(numSprites,untilSecond) {
		if( untilSecond !== undefined && this.elapsed > untilSecond ) {
			return;
		}
		this.createAccumulator += this.dt * numSprites;
		while( this.createAccumulator > 0 ) {
			this.create(1);
			this.createAccumulator -= 1;
		}
		return this;
	}

	traverse(fn) {
		return this.spriteList.forEach( fn );
	}

	takePuppet(entity) {
		if( this.dead ) {
			return false;
		}
		this.puppet = entity;
		let entitySprite = this.area.entitySpriteList[ entity.id ];
		let myAnimSprite = this.spriteAdd(
			new AnimSprite(this).init(
				entitySprite.sprite,
				this.duration
			)
		);
		mySprite.dependsOn = entitySprite;
		return this;
	}

	die() {
		this.dead = true;
	}

	tick(dt) {
		if( this.dead ) {
			return;
		}
		this.dt = dt;
		this.elapsed += dt;

		this.delay = Math.max(0,this.delay-dt);
		if( this.delay ) {
			return;
		}

		if( this.onTick ) {
			this.onTick(this,dt);
			if( this.dead ) {
				return;
			}
		}

		if( typeof this.duration === 'function' ) {
			if( this.duration(this,dt) === 'die' ) {
				return this.die();
			}
		}

		if( typeof this.duration === 'object' ) {
			if( this.duration.dead ) {
				return this.die();
			}
		}

		if( typeof this.duration === 'number' ) {
			this.duration -= dt;
			if( this.duration <= 0 ) {
				return this.die();
			}
		}
	}
}

Anim.FloatUp = function(delayId,target,icon,duration=0.4) {
	if( icon !== false ) {
		return new Anim({
			follow: 	target,
			img: 		icon || StickerList.bloodBlue.img,
			duration: 	0.4,
			delayId: 	delayId,
			onInit: 		a => { a.create(1); },
			onSpriteMake: 	s => { s.sVelTo(0,-1,0.4).sScaleSet(0.75); },
			onSpriteTick: 	s => { s.sMoveRel(s.xVel,s.yVel).sAlpha(1-Math.max(0,(2*s.elapsed/s.duration-1))); }
		});
	}
}

Anim.Upon = function(delayId,target,icon,duration=0.2,scale=0.75) {
	return new Anim({
		follow: 	target,
		img: 		icon,
		delayId: 	delayId,
		duration: 	duration,
		onInit: 		a => { a.create(1); },
		onSpriteMake: 	s => { s.sScaleSet(scale); },
		onSpriteTick: 	s => { }
	});
}

Anim.Cloud = function(delayId,x,y,area,groupId,icon) {
	return new Anim({
		at:			{ x: x, y: y, area: area },
		groupId: 	groupId,
		alpha: 		0.2,
		img: 		icon,
		deathTime: 	Time.simTime+2,
		delayId: 	delayId,
		duration: 	(self) => Time.simTime >= self.deathTime ? 'die' : '',
		onInit: 		a => { a.create(1); },
		onSpriteMake: 	s => { s.sScaleSet(0.75); },
		onSpriteTick: 	s => { }
	});
}

Anim.At = function(delayId,x,y,area,icon) {
	return new Anim({
		at:			{ x: x, y: y, area: area },
		img: 		icon,
		delayId: 	delayId,
		duration: 	0.2,
		onInit: 		a => { a.create(1); },
		onSpriteMake: 	s => { s.sScaleSet(0.75); },
		onSpriteTick: 	s => { }
	});
}

Anim.Above = function(delayId,target,icon) {
	return new Anim({
		follow: 	target,
		img: 		icon,
		delayId: 	delayId,
		duration: 	0.2,
		onInit: 		a => { a.create(1); },
		onSpriteMake: 	s => { s.sScaleSet(0.75).sPosRel(0,-1); },
		onSpriteTick: 	s => { }
	});
}

Anim.Fly = function(delayId,delayAdd,sx,sy,ex,ey,area,img) {
	let dx = ex-sx;
	let dy = ey-sy;
	let rangeDuration = Math.max(0.1,Distance.get(dx,dy) / 10);
	return new Anim({
		at:			{ x: sx, y: sy, area: area },
		img: 		img,
		delayId: 	delayId,
		delayAdd: 	delayAdd,
		duration: 	rangeDuration,
		onInit: 		a => { a.create(1); },
		onSpriteMake: 	s => { s.sVelTo(dx,dy,rangeDuration); },
		onSpriteTick: 	s => { s.sMoveRel(s.xVel,s.yVel); }
	});
}

Anim.Fountain = function(delayId,entity,num=40,duration=2,velocity=3,img) {
	return new Anim({
		follow: 	entity,
		img: 		img,
		delayId: 	delayId,
		duration: 		a => a.spritesMade && a.spritesAlive==0,
		onInit: 		a => { },
		onTick: 		a => a.createPerSec(num,duration),
		onSpriteMake: 	s => s.sScaleSet(0.30).sVel(Math.rand(-30,30),Math.rand(velocity,2*velocity)).duration=1,
		onSpriteTick: 	s => s.sMoveRel(s.xVel,s.yVel).sGrav(10)
	});
}

Anim.Homing = function(delayId,entity,target,img,offAngle=45,num=40,duration=2,velocity=3) {
	let dx = target.x - entity.x ;
	let dy = target.y - entity.y;
	let deg = deltaToDeg(dx,dy);

	return new Anim({
		follow: 	entity,
		target: 	target,
		img: 		img,
		delayId: 	delayId,
		duration: 		a => a.spritesMade && a.spritesAlive==0,
		onInit: 		a => { },
		onTick: 		a => a.createPerSec(num,duration),
		onSpriteMake: 	s => s.sScaleSet(0.30).sVel(deg+Math.rand(-offAngle,offAngle),Math.rand(velocity,2*velocity)).duration=duration,
		onSpriteTick: 	s => !s.sPursuit(90*duration).sMoveRel(s.xVel,s.yVel).sArrived(0.3),
	});
}

Anim.Blam = function(delayId, target, scale=0.20, num=10, duration=0.2, fromDeg=0, arc=45, mag0=4, mag1=10, grav=10, rot=0, img ) {
	return new Anim({
		follow: 	target,
		img: 		img,
		delayId: 	delayId,
		duration: 	duration,
		onInit: 		a => { a.create(num); },
		onSpriteMake: 	s => { s.sScaleSet(scale).sVel(Math.rand(fromDeg-arc,fromDeg+arc),Math.rand(mag0,mag1)); },
		onSpriteTick: 	s => { s.sMoveRel(s.xVel,s.yVel).sGrav(grav); s.rotation += rot*s.dt; }
	});
}

class AnimationClip extends ClipRect {
}

class AnimationDelay {
	constructor() {
		this.group = {};
		this.duration = {};
	}
	reset() {
		this.duration = {};
	}
	get(id) {
		console.assert(id);
		return this.duration[id] || 0;
	}
	makeGroup(id,durationAdd=0) {
		let groupId = id+Date.makeUid();
		this.duration[groupId] = this.get(id);
		this.group[groupId] = true;
		this.duration[id] = this.get(id) + durationAdd;
		return groupId;
	}
	add(id,amount) {
		console.assert(id && amount !== undefined);
		this.duration[id] = (this.duration[id]||0) + amount;
	}
}



class AnimationManager {
	constructor() {
		this.list = [];
		this.delay = new AnimationDelay();
		this.clip = new AnimationClip();
	}
	forEach(fn) {
		return this.list.forEach(fn);
	}
	add(anim) {
		this.list.push(anim);

		// WARNING: This is really the wrong way to do this. Rather the viewMap should
		// just always draw all animations.
		Gui.dirty('map');
		return anim;
	}
	remove(fn,note) {
		this.list.forEach( anim => {
			if( fn(anim) ) {
				// console.log('AnimationManager.removed ',anim.groupId,'note='+note);
				anim.die(); 
			}
		});
		Gui.dirty('map');
	}
	tickRealtime(dt) {
		this.list.map( anim => anim.tick(dt) );
		Array.filterInPlace( this.list, anim => !anim.dead );
	}
}


/*
Notes on fully data-driven Animations:

{
	follow: 1,			// to follow whatever relevant
	at: 1,				// to set position
	puppet: true,		// grabs the entity's spritelist
	img: url			// or stickerlist entry,
	delay: 				// handled automatically in most cases
	duration: 			// usually standard
	scale:
	alpha:
	template:  // like Anim.Blam, etc that take { params... } and use them in an onSprite, onSpriteTick, etc.
}

*/

return {
	Anim: Anim,
	AnimationManager: AnimationManager,
	deltaToDeg: deltaToDeg,
}

});

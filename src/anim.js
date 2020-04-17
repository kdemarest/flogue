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

class Anim {
	constructor(data0, data1) {
		Object.assign(this, { isAnim: 1, puppet: null }, data0, data1 );

		console.assert( this.at || this.follow );
		console.assert( !(this.at && this.follow) );	// Choose one, not both.

		this.id =  (this.name||'anim')+'.'+((this.follow ? this.follow.id : '') || (this.at ? this.at.id : ''))+Date.makeUid();

		this.isAnimation	= true;
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

		if( (this.at||this.follow).watch ) {
			this.watch = true;
		}

		console.watchAnim( this, 'Anim Create:',this.id,'delay=',this.delay,' duration=',this.duration );

		// Delay
		if( this.delay === undefined && this.delayId ) {
			this.manager.delayManager.delaySet(this);
			// Otherwise make it delay until it is done.
		}
		if( this.delay === undefined ) {
			this.delay = 0;
		}

		// My Sprites!
		this.spriteCache = [];

		// OnInit - if you want any sprites made, do it yourself!
		this.onInit(this);

		// These get destroyed by flagging themselves dead and then the animation
		// manager's regular tick will prune them.
		this.manager.add(this);
	}

	get dead() {
		return this._dead;
	}

	set dead(value) {
		// You must call die() for this to die cleanly.
		console.assert(false);
	}

	die(note) {
		this._dead = true;
		console.watchAnim( this, this.elapsed+' '+this.id+' DEAD ANIM '+note );
		if( this.puppet ) {
			console.watchAnim( this, 'releasePuppet('+this.puppet.id+')' );
		}
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
		return this.spriteCache.length;
	}

	get spritesAlive() {
		return this.spriteCache.reduce( (total,sprite) => total + (sprite.dead ? 0 : 1) );
	}

	makeSpriteId() {
		return ''+this.spriteCache.length+'.'+this.id;
	}

	spriteAdd( animSprite ) {
		if( this.dead ) return;
		animSprite.watch = animSprite.watch || this.watch;

		guiMessage( 'spriteAdd', animSprite );
		this.spriteCache.push( animSprite );
		if( this.onSpriteMake ) {
			this.onSpriteMake(animSprite,this);
		}
		return animSprite;
	}

	create(numSprites) {
		if( this.dead ) return;
		console.assert( this.img );
		while( numSprites-- ) {
			let animSprite = new AnimSprite(this,this.makeSpriteId());
			let pixiSprite = new PIXI.Sprite(ImageRepo.getResourceByImg(this.img).texture);
			pixiSprite.visible = false;	// Important so the sprite won't show momentarily in to left corner.
			animSprite.init( pixiSprite, this.duration );
			this.spriteAdd( animSprite );
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
		return this.spriteCache.forEach( fn );
	}

	takePuppet(entity) {
		if( this.dead ) {
			return false;
		}
		this.watch = this.watch || entity.watch

		console.watchAnim( this, 'takePuppet('+entity.id+')' );
		this.puppet = entity;

		let entitySprite = null;
		guiMessage( 'sceneFn', scene => entitySprite = scene.spriteFromEntity(entity), 'map' );
		
		entitySprite.watch = entitySprite.watch || this.watch;

		let animSprite = new AnimSprite(this,this.makeSpriteId());
		animSprite.init( entitySprite.pixiSprite, this.duration );
		animSprite.dependsOn = entitySprite;
		animSprite.isPuppeteer = true;
		this.spriteAdd(animSprite);

		return this;
	}

	tick(dt) {
		if( dt == 0 ) {
			debugger;
		}
		if( this.dead ) {
			return;
		}
		this.dt = dt;
		this.delay = Math.max(0,this.delay-dt);
		if( this.delay ) {
			console.watchAnim( this, '?toldDelay', ' delaying '+this.delay );
			return;
		}
		// This must happen AFTER the delay!
		this.elapsed += dt;
		console.watchAnim( this, '?toldDoneDelay', ' running' );

		if( this.onTick ) {
			this.onTick(this,dt);
			if( this.dead ) {
				return;
			}
		}

		if( typeof this.duration === 'function' ) {
			if( this.duration(this,dt) === 'die' ) {
				return this.die( 'durationFn() said die' );
			}
		}

		if( typeof this.duration === 'object' ) {
			if( this.duration.dead ) {
				return this.die( 'watched object said dead' );
			}
		}

		if( typeof this.duration === 'number' ) {
			this.duration -= dt;
			if( this.duration <= 0 ) {
				return this.die( 'anim duration complete' );
			}
		}
	}
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
	delaySet(anim) {
		if( Number.isFinite(anim.duration) ) {
			anim.delay = this.get(anim.delayId);
			if( !this.group[anim.delayId] ) {
				let add = anim.delayAdd === undefined ? anim.duration : (anim.delayAdd || anim.duration);
				this.add( anim.delayId, add );
			}
		}
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
		this.delayManager = new AnimationDelay();
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
				anim.die(note); 
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
	puppet: true,		// grabs the entity's spriteCache
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
	toRad: toRad
}

});

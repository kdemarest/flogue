Module.add('anim',function() {


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

let degTo = function(e0,e1) {
	let dx = e1.x - e0.x ;
	let dy = e1.y - e0.y;
	return deltaToDeg(dx,dy);
}


_test( deltaToDeg(1,-1), 45 );
_test( deltaToDeg(0,-1), 0 );
_test( deltaToDeg(0,1), 180 );

/**
	class Anim
	You MUST pass in 'at' or 'follow'
	at			- must have an x,y,area that specifies, for most anim, where to start.
	follow		- either an object with x,y,area, or a function returning the same

	delayId		- the id of the delay group that will determine this thing's delay
	delay		- an absolute amount of time to delay before starting to animate. An alternative to delayId.

	duration	- how long to last. Can be a number, a function that returns "die", or and object that can set self.dead=true

	xAnchor
	yAnchor
	scale		- directly changes the sprite's scale
	alpha		- directly changes the sprite's alpha
	rotation	- directly changes the sprite's rotation
	zOrder		- how this sorts relative to other sprites

	onInit(a)		- use this to create(1) a sprite, or take a puppet
	onTick(a)		- will be called for every dt
	onSpriteMake(s)	- initialize your sprite(s) here
	onSpriteTick(s)	- update your animSprite's variables and behaviors here
	

*/
class Anim {
	constructor(...args) {
		this.id				= null;
		this.isAnimation	= true;
		this.dt				= 0;
		this.createAccumulator = 0;
		this.elapsed		= 0;
		this.puppet			= null;
		this.spriteCache	= [];
		this._dead			= false;

		// Validate 
		let temp = Object.assign( {}, ...args );
		for( let key in temp ) {
			// You may not over-write certain values that we expect to control. Everything else is fair game.
			console.assert( !this[key] );
		}

		// Merge into me
		Object.assign(this, temp );

		console.assert( this.at || this.follow );

		// Create a getter called 'follow' that always returns either the object called follow, or calls the passed-in function called follow.
		if( this.follow ) {
			let follow = this.follow;
			Object.defineProperty( this, 'follow', {
				get: typeof follow == 'function' ? follow.bind(this) : ()=>follow
			});
		}

		// Must be unique so that the scene.spriteList can manage it.
		this.id =  (this.name||'anim')+'.'+((this.follow ? this.follow.id : '') || (this.at ? this.at.id : ''))+Date.makeUid();

		console.assert( this.x === undefined && this.y === undefined );

		// In Void? Don't try to Animate on this thing. Some aspect of it is in the void.
		if( (this.at && this.at.inVoid) || (this.follow && this.follow.inVoid) || (this.target && this.target.inVoid) ) {
			return false;
		}

		// Validate the (optional) start point
		console.assert( !this.at || (this.at.x!==undefined && this.at.y!==undefined && this.at.area!==undefined) );

		// Validate the (optional) follow.
		console.assert( !this.follow || (this.follow.x!==undefined && this.follow.y!==undefined && this.follow.area!==undefined) );

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
			let pixiSprite = ImageRepo.createSprite( this.img );
			console.watchAnim(this,'create 1',this.img,'duration',Math.fixed(this.duration,3));
			pixiSprite.visible = false;	// Important so the sprite won't show momentarily in to left corner.
			animSprite.init( pixiSprite, this.duration );
			this.spriteAdd( animSprite );
		}
		return this;
	}

	createPerSec(numSprites,untilSecond) {
		if( untilSecond !== undefined && this.elapsed > untilSecond ) {
			console.watchAnim(this,'createPerSec EARLY EXIT');
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
		console.assert( entity.typeId && entity.id && entity.img );
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
		console.assert( Number.isFinite(dt) );
		if( dt == 0 ) {
			debugger;
			return;
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
			// Very important that this be >= duration, not just >
			if( this.elapsed >= this.duration ) {
				return this.die( 'anim duration complete' );
			}
		}

		// This must happen AFTER the delay, and after all duration checks. If you do it
		// too soon then the animation might never get an "initial" tick of ZERO, which it
		// really should, when you think about it.
		this.elapsed += dt;
		if( Number.isFinite(this.duration) ) {
			this.elapsed = Math.min(this.elapsed,this.duration);
		}
		console.watchAnim( this, 'ANIM elapsed=', this.elapsed );

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
	traverse(fn) {
		return this.list.forEach(fn);
	}
	add(anim) {
		this.traverse( a => {
			if( a.id == anim.id ) {
				// Whoops! This anim is already in the list!
				console.assert(false);
			}
		});
		this.list.push(anim);

		// WARNING: This is really the wrong way to do this. Rather the viewMap should
		// just always draw all animations.
		Gui.dirty('map');
		return anim;
	}
	remove(fn,note) {
		this.traverse( anim => {
			if( fn(anim) ) {
				// console.log('AnimationManager.removed ',anim.groupId,'note='+note);
				anim.die(note); 
			}
		});
		Gui.dirty('map');
	}
	tick720(dt720) {
		console.assert( Time.is720(dt720) );
		let dt = Time.from720(dt720);

		//console.logAnim('AnimMgr tick=',dt);
		this.traverse( anim => {
			anim.tick(dt);
		});
		Array.filterInPlace( this.list, anim => !anim.dead );
	}
}



return {
	Anim: Anim,
	AnimationManager: AnimationManager,
	deltaToDeg: deltaToDeg,
	toRad: toRad
}

});

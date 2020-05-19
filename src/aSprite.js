Module.add('aSprite',function() {

let radNorm = function(rad) {
	while( rad >= Math.PI ) rad -= Math.PI*2;
	while( rad <= -Math.PI ) rad += Math.PI*2;
	return rad;
}

let degNorm = function(deg) {
	deg += 360*10;
	return deg % 360;
}

class AnimSprite extends Sprite {
	sScale(scale) {
		this.scale = scale;
		return this;
	}
	sReset() {
		this.rx = 0;
		this.ry = 0;
		this.qx = 0;
		this.qy = 0;
		this.xVel = 0;
		this.yVel = 0;
		this.sScale(1.0);
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
	sQuiverSet(x,y) {
		this.qx = x;
		this.qy = y;
		return this;
	}
	sQuiver(rate,range=0.5) {
		this.quiver = (this.quiver||0) - this.dt;
		if( this.quiver <= 0 ) {
			let rad = Random.floatRange(0,2*Math.PI);
			this.qx = Math.cos(rad)*range;
			this.qy = Math.sin(rad)*range;
			this.quiver += rate;
		}
		return this;
	}
	sDuration(duration) {
		this.duration = duration;
		return this;
	}
	sVel(deg,vel) {
		this.deg = deg;
		this.vel = vel;
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
	// Some really nice demonstrations of interpolation curves:
	// http://sol.gfxile.net/interpolation/
	get sPctDone() {
		console.assert( Number.isFinite(this.duration) );
		console.assert( this.elapsed <= this.duration );
		console.watchSprite(this,'sPctDone=',this.elapsed/this.duration);
		return this.elapsed/this.duration;
	}
	get tLinear() {
		return this.sPctDone;
	}
	get tSquared() {
		return this.sPctDone*this.sPctDone;
	}
	get tInvSquared() {
		let p = this.sPctDone;
		return 1-(1-p)*(1-p);
	}
	get tCubed() {
		let p = this.sPctDone;
		return p*p*p;
	}
	get tInvCubed() {
		let p = this.sPctDone;
		return 1-(1-p)*(1-p)*(1-p);
	}
	get tSine() {
		return Math.sin( this.sPctDone * Math.PI / 2);
	}
	sOverTime(atZero,atOne) {
		return atZero + this.sPctDone*(atOne-atZero);
	}
	sRotate(deg) {
		this.rotation += (deg/360*2*Math.PI);
		console.assert( !isNaN(this.rotation) );
		return this;
	}
	sRotation(deg) {
		this.rotation = (deg/360*2*Math.PI);
		console.assert( !isNaN(this.rotation) );
		return this;
	}
	// Starts at zero, then goes down, and then back up again.
	sSine(centroid,magnitude,pct) {
		return centroid + (magnitude * Math.sin( (180/360*2*Math.PI) + pct*2*Math.PI ));
	}

	// dSine stands for 'distribution sine', like a normal distribution but a sine wave
	// Returns a sine wave that starts at zero, peaks at 1 at 0.5, and ends back at zero.
	dSine(pct) {
		return ( Math.sin( (pct-0.25) * Math.PI * 2 ) + 1 ) / 2.0;
	}

	sDiverge(pct) {

		let dx = this.origin.x - this.follow.x;
		let dy = this.origin.y - this.follow.y;

		let dist = Distance.get(dx,dy);
		let divergenceMagnitude = this.divergence || 0.0;

		let xPerp = (-dy/dist) * divergenceMagnitude;
		let yPerp = (dx/dist)  * divergenceMagnitude;

		let xDiverge = xPerp * this.dSine(pct)*0.5;
		let yDiverge = yPerp * this.dSine(pct)*0.5;

		this.rx += xDiverge;
		this.ry += yDiverge;

		return this;
	}

	sMissile(pct) {

		let dx = this.origin.x - this.follow.x;
		let dy = this.origin.y - this.follow.y;

		this.rx = dx * (1-pct);
		this.ry = dy * (1-pct);

		return this;
	}

	sArrived(tolerance) {
		return this.rx < tolerance && this.ry < tolerance;
	}

	constructor(anim,id) {
		super();
		console.assert(id);
		this._id        = id;		// filled in elsewhere
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

	get id() {
		return this._id;
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

	get origin() {
		return this.anim.origin;
	}

	get follow() {
		return this.anim.follow;
	}

	get xWorld() {
		if( !this.follow ) {
			return this._xWorld;
		}
		let s = this.area.spriteGetById(this.follow.id);
		return (s ? s.xVisual : this.follow.x) + (this.anim.followOfs?this.anim.followOfs.x||0:0);
	}

	get yWorld() {
		if( !this.follow ) {
			return this._yWorld;
		}
		let s = this.area.spriteGetById(this.follow.id);
		return (s ? s.yVisual : this.follow.y) +(this.anim.followOfs?this.anim.followOfs.y||0:0);
	}

	die(note) {
		super.die(note);
		this.setVisibleFalse();
	}

	init(pixiSprite,duration) {
		this.duration = Number.isFinite(duration) ? duration : true;
		if( this.anim.at ) {
			this._xWorld = this.anim.at.x;
			this._yWorld = this.anim.at.y;
		}
		this.pixiSprite = pixiSprite;

		this.xAnchor    = this.anim.xAnchor!==undefined ? this.anim.xAnchor : 0.5;
		this.yAnchor    = this.anim.yAnchor!==undefined ? this.anim.yAnchor : 0.5;
		this.scale		= this.anim.scale  !==undefined ? this.anim.scale : 1.0;
		this.alpha  	= this.anim.alpha  !==undefined ? this.anim.alpha : 1.0;
		this.zOrder     = Tile.zOrder.ANIM;

		console.watchSprite( this, ' at '+this.xWorld+','+this.yWorld+' duration='+this.duration );

		return this;

	}

	setVisibleFalse() {
		if( this.isPuppeteer ) {
			return;
		}
		this.visible = false;
	}

	tick( dt, observer, pane ) {

		dt /= Rules.displayVelocity;

		if( this.dead ) {
			return this.setVisibleFalse();
		}
		if( this.anim.dead ) {
			return this.die('owning anim died');
		}

		this.observer = observer;
		console.assert( !this.follow || this._xWorld===null );
		if( this.delay ) {
			this.setVisibleFalse();
			console.watchSprite( this, '?spDelay','sprite delaying' );
			return;
		}
		console.watchSprite( this, '?spRunning','sprite running '+this.elapsed+' ; dt='+dt);
//		if( this.anim.watch ) {
//			debugger;
//		}

		this.dt = dt;
		console.watchSprite( this, 'elapsed='+this.elapsed+' dt='+dt);
		// Very important that this be >= duration, not just >
		if( Number.isFinite(this.duration) && this.elapsed >= this.duration ) {
			return this.die('duration elapsed');
		}

		if( this.area.id !== this.observer.area.id || !this.manager.clip.contains(this.x,this.y) ) {
			return this.die( 'clipped' );
		}

		this.inPane = pane.inSightOf(this.observer,this.xWorld,this.yWorld);

		// Allow some control of the sprite. Be sure this is BEFORE the assignment of xVisual.
		if( this.anim.onSpriteTick ) {
			if( this.anim.onSpriteTick( this ) === false ) {
				return this.die( 'onSpriteTick said false' );
			}
		}

		this.visible = true;
		this.xVisual = this.xWorld + this.rx + this.qx;
		this.yVisual = this.yWorld + this.ry + this.qy;
		if( this.anim.watch ) {
			console.watchSprite( this, 'at', String.coords(this.xVisual,this.yVisual) );
		}

		this.updatePixiSprite(pane);

		// Do this after testing elapsed, so you get at least one tick of action.
		// Also, everything in the sprite should get one tick at ZERO elapsed, which
		// again means that this must happen very last.
		this.elapsed += dt;

		if( Number.isFinite(this.duration) ) {
			this.elapsed = Math.min(this.elapsed,this.duration);
		}

	}
}

return {
	AnimSprite: AnimSprite
}

});
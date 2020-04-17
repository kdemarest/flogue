Module.add('aSprite',function() {

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
	get sPct() {
		console.assert( Number.isFinite(this.duration) );
		return this.elapsed/this.duration;
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

	get follow() {
		return this.anim.follow;
	}

	get xWorld() {
		return this.follow ? this.follow.x : this._xWorld;
	}

	get yWorld() {
		return this.follow ? this.follow.y : this._yWorld;
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

		this.anim.historyAdd( this.id+' at '+this.xWorld+','+this.yWorld+' duration='+this.duration );

		return this;

	}

	setVisibleFalse() {
		if( this.isPuppeteer ) {
			return;
		}
		this.visible = false;
	}

	die() {
		this.dead = true;
		this.setVisibleFalse();
	}

	tick( dt, observer, pane ) {
		if( this.dead ) {
			return this.setVisibleFalse();
		}
		if( this.anim.dead ) {
			this.anim.historyAdd( this.id+' DEAD SPRITE owning anim died.' );
			return this.die();
		}

		this.observer = observer;
		console.assert( !this.follow || this._xWorld===null );
		if( this.delay ) {
			this.setVisibleFalse();
			this.anim.historyAddOne('spDelay','sprite delaying');
			return;
		}
		this.anim.historyAddOne('spRunning','sprite running '+this.elapsed+' ; dt='+dt);
//		if( this.anim.watch ) {
//			debugger;
//		}

		this.dt = dt;
		this.anim.historyAdd('elapsed='+this.elapsed+' dt='+dt);
		if( Number.isFinite(this.duration) && this.elapsed > this.duration ) {
			this.anim.historyAdd( this.id+' DEAD SPRITE  duration elapsed.' );
			return this.die();
		}
		// Do this after testing elapsed, so you get at least one tick of action.
		this.elapsed += dt;

		if( this.area.id !== this.observer.area.id || !this.manager.clip.contains(this.x,this.y) ) {
			this.anim.historyAdd( this.id+' DEAD SPRITE out of area or clipped.' );
			return this.die();
		}

		this.inPane = pane.inSightOf(this.observer,this.xWorld,this.yWorld);

		// Allow some control of the sprite. Be sure this is BEFORE the assignment of xVisual.
		if( this.anim.onSpriteTick ) {
			if( this.anim.onSpriteTick( this ) === false ) {
				this.anim.historyAdd( this.id+' DEAD SPRITE onSpriteTick said false.' );
				return this.die();
			}
		}

		this.visible = true;
		this.xVisual = this.xWorld + this.rx + this.qx;
		this.yVisual = this.yWorld + this.ry + this.qy;
		if( this.anim.watch ) {
			this.anim.historyAdd( this.id+' at '+this.xVisual+','+this.yVisual );
			console.log(this);
		}

		this.updatePixiSprite(pane);

	}
}

return {
	AnimSprite: AnimSprite
}

});
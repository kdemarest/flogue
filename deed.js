// DEED

class Deed {
	// Set duration = true for perpetual
	constructor(cause,entity,duration,stat,op,value,onTick,onEnd,data) {
		if( entity[stat] === undefined ) {
			debugger;
		}
		this.cause = cause;
		this.entity = entity;
		this.stat = stat;
		this.op = op;
		this.value = value;
		this.duration = duration;
		this.onTick = onTick;
		this.onEnd = onEnd;
		this.data = data;
		this.timeLeft = duration;
		this.killMe = false;
	}
	expired() {
		return this.killMe || (this.timeLeft!==true && this.timeLeft <= 0);
	}
	applyEffect() {
		if( this.op == 'set' ) {
			this.entity[this.stat] = this.value;
		}
		if( this.op == 'add' ) {
			if( typeof this.entity[this.stat] === 'string' ) {
				this.entity[this.stat] = String.arAdd(this.entity[this.stat],this.value);
			}
			else {
				this.entity[this.stat] += this.value;
			}
		}
		if( this.op == 'sub' ) {
			if( typeof this.entity[this.stat] === 'string' ) {
				this.entity[this.stat] = String.arSub(this.entity[this.stat],this.value);
			}
			else {
				this.entity[this.stat] -= this.value;
			}
		}
	}
	end() {
		if( this.killMe ) {
			return false;
		}
		if( this.onEnd ) {
			this.onEnd(this.entity,this.data);
		}
		this.killMe = true;
		return true;
	}
	tick(dt) {
		if( this.killMe || !this.doTick ) {
			return;
		}
		if( this.timeLeft !== true ) {
			this.timeLeft -= dt;
		}
		if( this.expired() ) {
			this.end();
		}
		else
		if( this.onTick ) {
			this.onTick(this.entity,dt,this.data);
		}
	}
}

let DeedManager = (new class {
	constructor() {
		this.handler = {};
		this.deedList = [];
	}
	// If an item was involved, then the cause should be the item, and other functions must find the owner.
	add(cause,entity,duration,stat,op,value,onTick,onEnd,data) {
		let handlerFn = this.handler[stat+'_'+op];
		if( handlerFn ) {
			handlerFn(cause,entity,value);
		}
		else {
			this.deedList.push( new Deed(cause,entity,duration,stat,op,value,onTick,onEnd,data) );
		}
	}
	addHandler(stat,op,handlerFn) {
		this.handler[stat+'_'+op] = handlerFn;
	}
	calcStat(entity,stat) {
		let oldValue = entity[stat];
		if( entity.type[stat] === undefined ) {
			debugger;
		}
		entity[stat] = entity.type[stat];
		for( let deed of this.deedList ) {
			if( !deed.killMe && deed.entity.id == entity.id && deed.stat == stat ) {
				deed.applyEffect();
			}
		}
		deedTell(entity,stat,oldValue,entity[stat]);
	}
	calc(entity) {
		let statList = {};
		// WEIRD!! If we just ended a deed, we must STILL calc the value, at least once, so that we can
		// emit notice that it happened!
		this.deedList.map(
			deed => { statList[deed.stat] = true; }
		);
		Object.entries(statList).forEach(
			([stat,dummy]) => { this.calcStat(entity,stat); }
		);
	}
	forceSingle(entity,stat,value) {
		this.end( deed => deed.entity.id==entity.id && deed.stat==stat );
		this.calcStat(entity,stat);
		if( entity[stat] !== value ) {
			// this is a little hacked for invisibility. We'll have to see whether it is the right way for everything...
			this.add(entity,entity,true,stat,'set',value);
			this.calcStat(entity,stat);
		}
	}
	end(fn) {
		let count = 0;
		for( let deed of this.deedList ) {
			if( !deed.killMe && fn(deed) ) {
				if( deed.end() ) {
					count++;
				}
			}
		}
		return count;
	}
	cleanup() {
		Array.filterInPlace(this.deedList, deed => !deed.killMe );
	}
	tick(entity,dt) {
		// This makes sure that any deeds added while ticking do NOT actually tick this round.
		this.deedList.map( deed => deed.doTick=true );
		for( let deed of this.deedList ) {
			if( deed.entity.id == entity.id ) {
				deed.tick(dt);
			}
		}
	}
}());

let deedAdd = function() {
	return DeedManager.add(...arguments);
}

let deedEnd = function(fn) {
	return DeedManager.end(fn);
}

let effectApply = function(cause,effect,target) {
	//Some effects will NOT start unless their requirements are met. EG, no invis if you're already invis.
	if( effect.requires && !effect.requires(target) ) {
		tell(mSubject,cause,' has no effect on ',mObject,target);
		return false;
	}

	if( target.isPosition ) {
		if( !effect.onTargetPosition ) {
			return false;
		}
		let map = target.map || cause.map || cause.owner.map;
		effect.onTargetPosition(map,target.x,target.y)
		return true;
	}
	deedAdd(cause,target,rollDice(effect.duration),effect.stat,effect.op,rollDice(effect.value),effect.onTick,effect.onEnd);
	return true;
}

let deedTell = function(entity,stat,oldValue,newValue ) {
	if( typeof oldValue == 'string' ) {
		// we have to do this before comparing, below, because we do NOT keep the elements sorted.
		let ov = oldValue;
		let nv = newValue;
		oldValue = String.arExtra(ov,nv);
		newValue = String.arExtra(nv,ov);
	}
	if( oldValue == newValue ) {
		return;
	}
	let teller = SayStatList;
	let content = (teller[stat] || teller._generic_)(entity,null,oldValue,newValue);
	tell(...content);
}

DeedManager.addHandler('health','add',function(cause,entity,value) {
	entity.takeHealing(cause,value,cause.effect.healingType);
});
DeedManager.addHandler('health','sub',function(cause,entity,value) {
	entity.takeDamage(cause,value,cause.effect.damageType,cause.effect.onAttack);
});
DeedManager.addHandler('position','push',function(cause,entity,value) {
	while( cause.cause ) {
		cause = cause.cause;
	}
	entity.takePush(cause,value);
});

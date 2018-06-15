// DEED

class Deed {
	// Set duration = true for perpetual
	//effect,target,source,item
	constructor(_effect) {
		if( _effect.stat && _effect.target[_effect.stat] === undefined ) {
			debugger;
		}
		Object.assign( this, _effect );
		this.timeLeft = this.isInstant ? false : this.duration;
		this.killMe = false;
	}
	expired() {
		if( this.killMe ) return true;
		let done = ( this.timeLeft!==true && this.timeLeft <= 0 );
		if( done && this.additionalDoneTest ) {
			done = this.additionalDoneTest(this);
		}
		return done;
	}
	applyEffect() {
		if( this.handler ) {
			this.handler();
			return;
		}
		if( this.op == 'set' ) {
			this.target[this.stat] = this.value;
		}
		if( this.op == 'add' ) {
			if( typeof this.target[this.stat] === 'string' ) {
				if( !String.arIncludes(this.target[this.stat],this.value) ) {
					this.target[this.stat] = String.arAdd(this.target[this.stat],this.value);
				}
			}
			else {
				this.target[this.stat] += this.value;
			}
		}
		if( this.op == 'sub' ) {
			if( typeof this.target[this.stat] === 'string' ) {
				this.target[this.stat] = String.arSub(this.target[this.stat],this.value);
			}
			else {
				this.target[this.stat] -= this.value;
			}
		}
	}
	end() {
		if( this.killMe ) {
			return false;
		}
		if( this.onEnd ) {
			this.onEnd(this.target,this.data);
		}
		this.killMe = true;
		return true;
	}
	tick(dt) {
		console.assert( !this.isInstant );
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
			if( this.handler ) {
				this.handler(dt);
			}
			this.onTick(this.target,dt,this.data);
		}
	}
}

let DeedManager = (new class {
	constructor() {
		this.handler = {};
		this.deedList = [];
	}
	// The origin should ALWAYS be an item, unless intrinsic to a monster.
	add(effect) {
		effect.handler = this.handler[effect.op];
		let deed = new Deed(effect);
		if( deed.isInstant ) {
			deed.handler(false);
			deed.end();
		}
		else {
			this.deedList.push( deed );
		}
	}
	addHandler(op,handlerFn) {
		this.handler[op] = handlerFn;
	}
	// This recalculates all the stats of a target. Typically performed when a new
	// effect starts, or one expires.
	calcStat(target,stat) {
		let oldValue = target[stat];
		if( target.baseType[stat] === undefined ) {
			debugger;
		}
		target[stat] = target.baseType[stat];
		for( let deed of this.deedList ) {
			if( !deed.killMe && deed.target.id == target.id && deed.stat == stat ) {
				deed.applyEffect();
			}
		}
		deedTell(target,stat,oldValue,target[stat]);
	}
	calc(target) {
		let statList = {};
		// WEIRD!! If we just ended a deed, we must STILL calc the value, at least once, so that we can
		// emit notice that it happened!
		this.deedList.map(
			deed => { if( deed.stat && deed.target.id==target.id) { statList[deed.stat] = true; } }
		);
		Object.entries(statList).forEach(
			([stat,dummy]) => { this.calcStat(target,stat); }
		);
	}
	forceSingle(effect,target,source,item) {
		effect = Object.assign( {}, effect, { target: target, source: source, item: item } );
		this.end( deed => deed.target.id==effect.target.id && deed.stat==effect.stat );
		this.calcStat(effect.target,effect.stat);
		if( effect.target[effect.stat] !== effect.value ) {
			// this is a little hacked for invisibility. We'll have to see whether it is the right way for everything...
			this.add(effect);
			if( effect.stat ) {
				this.calcStat(effect.target,effect.stat);
			}
		}
	}
	findFirst(fn) {
		for( let deed of this.deedList ) {
			if( !deed.killMe && fn(deed) ) {
				return deed;
			}
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
	tick(target,dt) {
		// This makes sure that any deeds added while ticking do NOT actually tick this round.
		this.deedList.map( deed => deed.doTick=true );
		for( let deed of this.deedList ) {
			if( deed.target.id == target.id ) {
				deed.tick(dt);
			}
		}
	}
}());

let effectApply = function(effect,target,source,item) {
	let effectShape = effect.effectShape || EffectShape.SINGLE;
	if( effectShape == EffectShape.SINGLE ) {
		return effectApplyTo(effect,target,source,item);
	}
	let dist = 0;
	if( effectShape == EffectShape.SMALL ) {
		dist = 1;
	}
	if( effectShape == EffectShape.MEDIUM ) {
		dist = 2;
	}
	if( effectShape == EffectShape.LARGE ) {
		dist = 3;
	}
	if( radius ) {
		for( let y=-dist ; y<=dist ; ++y ) {
			for( let x=-dist ; x<=dist ; ++x ) {
				effectApplyTo(source,item,effect,target);
			}
		}
		return;
	}
}

// Converts the effect from just itself to a Deed, essentially, which means adding or setting
// effect.target
// effect.source
// effect.item
// effect.value
// effect.duration
// effect.isResist

function animFloatUp(target,icon,delay) {
	if( icon !== false ) {
		new Anim( {}, {
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
	new Anim( {}, {
		follow: 	target,
		img: 		icon,
		duration: 	0.2,
		delay: 		delay || 0,
		onInit: 		a => { a.create(1); },
		onSpriteMake: 	s => { s.sScaleSet(0.75); },
		onSpriteTick: 	s => { }
	});
}

let effectApplyTo = function(effect,target,source,item) {

	// Now we can change the value inside it without metting up the origin effect.
	effect = Object.assign( {}, effect, { target:target, source: source, item: item });

	if( !effect.op ) {
		// This is an inert effect. Do nothing.
		return false;
	}
	if( target.isTileType && !target.isPosition ) {
		debugger;
	}

	//Some effects will NOT start unless their requirements are met. EG, no invis if you're already invis.
	if( effect.requires && !effect.requires(target,effect) ) {
		tell(mSubject,item || source || 'that',' has no effect on ',mObject,target);
		return false;
	}
	// DUPLCATE CODE to the calcBestWeapon...
	let isImmune = false;
	isImmune = isImmune || (target.isImmune && target.isImmune(effect.typeId));
	isImmune = isImmune || (target.isImmune && target.isImmune(effect.op));
	isImmune = isImmune || (effect.op=='set' && target.isImmune && target.isImmune(effect.value));
	if( isImmune ) {
		tell(mSubject,target,' is immune to ',mObject,effect);
		new Anim( {}, {
			follow: 	target,
			img: 		StickerList.showImmunity.img,
			duration: 	0.2,
			delay: 		effect.rangeDuration || 0,
			onInit: 		a => { a.create(1); },
			onSpriteMake: 	s => { s.sScaleSet(0.75); },
			onSpriteTick: 	s => { }
		});
		return false;
	}

	// Note that spells with a duration must last at least 1 turn!
	// This should almost certainly move the DEFAULT_EFFECT_DURATION usage into the Picker.
	effect.duration = (effect.isInstant || effect.duration===0 ? 0 :
		((item && item.inSlot) || effect.duration==true ? true :
		Math.max(1,(effect.duration || DEFAULT_EFFECT_DURATION) * (effect.durationMod||1))
	));
	let isResist = false;
	// I can resist a specific effect type, like "eFire"
	isResist = isResist || (target.isResist && target.isResist(effect.typeId));
	// I can resist an effect operation, like "shove"
	isResist = isResist || (target.isResist && target.isResist(effect.op));
	// I can resist a value that is being set, like "panicked"
	isResist = isResist || (effect.op=='set' && target.isResist && target.isResist(effect.value));
	effect.isResist = isResist;

	if( isResist && effect.isInstant && Math.chance(50) ) {
		tell(mSubject,target,' resists the effects of ',mObject,effect);
		animOver(target,StickerList.showResistance.img,effect.rangeDuration);
		return false;
	}

	if( isResist && !effect.isInstant && effect.duration !== true ) {
		tell(mSubject,target,' seems partially afected by ',mObject,effect);
		effect.duration = effect.duration * 0.50;
		animOver(target,StickerList.showResistance.img,effect.rangeDuration);
	}

	if( effect.icon !== false ) {
		if( source && source.command == Command.CAST ) {
			// Icon flies to the target
			let dx = target.x-source.x;
			let dy = target.y-source.y;
			let rangeDuration = Math.max(0.1,Math.sqrt(dx*dx+dy*dy) / 15);
			if( item ) item.rangeDuration = rangeDuration;
			source.rangeDuration = rangeDuration;
			effect.rangeDuration = rangeDuration;
			new Anim({
				x: 			source.x,
				y: 			source.y,
				img: 		effect.icon,
				duration: 	rangeDuration,
				onInit: 		a => { a.create(1); },
				onSpriteMake: 	s => { s.sVelTo(dx,dy,rangeDuration).sScaleSet(0.6); },
				onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel); }
			});
		}
		animFloatUp(target,effect.icon || StickerList.eGeneric.img,effect.rangeDuration);
	}

	effect.value = rollDice(effect.value);

	if( target.isPosition ) {
		if( !effect.onTargetPosition ) {
			return false;
		}
		target.map.toEntity(target.x,target.y,target);
		effect.onTargetPosition(target.map,target.x,target.y)
	}
	else {
		// Remember that by this point the effect has the target, source and item already inside it.
		DeedManager.add(effect);
	}

	// Note that rechargeTime CAN NOT be in the effect, because we're only dealing with a
	// copy of the effect. There is no way for the change to rechargeTime to get back to the original effect instance.
	if( item && item.ammoOf ) {
		let weapon = item.ammoOf;
		if( weapon && weapon.rechargeTime !== undefined ) {
			weapon.rechargeLeft = weapon.rechargeTime;
		}
		item.ammoOf = null;
	}

	if( item && item.rechargeTime !== undefined ) {
		item.rechargeLeft = item.rechargeTime;
	}
	else
	if( source && source.rechargeTime !== undefined ) {
		source.rechargeLeft = source.rechargeTime;
	}

	return true;
}

let deedTell = function(target,stat,oldValue,newValue ) {
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
	let teller = Gab.describeStatChange;
	let content = (teller[stat] || teller._generic_)(target,null,oldValue,newValue);
	tell(...content);
}

DeedManager.addHandler('heal',function() {
	this.target.takeHealing(this.source,this.value,this.healingType);
});
DeedManager.addHandler('damage',function() {
	this.target.takeDamage(this.source,this.item,this.value,this.damageType,this.onAttack);
});
DeedManager.addHandler('shove',function() {
	this.target.takeShove(this.source,this.item,this.value);
});

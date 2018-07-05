
class Effect {
	constructor( depth, effectRaw, item=null, rechargeTime=0 ) {
		console.assert( depth !== undefined && typeof depth == 'number' );
		console.assert( typeof effectRaw == 'object' && effectRaw !== null);

		if( effectRaw.isInert ) return;
		if( effectRaw.basis ) console.assert(EffectTypeList[effectRaw.basis]);
		let basis = effectRaw.basis ? EffectTypeList[effectRaw.basis] : null;
		let effect = Object.assign({},basis,effectRaw);
		effect.effectShape = effect.effectShape || EffectShape.SINGLE;

		if( effect.valueDamage ) {
			effect.value = Math.max(1,Math.floor(Rules.pickDamage(depth,rechargeTime||0) * effect.valueDamage));

			console.assert( !isNaN(effect.value) );

			if( item && (item.isWeapon || item.isArmor || item.isShield) ) {
				effect.chanceOfEffect = effect.chanceOfEffect || ( item.isWeapon ? WEAPON_EFFECT_CHANCE_TO_FIRE : ARMOR_EFFECT_CHANCE_TO_FIRE );
				
				if( WEAPON_EFFECT_OP_ALWAYS.includes(effect.op) ) {
					effect.value = Math.max(1,Math.floor(effect.value*WEAPON_EFFECT_DAMAGE_PERCENT/100));
					console.assert( !isNaN(effect.value) );
					effect.chanceOfEffect = 100;
				}
			}
		}
		if( effect.valuePick ) {
			effect.value = effect.valuePick();
		}
		if( item && item.effectOverride ) {
			Object.assign( effect, item.effectOverride );
		}
		// Always last so that all member vars are available to the namePattern.
		effect.name = effect.name || String.tokenReplace(effect.namePattern || 'nameless effect',effect);

		Object.assign( this, effect );
		return this;
	}
	trigger( target, source, item ) {
		return effectApply(this,target,source,item);
	}
}


// DEED

class Deed {
	// Set duration = true for perpetual
	//effect,target,source,item
	constructor(_effect) {
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
			let endNow = this.handler() === false;
			if( endNow ) {
				this.end();
			}
			return;
		}
		let target = this.target;
		let stat = this.stat;
		if( this.op == 'set' ) {
			target[stat] = this.value;
		}
		if( this.op == 'max' ) {
			if( target[stat] === undefined ) {
				target[stat] = this.value;
			}
			else {
				target[stat] = Math.max(target[stat],this.value);
			}
		}
		if( this.op == 'min' ) {
			if( target[stat] === undefined ) {
				target[stat] = this.value;
			}
			else {
				target[stat] = Math.min(target[stat],this.value);
			}
		}
		if( this.op == 'add' ) {
			if( typeof target[stat] === 'string' ) {
				if( !String.arIncludes(target[stat],this.value) ) {
					target[stat] = String.arAdd(target[stat],this.value);
				}
			}
			else {
				if( target[stat] === undefined ) {
					target[stat] = 0;
				}
				target[stat] += this.value;
			}
		}
		if( this.op == 'sub' ) {
			if( typeof target[stat] === 'string' ) {
				target[stat] = String.arSub(target[stat],this.value);
			}
			else {
				if( target[stat] === undefined ) {
					target[stat] = 0;
				}
				target[stat] -= this.value;
			}
		}
	}
	end() {
		if( this.killMe ) {
			return false;
		}
		if( this.onEnd ) {
			this.onEnd.call(this);
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
		{
			if( this.handler ) {
				let endNow = this.handler(dt) === false;
				if( endNow ) {
					this.end();
				}
			}
			if( this.onTick && !this.killMe ) {
				this.onTick(this.target,dt,this.data);
			}
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
		let success = true;
		effect.handler = this.handler[effect.op];
		let deed = new Deed(effect);
		if( deed.isInstant ) {
			success = deed.handler(false);
			deed.end();
		}
		else {
			this.deedList.push( deed );
		}
		return success;
	}
	addHandler(op,handlerFn) {
		this.handler[op] = handlerFn;
	}
	// This recalculates all the stats of a target. Typically performed when a new
	// effect starts, or one expires.
	calcStat(target,stat) {
		let oldValue = target[stat];
//		if( target.baseType[stat] === undefined ) {
//			debugger;
//		}
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
	traverseDeeds(target,fn) {
		for( let deed of this.deedList ) {
			if( deed.target.id == target.id ) {
				fn(deed);
			}
		}		
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

function makeFilledCircle(x0, y0, radius, fn) {

	function strip(sx,ex,y) {
		console.assert(sx<=ex);
		while( sx <= ex ) {
			count += fn(sx,y) ? 1 : 0;
			sx++;
		}
	}
	let self = this;
	let count = 0;
	var x = radius;
	var y = 0;
	var radiusError = 1 - x;

	while (x >= y) {
		strip( x0-x, x0+x, y0-y );
		strip( x0-x, x0+x, y0+y );
		strip( x0-y, x0+y, y0-x );
		strip( x0-y, x0+y, y0+x );
		y++;
		if (radiusError < 0) {
			radiusError += 2 * y + 1;
		}
		else {
			x--;
			radiusError+= 2 * (y - x + 1);
		}
	}
	return count;
}


let effectApply = function(effect,target,source,item) {
	if( !(effect instanceof Effect) ) {
		effect = new Effect(
			item ? item.depth : target.area.depth,
			effect,
			item,
			item ? item.rechargeTime : 0
		);
	}

	let effectShape = effect.effectShape || EffectShape.SINGLE;
	if( effectShape == EffectShape.SINGLE ) {
		return _effectApplyTo(effect,target,source,item);
	}
	let radius = 0;
	let shape = '';
	if( effectShape == EffectShape.BLAST3 ) {
		radius = 1;
		shape = 'circle';
	}
	if( effectShape == EffectShape.BLAST5 ) {
		radius = 2;
		shape = 'circle';
	}
	if( effectShape == EffectShape.BLAST7 ) {
		radius = 3;
		shape = 'circle'
	}
	if( radius ) {
		if( shape == 'circle' ) {
			let area = target.area;
			makeFilledCircle(target.x,target.y,radius, (x,y) => {
				let reached = shootRange(target.x,target.y,x,y, (x,y) => area.map.tileTypeGet(x,y).mayFly);
				if( reached ) {
					animFly( target.x, target.y, x, y, area, effect.icon || StickerList.eGeneric.img, effect.rangeDuration );
					//animAt( x, y, area, effect.icon || StickerList.eGeneric.img, effect.rangeDuration );
					let targetList = new Finder(area.entityList).at(x,y);
					targetList.process( t => {
						_effectApplyTo(effect,t,source,item);
					});
				}
			});
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

let _effectApplyTo = function(effect,target,source,item) {

	// Now we can change the value inside it without messing up the origin effect.
	// This is critically important, because each affected target needs its OWN effect
	// set upon it - for internal counters or whatever.
	effect = Object.assign( {}, effect, { target:target, source: source, item: item });

	if( effect.effectFilter ) {
		if( !effect.effectFilter(effect) ) {
			return;
		}
	}

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

	// Note that spells with a duration must last at least 1 turn!
	effect.duration = (effect.isInstant || effect.duration===0 ? 0 :
		((item && item.inSlot) || effect.duration==true ? true :
		Math.max(1,(effect.duration || Rules.DEFAULT_EFFECT_DURATION) * (effect.durationMod||1))
	));

	if( source && target && source.command == Command.CAST && effect.icon !== false) {
		// Icon flies to the target
		let dx = target.x-source.x;
		let dy = target.y-source.y;
		let rangeDuration = Math.max(0.1,Math.sqrt(dx*dx+dy*dy) / 15);
		if( item ) item.rangeDuration = rangeDuration;
		source.rangeDuration = rangeDuration;
		effect.rangeDuration = rangeDuration;
		new Anim({
			at: 		source,
			img: 		effect.icon,
			duration: 	rangeDuration,
			onInit: 		a => { a.create(1); },
			onSpriteMake: 	s => { s.sVelTo(dx,dy,rangeDuration).sScaleSet(0.6); },
			onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel); }
		});
	}

	if( effect.op == 'damage' ) {
		let tile = target.map.tileTypeGet(target.x,target.y);
		if( tile.isWater && effect.damageType == DamageType.BURN ) {
			tell(mSubject,target,' can not be effected by '+effect.damageType+'s while in ',mObject,tile);
			animFloatUp(target,StickerList.ePoof.img,effect.rangeDuration);
			return false;
		}
		if( tile.isFire && effect.damageType == DamageType.FREEZE ) {
			tell(mSubject,target,' can not be effected by '+effect.damageType+'s while in ',mObject,tile);
			animFloatUp(target,StickerList.ePoof.img,effect.rangeDuration);
			return false;
		}
	}

	// DUPLCATE CODE to the calcBestWeapon...
	let isImmune = false;
	isImmune = isImmune || (target.isImmune && target.isImmune(effect.typeId));
	isImmune = isImmune || (target.isImmune && target.isImmune(effect.op));
	isImmune = isImmune || (effect.op=='set' && target.isImmune && target.isImmune(effect.value));
	if( isImmune ) {
		tell(mSubject,target,' is immune to ',mObject,effect);
		animOver( target, StickerList.showImmunity.img, effect.rangeDuration || 0 );
		return false;
	}

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
		tell(mSubject,target,' seems partially affected by ',mObject,effect);
		effect.duration = effect.duration * 0.50;
		animOver(target,StickerList.showResistance.img,effect.rangeDuration);
	}

	effect.value = rollDice(effect.value);

	let success;
	if( target.isPosition ) {
		if( !effect.onTargetPosition ) {
			return false;
		}
		target.map.toEntity(target.x,target.y,target);
		success = effect.onTargetPosition(target.map,target.x,target.y)
	}
	else {
		// Remember that by this point the effect has the target, source and item already inside it.
		success = DeedManager.add(effect);
	}
	if( success !== false && effect.icon !== false && effect.showOnset!==false ) {
		animFloatUp(target,effect.icon || StickerList.eGeneric.img,effect.rangeDuration);
	}

	// Note that rechargeTime CAN NOT be in the effect, because we're only dealing with a
	// copy of the effect. There is no way for the change to rechargeTime to get back to the original effect instance.
	if( item && item.ammoOf ) {
		let weapon = item.ammoOf;
		if( weapon && weapon.rechargeTime !== undefined && !effect.chargeless) {
			weapon.rechargeLeft = weapon.rechargeTime;
		}
		item.ammoOf = null;
	}

	if( item && item.rechargeTime !== undefined  && !effect.chargeless) {
		item.rechargeLeft = item.rechargeTime;
	}
	else
	if( source && source.rechargeTime !== undefined  && !effect.chargeless) {
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
	let attacker = this.source;
	if( this.duration === true || this.duration > 0 ) {
		// for non-instant damaging effects, we don't want the attacker to be conveyed, because it will
		// result in effects that make it appear you were jsut attacked, for example by a dead guy, or at range
		attacker = null;
	}

	this.target.takeDamage(attacker,this.item,this.value,this.damageType,this.onAttack);
});
DeedManager.addHandler('shove',function() {
	return this.target.takeShove(this.source,this.item,this.value);
});
DeedManager.addHandler('teleport',function() {
	return this.target.takeTeleport(this.source,this.item);
});
DeedManager.addHandler('strip',function() {
	return !!this.target.stripDeeds(this.stripFn);
});
DeedManager.addHandler('possess',function() {
	if( this.source.isPossessing ) {
		return;
	}
	let success = this.target.takeBePossessed(this,true);
	if( success ) {
		this.onEnd = function() {
			this.target.takeBePossessed(this,false);
		}
	}
	if( !success ) {
		return false;
	}
});
DeedManager.addHandler('drain',function() {
	let entity = this.target;
	let anyDrained = false;
	entity.inventory.forEach( item => {
		if( item.hasRecharge() && item.isRecharged() ) {
			item.resetRecharge() 
			anyDrained = true;
		}
	});
	if( anyDrained ) {
		animFloatUp(this.target,this.icon || StickerList.eGeneric.img);
	}
	return anyDrained;
});

DeedManager.addHandler('killLabel',function() {
	let f = new Finder( this.target.itemList, this.source ).excludeMe().filter( item => item.label == this.value );
	let count = f.count;
	f.process( item => {
		animFloatUp( item, StickerList.ePoof.img );
		item.destroy()
	});
	return count;
});

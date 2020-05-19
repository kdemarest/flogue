Module.add('deed',function() {

/*
Maybe someday every single act in the game should become an effect, and we just compose
them as they happen, and then execute them.
*/

class Effect {
	constructor( depth, effectRaw, item=null, rechargeTime=0 ) {
		console.assert( effectRaw );
		console.assert( depth !== undefined && typeof depth == 'number' );
		console.assert( typeof effectRaw == 'object' && effectRaw !== null);

		if( effectRaw.isInert ) return;
		if( effectRaw.basis ) console.assert(EffectTypeList[effectRaw.basis]);
		let basis = effectRaw.basis ? EffectTypeList[effectRaw.basis] : null;
		let effect = Object.assign({},basis,effectRaw);
		effect.effectShape = effect.effectShape || EffectShape.SINGLE;
		if( effect.op == 'damage' || effect.op == 'possess' ) {
			effect.isHarm = true;
		}

		// Only write into the value if you must. Otherwise, let the world builder or
		// other systems (like 'power' in entity natural attacks) control.
		if( effect.value === undefined && (effect.op == DeedOp.DAMAGE || effect.op == DeedOp.HEAL) ) {
			// WARNING! This could be healing as well as damaging...
			effect.value = Rules.pickDamage(depth,rechargeTime||0,item);
			console.assert( !isNaN(effect.value) );
		}

		if( effect.valuePick && effect.value === undefined ) {
			effect.value = effect.valuePick();
		}
		if( item && item.effectDecorate ) {
			Object.assign( effect, item.effectDecorate );
		}
		// Always last so that all member vars are available to the namePattern and aboutPattern.
		if( effect.name === false ) {
			effect.name = '';
		}
		else {
			String.calcName(effect);
//			effect.name  = String.tokenReplace(effect.namePattern || 'nameless effect',effect);
//			effect.about = String.tokenReplace(effect.aboutPattern || '',effect);
		}

		Object.assign( this, effect );
		return this;
	}
	trigger( target, source, item, context ) {
		return effectApply(this,target,source,item,context);
	}
}

Effect.Op = {
	set: {
		calcFn: (target,stat,value) => {
			target[stat] = value;
		}
	},
	mult: {
		calcFn: (target,stat,value) => {
			if( target.baseType ) {
				// note that this over-rides any other setting of this stat. Haste case second overrides slow
				// for example.
				target[stat] = target.baseType[stat] * value;
			}
		}
	},
	max: {
		calcFn: (target,stat,value) => {
			if( target[stat] === undefined ) {
				target[stat] = value;
			}
			else {
				target[stat] = Math.max(target[stat],value);
			}
		}
	},
	min:  {
		calcFn: (target,stat,value) => {
			if( target[stat] === undefined ) {
				target[stat] = value;
			}
			else {
				target[stat] = Math.min(target[stat],value);
			}
		}
	},
	add: {
		calcFn: (target,stat,value) => {
			if( typeof target[stat] === 'string' ) {
				if( !String.arIncludes(target[stat],value) ) {
					target[stat] = String.arAdd(target[stat],value);
				}
			}
			else {
				if( target[stat] === undefined ) {
					target[stat] = 0;
				}
				target[stat] += value;
			}
		}
	},
	sub: {
		calcFn: (target,stat,value) => {
			if( typeof target[stat] === 'string' ) {
				target[stat] = String.arSub(target[stat],value);
			}
			else {
				if( target[stat] === undefined ) {
					target[stat] = 0;
				}
				target[stat] -= value;
			}
		}
	}
}

Effect.OpAdd = ( opId, actionFn ) => {
	console.assert( !Effect.Op[opId] );
	Effect.Op[opId] = {
		actionFn: actionFn
	};
}


let testValidTimeLeft = (timeLeft) => {
	console.assert( timeLeft===true || timeLeft===false || Number.isFinite(timeLeft) );
}

// DEED

class Deed {
	// Set duration = true for perpetual
	//effect,target,source,item
	constructor(_effect) {
		Object.assign( this, _effect );
		console.assert( this.target );
		if( this.target && this.target.watch ) {
			this.watch = true;
			this.logId = 'Deed '+this.op+' on '+this.target.id;
		}

		console.assert( this.duration !== undefined );
		this.timeLeft = this.duration===0 ? false : this.duration;
		testValidTimeLeft(this.timeLeft);

		this.dead = false;
	}

	get isEndless() {
		return this.duration === true;
	}
	get isInstant() {
		return this.duration === 0;
	}

	get hasCalc() {
		return Effect.Op[this.op].calcFn;
	}
	doCalc( target, stat, value ) {
		return Effect.Op[this.op].calcFn.call( this, target, stat, value );
	}

	get hasAction() {
		return Effect.Op[this.op].actionFn;
	}
	doAction() {
		return Effect.Op[this.op].actionFn.call(this);
	}

	inheritDuration(duration,timeOp) {
		if( this.dead ) return;
		console.assert( this.timeLeft !== false );
		testValidTimeLeft( this.timeLeft );
		if( this.timeLeft === true ) {
			return true;
		}
		if( duration === true ) {
			this.timeLeft = true;
		}
		else {
			this.timeLeft = timeOp==='sum' ? this.timeLeft+duration : Math.max(this.timeLeft,duration);
			testValidTimeLeft(this.timeLeft);
		}
		return this.timeLeft;
	}
	completed() {
		return ( this.timeLeft!==true && this.timeLeft <= 0 );
	}
	expired() {
		if( this.dead ) return true;
		testValidTimeLeft(this.timeLeft);
		let done = ( this.timeLeft!==true && this.timeLeft <= 0 );
		if( done && this.additionalDoneTest ) {
			done = this.additionalDoneTest(this);
		}
		return done;
	}
	calc() {
		if( this.onlyWhen ) {
			if( !this.onlyWhen(this) ) {
				if( this.item && this.item.hasRecharge ) {
					this.item.rechargeLeft = 0;
				}
				return {
					result: 'failed contingency',
					success: false
				};
			}
		}

		console.assert( !this.hasAction );

		let statOld = this.target[this.stat];

		this.doCalc( this.target, this.stat, this.value );

		return {
			statOld:	statOld,
			statNew:	this.target[this.stat],
			status:		this.op,
			success:	true
		}
	}
	end() {
		if( this.dead ) {
			return false;
		}
		console.watchDeed(this,'end()');

		if( this.onEnd ) {
			this.onEnd.call(this,this);
		}
		// WARNING! This must happen before the recalc, or this stat chance will remain in force!
		this.dead = true;
		if( this.stat && this.target ) {
			// WARNING: A forward declared call. Should be illegal, but JS singletons...
			DeedManager.calcStat( this.target, this.stat );
		}
		return true;
	}
	tick(dt) {
		console.assert( dt === 1.0 );

		if( this.dead ) {
			// Note that zero duration deeds might be in the list, with dead true at this moment.
			return;
		}
		console.assert( !(this.duration===0) );
		if( this.timeLeft !== true ) {
			testValidTimeLeft(this.timeLeft);
			console.assert( Number.isFinite(dt) );
			this.timeLeft -= dt;
			testValidTimeLeft(this.timeLeft);
			console.watchDeed(this,'timeLeft = '+Math.fixed(this.timeLeft,3));
		}
		if( this.expired() ) {
			this.end();
		}
		else
		{
			if( this.hasAction ) {
				let result = this.doAction();
				if( result.endNow ) {
					this.end();
				}
			}
			if( this.onTick && !this.dead ) {
				this.onTick(this.target,dt,this.data);
			}
		}
	}
}

let DeedManager = (new class {
	constructor() {
		this.deedList = [];
		this.statsThatCauseImageChanges = { sneak:1 };
		this.statsThatCauseMapRenders = { light: 1, senseBlind:1, senseLiving:1, senseInvisible: 1, sensePerception:1, senseAlert:1, senseDarkVision:1, senseXray:1, senseSmell:1 }
	}
	add(effect) {
		let result = {};
		let deed = new Deed(effect);
		this.deedList.push( deed );
		if( deed.hasAction ) {
			result = deed.doAction();
		}
		if( deed.stat ) {
			result.statOld = deed.target[deed.stat];
			this.calcStat( deed.target, deed.stat );
			result.statNew = deed.target[deed.stat];
		}
		if( deed.onStart ) {
			deed.onStart.call(deed,deed);
		}

		if( deed.duration === 0 || result.success === false ) {
			result.endNow = true;
			deed.end();
			return result;
		}
		result = Object.assign( result, {
			isOngoing: deed.duration !== 0,	// Always true, right!?
			duration: deed.duration,
			status: 'ongoing',
			success: true,
		});
		return result;
	}
	// This recalculates all the stats of a target. Typically performed when a new
	// effect starts, or one expires.
	calcStat(target,stat,isOnset) {
		let oldValue = target[stat];
		target[stat] = target.isMonsterType ? target.getBaseStat(stat) : target.baseType[stat];
		for( let deed of this.deedList ) {
			if( !deed.dead && deed.target.id == target.id && deed.stat == stat ) {
				deed.calc();
			}
		}
		if( stat in this.statsThatCauseImageChanges && oldValue !== target[stat] ) {
			Gui.dirty('map');
		}
		if( target.userControllingMe && stat in this.statsThatCauseMapRenders && oldValue !== target[stat] ) {
			Gui.dirty('map');
			target.area.lightDirty = true;
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
	end(fn) {
		let count = 0;
		for( let deed of this.deedList ) {
			if( !deed.dead && fn(deed) ) {
				if( deed.end() ) {
					count++;
				}
			}
		}
		return count;
	}
	cleanup() {
		Array.filterInPlace(this.deedList, deed => !deed.dead );
	}
	findFirst(fn) {
		for( let deed of this.deedList ) {
			if( !deed.dead && fn(deed) ) {
				return deed;
			}
		}
	}
	traverseDeeds(target,fn) {
		for( let deed of this.deedList ) {
			if( deed.target.id == target.id ) {
				fn(deed);
			}
		}		
	}
	tick720(target,dt720) {
		target._deedTicker = target._deedTicker || new Time.Interval720();

		target._deedTicker.tick( Time.one720, dt720, ()=> {

			console.watchDeed( target, 'tick on second. dt='+Math.fixed(Time.from720(dt720),5) );

			let safeDeedList = this.deedList.slice();
			for( let deed of safeDeedList ) {
				if( (target.isTileTicker && deed.target.isTileEntity) || (deed.target.id == target.id) ) {
					deed.tick(1.0);
				}
			}
		});
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

function getQuickBest(source,item,effect) {
	// When you are using an item of a certain quickness, 
	// You can't wield an item any 
	if( effect.quick ) {
		return effect.quick;
	}
	if( item ) {
		if( item.isTileType ) {
			return Quick.LITHE;
		}
		return item.getQuick();
	}
	if( source && source.getQuick ) {
		return source.getQuick();
	}
	return Quick.NORMAL;
}

let globalEffectDepth = 0;
let globalShapeCache = {};

function makeShapeCache(radius) {
	let temp = [];
	makeFilledCircle(0.5,0.5,radius, (x,y) => {
		x=Math.floor(x);
		y=Math.floor(y);
		temp[x+','+y] = 1;
	});
	let cache = [];
	Object.each( temp, (val,posString) => {
		let pos = posString.split(',')
		cache.push( parseInt(pos[0]), parseInt(pos[1])  );
	});
	return cache;
}

let effectApply = function(effect,target,source,item,context) {
	if( globalEffectDepth > 5 ) {
		debugger;
		return {
			status: 'stackWarning',
			depth: globalEffectDepth,
			success: false
		}
	}
	++globalEffectDepth;
	if( !(effect instanceof Effect) ) {
		effect = new Effect(
			item && item.depth!==undefined ? item.depth : target.area.depth,
			effect,
			item,
			item ? item.rechargeTime : 0
		);
	}

	let delayId = item ? item.id : (source ? source.id : target.id);
	effect.groupDelayId = target.inVoid || !delayId ? delayId : target.area.animationManager.delayManager.makeGroup(delayId);
	

	if( effect.iconOver ) {
		Anim.Upon( target.id, target, effect.iconOver, 0, effect.iconOverDuration || 0.4, effect.iconOverScale || 0.75 );
	}

	let effectShape = Perk.apply( 'effectShape', effect).effectShape || EffectShape.SINGLE;
	if( effectShape == EffectShape.SINGLE ) {
		let result = Effect.applyTo(effect,target,source,item,context);
		globalEffectDepth--;
		return result;
	}
	let radius = 0;
	let shape = '';
	if( effectShape == EffectShape.BLAST2 ) {
		radius = 1;
		shape = 'circle';
	}
	if( effectShape == EffectShape.BLAST3 ) {
		radius = 1.3;
		shape = 'circle';
	}
	if( effectShape == EffectShape.BLAST4 ) {
		radius = 2;
		shape = 'circle';
	}
	if( effectShape == EffectShape.BLAST5 ) {
		radius = 2.4;
		shape = 'circle';
	}
	if( effectShape == EffectShape.BLAST6 ) {
		radius = 3;
		shape = 'circle';
	}
	let result = {
		'status': 'illegalShape',
		success: false
	}
	if( radius ) {
		if( shape == 'circle' ) {
			result.status = 'circle';
			result.list = [];
			let area = target.area;
			if( !globalShapeCache[effectShape] ) {
				globalShapeCache[effectShape] = makeShapeCache(radius);
			}

			Array.traversePairs( globalShapeCache[effectShape], (x,y) => {
				x = x + target.x;
				y = y + target.y;
				let reached = shootRange(target.x,target.y,x,y, (x,y) => area.map.tileTypeGet(x,y).mayFly);
				if( reached ) {
					if( effect.isCloud ) {
						Anim.Cloud( false, x, y, area, source.id, effect.iconCloud || StickerList.ePoof.img );
					}
					else {
						if( !effect.iconOver ) {
							Anim.Fly( effect.groupDelayId, 0, target.x, target.y, x, y, area, effect.icon || StickerList.eGeneric.img );
						}
					}
					//Anim.At( x, y, area, effect.icon || StickerList.eGeneric.img, effect.rangeDuration );
					let targetList = [];
					let ignoreSourceId = source ? source.id : '';
					let monsterList = new Finder(area.entityList).isAt(x,y).filter( entity => entity.id !== ignoreSourceId );
					if( monsterList.count ) {
						targetList.push(...monsterList.all);
					}
					let itemList = area.map.findItemAt(x,y);
					if( itemList.count ) {
						targetList.push(...itemList.all);
					}
					targetList.push( area.map.getTileEntity(x,y) );
					targetList.forEach( t => {
						let r = Effect.applyTo(effect,t,source,item,context);
						result.list.push( r );
						result.success = result.success || r.success;
					});
				}
			});
		}
	}
	--globalEffectDepth;
	return result;
}

// Converts the effect from just itself to a Deed, essentially, which means adding or setting
// effect.target
// effect.source
// effect.item
// effect.value
// effect.duration
// effect.isResist
// 	requires = a function that must return true at onset for the effect to happen.

Effect.applyTo = function(effect,target,source,item,context) {


	function testContextHarm(context) {
		return context == Command.SHOOT || context == Command.ATTACK;
	}

	// Now we can change the value inside it without messing up the origin effect.
	// This is critically important, because each affected target needs its OWN effect
	// set upon it - for internal counters or whatever.

	effect = Object.assign( {}, effect, { target:target, source: source, item: item, context: context });

	let isHarm = effect.isHarm || testContextHarm(context);

	// Weapons have an automatic chance to fire any knock-on effects they own. Damage
	// fires always, and others have a percent chance.
	
	let secondary = [];
	if( !effect.isSecondary && item ) {
		if( item.isWeapon && item.effect ) {
			secondary.push( { effect: item.effect, chance: item.chanceEffectFires } );
		}
		let shooter = Perk.apply( 'shooter', { source: effect.source, item: item.shooter } ).item;
		if( shooter ) {
			// Certain ranged weapons (bows) convey a lot of effects into their ammo.
			// Note that this is ALL on the temp effect created above, so it won't
			// be permanent!
			if( effect.op=='damage' && shooter.ammoDamage == 'convey' ) {
				effect.value = shooter.damage;
			}
			if( effect.op=='damage' && shooter.ammoDamage == 'combine' ) {
				effect.value += shooter.damage;
			}
			if( effect.op=='damage' && shooter.ammoDamageType == 'convey' && shooter.effect ) {
				effect.damageType = shooter.effect.damageType;
			}
			if( shooter.ammoQuick == 'mine' ) {
				effect.quick = shooter.getQuick();
			}
			if( shooter.ammoEffect == 'addMine' && shooter.effect ) {
				secondary.push( {effect: shooter.effect, chance: shooter.chanceEffectFires } );
			}
		}
		Perk.apply( 'secondary', effect, { secondary: secondary } );
	}

	function hasCoords(e) {
		return !e.inVoid && e.x!==undefined;
	}

	function makeResult(status,success) {
		result.status = status;
		result.success = success;
		return result;
	}

	let result = {
		effect: 		effect,
		effectResult: 	null,
		status: 		null,
		success: 		false
	};

	if( target.invulnerable && (isHarm || effect.isDeb) ) {
		tell(mSubject|mCares,target,' is invulnerable.');
		return makeResult('invulnerable',false);
	}

	let delayId = effect.groupDelayId || (item ? item.id : (source ? source.id : target.id));
	// Effects might be inert. Do nothing in that case.
	if( !effect.op ) {
		return makeResult('inert',false);
	}

	if( effect.stat && !(target.isMonsterType || target.isItemType) ) {
		return makeResult('statChangesNotAllowed',false);
	}

	// This should happen first because it means that the effect was never intended
	// to affect this kind of target in the first place.
	if( effect.effectFilter ) {
		if( !effect.effectFilter(effect) ) {
			return makeResult('notEligibleTarget',false);
		}
	}

	// If this is done from range, but not thrown (because item.giveTo() handles throwing Animation),
	// show the item hurtling through the air.
	let flyingIcon = effect.flyingIcon || effect.icon;
	if( !effect.isSecondary && source && hasCoords(target) && (context == Command.CAST || context == Command.ATTACK) && (flyingIcon !== false && flyingIcon !== undefined)) {
		// Icon flies to the target
		let dx = target.x-source.x;
		let dy = target.y-source.y;
		let rangeDuration = Math.max(0.1,Distance.get(dx,dy) / 15);
		if( item ) item.rangeDuration = rangeDuration;
		source.rangeDuration = rangeDuration;
		effect.rangeDuration = rangeDuration;
		new Anim({
			at: 		source,
			img: 		flyingIcon,
			delayId: 	delayId,
			duration: 	rangeDuration,
			onInit: 		a => { a.create(1); },
			onSpriteMake: 	s => { s.sVelTo(dx,dy,rangeDuration).sScale(0.6); },
			onSpriteTick: 	s => { s.sMoveRel(s.xVel,s.yVel); }
		});
	}

	// Most effects do not have any impact on tiles.
	if( target.isTileType && !effect.doesTiles ) {
		return makeResult('does not affect tiles',false);
	}

	// Most effects do not have any impact on items.
	if( target.isItemType && !effect.doesItems ) {
		return makeResult('does not affect items',false);
	}

	//Some effects will NOT start unless their requirements are met. EG, no invis if you're already invis.
	if( effect.requires && !effect.requires(target,effect) ) {
		tell(mSubject,item || source || 'that',' has no effect on ',mObject,target);
		return makeResult('failedRequirements',false);
	}

	let isSelf = source && source.id == target.id;
	let reach = item && item.reach > 1 ? item.reach : 1;
	let distance = source && hasCoords(source) && hasCoords(target) ? Math.max(Math.abs(target.x-source.x),Math.abs(target.y-source.y)) : 0;
	let isRanged = distance > reach || (item && item.rangeDuration);

	// Find out if this attempt to affect the target simple misses due to
	//  - blindness
	//  - invisible target you can not see
	//  - you aren't overcoming those with senseLiving
	// Note that secondary effects mean you've already been hit and so they're just happening
	if( target.isMonsterType || target.isItemType ) {
		if( !effect.isSecondary && source && source.isMonsterType && !isSelf && ( (source.senseBlind && !source.baseType.senseBlind) || (target.invisible && !source.senseInvisible) || !source.canPerceiveEntity(target) ) ) {
			let chanceToMiss = isRanged ? 75 : 50;
			if( isRanged && source.blindShot ) {
				chanceToMiss = 0;
			}
			if( !isRanged && source.blindFight ) {
				chanceToMiss = 0;
			}
			if( !(source.senseLiving && target.isLiving) && Random.chance100(chanceToMiss) ) {
				tell(mSubject,source,' ',mVerb,'attack',' ',mObject,target,' but in the wrong direction!');
				return makeResult('notVisible',false);
			}
		}
	}

	// Another way to miss is to have the target simply dodge your attack.
	if( target.isMonsterType || target.isItemType ) {
		let quick = getQuickBest(source,item,effect);
		let dodge = target.getDodge();
		let missChance = [0,60,80,90][Math.clamp(dodge-quick,0,3)];
		if( !effect.isSecondary && !isSelf && isHarm && Random.chance100(missChance) ) {
			tell(
				mSubject,
				target,
				' '+['','','','nimbly ','lithely '][dodge],
				mVerb,
				'dodge',
				' ',
				mObject|mPossessive|mCares,
				source ? source : ( item ? item : effect),
				['','clumsy','','nimble',''][quick]+' '+(item?item.name.replace(/\$/,''):'attack')
			);

			if( source ) {
				let dx = target.x - source.x;
				let dy = target.y - source.y;
				let deg = deltaToDeg(dx,dy)+Random.floatRange(-45,45);
				// Show a dodging icon on the entity
				new Anim({
					follow: 	target,
					img: 		StickerList.showDodge.img,
					delayId: 		delayId,
					duration: 	0.2,
					onInit: 		a => { a.create(1); },
					onSpriteMake: 	s => { s.sScale(0.75); },
					onSpriteTick: 	s => { }
				});
				// Make the entity wiggle away a bit.
				new Anim({
					follow: 	target,
					delayId: 	delayId,
					duration: 	0.15,
					onInit: 		a => { a.takePuppet(target); },
					onSpriteMake: 	s => { s.sPosRelDeg(deg,0.3); },
				});
			}
			return makeResult('dodged',false);
		}
	}

	//Some effects are "singular" meaning you can't have more than one of it upon you.
	let singular = effect.singularId ? DeedManager.findFirst( deed => deed.target.id == target.id && deed.singularId == effect.singularId ) : null;
	if( singular && (!effect.singularOp || effect.singularOp == 'fail') ) {
		return makeResult('singularFail',false);
	}


	if( !effect.isSecondary && source && !isSelf && ( isHarm || (item && item.isWeapon) ) ) {
		source.lastAttackTargetId = target.id;	// Set this early, despite blindness!
		source.inCombatTimer = Time.sim.time;
	}

	if( !effect.isSecondary && target.isMonsterType && !isSelf && isHarm ) {
		let shield 		= target.getFirstItemInSlot(Slot.SHIELD);
		let blockType 	= Item.getBlockType(item,effect.damageType);
		let block 		= shield ? shield.calcBlockChance(blockType,isRanged,target.isBraced) : 0;
		if( Random.chance100(block*100) ) {
			tell(mSubject,target,' ',mVerb,'block',' ',mObject,item || {name:'blow'},' with ',mSubject|mPossessive,target,' ',mObject|mPossessed,shield);
			// Overlay a shield icon to show it happened.
			new Anim({
				follow: 	target,
				img: 		StickerList.showResistance.img,
				delayId: 	delayId,
				duration: 	0.2,
				onInit: 		a => { a.create(1); },
				onSpriteMake: 	s => { s.sScale(0.75); },
				onSpriteTick: 	s => { }
			});
			return makeResult('shielded',false);
		}
	}

	if( target.isTileType && !target.isTileEntity ) {
		debugger;
	}

	// Note that spells with a duration must last at least 1 turn!
	// Duration must be determined here in order to be used in singular, below.
	if( effect.duration === undefined ) {
		effect.duration = Math.max(1,(effect.duration || Rules.DEFAULT_EFFECT_DURATION) * (effect.xDuration||1))
	}

	// Exclude certain natural damage interactions:
	//   - fire when target is in water
	//   - freeze when target is in fire
	if( effect.op == 'damage' && !target.isMap ) {
		// This must be made a position because tell() can't assess its position otherwise!
		let tile = target.map.getTileEntity( target.x, target.y );
		if( tile.isWater && effect.damageType == DamageType.BURN ) {
			tell(mSubject,target,' can not be affected by '+effect.damageType+'s while in ',mObject,tile);
			Anim.FloatUp(delayId,target,StickerList.ePoof.img);
			return makeResult('elementExclusion',false);
		}
		if( tile.isFire && effect.damageType == DamageType.FREEZE ) {
			tell(mSubject,target,' can not be affected by '+effect.damageType+'s while in ',mObject,tile);
			Anim.FloatUp(delayId,target,StickerList.ePoof.img);
			return makeResult('elementExclusion',false);
		}
	}

	// DUPLCATE CODE to the calcBestWeapon...  Sort of.
	let isImmune = false;
	isImmune = isImmune || (target.isImmune && target.isImmune(effect.typeId));
	isImmune = isImmune || (target.isImmune && target.isImmune(effect.op));
	isImmune = isImmune || (target.isImmune && target.isImmune(effect.stat));
	isImmune = isImmune || (effect.op=='set' && target.isImmune && target.isImmune(effect.value));
	effect.isImmune = isImmune;
	if( isImmune ) {
		let isItemSoSuppress = target.isItemType;
		if( !isItemSoSuppress ) {
			tell(mSubject,target,' ',mVerb,'is',' immune to ',mObject,effect,'.');
		}
		if( !source || source.id!==target.id ) {
			Anim.Upon( delayId, target, StickerList.showImmunity.img );
		}
		return makeResult('immune',false);
	}

	let isResist = false;
	// I can resist a specific effect type, like "eBurn"
	isResist = isResist || (target.isResist && target.isResist(effect.typeId));
	// I can resist an effect operation, like "shove"
	isResist = isResist || (target.isResist && target.isResist(effect.op));
	// I can resist changes to my stats, like 'stunned'
	isResist = isResist || (target.isResist && target.isResist(effect.stat));
	// I can resist a value that is being set, like "panicked"
	isResist = isResist || (effect.op=='set' && target.isResist && target.isResist(effect.value));
	effect.isResist = isResist;

	if( isResist && effect.duration===0 && Random.chance100(50) ) {
		tell(mSubject,target,' ',mVerb,'resist',' the effects of ',mObject,effect,'.');
		Anim.Upon(delayId,target,StickerList.showResistance.img);
		return makeResult('resist',false);
	}

	// Reduce duration of ongoing effects that you resist.
	if( isResist && effect.duration!==0 && effect.duration !== true ) {
		tell(mSubject,target,' ',mVerb,'seem',' partially affected by ',mObject,effect,'.');
		effect.resistDuration = true;
		effect.duration = effect.duration * 0.50;
		Anim.Upon(delayId,target,StickerList.showResistance.img);
	}

	let isVuln = false;
	isVuln = isVuln || (target.isVuln && target.isVuln(effect.typeId));
	isVuln = isVuln || (target.isVuln && target.isVuln(effect.op));
	isVuln = isVuln || (target.isVuln && target.isVuln(effect.stat));
	isVuln = isVuln || (effect.op=='set' && target.isVuln && target.isVuln(effect.value));
	effect.isVuln = isVuln;

	// Double the duration of ongoing effects that you are vulnerable to.
	if( isVuln && effect.duration!==0 && effect.duration !== true ) {
		tell(mSubject,target,' ',mVerb,'succumb',' to ',mObject,effect,'.');
		effect.vulnDuration = true;
		effect.duration = effect.duration * 2.0;
		Anim.Upon(delayId,target,StickerList.showVulnerability.img);
	}


	// Let any applicable perk transmogrify the effect any way it wants to.
	Perk.apply( 'damage', effect );
	Perk.apply( 'damageType', effect );
	Perk.apply( 'quick', effect );

	if( singular && (effect.singularOp == 'max' || effect.singularOp == 'sum') ) {
		//Some effects are "singular" meaning you can't have more than one of it upon you.
		result.singularOp = effect.singularOp;
		result.oldDuration = singular.duration;
		singular.inheritDuration(effect.duration,effect.singularOp)
		result.newDuration = singular.duration;
		result.effectResult = {
			status: 'singular'+effect.singularOp,
			success: true
		}
	}
	else
	if( target.isTileEntity && effect.onTargetPosition ) {
		// If the effect has chosen to do something special when targetting a position,
		// do that special thing. Otherwise the vast majority will 
		let temp = target.map.getTileEntity(target.x,target.y);
		console.assert( target.id = temp.id );
		result.effectResult = effect.onTargetPosition(target.map,target.x,target.y)
	}
	else {
		// Remember that by this point the effect has the target, source and item already inside it.
		result.effectResult = DeedManager.add(effect);
	}
	result.status  = result.effectResult.status || context;
	result.success = result.effectResult.success;

	// Float up an icon indicating what the effect was that just happened to the target.
	if( result.effectResult.success !== false && effect.icon !== false && effect.showOnset!==false ) {
		Anim.FloatUp(delayId,target,effect.icon || StickerList.eGeneric.img);
	}

	if( !effect.isSecondary && secondary.length && item && !item.dead ) {
		result.secondary = [];
		secondary.forEach( sec => {
			console.assert( sec.chance !== undefined );
			if( Random.chance100(sec.chance) ) {
				let eff = Object.assign( {}, sec.effect );
				eff.isSecondary = true;
				result.secondary.push( item.trigger( target, source, context, eff ) );
			}
		});
	}


	// Note that rechargeTime CAN NOT be in the effect, because we're only dealing with a
	// copy of the effect. There is no way for the change to rechargeTime to get back to the original effect instance.
	if( item && item.shotBy ) {
		let weapon = item.shotBy;
		if( weapon && weapon.rechargeTime !== undefined && !effect.chargeless) {
			weapon.rechargeLeft = weapon.rechargeTime;
		}
		item.shotBy = null;
	}

	if( item && item.rechargeTime !== undefined  && !effect.chargeless) {
		item.rechargeLeft = item.rechargeTime;
	}
	else
	if( source && source.rechargeTime !== undefined  && !effect.chargeless) {
		source.rechargeLeft = source.rechargeTime;
	}

	if( source && item && result.success && item.isWeapon && source.onAttack ) {
		result.onAttack = source.onAttack(target);
	}

	return result;
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
	if( content ) {
		tell(...content);
	}
}

let DeedOp = {
	COMMAND: 	'command',
	HEAL: 		'heal',
	DAMAGE: 	'damage',
	SHOVE: 		'shove',
	TELEPORT: 	'teleport',
	GATE:		'gate',
	STRIP: 		'strip',
	POSSESS: 	'possess',
	SUMMON: 	'summon',
	DRAIN: 		'drain',
	TAME: 		'tame',
	KILLLABEL: 	'killLabel',
	CUSTOM:		'custom'
}
ResistanceList.push(DeedOp);

let monsterTarget = function(effect) {
	return effect.target.isMonsterType;
}
let itemOrMonsterTarget = function(effect) {
	return effect.target.isItemType || effect.target.isMonsterType;
}
let resultDeniedDueToType = {
	status: 'deniedDueToType',
	success: false
}

Effect.OpAdd(DeedOp.COMMAND,function() {
	if( !monsterTarget(this) ) return resultDeniedDueToType;
	this.target.command = this.value;
	debugger;
	return {
		status: 'command',
		success: true
	};
});

Effect.OpAdd(DeedOp.HEAL,function() {
	if( !itemOrMonsterTarget(this) ) return resultDeniedDueToType;
	return this.target.takeHealing(this.source||this.item,this.value,this.healingType);
});

Effect.OpAdd(DeedOp.DAMAGE,function() {
	if( !itemOrMonsterTarget(this) ) return resultDeniedDueToType;
	let isOngoing = this.onsetDone && (this.duration === true || this.duration > 1);

	let result = this.target.takeDamage(
		this,
		isOngoing,
		isOngoing
	);
	this.onsetDone = true;

	if( this.isLeech && this.target.isMonsterType && result.success && result.amount > 0 ) {
		this.source.takeHealing(this.source,result.amount,this.healingType);
	}
	// NUANCE! An immunity could be acquired after the onset of the effect! That is
	// OK. The effect should continue to run its course in case the immunity
	// suddenly disappears again. Do NOT end the effect over this.
	return result;
});

Effect.OpAdd(DeedOp.SHOVE,function() {
	if( !itemOrMonsterTarget(this) ) return resultDeniedDueToType;
	return this.target.takeShove(this.source,this.item,this.value,this.pull?-1:1);
});

Effect.OpAdd(DeedOp.TELEPORT,function() {
	if( !itemOrMonsterTarget(this) ) return resultDeniedDueToType;
	console.assert(this.source);
	this.landing = this.landing || this.source.commandTarget2;
	return this.target.takeTeleport(this.landing);
});

Effect.OpAdd(DeedOp.GATE,function() {
	if( !monsterTarget(this) ) return resultDeniedDueToType;
	let oldPosition = {
		areaId: this.target.area.id,
		x: this.target.x,
		y: this.target.y
	};
	let result = this.target.takeGateEffect(this);
	if( this.item && this.item.effect && this.item.effect.twoWay ) {
		Object.assign( this.item.effect, oldPosition );
	}
	return result;
});

Effect.OpAdd(DeedOp.STRIP,function() {
	if( !itemOrMonsterTarget(this) ) return resultDeniedDueToType;
	return !!this.target.takeStripDeeds(this.stripFn);
});

Effect.OpAdd(DeedOp.POSSESS,function() {
	if( !this.target.isMonsterType ) return resultDeniedDueToType;
	if( this.source.isPossessing ) {
		return {
			status: 'possessionInProgress',
			success: true
		}
	}
	let result = this.target.takeBePossessed(this,true);
	if( result.success ) {
		this.onEnd = function() {
			this.target.takeBePossessed(this,false);
		}
	}
	result.endNow = !result.success;
	return result;
});

Effect.OpAdd(DeedOp.SUMMON,function() {
	if( this.target.isMap ) return resultDeniedDueToType;
	if( this.hasSummoned ) {
		if( this.summonedEntity && this.summonedEntity.isDead() ) {
			return {
				status: 'summoneeDead',
				success: false,
				endNow: true
			}
		}
		return {
			status: 'waitingForCompletion',
			success: true
		}
	}
	let target = this.target;
	let area = target.area;
	let typeFilter = this.value;
	let inject = {};
	if( this.isServant && this.source ) {
		inject.brainMaster = this.source;
		inject.brainPath = true;
		inject.team = this.source.team;
	}

	let type = MonsterTypeList[typeFilter];
	if( !type ) {
		debugger;
		return {
			status: 'noSuchMonster',
			typeFilter: typeFilter,
			success: false
		}
	}
	// NOTE: We always make the entity at the lower of its level or the depth you summoned it on.
	// The intent is to prevent super-over-powered killings
	let level = Math.min( type.level, area.depth );
	let entity = new Entity( level, type, inject, area.jobPicker );
	entity.requestGateTo(area,target.x,target.y);
	if( this.item ) {
		entity.deathPhrase = [mSubject,entity,' ',mVerb,'revert',' to ',mObject|mA,this.item,'.'];
	}
	this.summonedEntity = entity;
	if( this.item ) {
		this.item.giveTo(entity,entity.x,entity.y);
	}
	this.onEnd = () => {
		if( this.item ) {
			this.item.giveTo(entity.map,entity.x,entity.y);
		}
		Anim.FloatUp(entity.id,entity,StickerList.ePoof.img);
		entity.vanish = true;
	}
	this.hasSummoned = true;
	return {
		status: 'summon',
		success: true,
	}
});

Effect.OpAdd(DeedOp.DRAIN,function() {
	if( !itemOrMonsterTarget(this) ) return resultDeniedDueToType;
	let entity = this.target;
	let anyDrained = false;
	entity.inventory.forEach( item => {
		if( item.hasRecharge() && item.isRecharged() && !item.isSkill ) {
			item.resetRecharge() 
			anyDrained = true;
		}
	});
	if( anyDrained ) {
		Anim.FloatUp(this.target.id,this.target,this.icon || StickerList.eGeneric.img);
	}
	return {
		status: 'drain',
		success: true,
		anyDrained: anyDrained
	}
});

Effect.OpAdd(DeedOp.KILLLABEL,function() {
	if( !this.target.isMap ) return resultDeniedDueToType;
	let f = new Finder( this.target.itemList, this.source ).excludeMe().filter( item => item.label == this.value );
	let count = f.count;
	f.forEach( item => {
		Anim.FloatUp( item.id, item, StickerList.ePoof.img );
		item.destroy()
	});
	return {
		status: 'killedlabel',
		success: count > 0,
		count: count
	}
});

Effect.OpAdd(DeedOp.TAME,function() {
	if( !this.target.isMonsterType ) return resultDeniedDueToType;
	let source = this.source;
	if( source && source.isItemType ) {
		source = source.ownerOfRecord;
	}
	if( !source ) {
		return {
			status: 'nobodyToBeMyMaster',
			success: false
		}
	}
	this.target.setMaster(source);
	this.onEnd = deed => this.target.setMaster(null);
	return {
		status: 'tamed',
		success: true
	}
});

Effect.OpAdd(DeedOp.CUSTOM,function() {
	if( this.target.isMonster ) return resultDeniedDueToType;
	let result = this.customFn.call(this);
	return Object.assign({ status: 'custom' }, result);
});

return {
	Effect: Effect,
	Deed: Deed,
	DeedOp: DeedOp,
	DeedManager: DeedManager,
	effectApply: effectApply
}

});

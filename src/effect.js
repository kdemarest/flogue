Module.add( 'effect', ()=>{

function makeResult(status,success,inject) {
	let result = {
		status: status,
		success: success
	};
	Object.assign( result, inject );
	return result;
}

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

		// A lot of this is going to vanish the moment effects all have an owner. For example,
		// the depth, recharge time and so on will all go away, and all the prep of marking things
		// isHarm and such will vanish.

		if( effect.op == 'damage' || effect.op == 'possess' ) {
			effect.isHarm = true;
		}

		// Only write into the value if you must. Otherwise, let the world builder or
		// other systems (like 'brawn' in entity natural attacks) control.
		if( effect.value === undefined && (effect.op == 'damage' || effect.op == 'heal') ) {
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

	// REWORK THIS to accumulate positions in a big array. Then step through the array one by one
	// and propagate per the GDD.

	let effectShape = Perk.apply( 'effectShape', effect).effectShape || EffectShape.SINGLE;
	if( effectShape == EffectShape.SINGLE ) {
		let result = Effect.applyTo(effect,target,source,item,context);
		globalEffectDepth--;
		return result;
	}

	// REWORK: These should all be pre-constructed FUNCTIONS (stop using the shape cache) so that rays
	// can be blocked by a hit, and explosions from a center can be blocked etc)
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
				// For circles we 

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
		let mightMiss = !effect.isSecondary && source && source.isMonsterType && !isSelf;
		let sourceIsBlind = ()=>(source.senseBlind && !source.baseType.senseBlind);
		let targetIsInvisible = ()=>(target.invisible && !source.senseInvisible);
		let sourceCanNotPerceive = (why)=>!source.canPerceiveEntity(target,why)
		if( mightMiss && ( sourceIsBlind() || targetIsInvisible() || sourceCanNotPerceive() ) ) {
			let chanceToMiss = isRanged ? 75 : 50;
			if( isRanged && source.blindShot ) {
				chanceToMiss = 0;
			}
			if( !isRanged && source.blindFight ) {
				chanceToMiss = 0;
			}
			if( !(source.senseLiving && target.isLiving) && Random.chance100(chanceToMiss) ) {
				tell(mSubject,source,' ',mVerb,'attack',' ',mObject,target,' but in the wrong direction!');
				let resultName = 'notVisible';
				if( sourceIsBlind() ) {
					resultName += ' and sourceIsBlind';
				}
				if( targetIsInvisible() ) {
					resultName += ' and targetIsInvisible';
				}
				if( sourceCanNotPerceive() ) {
					result.why = {};
					sourceCanNotPerceive(result.why);
					resultName += ' and sourceCanNotPerceive';
				}
				return makeResult(resultName,false);
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
		singular.durationExtend(effect.duration,effect.singularOp)
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
	result.passesTime = (item && item.passesTime===false) || (effect.passesTime === false) ? false : true;
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

return {
	makeResult: makeResult,
	Effect: Effect,
	effectApply: effectApply
}

});

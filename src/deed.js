Module.add('deed',function() {

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

		console.assert( (Number.isFinite(this.duration) && this.duration >=0) || this.duration===true );
		if( this.duration > 0 ) {
			this._timeLeft = this.duration;
		}

		this.dead = false;
	}
	get timeLeft() {
		console.assert( !this.isEndless && !this.isInstant );
		console.assert( Number.isFinite(this._timeLeft) );
		return this._timeLeft;
	}
	get isEndless() {
		return this.duration === true;
	}
	setEndless() {
		return this.duration = true;
	}
	get isInstant() {
		return this.duration === 0;
	}

	get hasCalc() {
		return OpTypeHash[this.op].calcFn;
	}
	doCalc( target, stat, value ) {
		return OpTypeHash[this.op].calcFn.call( this, target, stat, value );
	}

	get hasAction() {
		return OpTypeHash[this.op].actionFn;
	}
	doAction() {
		let result = OpTypeHash[this.op].actionFn.call(this);
		console.assert( Object.isObject(result) );
		return result;
	}

	durationExtend(moreDuration,timeOp) {
		if( this.dead ) return;
		console.assert( !this.isInstant );
		if( moreDuration === true ) {
			this.duration = true;
			delete this._timeLeft;
		}
		console.assert( Number.isFinite(moreDuration) );
		this._timeLeft = timeOp==='sum' ? this._timeLeft+moreDuration : Math.max(this._timeLeft,moreDuration);
	}
	completed() {
		return ( !this.isEndless && this.timeLeft <= 0 );
	}
	expired() {
		if( this.dead ) return true;
		let done = ( !this.isEndless && this.timeLeft <= 0 );
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
		console.assert( !this.isInstant );
		if( !this.isEndless ) {
			console.assert( Number.isFinite(dt) );
			this._timeLeft -= dt;
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
	end(fn,goneList) {
		let count = 0;
		for( let deed of this.deedList ) {
			if( !deed.dead && fn(deed) ) {
				if( deed.end() ) {
					count++;
					if( goneList ) {
						goneList.push(deed);
					}
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

return {
	Deed: Deed,
	DeedManager: DeedManager
}

});


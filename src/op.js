Module.add( 'op', ()=>{

let OpTypeHash = Type.establish( 'OpType', {
	typeIdUnique:	true,
	onRegister: opType => {
		if( opType.actionFn ) {
			ResistanceList.push(opType.typeId);
		}
	}
});

let OpTypeRegister = (opTypeId,fn) => {
	Type.register( 'OpType', {
		[opTypeId]: {
			actionFn: fn
		}
	});
}

Type.register( 'OpType', {
	set: {
		calcFn: (target,stat,value) => {
			target[stat] = value;
		},
//		testFn: (target,stat,value) => {
//			return target[stat] == value;
//		}
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
});

//
// Op helper functions.
//
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

OpTypeRegister( 'command', function() {
	if( !monsterTarget(this) ) return resultDeniedDueToType;
	this.target.command = this.value;
	debugger;
	return {
		status: 'command',
		success: true
	};
});

OpTypeRegister( 'heal', function() {
	if( !itemOrMonsterTarget(this) ) return resultDeniedDueToType;
	return this.target.takeHealing(this.source||this.item,this.value,this.healingType);
});

OpTypeRegister( 'damage', function() {
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

OpTypeRegister( 'shove', function() {
	if( !itemOrMonsterTarget(this) ) return resultDeniedDueToType;
	return this.target.takeShove(this.source,this.item,this.value,this.pull?-1:1);
});

OpTypeRegister( 'teleport', function() {
	if( !itemOrMonsterTarget(this) ) return resultDeniedDueToType;
	console.assert(this.source);
	this.landing = this.landing || this.source.commandTarget2;
	return this.target.takeTeleport(this.landing);
});

OpTypeRegister( 'gate', function() {
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

OpTypeRegister( 'strip', function() {
	if( !itemOrMonsterTarget(this) ) return resultDeniedDueToType;
	return this.target.takeStripDeeds(this.stripFn);
});

function opPossess() {
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
}

OpTypeRegister( 'possess', opPossess );

OpTypeRegister( 'summon', function() {
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

OpTypeRegister( 'drain', function() {
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

OpTypeRegister( 'killLabel', function() {
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

OpTypeRegister( 'tame', function() {
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

OpTypeRegister( 'custom', function() {
	if( this.target.isMonster ) return resultDeniedDueToType;
	let result = this.customFn.call(this);
	return Object.assign({ status: 'custom' }, result);
});


return {
	OpTypeHash: OpTypeHash
}

});

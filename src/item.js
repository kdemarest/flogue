Module.add('item',function() {

/*
Items have these features:

autoEquip		- undef; Should this item be equipped the moment you pick it up?
isAutoFavorite	- undef; Should we make this a favorite in the spells favorites area?
existenceTime	- give to anything that should self-destroy after a short time. The var existenceLeft will be set to it, and count down.

Events:




*/


// ITEM
class Item {
	constructor(depth,itemType,presets,inject) {
		console.assert(depth>=0);
		console.assert(itemType);

		console.assert('creating item with img',itemType.img);

		if( !presets ) {
			// ERROR: you should do your own item picking, and provide presets!
			debugger;
		}
		// These do NOT merge down, either because the item needs to be authoritative about them,
		// or because future calculations will combine them.
		let ignoreFields = {
			level:1,
			rarity:1,
			name:1,
			block:1,
			xBlock:1,
			xArmor:1,
			xDamage:1,
			xDuration:1,
			fixins:1,
			type:1,
			typeId:1
		};

		let levelRaw = xCalc(this,presets,'level','+');
		let noLevelVariance = xCalc(this,presets,'noLevelVariance','+');
		let n = depth - levelRaw;
		let level = (noLevelVariance || (levelRaw >= depth)) ? levelRaw : levelRaw + (n-Math.floor(Math.sqrt(Math.randInt(0,(n+1)*(n+1)))));

		// Notice that the init overrides the typeId. This is to make sure that the inject doesn't do so with a dot 
		// phrase, like weapon.dagger (which it definitely might!)
		let hitsToKillItem = 4;
		let inits = {
			depth: depth,
			level: level,
			levelRaw: levelRaw,
			healthMax: Rules.monsterHealth(level,hitsToKillItem),
			typeId: itemType.typeId,
			id: Date.makeEntityId(itemType.typeId,depth),
			inVoid: true,
			owner: null,
			x:null,
			y:null
		};
		Object.assign( this, itemType, presets, inject||{}, inits );

		// order is VERY important here! Variety rules, then material, then quality. QMVI (here reversed because each over-writes the prior)
		Object.merge(this,this.variety,ignoreFields);
		if( this.variety && this.variety.name ) {
			this.name = this.variety.name;
		}

		Object.merge(this,this.material,ignoreFields);
		Object.merge(this,this.quality,ignoreFields);

		console.assert( (this.matter && Matter[this.matter]) || !this.isTreasure);
		if( this.matter ) {
			inits[String.getOf(this.matter)] = true;
		}

		this.health = this.healthMax;

		let adjust = function(cap,levelGoal,calc,mult=1) {
			function getPlus(value) {
				return Math.floor(value*mult)-Math.floor(valueRaw*mult);
			}
			let reps = 100;
			let valueRaw = calc(levelRaw);
			let value = valueRaw;
			let plus = 0;
			// To make sure we arrive at the exact same plus the exact same way every time
			let level = levelRaw;
			while( level < levelGoal && plus < cap && --reps ) {
				level++;
				value = calc(level);
				plus = getPlus(value);
				if( plus > cap ) {
					--level;
					value = calc(level);
					plus = getPlus(value);
					break;
				}
			}
			console.assert( reps > 0 );
			reps = 100;
			let decs = 0;
			while( level > levelRaw && --reps && getPlus(calc(level)) == getPlus(calc(level-1)) ) {
				--level;
				++decs;
				value = calc(level);
			}
			console.assert( getPlus(calc(level)) == plus );
			this.level = level;
			this.plus = plus;
			return value;
		}.bind(this);

//		if( this.isLauncher ) debugger;

		let picker = new Picker(this.depth);
		if( this.rechargeTime ) {
			this.rechargeTime 	= adjust( 10, level, level=>Rules.pickRechargeTime(level,this) );
		}
		if( this.isArmor ) {
			this.armor 			= adjust(  5, level, level=>Rules.pickArmorRating(level,this), Rules.armorVisualScale );
		}
		if( this.isShield ) {
			this.blocks 		= xCalc(this,this,'block','&');
			this.blockChance 	= adjust( 15, level, level=>Rules.pickBlockChance(level,this), Rules.blockVisualScale );
			this.armor 			= adjust(  5, level, level=>Rules.pickArmorRating(level,this), Rules.armorVisualScale );
		}
		if( this.isWeapon ) {
			this.damage 		= adjust(  5, level, level=>Rules.pickDamage(level,this.rechargeTime,this) );
		}
		if( this.isCoin ) {
			this.coinCount  	= Rules.pickCoinCount(depth);
		}

		if( this.effect && this.effect.isInert ) {
			delete this.effect;
		}
		if( this.effect ) {
			this.effect = new Effect( this.depth, this.effect, this, this.rechargeTime );
			if( this.effectDecorate ) {
				Object.assign( this.effect, this.effectDecorate );
			}

			// NUANCE: When you equip almost anything their effects happen to you immediately.
			// Most wearable items deal with this properly, but the Stuff effects sometimes
			// do not, so to be friendly we set duration here.
			if( this.slot && !this.isWeapon && this.effect.duration===undefined ) {
				this.effect.duration = true;
			}
			// Weapon secondary effect, and that of armor, happens in carefully managed circumstances.
			if( this.isWeapon || this.isArmor || this.isShield ) {
				if( this.chanceEffectFires === undefined ) {
					this.chanceEffectFires = this.isWeapon ? Rules.weaponChanceToFire(this.level) : Rules.ARMOR_EFFECT_CHANCE_TO_FIRE;
					if( this.triggerWhenDon() ) {
						this.chanceEffectFires = 100;
					}
				}
				
				if( Rules.WEAPON_EFFECT_OP_ALWAYS.includes(this.effect.op) ) {
					this.chanceEffectFires = 100;
					this.effect.value = Rules.weaponEffectDamage(this.level,this.effect.value);
					this.damage -= this.plus;
					this.effect.value += this.plus;
					console.assert( !isNaN(this.effect.value) );
				}
			}
			this.effect = EffectPermutationEngine.permute( depth, this.level, this, this.effect, this.permute );
		}

		if( this.hasInventory ) {
			this.inventory = [];
		}

		if( this.carrying ) {
			console.assert(this.hasInventory);
			Inventory.lootTo( this, this.carrying, this.level );
			this.inventory.forEach( item => {
				if( !item.isTreasure ) {
					debugger
				}
			});
		}

		console.assert( !this.isArmor || this.armor >= 0 );
		console.assert( !this.isShield || this.armor >= 0 );
		console.assert( !this.isWeapon || this.damage >= 0 );
		console.assert( !this.isCoin || this.coinCount >= 0 );

		if( this.x !== null || this.y !== null || this.owner !== null ) {
			debugger;
		}

		if( this.state ) {
			this.setState(this.state);
		}

		if( this.existenceTime ) {
			this.existenceLeft = this.existenceTime;
		}

		this.price = Rules.priceBase(this);

		// Always do this last so that as many member vars as possible will be available to the namePattern!
		//if( this.namePattern.indexOf('arrow') >=0 ) debugger;
		String.calcName(this);
		//console.log('p=',this.namePattern);
		//console.log('n=',this.name);

		if( this.variety && this.variety.isWing && !this.isWing ) {
			debugger;
		}

	}
	get area() {
		if( !this.owner ) debugger;
		return this.owner.area;			// works if owner is monster, map or item
	}
	get toTheme() {
		return this.toThemeId ? ThemeList[this.toThemeId] : undefined;
	}
	get toArea() {
		return this.toAreaId ? this.area.world.area(this.toAreaId) : undefined;
	}
	get toGate() {
		return this.toArea ? this.toArea.getGate(this.toGateId) : undefined;
	}
	get map() {
		return this.area.map;
	}
	get baseType() {
		return ItemTypeList[this.typeId];
	}
	get isUser() {
		return false;
	}
	spriteSetMember(member,value) {
		guiMessage( 'spriteSetMember', { entity: this, member: member, value: value } );
	}
	explain(buySell,observer) {
		let potencyList = ['feeble', 'frail', 'faint', 'tepid', 'mild', 'common', 'passable', 'sturdy', 'hardy', 'robust', 'vigorous', 'mighty', 'fierce', 'righteous', 'potent', 'glorious', 'epic', 'supernal', 'legendary', 'celestial'];

		function order(typeId) {
			return String.fromCharCode(64+ItemSortOrder.indexOf(typeId));
		}
		function icon(file) {
			return file ? '<img src="'+IMG_BASE+file+'">' : '';
		}
		function rechargeImg() {
			if( !item.rechargeTime ) return '';
			let pct = Math.floor( (1 - ( (item.rechargeLeft||0) / (item.rechargeTime||10) )) * 10 )*10;
			return '<img class="spellRecharge" src="'+IMG_BASE+StickerList['slice'+pct].img+'">';
		}
		function getBonus() {
			if( !item.effect || item.isSpell || item.isPotion || item.isGem ) {
				return '';
			}
			let chance = (item.chanceEffectFires||100) !== 100 ? (item.chanceEffectFires||100)+'%' : '';
			if( item.effect.op=='damage' ) {
				return String.combine(' ',chance,Math.floor(item.effect.value),item.effect.damageType);
			}
			return String.combine(' ',chance,item.effect.name);
		}
		function getQuick(perksApplied) {
			let q = item.getQuick();
			let effectRaw = item.isWeapon ? item.getEffectOnAttack() : (item.effect && item.effect.op=='damage' ? item.effect : null);
			if( effectRaw ) {
				let effect = Object.assign({},effectRaw,{source:observer,item:item});
				Perk.apply( 'quick', effect );
				if( effect.quick !== undefined ) {
					q = effect.quick;
				}
				perksApplied.push(...effect.perksApplied);
			}
			return q!=Quick.NORMAL ? QuickName[q] : '';
		}
		function getDamage(perksApplied) {
			let effectRaw = item.isWeapon ? item.getEffectOnAttack() : (item.effect && item.effect.op=='damage' ? item.effect : null);
			if( !effectRaw ) {
				return '';
			}
			let effect = Object.assign({},effectRaw,{source:observer,item:item});
			Perk.apply( 'damage', effect );
			perksApplied.push(...effect.perksApplied);
			return Math.max(1,Math.floor(effect.value)) + (effect.perksApplied.length ? '*' : '');
		}
		function getDamageType(perksApplied) {
			let effectRaw = item.isWeapon ? item.getEffectOnAttack() : (item.effect && item.effect.op=='damage' ? item.effect : null);
			if( !effectRaw ) {
				return '';
			}
			let effect = Object.assign({},effectRaw,{source:observer,item:item});
			Perk.apply( 'damageType', effect );
			perksApplied.push(...effect.perksApplied);
			return effect.damageType + (effect.perksApplied.length ? '*' : '');
		}
		function getArmor(perksApplied) {
			if( !item.isArmor && !item.isShield ) {
				return '';
			}
			let armorEffect = item.calcArmorEffect(DamageType.CUT,false);
			perksApplied.push(...armorEffect.perksApplied);
			return Math.floor(armorEffect.armor*Rules.armorVisualScale) + (armorEffect.perksApplied.length ? '*' : '');
		}

		let item = this;
		let owner = item.owner && item.owner.isMonsterType ? item.owner : {};
		let nameClean = item.name.replace(/\$/,'');
		let perksApplied = [];
		let exDamage = getDamage(perksApplied);
		let exDamageType = getDamageType(perksApplied);
		let exDescription2 = item.description || (item.effect?item.effect.description:'') || '';
		let exQuick = getQuick(perksApplied);
		let exArmor = getArmor(perksApplied);
		let exPerks = '';
		let perksDone = {};
		perksApplied.forEach( perk => {
			if( !perksDone[perk.name] ) {
				exPerks += '* '+perk.name+': '+perk.description+'<br>';
				perksDone[perk.name] = 1;
			}
		});
		if( perksApplied.length && item.isSword ) {
			//debugger;
		}
		let info ={
			item: 			item,
			typeId: 		item.typeId,
			level: 			item.level,
			potency: 		potencyList[Math.clamp(item.level,0,potencyList.length-1)],
			typeOrder: 		order(item.typeId),
			icon: 			icon(item.icon),
			description: 	((item.bunch||0)>1 ? item.bunch+'x ' : '')+String.capitalize(nameClean),
			description2: 	exDescription2,
			perks:			exPerks,
			bunch: 			((item.bunch||0)>1 ? item.bunch+'x ' : ''),
			name: 			String.capitalize(nameClean),
			damage: 		exDamage,
			damageType: 	exDamageType,
			quick: 			exQuick,
			reach: 			item.reach > 1 ? 'reach '+item.reach : '',
			sneak: 			(owner.sneakAttackMult||2)<=2 ? '' : 'Sneak x'+Math.floor(owner.sneakAttackMult),
			armor: 			exArmor,
			aoe: 			item && item.effect && item.effect.effectShape && item.effect.effectShape!==EffectShape.SINGLE ? item.effect.effectShape : '',
			bonus: 			getBonus(),
			condition:		Number.isFinite(item.durability) && item.durability < 50 && item.baseType.durability >= 50 ? '<span class="statAlert">&nbsp;frail&nbsp;</span>' : '',
			duration:		item.duration,
			effect: 		item.effect ? (item.effect.name || item.effect.typeId) : '',
			effectAbout:	item.effect && item.effect.about ? item.effect.about : '',
			permuteDesc: 	item.effect && item.effect.permuteDesc ? item.effect.permuteDesc : '',
			recharge: 		item.rechargeTime ? Math.floor(item.rechargeTime) : '',
			rechargeLeft: 	rechargeImg(),
			deathReturn:	(observer && observer.deathReturn && observer.deathReturn.altarId==item.id ? 'YOU RESPAWN HERE' : ''),
			price: 			Rules.priceWhen(buySell,item),
			priceWithCommas: Rules.priceWhen(buySell,item).toLocaleString(),
		};
		if( item.infoFn ) {
			item.infoFn(info);
		}
		return info;
	}

	isAt(x,y,area) {
		console.assert(area);
		return Distance.isAt(this.x,this.y,x,y) && this.area.id==area.id;
	}
	isAtTarget(target) {
		console.assert(target && target.area);
		return this.isAt(target.x,target.y,target.area);
	}
	triggerWhenDon() {
		return this.isSkill || this.triggerOnUse || (this.triggerOnUseIfHelp && this.effect && (this.effect.isHelp || this.effect.isPlayerOnly));
	}
	hasRecharge() {
		return !!this.rechargeTime;
	}
	isRecharged() {
		return this.rechargeTime === undefined || !this.rechargeLeft;
	}
	rechargePercent() {
		if( !this.hasRecharge() ) return 1;
		return 1 - (this.rechargeLeft||0)/this.rechargeTime;
	}
	resetRecharge() {
		if( this.rechargeTime ) {
			this.rechargeLeft = this.rechargeTime;
		}
	}
	recharge(rechargeRate=1,ignoreCriteria=false) {
		if( this.rechargeLeft > 0 ) {
			if( ignoreCriteria || !this.rechargeCriteria || this.rechargeCriteria.call(this) ) {
				this.rechargeLeft = Math.clamp(this.rechargeLeft-rechargeRate,0,this.rechargeTime);
			}
		}
	}
	isVariety(typeFilter) {
		let parts = typeFilter.split('.');
		console.assert( parts.length );
		if( parts.length == 1 ) {
			return parts[0] == this.typeId || (this.variety && parts[0] == this.variety.typeId);
		}
		return parts[0] == this.typeId && this.variety && parts[1] == this.variety.typeId;
	}
	isContainable() {
		return this.isTreasure && !this.light && !this.isContainer && !this.isDecor && this.mayWalk && !this.isHidden;
	}
	setState(newState) {
		this.state = newState;
		if( this.states ) {
			console.assert(this.states[newState]);
			Object.assign(this,this.states[newState]);
		}
		// Maybe the state is in the name?
		String.calcName(this);
		this.spriteDirty = true;
	}
	getDodge() {
		return this.dodge || Quick.CLUMSY;
	}
	getQuick() {
		return this.quick || Quick.NORMAL;
	}
	getEffectOnAttack() {
		if( this._effectOnAttack ) {
			return new Effect( this.level, this._effectOnAttack, this, this.rechargeTime );
		}
		let effect = Object.copySelected( {
			op: 'damage',
			isEffectOnAttack: true,
			icon: false,
		}, this, {
			op:1,
			isHarm:1,
			damageType:1,
			duration:1,
			xDuration:1,
			xDamage:1,
			quick:Quick.NORMAL,
			name:1
		});

		if( effect.op == 'damage' ) {
			effect.isHarm = true;
			effect.value = effect.value || this.damage;
		}
		// This is contrary to how the effect applier works, because weapons typically
		// want to do their damage and just be done.
		if( this.duration === undefined ) {
			effect.duration = 0;
		}
		return new Effect( this.level, effect, this, this.rechargeTime );
	}

	isImmune(damageType) {
		if( !this.matter ) {
			return true;
		}
		return Matter[this.matter].damage[damageType] === undefined;
	}

	isResist(damageType) {
		if( !this.matter ) {
			return false;
		}
		return Matter[this.matter].damage[damageType] < 1.0;
	}

	isVuln(damageType) {
		if( !this.matter ) {
			return false;
		}
		return Matter[this.matter].damage[damageType] >= 2;
	}

	takeDamage( source, item, amount, damageType, callback, noBacksies, isOngoing) {
		let result = {
			status: 'damageItem',
			success: false
		}
		if( damageType == DamageType.BURN ) {
			if( this.states.lit ) {
				this.setState('lit');
				result.success = true;
			}
		}
		if( damageType == DamageType.WATER || damageType == DamageType.FREEZE ) {
			if( this.states.unlit ) {
				this.setState('unlit');
				result.success = true;
			}
		}

		let adjustment = 1;
		if( this.matter ) {
			adjustment = Matter[this.matter].damage[damageType]  || 0;
		}
		result.adjustment = adjustment;

		amount *= adjustment;
		result.damageType = damageType;
		result.damage = amount;

		if( amount >= this.health ) {
			this.health -= amount;
			this.destroy('damage');
			result.destroyed = true;
			result.success = true;
		}
		return result;
	}
	calcBlockChance(blockType,isRanged,isBraced,braceBonus) {
		if( !isRanged ) {
			return 0;
		}
		if( blockType !== 'any' && !String.arIncludes(this.blocks,blockType) ) {
			return 0;
		}
		let blockChance = xCalc(this,this,'xBlock','*');
		if( isBraced ) {
			blockChance = blockChance + (1-blockChance)*(braceBonus||0.50);
		}
		return blockChance;
	}

	calcArmorEffect(damageType,isRanged) {
		let armorEffect = {
			item: this,
			damageType: damageType,
			isRanged: isRanged,
			armor: this.armor
		};
		if( !this.isArmor && !this.isShield ) {
			debugger;
			return armorEffect;
		}
		if( this.isArmor && !ArmorDefendsAgainst.includes(damageType) ) {
			return armorEffect;
		}
		if( this.isShield && !ShieldDefendsAgainst.includes(damageType) ) {
			return armorEffect;
		}
		console.assert( Number.isFinite(armorEffect.armor) );
		Perk.apply( 'armor', armorEffect);
		console.assert( Number.isFinite(armorEffect.armor) );
		return armorEffect;
	}
	bunchId() {
		if( (this.inSlot && !this.donBunches) || !this.isTreasure || this.noBunch || this.isFake || this.isSkill || this.inventory ) {
			return this.id;
		}
		let b = '';
		let fieldList = { name:1, namePattern:1, armor: 1, damage:1, damageType:1, blockChance:1, rechargeTime:1, rechargeLeft:1 };
		if( this.owner && this.owner.isMap ) {
			fieldList.x = 1;
			fieldList.y = 1;
		}
		for( let fieldId in fieldList ) {
			let value = this[fieldId];
			if( value !== undefined ) {
				b += '&'+value;
			}
		}
		if( this.effect ) {
			let fieldList = { name:1, namePattern:1, op: 1, stat: 1, value:1, duration:1, damageType:1, healingType:1, xDuration:1, xRecharge:1, xDamage:1, effectShape:1 };
			for( let fieldId in fieldList ) {
				let value = this.effect[fieldId];
				if( value !== undefined ) {
					b += '&'+value;
				}
			}
		}
		return b;
	}
	giveToSingly(entity,x,y) {
		let temp = this.noBunch;
		this.noBunch = true;
		let oldId = this.id;
		let result = this.giveTo(entity,x,y);
		console.assert( result.id == oldId && this.id == oldId );
		if( temp === undefined ) {
			delete this.noBunch;
		}
		else {
			this.noBunch = temp;
		}
		return result;
	}
	giveTo(entity,x,y) {
		let assureWalkableDrop = entity.isMap && this.isTreasure && !this.allowPlacementOnBlocking;

		if( assureWalkableDrop ) {
			console.assert(Number.isFinite(x) && Number.isFinite(y));
			let mayDrop = pWalk(entity,true);
			let spiralFind = entity.spiralFind;
			if( !spiralFind ) {
				debugger;
			}
			let checkMayDrop = (x,y,tile) => {
				return mayDrop(x,y) === Problem.NONE;
			}
			[x,y] = spiralFind.call(
				entity,
				x,
				y,
				checkMayDrop
			);
		}

		let hadNoOwner = !this.owner;
		if( !this.isUnbunching && !entity.inVoid && entity.isUser ) {
			//
			// Fly picked up item to the viewInfo side bar
			//
			let flightDistance;
			guiMessage( 'sceneFn', scene => flightDistance = scene.mapViewWidthInTiles/2.0);
			new Anim({
				at: 		entity,
				img: 		this.img || ImageRepo.getImg(this),
				delayId: 	entity.id,
				delayAdd: 	0.2,
				duration: 	0.6,
				onInit:			a => { a.create(1); },
				onSpriteMake: 	s => { s.sVelTo(flightDistance,0,0.6); },
				onSpriteTick: 	s => { s.sMoveRel(s.xVel,s.yVel).sScale(1+(s.elapsed/s.duration)); }
			});
		}
		this.rangeDuration = 0;
		if( this.owner && !this.owner.isMap && (x!=this.owner.x || y!=this.owner.y)  ) {
			let dx = x-this.owner.x;
			let dy = y-this.owner.y;
			let rangeDuration = Math.max(0.1,Math.sqrt(dx*dx+dy*dy) / (this.flyingSpeed || 10));
			if( this.flyingImg ) {
				//
				// Fly from my owner to the target, with rotation
				//
				console.logAnim('Fly rotate flyingImg to target');

				let deg = this.flyingRot ? deltaToDeg(dx,dy) : 0;
				new Anim({
					at: 		this.owner,
					img: 		this.flyingImg,
					delayId: 	this.id,
					duration: 	rangeDuration,
					onInit: 		a => { a.create(1); },
					onSpriteMake: 	s => { s.sVelTo(dx,dy,rangeDuration).sRotation(deg).sScale(this.flyingScale||1); },
					onSpriteTick: 	s => { s.sMoveRel(s.xVel,s.yVel); },
				});
			}
			else {
				//
				// Fly just my plain old image to the target
				//
				new Anim({
					at: 		this.owner,
					delayId: 	this.id,
					img:		this.img || ImageRepo.getImg(this),
					duration: 	rangeDuration,
					onInit: 		a => { a.create(1); },
					onSpriteMake: 	s => { s.sVelTo(dx,dy,rangeDuration); },
					onSpriteTick: 	s => { s.sMoveRel(s.xVel,s.yVel); },
				});
			}
		}
		if( this.owner ) {
			this.owner._itemRemove(this);
		}
		if( (x===undefined || y===undefined) && entity.isMap ) debugger;
		this.x = x;
		this.y = y;
		this.owner = entity;
		this.inVoid = false;
		delete this.isUnbunching;

		if( Gab && hadNoOwner ) {
			Gab.entityPostProcess(this);
		}

		let result = this.owner._itemTake(this,x,y);
		// WARNING! At this point the item could be destroyed.
		if( result && !result.dead && result.isContainer ) {
			let itemList = this.map.findItemAt(x,y).isContainable();
			itemList.forEach( item => item.giveTo(result,x,y) );
		}
		return result;
	}
	single() {
		if( !this.bunch || this.bunch <= 1 ) {
			return this;
		}
		let item = this._unbunch(1);
		return item;
	}
	_unbunch(amount=1) {
		console.assert( this.bunch !== undefined && amount < this.bunch );
		console.assert( this.owner );
		let list = this.owner.itemList || this.owner.inventory;
		let item = Object.assign( {}, this );
		Object.setPrototypeOf( item, Item.prototype );
		item.owner = null;
		item.bunch = amount;
		item.id = Date.makeEntityId(item.typeId,item.depth);
		item.isUnbunching = true;
		this.bunch = this.bunch - amount;
		item.giveToSingly(this.owner,this.x,this.y);
		return item;
	}
	_addToListAndBunch(list) {
		// list could be an inventory, or a map's itemList
		//if( this.typeId == 'ammo' ) debugger;
		let bunchId = this.bunchId();
		let f = new Finder(list).filter( item => item.bunchId() == bunchId );
		if( f.first ) {
			f.first.bunch = (f.first.bunch || 1) + (this.bunch || 1);
			this.destroy('duringAggregation');
			return f.first;
		}
		list.push(this);
		return this;
	}
	_itemRemove(item) {
		if( !this.inventory.includes(item) ) {
			debugger;
		}
		Array.filterInPlace(this.inventory, i => i.id!=item.id );
	}
	_itemTake(item,x,y) {
		if( this.inventory.includes(item) ) {
			debugger;
		}
		item = item._addToListAndBunch(this.inventory);
		item.x = this.x;
		item.y = this.y;
		if( x!==item.x || y!==item.y ) debugger;
		return item;
	}
	unhide() {
		Array.filterInPlace(this.map.itemListHidden, i => i.id!=this.id );
		let map = this.owner;
		console.assert( map.isMap );
		this.owner = null;
		delete this.isHidden;
		this.giveTo( map, this.x, this.y );
	}
	destroy(special) {
		if( this.dead ) {
			debugger;
			return false;
		}
		if( special !== 'duringAggregation' ) {
			this.owner._itemRemove(this);
		}
		// Now the item should be simply gone.
		this.dead = true;
		return true;
	}
	isEdibleBy(entity) {
		return this.isEdible && entity.eat &&  entity.eat.includes(this.matter);
	}
	tickRound(rechargeRate = 1) {
		let list = this.owner.itemList || this.owner.inventory;
		// WARNING! This assert is useful for making sure of inventory integrity, but VERY slow.
		//console.assert( list.find( i => i.id == this.id ) );
		console.watchItem( this, 'tickRound' );
		this.recharge(rechargeRate);
		if( this.onTickRound ) {
			this.onTickRound.call(this);
		}
		if( this.existenceLeft ) {
			let roundTime = 1.0;
			this.existenceLeft = Math.max(0, (this.existenceLeft||0) - roundTime);
			if( this.existenceLeft <= 0 ) {
				this.destroy();
			}
		}
	}

	// Charges decrement to zero and eliminate the effect from the item.
	checkCharges(result) {
		if( result.success && Number.isFinite(this.charges) ) {
			this.charges = Math.max(0,this.charges-1);
			if( this.charges <= 0 ) {
				tell(mSubject,this,' runs out of ',this.effect.name,'.');
				this.effect = false;
				result.itemUncharged = true;
			}
		}
	}

	// Durability decrements to zero and destroys the item.
	checkDurability(result) {
		if( !this.dead && Number.isFinite(this.durability) && this.durability > 0 ) {
			this.durability = Math.max(0,this.durability-1);
		}

		if( !this.dead && Number.isFinite(this.durability) && this.durability <= 0 ) {
			tell(mSubject,this,' breaks!');
			this.destroy();
			result.itemBroken = true;
		}
	}

	// breakChance has a uniform chance to break, unchanged by level
	checkBreakChance(result) {
		if( !this.dead && this.breakChance && Math.chance(this.breakChance) ) {
			tell(mSubject,this,' ',mVerb,this.breakVerb||'break','!');
			this.destroy();
			result.itemBroke = true;
		}
	}

	// It is kind of weird that you can send in an effect here, but items
	// are allowed to have lots of them. Its just that we are triggering
	// item.effect MOST of the time. In particular, ammo from bows does this...
	trigger(target,source,context,effect=this.effect) {
		if( effect===false || effect===undefined ) {
			return {
				status: 'triggerNothing',
				success: false
			}
		}

		// If we need recharging but are not yet ready
		if( !this.isRecharged() ) {
			return {
				status: 'triggerNotRecharged',
				success: false
			}
		}

		// Apply the effect passed in. Might not be the effect of the item.
		let result = effectApply( effect, target, source, this, context );
		this.checkCharges(result);
		this.checkDurability(result);
		this.checkBreakChance(result);
		return result;
	}
}

let getBlockNop = {};
Item.getBlockType = function(item,damageType) {
	item = item || getBlockNop;
	if( (item.reach||1)>1 ) return BlockType.REACH;
	if( item.mayThrow ) 	return BlockType.THROWN;
	if( item.mayShoot ) 	return BlockType.SHOT;
	if( item.isSpell && String.arIncludes(Damage.Elemental,damageType) ) return BlockType.ELEMENTAL;
	if( item.isSpell && String.arIncludes(Damage.Divine,damageType) ) 	return BlockType.DIVINE;
	if( item.isSpell ) 		return BlockType.NOBLOCK;
	return BlockType.PHYSICAL;
}

return {
	Item: Item
}

});
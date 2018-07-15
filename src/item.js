// ITEM
class Item {
	constructor(depth,itemType,presets,inject) {
		console.assert(depth>=0);
		console.assert(itemType);

		if( !presets ) {
			// ERROR: you should do your own item picking, and provide presets!
			debugger;
		}
		let ignoreFields = { level:1, rarity:1, name: 1, armorMultiplier:1, blockChance: 1, xDamage:1, ingredientId:1, type:1, typeId:1 };

		let levelRaw = ItemCalc(this,presets,'level','+');
		let noLevelVariance = ItemCalc(this,presets,'noLevelVariance','+');
		let level = (noLevelVariance || (levelRaw >= depth)) ? levelRaw : Math.randInt(levelRaw,depth+1);

		// Notice that the init overrides the typeId. This is to make sure that the inject doesn't do so with a dot 
		// phrase, like weapon.dagger (which it definitely might!)
		let inits = {
			depth: depth,
			level: level,
			levelRaw: levelRaw,
			typeId: itemType.typeId,
			id: GetUniqueEntityId(itemType.typeId,depth),
			inVoid: true,
			owner: null,
			x:null,
			y:null
		};
		Object.assign( this, itemType, presets, inject||{}, inits );

		// order is VERY important here! Variety rules, then material, then quality.
		Object.merge(this,this.quality,ignoreFields);
		Object.merge(this,this.material,ignoreFields);
		Object.merge(this,this.variety,ignoreFields);

		let adjust = function(cap,levelGoal,calc,mult=1) {
			let reps = 100;
			let valueRaw = calc(levelRaw);
			let value = valueRaw;
			let plus = 0;
			// To make sure we arrive at the exact same plus the exact same way every time
			let level = levelRaw;
			while( level <= levelGoal && plus < cap && --reps ) {
				value = calc(level);
				plus = Math.max(0,(value-valueRaw)*mult);
				level++;
			}
			console.assert( reps > 0 );
			this.plus = Math.round(plus);
			return value;
		}.bind(this);

//		if( this.isLauncher ) debugger;

		let picker = new Picker(this.depth);
		if( this.rechargeTime ) {
			this.rechargeTime 	= adjust( 10, level, level=>picker.pickRechargeTime(level,this) );
		}
		if( this.isArmor ) {
			this.armor 			= adjust(  5, level, level=>picker.pickArmorRating(level,this) );
		}
		if( this.isShield ) {
			this.armor 			= adjust(  5, level, level=>picker.pickArmorRating(level,this) );
		}
		if( this.isShield ) {
			this.blockChance 	= adjust( 15, level, level=>picker.pickBlockChance(level,this), 100 );
		}
		if( this.isWeapon ) {
			this.damage 		= adjust(  5, level, level=>Rules.pickDamage(level,this.rechargeTime,this) );
		}
		if( this.isCoin ) {
			this.coinCount  	= picker.pickCoinCount();
		}

		// REALLY in the long term all effects should be uniquely named according to their
		// time of use. For example:
		// effectOnAttack
		// effectOnShoot
		// effectOnThrow
		// effectOnCast
		// effectOnDon / Doff
		// effectOnGaze
		// effectOnEat
		// effectOnBlock
		// effectOnMove
		// effectOnTakeDamage
		// effectOn... whatever. possession, getting a pet... the list is endless.
		// We'll need a generic test that says
		// for( fieldId in entity.fields ) { if startsWith('effectOn'
		// and so on.


		if( this.effect && this.effect.isInert ) {
			delete this.effect;
		}
		if( this.effect ) {
			this.effect 		= new Effect( this.depth, this.effect, this, this.rechargeTime );
			if( this.takeOnDamageTypeOfEffect && this.effect.damageType ) {
				this.damageType = this.effect.damageType;
			}
			// NUANCE: When you equip almost everything their effects happen to you immediately.
			// Most wearable items deal with this properly, but the Stuff effects sometimes
			// do not, so to be friendly we set duration here.
			if( this.slot && !this.isWeapon ) {
				this.effect.duration = true;
			}
			// Weapon secondary effect, and that of armor, happens in carefully managed circumstances.
			if( this.isWeapon || this.isArmor || this.isShield ) {
				if( this.chanceOfEffect === undefined ) {
					this.chanceOfEffect = this.isWeapon ? WEAPON_EFFECT_CHANCE_TO_FIRE : ARMOR_EFFECT_CHANCE_TO_FIRE;
				}
				
				if( WEAPON_EFFECT_OP_ALWAYS.includes(this.effect.op) ) {
					this.chanceOfEffect = 100;
					this.effect.value = Math.max(1,Math.floor(this.effect.value*WEAPON_EFFECT_DAMAGE_PERCENT/100));
					console.assert( !isNaN(this.effect.value) );
				}
			}

		}

		if( this.isWeapon && !this.effectOnAttack ) {
			this.effectOnAttack = new Effect( this.depth, {
				op: 		'damage',
				isHarm: 	true,
				isInstant: 	true,
				value: 		this.damage,
				damageType: this.damageType || DamageType.CUT,
				quick: 		this.getQuick(),
				icon: 		false,
				name: 		this.name
			}, this, this.rechargeTime );
		}


		if( this.hasInventory ) {
			this.inventory = [];
		}

		if( this.inventoryLoot ) {
			console.assert(this.hasInventory);
			this.lootTake( this.inventoryLoot, this.level );
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

		// Always do this last so that as many member vars as possible will be available to the namePattern!
		//if( this.namePattern.indexOf('arrow') >=0 ) debugger;
		this.name = (this.name || String.tokenReplace(this.namePattern,this));
	}
	get area() {
		if( !this.owner ) debugger;
		return this.owner.area;
	}
	get map() {
		return this.area.map;
	}
	get baseType() {
		return ItemTypeList[this.typeId];
	}
	isAt(x,y,area) {
		console.assert(area);
		return this.x==x && this.y==y && this.area.id==area.id;
	}
	isAtTarget(target) {
		console.assert(target && target.area);
		return this.isAt(target.x,target.y,target.area);
	}

	hasRecharge() {
		return !!this.rechargeTime;
	}
	isRecharged() {
		return this.rechargeTime === undefined || !this.rechargeLeft;
	}
	resetRecharge() {
		if( this.rechargeTime ) {
			this.rechargeLeft = this.rechargeTime;
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
		return this.isTreasure && !this.isContainer && !this.isDecor && this.walkable && !this.isHidden;
	}
	setState(newState) {
		this.state = newState;
		if( this.states ) {
			console.assert(this.states[newState]);
			Object.assign(this,this.states[newState]);
		}
		// we can just assume that the sprites will need regenerating.
		spriteDeathCallback(this.spriteList);
	}
	getQuick() {
		if( this.effectOnAttack && this.effectOnAttack.quick !== undefined ) {
			return this.effectOnAttack.quick;
		}
		if( this.quick !== undefined ) {
			return this.quick;
		}
		return 1;
	}
	lootGenerate( lootSpec, level ) {
		let itemList = [];
		new Picker(level).pickLoot( lootSpec, item=>{
			itemList.push(item);
		});
		return itemList;
	}

	lootTake( lootSpec, level ) {
		let itemList = this.lootGenerate( lootSpec, level );
		itemList.forEach( item => item.giveTo(this,this.x,this.y) );
		return null;
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
		return result;
	}

	calcReduction(damageType) {
		if( !this.isArmor && !this.isShield ) {
			debugger;
			return 0;
		}
		if( this.isArmor && !ArmorDefendsAgainst.includes(damageType) ) {
			return 0;
		}
		if( this.isShield && !ShieldDefendsAgainst.includes(damageType) ) {
			return 0;
		}
		return this.armor;
	}
	bunchId() {
		if( (this.inSlot && !this.donBunches) || !this.isTreasure || this.noBunch || this.isFake || this.inventory ) {
			return this.id;
		}
		let b = '';
		let fieldList = { name:1, armor: 1, damage:1, damageType:1, blockChance:1, rechargeTime:1, rechargeLeft:1 };
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
			let fieldList = { name:1, op: 1, stat: 1, value:1, duration:1, damageType:1, healingType:1, xDuration:1, xRecharge:1, xDamage:1, effectShape:1, isInstant:1 };
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
	giveTo(entity,x,y,assureWalkableDrop) {

		if( assureWalkableDrop && entity.isMap ) {
			[x,y] = entity.spiralFind( x, y, (x,y,tile) => tile && tile.mayWalk && !tile.isProblem );
		}

		let hadNoOwner = !this.owner;
		if( this.owner && (this.owner.isMap || (this.owner.isItemType && this.owner.owner.isMap)) && entity.isUser && entity.isUser() ) {
			// Item flies to your gui sidebar...
			let where = this;
			if( where.x == undefined && this.owner.isItemType ) {
				where = this.owner;
			}
			animationTimer.giveDelay = (animationTimer.giveDelay||0);
			new Anim({},{
				at: 		where,
				img: 		this.imgGet ? this.imgGet(this) : this.img,
				delay: 		animationTimer.giveDelay,
				duration: 	0.6,
				onSpriteMake: 	s => { s.sVelTo(MaxVis,0,0.6); },
				onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel).sScaleSet(1+(s.elapsed/s.duration)); }
			});
			animationTimer.giveDelay += 0.3;
		}
		this.rangeDuration = 0;
		if( this.owner && !this.owner.isMap && (x!=this.owner.x || y!=this.owner.y)  ) {
			// Show item flying to the target location
			let dx = x-this.owner.x;
			let dy = y-this.owner.y;
			let rangeDuration = Math.max(0.1,Math.sqrt(dx*dx+dy*dy) / (this.flyingSpeed || 10));
			this.rangeDuration = rangeDuration;
			this.owner.rangeDuration = rangeDuration;
			if( this.effect ) {
				this.effect.rangeDuration = rangeDuration;
			}
			if( this.flyingImg ) {
				let deg = this.flyingRot ? deltaToDeg(dx,dy) : 0;
				new Anim({
					at: 		this.owner,
					img: 		this.flyingImg,
					duration: 	rangeDuration,
					onInit: 		a => { a.create(1); },
					onSpriteMake: 	s => { s.sVelTo(dx,dy,rangeDuration).sRotSet(deg).sScaleSet(this.flyingScale||1); },
					onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel); },
				});
			}
			else {
				spriteMakeInWorld(this,this.owner.x,this.owner.y);
				// Show the item flying to its new location
				new Anim({
					at: 		this.owner,
					duration: 	rangeDuration,
					onInit: 		a => { a.puppet(this.spriteList); },
					onSpriteMake: 	s => { s.sVelTo(dx,dy,rangeDuration); },
					onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel); },
					onSpriteDone: 	s => { if( !entity.isMap ) { spriteDeathCallback(this.spriteList); } }
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
		if( Gab && hadNoOwner ) {
			Gab.entityPostProcess(this);
		}
		if( this.gateDir !== undefined && !this.themeId ) {
			this.themeId = Plan.determineTheme(this.area.depth+this.gateDir,this.gateDir ? this.area.isCore : false);
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
		item.id = GetUniqueEntityId(item.typeId,item.depth);
		item.spriteList = [];
		this.bunch = this.bunch - amount;
		item.giveToSingly(this.owner,this.x,this.y);
		return item;
	}
	_addToList(list) {
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
		item = item._addToList(this.inventory);
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
		spriteDeathCallback(this.spriteList);
		this.dead = true;
		return true;
	}
	tick( dt, rechargeRate = 1) {
		let list = this.owner.itemList || this.owner.inventory;
		console.assert( list.find( i => i.id == this.id ) );
		if( this.rechargeLeft > 0 ) {
			this.rechargeLeft = Math.max(0,this.rechargeLeft-rechargeRate);
		}
		if( this.onTick ) {
			this.onTick.call(this,dt);
		}
		if( this.existenceLeft ) {
			this.existenceLeft -= 1;
			if( this.existenceLeft <= 0 ) {
				this.destroy();
			}
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
		if( !this.isRecharged() ) {
			return {
				status: 'triggerfNotRecharged',
				success: false
			}
		}
		if( context == Command.THROW && this.isPotion ) {
			effect.effectShape = EffectShape.SPLASH;
		}

		// Here is where we should figure out the area of effect and hit all as needed.
		let result = effectApply( effect, target, source, this, context );

		if( result.success && typeof this.charges =='number' ) {
			this.charges = Math.max(0,this.charges-1);
			if( this.charges <= 0 && this.destroyOnLastCharge ) {
				this.destroy();
				result.destroyedItemAfterUse = true;
			}
		}
		return result;
	}
}

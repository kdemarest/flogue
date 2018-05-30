// ITEM
class Item {
	constructor(level,itemType,presets,inject) {

		if( !presets ) {
			// ERROR: you should do your own item picking, and provide presets!
			debugger;
		}
		let ignore = { level:1, rarity:1, name:1, namePattern:1, ingredientId:1, type:1, typeId:1 };
		function merge(target,source) {
			if( !source ) { return; }
			for( let key in source ) {
				if( ignore[key] ) {
					continue;
				}
				target[key] = source[key];
			}
			return target;
		}

		let inits = { level: level, id: GetUniqueEntityId(itemType.typeId,level), owner: null, x:null, y:null };
		Object.assign( this, itemType, presets, inject||{}, inits );

		merge(this,this.quality);
		merge(this,this.material);
		merge(this,this.variety);

		// Important to check whether the gold comes from a preset. If so, it was randomly
		// generated and needs to be perturbed.
		if( presets && presets.goldCount && this.goldVariance ) {
			// Can't do this in the pick table! Has to be somewhere else.
			this.goldCount = Math.floor(this.goldCount+Math.rand(0,this.goldCount*this.goldVariance));
		}

		if( this.effect !== undefined ) {
			let effectChance = Math.clamp((this.effectChance||0) + (0.01*this.level),0.00,1.00);
			if( this.effect.isInert || (this.effectChance !== undefined && Math.chance((1-effectChance)*100) ) )  {
				delete this.effect;
			}
			else {
				this.effect = this.assignEffect(this.effect,new Picker(level),this.rechargeTime);
			}
		}

		if( this.x !== null || this.y !== null || this.owner !== null ) {
			debugger;
		}
		this.name = /*'L'+this.level+' '+*/(this.name || String.tokenReplace(this.namePattern,this));
	}
	get baseType() {
		return ItemTypeList[this.typeId];
	}

	assignEffect(effectType,picker,rechargeTime) {
		let effect = Object.assign({},effectType);
		if( effect.valueDamage ) {
			effect.value = Math.floor(picker.pickDamage(this.rechargeTime) * effect.valueDamage);
			if( (this.isWeapon || this.isArmor) && WEAPON_EFFECT_OP_ALWAYS.includes(effect.op) ) {
				effect.value = Math.max(1,Math.floor(effect.value*WEAPON_EFFECT_DAMAGE_PERCENT/100));
			}
		}
		if( effect.valuePick ) {
			effect.value = effect.valuePick(this,picker);
		}
		effect.name = effect.name || String.tokenReplace(effect.namePattern,effect);
		if( this.effectOverride ) {
			Object.assign( effect, this.effectOverride );
		}
		return effect;
	}
	isRecharged() {
		return this.rechargeTime === undefined || !this.rechargeLeft;
	}
	calcArmor(damageType) {
		if( !this.isArmor ) {
			debugger;
			return 0;
		}
		if( !ArmorDefendsAgainst.includes(damageType) ) {
			return 0;
		}
		return this.armor;
	}
	giveTo(entity,x,y) {
		if( this.owner && this.owner.isMap && entity.isUser() ) {
			new Anim({},{
				x: 			this.x,
				y: 			this.y,
				img: 		this.imgGet ? this.imgGet(this) : this.img,
				duration: 	0.8,
				onSpriteMake: 	s => { s.sVelTo(MaxSightDistance,0,0.8); },
				onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel); }
			});
		}
		if( this.owner ) {
			this.owner._itemRemove(this);
		}
		if( entity.isItemType && !entity.isPosition ) debugger;
		if( x===undefined || y===undefined ) debugger;
		this.x = x;
		this.y = y;
		this.owner = entity;
		this.owner._itemTake(this,x,y);
		if( entity.isMonsterType ) {
			// NOTICE! The ownerOfRecord is the last entity that operated or held the item. Never the map.
			// That means we can hold the ownerOfRecord "responsible" for thing the item does, whether it
			// was thrown, or left as a bomb, or whatever. That is, even if the MAP is the CURRENT owner.
			this.ownerOfRecord = entity;
		}
	}
	destroy() {
		this.owner._itemRemove(this);
		// Now the item should be simply gone.
		spriteDeathCallback(this.spriteList);
		this.dead = true;
	}

	trigger(command,originEntity,target) {
		if( this.effect===false || this.effect===undefined ) {
			return false;
		}
		if( !this.isRecharged() ) {
			return false;
		}
		this.originEntity = originEntity;

		// Here is where we should figure out the area of effect and hit all as needed.
		let result = effectApply(this,this.effect,target);
		if( !result ) {
			return false;
		}

		if( typeof this.charges =='number' ) {
			this.charges = Math.max(0,this.charges-1);
			if( this.charges <= 0 && this.destroyOnLastCharge ) {
				this.destroy();
			}
		}
		return true;
	}
}

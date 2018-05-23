// ITEM
class Item {
	constructor(owner,itemType,position,presets,inject) {
		let picker = new Picker(owner.level);
		if( !presets ) {
			let obj = picker.pick(picker.itemTable,itemType.typeId);
			presets = obj.presets;
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

		let inits = { level: owner.level, owner: owner, id: humanNameList.pop(), x:position.x, y:position.y };
		if( owner && owner.isMonsterType ) {
			inits.ownerOfRecord = owner;
		}
		Object.assign( this, itemType, presets, inject||{}, inits );

		merge(this,this.quality);
		merge(this,this.material);
		merge(this,this.variety);

		if( this.effect !== undefined ) {
			if( this.effectChance !== undefined && Math.rand(0,1)>=this.effectChance ) {
				delete this.effect;
			}
			else {
				this.effect = this.assignEffect(this.effect,picker,this.rechargeTime);
			}
		}

		if( this.x !== position.x || this.y !== position.y ) {
			debugger;
		}

		let self = this;
		this.name = 'L'+this.level+' '+(this.name || String.tokenReplace(this.namePattern,this));
	}
	assignEffect(effectType,picker,rechargeTime) {
		let effect = Object.assign({},effectType);
		if( effect.valueDamage ) {
			effect.value = Math.floor(picker.pickDamage(this.rechargeTime) * effect.valueDamage);
			if( WEAPON_EFFECT_OP_ALWAYS.includes(effect.op) ) {
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
	xGet() {
		return this.owner.isMap ? this.x : this.owner.x;
	}
	yGet() {
		return this.owner.isMap ? this.y : this.owner.y;
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

	moveTo(entity,x,y) {
		let ok = (!this.onPickup || this.onPickup(this,entity)!==false);
		if( !ok ) {
			return false;
		}
		this.owner._itemRemove(this);	

		this.x = x;
		this.y = y;
		this.owner = entity;
		this.owner._itemTake(this);
		if( entity.isMonsterType ) {
			// NOTICE! The ownerOfRecord is the last entity that operated or held the item. Never the map.
			// That means we can hold the ownerOfRecord "responsible" for thing the item does, whether it
			// was thrown, or left as a bomb, or whatever. That is, even if the MAP is the CURRENT owner.
			this.ownerOfRecord = entity;
		}
		return true;
	}
	destroy() {
		this.owner._itemRemove(this);
		// Now the item should be simpky gone.	
	}

	trigger(command,originEntity,target) {
		if( this.effect===false ) {
			return false;
		}
		if( !this.isRecharged ) {
			return false;
		}
		this.originEntity = originEntity;

		// Here is where we should figure out the area of effect and hit all as needed.
		let result = effectApply(this,this.effect,target);
		if( !result ) {
			return false;
		}
		if( this.effect && this.effect.rechargeTime !== undefined ) {
			this.effect.rechargeLeft = this.effect.rechargeTime;
		}

		if( typeof this.charges =='number' ) {
			this.charges = Math.max(0,this.charges-1);
			if( this.charges <= 0 && this.destroyOnLastCharge ) {
				this.destroy();
			}
		}
	}
}

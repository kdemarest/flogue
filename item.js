// ITEM
class Item {
	constructor(owner,itemType,position,inject,presets) {
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

		let inits = { owner: owner, id: humanNameList.pop(), x:position.x, y:position.y };
		if( owner && owner.isMonsterType ) {
			inits.ownerOfRecord = owner;
		}
		Object.assign( this, itemType, inject||{}, presets||{}, inits );
		if( this.qualities && !this.quality ) {
			this.quality = pick(this.qualities);
		}
		if( this.materials && !this.material ) {
			this.material = pick(this.materials);
		}
		if( this.varieties && !this.variety ) {
			this.variety = pick(this.varieties);
		}
		if( this.effectChoices ) {
			this.effect = this.generateEffect(this.effectType);
		}
		merge(this,this.quality);
		merge(this,this.material);
		merge(this,this.variety);
		this.armor = this.calcArmor();

		if( this.x !== position.x || this.y !== position.y ) {
			debugger;
		}

		let self = this;
		this.name = this.name || this.namePattern.replace(/{(\w+)}/g,function(whole,key) {
			if( typeof self[key] == 'string' || typeof self[key] == 'number' ) {
				return self[key];
			}
			if( Array.isArray(self[key]) ) {
				return self[key].join(',');
			}
			if( typeof self[key] == 'object' ) {
				if( self[key] ) return self[key].name || 'NONAME';
			}
			return 'UNKNOWN '+key;
		});
	}
	generateEffect(effectType) {
		effectType = effectType || pick(this.effectChoices);
		let effect = Object.assign({},effectType);
		if( effect.valuePick ) {
			effect.value = effect.valuePick();
		}
		effect.name = effect.name || effect.namePattern.replace(/{(\w+)}/g,function(whole,key) {
			return effect[key] || 'UNKNOWN '+key;
		});
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
	calcArmor(damageType=DamageType.CUT) {
		if( !ArmorDefendsAgainst.includes(damageType) ) {
			return 0;
		}

		let armorBase = (this.material?this.material.armor||0:0)+(this.variety?this.variety.armor||0:0)+(this.armor||0);
		let armorMultiplier = (this.material?this.material.armorMultiplier||1:1)*(this.variety?this.variety.armorMultiplier||1:1)*(this.armorMultiplier||1);
		return Math.floor(armorBase * armorMultiplier);
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
		this.origin = origin;

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
	}
}

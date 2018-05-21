// ITEM
class Item {
	constructor(owner,itemType,position,inject) {
		let inits = { owner: owner, id: humanNameList.pop(), x:position.x, y:position.y };
		Object.assign( this, itemType, inject, inits );
		if( this.qualities ) {
			this.quality = pick(this.qualities);
		}
		if( this.varieties ) {
			this.variety = pick(this.varieties);
		}
		if( this.materials ) {
			this.material = pick(this.materials);
		}
		if( this.effectChoices ) {
			this.effect = this.generateEffect();
		}
		let self = this;
		this.name = this.name || this.namePattern.replace(/{(\w+)}/g,function(whole,key) {
			if( !self[key].name ) { debugger; }
			if( self[key] ) return self[key].name || 'NONAME';
			return 'UNKNOWN '+key;
		});
	}
	generateEffect() {
		let effectType = pick(this.effectChoices);
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
		let ok = (!this.type.onPickup || this.type.onPickup(this,owner,entity)!==false);
		if( !ok ) {
			return false;
		}
		this.owner._itemRemove(this);	

		this.x = x;
		this.y = y;
		this.owner = entity;
		this.owner._itemTake(this);
		return true;
	}
	destroy() {
		this.owner._itemRemove(this);
		// Now the item should be simpky gone.	
	}

	trigger(command,cause,target) {
		if( this.effect===false ) {
			return false;
		}
		this.cause = cause;

		// Here is where we should figure out the area of effect and hit all as needed.
		let result = effectApply(cause,this.effect,target);
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

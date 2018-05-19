// ITEM
class Item {
	constructor(owner,itemType,position,inject) {
		let inits = { owner: owner, id: humanNameList.pop(), x:position.x, y:position.y };
		Object.assign( this, itemType, inject, inits );
		if( this.effectChoices ) {
			this.effect = this.generateEffect();
		}
		this.name = this.name || this.namePattern.replace('*',this.effect.name);
	}
	generateEffect() {
		let effectTypeId = pick(this.effectChoices);
		let effectType = EffectTypeList[effectTypeId];
		let effect = Object.assign({},effectType);
		if( effect.valuePick ) {
			effect.value = effect.valuePick();
		}
		effect.name = effect.name.replace('*',this.value);
		return effect;
	}
	xGet() {
		return this.owner.isMap ? this.x : this.owner.x;
	}
	yGet() {
		return this.owner.isMap ? this.y : this.owner.y;
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
		// Here is where we should figure out the area of effect and hit all as needed.
		let effect = this.effect;
		//Some effects will NOT start unless their requirements are met. EG, no invis if you're already invis.
		if( effect.requires && !effect.requires(target) ) {
			tell(mSubject,this,' has no effect on ',mObject,target);
		}
		this.cause = cause;
		if( target.isPosition ) {
			let map = this.owner.isMap ? this.owner : this.owner.map;
			effect.onTargetPosition(map,target.x,target.y)
		}
		else {
			deedAdd(this,target,rollDice(effect.duration),effect.stat,effect.op,rollDice(effect.value),effect.onTick,effect.onEnd);
		}
		if( this.charges !== true ) {	// true means it has infinite charges.
			this.charges = Math.max(0,this.charges-1);
			if( this.charges <= 0 && this.destroyOnLastCharge ) {
				this.destroy();
			}
		}
	}
}

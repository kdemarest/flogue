// ITEM
class Item {
	constructor(level,itemType,presets,inject) {
		console.assert(level>=0);
		console.assert(itemType);

		if( !presets ) {
			// ERROR: you should do your own item picking, and provide presets!
			debugger;
		}
		let ignore = { level:1, rarity:1, armorMultiplier:1, damageMultiplier:1, name:1, namePattern:1, ingredientId:1, type:1, typeId:1 };
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

		// order is VERY important here! Variety rules, then material, then quality.
		merge(this,this.quality);
		merge(this,this.material);
		merge(this,this.variety);

		let picker = new Picker(this.level);
		if( this.rechargeTime ) this.rechargeTime 	= picker.pickRechargeTime(this);
		if( this.isArmor )		this.armor 			= picker.pickArmorRating(this.level,this,this.material,this.variety,this.quality,this.effect);
		if( this.isWeapon )		this.damage 		= picker.pickDamage(this.rechargeTime,this,this.material,this.variety,this.quality,this.effect);
		if( this.isGold )		this.goldCount  	= picker.pickGoldCount();
		if( this.effect ) 		this.effect 		= picker.assignEffect(this.effect,this,this.rechargeTime);

		console.assert( !this.isArmor || this.armor >= 0 );
		console.assert( !this.isWeapon || this.damage >= 0 );
		console.assert( !this.isGold || this.goldCount >= 0 );

		if( this.x !== null || this.y !== null || this.owner !== null ) {
			debugger;
		}
		// Always do this last so that as many member vars as possible will be available to the namePattern!
		this.name = (this.name || String.tokenReplace(this.namePattern,this));
	}
	get area() {
		if( !owner ) debugger;
		return owner.area;
	}
	get baseType() {
		return ItemTypeList[this.typeId];
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
			// Item flies to your gui sidebar...
			new Anim({},{
				x: 			this.x,
				y: 			this.y,
				img: 		this.imgGet ? this.imgGet(this) : this.img,
				duration: 	0.3,
				onSpriteMake: 	s => { s.sVelTo(MaxSightDistance,0,0.3); },
				onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel).sScaleSet(1+(s.elapsed/s.duration)); }
			});
		}
		if( this.owner && !this.owner.isMap && (x!=this.owner.x || y!=this.owner.y)  ) {
			// Show item flying to the target location
			let dx = x-this.owner.x;
			let dy = y-this.owner.y;
			let throwDuration = Math.max(0.1,Math.sqrt(dx*dx+dy*dy) / 10);
			this.throwDuration = throwDuration;
			this.owner.throwDuration = throwDuration;
			if( this.effect ) {
				this.effect.throwDuration = throwDuration;
			}
			spriteMakeInWorld(this,this.owner.x,this.owner.y);
			new Anim({
				x: 			this.owner.x,
				y: 			this.owner.y,
				duration: 	throwDuration,
				onInit: 		a => { a.puppet(this.spriteList); },
				onSpriteMake: 	s => { s.sVelTo(dx,dy,throwDuration); },
				onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel); }
			});

		}
		if( this.owner ) {
			this.owner._itemRemove(this);
		}
		if( entity.isItemType && !entity.isPosition ) debugger;
		if( (x===undefined || y===undefined) && entity.isMap ) debugger;
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

	trigger(target,source,command) {
		if( this.effect===false || this.effect===undefined ) {
			return false;
		}
		if( !this.isRecharged() ) {
			return false;
		}
		if( source.command == Command.THROW && this.isPotion ) {
			this.effect.effectShape = EffectShape.SPLASH;
		}

		// Here is where we should figure out the area of effect and hit all as needed.
		let result = effectApply( this.effect, target, this.owner.isMonsterType ? this.owner : null, this );
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

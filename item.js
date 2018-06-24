function ItemCalc(item,presets,field,op) {
	function calc(piece) {
		let a = piece ? (piece[field] || def) : def;
		if( isNaN(a) ) debugger;
		n = (op=='*' ? n*a : n+a);
		if( isNaN(n) ) debugger;
	}

	let def = op=='*' ? 1 : 0;
	let n = def;
	calc(item);
	if( presets ) {
		calc(presets.quality);
		calc(presets.material);
		calc(presets.variety);
		calc(presets.effect);
	}
	return n;
}

// ITEM
class Item {
	constructor(depth,itemType,presets,inject) {
		console.assert(depth>=0);
		console.assert(itemType);

		if( !presets ) {
			// ERROR: you should do your own item picking, and provide presets!
			debugger;
		}
		let ignoreFields = { level:1, rarity:1, armorMultiplier:1, blockChance: 1, xDamage:1, name:1, namePattern:1, ingredientId:1, type:1, typeId:1 };

		let levelRaw = ItemCalc(this,presets,'level','+');
		let level = levelRaw >= depth ? levelRaw : Math.randInt(levelRaw,depth+1);

		// Notice that the init overrides the typeId. This is to make sure that the inject doesn't do so with a dot 
		// phrase, like weapon.dagger (which it definitely might!)
		let inits = {
			depth: depth,
			level: level,
			levelRaw: levelRaw,
			typeId: itemType.typeId,
			id: GetUniqueEntityId(itemType.typeId,depth),
			owner: null,
			x:null,
			y:null
		};
		Object.assign( this, itemType, presets, inject||{}, inits );

		// order is VERY important here! Variety rules, then material, then quality.
		Object.merge(this,this.quality,ignoreFields);
		Object.merge(this,this.material,ignoreFields);
		Object.merge(this,this.variety,ignoreFields);

		let adjust = function(cap,level,calc,mult=1) {
			let reps = 100;
			let done = false;
			let valueRaw = calc(levelRaw);
			let plus, value;
			while( !done && --reps) {
				value = calc(level);
				plus = Math.max(0,(value-valueRaw)*mult);
				done = plus <= cap;
				if( !done ) --level;
			}
			console.assert( done );
			this.plus = Math.round(plus);
			return value;
		}.bind(this);


		let picker = new Picker(this.depth);
		if( this.rechargeTime ) {
			this.rechargeTime 	= adjust( 10, level, L=>picker.pickRechargeTime(L,this) );
		}
		if( this.isArmor ) {
			this.armor 			= adjust( 5, level, L=>picker.pickArmorRating(L,this) );
		}
		if( this.isShield ) {
			this.armor 			= adjust( 5, level, L=>picker.pickArmorRating(L,this) );
		}
		if( this.isShield ) {
			this.blockChance 	= adjust( 15, level, L=>picker.pickBlockChance(L,this), 100 );
		}
		if( this.isWeapon ) {
			this.damage 		= adjust( 5, level, L=>picker.pickDamage(L,this.rechargeTime,this) );
		}

		if( this.isCoin )		this.coinCount  	= picker.pickCoinCount();
		if( this.effect ) 		this.effect 		= picker.assignEffect(this.effect,this,this.rechargeTime);

		console.assert( !this.isArmor || this.armor >= 0 );
		console.assert( !this.isShield || this.armor >= 0 );
		console.assert( !this.isWeapon || this.damage >= 0 );
		console.assert( !this.isCoin || this.coinCount >= 0 );

		if( this.x !== null || this.y !== null || this.owner !== null ) {
			debugger;
		}
		// Always do this last so that as many member vars as possible will be available to the namePattern!
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

	isRecharged() {
		return this.rechargeTime === undefined || !this.rechargeLeft;
	}
	resetRecharge() {
		if( this.rechargeTime ) {
			this.rechargeLeft = this.rechargeTime;
		}
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
	giveTo(entity,x,y) {
		let hadNoOwner = !this.owner;
		if( this.owner && this.owner.isMap && entity.isUser() ) {
			// Item flies to your gui sidebar...
			new Anim({},{
				x: 			this.x,
				y: 			this.y,
				img: 		this.imgGet ? this.imgGet(this) : this.img,
				duration: 	0.3,
				onSpriteMake: 	s => { s.sVelTo(MaxVis,0,0.3); },
				onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel).sScaleSet(1+(s.elapsed/s.duration)); }
			});
		}
		this.rangeDuration = 0;
		if( this.owner && !this.owner.isMap && (x!=this.owner.x || y!=this.owner.y)  ) {
			// Show item flying to the target location
			let dx = x-this.owner.x;
			let dy = y-this.owner.y;
			let rangeDuration = Math.max(0.1,Math.sqrt(dx*dx+dy*dy) / 10);
			this.rangeDuration = rangeDuration;
			this.owner.rangeDuration = rangeDuration;
			if( this.effect ) {
				this.effect.rangeDuration = rangeDuration;
			}
			spriteMakeInWorld(this,this.owner.x,this.owner.y);
			new Anim({
				x: 			this.owner.x,
				y: 			this.owner.y,
				duration: 	rangeDuration,
				onInit: 		a => { a.puppet(this.spriteList); },
				onSpriteMake: 	s => { s.sVelTo(dx,dy,rangeDuration); },
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
		if( Gab && hadNoOwner ) {
			Gab.entityPostProcess(this);
		}
		if( this.gateDir !== undefined && !this.themeId ) {
			this.themeId = Plan.determineTheme(this.area.depth+this.gateDir,this.gateDir ? this.area.isCore : false);
		}
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
		let result = effectApply( this.effect, target, this.ownerOfRecord, this );
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

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
		return itemList;
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
		if( this.owner && this.owner.isMap && entity.isUser && entity.isUser() ) {
			// Item flies to your gui sidebar...
			new Anim({},{
				at: 		this,
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
		this.owner._itemTake(this,x,y);
		if( entity.isMonsterType ) {
			// NOTICE! The ownerOfRecord is the last entity that operated or held the item. Never the map.
			// That means we can hold the ownerOfRecord "responsible" for thing the item does, whether it
			// was thrown, or left as a bomb, or whatever. That is, even if the MAP is the CURRENT owner.
			this.ownerOfRecord = entity;
		}
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
		this.inventory.push(item);
		item.x = this.x;
		item.y = this.y;
		if( x!==item.x || y!==item.y ) debugger;
	}

	destroy() {
		if( this.dead ) {
			debugger;
			return false;
		}
		this.owner._itemRemove(this);
		// Now the item should be simply gone.
		spriteDeathCallback(this.spriteList);
		this.dead = true;
		return true;
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

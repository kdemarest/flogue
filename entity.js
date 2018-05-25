//
// ENTITY (monsters, players etc)
//
class Entity {
	constructor(map,entityList,monsterType,position,inject,levelOverride) {
		let inits =    { inventory: [], actionCount: 0, command: Command.NONE, commandLast: Command.NONE, history: [], historyPending: [], tileTypeLast: TileTypeList.floor };
		let values =   { id: humanNameList.pop(), x:position.x, y:position.y, map: map, entityList:entityList };

		// BALANCE: Notice that monsters are created at LEAST at their native level, and if appearing on
		// a deeper map level then they average their native level and the map's level.
		let level = Math.max(1,Math.floor(levelOverride || Math.max(monsterType.level,monsterType.level+map.level/2)));
		let isPlayer = monsterType.brain==Brain.USER;
		if( isPlayer ) {
			level = map.level;
			values.healthMax = Rules.playerHealth(level);
			values.armor     = 0; //Rules.playerArmor(level);
			let damageWhenJustStartingOut = 0.75;	// I found that 50% was getting me killed by single goblins. Not OK.
			values.damage    = Math.max(1,Math.floor(Rules.playerDamage(level)*damageWhenJustStartingOut));
		}
		else {
			let hits = monsterType.power.split(':');
			let hitsToKillMonster = parseInt(hits[0]);
			let hitsToKillPlayer = parseInt(hits[1]);
			values.healthMax = Rules.monsterHealth(level,hitsToKillMonster);
			values.armor     = (monsterType.armor || 0);
			values.damage    = Rules.monsterDamage(level,hitsToKillPlayer);
		}
		values.level = level;
		values.health = values.healthMax;
		if( monsterType.pronoun == '*' ) {
			values.pronoun = Math.chance(70) ? 'he' : 'she';
		}
		Object.assign( this, monsterType, inits, inject || {}, values );

		if( this.name && this.name.indexOf('/')>0 ) {
			this.name = this.name.split('/')[values.pronoun=='she' ? 1 : 0];
		}
		this.name = 'L'+this.level+' '+(this.name || String.tokenReplace(this.namePattern,this));
	}

	record(s,pending) {
		if( pending ) {
			this.historyPending.push(s);
			return;
		}
		this.history.unshift( this.name+' '+s+' '+this.historyPending.join(', ') );
		this.historyPending.length = 0;
		if( this.watch ) {
			console.log(this.history[0]);
		}
	}
	get baseType() {
		return MonsterTypeList[this.typeId];
	}

	findAliveOthers(entityList = this.entityList) {
		return new EntityFinder(this,entityList).excludeMe().isAlive();
	}
	isUser() {
		return this.brain == Brain.USER;
	}
	gateTo(area,x,y) {

		// DANGER! Doing this while within a loop across the entityList will result in pain!
		Array.filterInPlace( this.entityList, entity => entity.id!=this.id );
		this.x = x;
		this.y = y;
		this.map = area.map;
		this.entityList = area.entityList;
		let fnName = this.isUser() ? 'unshift' : 'push';
		area.entityList[fnName](this);
	}
	die() {
		if( this.removed && this.isUser() ) {
			return;
		}
		if( this.removed ) {
			debugger;
		}
		if( this.corpse ) {
			let mannerOfDeath = Say.damagePast[this.takenDamageType||DamageType.BITE];
			if( !mannerOfDeath ) {
				debugger;
			}
			this.map.itemCreateByTypeId(this.x,this.y,this.corpse,{},{ usedToBe: this, mannerOfDeath: mannerOfDeath, isCorpse: true } );
		}
		tell(mSubject,this,' ',mVerb,'die','!');
		this.removed = true;
	}

	isDead() {
		return this.removed || this.health <= 0;
	}
	isAlive() {
		return !this.isDead();
	}

	dirToEntityPredictable(entity) {
		let dx = entity.x - this.x;
		let dy = entity.y - this.y;
		return deltasToDirPredictable(dx,dy);
	}
	dirToEntityNatural(entity) {
		let dx = entity.x - this.x;
		let dy = entity.y - this.y;
		return deltasToDirNatural(dx,dy);
	}

	isMyEnemy(entity) {
		if( this.attitude == Attitude.ENRAGED ) {
			return true;
		}
		if( entity.id == this.personalEnemy ) {
			return true;
		}
		return entity.team != this.team && entity.team != Team.NEUTRAL;
	}
	isMyFriend(entity) {
		if( this.attitude == Attitude.ENRAGED ) {
			return false;
		}
		if( entity.id == this.personalEnemy ) {
			return false;
		}
		return entity.team == this.team && entity.team != Team.NEUTRAL;
	}
	isMyNeutral(entity) {
		if( this.attitude == Attitude.ENRAGED ) {
			return false;
		}
		if( entity.id == this.personalEnemy ) {
			return false;
		}
		return this.team == Team.NEUTRAL || entity.team == Team.NEUTRAL;
	}
	healthPercent() {
		return Math.floor((this.health/this.healthMax)*100);
	}

	calcVis() {
		let doVis = false;
		if( this.brain == Brain.USER ) {
			doVis = true;
			this.mapMemory = world.area.mapMemory;
		}
		else {
			let user = this.findAliveOthers().filter( e => e.isUser() ).nearMe(9);
			doVis = !!user.first;
		}

		if( doVis ) {
			this.vis = calcVis(this.map,this.x,this.y,this.sightDistance,this.senseBlind,this.senseXray,this.vis,this.mapMemory);
		}
		else {
			this.vis = null;
		}

		return this.vis;
	}

	canPerceiveEntity(entity) {
		if( !this.vis || (entity.isMonsterType && this.senseLife) || (entity.isItemType && this.senseItems) ) {
			return true;
		}
		// This gets us up to whoever actually owns this item. But on the map, you just use the item.
		// This means that items can NOT be invisible independent of their owners.
		if( entity.ownerOfRecord ) {
			entity = entity.ownerOfRecord;
		}
		if( (this.senseBlind || (entity.invisible && !this.seeInvisible)) && entity.id!==this.id ) { // you can always perceive yourself
			return false;
		}
		return this.canPerceivePosition(entity.x,entity.y);
	}

	canPerceivePosition(x,y) {
		if( x===undefined || y===undefined ) {
			debugger;
		}
		if( typeof this.vis[y]==='undefined' || typeof this.vis[y][x]==='undefined' ) {
			return false;
		}
		return this.vis[y][x];
	}
	doff(item) {
		if( !item.inSlot || !item.slot ) {
			debugger;
			return;
		}
		tell(mSubject,this,' ',mVerb,'remove',' ',mObject,item);
		DeedManager.end( deed => deed.origin.id==item.id );
		item.inSlot = false;
	}
	don(item,slot) {
		if( item.inSlot || !item.slot ) {
			debugger;
			return;
		}
		tell(mSubject,this,' ',mVerb,item.useVerb,' ',mObject,item);
		item.inSlot = slot;
		if( item.triggerOnUse || (item.triggerOnUseIfHelp && item.effect && item.effect.isHelp) ) {
			item.trigger(Command.USE,this,this);
		}
	}

	_itemRemove(item) {
		if( !this.inventory.includes(item) ) {
			debugger;
		}
		if( item.inSlot ) {
			this.doff(item);
		}
		Array.filterInPlace(this.inventory, i => i.id!=item.id );
	}
	_itemTake(item) {
		if( this.inventory.includes(item) ) {
			debugger;
		}
		this.inventory.push(item);
		if( item.isGold ) {
			this.goldCount = (this.goldCount||0) + item.goldCount;
			item.destroy();
			return;
		}
	}

	enemyAtPos(x,y) {
		return this.findAliveOthers().at(x,y).isMyEnemy();
	}

	getDistance(x,y) {
		return Math.max(Math.abs(x-this.x),Math.abs(y-this.y));
	}

	at(x,y) {
		let f = this.findAliveOthers().at(x,y);
		return f.first || this.map.tileTypeGet(x,y);
	}

	atDir(x,y,dir) {
		return at(x + DirectionAdd[dir].x, y + DirectionAdd[dir].y);
	}

	findCollider(travelMode,x,y,ignoreEntity) {
		let mayTravel = 'may'+String.capitalize(travelMode || "walk");
		let f = this.findAliveOthers().at(x,y);
		if( ignoreEntity ) {
			f.exclude(ignoreEntity);
		}
		if( f.first && !f.first[mayTravel] ) {
			return f.first;
		}
		let g = new ItemFinder(this.map.itemList).at(x,y);
		if( g.first && !g.first[mayTravel] ) {
			return g.first;
		}
		let tile = this.map.tileTypeGet(x,y);
		if( !tile[mayTravel] ) {
			return tile;
		}
		return null;
	}
	mayOccupy(travelMode,x,y,ignoreEntity) {
		let type = this.findCollider(travelMode,x,y,ignoreEntity);
		return type===null;
	}

	mayEnter(x,y,avoidProblem) {
		let entityType = this.at(x,y);
		let mayTravel = 'may'+String.capitalize(this.travelMode || "walk");
		if( !entityType[mayTravel] ) {
			return false;
		}
		// If we are already in a problem, then we should probably just keep ignoring it. For example,
		// once we've decided to enter fire, better just go for it!
		if( avoidProblem && entityType.isProblem && entityType.isProblem(this,entityType) ) {
			return false;
		}
		return true;
	}

	mayGo(dir,avoidProblem) {
		return this.mayEnter(this.x+DirectionAdd[dir].x,this.y+DirectionAdd[dir].y,avoidProblem);
	}

	avoidProblem() {
		// WARNING! This does NOT consider whether the creature is immune to the damage,
		// nor does it understand that their movement mode might be immune.
		return( this.attitude!=Attitude.ENRAGED && this.attitude!=Attitude.CONFUSED && this.attitude!=Attitude.PANICKED);
	}

	thinkWander(walkAnywhere=false) {
		this.record('wander'+(walkAnywhere ? ' anywhere' : ''), true);

		const RandCommand = [Command.N, Command.NE, Command.E, Command.SE, Command.S, Command.SW, Command.W, Command.NW];
		let reps = 4;
		let command;
		do {
			command = RandCommand[Math.randInt(0,RandCommand.length)];
			let dir = commandToDirection(command);
			if( dir !== false ) {
				if( walkAnywhere || this.mayGo(dir,this.avoidProblem()) ) {
					return command;
				}
			}
		} while( --reps );
		return Command.WAIT;
	}

	thinkApproach(target) {
		// Can I walk towards them?
		let dir = this.dirToEntityNatural(target);
		// Aggressive creatures will completely avoid problems if 1/3 health, otherwide they
		// avoid problems most of the time, but eventually will give in and take the risk.
		let avoidProblem = true;
		// Out of control attitudes just ignore caution.
		if( this.attitude == Attitude.ENRAGED || this.attitude == Attitude.PANICKED ) {
			avoidProblem = false;
		}
		// If you're aggressive and healthy, there is a 15% change you will charge forward through problems.
		if( this.attitude == Attitude.AGGRESSIVE && this.health>this.healthMax/3 && Math.chance(15) ) {
			avoidProblem = false;
		}
		this.record( (avoidProblem ? '' : 'not ')+'avoiding problem', true );

		if( this.mayGo(dir,avoidProblem) ) {
			this.record('approach '+target.name,true);
			return directionToCommand(dir);
		}
		return false;
	}

	think() {
		if( this.isDead() ) {
			return;
		}

		let useAiTemporarily = false;
		if( this.brain == Brain.USER ) {
			// Placeholder, since the onPlayerKey already sets the command for us
			if( this.loseTurn || this.attitude == Attitude.CONFUSED || this.attitude == Attitude.ENRAGED || this.Attitude == Attitude.PANICKED ) {
				useAiTemporarily = true;
			}
		}

		if( this.brain == Brain.AI || useAiTemporarily ) {
			this.command = (function() {

				if( this.loseTurn ) {
					return Command.LOSETURN;
				}

				// Note that attitude enraged makes isMyEnemy() return true for all creatures.
				let enemyList = this.findAliveOthers().isMyEnemy().canPerceiveEntity().byDistanceFromMe();
				let vendetta = enemyList.includesId(this.personalEnemy);
				let distanceToNearestEnemy = enemyList.count ? this.getDistance(enemyList.first.x,enemyList.first.y) : false;

				// CONFUSED
				if( this.attitude == Attitude.CONFUSED ) {
					return Math.chance(30) ? Command.WAIT : this.thinkWander(true);
				}

				// WORSHIP
				if( this.attitude == Attitude.WORSHIP ) {
					if( distanceToNearestEnemy > 3 ) {
						return Command.PRAY;
					}
					this.attitude == Attitude.AGGRESSIVE;
					if( this.brainTalk ) {
						tell(mSubject,this,' ',mVerb,'shout',': INTERLOPER!');
					}
				}

				if( this.attitude == Attitude.AWAIT ) {
					if( distanceToNearestEnemy > 5 ) {
						return Command.WAIT;
					}
					this.Attitude = Attitude.AGGRESSIVE;
				}

				// WANDER
				if( this.attitude == Attitude.WANDER && !vendetta ) {
					let dirLast = commandToDirection(this.commandLast);
					if( Math.chance(90) && dirLast !== false && this.mayGo(dirLast,this.avoidProblem()) ) {
						this.record('keep walking',true);
						return this.commandLast;
					}
					return Math.chance(30) ? Command.WAIT : this.thinkWander();
				}

				// FLOCK
				// Pack animals and pets return to safety when...
				let hurt = this.healthPercent()<30;
				if( hurt && this.brainPet ) {
					this.vocalize = [mSubject,this,' ',mVerb,Math.chance(50)?'wimper':'whine'];
				}
				if( (hurt || !enemyList.count) && (this.brainPet || this.packAnimal) ) {
					// When hurt, your pet will run towards you. Once with 2 it will flee its enemies, but still stay within 2 of you.
					let friendList = this.findAliveOthers().isMyFriend().farFromMe(2).byDistanceFromMe();
					if( friendList.count ) {
						this.record('back to a friend',true);
						let c = this.thinkApproach(friendList.first);
						if( c !== false ) {
							return c;
						}
					}
				}

				// If no enemy to attack or fles, then just wander around 
				if( !enemyList.count ) {
					this.record('no enemy',true);
					return this.thinkWander();
				}

				// FEARFUL
				// PANICKED
				// ~HESITANT
				// Flee if I am fearful or sometimes if hesitant
				let flee = (hurt && this.brainFlee) || ( this.attitude == Attitude.FEARFUL || this.attitude == Attitude.PANICKED || (this.attitude == Attitude.HESITANT && !vendetta && Math.chance(40)));
				if( flee ) {
					// This is a very basic flee, trying to always move away from nearest enemy. However, a
					// smarter version would pick every adjacent square and test whether any enemy could reach
					// that square, and more to the safest square.
					// PANICKED
					let panic = (this.attitude == Attitude.PANICKED);
					let dirAwayPerfect = (this.dirToEntityNatural(enemyList.first)+4)%DirectionCount;;
					let dirAwayRandom = (dirAwayPerfect+8+Math.randInt(0,3)-1) % DirectionCount;
					let dirAway = [dirAwayRandom,dirAwayPerfect,(dirAwayPerfect+8-1)%DirectionCount,(dirAwayPerfect+1)%DirectionCount];
					while( dirAway.length ) {
						let dir = dirAway.shift();
						if( panic || this.mayGo(dir,this.avoidProblem()) ) {
							this.record( (panic ? 'panicked flee' : 'fled')+' from '+enemyList.first.name, true );
							return directionToCommand(dir);
						}
					}

					this.record('cannot flee',true);
				}

				// AGGRESSIVE and all other emoptions
				// Attack if I am within reach, and aggressive or sometimes if hesitant
				let adjacent = this.findAliveOthers(enemyList.all).nearMe(this.reach);
				if( adjacent.count ) {
					let attack = this.attitude != Attitude.FEARFUL;
					if( this.attitude == Attitude.HESITANT && !vendetta && Math.chance(50) ) {
						attack = false;
					}
					if( attack ) {
						this.record('attack '+adjacent.first.name,true);
						return directionToCommand(this.dirToEntityPredictable(adjacent.first));
					}
				}

				let c = this.thinkApproach(enemyList.first);
				if( c !== false ) {
					return c;
				}
				return Math.random() < 0.50 ? Command.WAIT : this.thinkWander();

			}).apply(this);			

			this.record( this.attitude+" cmd: "+this.command );
		}
	}

	rollDamage(damageString) {
		return rollDice(damageString);
	}

	isImmune(damageType) {
		return String.arIncludes(this.immune,damageType);
	}
	isVuln(damageType) {
		return String.arIncludes(this.vuln,damageType);
	}
	isResistant(damageType) {
		return String.arIncludes(this.resist,damageType);
	}

	takeHealing(healer,amount,healingType,quiet=false) {
		amount = Math.min( amount, this.healthMax-this.health );
		this.health += amount;
		if( this.onHeal ) {
			quiet = this.onHeal(healer,this,amount,healingType);
		}
		if( !quiet ) {
			let result = (amount ? [' healed by ',mObject,healer,' for '+amount+' health.'] : [' already at full health.']);
			tell(mSubject,this,' ',mVerb,'is',...result);
		}
	}

	calcArmor(damageType) {
		let f = new ItemFinder(this.inventory).filter( item=>item.inSlot && item.isArmor );
		let armor = 0;
		f.process( item => { armor += item.calcArmor(damageType); });
		return Math.floor(armor);
	}

	calcDamageReduction(damageType) {
		let reduction = this.isResistant(damageType) ? 0.5 : 0.0;
		reduction += this.calcArmor(damageType)/ARMOR_SCALE;
		return Math.min(0.8,reduction);
	}

	takeDamage(attacker,amount,damageType,callback) {
		let noBacksies = attacker.isArmor || attacker.isHelm || attacker.isBoots;
		if( attacker.ownerOfRecord ) {
			attacker = attacker.ownerOfRecord;
		}
		if( attacker && attacker.invisible && !this.seeInvisible ) {
			amount *= (attacker.sneakAttackMult || 2);
		}
		if( this.isVuln(damageType) ) {
			amount *= 2;
		}
		if( this.isImmune(damageType) ) {
			amount = 0;
		}
		else {
			let damageReduction = this.calcDamageReduction(damageType);
			amount = Math.max(1,Math.floor(amount*(1.00-damageReduction)));
		}
		if( attacker && attacker.invisible ) {
			DeedManager.forceSingle(attacker,"invisible",false);
		}
		if( this.brain!=='user' ) {
			this.personalEnemy = attacker.id;
		}

		if( amount > 0 ) {
			animationAdd( new AniPaste({
				entity: this, xOfs: 0.5, yOfs: 0.5,
				sticker: StickerList.hit,
				x: this.x,
				y: this.y,
				duration: 0.3
			}));
		}

		this.health -= amount;
		this.takenDamage = amount;
		this.takenDamageType = damageType;
		this.takenDamageFromId = attacker.Id;

		if( callback ) {
			callback(attacker,this,amount,damageType);	
		}

		let quiet = false;
		if( this.onAttacked ) {
			quiet = this.onAttacked.call(this,attacker,amount,damageType);
		}
		if( !quiet ) {
			tell(mSubject,attacker,' ',mVerb,damageType,' ',mObject,this,amount<=0 ? ' with no effect!' : ' for '+amount+' damage!' );
		}

		if( !noBacksies && attacker.isMonsterType && this.inventory ) {
			let armorEffects = new ItemFinder(this.inventory).filter( item => item.inSlot );
			armorEffects.process( item => {
				if( item.effect && item.effect.isHarm ) {
					let fireArmorEffect = ARMOR_EFFECT_OP_ALWAYS.includes(item.effect.op) || Math.chance(ARMOR_EFFECT_CHANCE_TO_FIRE);
					if( fireArmorEffect ) {
						item.trigger( Command.NONE, this, attacker );
					}
				}
			});
		}
	}

	takePush(attacker,distance) {
		if( attacker.isItemType ) {
			attacker = attacker.ownerOfRecord || attacker;
		}
		let dx = Math.sign(this.x-attacker.x);
		let dy = Math.sign(this.y-attacker.y);
		if( dx==0 && dy==0 ) {
			debugger;
			return;
		}
		tell(mSubject,this,' is pushed!');
		let success = true;
		while( success && distance-- ) {
			success = this.moveTo(this.x+dx,this.y+dy,false);
		}
		this.loseTurn = true;
	}

	doDamage(other,amount,damageType,callback) {
		return other.takeDamage(this,amount,damageType,callback);
	}

	calcWeapon() {
		let weapon = new ItemFinder(this.inventory).filter( item=>item.inSlot==Slot.WEAPON ).first || {};
		let damage = weapon.damage || this.damage;
		let damageType = weapon.damageType || this.damageType || DamageType.STAB;
		return [weapon,damage,damageType];
	}

	attack(other,isRanged,onDamage) {
		if( (this.senseBlind && !this.baseType.senseBlind) || (other.invisible && !this.seeInvisible) ) {
			if( Math.chance(50) ) {
				tell(mSubject,this,' ',mVerb,'attack',' ',mObject,other,' but in the wrong direction!');
				return;
			}
		}
		let weapon,damage,damageType;
		[weapon,damage,damageType] = this.calcWeapon();
		damage = this.rollDamage(damage);
		let result = this.doDamage( other, damage, damageType, onDamage );

		// Trigger my weapon.
		if( weapon && weapon.effect ) {
			let fireWeaponEffect = WEAPON_EFFECT_OP_ALWAYS.includes(weapon.effect.op) || Math.chance(WEAPON_EFFECT_CHANCE_TO_FIRE);
			if( fireWeaponEffect ) {
				weapon.trigger( Command.ATTACK, this, other );
			}
		}
		if( this.onAttack ) {
			this.onAttack(other);
		}
		return result;
	}

	itemCreateByType(type,presets,inject) {
		if( type.isRandom ) debugger;
		let item = new Item( this, type, { x:this.x, y:this.y }, presets, inject );
		this._itemTake(item);
		return item;
	}


	pickup(item) {
		if( !item ) debugger;
		if( item.moveTo(this) !== false ) {
			if( item.isArmor && !item.armor ) {
				debugger;
			}
			if( item.isCorpse && Math.chance(90) ) {
				tell(mSubject|mCares,this,' ',mVerb,'find',' nothing on ',mObject,item,'.');
				item.destroy();
				return;
			}
			tell(mSubject,this,' ',mVerb,'pick',' up ',mObject,item,'.');
			if( item.triggerOnPickup ) {
				item.trigger(Command.PICKUP,this,this);
			}
		}
	}

	setPosition(x,y) {
		if( this.x == x && this.y == y ) {
			return;
		}
		this.tileTypeLast = this.map.tileTypeGet(this.x,this.y);
		this.x = x;
		this.y = y;
		// This just makes sure that items have coordinates, for when they're the root of things.
		this.inventory.map( item => { item.x=x; item.y=y; } );
	}

	moveDir(dir) {
		let x = this.x + DirectionAdd[dir].x;
		let y = this.y + DirectionAdd[dir].y;
		return this.moveTo(x,y);
	}
	// Returns false if the move fails. Very important for things like takePush().
	moveTo(x,y,attackAllowed=true) {
		if( this.map.inBounds(x,y) ) {
			let f = this.findAliveOthers().at(x,y);
			let allyToSwap = false;

			// Attack enemies or neutrals
			if( f.count && attackAllowed && (this.isMyEnemy(f.first) || this.isMyNeutral(f.first)) ) {
				this.attack(f.first);
				return "attack";
			}
			else
			// Switch with friends, else bonk!
			if( f.count && this.isMyFriend(f.first) && this.isUser() ) {
				// swap places with allies
				allyToSwap = f.first;
			}
			else
			if( f.count ) {
				(f.first.onTouch || bonk)(this,f.first);
				return false;
			}

			let xOld = this.x;
			let yOld = this.y;
			let tileTypeHere = this.map.tileTypeGet(xOld,yOld);
			let tileType = this.map.tileTypeGet(x,y);

			// Does this tile type always do something to you when you depart any single instance of it?
			if( tileTypeHere.onDepart ) {
				if( tileTypeHere.onDepart(this,adhoc(tileTypeHere,xOld,yOld)) === false ) {
					return false;
				}
			}

			// Are we leaving this TYPE of tile entirely? Like leaving water, fire or mud?
			if( tileType.name != tileTypeHere.name && tileTypeHere.onDepartType ) {
				if( tileTypeHere.onDepartType(this,adhoc(tileTypeHere,xOld,yOld),adhoc(tileType,x,y)) === false ) {
					return false;
				}
			}

			// If we can not occupy the target tile, then touch it/bonk into it
			let collider = this.findCollider(this.travelMode,x,y,allyToSwap);
			if( collider ) {
				(collider.onTouch || bonk)(this,adhoc(collider,x,y));
				return false;
			}

			// Are we entering a new tile TYPE?
			if( tileType.name != tileTypeHere.name && tileType.onEnterType ) {
				if( tileType.onEnterType(this,adhoc(tileType,x,y),tileTypeHere,xOld,yOld) === false ) {
					return false;
				}
			}

			if( allyToSwap ) {
				allyToSwap.setPosition(this.x,this.y);
			}
			this.setPosition(x,y);
			if( this.findAliveOthers().at(x,y).count ) {
				debugger;
			}
			if( this.onMove ) {
				this.onMove(this,x,y);
			}

			// We must be touching the new tile, so act on that.
			if( tileType.onTouch ) {
				tileType.onTouch(this,adhoc(tileType,x,y));
			}

			if( this.picksup ) {
				let f = new ItemFinder(this.map.itemList).at(x,y).filter( item => item.mayPickup!==false );
				for( let item of f.all ) {
					this.pickup(item);
				}
			}
			return true;
		}
	}

	act(timePasses=true) {
		if( this.isDead() ) {
			return;
		}

		if( timePasses && this.regenerate ) {
			this.health = Math.floor(Math.min(this.health+this.regenerate*this.healthMax,this.healthMax));
		}

		if( this.vocalize ) {
			tell(...this.vocalize);
			this.vocalize = false;
		}


		if( commandToDirection(this.command) !== false ) {
			let dir = commandToDirection(this.command);
			this.moveDir(dir);
		}
		else 
		switch( this.command ) {
			case Command.LOSETURN: {
				if( this.brain == 'user' ) {
					tell(mSubject,this,' ',mVerb,'spend', ' time recovering.');
				}
				this.loseTurn = false;
				let tileType = this.map.tileTypeGet(this.x,this.y);
				if( tileType.onTouch ) {
					tileType.onTouch(this,adhoc(tileType,this.x,this.y));
				}
				break;
			}
			case Command.WAIT: {
				if( this.brain == 'user' ) {
					tell(mSubject,this,' ',mVerb,'wait','.');
				}
				let tileType = this.map.tileTypeGet(this.x,this.y);
				if( tileType.onTouch ) {
					tileType.onTouch(this,adhoc(tileType,this.x,this.y));
				}
				break;
			}
			case Command.DEBUGTEST: {
				let gate = this.map.itemCreateByTypeId(this.x,this.y,'portal',{},{ toAreaId: "test" } );
				world.setPending( gate );
				break;
			}
			case Command.DEBUGKILL: {
				let target = this.commandTarget;
				tell(mSubject,target,' killed.');
				target.health = -1000;
				break;
			}
			case Command.DEBUGTHRIVE: {
				this.healthMax = 100000;
				this.health = this.healthMax;
				this.damage = 100000;
				this.senseItems = true;
				this.senseLife = true;
				break;
			}
			case Command.LOOT: {
				let item = this.commandItem;
				tell(mSubject,this,' ',mVerb,'loot',' ',mObject,item);
				let corpse = item.usedToBe;
				if( corpse ) {
					let picker = new Picker(corpse.level);
					let obj = picker.pick(picker.itemTable,corpse.loot);
					if( obj !== false ) {
						let item = this.itemCreateByType(obj.item,obj.presets,{isLoot:true});
						tell(mSubject,this,' ',mVerb,'find',' ',mObject|mA,item);
					}
					else {
						tell(mSubject,this,' ',mVerb,'find',' nothing.');
					}
				}
				item.destroy();
				break;
			}
			case Command.DROP: {
				let item = this.commandItem;
				let type = this.findCollider('walk',this.x,this.y);
				if( type !== null ) {
					tell(mSubject,this,' may not drop anything here.');
				}
				else {
					item.moveTo(this.map,this.x,this.y);
				}
				break;
			}
			case Command.QUAFF: {
				let item = this.commandItem;
				item.x = this.x;
				item.y = this.y;
				tell(mSubject,this,' ',mVerb,'quaff',' ',mObject,item);
				item.trigger(this.command,this,this);
				break;
			}
			case Command.GAZE: {
				let item = this.commandItem;
				item.x = this.x;
				item.y = this.y;
				tell(mSubject,this,' ',mVerb,'gaze',' into ',mObject,item,'. It shatters!');
				item.trigger(this.command,this,this);
				item.destroy();
				break;
			}
			case Command.THROW: {
				let item = this.commandItem;
				let target = this.commandTarget;
				item.moveTo(this.map,target.x,target.y);
				if( this.commandTarget.typeId ) {	// indicates it is not an (x,y) array
					tell(mSubject,item,' ',mVerb,item.attackVerb||'hit',' ',mObject,target);
				}
				else {
					tell(mSubject,item,' ',mVerb,item.attackVerb||'hit');
				}
				item.trigger(this.command,this,target);
				break;
			}
			case Command.CAST: {
				let item = this.commandItem;
				let target = this.commandTarget;
				item.x = this.x;
				item.y = this.y;
				tell(mSubject,this,' ',mVerb,'cast',' '+item.effect.name+' at ',mObject,target,'.');
				item.trigger(this.command,this,target);
				break;
			}
			case Command.USE: {
				let item = this.commandItem;
				// Remove anything already worn or used.
				if( item.inSlot ) {
					this.doff(item);
				}
				else
				if( item.slot ) {
					let itemToRemove = new ItemFinder(this.inventory).filter( i => i.inSlot==item.slot);
					if( itemToRemove.first ) {
						this.doff(itemToRemove.first);
					}
					this.don(item,item.slot);
				}
				break;
			}
			case Command.PRAY: {
				if( Math.chance(15) ) {
					tell(mSubject,this,': ',this.sayPrayer || '<praying...>');
				}
			}
		};
	}
}
function isEntity(e) { return e instanceof Entity; }

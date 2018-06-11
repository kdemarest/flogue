//
// ENTITY (monsters, players etc)
//
class Entity {
	constructor(depth,monsterType,inject) {
		// Use the average!
		let level = (depth+monsterType.level) / 2;
		let inits =    { inVoid: true, inventory: [], actionCount: 0, command: Command.NONE, commandLast: Command.NONE, history: [], historyPending: [], tileTypeLast: TileTypeList.floor };
		let values =   { id: GetUniqueEntityId(monsterType.typeId,level) };

		// BALANCE: Notice that monsters are created at LEAST at their native level, and if appearing on
		// a deeper map level then they average their native level and the map's level.
		let isPlayer = monsterType.brain==Brain.USER;
		let naturalWeapon = { isNatural: true, quick: 2, damageType: monsterType.damageType || DamageType.CUTS, name: 'natural weapon' };
		if( monsterType.reach ) {
			naturalWeapon.reach = monsterType.reach;
		}
		if( monsterType.range ) {
			naturalWeapon.range = monsterType.range;
		}
		let rangedWeapon = monsterType.rangedWeapon;
		if( rangedWeapon ) {
			rangedWeapon = Object.assign( {}, rangedWeapon );
			rangedWeapon.isNatural = true;
			rangedWeapon.range = rangedWeapon.range || RANGED_WEAPON_DEFAULT_RANGE;
			rangedWeapon.mayShoot = true;
			rangedWeapon.name = 'natural ranged weapon';
		}

		if( isPlayer ) {
			inits.healthMax 			= Rules.playerHealth(level);
			inits.armor     			= 0; //Rules.playerArmor(level);
			let damageWhenJustStartingOut = 0.75;	// I found that 50% was getting me killed by single goblins. Not OK.
			naturalWeapon.damage 		= Math.max(1,Math.floor(Rules.playerDamage(level)*damageWhenJustStartingOut));
			if( rangedWeapon ) {
				console.assert( rangedWeapon.range );
				rangedWeapon.damage 		= Math.max(1,Math.floor(Rules.playerDamage(level)*damageWhenJustStartingOut));
			}
		}
		else {
			let hits = monsterType.power.split(':');
			let hitsToKillMonster 	= parseFloat(hits[0]);
			let hitsToKillPlayer 	= parseFloat(hits[1]);
			inits.healthMax 		= Rules.monsterHealth(level,hitsToKillMonster);
			inits.armor     		= (monsterType.armor || 0);
			naturalWeapon.damage   	= Rules.monsterDamage(level,hitsToKillPlayer);
			if( rangedWeapon ) {
				console.assert( rangedWeapon.range );
				rangedWeapon.damage = Rules.monsterDamage(level,rangedWeapon.hitsToKillPlayer || hitsToKillPlayer);
			}
		}
		inits.level = level;
		inits.health = inits.healthMax;
		inits.naturalWeapon = naturalWeapon;
		inits.rangedWeapon = rangedWeapon;

		if( monsterType.pronoun == '*' ) {
			inits.pronoun = Math.chance(70) ? 'he' : 'she';
		}
		Object.assign( this, monsterType, inits, inject || {}, values );
		this.xOrigin = this.x;
		this.yOrigin = this.y;

		if( this.name && this.name.indexOf('/')>0 ) {
			this.name = this.name.split('/')[this.pronoun=='she' ? 1 : 0];
		}

		if( this.inventoryLoot ) {
			this.lootTake( this.inventoryLoot, this.level, null, true );
		}

		if( this.inventoryWear ) {
			this.lootTake( this.inventoryWear, this.level, null, true, item => {
				if( item.slot && !item.inSlot ) { this.don(item,item.slot); }
			});
		}

		this.name = (this.name || String.tokenReplace(this.namePattern,this));
		console.assert( typeof this.health === 'number' && !isNaN(this.health) );
		console.assert( this.x===undefined && this.y===undefined && this.area===undefined);
	}
	get map() {
		return this.area.map;
	}
	get entityList() {
		return this.area.entityList;
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
	gateTo(area,x,y) {
		if( this.area && this.area.id == area.id ) {
			return;
		}
		let hadNoArea = !this.area;
		console.assert( x!==undefined && y!==undefined );
		// DANGER! Doing this while within a loop across the entityList will result in pain!
		if( this.area ) {
			Array.filterInPlace( this.area.entityList, entity => entity.id!=this.id );
		}
		this.area = area;
		let fnName = this.isUser() ? 'unshift' : 'push';
		this.area.entityList[fnName](this);
		this.inVoid = false;
		this.x = x;
		this.y = y;
		let c = this.findFirstCollider(this.travelMode,x,y,this);
		if( c ) {
			[x,y] = this.map.spiralFind( this.x, this.y, (x,y) => !this.findFirstCollider(this.travelMode,x,y,this) );
			console.assert( x!==false );
			this.x = x;
			this.y = y;
		}
		if( Gab && hadNoArea ) {
			Gab.entityPostProcess(this);
		}
	}

	findAliveOthers(entityList = this.entityList) {
		return new Finder(entityList,this).excludeMe().isAlive();
	}
	isUser() {
		return this.brain == Brain.USER;
	}
	die() {
		if( this.dead && this.isUser() ) {
			return;
		}
		if( this.dead ) {
			debugger;
		}
		if( this.corpse ) {
			let mannerOfDeath = Gab.damagePast[this.takenDamageType||DamageType.BITE];
			if( !mannerOfDeath ) {
				debugger;
			}
			this.map.itemCreateByTypeId(this.x,this.y,this.corpse,{},{ usedToBe: this, mannerOfDeath: mannerOfDeath, isCorpse: true } );
		}
		tell(mSubject,this,' ',mVerb,'die','!');
		spriteDeathCallback(this.spriteList);
		this.dead = true;
	}

	isDead() {
		return this.dead || this.health <= 0;
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
	dirToPosNatural(x,y) {
		let dx = x - this.x;
		let dy = y - this.y;
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
			this.mapMemory = this.area.mapMemory;
		}
		else {
			// Calc vis if I am near the user, that it, I might be interacting with him!
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

	canPerceivePosition(x,y) {
		if( x===undefined || y===undefined ) {
			debugger;
		}
		if( typeof this.vis[y]==='undefined' || typeof this.vis[y][x]==='undefined' ) {
			return false;
		}
		return this.vis[y][x];
	}

	canPerceiveEntity(entity) {
		if( (entity.isMonsterType && this.senseLife) || (entity.isItemType && this.senseItems) ) {
			return true;
		}
		if( !this.vis ) {
			let d = this.getDistance(entity.x,entity.y);
			return d <= (this.sightDistance || STADARD_MONSTER_SIGHT_DISTANCE);
		}
		// This gets us up to whoever actually owns this item. But on the map, you just use the item.
		// This means that items can NOT be invisible independent of their owners.
		if( entity.ownerOfRecord ) {
			entity = entity.ownerOfRecord;
		}
		if( (this.senseBlind || (entity.invisible && !this.senseInvisible)) && entity.id!==this.id ) { // you can always perceive yourself
			return false;
		}
		return this.canPerceivePosition(entity.x,entity.y);
	}

	canTargetPosition(x,y) {
		if( x===undefined || y===undefined ) {
			debugger;
		}
		if( typeof this.vis[y]==='undefined' || typeof this.vis[y][x]==='undefined' ) {
			return false;
		}
		return this.vis[y][x];
	}
	canTargetEntity(entity) {
		return this.canTargetPosition(entity.x,entity.y);
	}

	doff(item) {
		if( !item.inSlot || !item.slot ) {
			debugger;
			return;
		}
		tell(mSubject,this,' ',mVerb,'remove',' ',mObject,item);
		DeedManager.end( deed => deed.item && deed.item.id==item.id );
		item.inSlot = false;
	}
	don(item,slot) {
		if( item.inSlot || !item.slot ) {
			debugger;
			return;
		}
		tell(mSubject,this,' ',mVerb,item.useVerb,' ',mObject,item);
		item.inSlot = slot;
		if( item.triggerOnUse || (item.triggerOnUseIfHelp && item.effect && (item.effect.isHelp || item.effect.isPlayerOnly)) ) {
			item.trigger(this,this,Command.USE);
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
	_itemTake(item,x,y) {
		if( this.inventory.includes(item) ) {
			debugger;
		}
		this.inventory.push(item);
		item.x = this.x;
		item.y = this.y;
		if( x!==item.x || y!==item.y ) debugger;

		item.ownerOfRecord = this;
		if( item.isGold ) {
			this.goldCount = (this.goldCount||0) + item.goldCount;
			item.destroy();
			return;
		}
		if( item.autoEquip && item.slot ) {
			let itemsInSlot = this.getItemsInSlot(item.slot);
			if( itemsInSlot.count < HumanSlotLimit[item.slot] ) {
				this.don(item,item.slot);
			}
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

	// NOTE: This collides with monsters first, then items, then tiles. It could be a LOT
	// more efficient if it checked the tile first, but that probably isn't best game-wise.
	findFirstCollider(travelMode,x,y,ignoreEntity) {

		function collide(entity) {
			if( entity[mayTravel] ) {
				return false;
			}
			if( travelMode=='walk' && entity.mayJump && self.jump < self.jumpMax && (self.jump || !curTile.mayJump)) {
				return false;
			}
			return true;
		}

		let self = this;
		let curTile = this.map.tileTypeGet(this.x,this.y);
		console.assert(curTile);

		let mayTravel = 'may'+String.capitalize(travelMode || "walk");

		// Am I colliding with another entity?
		let f = this.findAliveOthers().at(x,y).filter( collide );
		if( ignoreEntity ) {
			f.exclude(ignoreEntity);
		}
		if( f.count ) {
			return f.first;
		}

		// Am I colliding with an item?
		let g = this.map.findItem().at(x,y).filter( collide );
		if( g.count ) {
			return g.first;
		}

		// Am I colliding with a tile?
		let tile = this.map.tileTypeGet(x,y);
		if( tile && collide(tile) ) {
			return tile;
		}

		return null;
	}
	mayOccupy(travelMode,x,y,ignoreEntity) {
		let type = this.findFirstCollider(travelMode,x,y,ignoreEntity);
		return type===null;
	}

	mayEnter(x,y,avoidProblem) {
		if( !this.map.inBounds(x,y) ) {
			return false;
		}
		let type = this.findFirstCollider(this.travelMode,x,y);
		if( type ) {
			return false;
		}

		// Maybe we're not colliding, but perhaps there is an item present that is a problem.
		let g = this.map.findItem().at(x,y);
		if( g.count ) {
			let abort = false;
			g.process( item => {
				if( !item.isProblem ) return;
				let problem = item.isProblem(entity);
				if( problem == 'death' || avoidProblem ) {
					abort = true;
				}
			});
			if( abort ) {
				return false;
			}
		}

		// The AI should consider whether it is STARTING in a problem, and try to get out!
		let entityType = this.map.tileTypeGet(x,y);
		if( !entityType.isProblem ) {
			return true;
		}

		let problem = entityType.isProblem(this,entityType);
		if( problem == 'death' || avoidProblem ) {
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
			command = this.beyondTether() && Math.chance(90) ?
				directionToCommand[deltasToDirNatural(this.xOrigin-this.x,this.yOrigin-this.y)] :
				RandCommand[Math.randInt(0,RandCommand.length)];
			let dir = commandToDirection(command);
			if( dir !== false ) {
				if( walkAnywhere || this.mayGo(dir,this.avoidProblem()) ) {
					return command;
				}
			}
		} while( --reps );
		return Command.WAIT;
	}

	thinkApproach(x,y,target) {
		// Can I walk towards them?
		let dir = this.dirToPosNatural(x,y);
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
			this.record('approach '+(target ? target.name : '('+x+','+y+')'),true);
			return directionToCommand(dir);
		}
		return false;
	}
	beyondTether() {
		return this.tether && this.getDistance(this.xOrigin,this.yOrigin) > this.tether;
	}
	beyondOrigin() {
		return this.getDistance(this.xOrigin,this.yOrigin) > 0;
	}

	think() {
		if( this.isDead() ) {
			return;
		}

		let useAiTemporarily = false;
		if( this.brain == Brain.USER ) {
			// Placeholder, since the onPlayerKey already sets the command for us
			if( this.loseTurn || this.attitude == Attitude.CONFUSED || this.attitude == Attitude.ENRAGED || this.attitude == Attitude.PANICKED ) {
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
				let theEnemy = enemyList.first;
				let vendetta = enemyList.includesId(this.personalEnemy);
				let distanceToNearestEnemy = enemyList.count ? this.getDistance(theEnemy.x,theEnemy.y) : false;

				// CONFUSED
				if( this.attitude == Attitude.CONFUSED ) {
					return Math.chance(30) ? Command.WAIT : this.thinkWander(true);
				}

				// WORSHIP
				if( this.attitude == Attitude.WORSHIP ) {
					if( distanceToNearestEnemy===false && this.beyondOrigin() ) {
						let c = this.thinkApproach(this.xOrigin,this.yOrigin);
						if( c ) {
							return c;
						}
					}
					if( distanceToNearestEnemy===false || distanceToNearestEnemy > (this.tooClose||3) ) {
						return Command.PRAY;
					}
					this.attitude = Attitude.AGGRESSIVE;
					if( this.brainTalk ) {
						tell(mSubject,this,' ',mVerb,'shout',': INTERLOPER!');
					}
				}

				if( this.attitude == Attitude.AWAIT ) {
					if( distanceToNearestEnemy===false && this.beyondOrigin() ) {
						let c = this.thinkApproach(this.xOrigin,this.yOrigin);
						if( c ) {
							return c;
						}
					}
					if( distanceToNearestEnemy===false || distanceToNearestEnemy > (this.tooClose||4) ) {
						return Command.WAIT;
					}
					this.changeAttitude( Attitude.AGGRESSIVE );
				}

				// WANDER
				if( this.attitude == Attitude.WANDER && !vendetta ) {
					if( this.tooClose && distanceToNearestEnemy && distanceToNearestEnemy < this.tooClose ) {
						// Fall through to the aggression, BUT don't change to aggressive
						// until you are attacked. If the player manages to flee beyond your tooClose
						// range, then more power to him.
					}
					else {
						let dirLast = commandToDirection(this.commandLast);
						if( Math.chance(90) && dirLast !== false && !this.beyondTether() && this.mayGo(dirLast,this.avoidProblem()) ) {
							this.record('keep walking',true);
							return this.commandLast;
						}
						return Math.chance(20) ? Command.WAIT : this.thinkWander();
					}
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
						let c = this.thinkApproach(friendList.first.x,friendList.first.y,friendList.first);
						if( c !== false ) {
							return c;
						}
					}
				}

				if( !enemyList.count && this.attitude!==this.baseType.attitude ) {
					// This will revert us from being angry to wandering or whatever, once
					// the enemy is gone.
					this.changeAttitude( this.baseType.attitude );
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
					let dirAwayPerfect = (this.dirToEntityNatural(theEnemy)+4)%DirectionCount;;
					let dirAwayRandom = (dirAwayPerfect+8+Math.randInt(0,3)-1) % DirectionCount;
					let dirAway = [dirAwayRandom,dirAwayPerfect,(dirAwayPerfect+8-1)%DirectionCount,(dirAwayPerfect+1)%DirectionCount];
					while( dirAway.length ) {
						let dir = dirAway.shift();
						if( panic || this.mayGo(dir,this.avoidProblem()) ) {
							this.record( (panic ? 'panicked flee' : 'fled')+' from '+theEnemy.name, true );
							return directionToCommand(dir);
						}
					}

					this.record('cannot flee',true);
				}

				// AGGRESSIVE
				// Attack if I am within reach, and aggressive or sometimes if hesitant
				let doAttack = this.attitude != Attitude.FEARFUL;
				if( this.attitude == Attitude.HESITANT && !vendetta && Math.chance(50) ) {
					doAttack = false;
				}
				if( doAttack ) {
					let weapon = this.calcBestWeapon(enemyList.first);
					let distLimit = weapon.reach || weapon.range || 1;
					let inRange = this.findAliveOthers(enemyList.all).nearMe(distLimit);
					if( inRange.count ) {
						let target = vendetta && inRange.includesId(vendetta.id) ? vendetta : inRange.first;	// For now, always just attack closest.
						this.record('attack '+target.name+' with '+(weapon.name || weapon.typeId),true);
						this.commandItem = weapon;
						this.commandTarget = target;
						let d = this.getDistance(target.x,target.y);
						if( d > 1 ) {
							return this.itemToAttackCommand(weapon);
						}
						return directionToCommand(this.dirToEntityPredictable(target));
					}
				}

				if( this.beyondTether() && !this.brainDisengageFailed ) {
					let c = this.thinkApproach(this.xOrigin,this.yOrigin);
					if( c ) {
						this.brainDisengageAttempt = true;
						return c;
					}
				}

				let c = this.thinkApproach(theEnemy.x,theEnemy.y,theEnemy);
				if( c ) {
					return c;
				}
				return Math.chance(50) ? Command.WAIT : this.thinkWander();

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

	takeHealing(healer,amount,healingType,quiet=false,allowOverage=false) {
		// This allows prior health bonuses that might have cause health to exceed helthMax to exist.
		if( !allowOverage ) {
			amount = Math.max(0,Math.min( amount, this.healthMax-this.health ));
		}
		this.health += amount;
		if( this.onHeal ) {
			quiet = this.onHeal(healer,this,amount,healingType);
		}
		if( !quiet ) {
			let result = (amount ? [' healed by ',mObject,healer,' for '+amount+' health.'] : [' already at full health.']);
			tell(mSubject,this,' ',mVerb,'is',...result);
		}
	}

	calcShieldBlockChance(damageType,isRanged,shieldBonus) {
		if( !isRanged ) return 0;
		let shield = this.getFirstItemInSlot(Slot.SHIELD);
		if( !shield ) return 0;
		let blockChance = shield.blockChance + (shieldBonus=='stand' ? 0.50 : 0);
		return blockChance;
	}

	calcReduction(damageType,isRanged) {
		let is = (isRanged ? 'isShield' : 'isArmor');
		let f = new Finder(this.inventory).filter( item=>item.inSlot && item[is] );
		let armor = 0;
		f.process( item => { armor += item.calcReduction(damageType); });
		return Math.floor(armor);
	}

	changeAttitude(newAttitude) {
		this.attitude = newAttitude;
	}

	alertFriends(tellAbout=true) {
		let friendList = this.findAliveOthers().isMyFriend().canPerceiveEntity().nearMe(7);
		let numAlerted = 0;
		let self=this;
		friendList.process( entity => {
			if( entity.attitude == Attitude.WANDER || entity.attitude == Attitude.AWAIT ) {
				entity.changeAttitude(Attitude.AGGRESSIVE);
				if( tellAbout && !numAlerted && this.brainTalk ) {
					tell(mSubject,self,' ',mVerb,'shout',' to nearby allies.');
				}
				++numAlerted;
			}
		});
		return numAlerted;
	}

	takeDamagePassive(attacker,item,amount,damageType,callback) {
		return this.takeDamage(attacker,item,amount,damageType,callback,true);
	}

	assessVIR(item,damageType) {
		let isVuln = '';
		let isImmune = '';
		let isResist = '';

		if( this.isVuln(damageType) ) {
			isVuln = damageType;
		}
		else
		if( item && item.material && this.isVuln(item.material.typeId) ) {
			isVuln = item.material.name;
		}
		else
		if( this.isImmune(damageType) ) {
			isImmune = damageType;
		}
		else
		if( item && item.material && this.isImmune(item.material.typeId) ) {
			isImmune = item.material.name;
		}
		else
		if( this.isResistant(damageType) ) {
			isResist = damageType;
		}
		else
		if( item && item.material && this.isResistant(item.material.typeId) ) {
			isResist = item.material.name;
		}
		return [isVuln,isImmune,isResist];
	}


	takeDamage(attacker,item,amount,damageType,callback,noBacksies) {
		let quiet = false;

		if( attacker && attacker.invisible && !this.senseInvisible ) {
			amount *= (attacker.sneakAttackMult || 2);
		}

		// Deal with armor first...
		let isRanged = (attacker && this.getDistance(attacker.x,attacker.y) > 1) || (item && item.rangeDuration);
		let reduction = this.calcReduction(damageType,isRanged)/ARMOR_SCALE;

		reduction = Math.min(0.8,reduction);
		amount = Math.max(1,Math.floor(amount*(1.00-reduction)));

		let shield = this.getFirstItemInSlot(Slot.SHIELD);
		let isShielded = false;
		let blockChance = this.calcShieldBlockChance(damageType,isRanged,this.shieldBonus);
		if( Math.chance(blockChance*100) ) {
			amount = 0;
			isShielded = true;			
		}

		// Now resistance.
		let isVuln='',isImmune='',isResist='';
		if( !isShielded ) {
			[isVuln,isImmune,isResist] = this.assessVIR(item,damageType);
			if( isVuln ) {
				amount *= 2;
			}
			else
			if( isImmune ) {
				amount = 0;
			}
			else
			if( isResist ) {
				amount = Math.max(1,Math.floor(amount*0.5));
			}
		}

		if( attacker && attacker.invisible ) {
			let turnVisibleEffect = { op: 'set', stat: 'invisible', value: false };
			DeedManager.forceSingle(turnVisibleEffect,attacker,null,null);
		}
		if( attacker && attacker.isMonsterType ) {
			this.personalEnemy = attacker.id;
		}

		if( amount > 0 ) {
			let dx = this.x - (attacker ? attacker.x : this.x);
			let dy = this.y - (attacker ? attacker.y : this.y);
			// WARNING! For some whacky reason this call to deltaToDeg requires -dy. Who knows why?!
			let deg = (dx===0 && dy===0 ? 0 : deltaToDeg(dx,dy));
			let mag = Math.clamp( amount/this.healthMax, 0.05, 1.0 );
			let delay = !attacker || !attacker.isUser || attacker.isUser() ? 0 : 0.2;
			if( attacker && attacker.command == Command.THROW ) {
				// This seems a little loose to me, but... maybe it will work.
				delay += attacker.rangeDuration;
			}
			// Attacker lunges at you
			let lunge = 0.2 + 0.5 * mag;
			if( attacker && attacker.isMonsterType ) {
				new Anim( {}, {
					follow: 	attacker,
					delay: 		delay,
					duration: 	0.15,
					onInit: 		a => { a.puppet(attacker.spriteList); },
					onSpriteMake: 	s => { s.sPosDeg(deg,lunge); },
					onSpriteDone: 	s => { s.sReset(); }
				});
			}
			// blood flies away from the attacker
			let piecesAnim = new Anim({},{
				follow: 	this,
				img: 		StickerList[this.bloodId || 'bloodRed'].img,
				delay: 		delay,
				duration: 	0.2,
				onInit: 		a => { a.create(4+Math.floor(7*mag)); },
				onSpriteMake: 	s => { s.sScaleSet(0.20+0.10*mag).sVel(Math.rand(deg-45,deg+45),4+Math.rand(0,3+7*mag)); },
				onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel); }
			});
			// You also jump back and quiver
			if( this.spriteList ) {
				new Anim( {}, {
					follow: 	this,
					delay: 		delay,
					duration: 	0.1,
					onInit: 		a => { a.puppet(this.spriteList); },
					onSpriteMake: 	s => { },
					onSpriteTick: 	s => { s.sPosDeg(deg,lunge/2).sQuiver(0.05,0.1+mag*0.1); },
					onSpriteDone: 	s => { s.sReset(); }
				});
			}
			// And if you are killed then you shrink/fade
			if( amount >= this.health ) {
				if( this.spriteList ) {
					new Anim( {}, {
						follow: 	this,
						delay: 		delay+0.1,
						duration: 	0.1,
						onInit: 		a => { a.puppet(this.spriteList); },
						onSpriteMake: 	s => { },
						onSpriteTick: 	s => {
							if( s.elapsed === undefined || s.duration ===undefined ) { debugger; }
							//s.sScaleSet( 0.3+2.7/(1-s.elapsed/s.duration) ); }
						}
					});
				}
			}
		}

		if( isShielded ) {
			quiet = true;
			tell(mSubject,this,' ',mVerb,'catch',' that blow with ',mSubject|mPossessive,this,' ',mObject,shield);
			new Anim( {}, {
				follow: 	this,
				img: 		StickerList.showResistance.img,
				duration: 	0.2,
				delay: 		item ? item.rangeDuration || 0 : 0,
				onInit: 		a => { a.create(1); },
				onSpriteMake: 	s => { s.sScaleSet(0.75); },
				onSpriteTick: 	s => { }
			});
		}

		if( isVuln ) {
			quiet = true;
			tell(mSubject,this,' ',mVerb,'is',' vulnerable to '+isVuln+', and ',mVerb,'take',' '+amount+' damage!');
			new Anim( {}, {
				follow: 	this,
				img: 		StickerList.showVulnerability.img,
				duration: 	0.2,
				delay: 		item ? item.rangeDuration || 0 : 0,
				onInit: 		a => { a.create(1); },
				onSpriteMake: 	s => { s.sScaleSet(0.75); },
				onSpriteTick: 	s => { }
			});
		}
		else
		if( isImmune ) {
			quiet = true;
			tell(mCares,attacker,mSubject,this,' is immune to '+isImmune);
			new Anim( {}, {
				follow: 	this,
				img: 		StickerList.showImmunity.img,
				duration: 	0.2,
				delay: 		item ? item.rangeDuration || 0 : 0,
				onInit: 		a => { a.create(1); },
				onSpriteMake: 	s => { s.sScaleSet(0.75); },
				onSpriteTick: 	s => { }
			});
		}
		else
		if( isResist ) {
			quiet = true;
			tell(mSubject,this,' ',mVerb,'resist',' '+isResist+', but takes '+amount+' damage.');
			new Anim( {}, {
				follow: 	this,
				img: 		StickerList.showResistance.img,
				duration: 	0.2,
				delay: 		item ? item.rangeDuration || 0 : 0,
				onInit: 		a => { a.create(1); },
				onSpriteMake: 	s => { s.sScaleSet(0.75); },
				onSpriteTick: 	s => { }
			});
		}

		console.assert( typeof amount === 'number' && !isNaN(amount) ); 
		console.assert( typeof this.health === 'number' && !isNaN(this.health) ); 
		this.health -= amount;
		this.takenDamage = amount;
		this.takenDamageType = damageType;
		this.takenDamageFromId = attacker ? attacker.id : 'nobody';
		this.inCombat = true;

		if( amount > 0 ) {
			if( this.brainDisengageAttempt ) {
				this.brainDisengageFailed = true;
			}
			if( this.attitude == Attitude.HESITANT || this.attitude == Attitude.WANDER || this.attitude == Attitude.AWAIT ) {
				this.changeAttitude(Attitude.AGGRESSIVE);
			}
			if( this.brainAlertFriends ) {
				this.alertFriends();
			}
		}

		if( callback ) {
			callback(attacker,this,amount,damageType);	
		}

		if( this.onAttacked && !noBacksies ) {
			quiet = this.onAttacked.call(this,attacker,amount,damageType);
		}
		if( !quiet && attacker ) {
			tell(mSubject|mCares,attacker,' ',mVerb,damageType,' ',mObject,this,amount<=0 ? ' with no effect!' : ' for '+amount+' damage!' );
		}

		if( !noBacksies && attacker && attacker.isMonsterType && this.inventory ) {
			let is = isRanged ? 'isShield' : 'isArmor';
			let retaliationEffects = new Finder(this.inventory).filter( item => item.inSlot && item[is] );
			retaliationEffects.process( item => {
				if( item.effect && item.effect.isHarm ) {
					let fireEffect = ARMOR_EFFECT_OP_ALWAYS.includes(item.effect.op) || Math.chance(ARMOR_EFFECT_CHANCE_TO_FIRE);
					if( fireEffect ) {
						item.trigger( attacker, this, Command.NONE );
					}
				}
			});
		}
	}

	takeShove(attacker,item,distance) {
		let source = attacker || item.ownerOfRecord;
		let dx = Math.sign(this.x-source.x);
		let dy = Math.sign(this.y-source.y);
		if( dx==0 && dy==0 ) {
			debugger;
			return;
		}
		tell(mSubject,this,' is shoved!');
		let success = true;
		this.beingShoved = true;
		while( success && distance-- ) {
			success = this.moveTo(this.x+dx,this.y+dy,false,null);
		}
		delete this.beingShoved;
		this.loseTurn = true;
	}

	itemToAttackCommand(weapon) {
		if( !weapon.range ) {
			return Command.ATTACK;
		}
		if( weapon.mayThrow ) {
			return Command.THROW;
		}
		if( weapon.isSpell ) {
			return Command.CAST;
		}
		if( weapon.mayShoot || weapon.isNatural ) {
			return Command.SHOOT;
		}
		debugger;
		return Command.SHOOT;
	}

	generateEffectOnAttack(weapon,src) {
		weapon.effectOnAttack = weapon.effectOnAttack || {
			op: 		'damage',
			isInstant: 	true,
			value: 		src && src.conveyDamageToAmmo ? src.damage : weapon.damage,
			damageType: src && src.conveyDamageTypeToAmmo ? src.damageType : (weapon.damageType || DamageType.CUTS),
			icon: 		false,
			name: 		weapon.name
		};
		if( src && src.effect && src.conveyEffectToAmmo ) {
			weapon.effect = weapon.effect || Object.assign({},src.effect);
		}
	}

	calcDefaultWeapon() {
		let weapon = new Finder(this.inventory).filter( item=>item.inSlot==Slot.WEAPON ).first || this.naturalWeapon;
		this.generateEffectOnAttack(weapon);
		return weapon;
	}

	calcBestWeapon(target) {
		let self = this;
		let weaponList = new Finder(this.inventory).filter( item => {
			if( item.isWeapon ) return true;
			if( (item.isSpell || item.isPotion) && item.effect.isHarm ) return true;
			return false;
		});
		weaponList.prepend(this.naturalWeapon);
		if( this.rangedWeapon ) {
			weaponList.prepend(this.rangedWeapon);
		}
		// We now have a roster of all possible weapons. Eliminate those that are not charged.
		weaponList.filter( item => !item.rechargeLeft );
		// Any finally, do not bother using weapons that can not harm the target.
		weaponList.filter( item => {
			// WARNING! This does not check all possible immunities, like mental attack! Check the effectApply() function for details.
			let isVuln,isImmune,isResist;
			[isVuln,isImmune,isResist] = self.assessVIR(item,item.damageType || item.effect.damageType);
			return !isImmune;
		});
		// remove any ranged weapon or reach weapon with an obstructed shot
		weaponList.filter( item => {
			let r = ( item.range || item.reach || 1 );
			return self.shotClear(self.x,self.y,target.x,target.y);
		});
		// Now let which weapon we choose be random, assuming we have lots of them :-)
		weaponList.shuffle();
		let dist = this.getDistance(target.x,target.y);
		// Always choose a melee weapon if you have the reach.
		let weapon = weaponList.find( item => !item.range && dist <= (item.reach||1) );
		if( !weapon ) {
			// If no melee weapon with appropriate reach, choose a ranged weapon with right range
			weapon = weaponList.find( item => item.range && dist <= item.range );
		}
		if( !weapon ) {
			weapon = this.naturalWeapon;
		}

		this.generateEffectOnAttack(weapon);
		return weapon;
	}

	attack(target,weapon,isRanged) {
		this.lastAttackTargetId = target.id;	// Set this early, despite blindness!

		if( (this.senseBlind && !this.baseType.senseBlind) || (target.invisible && !this.senseInvisible) ) {
			if( Math.chance(50) ) {
				tell(mSubject,this,' ',mVerb,'attack',' ',mObject,target,' but in the wrong direction!');
				return;
			}
		}

		weapon = weapon || this.calcDefaultWeapon();

		let quick = weapon && weapon.quick>=0 ? weapon.quick : 1;
		let dodge = target.dodge>=0 ? target.dodge : 0;
		if( dodge > quick ) {
			tell( mSubject,target,' '+(dodge==2 ? 'nimbly ' : ''),mVerb,'dodge',' ',mObject|mPossessive|mCares,this,(quick==0 ? ' clumsy' : '')+' '+(weapon?weapon.name:'attack') );

			let dx = target.x - this.x;
			let dy = target.y - this.y;
			let deg = deltaToDeg(dx,dy)+Math.rand(-45,45);
			let delay = (this.isUser() ? 0 : 0.2) + ( this.command == Command.THROW || this.command == Command.SHOOT ? this.rangeDuration : 0 );
			// Show a dodging icon on the entity
			new Anim( {}, {
				follow: 	target,
				img: 		StickerList.showDodge.img,
				duration: 	0.2,
				delay: 		delay,
				onInit: 		a => { a.create(1); },
				onSpriteMake: 	s => { s.sScaleSet(0.75); },
				onSpriteTick: 	s => { }
			});
			// Make the entity wiggle away a bit.
			new Anim( {}, {
				follow: 	target,
				delay: 		delay,
				duration: 	0.15,
				onInit: 		a => { a.puppet(target.spriteList); },
				onSpriteMake: 	s => { s.sPosDeg(deg,0.3); },
				onSpriteDone: 	s => { s.sReset(); }
			});
			return;
		}

		effectApply( weapon.effectOnAttack, target, this, weapon );

		// Trigger my weapon.
		if( weapon && weapon.effect ) {
			let fireWeaponEffect = WEAPON_EFFECT_OP_ALWAYS.includes(weapon.effect.op) || Math.chance(WEAPON_EFFECT_CHANCE_TO_FIRE);
			if( fireWeaponEffect ) {
				weapon.trigger( target, this, Command.ATTACK );
			}
		}
		if( this.onAttack ) {
			this.onAttack(target);
		}
	}

	itemCreateByType(type,presets,inject) {
		if( type.isRandom ) debugger;
		if( !this.level ) debugger;
		let item = new Item( this.level, type, presets, inject );
		item.giveTo(this,this.x,this.y);
		return item;
	}

	lootTake( lootString, level, originatingEntity, quiet, onEach ) {
		let itemList = [];
		let found = [];
		new Picker(level).pickLoot( lootString, loot=>{
			loot.giveTo( this, this.x, this.y);
			itemList.push(loot);
			if( onEach ) { onEach(loot); }
			found.push(mObject|mA|mList|mBold,loot);
		});
		if( !quiet || this.inVoid ) {
			let description = [
				mSubject,this,' ',mVerb,'find',' '
			].concat( 
				found.length ? found : ['nothing'],
				originatingEntity ? [' on ',mObject,originatingEntity] : ['']
			);
			tell(...description);
		}
		return itemList;
	}
	
	pickup(item) {
		if( !item ) debugger;

		item.giveTo(this,this.x,this.y);
		if( (item.isArmor || item.isShield) && !item.armor ) {
			debugger;
		}
		if( item.isCorpse ) {
			let corpse = item.usedToBe;
			if( !corpse || !corpse.loot ) {
				tell(mSubject,this,' ',mVerb,'find',' ',mObject|mA,item);
				return;
			}
			this.lootTake( corpse.loot, corpse.level, corpse );
			item.destroy();
			return;
		}
		tell(mSubject,this,' ',mVerb,'pick',' up ',mObject|mBold,item,'.');
	}

	pickAmmo(weapon) {
		if( !weapon.ammoType ) {
			return true;
		}
		let f = new Finder(this.inventory).filter(i=>(i[weapon.ammoType] || i.typeId==weapon.ammoType.split('.')[0]) && i.inSlot==Slot.AMMO);
		if( !f.count ) {
			f = new Finder(this.inventory).filter(i=>(i[weapon.ammoType] || i.typeId==weapon.ammoType.split('.')[0]) );
			if( !f.count ) {
				if( this.strictAmmo ) {
					return false;
				}
				// In theory we could generate a certain ammot type, if this weapon isn't specifying a particular item type.
				let ammoList = this.lootTake( weapon.ammoType, this.level, this, true );
				console.assert(ammoList[0]);
				ammoList[0].breakChance = 100;	// avoid generating heaps of whatever is being used for ammo!
				return ammoList[0];
			}
		}
		return f.first;
	}

	throwItem(item,target) {
		item.giveTo(this.map,target.x,target.y);
		if( item.damage && !target.isPosition ) {
			this.attack(target,this.commandItem,true);
		}
		else {
			if( !target.isPosition ) {	// indicates it is not an (x,y) array
				tell(mSubject,item,' ',mVerb,item.attackVerb||'hit',' ',mObject,target);
			}
			else {
				tell(mSubject,item,' ',mVerb,item.attackVerb||'hit');
			}
			let result = item.trigger(target,this,this.command);
		}
		let breakChance = item.breakChance || DEFAULT_CHANCE_AMMO_BREAKS;
		if( Math.chance(breakChance) ) {
			item.destroy();
		}
	}

	cast(item,target) {
		this.lastAttackTargetId = target.id;
		item.x = this.x;
		item.y = this.y;
		tell(mSubject,this,' ',mVerb,'cast',' '+item.effect.name+' at ',mObject,target,'.');
		item.trigger(target,this,this.command);
	}

	shotClear(sx,sy,tx,ty) {
		let self = this;
		function test(x,y) {
			let tile = self.map.tileTypeGet(x,y);
			return tile && tile.mayFly;
		}
		return shootRange(sx,sy,tx,ty,test);
	}


	shoot(item,target) {
		console.assert(item.ammoType);

		let ammo = this.pickAmmo(item);
		if( ammo == false ) {
			tell(mSubject,this,' ',mVerb,'lack',' any '+item.ammoId+' to shoot!');
			return false;
		}
		if( ammo == true ) {
			// This weapon uses no ammunition. It simply takes effect.
			ammo = item;
		}
		else {
			ammo.ammoOf = item;
			this.generateEffectOnAttack(ammo,item);
			ammo.giveTo(this.map,target.x,target.y);
		}

		tell(mSubject,this,' ',mVerb,ammo.attackVerb || 'shoot',' ',mObject,item,' at ',mObject,target,'.');
		if( ammo.damage && !target.isPosition ) {
			this.lastAttackTargetId = target.id;
			this.attack(target,ammo,true);
		}
		else {
			ammo.trigger(target,this,this.command);
		}
		if( ammo.id !== item.id && Math.chance( ammo.breakChance || DEFAULT_CHANCE_AMMO_BREAKS ) ) {
			ammo.destroy();
		}
		return true;
	}

	setPosition(x,y) {
		if( this.x == x && this.y == y ) {
			return;
		}
		this.tileTypeLast = this.map.tileTypeGet(this.x,this.y);
		console.assert(this.tileTypeLast);
		this.x = x;
		this.y = y;
		// This just makes sure that items have coordinates, for when they're the root of things.
		this.inventory.map( item => { item.x=x; item.y=y; } );
	}

	moveDir(dir,weapon) {
		let x = this.x + DirectionAdd[dir].x;
		let y = this.y + DirectionAdd[dir].y;
		return this.moveTo(x,y,true,weapon);
	}
	// Returns false if the move fails. Very important for things like takeShove().
	moveTo(x,y,attackAllowed=true,weapon=null) {
		if( !this.map.inBounds(x,y) ) {
			return;
		}

		// Move into monsters
		//-------------------
		let f = this.findAliveOthers().at(x,y);
		let allyToSwap = false;

		// Attack enemies or neutrals
		if( f.count && attackAllowed && (this.isMyEnemy(f.first) || this.isMyNeutral(f.first)) ) {
			this.attack(f.first,weapon);
			return "attack";
		}
		else
		// Switch with friends, else bonk!
		if( f.count && !f.first.job && this.isMyFriend(f.first) && this.isUser() ) {
			// swap places with allies
			allyToSwap = f.first;
		}
		else
		if( f.count && f.first.job ) {
			this.guiViewCreator = { view: f.first.job, entity: f.first };
			return false;
		}
		else
		if( f.count ) {
			(f.first.onTouch || bonk)(this,f.first);
			return false;
		}

		// If we can not occupy the target tile, then touch it/bonk into it
		let collider = this.findFirstCollider(this.travelMode,x,y,allyToSwap);
		if( collider ) {
			(collider.onTouch || bonk)(this,adhoc(collider,this.map,x,y));
			return false;
		}

		let xOld = this.x;
		let yOld = this.y;
		let tileTypeHere = this.map.tileTypeGet(xOld,yOld);
		console.assert(tileTypeHere);
		let tileType = this.map.tileTypeGet(x,y);
		console.assert(tileType);

		// Does this tile type always do something to you when you depart any single instance of it?
		if( tileTypeHere.onDepart ) {
			if( tileTypeHere.onDepart(this,adhoc(tileTypeHere,this.map,xOld,yOld)) === false ) {
				return false;
			}
		}

		// Are we leaving this TYPE of tile entirely? Like leaving water, fire or mud?
		if( tileType.name != tileTypeHere.name && tileTypeHere.onDepartType ) {
			if( tileTypeHere.onDepartType(this,adhoc(tileTypeHere,this.map,xOld,yOld),adhoc(tileType,this.map,x,y)) === false ) {
				return false;
			}
		}

		// Are we entering a new tile TYPE?
		if( tileType.name != tileTypeHere.name && tileType.onEnterType ) {
			if( tileType.onEnterType(this,adhoc(tileType,this.map,x,y),tileTypeHere,xOld,yOld) === false ) {
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
			this.onMove.call(this,x,y);
		}

		if( this.picksup ) {
			let f = this.map.findItem().at(x,y).filter( item => item.mayPickup!==false );
			for( let item of f.all ) {
				this.pickup(item);
			}
		}
		return true;
	}

	actOnCommand() {
		switch( this.command ) {
			case Command.LOSETURN: {
				if( this.brain == 'user' ) {
					tell(mSubject,this,' ',mVerb,'spend', ' time recovering.');
				}
				this.loseTurn = false;
				let tileType = this.map.tileTypeGet(this.x,this.y);
				if( tileType && tileType.onTouch ) {
					tileType.onTouch(this,adhoc(tileType,this.map,this.x,this.y));
				}
				break;
			}
			case Command.WAIT: {
				this.shieldBonus = 'stand';
				if( this.brain == 'user' ) {
					tell(mSubject,this,' ',mVerb,'wait','.');
				}
				break;
			}
			case Command.DEBUGTEST: {
				let gate = this.map.itemCreateByTypeId(this.x,this.y,'portal',{},{ toAreaId: "test" } );
				this.area.world.setPending( gate );
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
				break;
			}
			case Command.DEBUGVIEW: {
				this.senseItems = true;
				this.senseLife = true;
				this.map.traverse( (x,y) => {
					this.mapMemory[y] = this.mapMemory[y] || {};
					let type = this.map.findItem().at(x,y).filter( item=>!item.isTreasure ).first || this.map.tileTypeGet(x,y);
					this.mapMemory[y][x] = type;
				});
				break;
			}
			case Command.DEBUGANIM: {
				let entity = this;
				let anim = new Anim({},{
					x: 			entity.x,
					y: 			entity.y,
					img: 		entity.img,
					onInit: 		a => { a.create(1); },
					onSpriteMake: 	s => { s.duration = 0.5; },
					onSpriteTick: 	s => { s.sScale(1.0+s.sSine(1.0)); }
				});

				break;
			}
			case Command.LOOT: {
				if( this.commandItem.usedToBe ) {
					this.lootTake(this.commandItem.usedToBe.loot || '',this.commandItem.usedToBe.level,this.commandItem);
				}
				break;
			}
			case Command.DROP: {
				this.shieldBonus = 'stand';
				let item = this.commandItem;
				let type = this.findFirstCollider('walk',this.x,this.y);
				if( type !== null ) {
					tell(mSubject,this,' may not drop anything here.');
				}
				else {
					item.giveTo(this.map,this.x,this.y);
				}
				break;
			}
			case Command.QUAFF: {
				this.shieldBonus = 'stand';
				let item = this.commandItem;
				item.x = this.x;
				item.y = this.y;
				tell(mSubject,this,' ',mVerb,'quaff',' ',mObject,item);
				item.trigger(this,this,this.command);
				break;
			}
			case Command.GAZE: {
				this.shieldBonus = 'stand';
				let item = this.commandItem;
				item.x = this.x;
				item.y = this.y;
				let shatter = Math.chance(33);
				tell(mSubject,this,' ',mVerb,'gaze',' into ',mObject,item,'.'+(shatter ? ' It shatters!' : ''));
				item.trigger(this,this,this.command);
				if( shatter ) { item.destroy(); }
				break;
			}
			case Command.THROW: {
				this.throwItem(this.commandItem,this.commandTarget);
				// the result tells whether an effect was applied to the target (entity or psition)
				break;
			}
			case Command.CAST: {
				this.cast(this.commandItem,this.commandTarget);
				break;
			}
			case Command.SHOOT: {
				this.shoot(this.commandItem,this.commandTarget);
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
					let itemToRemove = this.getItemsInSlot(item.slot);
					if( itemToRemove.count >= HumanSlotLimit[item.slot] ) {
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
	getItemsInSlot(slot) {
		return new Finder(this.inventory).filter( i => i.inSlot==slot);
	}
	getFirstItemInSlot(slot) {
		let f = this.getItemsInSlot(slot);
		return f.first;
	}

	act(timePasses=true) {
		let dir = commandToDirection(this.command);
		if( this.isDead() ) {
			if( this.isSpectator && dir !== false ) {
				let x = this.x + DirectionAdd[dir].x;
				let y = this.y + DirectionAdd[dir].y;
				if( this.map.inBounds(x,y) ) {
					this.x = x;
					this.y = y;
				}
			}
			return true;
		}

		if( timePasses && this.regenerate ) {
			if( this.health < this.healthMax ) {
				this.health = Math.floor(Math.clamp(this.health+this.regenerate*this.healthMax,0.0,this.healthMax));
			}
		}

		if( this.vocalize ) {
			tell(...this.vocalize);
			this.vocalize = false;
		}


		let priorTileType = this.map.tileTypeGet(this.x,this.y);
		console.assert(priorTileType);

		if( timePasses ) {
			this.shieldBonus = '';
		}

		if( commandToDirection(this.command) !== false ) {
			this.moveDir(dir,this.commandItem);
		}
		else {
			this.actOnCommand();
		}

		if( timePasses ) {
			let tileType = this.map.tileTypeGet(this.x,this.y);
			console.assert(tileType);

			if( this.jumpMax ) {
				if( this.travelMode == 'walk' && tileType.mayJump && (this.jump || !priorTileType.mayJump) ) {
					// This assumes you ALWAYS want to jump over anything that you CAN jump over. It might
					// not always be the case... SO perhaps we should check if tileType.isProblem, or if !tileType.mayWalk.
					this.jump = (this.jump||0)+1;
				}
				else {
					this.jump = 0;
				}
				if( this.jump > this.jumpMax ) {
					this.jump = 0;
				}
			}
			else
			if( this.jump )	// What if they just took off boots or something?
				delete this.jump;

			if( !this.jump && tileType.isPit && this.travelMode == 'walk') {
				let stairs = this.map.findItem(this).filter( item=>item.gateDir==1 ).first;
				if( stairs ) {
					let gate = this.map.itemCreateByTypeId( this.x, this.y, 'pitDrop', {}, {
						toAreaId: stairs.toAreaId,
						themeId: stairs.themeId,
						killMeWhenDone: true
					});
 					this.area.world.setPending( gate );
 				}
			}

			// Important for this to happen after we establish whether you are jumping at this moment.
			if( tileType.onTouch ) {
				tileType.onTouch(this,adhoc(tileType,this.map,this.x,this.y));
			}
		}
	}
}
function isEntity(e) { return e instanceof Entity; }

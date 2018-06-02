//
// ENTITY (monsters, players etc)
//
class Entity {
	constructor(depth,monsterType,inject,levelOverride) {
		let level = Math.max(1,Math.floor(levelOverride || Math.max(monsterType.level,monsterType.level+depth/2)));
		let inits =    { inventory: [], actionCount: 0, command: Command.NONE, commandLast: Command.NONE, history: [], historyPending: [], tileTypeLast: TileTypeList.floor };
		let values =   { id: GetUniqueEntityId(monsterType.typeId,level) };

		// BALANCE: Notice that monsters are created at LEAST at their native level, and if appearing on
		// a deeper map level then they average their native level and the map's level.
		let isPlayer = monsterType.brain==Brain.USER;
		if( isPlayer ) {
			level = depth;
			inits.healthMax = Rules.playerHealth(level);
			inits.armor     = 0; //Rules.playerArmor(level);
			let damageWhenJustStartingOut = 0.75;	// I found that 50% was getting me killed by single goblins. Not OK.
			inits.damage    = Math.max(1,Math.floor(Rules.playerDamage(level)*damageWhenJustStartingOut));
		}
		else {
			let hits = monsterType.power.split(':');
			let hitsToKillMonster = parseInt(hits[0]);
			let hitsToKillPlayer = parseInt(hits[1]);
			inits.healthMax = Rules.monsterHealth(level,hitsToKillMonster);
			inits.armor     = (monsterType.armor || 0);
			inits.damage    = Rules.monsterDamage(level,hitsToKillPlayer);
		}
		inits.level = level;
		inits.health = inits.healthMax;
		if( monsterType.pronoun == '*' ) {
			inits.pronoun = Math.chance(70) ? 'he' : 'she';
		}
		Object.assign( this, monsterType, inits, inject || {}, values );
		this.xOrigin = this.x;
		this.yOrigin = this.y;

		if( this.name && this.name.indexOf('/')>0 ) {
			this.name = this.name.split('/')[this.pronoun=='she' ? 1 : 0];
		}
		this.name = /*'L'+this.level+' '+*/(this.name || String.tokenReplace(this.namePattern,this));

		if( this.inventoryLoot ) {
			this.lootTake( this.inventoryLoot, this.level, null, true );
		}

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
		console.assert( x!==undefined && y!==undefined );
		// DANGER! Doing this while within a loop across the entityList will result in pain!
		if( this.area ) {
			Array.filterInPlace( this.area.entityList, entity => entity.id!=this.id );
		}
		this.x = x;
		this.y = y;
		this.area = area;
		let fnName = this.isUser() ? 'unshift' : 'push';
		this.area.entityList[fnName](this);
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
			let mannerOfDeath = Say.damagePast[this.takenDamageType||DamageType.BITE];
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
		if( !this.vis || (entity.isMonsterType && this.senseLife) || (entity.isItemType && this.senseItems) ) {
			return true;
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
		if( item.triggerOnUse || (item.triggerOnUseIfHelp && item.effect && (item.effect.isHelp || item.effect.isPlayerOnly)) ) {
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
		let g = this.map.findItem().at(x,y);
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
					this.attitude == Attitude.AGGRESSIVE;
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
		let f = new Finder(this.inventory).filter( item=>item.inSlot && item.isArmor );
		let armor = 0;
		f.process( item => { armor += item.calcArmor(damageType); });
		return Math.floor(armor);
	}

	calcDamageReduction(damageType) {
		let reduction = this.isResistant(damageType) ? 0.5 : 0.0;
		reduction += this.calcArmor(damageType)/ARMOR_SCALE;
		return Math.min(0.8,reduction);
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

	takeDamagePassive(attacker,amount,damageType,callback) {
		return this.takeDamage(attacker,amount,damageType,callback,true);
	}

	takeDamage(attacker,amount,damageType,callback,noBacksies) {
		if( attacker.ownerOfRecord ) {
			attacker = attacker.ownerOfRecord;
		}
		if( attacker && attacker.invisible && !this.senseInvisible ) {
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
		this.personalEnemy = attacker.id;

		if( amount > 0 ) {
			let dx = this.x - attacker.x;
			let dy = this.y - attacker.y;
			// WARNING! For some whacky reason this call to deltaToDeg requires -dy. Who knows why?!
			let deg = deltaToDeg(dx,dy);
			let mag = Math.clamp( amount/this.healthMax, 0.05, 1.0 );
			let delay = !attacker || !attacker.isUser || attacker.isUser() ? 0 : 0.2;
			if( attacker.command == Command.THROW ) {
				// This seems a little loose to me, but... maybe it will work.
				delay += attacker.throwDuration;
			}
			// Attacker lunges at you
			let lunge = 0.2 + 0.5 * mag;
			new Anim( {}, {
				follow: 	attacker,
				delay: 		delay,
				duration: 	0.15,
				onInit: 		a => { a.puppet(attacker.spriteList); },
				onSpriteMake: 	s => { s.sPosDeg(deg,lunge); },
				onSpriteDone: 	s => { s.sReset(); }
			});
			// blood flies away from the attacker
			let piecesAnim = new Anim({},{
				follow: 	this,
				img: 		StickerList[this.bloodId || 'bloodRed'].img,
				delay: 		delay,
				scale: 		0.20+0.10*mag,
				duration: 	0.2,
				onInit: 		a => { a.create(4+Math.floor(7*mag)); },
				onSpriteMake: 	s => { s.sVel(Math.rand(deg-45,deg+45),4+Math.rand(0,3+7*mag)); },
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
							//s.sScaleSet( 0.3+2.7/(1-s.elapsed/s.duration) ); } //s.sScale(-1); } //.sAlpha(1-s.elapsed/s.duration);
						}
					});
				}
			}
		}

		this.health -= amount;
		this.takenDamage = amount;
		this.takenDamageType = damageType;
		this.takenDamageFromId = attacker.Id;

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

		let quiet = false;
		if( this.onAttacked && !noBacksies ) {
			quiet = this.onAttacked.call(this,attacker,amount,damageType);
		}
		if( !quiet ) {
			tell(mSubject|mCares,attacker,' ',mVerb,damageType,' ',mObject,this,amount<=0 ? ' with no effect!' : ' for '+amount+' damage!' );
		}

		if( !noBacksies && attacker.isMonsterType && this.inventory ) {
			let armorEffects = new Finder(this.inventory).filter( item => item.inSlot && item.isArmor );
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

	takeShove(attacker,distance) {
		if( attacker.isItemType ) {
			attacker = attacker.ownerOfRecord || attacker;
		}
		let dx = Math.sign(this.x-attacker.x);
		let dy = Math.sign(this.y-attacker.y);
		if( dx==0 && dy==0 ) {
			debugger;
			return;
		}
		tell(mSubject,this,' is shoved!');
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
		let weapon = new Finder(this.inventory).filter( item=>item.inSlot==Slot.WEAPON ).first || {};
		let damage = weapon.damage || this.damage;
		let damageType = weapon.damageType || this.damageType || DamageType.STAB;
		return [weapon,damage,damageType];
	}

	attack(other,isRanged,onDamage) {
		this.lastAttackTargetId = other.id;	// Set this early, despite blindness!

		if( (this.senseBlind && !this.baseType.senseBlind) || (other.invisible && !this.senseInvisible) ) {
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
		if( !this.level ) debugger;
		let item = new Item( this.level, type, presets, inject );
		item.giveTo(this,this.x,this.y);
		return item;
	}

	lootTake( lootString, level, originatingEntity, quiet ) {
		let found = [];
		new Picker(level).pickLoot( lootString, loot=>{
			loot.giveTo( this, this.x, this.y);
			found.push(mObject|mA|mList|mBold,loot);
		});
		if( !quiet ) {
			let description = [
				mSubject,this,' ',mVerb,'find',' '
			].concat( 
				found.length ? found : ['nothing'],
				originatingEntity ? [' on ',mObject,originatingEntity] : ['']
			);
			tell(...description);
		}
	}
	
	pickup(item) {
		if( !item ) debugger;

		item.giveTo(this,this.x,this.y);
		if( item.isArmor && !item.armor ) {
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
	// Returns false if the move fails. Very important for things like takeShove().
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

			let xOld = this.x;
			let yOld = this.y;
			let tileTypeHere = this.map.tileTypeGet(xOld,yOld);
			let tileType = this.map.tileTypeGet(x,y);

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

			// If we can not occupy the target tile, then touch it/bonk into it
			let collider = this.findCollider(this.travelMode,x,y,allyToSwap);
			if( collider ) {
				(collider.onTouch || bonk)(this,adhoc(collider,this.map,x,y));
				return false;
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
				this.onMove(this,x,y);
			}

			// We must be touching the new tile, so act on that.
			if( tileType.onTouch ) {
				tileType.onTouch(this,adhoc(tileType,this.map,x,y));
			}

			if( this.picksup ) {
				let f = this.map.findItem().at(x,y).filter( item => item.mayPickup!==false );
				for( let item of f.all ) {
					this.pickup(item);
				}
			}
			return true;
		}
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
			this.health = Math.floor(Math.min(this.health+this.regenerate*this.healthMax,this.healthMax));
		}

		if( this.vocalize ) {
			tell(...this.vocalize);
			this.vocalize = false;
		}


		if( commandToDirection(this.command) !== false ) {
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
					tileType.onTouch(this,adhoc(tileType,this.map,this.x,this.y));
				}
				break;
			}
			case Command.WAIT: {
				if( this.brain == 'user' ) {
					tell(mSubject,this,' ',mVerb,'wait','.');
				}
				let tileType = this.map.tileTypeGet(this.x,this.y);
				if( tileType.onTouch ) {
					tileType.onTouch(this,adhoc(tileType,this.map,this.x,this.y));
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
				break;
			}
			case Command.DEBUGVIEW: {
				this.senseItems = true;
				this.senseLife = true;
				this.map.traverse( (x,y) => {
					this.mapMemory[y] = this.mapMemory[y] || {};
					this.mapMemory[y][x] = this.map.tileTypeGet(x,y);
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
				let item = this.commandItem;
				let type = this.findCollider('walk',this.x,this.y);
				if( type !== null ) {
					tell(mSubject,this,' may not drop anything here.');
				}
				else {
					item.giveTo(this.map,this.x,this.y);
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

				item.giveTo(this.map,target.x,target.y);
				if( item.damage && !target.isPosition ) {
					this.attack(target,true);
				}
				else {
					if( !target.isPosition ) {	// indicates it is not an (x,y) array
						tell(mSubject,item,' ',mVerb,item.attackVerb||'hit',' ',mObject,target);
					}
					else {
						tell(mSubject,item,' ',mVerb,item.attackVerb||'hit');
					}
					let result = item.trigger(this.command,this,target);
				}
				// the result tells whether an effect was applied to the target (entity or psition)
				break;
			}
			case Command.CAST: {
				let item = this.commandItem;
				let target = this.commandTarget;
				this.lastAttackTargetId = target.id;
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
					let itemToRemove = new Finder(this.inventory).filter( i => i.inSlot==item.slot);
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
}
function isEntity(e) { return e instanceof Entity; }

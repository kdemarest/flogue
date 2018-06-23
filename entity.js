//
// ENTITY (monsters, players etc)
//
class Entity {
	constructor(depth,monsterType,inject,jobPickFn) {
		// Use the average!
		let level = Math.round( (depth+monsterType.level) / 2 );
		let inits =    { inVoid: true, inventory: [], actionCount: 0, command: Command.NONE, commandLast: Command.NONE, history: [], historyPending: [], tileTypeLast: TileTypeList.floor };
		let values =   { id: GetUniqueEntityId(monsterType.typeId,level) };

		// BALANCE: Notice that monsters are created at LEAST at their native level, and if appearing on
		// a deeper map level then they average their native level and the map's level.
		let isPlayer = monsterType.brain==Brain.USER;

		if( isPlayer ) {
			inits.healthMax 		= Rules.playerHealth(level);
			inits.armor     		= 0; //Rules.playerArmor(level);
			inits.experience 		= monsterType.experience || 0;
		}
		else {
			let hits = monsterType.power.split(':');
			let hitsToKillMonster 	= parseFloat(hits[0]);
			let hitsToKillPlayer 	= parseFloat(hits[1]);
			inits.healthMax 		= Rules.monsterHealth(level,hitsToKillMonster);
			inits.armor     		= (monsterType.armor || 0);
		}
		inits.level = level;
		inits.health = inits.healthMax;

		if( monsterType.pronoun == '*' ) {
			inits.pronoun = Math.chance(70) ? 'he' : 'she';
		}

		let jobId = values.jobId || (inject ? inject.jobId : '') || inits.jobId || monsterType.jobId;
		if( jobId == 'PICK' ) {
			jobId = jobPickFn();
			values.jobId = jobId;	// because values has the highest priority.
		}
		let jobData = Object.merge( {}, JobTypeList[jobId], { type:1, typeId:1, baseType:1, level:1, rarity:1, name:1, namePattern:1 } );
		jobData.inventoryLoot = Array.supplyConcat( monsterType.inventoryLoot, inits.inventoryLoot, jobData.inventoryLoot, inject?inject.inventoryLoot:null, values.inventoryLoot );

		Object.assign( this, monsterType, inits, jobData, inject || {}, values );
		this.xOrigin = this.x;
		this.yOrigin = this.y;

		if( this.name && this.name.indexOf('/')>0 ) {
			this.name = this.name.split('/')[this.pronoun=='she' ? 1 : 0];
		}

		if( this.inventoryLoot ) {
			this.lootTake( this.inventoryLoot, this.level, null, true );
		}
		console.assert( this.inventory.length >= 1 );

		if( this.inventoryWear ) {
			this.lootTake( this.inventoryWear, this.level, null, true, item => {
				if( item.slot && !item.inSlot ) { this.don(item,item.slot); }
			});
		}

		let naturalMeleeWeapon  = this.naturalMeleeWeapon;
		console.assert( naturalMeleeWeapon );
		if( isPlayer ) {
			let damageWhenJustStartingOut = 0.75;	// I found that 50% was getting me killed by single goblins. Not OK.
			naturalMeleeWeapon.damage = Math.max(1,Math.floor(Rules.playerDamage(level)*damageWhenJustStartingOut));
		}
		else {
			let hitsToKillPlayer = monsterType.power.split(':')[1];
			naturalMeleeWeapon.damage = Rules.monsterDamage(level,hitsToKillPlayer);
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
		while( this.history.length > 20 ) {
			this.history.pop();
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
		tell(mSubject|mCares,this,' ',mVerb,'are',' now on level '+area.id)
	}

	findAliveOthersNearby(entityList = this.entityList) {
		let list = [];
		for( let e of entityList ) {
			if( !e.isDead() && this.getDistance(e.x,e.y)<=MaxSightDistance && e.id!=this.id ) {
				list.push(e);
			}
		}
		return new Finder(list,this,false);
	}
	findAliveOthersAt(x,y) {
		let entityList = this.entityList;
		for( let e of entityList ) {
			if( !e.isDead() && e.id!=this.id && e.x==x && e.y==y ) {
				return new Finder([e],this,false);
			}
		}
		return new Finder([],this,false);
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
		if( this.corpse && !this.vanish ) {
			let mannerOfDeath = Gab.damagePast[this.takenDamageType||DamageType.BITE];
			if( !mannerOfDeath ) {
				debugger;
			}
			this.map.itemCreateByTypeId(this.x,this.y,this.corpse,{},{ usedToBe: this, mannerOfDeath: mannerOfDeath, isCorpse: true } );
		}
		let deathPhrase = this.deathPhrase;
		if( !deathPhrase ) {
			deathPhrase = [mSubject,this,' ',mVerb,this.vanish?'vanish':'die','!'];
		}
		if( this.brainMaster ) {
			deathPhrase.unshift(mCares,this.brainMaster);
		}
		tell(...deathPhrase);
		spriteDeathCallback(this.spriteList);
		this.dead = true;
	}

	isDead() {
		return this.dead || this.health <= 0 || this.vanish;
	}
	isAlive() {
		return !this.isDead();
	}
	experienceForLevel(level) {
		return (10+level)*level;
	}
	experienceProgress() {
		return (this.experience || 0) / this.experienceForLevel(this.level+1)
	}
	levelUp() {
		if( this.experience === undefined ) return;
		if( this.experience < this.experienceForLevel(this.level+1) ) {
			return;
		}
		this.level += 1;
		this.experience -= this.experienceForLevel(this.level+1);
		DeedManager.end( deed => deed.stat && deed.stat=='healthMax' );
		let add = Rules.playerHealth(this.level)-Rules.playerHealth(this.level-1);
		this.healthMax += add;
		this.health = Math.max(this.health+add,this.healthMax);
		tell(mSubject,this,' ',mVerb,'gain',' a level!');

		// happiness flies away from the attacker
		let tm = 0;
		let ct=0;
		let piecesAnim = new Anim({},{
			follow: 	this,
			img: 		StickerList.bloodYellow.img,
			duration: 		a => a.spritesMade && a.spritesAlive==0,
			onInit: 		a => { },
			onTick: 		a => a.createPerSec(40,2),
			onSpriteMake: 	s => s.sScaleSet(0.30).sVel(Math.rand(-30,30),Math.rand(5,10)).duration=1,
			onSpriteTick: 	s => s.sMove(s.xVel,s.yVel).sGrav(10)
		});
		// You also jump back and quiver
		if( this.spriteList ) {
			new Anim( {}, {
				follow: 	this,
				duration: 2,
				onInit: 		a => { a.puppet(this.spriteList); },
				onSpriteMake: 	s => { },
				onSpriteTick: 	s => { s.sQuiver(0.05,0.10); },
				onSpriteDone: 	s => { s.sReset(); }
			});
		}
		return true;
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
		if( this.brainMaster && entity.id == this.brainMaster.id ) {
			return true;
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
			// technically the user should have a has of all mapMemories, except this memory will persist across
			// whatever form you have taken, for example, even if you magic jar something.
			this.mapMemory = this.area.mapMemory;	
		}
		else {
			// Calc vis if I am near the user, that it, I might be interacting with him!
			let user = this.entityList.find( e => e.isUser() );
			doVis = user && this.getDistance(user.x,user.y) < MaxSightDistance;
		}

		if( doVis ) {
			this.vis = this.area.vis.calcVis(this.x,this.y,this.sightDistance,this.senseBlind,this.senseXray,this.vis,this.mapMemory);
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
		if( entity.inVoid ) {
			return false;
		}
		if( (entity.isMonsterType && this.senseLife) || (entity.isItemType && this.senseItems) ) {
			return true;
		}
		if( !this.vis ) {
			let d = this.getDistance(entity.x,entity.y);
			return d <= (this.sightDistance || STANDARD_MONSTER_SIGHT_DISTANCE);
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

	get naturalMeleeWeapon() {
		let weapon = new Finder(this.inventory).filter(item=>item.isNatural && item.isMelee).first;
		console.assert(weapon);
		return weapon;
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
		if( item.isCoin ) {
			this.coinCount = (this.coinCount||0) + item.coinCount;
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
		return this.findAliveOthersAt(x,y).isMyEnemy();
	}

	getDistance(x,y) {
		return Math.max(Math.abs(x-this.x),Math.abs(y-this.y));
	}

	at(x,y) {
		let f = this.findAliveOthersAt(x,y);
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
		let f = this.findAliveOthersAt(x,y).filter( collide );
		if( ignoreEntity ) {
			f.exclude(ignoreEntity);
		}
		if( f.count ) {
			return f.first;
		}

		// Am I colliding with an item?
		let g = this.map.findItemAt(x,y).filter( collide );
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

	mayEnter(x,y,problemTolerance) {
		if( !this.map.inBounds(x,y) ) {
			return false;
		}
		let type = this.findFirstCollider(this.travelMode,x,y);
		if( type ) {
			return false;
		}

		// Maybe we're not colliding, but perhaps there is an item present that is a problem.
		let g = this.map.findItemAt(x,y);
		if( g.count ) {
			let abort = false;
			g.process( item => {
				if( !item.isProblem ) return;
				let problem = item.isProblem(entity);
				if( problem > problemTolerance ){
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
		if( problem > problemTolerance ) {
			return false;
		}
		return true;
	}

	mayGo(dir,problemTolerance) {
		return this.mayEnter(this.x+DirectionAdd[dir].x,this.y+DirectionAdd[dir].y,problemTolerance);
	}

	problemTolerance() {
		// WARNING! This does NOT consider whether the creature is immune to the damage,
		// nor does it understand that their movement mode might be immune.
		if( this.attitude == Attitude.ENRAGED ) {
			return Prob.HARSH;
		}
		if( this.attitude == Attitude.PANICKED || this.attitude == Attitude.CONFUSED ) {
			return Prob.MILD;
		}
		return Prob.NONE;
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
				if( walkAnywhere || this.mayGo(dir,this.problemTolerance()) ) {
					return command;
				}
			}
		} while( --reps );
		return Command.WAIT;
	}

	thinkRetreat(dirAwayPerfect,panic=false) {
		let dirAwayRandom = (dirAwayPerfect+8+Math.randInt(0,3)-1) % DirectionCount;
		let dirAway = [dirAwayRandom,dirAwayPerfect,(dirAwayPerfect+8-1)%DirectionCount,(dirAwayPerfect+1)%DirectionCount];
		while( dirAway.length ) {
			let dir = dirAway.shift();
			if( panic || this.mayGo(dir,this.problemTolerance()) ) {
				return directionToCommand(dir);
			}
		}
		return false;
	}

	thinkApproach(x,y,target) {
		if( target && target.area.id !== this.area.id ) {
			let gate = new Finder(this.map.itemList,this).filter( gate=>gate.toAreaId==target.area.id ).closestToMe().first;
			if( gate ) {
				x = gate.x;
				y = gate.y;
				if( x==this.x && y==this.y ) {
					this.commandItem = gate;
					return Command.ENTERGATE;
				}
			}
		}

		if( this.brainMaster && !this.brainPath ) { debugger; }

		if( this.brainPath ) {
			let path = new Path(this.map);
			let result = path.findPath(this,this.x,this.y,x,y);
			if( result ) {
				let dir = path.path[0];
				this.record( this.name+" going "+dir+" from ("+this.x+','+this.y+')' );
				return directionToCommand(dir);
			}
			this.record( this.name+" pathing failed!" );
		}


		// Can I walk towards them?
		let dir = this.dirToPosNatural(x,y);
		// Aggressive creatures will completely avoid problems if 1/3 health, otherwide they
		// avoid problems most of the time, but eventually will give in and take the risk.
		let problemTolerance = this.problemTolerance();
		// If you're aggressive and healthy, there is a 15% change you will charge forward through problems.
		if( this.attitude == Attitude.AGGRESSIVE && Math.chance(15) ) {
			problemTolerance = Prob.HARSH;
		}
		this.record( 'Problem tolerance = '+problemTolerance, true );

		if( this.mayGo(dir,problemTolerance) ) {
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

				// Hard to say whether this should take priority over .busy, but it is pretty important.
				if( this.bumpCount >=2 ) {
					// The player is bumping into me, trying to get me to move.
					let c = this.thinkRetreat(this.bumpDir);
					if( c ) {
						this.record( 'retreat from bumper ', true );
						return c;
					}
					this.record( 'wander from bumper ', true );
					return this.thinkWander();
				}

				if( this.busy ) {
					return Command.BUSY;
				}

				// Note that attitude enraged makes isMyEnemy() return true for all creatures.
				let enemyList = this.findAliveOthersNearby().canPerceiveEntity().isMyEnemy().byDistanceFromMe();
				let theEnemy = enemyList.first;
				let vendetta = enemyList.includesId(this.personalEnemy);
				let distanceToNearestEnemy = enemyList.count ? this.getDistance(theEnemy.x,theEnemy.y) : false;
				let hurt = this.healthPercent()<30;
				let mindControlled = [Attitude.CONFUSED,Attitude.ENRAGED,Attitude.PANICKED].includes(this.attitude);

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

				if( this.brainMaster && !mindControlled) {
					if( (this.brainMaster.area.id!==this.area.id) || (enemyList.count<=0 && this.getDistance(this.brainMaster.x,this.brainMaster.y)>2) ) {
						let friend = this.brainMaster;
						this.record('stay near master '+this.brainMaster.id,true);
						let c = this.thinkApproach(friend.x,friend.y,friend);
						if( c !== false ) {
							return c;
						}
					}
				}

				let hungry = this.brainRavenous || false;
				hungry = hungry || (this.isAnimal && (distanceToNearestEnemy===false || distanceToNearestEnemy>4));
				if( hungry && !mindControlled  ) {
					let foodList = new Finder(this.map.itemList,this).filter(item=>item.isEdible).canPerceiveEntity().nearMe(2).byDistanceFromMe();
					if( foodList.first && foodList.first.x==this.x && foodList.first.y==this.y ) {
						this.record('found some food. eating.',true);
						this.commandItem = foodList.first;
						return Command.EAT;
					}
					if( foodList.first ) {
						this.record('head towards food',true);
						let c = this.thinkApproach(foodList.first.x,foodList.first.y,foodList.first);
						if( c !== false ) {
							return c;
						}
					}
				}

				if( !enemyList.count && this.team==Team.GOOD && !mindControlled ) {
					let f = this.findAliveOthersNearby().nearMe(1).filter( e=>e.isUser() );
					// when it is peaceful times, and the user is adjacent to me, s/he might want to interact, so
					// just hang out and wait.
					if( f.count ) return Command.WAIT;
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
						if( Math.chance(90) && dirLast !== false && !this.beyondTether() && this.mayGo(dirLast,this.problemTolerance()) ) {
							this.record('keep walking',true);
							return this.commandLast;
						}
						return Math.chance(20) ? Command.WAIT : this.thinkWander();
					}
				}

				// FLOCK
				// Pack animals and pets return to safety when...
				if( hurt && this.brainPet ) {
					this.vocalize = [mSubject,this,' ',mVerb,Math.chance(50)?'wimper':'whine'];
				}
				if( (hurt || !enemyList.count) && (this.brainMaster || this.brainPet || this.packAnimal) ) {
					// When hurt, your pet will run towards you. Once with 2 it will flee its enemies, but still stay within 2 of you.	
					let friend;
					if( this.brainMaster ) {
						// We explicitly include your master because s/he might be in a different area!
						friend = this.findAliveOthersNearby().prepend(this.brainMaster).isMyFriend().farFromMe(2).isId(this.brainMaster.id).first;
					}
					else {
						friend = this.findAliveOthersNearby().isMyFriend().nearMe(15).farFromMe(2).byDistanceFromMe().first;
					}
					if( friend ) {
						this.record('back to a friend',true);
						let c = this.thinkApproach(friend.x,friend.y,friend);
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
					let panic = (this.attitude == Attitude.PANICKED);
					let dirAwayPerfect = (this.dirToEntityNatural(theEnemy)+4)%DirectionCount;;
					let c = this.thinkRetreat(dirAwayPerfect,panic);
					if( c ) {
						this.record( (panic ? 'panicked flee' : 'fled')+' from '+theEnemy.name, true );
						return c;
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
						let temp = this.itemToAttackCommand(weapon);
						if( temp !== Command.ATTACK ) {
							return temp;
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
	isResist(damageType) {
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
		if( this.isResist(damageType) ) {
			isResist = damageType;
		}
		else
		if( item && item.material && this.isResist(item.material.typeId) ) {
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
		if( attacker && attacker.isMonsterType && (!this.brainMaster || this.brainMaster.id !=attacker.id) ) {
			this.personalEnemy = attacker.id;
		}

		if( amount > 0 ) {
			let dx = this.x - (attacker ? attacker.x : this.x);
			let dy = this.y - (attacker ? attacker.y : this.y);
			// WARNING! For some whacky reason this call to deltaToDeg requires -dy. Who knows why?!
			let deg = (dx===0 && dy===0 ? 0 : deltaToDeg(dx,dy));
			let mag = Math.clamp( amount/this.healthMax, 0.05, 1.0 );
			let delay = !attacker || !attacker.isUser || attacker.isUser() ? 0 : 0.2;
			if( attacker && (attacker.command == Command.THROW || attacker.command == Command.SHOOT || attacker.command == Command.CAST) ) {
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
			tell(mSubject,this,' ',mVerb,'catch',' that blow with ',mSubject|mPossessive,this,' ',mObject|mPossessed,shield);
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
			tell(mCares,attacker,mSubject,this,' ',mVerb,'is',' immune to '+isImmune);
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
			tell(mSubject,this,' ',mVerb,'resist',' '+isResist+', but ',mVerb,'take',' '+amount+' damage.');
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
		let sx = this.x;
		let sy = this.y;

		let dx = this.x-source.x;
		let dy = this.y-source.y;
		if( dx==0 && dy==0 ) {
			debugger;
			return;
		}
		let dist = Math.sqrt(dx*dx+dy*dy)

		// Special case - all large things resist shove.
		let resisting = false;
		if( this.isLarge ) {
			distance = Math.max(0,distance-1);
			resisting = true;
		}

		let success = true;
		let bonked = false;
		let fx = this.x;
		let fy = this.y;
		while( success && distance-- ) {
			fx += dx/dist;
			fy += dy/dist;
			success = this.moveTo(Math.round(fx),Math.round(fy),false,null);
			if( !success ) { bonked = true; break; }
		}
		tell(mSubject,this,' ',mVerb,'is',' ',bonked ? 'shoved but blocked.' : (resisting ? 'heavy but moves.' : 'shoved.'));
		this.loseTurn = true;

		let ddx = this.x - sx;
		let ddy = this.y - sy;
		let duration = Math.max(0.1,Math.sqrt(ddx*ddx+ddy*ddy) / 10);
		new Anim({
			x: 			sx,
			y: 			sy,
			delay: 		source.rangeDuration || 0,
			duration: 	duration,
			onInit: 		a => { a.puppet(this.spriteList); },
			onSpriteMake: 	s => { s.sReset().sVelTo(ddx,ddy,duration); },
			onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel); }
		});
	}

	itemToAttackCommand(weapon) {
		if( weapon.mayThrow ) {
			return Command.THROW;
		}
		if( weapon.mayCast ) {
			return Command.CAST;
		}
		if( weapon.mayShoot ) {
			return Command.SHOOT;
		}
		if( !weapon.range ) {
			return Command.ATTACK;
		}
		debugger;
		return Command.SHOOT;
	}

	generateEffectOnAttack(weapon,src) {
		console.assert(weapon.isWeapon);
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
		let weapon = new Finder(this.inventory).filter( item=>item.inSlot==Slot.WEAPON ).first || this.naturalMeleeWeapon;
		this.generateEffectOnAttack(weapon);
		return weapon;
	}

	calcBestWeapon(target) {
		let self = this;
		let weaponList = new Finder(this.inventory).filter( item => {
			if( item.isWeapon ) return true;
			if( (item.isSpell || item.isPotion) && item.effect && item.effect.isHarm ) return true;
			return false;
		});
		// We now have a roster of all possible weapons. Eliminate those that are not charged.
		weaponList.filter( item => !item.rechargeLeft );
		// Any finally, do not bother using weapons that can not harm the target.
		weaponList.filter( item => {
			// WARNING! This does not check all possible immunities, like mental attack! Check the effectApply() function for details.
			let isVuln,isImmune,isResist;
			[isVuln,isImmune,isResist] = target.assessVIR(item,item.damageType || item.effect.damageType);
			return !isImmune;
		});
		// remove any ranged weapon or reach weapon with an obstructed shot
		weaponList.filter( item => {
			if( Math.chance(this.brainIgnoreClearShots||0) ) return false;
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
			// NOTE: I don't implement blindness here, because no target would make it here if I was blind.
			weapon = weaponList.find( item => item.range && dist <= item.range );
		}
		if( !weapon ) {
			weapon = this.naturalMeleeWeapon;
		}
		console.assert( !weapon.rechargeLeft );
//		console.log( this.typeId+' picked '+(weapon.typeId || weapon.name)+' with recharge '+weapon.rechargeLeft );

		if( weapon.isWeapon ) {
			this.generateEffectOnAttack(weapon);
		}
		return weapon;
	}

	attack(target,weapon,isRanged) {
		console.assert(weapon);
		console.assert(weapon.isWeapon);
		this.lastAttackTargetId = target.id;	// Set this early, despite blindness!
		this.inCombat = true;

		if( (this.senseBlind && !this.baseType.senseBlind) || (target.invisible && !this.senseInvisible) ) {
			if( Math.chance(50) ) {
				tell(mSubject,this,' ',mVerb,'attack',' ',mObject,target,' but in the wrong direction!');
				return;
			}
		}
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
			let fireWeaponEffect = WEAPON_EFFECT_OP_ALWAYS.includes(weapon.effect.op) || Math.chance(weapon.chanceToFire || WEAPON_EFFECT_CHANCE_TO_FIRE);
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
	inventoryTake(inventory, originatingEntity, quiet, onEach) {
		let found = [];
		Object.each( inventory, item => {
			item.giveTo( this, this.x, this.y);
			if( onEach ) { onEach(item); }
			found.push(mObject|mA|mList|mBold,item);
		});
		if( !quiet && !this.inVoid ) {
			let description = [
				mSubject,this,' ',mVerb,'find',' '
			].concat( 
				found.length ? found : ['nothing'],
				originatingEntity ? [' on ',mObject,originatingEntity] : [''],
				'.'
			);
			tell(...description);
		}
	}

	lootGenerate( lootSpec, level ) {
		let itemList = [];
		new Picker(level).pickLoot( lootSpec, item=>{
			itemList.push(item);
		});
		return itemList;
	}

	lootTake( lootSpec, level, originatingEntity, quiet, onEach ) {
		let itemList = this.lootGenerate( lootSpec, level );
		this.inventoryTake(itemList, originatingEntity, quiet, onEach);
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
			// Prune out any fake items like natural weapons.
			if( this.experience !== undefined ) {
				this.experience += corpse.level;
			}
			let inventory = new Finder(corpse.inventory).isReal().all || [];
			inventory.push( ...this.lootGenerate( corpse.loot, corpse.level ) )
			this.inventoryTake( inventory, corpse, false );
			item.destroy();
			return;
		}
		tell(mSubject,this,' ',mVerb,'pick',' up ',mObject|mBold,item,'.');
	}

	getAmmoName(ammoType) {
		return ammoType.replace( /\s*is(\S*)\s*/, function(whole,name) {
			return name;
		}).toLowerCase();
	}

	pickAmmo(weapon) {
		if( !weapon.ammoType ) {
			return true;
		}
		let f = new Finder(this.inventory).filter(i=>i[weapon.ammoType] && i.inSlot==Slot.AMMO);
		if( !f.count ) {
			f = new Finder(this.inventory).filter(i=>i[weapon.ammoType] );
			if( !f.count ) {
				if( this.strictAmmo ) {
					return false;
				}
				// In theory we could generate a certain ammot type, if this weapon isn't specifying a particular item type.
				let ammoList = this.lootTake( 'weapon.eInert '+weapon.ammoType, this.level, this, true );
				console.assert(ammoList[0]);
				ammoList[0].breakChance = 100;	// avoid generating heaps of whatever is being used for ammo!
				return ammoList[0];
			}
		}
		return f.first;
	}

	throwItem(item,target) {
		this.lastAttackTargetId = target.id;
		this.inCombat = true;
		item.giveTo(this.map,target.x,target.y);
		if( item.isWeapon && !target.isPosition ) {
			this.generateEffectOnAttack(item);
			this.attack(target,item,true);
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
		if( item.breakChance ) {
			if( Math.chance(item.breakChance) ) {
				item.destroy();
			}
		}
	}

	cast(item,target) {
		this.lastAttackTargetId = target.id;
		this.inCombat = true;
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

		if( !this.shotClear(this.x,this.y,target.x,target.y) ) {
			tell(mSubject,this,' ',mVerb,'has',' no shot!');
			return false;
		}

		this.lastAttackTargetId = target.id;
		this.inCombat = true;
		this.generateEffectOnAttack(item);

		let ammo = this.pickAmmo(item);
		if( ammo == false ) {
			tell(mSubject,this,' ',mVerb,'lack',' any '+this.getAmmoName(item.ammoType)+'s to shoot!');
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
			if( item.rechargeTime ) {
				// HACK! All attacks should REALLY go through .trigger... but they don't yet.
				item.rechargeLeft = item.rechargeTime;
			}
		}
		else {
			ammo.trigger(target,this,this.command);
		}
		if( ammo.id !== item.id && Math.chance(ammo.breakChance) ) {
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

		let bump = function(entity,incCount=true) {
			this.lastBumpedId = entity.id;
			entity.bumpBy = this.id;
			if( incCount ) {
				entity.bumpCount = (entity.bumpCount||0)+1;
			}
			entity.bumpDir = deltasToDirPredictable(entity.x-this.x,entity.y-this.y);
		}.bind(this);


		// Move into monsters
		//-------------------
		let f = this.findAliveOthersAt(x,y);
		let allyToSwap = false;

		// Attack enemies or neutrals
		if( f.count && attackAllowed && (this.isMyEnemy(f.first) || this.isMyNeutral(f.first)) ) {
			weapon = weapon || this.calcDefaultWeapon();
			if( weapon.mayShoot ) {
				return this.shoot(weapon,f.first) ? 'shoot' : 'miss';
			}
			if( weapon.mayCast ) {
				return this.cast(weapon,f.first) ? 'cast' : 'miss';
			}
			if( weapon.mayThrow ) {
				return this.throwItem(weapon,f.first) ? 'throw' : 'miss';
			}
			return this.attack(f.first,weapon,false) ? 'attack' : 'miss';
		}
		else
		// Switch with friends, else bonk!
		if( f.count && !f.first.isMerchant && this.isMyFriend(f.first) && this.isUser() ) {
			// swap places with allies
			allyToSwap = f.first;
		}
		else
		if( f.count ) {
			let entity = f.first;
			console.assert(entity.isMonsterType);
			bump(entity,true);
			(entity.onTouch || bonk)(this,entity);
			return false;
		}

		// If we can not occupy the target tile, then touch it/bonk into it
		let collider = this.findFirstCollider(this.travelMode,x,y,allyToSwap);
		if( collider ) {
			this.lastBumpedId = collider.id;
			if( collider.isTable ) {
				let bx = x + (collider.x-this.x);
				let by = y + (collider.y-this.y);
				let e = this.findAliveOthersAt(bx,by).first;
				if( e ) bump(e,false);
			}
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

		if( this.findAliveOthersAt(x,y).count ) {
			debugger;
		}

		if( this.onMove ) {
			this.onMove.call(this,x,y);
		}

		if( this.brainPicksup ) {
			let f = this.map.findItemAt(x,y).filter( item => item.mayPickup!==false );
			for( let item of f.all ) {
				this.pickup(item);
			}
		}
		return true;
	}

	actOnCommand() {
		if( this.command == Command.BUSY ) {
			console.assert( typeof this.busy.turns == 'number' && !isNaN(this.busy.turns) );
			this.busy.turns--;
			if( this.busy.turns <= 0 ) {
				this.busy.onDone();
				delete this.busy;
			}
			else {
				animFloatUp(this,this.busy.icon);
			}
		}
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
			case Command.ENTERGATE: {
				let gate = this.map.findItemAt(this.x,this.y).filter( gate=>gate.gateDir!==undefined ).first;
				if( gate && gate.toAreaId && gate.toPos ) {
					let area = this.area.world.getAreaById(gate.toAreaId);
					this.gateTo(area,gate.toPos.x,gate.toPos.y);
				}
				break;
			}
			case Command.EXECUTE: {
				let f = this.findAliveOthersNearby().filter( e=>e.id==this.lastBumpedId );
				if( f.first && this.isUser() && f.first.isMerchant ) {
					this.guiViewCreator = { entity: f.first };
				}
				break;
			}
			case Command.EAT: {
				let food = this.commandItem;
				let provider = food.ownerOfRecord;
				console.assert(food && food.isEdible);
				tell(mSubject,this,' ',mVerb,'begin',' to eat ',mObject,food,' (4 turns)');
				food.giveTo(this,this.x,this.y);
				this.busy = {
					turns: 4,
					icon: StickerList.showEat.img,
					description: 'eating',
					onDone: () => {
						if( this.isPet && provider && provider.team==this.team ) {
							this.brainMaster = provider;
							//this.watch = true;
							this.brainPath = true;
							tell(mSubject,this,' ',mVerb,'recognize',' ',mObject|mBold,this.brainMaster,' as ',mObject|mPossessive|mPronoun,this,' new master! ',this.attitude);
						}
						food.destroy();
					}
				};
				this.commandItem = null;
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
				if( !this.senseItems ) {
					this.senseItems = true;
					this.senseLife = true;
				}
				else {
					this.senseItems = false;
					this.senseLife = false;
				}
				this.map.traverse( (x,y) => {
					this.mapMemory[y] = this.mapMemory[y] || {};
					let type = this.map.findItemAt(x,y).filter( item=>!item.isTreasure ).first || this.map.tileTypeGet(x,y);
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
			case Command.BUY: {
				let item = this.commandItem;
				let seller = this.commandTarget;
				console.assert( item.owner && !item.owner.isMap );
				console.assert( seller.id == item.owner.id );
				console.assert( new Finder(seller.inventory).isId(item.id).count );
				let price = new Picker(this.area.depth).pickPrice('buy',item);
				this.coinCount = (this.coinCount||0) - price;
				seller.coinCount = (seller.coinCount||0) + price;
				item.giveTo(this,this.x,this.y);
				break;
			}
			case Command.SELL: {
				let item = this.commandItem;
				let buyer = this.commandTarget;
				let price = new Picker(this.area.depth).pickPrice('sell',item);
				console.assert( new Finder(this.inventory).isId(item.id).count );
				buyer.coinCount = (buyer.coinCount||0) - price;
				this.coinCount = (this.coinCount||0) + price;
				item.giveTo(buyer,buyer.x,buyer.y);
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
			if( this.bumpCount ) {
				// If the user ever isn't adjscent to you, then you must be relieved of bump obligations.
				let f = this.findAliveOthersNearby().isId(this.bumpBy).nearMe(1);
				if( !f.first ) this.bumpCount=0;
			}
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
				if( this.isUser() ) {
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
 				else {
 					this.deathPhrase = [mSubject,this,' ',mVerb,'vanish',' into the pit.'];
 					this.vanish = true;

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

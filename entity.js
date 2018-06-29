//
// ENTITY (monsters, players etc)
//
class Entity {
	constructor(depth,monsterType,inject,jobPickFn) {
		// BALANCE: Notice that monsters are created at LEAST at their native level, and if appearing on
		// a deeper map level then they average their native level and the map's level.
		let isPlayer = monsterType.control==Control.USER;

		// Use the average!
		let level = 	isPlayer ? depth : Math.round( (depth+monsterType.level) / 2 );
		let inits =    { inVoid: true, inventory: [], actionCount: 0, command: Command.NONE, commandLast: Command.NONE, history: [], historyPending: [], tileTypeLast: TileTypeList.floor };
		let values =   { id: GetUniqueEntityId(monsterType.typeId,level) };


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
		if( jobId && !JobTypeList[jobId] ) {
			let jobFilter = jobId;
			jobId = jobPickFn(jobFilter);
			values.jobId = jobId;	// because values has the highest priority.
		}
		let jobData = Object.merge( {}, JobTypeList[jobId], { type:1, typeId:1, baseType:1, level:1, rarity:1, name:1, namePattern:1 } );
		jobData.inventoryLoot = Array.supplyConcat( monsterType.inventoryLoot, inits.inventoryLoot, jobData.inventoryLoot, inject?inject.inventoryLoot:null, values.inventoryLoot );

		Object.assign( this, monsterType, inits, jobData, inject || {}, values );

		this.attitudeBase = this.attitude;

		if( this.name && this.name.indexOf('/')>0 ) {
			this.name = this.name.split('/')[this.pronoun=='she' ? 1 : 0];
		}

		if( this.inventoryLoot ) {
			this.lootTake( this.inventoryLoot, this.level, null, true );
		}
		console.assert( this.inventory.length >= 1 );	// 1 due to the natural melee weapon.

		if( this.inventoryWear ) {
			this.lootTake( this.inventoryWear, this.level, null, true, item => {
				if( this.mayDon(item) ) { this.don(item,item.slot); }
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
	get mapMemory() {
		return this.userControllingMe ? this.userControllingMe.getAreaMap(this.area.id) : null;
	}
	get entityList() {
		return this.area.entityList;
	}

	record(s,pending) {
//		$('<div>'+s+'</div>').prependTo('#guiPathDebug');
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
		console.assert( x!==undefined && y!==undefined );

		if( this.isUser() ) {
			this.userControllingMe.onAreaChange( area );
		}

		let hadNoArea = !this.area;
		this.setPosition(x,y,area);
		let c = this.findFirstCollider(this.travelMode,x,y,this);
		if( c ) {
			[x,y] = this.map.spiralFind( this.x, this.y, (x,y) => !this.findFirstCollider(this.travelMode,x,y,this) );
			console.assert( x!==false );
			this.setPosition(x,y);
		}
		if( Gab && hadNoArea ) {
			Gab.entityPostProcess(this);
		}
		tell(mSubject|mCares,this,' ',mVerb,'are',' now on level '+area.id)
	}

	findAliveOthersNearby(entityList = this.entityList) {
		let list = [];
		for( let e of entityList ) {
			if( !e.isDead() && this.nearTarget(e,MaxVis) && e.id!=this.id ) {
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
	findAliveOthersOrSelfAt(x,y) {
		let entityList = this.entityList;
		for( let e of entityList ) {
			if( !e.isDead() && e.x==x && e.y==y ) {
				return new Finder([e],this,false);
			}
		}
		return new Finder([],this,false);
	}
	findAliveOthers(entityList = this.entityList) {
		return new Finder(entityList,this).excludeMe().isAlive();
	}
	isUser() {
		return this.control == Control.USER;
	}
	die() {
		if( this.dead && this.isUser() ) {
			return;
		}
		if( this.dead ) {
			debugger;
		}
		let deathPhrase = this.deathPhrase;
		if( !deathPhrase ) {
			deathPhrase = [mSubject,this,' ',mVerb,this.vanish?'vanish':'die','!'];
		}
		if( this.brainMaster ) {
			deathPhrase.unshift(mCares,this.brainMaster);
		}
		tell(...deathPhrase);

		if( this.oldMe ) {
			let deed = this.findFirstDeed( deed => deed.op=='possess' );
			deed.end();
		}

		this.dead = true;
		if( this.onDeath ) {
			this.onDeath.call(this,this);
		}

		if( this.dead && this.corpse && !this.vanish ) {
			let mannerOfDeath = Gab.damagePast[this.takenDamageType||DamageType.BITE];
			if( !mannerOfDeath ) {
				debugger;
			}
			this.map.itemCreateByTypeId(this.x,this.y,this.corpse,{},{ usedToBe: this, mannerOfDeath: mannerOfDeath, isCorpse: true } );
		}

		if( this.dead ) {
			spriteDeathCallback(this.spriteList);
		}

		return this.dead;
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
		this.experience -= this.experienceForLevel(this.level+1);
		this.level += 1;
		DeedManager.end( deed => deed.stat && deed.stat=='healthMax' );
		let add = Rules.playerHealth(this.level)-Rules.playerHealth(this.level-1);
		this.healthMax += add;
		this.health = Math.max(this.health+add,this.healthMax);
		tell(mSubject,this,' ',mVerb,'gain',' a level!');

		// happiness flies away from the attacker
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
	mindset(wayOfThinking) {
		return String.arIncludes( this.brainMindset, wayOfThinking );
	}
	able(action) {
		return String.arIncludes( this.brainAbility, action ) && String.arIncludes( this.bodyAbility, action );
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

	isMySuperior(entity) {
		if( entity.isUser() ) {
			// User is superior to all.
			return true;
		}
		if( this.brainMaster && entity.id == this.brainMaster.id ) {
			// you are never superior to your master.
			return false;
		}
		return entity.id > this.id;
	}
	isMyInferior(entity) {
		return !this.isMySuperior(entity);
	}

	isMyPack(entity) {
		if( this.brainMaster ) {
			return entity.id == this.brainMaster.id;
		}
		if( entity.brainMaster ) {
			return entity.brainMaster.id == this.id;
		}
		return this.packId && this.packId == entity.packId;
	}

	isMyEnemy(entity) {
		if( entity.id == this.id ) {
			return false;
		}
		if( this.attitude == Attitude.ENRAGED ) {
			return true;
		}
		if( this.attitude == Attitude.FEARFUL && entity.team !== this.team ) {
			return true;
		}
		if( entity.id == this.personalEnemy ) {
			return true;
		}
		if( (this.brainMaster && entity.id == this.brainMaster.id) || (entity.brainMaster && this.id == entity.brainMaster.id) ) {
			return false;
		}
		if( entity.team == Team.NEUTRAL ) {
			return false;
		}
		return entity.team != this.team;
	}
	isMyFriend(entity) {
		if( entity.id == this.id ) {
			return true;
		}
		if( this.attitude == Attitude.ENRAGED ) {
			return false;
		}
		if( this.attitude == Attitude.FEARFUL && entity.team !== this.team ) {
			return false;
		}
		if( entity.id == this.personalEnemy ) {
			return false;
		}
		if( (this.brainMaster && entity.id == this.brainMaster.id) || (entity.brainMaster && this.id == entity.brainMaster.id) ) {
			return true;
		}
		return entity.team == this.team;
	}
	isMyNeutral(entity) {
		if( entity.id == this.id ) {
			return false;
		}
		if( this.attitude == Attitude.ENRAGED ) {
			return false;
		}
		if( this.attitude == Attitude.FEARFUL && entity.team !== this.team ) {
			return false;
		}
		if( entity.id == this.personalEnemy ) {
			return false;
		}
		if( (this.brainMaster && entity.id == this.brainMaster.id) || (entity.brainMaster && this.id == entity.brainMaster.id) ) {
			return false;
		}
		return this.team != Team.NEUTRAL && entity.team == Team.NEUTRAL;
	}
	healthPercent() {
		return Math.floor((this.health/this.healthMax)*100);
	}

	calcVis() {
		let doVis = false;
		if( this.isUser() ) {
			doVis = true;
		}
		else {
			// Calc vis if I am near the user, that it, I might be interacting with him!
			let user = this.entityList.find( e => e.isUser() );
			doVis = user && this.nearTarget(user,MaxVis);
		}

		if( doVis ) {
			this.visCache = this.area.vis.calcVis(
				this.x,
				this.y,
				this.senseSight!==undefined ? this.senseSight : STANDARD_MONSTER_SIGHT_DISTANCE,
				this.senseBlind,
				this.senseXray,
				this.visCache,
				this.mapMemory
			);
		}
		else {
			this.visCache = null;
		}

		return this.visCache;
	}

	canSeePosition(x,y,area) {
		if( x===undefined || y===undefined ) {
			debugger;
		}
		let visCache = this.visCache;
		if( !visCache ) {
			return this.near( x, y, area, (this.senseSight!==undefined ? this.senseSight : STANDARD_MONSTER_SIGHT_DISTANCE) );
		}
		if( typeof visCache[y]==='undefined' || typeof visCache[y][x]==='undefined' ) {
			return false;
		}
		return visCache[y][x];
	}

	canTargetEntity(entity) {
		if( entity.inVoid ) {
			return false;
		}
		if( entity.isItemType && entity.owner && !entity.owner.isMap ) {
			// WARNING! This is needed so that messages generated during entity init will work
			// properly. That is, x and y are undefined, so we need to rely on who is holding the
			// object.
			return entity.owner.id == this.id;
		}
		// You can always target yourself.
		if( this.id == entity.id ) {
			return true;
		}
		if( entity.area && entity.area.id !== this.area.id ) {
			return false;
		}
		// Magic might be helping you see things
		if( (entity.isMonsterType && this.senseLife) || (entity.isItemType && this.senseItems) ) {
			return true;
		}
//		if( entity.ownerOfRecord ) {
//			entity = entity.ownerOfRecord;
//		}
		let d = this.getDistance(entity.x,entity.y);
		// Adjacent things can be smelled if they stink, or detected with a good sense of smell.
		if( d <= 1 && (entity.stink || (this.senseSmell && !entity.scentReduce)) ) {
			return true;
		}
		// blind can not target
		if( this.senseBlind ) {
			return false;
		}
		// You can't target invisible unless you can see invisible (but see scent above)
		if( entity.invisible && !this.senseInvisible ) {
			return false;
		}
		// Otherwise, you can target an entity in any position you can see.
		return this.canSeePosition(entity.x,entity.y,entity.area);
	}

	canPerceiveEntity(entity) {
		return this.canTargetEntity(entity);
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
		if( item.autoEquip && this.mayDon(item) ) {
			this.don(item,item.slot);
		}
	}

	enemyAtPos(x,y) {
		return this.findAliveOthersAt(x,y).isMyEnemy();
	}

	nearTarget(target,targetDist) {
		console.assert( validCoords(target) );
		if( !this.inArea(target.area) ) {
			return false;
		}
		let dist = this.getDistance(target.x,target.y);
		return dist <= targetDist;
	}

	near(x,y,area,targetDist) {
		if( !this.inArea(area) ) {
			return false;
		}
		let dist = this.getDistance(x,y);
		return dist <= targetDist;
	}



	getDistance(x,y) {
		return Math.max(Math.abs(x-this.x),Math.abs(y-this.y));
	}

	inArea(area) {
		console.assert(area);
		return this.area.id == area.id;		
	}
	isAt(x,y,area) {
		console.assert(area);
		return this.x==x && this.y==y && this.area.id==area.id;
	}
	isAtTarget(target) {
		console.assert(target && target.area);
		return this.isAt(target.x,target.y,target.area);
	}
/*
	at(x,y) {
		let f = this.findAliveOthersAt(x,y);
		return f.first || this.map.tileTypeGet(x,y);
	}

	atDir(x,y,dir) {
		return at(x + DirectionAdd[dir].x, y + DirectionAdd[dir].y);
	}
*/
	findFirstDeed(fn) {
		let found = null;
		DeedManager.traverseDeeds(this,deed => {
			if( fn(deed) ) found = deed;
		});
		return found;
	}
	traverseDeeds(fn) {
		DeedManager.traverseDeeds(this,fn);
	}
	hasDeed(testFn) {
		let found = false;
		DeedManager.traverseDeeds(this,deed => {
			if( testFn(deed) ) found = true;
		});
		return found;
	}
	stripDeeds(testFn) {
		return DeedManager.end( testFn ) > 0;
	}

	dirToBestScent(x,y,targetId) {
		let _bestAge;
		let dir = this.map.dirChoose( x, y, (x,y,bestAge) => {
			let entity = this.map.scentGetEntity(x,y,this.senseSmell);
			if( !entity || entity.id !== targetId ) return false;
			let age = this.map.scentGetAge(x,y);;
			if( bestAge == null || age < bestAge ) {
				_bestAge = age;
				return age;
			}
			return false;
		});
		return [dir,_bestAge];
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
		let curTile = this.map.tileTypeGet(this.inVoid ? x : this.x,this.inVoid ? y : this.y);
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

	thinkApproachTarget(target) {
		return this.thinkApproach(target.x,target.y,target.area,target);
	}

	thinkApproach(x,y,area,target) {
		if( target && target.area.id !== this.area.id ) {
			let gate = new Finder(this.map.itemList,this).filter( gate=>gate.toAreaId==target.area.id ).closestToMe().first;
			if( !gate ) {
				// This only happens if the target teleported and left no gate behind.
				return Command.WAIT;
			}
			x = gate.x;
			y = gate.y;
			target = gate;
			if( this.isAtTarget(gate) ) {
				this.commandItem = gate;
				return Command.ENTERGATE;
			}
		}

		if( this.brainMaster && !this.brainPath ) { debugger; }

		let DEBUG_ALL_USE_PATH = true;
		if( this.brainPath || DEBUG_ALL_USE_PATH ) {

			let stallSet = (toggle) => {
				if( !toggle ) {
					this.stall = 0;
					return;
				}
				this.stall = (this.stall || 0) + 1;
				if( target && target.isDestination && this.stall > (target.stallLimit || 5) ) {
					if( this.path && this.path.leadsTo(target.x,target.y) ) {
						delete this.path;
					}
					delete this.destination;
				}
				if( target && target.isLEP && this.stall > (target.stallLimit || 5) ) {
					if( this.path && this.path.leadsTo(target.x,target.y) ) {
						delete this.path;
					}
					delete this.lastEnemyPosition;
				}
			}

			if( !this.path || !this.path.success || !this.path.leadsTo(x,y) || !this.path.stillOnIt(this.x,this.y) ) {
				// How hard should we try to get certain places? 
				let distLimit = 10 + this.getDistance(x,y)*3;

				this.path = new Path(this.map,distLimit);
				let closeEnough = !target ? 0 : (target.isLEP ? 0 : (target.isMonsterType ? 1 : (target.isDestination ? target.closeEnough||0 : 0)));
				let success = this.path.findPath(this,this.x,this.y,x,y,closeEnough);
				if( success ) {
					this.record( "Pathing "+this.path.path[0]+" from ("+this.x+','+this.y+') to reach ('+x+','+y+')', target ? target.id : '' );
					stallSet(false);
				}
				else {
					this.record( JSON.stringify( this.path.status ) );
					this.record( "Pathing FAIL from ("+this.x+','+this.y+') to reach ('+x+','+y+')', target ? target.id : '' );
					stallSet(true);
				}
			}
			if( this.path && this.path.success ) {
				let dir = this.path.getDirFrom(this.x,this.y);
				console.assert( dir !== false );
				if( !this.mayGo(dir,this.problemTolerance()) ) {
					stallSet(true);
				}
				this.lastDirAttempt = dir;
				return directionToCommand(dir);
			}
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

	thinkStumbleF(chanceToNotMove=50) {
		let wait = Math.chance(chanceToNotMove);
		this.record('stumble'+(wait?' wait':''), true);
		if( wait ) return Command.WAIT;
		const RandCommand = [Command.N, Command.NE, Command.E, Command.SE, Command.S, Command.SW, Command.W, Command.NW];
		return RandCommand[Math.randInt(0,RandCommand.length)];
	}

	thinkTetherReturn(tetherMagnet=70) {
		let returnChance = this.beyondTether() ? tetherMagnet : ( !this.isAtTarget(this.origin) ? tetherMagnet/2 : 0 );
		if( Math.chance(returnChance) ) {
			this.record('wander return', true);
			let c = this.thinkApproachTarget(this.origin);
			if( c ) return c;
		}
		return false;
	}

	thinkWanderF(avgPause=7,avgWanderDist=8,tetherMagnet=70) {
		if( this.commandLast == Command.WAIT && Math.chance(100/avgPause) ) {
			this.record('wander pause', true);
			return Command.WAIT;
		}

		if( this.tether ) {
			let c = this.thinkTetherReturn(tetherMagnet);
			if( c ) return c;
		}

		let dirLast = commandToDirection(this.commandLast);
		if( dirLast !== false ) {
			if( Math.chance(100/avgWanderDist) && this.mayGo(dirLast,this.problemTolerance()) ) {
				this.record('wander forward',true);
				return this.commandLast;
			}
			return Command.WAIT;
		}

		let reps = 4;
		do {
			let dir = Math.randInt(0,8);
			if( this.mayGo(dir,this.problemTolerance()) ) {
				return directionToCommand(dir);
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
				this.record( 'fleeing', true );
				console.assert( dir>=0 && dir < 8 );
				return directionToCommand(dir);
			}
		}
		this.record( 'unable to retreat '+dirAwayPerfect, true );
		return false;
	}

	thinkPackToSuperior(howClose=2) {
		// When hurt, your pet will run towards you. Once within 2 it will flee its enemies, but still stay within 2 of you.	
		let pack = this.findAliveOthersNearby().isMyPack().isMySuperior().farFromMe(howClose).byDistanceFromMe().first;
		if( pack ) {
			this.record('back to superior pack member',true);
			return this.thinkApproachTarget(pack);
		}
		return false;
	}


	thinkFlee(enemy) {
		let dirAwayPerfect = (this.dirToEntityNatural(enemy)+4)%DirectionCount;
		let dirLeft = (dirAwayPerfect+8-1)%DirectionCount;
		let dirRight = (dirAwayPerfect+1)%DirectionCount;

		// Generally try to flee towards your friends, if they exist and are in a valid flee direction.
		if( this.brainMaster || this.mindset('pack') ) {
			let f = this.findAliveOthersNearby().isMyFriend();
			let friend;
			if( this.brainMaster && f.isId(this.brainMaster.id) ) {
				friend = this.brainMaster;
			}
			else {
				friend = f.farFromMe(1).byDistanceFromMe().first;
			}
			if( friend ) {
				// Go towards your master or pack animal if possible.
				let dirToFriend = this.dirToEntityPredictable(friend);
				if( dirToFriend == dirAwayPerfect || dirToFriend == dirLeft || dirToFriend == dirRight ) {
					return this.thinkApproachTarget(friend);
				}
			}
		}

		return this.thinkRetreat(dirAwayPerfect);
	}

	thinkAwaitF() {
		if( !this.beyondOrigin() ) {
			return Command.WAIT;
		}
		let c = this.thinkApproachTarget(this.origin);
		return c || Command.WAIT;
	}


	thinkWorshipF(enemyDist) {
		if( this.beyondOrigin() ) {
			let c = this.thinkApproachTarget(this.origin);
			if( c ) return c;
		}
		return Command.PRAY;
	}

	thinkStayNear(friend) {
		this.record('stay near '+friend.id,true);
		return this.thinkApproachTarget(friend);
	}

	thinkBumpF() {
		// The player is bumping into me, trying to get me to move.
		let c = this.thinkRetreat(this.bumpDir);
		if( c ) {
			this.record( 'retreat from bumper ', true );
			return c;
		}
		this.record( 'wander from bumper ', true );
		return this.thinkWanderF();
	}

	thinkHunger(foodDist=2) {
		let foodList = new Finder(this.map.itemList,this).filter(item=>item.isEdible).canPerceiveEntity().nearMe(foodDist).byDistanceFromMe();
		if( foodList.first && this.isAtTarget(foodList.first) ) {
			this.record('found some food. eating.',true);
			this.commandItem = foodList.first;
			return Command.EAT;
		}
		if( foodList.first ) {
			this.record('head towards food',true);
			return this.thinkApproachTarget(foodList.first);
		}
		return false;
	}

	thinkGreedy() {
		let greedField = this.greedField || 'isGem';
		let greedDist = this.greedDist || (this.senseSight!==undefined ? this.senseSight : STANDARD_MONSTER_SIGHT_DISTANCE);
		let desire = new Finder(this.map.itemList,this).nearMe(greedDist).filter( item=>item[greedField] ).byDistanceFromMe().first;
		if( !desire && this.destination && this.destination.isGreed ) {
			delete this.destination;
		}
		if( desire ) {
			if( this.isAtTarget(desire) ) {
				this.commandItem = desire;
				return desire.isEdible || desire.isCorpse ? Command.EAT : Command.PICKUP;
			}
			if( !this.destination || !desire.isAtTarget(this.destination) ) {
				this.destination = {
					isDestination: true,
					isGreed: true,
					area: desire.area,
					x: desire.x,
					y: desire.y,
					site: null,
					closeEnough: 0,
					stallLimit: 2,
					name: desire.name,
					id: 'DEST.'+desire.name+'.'+GetTimeBasedUid()
				};
			}
			return this.thinkApproachTarget(this.destination);
		}
		return false;
	}

	beyondTether() {
		return this.tether && !this.nearTarget(this.origin,this.tether);
	}
	beyondOrigin() {
		return !this.isAtTarget(this.origin);
	}

	setDestination(x,y,area,closeEnough,stallLimit,name,site) {
		let destination = {
			isDestination: true,
			area: area,
			x: x,
			y: y,
			site: site,
			closeEnough: closeEnough,
			stallLimit: stallLimit,
			name: name || 'desination '+(site ? site.id : '')+' ('+x+','+y+')',
			id: 'DEST.'+(site ? site.id : GetTimeBasedUid())
		};
		return destination;
	}

	pickRandomDestination() {
		let area = this.area;
		let safeSpot = pVerySafe(this.map);
		let site,x,y;
		do {
			// Doing it this way means that the smaller places get visited, which seldom happens if you just
			// pick a random map location.
			site = this.area.pickSite( site => site.isRoom || site.isPlace );
			console.assert( site.marks.length > 0 );
			let i = Math.randInt(0,site.marks.length/2) * 2;
			x = site.marks[i+0];
			y = site.marks[i+1];
		} while( !safeSpot(x,y) );
		let destination = {
			isDestination: true,
			area: area,
			x: x,
			y: y,
			site: site,
			closeEnough: 2,
			stallLimit: 4,
			name: 'desination '+(site ? site.id : '')+' ('+x+','+y+')',
			id: 'DEST.'+(site ? site.id : GetTimeBasedUid())
		};
		this.record( 'New dest '+site.id+' ('+x+','+y+')' );
		return destination;
	}

	findSparsePack() {
		let packHash = {};
		let packSize = this.packSize || 4;
		let f = new Finder(this.entityList).filter( e => e.typeId == this.typeId && e.packId ).process( e => {
			packHash[e.packId] = (packHash[e.packId]||0)+1;
		});
		let sparseHash = Object.filter( packHash, size => size<packSize );
		if( Object.isEmpty(sparseHash) ) {
			return 'pack.'+GetTimeBasedUid();
		}
		let packId = Object.keys(sparseHash)[0];
		return packId;
	}

	think() {
		if( this.isDead() ) {
			return;
		}
		if( this.typeId == 'demonHound' ) {
			this.watch=1;
		}

		let useAiTemporarily = false;
		if( this.control == Control.USER ) {
			// Placeholder, since the onPlayerKey already sets the command for us
			if( this.loseTurn || this.attitude == Attitude.CONFUSED || this.attitude == Attitude.ENRAGED || this.attitude == Attitude.PANICKED ) {
				useAiTemporarily = true;
			}
			if( !useAiTemporarily && this.command == Command.WAIT ) {
				let gate = this.map.findItemAt(this.x,this.y).filter( item => item.gateDir!==undefined ).first;
				if( gate ) {
					this.command = Command.ENTERGATE;
					this.commandItem = gate;
				}
			}
		}

		if( this.control == Control.EMPTY ) {
			this.command = Command.LOSETURN;
		}

		if( this.control == Control.AI || useAiTemporarily ) {
			this.command = (function() {

				if( this.typeId == window.debugEntity ) debugger;

				if( this.loseTurn ) {
					this.record('loseTurn',true);
					return Command.LOSETURN;
				}

				// Hard to say whether this should take priority over .busy, but it is pretty important.
				if( this.bumpCount >=2 ) {
					return this.thinkBumpF();
				}

				if( this.busy ) {
					return Command.BUSY;
				}

				if( this.mindset('pack') && !this.packId ) {
					this.packId = this.findSparsePack();
				}

				// Note that attitude enraged makes isMyEnemy() return true for all creatures.
				let enemyList = this.findAliveOthersNearby().canPerceiveEntity().isMyEnemy().byDistanceFromMe();

				if( this.mindset('lep') && enemyList.count ) {
					let e = enemyList.first;
					this.record('set lep ('+e.x+','+e.y+')',true);
					this.lastEnemyPosition = { isLEP: true, x:e.x, y:e.y, area:e.map.area, entity: e, name: e.name };
				}
				if( this.lastEnemyPosition && this.lastEnemyPosition.entity.isDead() ) {
					delete this.lastEnemyPosition;
				}

				let wasSmell = false;
				if( !enemyList.count && this.senseSmell ) {
					let smelled = this.map.scentGetEntity(this.x,this.y,this.senseSmell,this.id);
					if( smelled && this.isMyEnemy(smelled) ) {
						if( !this.lastScent || this.lastScent.id != smelled.id || Math.chance(5) ) {
							tell('<b>',mSubject|mCares,smelled,' ',mVerb,'hear',' ',mA|mObject,this,' howling!','</b>');
						}
						// This migth be a mistake, perhaps, and instead we should be finding dirToBestScent
						// and storing that position...
						enemyList.prepend(smelled);
						wasSmell = true;
						this.lastScent = smelled;
					}
				}
				// Keep pursuing and check the lep if it is closer than any other enemy. My target might have
				// simply vanished around a corner.
				let wasLEP = false;
				let lep = this.lastEnemyPosition;
				if( lep ) {
					this.record('me=('+this.x+','+this.y+') lep=('+lep.x+','+lep.y+')',true);
				}
				if( lep && !wasSmell && (!enemyList.count || this.getDistance(lep.x,lep.y) < this.getDistance(enemyList.first.x,enemyList.first.y)) ) {
					if( !this.isAtTarget(lep) ) {
						this.record('prepend lep',true);
						enemyList.prepend(lep);
						wasLEP = true;
					}
					else {
						this.record('on the lep!',true);
					}
				}

				if( lep && this.isAtTarget(lep) ) {
					this.record('at lep ('+lep.x+','+lep.y+')',true);
					let gate = this.map.findItemAt(this.x,this.y).filter( item=>item.isGate ).first;
					if( gate ) {
						this.record('enter gate',true);
						this.commandItem = gate;
						return Command.ENTERGATE;
					}
				}

				let theEnemy = enemyList.first;
				let personalEnemy = enemyList.includesId(this.personalEnemy);
				let distanceToNearestEnemy = enemyList.count ? this.getDistance(theEnemy.x,theEnemy.y) : false;
				let hurt = this.healthPercent()<30;

				if( this.attitude == Attitude.CONFUSED ) {
					return this.thinkStumbleF(50);
				}

				if( this.attitude == Attitude.PANICKED ) {
					let dirAway = (this.dirToEntityNatural(theEnemy)+4)%DirectionCount;
					return this.thinkRetreat(dirAway,true) || this.thinkWanderF();
				}

				if( this.attitude == Attitude.ENRAGED ) {
					if( theEnemy ) return this.thinkApproachTarget(theEnemy);
					return this.thinkWanderF();
				}

				if( !personalEnemy && this.personalEnemy && this.attitude == Attitude.AGGRESSIVE ) {
					// Give up on my personal enemy if it exits my perception.
					this.personalEnemy = null;
				}

				// OK, now all the mind control stuff is done, we need to manage our attitude a little.
				let tooClose = theEnemy && !wasSmell && !wasLEP && distanceToNearestEnemy <= (this.tooClose||4);

				let farFromMaster = this.brainMaster && (
					(this.brainMaster.area.id!==this.area.id) ||
					(enemyList.count<=0 && !this.nearTarget(this.brainMaster,2) )
				);

				let flee = theEnemy && (
					( hurt && (this.mindset('fleeWhenHurt') || this.mindset('pack')) ) ||
					(this.attitude == Attitude.FEARFUL) ||
					(this.attitude == Attitude.HESITANT && Math.chance(40))
				);
				flee = flee || (personalEnemy && this.mindset('fleeWhenAttacked'))

				let packWhenNotThreatened = this.mindset('pack') && !enemyList.count;

				let pauseBesideUser = !enemyList.count && this.team==Team.GOOD && this.findAliveOthersNearby().nearMe(1).filter( e=>e.isUser() ).count;

				let hungry = this.mindset('ravenous') || (this.isAnimal && (!theEnemy || distanceToNearestEnemy>4));

				let isDefensive = this.team == Team.NEUTRAL || this.mindset('fleeWhenAttacked') || this.attitude == Attitude.FEARFUL;
				let isAggressor = !isDefensive && this.team !== Team.NEUTRAL && !this.mindset('fleeWhenAttacked') && this.attitude!==Attitude.FEARFUL;

				if( tooClose && isDefensive ) {
					// Maybe if you've hit it...
					//this.changeAttitude( Attitude.FEARFUL );
				}

				if( tooClose && isAggressor ) {
					if( this.attitude!==Attitude.AGGRESSIVE ) {
						this.record( 'enemy too close! Go aggressive.', true );
						if( this.attacker !== Attitude.HUNT || this.attitude !== Attitude.PATROL ) {
							tell(mCares,theEnemy,mSubject,this,' ',mVerb,'think',' ',mObject,theEnemy,' ',mVerb|mObject,'is',' too close!');
						}
						animAbove(this,StickerList.alert.img,0);
						this.changeAttitude( Attitude.AGGRESSIVE );
					}
				}

				if( !theEnemy && this.attitude!==this.attitudeBase ) {
					// Revert to preferred behavior once enemies are gone.
					this.changeAttitude( this.attitudeBase );
				}

				if( this.attitude == Attitude.HUNT && this.tether ) {
					delete this.tether;
				}

				if( this.mindset('greedy') ) {
					let c = this.thinkGreedy();
					if( c ) return c;
				}

				if( flee ) {
					let c = this.thinkFlee(theEnemy);
					if( c ) return c;
				}

				if( farFromMaster ) {
					let c = this.thinkStayNear(this.brainMaster);
					if( c ) return c;
				}

				if( hungry  ) {
					let c = this.thinkHunger( this.mindset('ravenous') ? 5 : 2 );
					if( c ) return c;
				}

				if( pauseBesideUser ) {
					return Command.WAIT;
				} 

				if( this.attitude == Attitude.WORSHIP ) {
					let c = this.thinkWorshipF();
					if( c ) return c;
				}

				if( this.attitude == Attitude.AWAIT ) {
					return this.thinkAwaitF();
				}

				if( packWhenNotThreatened && !this.tether ) {
					let c = this.thinkPackToSuperior();
					if( c ) return c;
				}

				// WANDER
				if( this.attitude == Attitude.WANDER ) {
					return this.thinkWanderF();
				}

				if( this.attitude == Attitude.HUNT && !theEnemy ) {
					if( !this.destination ) {
						this.destination = this.pickRandomDestination();
					}
					if( this.isAtTarget(this.destination) ) {
						debugger;
						delete this.destination;
						return Command.WAIT;
					}
					let c = this.thinkApproachTarget(this.destination);
					if( c ) return c;
				}

				// If no enemy to attack or flee, then just wander around 
				if( !enemyList.count ) {
					this.record('no enemy',true);
					return this.thinkWanderF();
				}

				if( this.team == Team.NEUTRAL ) {
					// neutral things just don't attack. If they aren't fleeing, they just hang out.
					// to them, and "enemy" is something to avoid.
					return this.thinkWanderF();
				}

				if( wasLEP ) {
					// We do get to simply approach the last known positon of our enemy, and see
					// what we can see from there. But of course we can't attack it.
					let c = this.thinkApproachTarget(theEnemy);
					return c || this.thinkWanderF();
				}

				// AGGRESSIVE
				// Attack if I am within reach, and aggressive or sometimes if hesitant
				let weapon = this.calcBestWeapon(enemyList.first);
				let distLimit = weapon.reach || weapon.range || 1;
				let inRange = new Finder(enemyList.all,this).nearMe(distLimit);
				if( inRange.count ) {
					let target = personalEnemy && inRange.includesId(personalEnemy.id) ? personalEnemy : inRange.first;	// For now, always just attack closest.
					this.record('attack '+target.name+' with '+(weapon.name || weapon.typeId),true);
					this.commandItem = weapon;
					this.commandTarget = target;
					let temp = this.itemToAttackCommand(weapon);
					if( temp !== Command.ATTACK ) {
						return temp;
					}
					return directionToCommand(this.dirToEntityPredictable(target));
				}

//				if( this.beyondTether() && !this.brainDisengageFailed ) {
//					let c = this.thinkApproachTarget(this.origin);
//					if( c ) {
//						this.brainDisengageAttempt = true;
//						return c;
//					}
//				}

				if( wasSmell ) {
					// We are heading towards our enemy due to smell.
					let dir,age;
					[dir,age] = this.dirToBestScent(this.x,this.y,theEnemy.id);
					let ageHere = this.map.scentGetAge(this.x,this.y);
					// We hit a dead end of scent... We want to generally invalidate it.
					// This will cause us to run back up the scent trail, invalidating it as we go.
					if( age > ageHere ) {
						this.map.scentIncAge(this.x,this.y,this.senseSmell);
					}
					if( dir !== false && this.mayGo(dir,this.problemTolerance()) ) {
						return directionToCommand(dir);
					}
					// We don't get to use regular pathfind because we found it through smell.
					return this.thinkWanderF();
				}

				let c = this.thinkApproachTarget(theEnemy);
				if( c ) {
					return c;
				}
				return this.thinkWanderF();

			}).apply(this);			

			if( this.command == undefined ) debugger;
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
		if( this.packId ) {
			friendList.isMyPack();
		}
		let numAlerted = 0;
		let self=this;
		friendList.process( entity => {
			if( entity.attitude == Attitude.WANDER || entity.attitude == Attitude.AWAIT ) {
				entity.changeAttitude(Attitude.AGGRESSIVE);
				if( tellAbout && !numAlerted && this.able('talk') ) {
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
//			if( attacker.team == Team.NEUTRAL || this.team == Team.NEUTRAL ) debugger;
			// Remember that neutrals with brainFleeCombat DO want a personal enemy, not to attack, but to flee from.
			this.personalEnemy = attacker.id;
			// Stop remembering anyone else, because normally you target the lep if it is closer. So for example
			// the player could distract an enemy from their dog by attacking.
			delete this.lastEnemyPosition;
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
			let arc = attacker ? 45 : 179;
			let piecesAnim = new Anim({},{
				follow: 	this,
				img: 		StickerList[this.bloodId || 'bloodRed'].img,
				delay: 		delay,
				duration: 	0.2,
				onInit: 		a => { a.create(4+Math.floor(7*mag)); },
				onSpriteMake: 	s => { s.sScaleSet(0.20+0.10*mag).sVel(Math.rand(deg-arc,deg+arc),4+Math.rand(0,3+7*mag)); },
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
			if( this.mindset('alert') ) {
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
					let fireEffect = Math.chance(item.chanceOfEffect || 100);
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
			return false;
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
		let distanceRemaining = distance;
		while( success && distanceRemaining-- ) {
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
			areaId: 	this.area.id,		
			delay: 		source.rangeDuration || 0,
			duration: 	duration,
			onInit: 		a => { a.puppet(this.spriteList); },
			onSpriteMake: 	s => { s.sReset().sVelTo(ddx,ddy,duration); },
			onSpriteTick: 	s => { s.sMove(s.xVel,s.yVel); }
		});
		return distance>0;
	}

	takeTeleport(source,item) {
		let safeSpot = pVerySafe(this.map);
		let pos = this.map.pickPosBy(1,1,1,1,safeSpot);
		if( pos !== false ) {
			this.moveTo(pos[0],pos[1]);
		}
		return pos !== false;
	}

	takeBePossessed(effect,toggle) {
		let fieldsToTransfer = { control:1, name:1, team:1, brainMindset: 1, brainAbility: 1, visCache: 1, experience: 1, isChosenOne: 1, strictAmmo: true };

		let source = effect.source;
		console.assert(source);
		if( !toggle ) {
			console.assert( source.isPossessing );
			if( this.userControllingMe ) {
				this.userControllingMe.takeControlOf(source);
			}
			Object.copySelected( source, this, fieldsToTransfer );
			Object.copySelected( this, this.oldMe, fieldsToTransfer );
			delete this.oldMe;
			source.isPossessing = false;
			tell(mSubject,source,' ',mVerb,'leave',' the mind of ',mObject,this,'.');
			if( source.isUser() ) {
				guiMessage(null,'resetMiniMap',source.area);
			}
			return true;
		}
		if( this.isMindless || this.isUndead || source.id == this.id || source.isPossessing || this.oldMe ) {
			tell(mSubject,this,' ',mVerb,'is',' impossible to possess!');
			return false;
		}
		tell(mSubject,source,' ',mVerb,'enter',' the mind of ',mObject,this,'.');
		this.oldMe = Object.copySelected( {}, this, fieldsToTransfer );
		Object.copySelected( this, source, fieldsToTransfer );
		if( source.userControllingMe ) {
			source.userControllingMe.takeControlOf(this);
		}
		source.isPossessing = true;
		source.control = Control.EMPTY;
		source.visCache = null;
		source.name = 'Mindless husk';
		if( this.isUser() ) {
			guiMessage(null,'resetMiniMap',this.area);
		}
		return true;
	}

	itemToAttackCommand(weapon) {
		if( weapon.mayThrow && (!weapon.inSlot || weapon.inSlot==Slot.AMMO) ) {
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
		// Exclude any weapon that I can not personally use
		weaponList.filter( item => {
			if( item.mayCast && !this.able('cast') ) return false;
			if( item.mayThrow && !this.able('throw') ) return false;
			if( item.mayShoot && !this.able('shoot') ) return false;
			if( item.mayGaze && !this.able('gaze') ) return false;
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
			if( !this.senseLife && Math.chance(50) ) {
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
			let fireWeaponEffect = Math.chance(weapon.chanceOfEffect || 100);
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
		let inventoryTemp = inventory.slice();	// because the inventory could chage out from under us!
		Object.each( inventoryTemp, item => {
			if( !item.isTreasure && !item.isNatural ) debugger;
			item.giveTo( this, this.x, this.y);
			if( onEach ) { onEach(item); }
			found.push(mObject|mA|mList|mBold,item);
		});
		if( !quiet && !this.inVoid ) {
			let description = [
				mSubject,this,' ',mVerb,'find',' '
			].concat( 
				found.length ? found : ['nothing'],
				originatingEntity ? [' ',originatingEntity.isItemType?'in':'on',' ',mObject,originatingEntity] : [''],
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

		if( !this.able('pickup') ) {
			tell(mSubject,this,' ',mVerb,'attempt',' to pick something up, but can not!');
			return;
		}

		if( item.onPickup ) {
			let allow = item.onPickup(this);
			if( !allow ) return false;
		}

		item.giveTo(this,this.x,this.y);
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
			return true;
		}
		tell(mSubject,this,' ',mVerb,'pick',' up ',mObject|mBold,item,'.');
		return true;
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
				// Ammo auto-generation
				// The ammoSpec is used to generate the exact right type of ammo.
				let ammoList = this.lootTake( weapon.ammoSpec, this.level, this, true );
				console.assert(ammoList[0]);
				ammoList[0].breakChance = 100;	// avoid generating heaps of whatever is being used for ammo!
				return ammoList[0];
			}
		}
		return f.first;
	}

	throwItem(item,target) {
		if( !this.able('throw') ) {
			tell(mSubject,this,' ',mVerb,'attempt',' to throw, but can not!');
			return;
		}

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

	gaze(item) {
		if( !this.able('gaze') ) {
			tell(mSubject,this,' ',mVerb,'attempt',' to gaze, but can not!');
			return;
		}
		this.shieldBonus = 'stand';
		item.x = this.x;
		item.y = this.y;
		let shatter = Math.chance(33);
		tell(mSubject,this,' ',mVerb,'gaze',' into ',mObject,item,'.'+(shatter ? ' It shatters!' : ''));
		item.trigger(this,this,this.command);
		if( shatter ) { item.destroy(); }
	}

	cast(item,target) {
		if( !this.able('cast') ) {
			tell(mSubject,this,' ',mVerb,'attempt',' to cast, but can not!');
			return;
		}
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

		if( !this.able('shoot') ) {
			tell(mSubject,this,' ',mVerb,'attempt',' to shoot, but can not!');
			return;
		}

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

	eat(food) {
		let provider = food.ownerOfRecord;
		console.assert(food && (food.isEdible || food.isCorpse));
		tell(mSubject,this,' ',mVerb,'begin',' to eat ',mObject,food,' (4 turns)');
		food.giveTo(this,this.x,this.y);
		this.busy = {
			turns: 4,
			icon: StickerList.showEat.img,
			description: 'eating',
			onDone: () => {
				if( food.isCorpse ) {
					let corpse = food.usedToBe;
					let inventory = new Finder(corpse.inventory).isReal().all || [];
					inventory.push( ...this.lootGenerate( corpse.loot, corpse.level ) )
					this.inventoryTake( inventory, corpse, false );
					food.destroy();
					return;
				}
				if( !food.isCorpse && food.isEdible && this.isPet && provider && provider.team==this.team ) {
					this.brainMaster = provider;
					//this.watch = true;
					this.brainPath = true;
					tell(mSubject,this,' ',mVerb,'recognize',' ',mObject|mBold,this.brainMaster,' as ',mObject|mPossessive|mPronoun,this,' new master! ',this.attitude);
				}
				if( this.eatenFoodToInventory ) {
				}
				else {
					food.destroy();
				}
			}
		};
	}

	setPosition(x,y,area) {
		if( !area ) {
			area = this.area;
		}

		if( this.isAt(x,y,area) ) {
			return;
		}

		if( !this.inVoid ) {
			this.tileTypeLast = this.map.tileTypeGet(this.x,this.y);
			console.assert( this.tileTypeLast );
			console.assert( this.x !== undefined );
			this.map.scentLeave(this.x,this.y,this,this.scentReduce||0); // Only leave scent where you WERE, so you can sell it where you ARE.
			this.map._entityRemove(this);
			this.map.calcWalkable(this.x,this.y);	// NUANCE: must be after the entityRemove!
		}
		if( this.inVoid ) {
			console.assert( area );
			this.origin = {
				x: x,
				y: y,
				area: area,
				isPosition: true,
				name: 'origin'
			};
			this.inVoid = false;
		}
		this.x = x;
		this.y = y;
		if( !this.area || this.area.id !== area.id ) {
			if( this.area ) {
				// DANGER! Doing this while within a loop across the entityList will result in pain!
				Array.filterInPlace( this.area.entityList, entity => entity.id!=this.id );
			}
			this.area = area;
			let fnName = this.isUser() ? 'unshift' : 'push';
			this.area.entityList[fnName](this);
		}

		this.map._entityInsert(this);
		this.map.calcWalkable(this.x,this.y);	// NUANCE: must be after the entityInsert!
		// This just makes sure that items have coordinates, for when they're the root of things.
		this.inventory.forEach( item => { item.x=x; item.y=y; } );

		let dest = this.destination;
		if( dest ) {
			let dist = this.getDistance(dest.x,dest.y);
			if( dist <= (dest.closeEnough||3) ) {
				this.record( "ARRIVED", true );
				if( dest.onReached ) {
					dest.onReached.call(this);
				}
				delete this.destination;
			}
		}
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
			if( !this.isUser() ) {
				// The bump system interferese with pathfind's inferior.superior system, so only let
				// the user do it.
				return;
			}
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

		let wantToAttack = this.isMyEnemy(f.first);
		if( this.isUser() && this.isMyNeutral(f.first) ) {
			wantToAttack = true;
		}
		if( this.team == Team.NEUTRAL || this.mindset('fleeWhenAttacked') ) {
			wantToAttack = false;
		}

		if( f.count && attackAllowed && wantToAttack ) {
			weapon = weapon || this.calcDefaultWeapon();
			if( weapon.mayShoot ) {
				return this.shoot(weapon,f.first) ? 'shoot' : 'miss';
			}
			if( weapon.mayCast ) {
				return this.cast(weapon,f.first) ? 'cast' : 'miss';
			}
			if( weapon.mayThrow && (!weapon.inSlot || weapon.inSlot==Slot.AMMO) ) {
				return this.throwItem(weapon,f.first) ? 'throw' : 'miss';
			}
			return this.attack(f.first,weapon,false) ? 'attack' : 'miss';
		}
		else
		// Switch with friends, else bonk!				// used to be isMyFriend()
		if( f.count && (!this.isUser() || !f.first.isMerchant) && !this.isMyEnemy(f.first) && this.isMyInferior(f.first) ) {
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
			console.log( this.name+" ally swap with "+allyToSwap.name );
			allyToSwap.setPosition(this.x,this.y);
		}

		//=======================
		// ACTUAL MOVEMENT OF THE MONSTER
		//=======================
		this.setPosition(x,y);

		if( this.findAliveOthersAt(x,y).count ) {
			debugger;
		}

		if( this.onMove ) {
			this.onMove.call(this,x,y,xOld,yOld);
		}

		if( this.mindset('pickup') && this.able('pickup') ) {
			let f = this.map.findItemAt(x,y).filter( item => item.mayPickup!==false );
			for( let item of f.all ) {
				this.pickup(item);
			}
		}
		return true;
	}

	actOnCommand() {
		if( this.command == undefined ) debugger;
		if( this.command == Command.BUSY ) {
			console.assert( this.busy.turns === true || (typeof this.busy.turns == 'number' && !isNaN(this.busy.turns)) );
			if( typeof this.busy.turns == 'number' ) {
				this.busy.turns--;
				if( this.busy.turns <= 0 ) {
					this.busy.onDone();
					delete this.busy;
				}
			}
			if( this.busy && this.busy.icon ) {
				animFloatUp(this,this.busy.icon);
			}
		}
		switch( this.command ) {
			case Command.LOSETURN: {
				if( this.control !== Control.EMPTY ) {
					tell(mSubject|mCares,this,' ',mVerb,'spend', ' time recovering.');
				}
				this.loseTurn = false;
				break;
			}
			case Command.WAIT: {
				this.shieldBonus = 'stand';
				tell(mSubject|mCares,this,' ',mVerb,'wait','.');
				break;
			}
			case Command.ENTERGATE: {
				let world = this.area.world;
				let gate = this.map.findItemAt(this.x,this.y).filter( gate=>gate.gateDir!==undefined ).first;
				if( gate ) {
					tell(mSubject,this,' ',mVerb,gate.useVerb || 'teleport',' ',mObject,gate);
					world.linkGatesAndCreateArea(gate);
					console.assert(gate.toAreaId && gate.toPos );
					let newArea = world.getAreaById(gate.toAreaId);
					console.assert(newArea);

					this.gateTo( newArea, gate.toPos.x, gate.toPos.y);

					if( gate.killMeWhenDone ) {
						gate.destroy();
					}
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
				this.eat(this.commandItem);
				this.commandItem = null;
				break;
			}
			case Command.PICKUP: {
				this.pickup(this.commandItem);
				break;
			}
			case Command.DEBUGTEST: {
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
					let mapMemory = this.mapMemory;
					if( mapMemory ) {
						let type = this.map.findItemAt(x,y).filter( item=>!item.isTreasure ).first || this.map.tileTypeGet(x,y);
						let mPos = y*this.map.xLen+x;
						mapMemory[mPos] = type;
					}
				});
				break;
			}
			case Command.DEBUGANIM: {
				let entity = this;
				let anim = new Anim({},{
					at: 		entity,
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
				this.gaze(this.commandItem);
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
				if( item.slot && this.bodySlots ) {
					if( !this.bodySlots[item.slot] ) {
						tell( mSubject,this,' ',mVerb,'has',' no way to use the ',mObject,item );
					}
					else {
						while( this.getItemsInSlot(item.slot).count >= this.bodySlots[item.slot] ) {
							let itemToRemove = this.getItemsInSlot(item.slot);
							this.doff(itemToRemove.first);
						}
						this.don(item,item.slot);
					}
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
				if( price <= this.coinCount ) {
					this.coinCount = (this.coinCount||0) - price;
					seller.coinCount = (seller.coinCount||0) + price;
					item.giveTo(this,this.x,this.y);
				}
				else {
					tell(mSubject,this,' ',mVerb,'do',' not have enough coin.');
				}
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
	mayDon(item) {
		return item.slot && this.bodySlots && this.bodySlots[item.slot] && this.getItemsInSlot(item.slot).count < this.bodySlots[item.slot];
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
				this.health = Math.clamp(this.health+this.regenerate*this.healthMax,0.0,this.healthMax);
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
			let mayJump = tileType.mayJump;

			if( this.jumpMax ) {
				if( this.travelMode == 'walk' && mayJump && (this.jump || !priorTileType.mayJump) ) {
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
						this.command = Command.ENTERGATE;
						this.commandItem = gate;
						this.actOnCommand();
						return;	// Short-circuit here, because the area change will wig future code out.
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
	clearCommands() {
		this.commandLast = this.command;
		this.commandItemLast = this.commandItem;
		this.commandTargetLast = this.commandTarget;
		this.command = Command.NONE;
		this.commandItem = null;
		this.commandTarget = null;
	}
}

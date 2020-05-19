Module.add('entity',function() {


// NOTE: This collides with monsters first, then items, then tiles. It could be a LOT
// more efficient if it checked the tile first, but that probably isn't best game-wise.
function GlobalFindFirstCollider(me,travelMode,map,x,y,ignoreEntity) {

	function doesCollide(entity) {
		if( entity[mayTravel] ) {
			return false;
		}
		if( travelMode=='walk' && entity.mayJump && me.jumpLeft < me.jumpMax && (me.jumpLeft || !curTile.mayJump)) {
			return false;
		}
		return true;
	}

	let curTile = map.tileTypeGet(x,y);
	console.assert(curTile);

	let mayTravel = 'may'+String.capitalize(travelMode || "walk");

	// Am I colliding with another entity?
	let f = new Finder( map.findEntityArrayAt(x,y).filter( e=>!e.isDead() && e.id!==me.id && doesCollide(e) ), me, false );	
	if( ignoreEntity ) {
		f.exclude(ignoreEntity);
	}
	if( f.count ) {
		return f.first;
	}

	// Am I colliding with an item?
	// Also, if I am colliding with a door, that is considered a collission but I will
	// bump the door automatically.
	let g = map.findItemAt(x,y).filter( doesCollide );
	if( g.count ) {
		return g.first;
	}

	// Am I colliding with a tile?
	let tile = map.tileTypeGet(x,y);
	if( tile && doesCollide(tile) ) {
		return tile;
	}

	return null;
}

function validCoords(target) {
	let ok = true;
	ok = ok && typeof target.x == 'number' && !isNaN(target.x);
	ok = ok && typeof target.y == 'number' && !isNaN(target.y);
	ok = ok && target.area && target.area.isArea;
	return ok;
}


//
// ENTITY (monsters, players etc)
//
class Entity {
	constructor(depth,monsterType,inject,jobPickFn) {
		let result = {
			status: 'entityConstruct',
			success: false
		}
		// BALANCE: Notice that monsters are created at LEAST at their native level, and if appearing on
		// a deeper map level then they average their native level and the map's level.
		let isPlayer = monsterType.control==Control.USER;

		// Use the average!
		let level = 	isPlayer ? depth : Math.round( (depth+monsterType.level) / 2 );
		let inits =    { inventory: [], actionCount: 0, command: Command.NONE, commandLast: Command.NONE, history: [], historyPending: [] };
		let values =   { id: Date.makeEntityId(monsterType.typeId,level) };


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
			inits.pronoun = Random.chance100(70) ? 'he' : 'she';
		}

		let jobId = values.jobId || (inject ? inject.jobId : '') || inits.jobId || monsterType.jobId;
		if( jobId && !JobTypeList[jobId] ) {
			let jobFilter = jobId;
			jobId = jobPickFn(jobFilter);
			values.jobId = jobId;	// because values has the highest priority.
		}
		let jobData = Object.merge( {}, JobTypeList[jobId], {
			type:1,
			typeId:1,
			baseType:1,
			level:1,
			rarity:1,
			name:1,
			namePattern:1
		} );
		jobData.carrying = Array.supplyConcat( monsterType.carrying, inits.carrying, jobData.carrying, inject?inject.carrying:null, values.carrying );

		Object.assign( this, monsterType, inits, jobData, inject || {}, values );

		this.attitudeBase = this.attitude;

		if( this.name && this.name.indexOf('/')>0 ) {
			this.name = this.name.split('/')[this.pronoun=='she' ? 1 : 0];
		}

		if( this.naturalWeapon ) {
			Inventory.lootTo( this, [this.naturalWeapon], this.level, null, true );
		}

		if( this.carrying ) {
			Inventory.lootTo( this, this.carrying, this.level, null, true );
		}
		console.assert( this.inventory.length >= 1 );	// 1 due to the natural melee weapon.

		if( this.wearing ) {
			Inventory.lootTo( this, this.wearing, this.level, null, true, null, item => {
				if( this.mayDon(item) ) {
					this.don(item,item.slot);
				}
			});
		}

		let naturalMeleeWeapon  = this.naturalMeleeWeapon;
		console.assert( naturalMeleeWeapon );
		if( isPlayer ) {
			// SUPER MEGA special case, to calculate the hand damage of the player.
			// I found that 50% was getting me killed by single goblins. Not OK.
			let damageWhenJustStartingOut = 0.75;
			naturalMeleeWeapon.damage = Math.max(1,Math.floor(Rules.playerDamage(level)*damageWhenJustStartingOut));
		}
		else {
			let hitsToKillPlayer = parseFloat( monsterType.power.split(':')[1] );
			naturalMeleeWeapon.damage = Rules.monsterDamage(level,hitsToKillPlayer);
		}

		String.calcName(this);
		console.assert( typeof this.health === 'number' && !isNaN(this.health) );
		console.assert( this.x===undefined && this.y===undefined && this.area===undefined);

		console.assert(this.speedAction);
		this.actionLeft720 = 0;
		this.roundTicker720 = 0;

		// WARNING! Not a deep copy. But it is only for the result...
		result.entity = Object.assign( {}, this );
		result.success = true;
		this.constructionResult = result;
	}
	get inVoid() {
		return !this.area;
	}
	spriteSetMember(member,value) {
		guiMessage( 'spriteSetMember', { entity: this, member: member, value: value } );
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
		//$('<div>'+s+'</div>').prependTo('#guiPathDebug');
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
	getBaseStat(stat) {
		if( stat == 'healthMax' ) {
			return Rules.playerHealth(this.level);
		}
		return this.baseType[stat];
	}
	grantPerks() {
		for( let i=0 ; i<=this.level ; ++i ) {
			Perk.grant( this, this.legacyId, i );
		}
	}

	requestGateTo(area,x,y) {
		return this.moveToInstantly(area,x,y);
	}

	findFirstCollider(travelMode,x,y,ignoreEntity) {
		return GlobalFindFirstCollider(this,travelMode,this.map,x,y,ignoreEntity);
	}

	findAliveOthersNearby(visDist=MaxVis) {
		let entityList = [];
		this.map.traverseNear( this.x, this.y, visDist, (x,y) => {
			let list = this.map.findEntityArrayAt(x,y);
			list.forEach( e => {
				if( !e.isDead() && e.id !== this.id ) {
					entityList.push(e);
				}
			});
		});
		return new Finder( entityList, this, false );
	}
	findAliveOthersAt(x,y) {
		return new Finder( this.map.findEntityArrayAt(x,y).filter( e=>!e.isDead() && e.id!==this.id ), this, false );
	}


	findAliveOthersOrSelfAt(x,y) {
		let f = this.findAliveOthersAt(x,y);
		if( Distance.isAt(this.x,this.y,x,y) ) {
			f.append( this );
		}
		return f;
	}
	findAliveOthers(entityList = this.entityList) {
		return new Finder(entityList,this).excludeMe().isAlive();
	}
	get isUser() {
		return this.control == Control.USER;
	}
	isItemSelected(item) {
		if( this.commandItem == item ) {
			return true;
		}
		if( this.userControllingMe ) {
			return this.userControllingMe.isItemSelected(item);
		}
		return false;
	}
	findItem(fn) {
		return new Finder(this.inventory).find(fn);
	}
	fling(itemList) {
		let self = this;
		itemList.forEach( item => {
			let lx = self.x;
			let ly = self.y;
			if( this.lootFling ) {
				let dir = Random.intRange(0,8);
				lx += Direction.add[dir].x*this.lootFling;
				ly += Direction.add[dir].y*this.lootFling;
			}
			item.giveTo(this.map,lx,ly,true)
		});
	}
	get destination() {
		return this._destination;
	}
	set destination(value) {
		this._destination = value;
		if( !this._destination ) {
			this.record('destination cleared.');
		}
		else {
			this.record('destination'+this._destination.name+' ('+this._destination.why+')');
		}
	}
	get activity() {
		return this._activity;
	}
	set activity(value) {
		this._activity = value;
		if( this._activity ) {
			this.record('activity='+this._activity);
		}
	}


	die() {
		if( this.dead && this.isUser ) {
			return;
		}

		// Immortals can never die.
		if( this.immortal ) {
			this.health = Math.max(1,this.health);
			delete this.vanish;
			return;
		}
		if( this.dead ) {
			debugger;
		}

		// Tell anyone who cares that they died
		let deathPhrase = this.deathPhrase;
		if( !deathPhrase ) {
			deathPhrase = [mSubject,this,' ',mVerb,this.vanish?'vanish':'die'];
			if( this.oldMe ) {
				deathPhrase.push( ' in the body of ',mObject|mA,this.oldMe );
			}
			deathPhrase.push('!');
		}
		if( this.brainMaster ) {
			deathPhrase.unshift(mCares,this.brainMaster);
		}
		tell(...deathPhrase);

		// Halt all deeds that this entity originated. For example, the ambligryp's immobilizing
		// grip. BUT ypu want to keep any effects from worn objects, so if you are the target
		// just leave the deed in place. You also want ongoing damage to continue.
		DeedManager.end( deed => {
			let kill = deed.source && deed.source.id == this.id && deed.op !== 'damage' && deed.target.id !== this.id;
			kill = kill || (deed.target.id == this.id && (!deed.source || deed.source.id!=this.id));
			return kill;
		});

		if( this.oldMe ) {
			let deed = this.deedFind( deed => deed.op=='possess' );
			deed.end();
		}

		this.map._entityRemove(this,this.x,this.y);
		this.map.calcWalkable(this.x,this.y);	// NUANCE: must be after the entityRemove!

		this.dead = true;
		if( this.onDeath ) {
			this.onDeath.call(this,this);
		}

		// make sure that if this critter is carrying an .isPlot item that it gets dropped SOMEWHERE useful!
		if( this.dead ) {
			// When you vanish, or leave no corpse, your loot just drops, or, if set to fling
			// it sprays around within lootFling distance. Like if you want to explode a bit.
			if( this.vanish || this.corpse === false ) {
				let itemList = this.deathLootGenerate();
				if( this.vanish ) {
					itemList = new Finder(itemList).isPlot().all;
				}
				this.fling(itemList);
			}
			else {
				let mannerOfDeath = Gab.damagePast[this.takenDamageType||DamageType.BITE];
				if( !mannerOfDeath ) {
					debugger;
				}
				this.map.itemCreateByTypeId(
					this.x,
					this.y,
					this.corpse || 'corpse',
					{},
					{
						nutrition: this.level,
						isCorpse: true,
						usedToBe: this,
						matter: this.matter || 'flesh',
						mannerOfDeath: mannerOfDeath
					}
				);
			}
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
		this.healthMax = Rules.playerHealth(this.level);
		this.health = this.healthMax;
		tell(mSubject,this,' ',mVerb,'gain',' a level!');

		// happiness flies away from the attacker
		let piecesAnim = new Anim({
			name:			'levelFountain',
			follow: 		this,
			img: 			StickerList.bloodYellow.img,
			duration: 		Anim.Duration.untilAllDead,
			onInit: 		a => { },
			onTick: 		a => a.createPerSec(40,2),
			onSpriteMake: 	s => s.sScale(0.30).sVel(Random.floatRange(-30,30),Random.floatRange(5,10)).duration=1,
			onSpriteTick: 	s => s.sMoveRel(s.xVel,s.yVel).sGrav(10)
		});
		// You also jump back and quiver
		new Anim({
			name:			'levelQuiver',
			follow: 		this,
			duration: 		2,
			onInit: 		a => { a.takePuppet(this); },
			onSpriteMake: 	s => { },
			onSpriteTick: 	s => { s.sQuiver(0.05,0.10); },
		});
		return true;
	}

	get command() {
		return this._command;
	}
	set command(value) {
		console.assert(value);
		this._command = value;
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
		return Direction.predictable(dx,dy);
	}
	dirToEntityNatural(entity) {
		let dx = entity.x - this.x;
		let dy = entity.y - this.y;
		return Direction.natural(dx,dy);
	}
	dirToPosNatural(x,y) {
		let dx = x - this.x;
		let dy = y - this.y;
		return Direction.natural(dx,dy);
	}

	inCombat() {
		return this.inCombatTimer && Time.sim.since(this.inCombatTimer) < Rules.COMBAT_EXPIRATION;
	}
	setMaster(newMaster) {
		this.brainMaster = newMaster;
		this.brainPath = true;
		this.destination = null;
		this.personalEnemy = null;
		if( !this.brainMaster ) {
			this.team = this.baseType.team;
			tell(mSubject,this,' ',mVerb,'is',' now free.');
		}
		else {
			this.team = newMaster.team;
			tell(mSubject,this,' ',mVerb,'recognize',' ',mObject|mBold,this.brainMaster,' as ',mObject|mPossessive|mPronoun,this,' new master! ');
		}
	}
	getStanceToward(entity) {
		if( this.isMyMaster(entity) ) {
			return this.isAnimal ? 'pet' : 'slave';
		}
		if( this.isMySlave(entity) ) {
			return 'master';
		}
		if( this.isMyFriend(entity) ) {
			return 'friend';
		}
		if( this.isMyNeutral(entity) ) {
			return 'neutral';
		}
		return 'enemy';
	}
	isMyMaster(entity) {
		return this.brainMaster && entity.id == this.brainMaster.id;
	}
	isMySlave(entity) {
		return entity.isMyMaster(this);
	}
	isMySuperior(entity) {
		if( entity.isUser ) {
			// User is superior to all.
			return true;
		}
		if( this.isMyMaster(entity) ) {
			// you are never superior to your master.
			return true;
		}
		if( this.isMySlave(entity) ) {
			// you are always superior to your slave.
			return false;
		}
		return entity.id > this.id;
	}
	isMyInferior(entity) {
		return !entity.isMySuperior(this);
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
		if( this.attitude == Attitude.PACIFIED ) {
			return false;
		}
		if( this.attitude == Attitude.ENRAGED ) {
			return true;
		}
		if( this.attitude == Attitude.FEARFUL && (entity.teamApparent || entity.team) !== this.team ) {
			return true;
		}
		if( entity.id == this.personalEnemy ) {
			return true;
		}
		if( this.isMyMaster(entity) || this.isMySlave(entity) ) {
			return false;
		}
		if( (entity.teamApparent || entity.team) == Team.NEUTRAL ) {
			return false;
		}
		return (entity.teamApparent || entity.team) != this.team;
	}
	isMyFriend(entity) {
		if( entity.id == this.id ) {
			return true;
		}
		if( this.attitude == Attitude.ENRAGED ) {
			return false;
		}
		if( this.attitude == Attitude.FEARFUL && (entity.teamApparent || entity.team) !== this.team ) {
			return false;
		}
		if( entity.id == this.personalEnemy ) {
			return false;
		}
		if( this.isMyMaster(entity) || this.isMySlave(entity) ) {
			return true;
		}
		return (entity.teamApparent || entity.team) == this.team;
	}
	isMyNeutral(entity) {
		if( entity.id == this.id ) {
			return false;
		}
		if( this.attitude == Attitude.ENRAGED ) {
			return false;
		}
		if( this.attitude == Attitude.FEARFUL && (entity.teamApparent || entity.team) !== this.team ) {
			return false;
		}
		if( this.attitude == Attitude.PACIFIED ) {
			return true;
		}
		if( entity.id == this.personalEnemy ) {
			return false;
		}
		if( this.isMyMaster(entity) || this.isMySlave(entity) ) {
			return false;
		}
		return this.team != Team.NEUTRAL && (entity.teamApparent || entity.team) == Team.NEUTRAL;
	}
	healthPercent() {
		return Math.floor((this.health/this.healthMax)*100);
	}

	calculateVisbility() {
		let doVis = false;
		if( this.isUser ) {
			doVis = true;
		}
		else {
			// Calc vis if I am near the user, that it, I might be interacting with him!
			let user = this.entityList.find( e => e.isUser );
			let distanceForVisCacheCalculation = MaxVis * 2;	// this should match handlePerception()
			doVis = user && this.nearTarget(user,distanceForVisCacheCalculation);
		}

		if( doVis ) {
			//console.log('calcVis for',this.area.id,'at',this.x,'x',this.y);
			this.visCache = this.area.vis.calcVis(
				this.x,
				this.y,
				this.senseSight!==undefined ? this.senseSight : Rules.MONSTER_SIGHT_DISTANCE,
				this.senseDarkVision,
				this.senseBlind,
				this.senseXray || 0,
				this.senseInvisible,
				this.visCache,
				this.mapMemory
			);
		}
		else {
			this.visCache = null;
		}

		return this.visCache;
	}

	canTargetPosition(x,y,area,sightReduction=0,lightDistance=0) {
		if( x===undefined || y===undefined ) {
			debugger;
		}
		// Never in a different area.
		if( area && this.area.id !== area.id ) {
			return false;
		}
		let visCache = this.visCache;
		let d = this.getDistance(x,y);
		// You can always target adjacent to yourself.
		if( d <= 1 ) {
			return true;
		}
		let sightDistance = (this.senseSight!==undefined ? this.senseSight : Rules.MONSTER_SIGHT_DISTANCE);
		let canSee = this.near( x, y, area, Math.max( 1, Math.max( lightDistance, sightDistance - sightReduction ) ) );

		// If you are not close enough to a user to have a vis cache, then just guess at your
		// ability to target the position.
		if( !canSee || !visCache ) {
			return canSee;
		}
		// If the location has never been processed by the vis cache (rare) then assume
		// it is hidden behind a wall or something.
		if( typeof visCache[y]==='undefined' || typeof visCache[y][x]==='undefined' ) {
			return false;
		}
		// The spot must be both visible and have enough light to see, except see above
		// for the exception of targetting adjacent things.
		return visCache[y][x] && this.map.getLightAt(x,y,0) > 0;
	}

	isHiddenEntity(entity) {
		if( (entity.isMonsterType && this.senseLiving && entity.isLiving) || (entity.isItemType && entity.isTreasure && this.senseTreasure) ) {
			return false;
		}
		let d = this.getDistance(entity.x,entity.y);
		// Adjacent things can be smelled if they stink, or detected with a good sense of smell.
		if( d <= 1 && (entity.stink || (this.senseSmell && !entity.scentReduce)) ) {
			return false;
		}
		// blind can not target. WARNING! Check this AFTER any smell tests and senseLiving or senseTreasure
		if( this.senseBlind ) {
			return true;
		}
		// You can't target invisible unless you can see invisible (but see scent above)
		if( entity.invisible && !this.senseInvisible ) {
			return true;
		}
		return false;
	}

	canTargetEntity(entity,isPerceiving) {
		// Some special rules if you are perceiving vs targetting. There are many things
		// you can not see, but if you are right next to things you are blind to then
		// you're allowed to take a shot at them.

		// You can always target yourself, even in the void.
		if( this.id == entity.id ) {
			return true;
		}
		if( entity.inVoid || entity.isMap ) {
			return false;
		}
		if( entity.isItemType && entity.owner && !entity.owner.isMap ) {
			// This shortcuts a bit, returning true if the entity is owned and you are the owner.

			// WARNING! This is needed so that messages generated during entity init will work
			// properly. That is, x and y are undefined, so we need to rely on who is holding the
			// object.
			return entity.owner.id == this.id;
		}
		// Not in the same area, so nope.
		if( entity.area && entity.area.id !== this.area.id ) {
			return false;
		}
		// Magic might be helping you see things
		if( (entity.isMonsterType && this.senseLiving && entity.isLiving) || (entity.isItemType && entity.isTreasure && this.senseTreasure) ) {
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
		// blind can not target. WARNING! Check this AFTER any smell tests and senseLiving or senseTreasure
		if( this.senseBlind && (isPerceiving || d>1) ) {
			return false;
		}
		// You can't target invisible unless you can see invisible (but see scent above)
		if( entity.invisible && !this.senseInvisible && (isPerceiving || d>1) ) {
			return false;
		}
		// Otherwise, you can target an entity in any position you can see.
		// WARNING: The sneak and light must be the same as those used in viewMap handlePerception
		return this.canTargetPosition(entity.x,entity.y,entity.area,entity.sneak||0,(entity.light||0) * Rules.noticeableLightRatio);
	}

	canPerceiveEntity(entity) {
		return this.canTargetEntity(entity,true);
	}

	testTooClose(x,y,sneak=0) {
		let sightDistance = (this.senseSight!==undefined ? this.senseSight : Rules.MONSTER_SIGHT_DISTANCE);
		let sightEdge = Math.max( 1, sightDistance - sneak );

		return this.near( x, y, this.area, Math.min( this.tooClose||Rules.tooCloseDefault, sightEdge) );
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
		// Now aggregate if needed.
		if( this.isUser ) {
			guiMessage('inventoryChange',this);
		}
	}
	don(item,slot) {
		if( item.inSlot || !item.slot ) {
			debugger;
			return item;
		}
		if( (item.bunch||1) > 1 && !item.donBunches ) {
			item = item._unbunch();
		}

		let finishDonning = () => {
			if( !item.dead && item.owner.id == this.id ) {
				tell(mSubject,this,' ',mVerb,item.useVerb,' ',mObject,item);
				item.inSlot = slot;
				if( item.triggerWhenDon() ) {
					item.trigger(this,this,Command.USE);
				}
				if( this.isUser ) {
					guiMessage('inventoryChange',this);
				}
			}
		}

		if( !item.donDuration || !this.area) {
			finishDonning();
		}
		else {
			tell(mSubject,this,' ',mVerb,'begin',' ',item.useVerb+'ing',' ',mObject,item)
			let donArmorEffect = {
				op: 'set',
				stat: 'attitude',
				value: Attitude.BUSY,
				duration: item.donDuration,
				name: 'donning',
				description: 'putting on '+item.typeId,
				icon: item.icon,
				iconOver: item.icon,
				onEnd: (deed) => {
					if( deed.completed() ) {
						finishDonning();
					}
				}
			}
			effectApply( donArmorEffect, this, this, null );
			window.donTest = true;
			guiMessage('inventoryClose');
		}


		return item;
	}

	_itemRemove(item) {
		if( !this.inventory.includes(item) ) {
			debugger;
		}
		if( item.inSlot ) {
			this.doff(item);
		}
		this.inventoryLastChange = Time.sim.time;
		Array.filterInPlace(this.inventory, i => i.id!=item.id );
		if( this.isUser ) {
			guiMessage('inventoryChange',this);
		}
	}
	_itemTake(item,x,y) {
		if( this.inventory.includes(item) ) {
			debugger;
		}
		if( item.onGiveToEntity ) {
			item.onGiveToEntity.call(item,x,y,this);
		}
		if( item.dead ) {
			return null;
		}
		item = item._addToListAndBunch(this.inventory);
		this.inventoryLastChange = Time.sim.time;
		item.x = this.x;
		item.y = this.y;
		if( x!==item.x || y!==item.y ) debugger;

		// NOTICE! The ownerOfRecord is the last entity that operated or held the item. Never the map.
		// That means we can hold the ownerOfRecord "responsible" for thing the item does, whether it
		// was thrown, or left as a bomb, or whatever. That is, even if the MAP is the CURRENT owner.
		item.ownerOfRecord = this;
		if( item.isCoin ) {
			this.coinCount = (this.coinCount||0) + item.coinCount;
			item.destroy();
			return null;
		}
		if( item.autoEquip && !this.neverAutoEquip && this.mayDon(item) ) {
			item = this.don(item,item.slot) || item;
		}
		if( this.isUser ) {
			guiMessage('inventoryChange',this);
		}
		return item;
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
		if( area && !this.inArea(area) ) {
			return false;
		}
		return Distance.isNear(this.x-x,this.y-y,targetDist);
	}

	getDistance(x,y) {
		return Distance.getSq(x-this.x,y-this.y);
	}

	inArea(area) {
		console.assert(area);
		return this.area.id == area.id;		
	}
	isAt(x,y,area) {
		console.assert(area);
		return Distance.isAt(this.x,this.y,x,y) && this.area.id==area.id;
	}
	isAtTarget(target) {
		console.assert(target && target.area);
		return this.isAt(target.x,target.y,target.area);
	}
	getCastableSpellList() {
		let hasId = {};
		return new Finder(this.inventory).filter( item=>{
			if( item.isSpell && item.effect && item.effect.op && !item.effect.isBlank  && !item.isFake) {
				let ok = !hasId[item.effect.typeId];
				hasId[item.effect.typeId] = 1;
				return ok;
			}
		});
	}
	deedFind(fn) {
		return DeedManager.findFirst( deed => deed.target.id == this.id && fn(deed) );
	}
	deedBusy() {
		return this.deedFind( deed => deed.value==Attitude.BUSY );
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
	takeStripDeeds(testFn) {
		let count = DeedManager.end( testFn );
		return {
			status: 'stripDeeds',
			success: count > 0
		}
	}

	dirToBestScent(x,y,targetId) {
		let _bestAge;
		let dir = this.map.dirChoose( x, y, (x,y,bestAge) => {
			let entity = this.map.scentGetEntitySmelled(x,y,this.senseSmell);
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

		let lightMatters = !this.enemyIsPresent && this.isLightHarmful(x,y) && this.map.getLightAt(x,y) > this.map.getLightAt(this.x,this.y);
		if( lightMatters && problemTolerance <= Problem.TINY ) {
			return false;
		}

		// Maybe we're not colliding, but perhaps there is an item present that is a problem.
		let g = this.map.findItemAt(x,y);
		if( g.count ) {
			let abort = false;
			g.forEach( item => {
				if( !item.isProblem ) return;
				let problem = item.isProblem(this,item);
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
		return this.mayEnter(this.x+Direction.add[dir].x,this.y+Direction.add[dir].y,problemTolerance);
	}

	problemTolerance() {
		// WARNING! When we have no enemy our problem tolerance should be zero.
		// WARNING! This does NOT consider whether the creature is immune to the damage,
		// nor does it understand that their movement mode might be immune.
		if( this.attitude == Attitude.ENRAGED ) {
			return Problem.HARSH;
		}
		if( this.attitude == Attitude.PANICKED || this.attitude == Attitude.CONFUSED ) {
			return Problem.MILD;
		}
		return Problem.TINY;
	}

	thinkApproachTarget(target) {
		return this.thinkApproach(target.x,target.y,target.area,target);
	}

	thinkApproach(x,y,area,target) {
		if( target && target.area.id !== this.area.id ) {
			this.record(this.name,'on',this.area.id,' approaching ',target.name,' ',target.area.id);
			let gate = new Finder(this.map.itemList,this).filter( gate=>gate.toAreaId==target.area.id ).closestToMe().first;
			if( !gate ) {
				// This only happens if the target teleported and left no gate behind.
				// We will fall through and let this path fail.
			}
			else {
				this.record('to gate '+gate.toAreaId);
				x = gate.x;
				y = gate.y;
				target = gate;
				if( this.isAtTarget(gate) ) {
					this.record('entering it.');
					this.commandItem = gate;
					return Command.ENTERGATE;
				}
			}
		}

		if( this.brainMaster && !this.brainPath ) { debugger; }

		let DEBUG_ALL_USE_PATH = false; //true;
		let closeEnoughToUsePath = this.area.pathClip.contains(this.x,this.y);
		let attitudeNeedsPathing = this.attitude == Attitude.HUNT;

		if( (this.brainPath || attitudeNeedsPathing || DEBUG_ALL_USE_PATH) && closeEnoughToUsePath ) {

			let stallSet = (toggle) => {
				if( !toggle ) {
					this.record('stall=0',true);
					this.stall = 0;
					return;
				}
				this.stall = (this.stall || 0) + 1;
				this.record('stall='+this.stall,true);
				if( target && target.isDestination && this.stall > (target.stallLimit || 5) ) {
					if( target.onStall ) {
						target.onStall(this,target);
					}
					if( this.path && this.path.leadsTo(target.x,target.y) ) {
						delete this.path;
					}
					this.stall = 0;
					this.destination = null;
				}
				if( target && target.isLEP && this.stall > (target.stallLimit || 5) ) {
					if( this.path && this.path.leadsTo(target.x,target.y) ) {
						delete this.path;
					}
					this.stall = 0;
					delete this.lastEnemyPosition;
				}
			}

			if( !this.path || !this.path.success || !this.path.leadsTo(x,y) || !this.path.stillOnIt(this.x,this.y) ) {
				// How hard should we try to get certain places? 
				let distLimit = Math.max( this.pathDistLimit||0, 10 + this.getDistance(x,y)*3 );

				this.path = new Path(this.map,distLimit,false,10);
				let closeEnough = !target ? 0 : (target.closeEnough !== undefined ? target.closeEnough : (target.isLEP ? 0 : (target.isMonsterType ? 1 : 0)));

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
				return Direction.toCommand(dir);
			}
		}


		// Can I walk towards them?
		let dir = this.dirToPosNatural(x,y);
		if( dir === false ) {
			// Weird, I am already upon my target. Possibly I should step away from them.
			dir = Random.intRange(0,8);
		}
		// Aggressive creatures will completely avoid problems if 1/3 health, otherwide they
		// avoid problems most of the time, but eventually will give in and take the risk.
		let problemTolerance = this.problemTolerance();
		// If you're aggressive and healthy, there is a 15% change you will charge forward through problems.
		if( this.attitude == Attitude.AGGRESSIVE && Random.chance100(15) ) {
			problemTolerance = Problem.HARSH;
		}
		this.record( 'Problem tolerance = '+problemTolerance, true );

		if( this.mayGo(dir,problemTolerance) ) {
			this.record('approach '+(target ? target.name : '('+x+','+y+')'),true);
			return Direction.toCommand(dir);
		}
		return false;
	}

	thinkStumbleF(chanceToNotMove=50) {
		this.activity = 'Stumbling around in confusion.';
		let wait = Random.chance100(chanceToNotMove);
		this.record('stumble'+(wait?' wait':''), true);
		if( wait ) return Command.WAIT;
		const RandCommand = [Command.N, Command.NE, Command.E, Command.SE, Command.S, Command.SW, Command.W, Command.NW];
		return RandCommand[Random.intRange(0,RandCommand.length)];
	}

	thinkTetherReturn(tetherMagnet=70) {
		let returnChance = this.beyondTether() ? tetherMagnet : ( !this.isAtTarget(this.origin) ? tetherMagnet/2 : 0 );
		if( Random.chance100(returnChance) ) {
			this.record('wander return', true);
			this.activity = 'Returning to a preferred place.';
			let c = this.thinkApproachTarget(this.origin);
			if( c ) return c;
		}
		return false;
	}

	isLightHarmful(x,y) {
		return this.lightHarms && this.map.getLightAt(x,y) >= this.lightHarms;
	}
	isLightHarmfulDir(dir=false) {
		let x = this.x;
		let y = this.y;
		if( dir !== false ) {
			x += Direction.add[dir].x;
			y += Direction.add[dir].y;
		}
		return this.isLightHarmful(x,y);
	}

	thinkAvoidLight() {
		if( !this.lightHarms ) {
			return;
		}
		let dir = this.map.dirChoose( this.x, this.y, (x,y,bestLight) => {
			if( !this.mayEnter(x,y,this.problemTolerance()) ) {
				return false;
			}
			let light = this.map.getLightAt(x,y);
			if( bestLight === null || light < bestLight ) {
				return light;
			}
			return false;
		});

		if( dir !== false ) {
			this.activity = 'Avoiding harmful light';
			return Direction.toCommand(dir);
		}
	}

	thinkWanderF(avgPause=7,avgWanderDist=8,tetherMagnet=70) {
		let c = this._thinkWanderF(avgPause,avgWanderDist,tetherMagnet);
		if( this.isLightHarmfulDir( Direction.fromCommand(c) ) && !this.isLightHarmfulDir() ) {
			c = Command.WAIT;
		}
		return c;
	}

	_thinkWanderF(avgPause=7,avgWanderDist=8,tetherMagnet=70) {
		this.activity = 'Wandering.';

		if( this.isLightHarmfulDir() ) {
			let c = this.thinkAvoidLight();
			if( c ) return c;
		}

		if( this.commandLast == Command.WAIT && Random.chance100(100/avgPause) ) {
			this.record('wander pause', true);
			this.activity = 'Pausing for a bit during a wander.';
			return Command.WAIT;
		}

		if( this.tether ) {
			let c = this.thinkTetherReturn(tetherMagnet);
			if( c ) return c;
		}

		let dirLast = Direction.fromCommand(this.commandLast);
		if( dirLast !== false ) {
			if( Random.chance100(100/avgWanderDist) && this.mayGo(dirLast,this.problemTolerance()) ) {
				this.record('wander forward',true);
				return this.commandLast;
			}
			return Command.WAIT;
		}

		let reps = 4;
		do {
			let dir = Random.intRange(0,8);
			if( this.mayGo(dir,this.problemTolerance()) ) {
				return Direction.toCommand(dir);
			}
		} while( --reps );
		return Command.WAIT;
	}

	thinkRetreat(dirAwayPerfect,panic=false) {
		let dirAwayRandom = (dirAwayPerfect+8+Random.intRange(0,3)-1) % Direction.count;
		let dirAway = [dirAwayRandom,dirAwayPerfect,(dirAwayPerfect+8-1)%Direction.count,(dirAwayPerfect+1)%Direction.count];
		while( dirAway.length ) {
			let dir = dirAway.shift();
			if( panic || this.mayGo(dir,this.problemTolerance()) ) {
				this.record( 'fleeing', true );
				console.assert( dir>=0 && dir < 8 );
				return Direction.toCommand(dir);
			}
		}
		if( this.isLightHarmfulDir() ) {
			let c = this.thinkAvoidLight();
			if( c ) return c;
		}
		this.record( 'unable to retreat '+dirAwayPerfect, true );
		return false;
	}

	thinkPackToSuperior(howClose=2) {
		// When hurt, your pet will run towards you. Once within 2 it will flee its enemies, but still stay within 2 of you.	
		let pack = this.findAliveOthersNearby().isMyPack().isMySuperior().farFromMe(howClose).byDistanceFromMe().first;
		if( pack ) {
			this.record('back to superior pack member',true);
			this.activity = 'Grouping up with the pack.';
			return this.thinkApproachTarget(pack);
		}
		return false;
	}


	thinkFlee(enemy) {
		let dirAwayPerfect = (this.dirToEntityNatural(enemy)+4)%Direction.count;
		let dirLeft = (dirAwayPerfect+8-1)%Direction.count;
		let dirRight = (dirAwayPerfect+1)%Direction.count;

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
					this.activity = 'Fleeing '+enemy.name+' towards friends.';

					return this.thinkApproachTarget(friend);
				}
			}
		}
		this.activity = 'Fleeing '+enemy.name+'.';

		return this.thinkRetreat(dirAwayPerfect);
	}

	thinkAwaitF() {
		if( !this.beyondOrigin() ) {
			this.activity = 'Patiently waiting.';
			return Command.WAIT;
		}
		this.activity = 'Returning to a preferred place.';
		let c = this.thinkApproachTarget(this.origin);
		return c || Command.WAIT;
	}


	thinkWorshipF(enemyDist) {
		if( this.beyondOrigin() ) {
			let c = this.thinkApproachTarget(this.origin);
			if( c ) return c;
		}
		this.activity = 'Worshipping.';
		return Command.PRAY;
	}

	thinkStayNear(friend) {
		this.record('stay near '+friend.id,true);
		this.activity = 'Staying near '+friend.name+'.';
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

	thinkHunger(foodDist=4) {
		let foodList = new Finder(this.map.findItemsNear(this.x,this.y,foodDist),this)
			.filter(item => item.isEdibleBy(this) && this.canPerceiveEntity(item));
		if( foodList.first && this.isAtTarget(foodList.first) ) {
			this.record('found some food. eating.',true);
			this.commandItem = foodList.first;
			this.activity = 'Eating '+foodList.first.name+'.';
			return Command.EAT;
		}
		if( foodList.first ) {
			this.record('head towards food',true);
			this.activity = 'Heading towards '+foodList.first+'.';
			return this.thinkApproachTarget(foodList.first);
		}
		return false;
	}

	thinkGreedy() {
		let greedField = this.greedField || 'isGem';
		let greedDist = this.greedDist || (this.senseSight!==undefined ? this.senseSight : Rules.MONSTER_SIGHT_DISTANCE);
		let desire = new Finder(this.map.itemList,this).nearMe(greedDist).filter( item=>item[greedField] ).byDistanceFromMe().first;
		if( !desire && this.destination && this.destination.isGreed ) {
			if( this.destination.onCancel ) {
				this.destination.onCancel();
			}
			this.destination = null;
		}
		if( desire ) {
			if( this.isAtTarget(desire) ) {
				this.commandItem = desire;
				this.activity = 'Arriving at '+desire.name+'.';
				return desire.isEdibleBy(this) ? Command.EAT : Command.PICKUP;
			}
			if( !this.destination || !desire.isAtTarget(this.destination) ) {
				this.destination = {
					isDestination: true,
					isGreed: true,
					entity: desire,
					area: desire.area,
					x: desire.x,
					y: desire.y,
					site: null,
					closeEnough: 0,
					stallLimit: 2,
					name: desire.name,
					why: 'thinkGreedy '+greedField,
					id: 'DEST.'+desire.name+'.'+Date.makeUid()
				};
			}
			this.activity = 'Heading towards '+desire.name+'.';
			return this.thinkApproachTarget(this.destination);
		}
		return false;
	}

	thinkAttack(enemyList,personalEnemy) {
		let weapon = this.calcBestWeapon(enemyList.first);
		let distLimit = weapon.reach || weapon.range || 1;
		let inRange = new Finder(enemyList.all,this).nearMe(distLimit).shotClear();
		if( !weapon.rechargeLeft && inRange.count ) {
			if( weapon.isWeapon && !weapon.inSlot ) {
				this.actUse(weapon);
			}
			let target = personalEnemy && inRange.includesId(personalEnemy.id) ? personalEnemy : inRange.first;	// For now, always just attack closest.
			this.record('attack '+target.name+' with '+(weapon.name || weapon.typeId),true);
			this.commandItem = weapon;
			this.commandTarget = target;
			let temp = commandForItemAttack(weapon);
			if( temp !== Command.ATTACK || !this.nearTarget(target,1) ) {
				return temp;
			}
			this.activity = 'Attacking '+target.name+'.';
			return Direction.toCommand(this.dirToEntityPredictable(target));
		}
	}

	thinkDon(target) {
		if( !this.inventoryLastChange || Time.sim.since(this.inventoryLastChange) <= 1 ) {
			let best = {};
			let picker = new Picker(this.area.depth);
			this.inventory.forEach( item => {
				if( !item.slot || item.isWeapon || item.thinkDon===false || !this.bodySlots[item.slot] ) {
					return;
				}
				let price = item.price;
				if( !best[item.slot] || price > best[item.slot].price ) {
					best[item.slot] = item;
				}
			});
			Object.each( best, (item,slotId) => {
				if( !item.inSlot ) {
					this.actUse(item);	// This makes sure any others are taken off.
				}
			});
		}
	}

	beyondTether() {
		return this.tether && !this.nearTarget(this.origin,this.tether);
	}
	beyondOrigin() {
		return !this.isAtTarget(this.origin);
	}
/*
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
			why: qqq
			id: 'DEST.'+(site ? site.id : Date.makeUid())
		};
		return destination;
	}
*/

	pickRandomDestination() {
		let area = this.area;
		let safeSpot = pVerySafe(this.map);
		let site,x,y;
		do {
			// Doing it this way means that the smaller places get visited, which seldom happens if you just
			// pick a random map location.
			site = this.area.pickSite( site => (site.isRoom || site.isPlace) && site.marks.length );
			console.assert( site.marks.length > 0 );
			let i = Random.intRange(0,site.marks.length/2) * 2;
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
			why: 'pickRandomDestination',
			id: 'DEST.'+(site ? site.id : Date.makeUid())
		};
		this.record( 'New dest '+site.id+' ('+x+','+y+')' );
		return destination;
	}

	findSparsePack() {
		let packHash = {};
		let packSize = this.packSize || 4;
		let f = new Finder(this.entityList).filter( e => e.typeId == this.typeId && e.packId ).forEach( e => {
			packHash[e.packId] = (packHash[e.packId]||0)+1;
		});
		let sparseHash = Object.filter( packHash, size => size<packSize );
		if( Object.isEmpty(sparseHash) ) {
			return 'pack.'+Date.makeUid();
		}
		let packId = Object.keys(sparseHash)[0];
		return packId;
	}

	get hasForcedAttitude() {
		return [Attitude.CONFUSED,Attitude.ENRAGED,Attitude.PANICKED,Attitude.PACIFIED,Attitude.BUSY].includes(this.attitude);
	}

	get controlSuborned() {
		let useAiTemporarily = false;
		if( this.control == Control.USER ) {
			if( this.playerUseAi ) {
				useAiTemporarily = true;
			}
			if( this.stun || this.hasForcedAttitude ) {
				useAiTemporarily = true;
			}
		}
		return useAiTemporarily;
	}

	think() {
		if( this.isDead() ) {
			return;
		}

		this.activity = '';

		if( Tester.think(this) === true ) {
			return;
		}

		let willHesitate = (this.attitude == Attitude.HESITANT && Random.chance100(40));

		if( this.control == Control.EMPTY ) {
			this.command = Command.LOSETURN;
		}

		if( this.control == Control.AI || this.controlSuborned ) {
			function decideCommand() {

				if( this.typeId == window.debugEntity ) debugger;

				if( this.stun ) {
					this.record('loseTurn',true);
					return Command.LOSETURN;
				}

				// Hard to say whether this should take priority over .busy, but it is pretty important.
				if( this.bumpCount >=2 ) {
					return this.thinkBumpF();
				}

				if( this.attitude == Attitude.BUSY ) {
					let deed = this.deedBusy();
					if( deed ) {
						this.activity = 'Busy '+deed.timeLeft+' '+deed.description;
						return Command.BUSY;
					}
					else {
						debugger;
					}
				}

				if( this.mindset('pack') && !this.packId ) {
					this.packId = this.findSparsePack();
				}

				// Note that attitude ENRAGED makes isMyEnemy() return true for all creatures.
				let enemyList = this.findAliveOthersNearby().canPerceiveEntity().isMyEnemy().byDistanceFromMe();
				if( enemyList.count ) {
					this.enemyNearTimer = Time.sim.time;
					if( this.inCombat() ) {
						this.inCombatTimer = Time.sim.time
					}
				}
				this.enemyIsPresent = enemyList.count > 0;

				if( this.mindset('don') ) {
					this.thinkDon(enemyList.first);
				}

				if( this.mindset('lep') && enemyList.count ) {
					let e = enemyList.first;
					this.record('set lep ('+e.x+','+e.y+')',true);
					this.lastEnemyPosition = { isLEP: true, x:e.x, y:e.y, area:e.map.area, entity: e, name: e.name };
				}
				if( this.lastEnemyPosition && this.lastEnemyPosition.entity.isDead() ) {
					delete this.lastEnemyPosition;
				}
				if( !this.lastEnemyPosition && this.justAttackedByEntity ) {
					let e = this.justAttackedByEntity;
					this.lastEnemyPosition = { isLEP: true, x:e.x, y:e.y, area:e.map.area, entity: e, name: e.name };
				}
				delete this.justAttackedByEntity

				let wasSmell = false;
				if( !enemyList.count && this.senseSmell ) {
					let smelled = this.map.scentGetEntitySmelled(this.x,this.y,this.senseSmell,this.id);
					// Technically we should have to follow the scent trails of dead people
					// around, but that is rather inconvenient.
					if( smelled && !smelled.isDead() && this.isMyEnemy(smelled) ) {
						if( !this.lastScent || this.lastScent.id != smelled.id || Random.chance100(5) ) {
							tell('<b>',mSubject|mCares,smelled,' ',mVerb,'hear',' ',mA|mObject,this,' howling!','</b>');
						}
						// This migth be a mistake, perhaps, and instead we should be finding dirToBestScent
						// and storing that position...
						enemyList.prepend(smelled);
						wasSmell = true;
						this.lastScent = smelled;
						this.activity = 'Sniffing the trail of '+smelled.name+'.';
					}
				}
				this.enemyIsSmelled = wasSmell;
				// Keep pursuing and check the lep if it is closer than any other enemy. My target might have
				// simply vanished around a corner.
				// LEP means "last enemy position" and is used when enemies vanish from sight for any reason,
				// whether turning a corner or suddenly going invisible.
				let wasLEP = false;
				let lep = this.lastEnemyPosition;
				if( lep ) {
					this.record('me=('+this.x+','+this.y+') lep=('+lep.x+','+lep.y+')',true);
				}
				// So, this used to check if lep distance was closer than enemy distance, but the problem is that the distance check was NOT
				// for a pathfind, but rather a direct shot. So the distance would swap rapidly between the two.
				// //(!enemyList.count || this.getDistance(lep.x,lep.y) < this.getDistance(enemyList.first.x,enemyList.first.y)) ) {
				if( lep && !this.noLEP && !wasSmell && !enemyList.count ) { 
					if( !this.isAtTarget(lep) ) {
						this.record('prepend lep',true);
						enemyList.prepend(lep);
						wasLEP = true;
						this.activity = 'Heading towards known position of '+lep.name+'.';
					}
					else {
						this.record('on the lep!',true);
						this.activity = 'Arriving at last known position of '+lep.name+'.';
					}
				}
				this.enemyIsLep = wasLEP;

				if( lep && this.isAtTarget(lep) ) {
					this.record('at lep ('+lep.x+','+lep.y+')',true);
					let gate = this.map.findItemAt(this.x,this.y).filter( item=>item.isGate ).first;
					if( gate ) {
						this.record('enter gate',true);
						this.commandItem = gate;
						this.activity = 'Entering a '+gate.name+'.';
						return Command.ENTERGATE;
					}
				}

				let theEnemy = enemyList.first;
				let personalEnemy = enemyList.includesId(this.personalEnemy);
				let distanceToNearestEnemy = enemyList.count ? this.getDistance(theEnemy.x,theEnemy.y) : false;
				let hurt = this.healthPercent()<30;

				if( this.attitude == Attitude.CONFUSED ) {
					this.activity = 'Confused!';
					return this.thinkStumbleF(50);
				}

				if( this.attitude == Attitude.PACIFIED ) {
					this.activity = 'Pacified!';
					return Command.WAIT; //this.thinkWanderF();
				}

				if( this.attitude == Attitude.PANICKED ) {
					let dirAway = (this.dirToEntityNatural(theEnemy)+4)%Direction.count;
					this.activity = 'Panicked!';
					return this.thinkRetreat(dirAway,true) || this.thinkWanderF();
				}

				if( this.attitude == Attitude.ENRAGED ) {
					console.assert( theEnemy.id !== this.id );
					this.activity = 'Enraged!';
					if( theEnemy && !wasSmell && !wasLEP ) {
						// Note that enemyList already includes ALL friends, because enraged causes them to be included in the isMyEnemy filter.
						theEnemy = enemyList.shuffle().byDistanceFromMe().first;
					}
					if( theEnemy ) {
						this.activity = 'Enraged at '+theEnemy.name+'.';
						let c = !wasSmell && !wasLEP ? this.thinkAttack(enemyList,personalEnemy) : null;
						c = c || this.thinkApproachTarget(enemyList.first);
						if( c ) return c;
					}
					return this.thinkWanderF();
				}

				if( !personalEnemy && this.personalEnemy && this.attitude == Attitude.AGGRESSIVE ) {
					// Give up on my personal enemy if it exits my perception.
					this.personalEnemy = null;
				}

				if( !theEnemy && this.isLightHarmfulDir() ) {
					let c = this.thinkAvoidLight();
					if( c ) return c;
				}


				// OK, now all the mind control stuff is done, we need to manage our attitude a little.
				let tooClose = theEnemy && !wasSmell && !wasLEP && this.testTooClose(theEnemy.x,theEnemy.y,theEnemy.sneak);

				let farFromMaster = this.brainMaster && (
					(this.brainMaster.area.id!==this.area.id) ||
					( (enemyList.count<=0 || wasLEP || wasSmell) && !this.nearTarget(this.brainMaster,2) )
				);

				let flee = theEnemy && (
					( hurt && (this.mindset('fleeWhenHurt') || this.mindset('pack')) ) ||
					(this.attitude == Attitude.FEARFUL) ||
					(this.attitude == Attitude.HESITANT && willHesitate)
				);
				flee = flee || (personalEnemy && this.mindset('fleeWhenAttacked'))

				let packWhenNotThreatened = this.mindset('pack') && !enemyList.count;

				let pauseBesideUser = !enemyList.count && this.team==Team.GOOD && this.findAliveOthersNearby().nearMe(1).filter( e=>e.isUser ).count;

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

						// WARNING: THis isn't exactly right. It test whether the OBSERVER
						// can perceive me, not theEnemy. However in practice it is probably
						// OK as a hack for now.
						if( theEnemy.canPerceiveEntity(this) ) {
							if( this.attacker !== Attitude.HUNT || this.attitude !== Attitude.PATROL ) {
								tell(mCares,theEnemy,mSubject,this,' ',mVerb,'think',' ',mObject,theEnemy,' ',mVerb|mObject,'is',' too close!');
							}
							Anim.Above(this.id,this,StickerList.alert.img,0);
						}
						this.activity = 'Turning aggressive towards '+theEnemy.name+'.';
						this.changeAttitude( Attitude.AGGRESSIVE );
					}
				}

				if( !theEnemy && this.attitude!==this.attitudeBase ) {
					// Revert to preferred behavior once enemies are gone.
					this.activity = 'Reverting to '+this.attitudeBase+'.';
					this.changeAttitude( this.attitudeBase );
				}

				if( this.attitude == Attitude.HUNT && this.tether ) {
					delete this.tether;
				}

				if( this.mindset('greedy') ) {
					let c = this.thinkGreedy();
					if( c ) return c;
				}

				if( flee && !this.testNeverFlee ) {
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
					this.activity = 'Waiting to talk.';
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

				if( this.attitude == Attitude.HUNT && !theEnemy && !this.brainMaster ) {
					if( !this.destination ) {
						this.destination = this.pickRandomDestination();
					}
					this.activity = 'Hunting '+this.destination.name+'.';
				}

				// Go to any destination I might have.
				if( !enemyList.count && !wasLEP && this.destination ) {
					let c = this.thinkApproachTarget(this.destination);
					if( c ) return c;
				}

				// If no enemy to attack or flee, and no destination, just wander around 
				if( !enemyList.count ) {
					this.record('no enemy, wandering',true);
					this.activity = 'No enemy. Wandering.';					
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
					this.activity = 'Heading towards '+theEnemy.name+'.';					
					let c = this.thinkApproachTarget(theEnemy);
					return c || this.thinkWanderF();
				}

				// AGGRESSIVE
				// Attack if I am within reach, and aggressive or sometimes if hesitant
				let c0 = this.thinkAttack(enemyList,personalEnemy);
				if( c0 ) return c0;

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
						return Direction.toCommand(dir);
					}
					// We don't get to use regular pathfind because we found it through smell.
					return this.thinkWanderF();
				}

				this.activity = this.activity || 'Approaching '+theEnemy.name+'.';
				let c = this.thinkApproachTarget(theEnemy);
				if( c ) {
					return c;
				}
				return this.thinkWanderF();

			}

			this.command = decideCommand.apply(this);

			if( this.command == undefined ) debugger;
			this.record( this.attitude+" cmd: "+this.command );
		}
	}

	isImmune(immunityType) {
		return String.arIncludes(this.immune,immunityType);
	}
	isVuln(immunityType) {
		return String.arIncludes(this.vuln,immunityType);
	}
	isResist(immunityType) {
		return String.arIncludes(this.resist,immunityType);
	}

	takeHealing(healer,amount,healingType,quiet=false,allowOverage=false) {
		if( this.isImmune( MiscImmunity.HEALING ) ) {
			tell(mSubject,this,' can not be healed.');
			return {
				status: 'immune',
				success: false
			}
		}
		// This allows prior health bonuses that might have cause health to exceed helthMax to exist.
		if( !allowOverage ) {
			amount = Math.max(0,Math.min( amount, this.healthMax-this.health ));
		}
		this.health += amount;
		Gui.dirty('status');
		if( this.onHeal ) {
			quiet = this.onHeal(healer,this,amount,healingType);
		}
		if( !quiet ) {
			let isSelf = healer && healer.id == this.id;
			if( isSelf && amount > 0 ) {
				tell(mSubject,this,' ',mVerb,'heal',' '+Math.floor(amount)+' health.');
			}
			else {
				let result = (amount ? [' healed by ',mObject,healer,' for '+Math.floor(amount)+' health.'] : [' already at full health.']);
				let sub = mSubject;
				if( !amount && healer && healer.id == this.id ) {
					// Special case: if you are healing yourself, you're the only one who cares if you're already at full health.
					sub |= mCares;
				}
				tell(sub,this,' ',mVerb,'is',...result);
			}
		}
		return {
			healed: amount,
			status: 'healed',
			success: true
		}
	}

	calcReduction(damageType,isRanged) {
		console.assert(damageType);
		let is = (isRanged ? 'isShield' : 'isArmor');
		let f = new Finder(this.inventory).filter( item=>item.inSlot && item[is] );
		let armor = 0;
		f.forEach( item => {
			let armorEffect = item.calcArmorEffect(damageType,isRanged);
			console.assert( Number.isFinite(armorEffect.armor) );
			armor += armorEffect.armor;
		});
		return armor;
	}

	changeAttitude(newAttitude) {
		if( this.hasForcedAttitude ) {
			return;
		}
		this.attitude = newAttitude;
	}

	alertFriends(tellAbout=true) {
		let friendList = this.findAliveOthersNearby(7).isMyFriend().canPerceiveEntity();
		if( this.packId ) {
			friendList.isMyPack();
		}
		let numAlerted = 0;
		let self=this;
		friendList.forEach( entity => {
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


	takeDamage(effect,noBacksies,isOngoing) {
		let attacker 	= effect.source;
		let item 		= effect.item;
		let amount 		= effect.value;
		let damageType 	= effect.damageType;

		console.assert( typeof amount === 'number' && !isNaN(amount) ); 
		console.assert( typeof this.health === 'number' && !isNaN(this.health) ); 

		let quiet = false;

		let isCharge = false;
		if( !isOngoing && attacker && attacker.chargeDist>0 && attacker.chargeAttackMult ) {
			isCharge = true;
			amount *= attacker.chargeAttackMult;
		}

		//
		// Sneak Bonus
		//
		// Sneak damage only can happen for Quick.LITHE weapons, the very fastest. Otherwise there is a whooshing sound that victim would hear
		let isSneak = false;
		if( !isOngoing && !isCharge && attacker && !this.canPerceiveEntity(attacker) && item && item.getQuick()>=Quick.LITHE ) {
			isSneak = true;
			amount *= attacker.sneakAttackMult||2;	// perk touches stat directly.
		}

		//
		// Harm Armor
		//
		let armorHit = null;
		let armorBroke = false;
		if( this.inventory && this.damageType!=DamageType.SUFFOCATE ) {
			let armorList = new Finder(this.inventory).filter( item => item.inSlot && (item.isArmor || item.isShield) );
			// You can wear up to six types of armor, and we need them all to wear out evenly no matter how much
			// armor you're wearing. Hence this selection method.
			let index = Random.intRange(0,6);
			if( index < armorList.count ) {
				armorHit = armorList.result[index];
				let result = {};
				armorHit.checkDurability(result);
				armorHit.checkBreakChance(result);
				if( armorHit.dead ) {
					armorBroke = result;
				}
				if( !armorBroke ) {
					//tell(mSubject|mPossessive,this,' ',mObject,armorHit,' was hit.');
				}
			}
		}

		console.assert( typeof amount === 'number' && !isNaN(amount) ); 
		console.assert( typeof this.health === 'number' && !isNaN(this.health) ); 

		// Deal with armor first...
		let isRanged = !isOngoing && ( (attacker && this.getDistance(attacker.x,attacker.y) > 1) || (item && item.rangeDuration) );
		let reduction = this.calcReduction(damageType,isRanged);


		//
		// Apply Reduction
		//
		reduction = Math.min(0.8,reduction);
		amount = Math.max(1,Math.floor(amount*(1.00-reduction)));

		//
		// Apply V, I, and R
		//
		// This is NOT as thorough as the testing in applyEffect(). We should probably
		// figure out some way to merge all such tests together.
		let isVuln='',isImmune='',isResist='';
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

		// 
		if( !isOngoing && attacker && attacker.isMonsterType && (!this.brainMaster || this.brainMaster.id !=attacker.id) ) {
			// Remember that neutrals with brainFleeCombat DO want a personal enemy, not to attack, but to flee from.
			this.personalEnemy = attacker.id;
			// Stop remembering anyone else, because normally you target the lep if it is closer. So for example
			// the player could distract an enemy from their dog by attacking.
			this.justAttackedByEntity = attacker;
			delete this.lastEnemyPosition;
			this.inCombatTimer = Time.sim.time;
		}

		console.assert( typeof amount === 'number' && !isNaN(amount) ); 
		console.assert( typeof this.health === 'number' && !isNaN(this.health) ); 

		//
		// Animation of the Attack
		//
		if( amount > 0 ) {
			let dx = this.x - (attacker ? attacker.x : this.x);
			let dy = this.y - (attacker ? attacker.y : this.y);
			// WARNING! For some whacky reason this call to deltaToDeg requires -dy. Who knows why?!
			let deg = (dx===0 && dy===0 ? 0 : deltaToDeg(dx,dy));
			let mag = Math.clamp( amount/this.healthMax, 0.05, 1.0 );
			let delay = !attacker || !attacker.isMonsterType || attacker.isUser ? 0 : 0.2;
			if( attacker && (attacker.command == Command.THROW || attacker.command == Command.SHOOT || attacker.command == Command.CAST) ) {
				// This seems a little loose to me, but... maybe it will work.
				delay += attacker.rangeDuration;
			}
			// Attacker lunges at you
			let lunge = 0.2 + 0.5 * mag;
			if( attacker && attacker.isMonsterType ) {
				new Anim({
					name: 'lunge',
					follow: 	attacker,
					delay: 		delay,
					duration: 	0.15,
					onInit: 		a => { a.takePuppet(attacker); },
					onSpriteMake: 	s => { s.sPosRelDeg(deg,lunge); },
				});
			}

			// blood flies away from the attacker
			let arc = attacker ? 45 : 179;
			let piecesAnim = new Anim({
				follow: 	this,
				img: 		StickerList[this.bloodId || 'bloodRed'].img,
				delay: 		delay,
				duration: 	0.2,
				onInit: 		a => { a.create(4+Math.floor(7*mag)); },
				onSpriteMake: 	s => { s.sScale(0.20+0.10*mag).sVel(Random.floatRange(deg-arc,deg+arc),4+Random.floatRange(0,3+7*mag)); },
				onSpriteTick: 	s => { s.sMoveRel(s.xVel,s.yVel); }
			});


			// You also jump back and quiver
			new Anim({
				follow: 	this,
				delay: 		delay,
				duration: 	0.1,
				onInit: 		a => { a.takePuppet(this); },
				onSpriteMake: 	s => { },
				onSpriteTick: 	s => { s.sPosRelDeg(deg,lunge/2).sQuiver(0.05,0.1+mag*0.1); },
			});

			// And if you are killed then you shrink/fade
			if( amount >= this.health ) {
				new Anim({
					follow: 	this,
					img:		ImageRepo.getImg(this),
					delay: 		delay+0.2,
					duration: 	0.3,
					onInit: 		a => a.create(1),
					onSpriteMake: 	s => { },
					onSpriteTick: 	s => s.sScale( (this.scale||1) * s.sOverTime(1.0,0.4) )
				});
			}
		}

		console.assert( typeof amount === 'number' && !isNaN(amount) ); 
		console.assert( typeof this.health === 'number' && !isNaN(this.health) ); 

		if( isVuln ) {
			quiet = true;
			tell(mSubject,this,' ',mVerb,'is',' vulnerable to '+isVuln+', and ',mVerb,'take',' '+amount+' damage!');
			if( !attacker || attacker.id!==this.id ) {
				new Anim({
					follow: 	this,
					img: 		StickerList.showVulnerability.img,
					duration: 	0.2,
					delay: 		item ? item.rangeDuration || 0 : 0,
					onInit: 		a => { a.create(1); },
					onSpriteMake: 	s => { s.sScale(0.75); },
					onSpriteTick: 	s => { }
				});
			}
		}
		else
		if( isImmune ) {
			quiet = true;
			tell(mCares,attacker,mSubject,this,' ',mVerb,'is',' immune to '+isImmune);
			if( !attacker || attacker.id!==this.id ) {
				new Anim({
					follow: 	this,
					img: 		StickerList.showImmunity.img,
					duration: 	0.2,
					delay: 		item ? item.rangeDuration || 0 : 0,
					onInit: 		a => { a.create(1); },
					onSpriteMake: 	s => { s.sScale(0.75); },
					onSpriteTick: 	s => { }
				});
			}
		}
		else
		if( isResist ) {
			quiet = true;
			tell(mSubject,this,' ',mVerb,'resist',' '+isResist+', but ',mVerb,'take',' '+amount+' damage.');
			if( !attacker || attacker.id!==this.id ) {
				new Anim({
					follow: 	this,
					img: 		StickerList.showResistance.img,
					duration: 	0.2,
					delay: 		item ? item.rangeDuration || 0 : 0,
					onInit: 		a => { a.create(1); },
					onSpriteMake: 	s => { s.sScale(0.75); },
					onSpriteTick: 	s => { }
				});
			}
		}

		//
		// Health Reduced
		//
		console.assert( typeof amount === 'number' && !isNaN(amount) ); 
		console.assert( typeof this.health === 'number' && !isNaN(this.health) ); 
		this.health -= amount;
		if( this.invulnerable ) {
			entity.health = Math.max(1,entity.healthMax)
		}
		if( this.immortal ) {
			this.health = Math.max(1,this.health);
		}
		if( !isOngoing ) {
			this.takenDamage = amount;
			this.takenDamageType = damageType;
			this.takenDamageFromId = attacker ? attacker.id : 'nobody';
		}

		if( !isOngoing && amount > 0 ) {
			if( this.brainDisengageAttempt ) {
				this.brainDisengageFailed = true;
			}
			if( this.attitude == Attitude.HESITANT || this.attitude == Attitude.WANDER || this.attitude == Attitude.AWAIT || this.attitude == Attitude.PACIFIED) {
				this.changeAttitude(Attitude.AGGRESSIVE);
			}
			if( this.mindset('alert') ) {
				this.alertFriends();
			}
		}

		if( !isOngoing && this.onAttacked && !noBacksies ) {
			quiet = this.onAttacked.call(this,attacker,amount,damageType);
		}
		if( !isOngoing && !quiet ) {
			let attackVerb = damageType;
			let qualifier = '';
			if( item && item.attackVerb && effect.isEffectOnAttack ) {
				attackVerb = item.attackVerb;
				qualifier = ' '+damageType;
			}
			if( attacker ) {
				tell(mSubject|mCares,attacker,' ',mVerb,attackVerb,' ',mObject|mCares,this,amount<=0 ? ' with no effect!' : ' for '+amount+qualifier+' damage!'+(isSneak?' Sneak attack!' : '')+(isCharge?' Charge attack!' : '') );
			}
			else {
				tell(mSubject|mCares,effect,' ',mVerb,attackVerb,' ',mObject|mCares,this,amount<=0 ? ' with no effect!' : ' for '+amount+qualifier+' damage!'+(isSneak?' Sneak attack!' : '')+(isCharge?' Charge attack!' : '') );
			}
		}

		let isRetaliation = 0;
		if( !isOngoing && !noBacksies && attacker && attacker.isMonsterType && this.inventory ) {
			let is = isRanged ? 'isShield' : 'isArmor';
			let retaliationEffects = new Finder(this.inventory).filter( item => item.inSlot && item[is] );
			retaliationEffects.forEach( item => {
				if( item.effect && item.effect.isHarm ) {
					console.assert( item.chanceEffectFires !== undefined );
					let fireEffect = Random.chance100(item.chanceEffectFires);
					if( fireEffect ) {
						item.trigger( attacker, this, 'retaliate', item.effect );
						isRetaliation++;
					}
				}
			});
		}

		// This should be last so that your sneak attacks can function properly.
		if( !isOngoing && attacker && attacker.invisible ) {
			let turnVisibleEffect = {
				op: 'set',
				stat: 'invisible',
				value: false,
				duration: 10,
			};
			DeedManager.forceSingle(turnVisibleEffect,attacker,null,null);
		}

		return {
			status: 	isImmune ? 'immune' : 'damaged',
			success: 	!isImmune,
			amount: 	amount,
			damageType: damageType,
			isRanged: 	isRanged,
			reduction: 	reduction,
			isSneak: 	isSneak,
			isCharge: 	isCharge,
			isImmune: 	isImmune,
			isResist: 	isResist,
			isVuln: 	isVuln,
			isRetaliation: isRetaliation,
			armorHit:	armorHit,
			armorBroke:	armorBroke,
			killed: 	this.health <= 0,
		}
	}

	getShoveModifiers() {
		// Bigger things resist being pushed, and smaller are easier to push.
		let xShove = 1.0;
		let reason = 'shoved.';

		xShove *= 1 / (this.size||1);
		if( this.size > 1 ) {
			reason = 'shoved but is large.';
		}
		if( this.size < 1 ) {
			reason = 'shoved extra because small.';
		}


		if( this.travelMode=='fly' ) {
			xShove *= 1.5;
			reason = 'shoved farther because of flight.';
		}
		if( this.body == 'quadruped' ) {
			xShove *= 0.6;
			reason = 'shoved but resists with four legs.';
		}
		if( this.body == 'multiped' ) {
			xShove *= 0.30;
			reason = 'shoved but resists with many legs.';
		}

		if( this.matter == 'metal' ) {
			xShove *= 0.5;
			reason = 'shoved but is heavy metal.';
		}

		if( this.xShove !== undefined ) {
			console.assert( Number.isFinite(this.xShove) );
			xShove *= this.xShove;
			reason = this.xShoveReason || reason;
		}

		return [xShove,reason];
	}

	takeShove(attacker,item,distance,towards=1) {

		if( this.isIncorporeal && !attacker.isIncorporeal ) {
			tell(mSubject,this,' ',mVerb,'is',' ','incorporeal and ignore shove.');
			return {
				status: 'incorporeal',
				success: false
			}
		}

		let source = attacker || item.ownerOfRecord;

		let [dx,dy] = Distance.getNormalized(this.x-source.x,this.y-source.y);
		if( dx==0 && dy==0 ) {
			debugger;
			return {
				status: 'onOwnSquare',
				success: false
			}
		}

		let [xShove,reason] = this.getShoveModifiers();
		distance = Math.round(distance*xShove);

		let success = true;
		let bonked = false;
		let fx = this.x;
		let fy = this.y;
		let distanceRemaining = distance;

		let dist = Distance.get(dx,dy);
		while( success && distanceRemaining > 0 ) {
			fx += dx*towards;
			fy += dy*towards;

			//setMoveTarget(area,x,y,instantly,attackAllowed,weapon,voluntary,swappingWith) {
			let result = this.setMoveTarget(
				this.area, Math.toTile(fx), Math.toTile(fy),
				false, false, null, false, null
			);
			success = result.success;
			if( !success ) { bonked = true; break; }
			distanceRemaining -= 1;
		}
		tell(mSubject,this,' ',mVerb,'is',' ',bonked ? 'shoved '+(distance-distanceRemaining)+' but blocked.' : reason);

		let impactForce = distanceRemaining / xShove;	// xShove must un-do it alteration of the force.

		if( impactForce > 0 ) {
			// Shove stuns for one round for each square you didn't travel.
			let effect = new Effect(this.area.depth, {
				op: 'set',
				stat: 'stun',
				value: true,
				duration: Math.max(1,impactForce),
				name: 'stun',
				description: 'stunned',
				isSecondary: true,
			});
			effectApply( effect, this, attacker, item, 'shoveStun' );
		}

		return {
			status: 'shoved',
			success: true,
			distance: distance
		}
	}

	takeTeleport(landing) {
		let xOld = this.x;
		let yOld = this.y;

		if( !landing ) {
			let safeSpot = pVerySafe(this.map);
			let pos = this.map.pickPosBy(1,1,1,1,safeSpot);
			if( pos !== false ) {
				landing = { x: pos[0], y: pos[1] };
			}
		}
		let moveResult = null;
		if( landing ) {
			moveResult = this.moveToInstantly(null,landing.x,landing.y);
		}
		return {
			status: landing ? 'teleported' : 'noteleport',
			success: !!landing,
			moveResult: moveResult,
			xOld: xOld,
			yOld: yOld,
			x: this.x,
			y: this.y
		}
	}

	takeGateEffect(effect) {
		let planDefinitionFn = () => {
			console.assert(effect.allowAreaCreate)
			let plan = {
				areaId:  effect.toAreaId,
				themeId: effect.toThemeId,
				depth:   effect.toDepth
			}
			return plan;
		}

		let newArea = this.area.world.createAreaAsNeeded( effect.toAreaId, planDefinitionFn );
		console.assert(newArea);
		if( effect.gateId ) {
			let gate = this.map.findItem(this).filter(i=>i.id==effect.gateId).first;
			let pos = gate.oneway ? [gate.x,gate.y] : [gate.toGate.x,gate.toGate.y];
			effect.xTarget = pos[0];
			effect.yTarget = pos[1];
		}

		let result = this.requestGateTo( newArea, effect.xTarget, effect.yTarget );
		result.endNow = true;
		return result;
	}

	takeBePossessed(effect,toggle) {

		let fieldsToTransfer = { control:1, name:1, team: 1, brainMindset: 1, brainAbility: 1, visCache: 1, experience: 1, isChosenOne: 1, strictAmmo: true };

		let source = effect.source;
		console.assert(source);

		// Remove possession.
		if( !toggle ) {
			console.assert( source.isPossessing );
			if( this.userControllingMe ) {
				this.userControllingMe.takeControlOf(source);
			}
			Object.copySelected( source, this, fieldsToTransfer );
			Object.copySelected( this, this.oldMe, fieldsToTransfer );
			delete this.teamApparent;
			delete this.oldMe;
			source.isPossessing = false;
			tell(mSubject,source,' ',mVerb,'leave',' the mind of ',mObject,this,'.');
			return {
				status: 'unpossessed',
				success: true
			}
		}

		// Start possession
		if( this.isMindless || this.isUndead ) {
			tell(mSubject,this,' ',mVerb,'is',' has no mind to possess!');
			return {
				status: 'nomind',
				success: false
			}
		}
		if( this.isImmune('ePossess') || this.isImmune('possess')) {
			tell(mSubject,this,' ',mVerb,'is',' immune to possession!');
			return {
				status: 'immune',
				success: false,
			}
		}
		if( source.id == this.id || source.isPossessing || this.oldMe ) {
			tell(mSubject,this,' ',mVerb,'is',' already possessing!');
			return {
				status: 'alreadypossessing',
				success: false,
			}
		}
		tell(mSubject,source,' ',mVerb,'enter',' the mind of ',mObject,this,'.');
		this.oldMe = Object.copySelected( {}, this, fieldsToTransfer );
		this.teamApparent = this.team;
		Object.copySelected( this, source, fieldsToTransfer );
		if( source.userControllingMe ) {
			source.userControllingMe.takeControlOf(this);
		}
		source.isPossessing = true;
		source.control = Control.EMPTY;
		source.visCache = null;
		source.name = 'Mindless husk';
		return {
			status: 'possessed',
			success: true
		}
	}

	vanishIntoPit() {
		if( this.isUser ) {
			return false;
		}
		this.deathPhrase = [mSubject,this,' ',mVerb,'vanish',' into the pit.'];
		this.vanish = true;
		this.commandResult.vanish = true;
	}


	isMyHusk(entity) {
		return this.oldMe && this.oldMe.id == entity.id;
	}

	getDodge() {
		if( this.stun || this.attitude == Attitude.ENRAGED || this.attitude == Attitude.CONFUSED ) {
			return Quick.CLUMSY;
		}
		return Number.isFinite(this.dodge) ? this.dodge : Quick.NORMAL
	}

	getRange(item) {
		let rangeId = item.typeId+'Range';
		return this[rangeId] || item.range || Rules.RANGED_WEAPON_DEFAULT_RANGE;
	}

	getRange2(item) {
		let range2 = (item.effect ? item.effect.range2 : false) || item.range2;
		return Number.isFinite(range2) ? range2 : false;
	}

	calcDefaultWeapon() {
		let weapon = new Finder(this.inventory).filter( item=>item.inSlot==Slot.WEAPON ).first || this.naturalMeleeWeapon;
		return weapon;
	}
	
	calcBestWeapon(target) {
		let self = this;
		let weaponList = new Finder(this.inventory).filter( item => {
			if( !item.owner.isMonsterType || item.owner.id != self.id ) debugger;
			if( item.isWeapon && this.bodySlots[Slot.WEAPON] ) return true;
			if( (item.isSpell || item.isPotion) && item.effect && item.effect.isHarm ) return true;
			return false;
		});
		// Exclude any weapon that I can not personally use
		weaponList.filter( item => {
			if( item.mayCast && !this.able('cast') ) return false;
			if( item.mayThrow && !this.able('throw') ) return false;
			if( item.mayShoot && !this.able('shoot') ) return false;
			if( item.mayGaze && !this.able('gaze') ) return false;
			return true;
		});
		// Don't use non-quick weapons on quick targets
		weaponList.filter( item => item.getQuick() >= target.getDodge() );
		// We now have a roster of all possible weapons. Eliminate those that are not charged.
		weaponList.filter( item => !item.rechargeLeft );
		// Any finally, do not bother using weapons that can not harm the target.
		weaponList.filter( item => {
			if( !item.effect ) {
				return true;
			}
			// WARNING! This does not check all possible immunities, like mental attack! Check the effectApply() function for details.
			let isVuln,isImmune,isResist;
			[isVuln,isImmune,isResist] = target.assessVIR(item,item.effect.damageType);
			return !isImmune;
		});
		// remove any ranged weapon or reach weapon with an obstructed shot
		// WARNING! For the naturalWeapon this gets ignored, because once all weapons are
		// eliminated the natural weapon is the fallback.
		weaponList.filter( item => {
			if( Random.chance100(this.brainIgnoreClearShots||0) ) return false;
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
			// NOTE that this weapon might still not be quick enough to hit the opponent.
		}
		console.assert( !weapon.rechargeLeft || weapon.isNatural );
//		console.log( this.typeId+' picked '+(weapon.typeId || weapon.name)+' with recharge '+weapon.rechargeLeft );

		return weapon;
	}

	itemCreate(lootSpec) {
		let itemList = Inventory.lootGenerate(lootSpec,this.level);
		return  itemList[0];
	}

	itemCreateByType(type,presets,inject) {
		if( type.isRandom ) debugger;
		if( !Number.isFinite(this.level) || (this.level<0 || this.level>Rules.maxCharacterLevel) ) debugger;
		let item = new Item( this.level, type, presets, inject );
		item = item.giveTo(this,this.x,this.y);
		return item;
	}

	partsGenerate() {
		if( this.isIncorporeal || this.isEnergy ) {
			// Eventually you only get parts from incorporeal and energy beings when you kill them with the right
			// kind of silk touch weaponry.
			return [];
		}
		let partCount = Random.intRange(0,1);
		let partFrom = 'is'+String.capitalize(this.typeId); 
		return Inventory.lootGenerate( partCount+'x part '+partFrom, this.level )
	}

	deathLootGenerate() {
		let itemList = new Finder(this.inventory).isReal().all;
		itemList.push( ...Inventory.lootGenerate( this.loot, this.level ) )
		itemList.push( ...this.partsGenerate() );
		return itemList;
	}


	actAttack(target,weapon) {
		console.assert(weapon);
		console.assert(weapon.isWeapon);
		let effect = weapon.getEffectOnAttack();
		let result = weapon.trigger( target, this, Command.ATTACK, effect );
		return result;
	}
	
	actHarvest(item) {
		console.assert(item && item.mayHarvest);
		if( item.rechargeLeft ) {
			tell('This ',mSubject,item,' ',mVerb,'is',' not ready to harvest.');
			return {
				status: 'harvest',
				success: false
			};
		}

		let harvestState = (item.onHarvest || nop)(this,item);
		if( harvestState == 'disallow' ) {
			return { status: 'harvest', success: false };
		}

		let itemList = [];
		if( harvestState != 'noLoot' ) {
			itemList = Inventory.lootTo( this, item.harvestLoot, this.area.depth, item, false );
		}
		item.resetRecharge();
		item.harvestReps = Math.max(0,(item.harvestReps||0)-1);
		if( !item.harvestReps ) {
			item.destroy();
		}
		return {
			status: 'harvest',
			success: true,
			itemList: itemList
		}
	}

	actPickup(item) {
		if( !item ) debugger;

		if( !this.able('pickup') ) {
			tell(mSubject,this,' ',mVerb,'attempt',' to pick something up, but can not!');
			return {
				status: 'pickupUnable',
				success: false
			};
		}

		if( item.onPickup ) {
			let allow = item.onPickup.call(this);
			if( !allow ) return {
				status: 'itemDeniedPickup',
				success: false
			}
		}

		if( !item.isCorpse ) {
			tell(mSubject,this,' ',mVerb,'pick',' up ',mObject|mBold,item,'.');
		}

		if( item.isCorpse ) {
			let corpse = item.usedToBe;
			if( !corpse || (!corpse.loot && !corpse.inventory.length) ) {
				tell(mSubject,this,' ',mVerb,'find',' nothing on ',mObject,item);
				item.destroy();
				return {
					status: 'nothingOnCorpse',
					success: true
				};
			}
			// Prune out any fake items like natural weapons.
			if( this.experience !== undefined ) {
				this.experience += corpse.level;
			}

			let itemList = corpse.deathLootGenerate();
			Inventory.giveTo( this, itemList, item, false );
			item.destroy();
			return {
				status: 'pickup',
				isCorpse: true,
				success: true
			}
		}
		item = item.giveTo(this,this.x,this.y);
		return {
			status: 'pickup',
			item: item,
			success: true
		}
	}

	getAmmoName(ammoType) {
		return ammoType.replace( /\s*is(\S*)\s*/, function(whole,name) {
			return name;
		}).toLowerCase();
	}

	actThrow(item,target) {
		let result = {
			status: 'throw',
			success: false
		}
		if( !this.able('throw') ) {
			tell(mSubject,this,' ',mVerb,'attempt',' to throw, but can not!');
			result.status = 'throwUnable';
			return result;
		}

		this.lastAttackTargetId = target.id;
		// Make sure we're only taking one from their item stack
		item = item.single();
		// Give it to the map. This runs the animation.
		item = item.giveToSingly(this.map,target.x,target.y);

		// Can we catch the thrown item?
		if( Random.chance100(target.catchThrown||target.stopThrown||target.stopIncoming||0) ) {
			let whoDidIt = target;
			if( target.isMonsterType ) {
				let deed = target.deedFind( deed=>['catchThrown','stopThrown','stopIncoming'].includes(deed.stat) );
				if( deed ) {
					whoDidIt = deed;
				}
			}
			let verb = target.catchThrown ? 'catch' : 'stop';
			if( target.catchThrown ) {
				item.giveTo( target, target.x, target.y );
			}
			else {
				let dir = Direction.predictable(this.x-target.x,this.y-target.y);
				item.giveTo( target.map, target.x+Direction.add[dir].x, target.y+Direction.add[dir].y ); 
			}

			tell(mSubject,this,' ',mVerb,'throw',' ',mObject,item,' and ',mSubject,whoDidIt,' ',mVerb,verb,' it!');
			result.caught = true;
			result.catcher = target;
			result.success = true;
			return result;
		}

		// Determine the effect this item will have at that place.
		let effect = item.isWeapon ? item.getEffectOnAttack() : item.effect;
		// Do the effect
		result = item.trigger( target, this, Command.THROW, effect );

		if( !item || item.dead ) {
			// potions, for example, will be consumed.
		}
		else {
			// Note that giving it to the map ALWAYS might foil things like catching items, or a figurine being picked up by its creation.
			if( item.owner.isMap ) {
				// This will cause it to bunch up as needed.
				item.giveTo( this.map, item.x, item.y );
			}
		}
		return result;
	}

	actDig(target) {
		let result = {
			status: 'dig',
			success: false
		}
		if( target.isItemType && (target.isPlant || target.isMushroom)) {
			target.giveTo(this,this.x,this.y);
			tell(mSubject,this,' ',mVerb,'dig',' up ',mObject,target);
		}
	}

	actTrigger(item,target) {
		let result = {
			status: 'trigger',
			success: false
		}
		item.x = this.x;
		item.y = this.y;
		result = item.trigger(target||this,this,Command.TRIGGER);
		return result;
	}

	actCraft(item,target) {
		let result = {
			status: 'craft',
			success: false
		}
		if( !this.craft ) {
			return;
		}
		item.x = this.x;
		item.y = this.y;
		result = this.craft.operate.call(this,item,target);
		return result;
	}

	actGaze(item) {
		let result = {
			status: 'gaze',
			success: false
		}
		if( !this.able('gaze') ) {
			tell(mSubject,this,' ',mVerb,'attempt',' to gaze, but can not!');
			result.status = 'gazeUnable';
			return result;
		}
		item.x = this.x;
		item.y = this.y;
		tell(mSubject,this,' ',mVerb,'gaze',' into ',mObject,item,'.');
		result = item.trigger(this,this,Command.GAZE);
		return result;
	}

	actCast(item,target) {
		let result = {
			status: 'cast',
			success: false
		}
		if( !this.able('cast') ) {
			tell(mSubject,this,' ',mVerb,'attempt',' to cast, but can not!');
			result.status = 'castUnable';
			return result;
		}
		this.lastAttackTargetId = target.id;
		item.x = this.x;
		item.y = this.y;
		tell(mSubject,this,' ',mVerb,'cast',' '+item.effect.name+' at ',mObject,target,'.');
		return item.trigger(target,this,Command.CAST);
	}

	shotClear(sx,sy,tx,ty) {
		let self = this;
		function test(x,y) {
			let tile = self.map.tileTypeGet(x,y);
			return tile && tile.mayFly;
		}
		return shootRange(sx,sy,tx,ty,test);
	}

	hasAmmo(weapon) {
		return ( !weapon.ammoType || new Finder(this.inventory).filter(i=>i[weapon.ammoType]).count || !this.strictAmmo );
	}

	pickOrGenerateSingleAmmo(weapon) {
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
				let ammoList = Inventory.lootTo( this, weapon.ammoSpec, this.level, this, true );
				console.assert(ammoList[0]);
				ammoList[0].breakChance = 100;	// avoid generating heaps of whatever is being used for ammo!
				return ammoList[0];
			}
		}
		return f.first.single();
	}

	actShoot(item,target) {
		let result = {
			status: 'shoot',
			success: false
		}
		console.assert(item.ammoType);

		if( !this.able('shoot') ) {
			tell(mSubject,this,' ',mVerb,'attempt',' to shoot, but can not!');
			result.status = 'shootUnable';
			return result;
		}

		if( !this.shotClear(this.x,this.y,target.x,target.y) ) {
			tell(mSubject,this,' ',mVerb,'has',' no shot!');
			result.status = 'noShot';
			return result;
		}

		this.lastAttackTargetId = target.id;

		// Which ammo should I use for this shot?
		let ammo = this.pickOrGenerateSingleAmmo(item);

		// Ammo not available
		if( ammo == false ) {
			tell(mSubject,this,' ',mVerb,'lack',' any '+this.getAmmoName(item.ammoType)+'s to shoot!');
			result.status = 'noAmmo';
			return result;
		}

		// The ammo is the item
		if( ammo == true ) {
			// This weapon uses no ammunition. It simply takes effect.
			ammo = item.single();
			result.ammoIsTheItem = true;
		}
		else {
			// The ammunition is an item from inventory
			ammo.shooter = item;
			// This will move the ammunition to the map, and also cause its flight to animate
			ammo = ammo.giveToSingly(this.map,target.x,target.y);
			result.ammoMadeOrExists = true;
		}

		// Can the target catch the shot?
		if( Random.chance100(target.catchShot||target.stopShot||target.stopIncoming||0) ) {
			delete ammo.shooter;
			if( target.catchShot ) {
				ammo.giveTo( target, target.x, target.y );
			}
			else {
				let dir = Direction.predictable(this.x-target.x,this.y-target.y);
				ammo.giveTo( target.map, target.x+Direction.add[dir].x, target.y+Direction.add[dir].y ); 
			}
			tell(mSubject,this,' ',mVerb,'shoot',' ',mObject,ammo,' and ',mSubject,target,' ',mVerb,'catch',' it!');
			result.caught = true;
			result.catcher = target;
			result.success = true;
			return result;
		}

		// Determine what effect this ammo will have at that spot
		let effect = ammo.isWeapon ? ammo.getEffectOnAttack() : ammo.effect;
		// Do the effect.
		// WARNING: This result.effectResult thing is not the same as how throwing does it. WHY?
		result.effectResult = ammo.trigger( target, this, this.command, effect, Command.SHOOT );

		if( !ammo.dead ) {
			// This will cause it to bunch appropriately.
			if( target.isMonster && target.inventory ) 
			ammo.giveTo( this.map, ammo.x, ammo.y );
		}
		result.success = true;
		return result;
	}
	actUse(item) {
		let result = {
			status: 'use',
			success: false
		};
		// Remove anything already worn or used.
		if( item.inSlot ) {
			if( item.isNatural ) {
				// You can not doff natural weapons like your hands. Instead, the donning of
				// another weapon will auto-doff the natural weapon
				return result;
			}
			this.doff(item);
			result.doff   = item;
			result.success = true;
		}
		else
		if( item.slot && this.bodySlots ) {
			if( !this.bodySlots[item.slot] ) {
				tell( mSubject,this,' ',mVerb,'has',' no way to use the ',mObject,item );
				result.status = 'noWayToUse';
			}
			else {
				result.doff = [];
				while( this.getItemsInSlot(item.slot).count >= this.bodySlots[item.slot] ) {
					let itemToRemove = this.getItemsInSlot(item.slot);
					let doffResult = this.doff(itemToRemove.first);
					result.doff.push(doffResult);
				}
				result.donResult = this.don(item,item.slot);
				result.success = true;
			}
		}
		return result;
	}

	actBuy(item,seller) {
		let result = {
			status: 'buy',
			success: false,
			item: item,
		}
		console.assert( item.owner && !item.owner.isMap );
		console.assert( seller.id == item.owner.id );
		console.assert( new Finder(seller.inventory).isId(item.id).count );
		let price = Rules.priceWhen('buy',item);
		result.price = price;
		if( price <= this.coinCount ) {
			this.coinCount = (this.coinCount||0) - price;
			seller.coinCount = (seller.coinCount||0) + price;
			item = item.giveTo(this,this.x,this.y);
			result.success = true;
		}
		else {
			tell(mSubject,this,' ',mVerb,'do',' not have enough coin.');
			result.notEnoughCoin = true;
		}
		return result;
	}

	actSell(item,buyer) {
		let result = {
			status: 'sell',
			success: false,
			item: item
		}
		if( item.noSell ) {
			result.noSell = item.noSell;
			return result;
		}
		if( item.isPlot ) {
			result.isPlot = item.isPlot;
			return result;
		}
		let price = Rules.priceWhen('sell',item);
		console.assert( new Finder(this.inventory).isId(item.id).count );
		buyer.coinCount = (buyer.coinCount||0) - price;
		this.coinCount = (this.coinCount||0) + price;
		item = item.giveTo(buyer,buyer.x,buyer.y);
		result.itemFinal = item;
		result.success = true;
		return result;
	}
	actQuaff(item) {
		item.x = this.x;
		item.y = this.y;
		tell(mSubject,this,' ',mVerb,'quaff',' ',mObject,item);
		return item.trigger(this,this,this.command);
	}

	actEat(food) {
		let result = {
			status: 'eat',
			success: false
		}
		let provider = food.ownerOfRecord;
		console.assert(food && food.isEdibleBy(this));
		tell(mSubject,this,' ',mVerb,'begin',' to eat ',mObject,food,' (4 turns)');
		food = food.giveToSingly(this,this.x,this.y);
		let eatEffect = {
			op: 'set',
			stat: 'attitude',
			value: Attitude.BUSY,
			duration: 4,
			description: 'eating',
			icon: StickerList.showEat.img,
			onEnd: (deed) => {
				if( !deed.completed() ) {
					return;
				}
				// Eating a corpse gives you its inventory by default. Oozes do this.
				// However, other 
				if( food.isCorpse ) {
					let corpse = food.usedToBe;
					let itemList = corpse.deathLootGenerate();
					if( this.eatenFoodToInventory ) {
						Inventory.giveTo( this, itemList, corpse, false );
					}
					else {
						Inventory.giveTo( this.map, itemList, corpse, true );
					}
					food.destroy();
					return;
				}
				// Even though corpses are food, nobody is their "ownerOfRecord" and so a pet
				// eating a corpse will not see the killer as their master
				if( food.isEdibleBy(this) && this.isPet && provider && (provider.teamApparent || provider.team)==this.team ) {
					this.setMaster(provider);
				}
				let nutrition = Math.max(1,Math.floor(Rules.foodAidByLevel*(food.nutrition||food.level||1)));
				let healEffect = { basis: 'eHealing', damage: nutrition };
				effectApply( healEffect, this, this, null, 'healFromEat' );
				if( this.eatenFoodToInventory ) {
				}
				else {
					food.destroy();
				}
			}
		};
		effectApply( eatEffect, this, this, null, Command.EAT );
		result.status = true;
		return result;
	}

	actLoot(item) {
		let result = {
			status: 'loot',
			success: false
		};
		if( item.usedToBe ) {
			result = Inventory.lootTo( this, item.usedToBe.loot || '',item.usedToBe.level,item);
		}
		return result;
	}

	actDrop(item) {
		let result = {
			status: 'drop',
			dropCount: 0,
			success: false
		}
		if( item.isPlot || item.noDrop ) {
			tell( mSubject,this,' ',mVerb,'may',' not drop the ',mObject,item,'.' );
			result.isPlot = true;
			return result;
		}
		let type = this.findFirstCollider('walk',this.x,this.y);
		if( type !== null ) {
			tell(mSubject,this,' may not drop anything here.');
			result.notAllowedHere = true;
			return result;
		}

		let itemList = [item];
		if( !item.dead && item.lootOnDrop ) {
			itemList = Inventory.lootGenerate( item.lootOnDrop, item.level );
			item.destroy();
		}

		itemList.forEach( item => {
			if( !item.dead ) {
				item = item.giveTo(this.map,this.x,this.y);
				++result.dropCount;
			}
		});
		result.success = true;
		result.x = this.x;
		result.y = this.y;
		return result;
	}

	actLoseTurn() {
		if( this.control !== Control.EMPTY ) {
			tell(mSubject|mCares,this,' ',mVerb,'spend', ' time recovering.');
		}
		return {
			status: 'loseturn',
			success: true
		}
	}

	actWait() {
		tell(mSubject|mCares,this,' ',mVerb,'wait','.');
		return {
			status: 'wait',
			success: true
		}
	}

	createGateEffect( gate ) {
		console.assert( gate.toAreaId || (gate.toThemeId && gate.allowAreaCreate) );
		let gateEffect = {
			op:			'gate',
			duration:	0,
			isTac:		true,
			gateId:		gate.id,			// if empty you MUST specify xTarget,yTarget
			toAreaId:	gate.toAreaId,
			toDepth:	gate.toDepth,		// will be overridden by the plan 
			toThemeId:	gate.toThemeId,		// used to be .themeId. That can't have been right!
			oneway:		gate.oneway,
			xTarget:	gate.xTarget,		// Two-way gates will ignore
			yTarget:	gate.yTarget,		// Two-way gates will ignore
			allowAreaCreate: gate.allowAreaCreate
		};
		return gateEffect;
	}


	actEnterGate(gate) {
		tell(mSubject,this,' ',mVerb,gate.useVerb || 'teleport',' ',mObject,gate);
		let gateEffect = this.createGateEffect( gate );
		let result     = effectApply( gateEffect, this );
		result.enterGate = gate;
		return result;
	}

	actBusy() {
		let result = {
			status: 'busy',
			success: true
		};
		let busy = this.deedBusy();
		if( busy && busy.icon ) {
			Anim.FloatUp(this.id,this,busy.icon);
		}
		return result;
	}

	leaveTrail(areaPrior,xPrior,yPrior,result) {
		if( this.map.findItemAt(xPrior,yPrior).filter( item=>item.isVariety(this.trail) ).count ) {
			return;
		}
		let trailList = Inventory.lootGenerate( this.trail, this.level );
		console.assert( trailList.length == 1 );
		let trail = trailList[0];
		// Although this is set in item constructor, setting it here allows trails to not specify their
		// exstence time and still work.
		trail.existenceLeft = trail.existenceTime || 10;
		trail.giveTo( areaPrior.map, xPrior, yPrior );
		result.trail = trail.typeId;
	}

	setMoveTarget(area,x,y,instantly,attackAllowed,weapon,voluntary,swappingWith=null) {
		this.areaMove = area || this.area;
		this.xMove = x;
		this.yMove = y;

		this.moveInstantly       = instantly;
		this.moveAttackAllowed   = attackAllowed;
		this.moveWeapon          = weapon;
		this.moveVoluntary       = voluntary;
		this.moveSwappingWith    = swappingWith;

		return this.onMove();
	}

	setMoveTargetDir(dir,weapon,voluntary) {
		let x = this.x + Direction.add[dir].x;
		let y = this.y + Direction.add[dir].y;
		return this.setMoveTarget(null,x,y,false,true,weapon,voluntary);
	}

	moveToInstantly(area,x,y) {
		return this.setMoveTarget(area,x,y,true,false,null,true);
	}

	// Returns false if the move fails. Very important for things like takeShove().
	enterTilePrelims(areaPrior,xPrior,yPrior,areaChanged,context) {
		let target          = context.target;
		let attackAllowed   = this.moveAttackAllowed;
		let weapon          = this.moveWeapon;
		let moveVoluntary   = this.moveVoluntary;
		let swappingWith	= this.moveSwappingWith;

		let bump = function(entity,incCount=true) {
			if( !this.isUser ) {
				// The bump system interferese with pathfind's inferior.superior system, so only let
				// the user do it.
				return;
			}
			this.lastBumpedId = entity.id;
			entity.bumpBy = this.id;
			if( incCount ) {
				entity.bumpCount = (entity.bumpCount||0)+1;
			}
			entity.bumpDir = Direction.predictable(entity.x-xPrior,entity.y-yPrior);
			if( entity.bumpDir === false ) {
				debugger;
			}
		}.bind(this);

		function wantToAttack(target) {

			// Attack enemies or neutrals
			let wantToAttack = this.isMyEnemy(target);
			if( this.isUser && this.isMyNeutral(target) ) {
				wantToAttack = true;
			}
			if( this.team == Team.NEUTRAL || this.mindset('fleeWhenAttacked') ) {
				wantToAttack = false;
			}

			return wantToAttack;
		}

		function resultImmobility() {
			Anim.FloatUp( this.id, this, EffectTypeList.eImmobilize.icon );
			tell(mSubject,this,' ',mVerb,'is',' immobilized!');
			return {
				status: 'immobile',
				success: false
			}
		}

		function resultAttack(target,weapon) {
			if( weapon.mayShoot ) {
				this.command = Command.SHOOT;
				this.commandItem = weapon;
				this.commandTarget = target;
				return {
					status: 'command=shoot'
				}
			}
			if( weapon.mayCast ) {
				this.command = Command.CAST;
				this.commandItem = weapon;
				this.commandTarget = target;
				return {
					status: 'command=cast'
				};
			}
			if( weapon.mayThrow && (!weapon.inSlot || weapon.inSlot==Slot.AMMO) ) {
				this.command = Command.THROW;
				this.commandItem = weapon;
				this.commandTarget = target;
				return {
					status: 'command=throw'
				}
			}
			this.command = Command.ATTACK;
			this.commandItem = weapon;
			this.commandTarget = target;
			return {
				status: 'command=attack'
			}
		}

		function resultBumpMonster(target) {
			console.assert(target.isMonsterType);
			bump(target,true);
			let bumpResult = (target.onBump || bonk)(this,target);
			return {
				status: 'bumped',
				target: target,
				bumpResult: bumpResult,
				success: false
			}
		}

		function resultBumpItem(collider) {
			this.lastBumpedId = collider.id;
			if( collider.isTable ) {
				// Look for a merchant on the far side of the table. Special case.
				let bx = collider.x + (collider.x-xPrior);
				let by = collider.y + (collider.y-yPrior);
				let e = this.findAliveOthersAt(bx,by).first;
				if( e ) bump(e,false);
			}
			let bumpResult = (collider.onBump || bonk)(
				this,
				!collider.isTileType ? collider : this.map.getTileEntity(this.x,this.y)
			);
			return {
				status: 'bumped',
				collider: collider,
				bumpResult: bumpResult,
				success: false
			}
		}

		function resultTileDepart(tileType,tileTypePrior) {
			if( !areaPrior ) {
				return;
			}
			console.assert(tileType);
			console.assert(tileTypePrior);

			// Does this tile type always do something to you when you depart any single instance of it?
			if( tileTypePrior.onDepart ) {
				if( tileTypePrior.onDepart(this,this.map.getTileEntity(xPrior,yPrior)) === false ) {
					return {
						status: 'stoppedOnDepart',
						success: false
					}
				}
			}

			// Are we leaving this TYPE of tile entirely? Like leaving water, fire or mud?
			if( tileType.name != tileTypePrior.name && tileTypePrior.onDepartType ) {
				if( tileTypePrior.onDepartType(this,this.map.getTileEntity(xPrior,yPrior)) === false ) {
					return {
						status: 'stoppedOnDepartType',
						success: false
					}
				}
			}
		}

		function resultTileTypeEnter(tileType,tileTypePrior) {
			// Are we entering a new tile TYPE?
			if( (!tileTypePrior || tileType.name != tileTypePrior.name) && tileType.onEnterType ) {
				if( tileType.onEnterType(this,this.map.getTileEntity(this.x,this.y)) ) {
					return {
						status: 'stoppedOnEnterType',
						success: false
					}
				}
			}
		}

		function checkSwappable(target) {
			let maySwap = target &&
				(!this.isUser || !target.isMerchant) &&
				(this.isMyHusk(target) || (!this.isMyEnemy(target) && !this.isMySuperior(target)))
			;
			return maySwap;
		}

		let attack = target && attackAllowed && wantToAttack.call(this,target);
		if( attack ) {
			weapon = weapon || this.calcDefaultWeapon();
			return resultAttack.call(this,target,weapon);
		}

		if( moveVoluntary && this.immobile ) {
			return resultImmobility.call(this);
		}

		context.allyToSwap = checkSwappable.call(this,target) ? target : false;

		//
		// Bonk Monsters
		//
		if( !context.allyToSwap && target ) {
			return resultBumpMonster.call(this,target);
		}

		//
		// Bonk Un-occupiable Items
		//
		let ignoreMonster = this.moveSwappingWith || context.allyToSwap || target;
		let collider = this.findFirstCollider(this.travelMode,this.x,this.y,ignoreMonster);
		if( collider ) {
			return resultBumpItem.call(this,collider);
		}

		//
		// Tile Depart Events
		//
		let tileType = this.map.tileTypeGet(this.x,this.y);
		let tileTypePrior = areaPrior ? areaPrior.map.tileTypeGet(xPrior,yPrior) : null;
		let result;
		if( result = resultTileDepart.call(this,tileType,tileTypePrior) ) {
			return result;
		}

		//
		// Tile Enter Events
		//
		if( result = resultTileTypeEnter.call(this,tileType,tileTypePrior) ) {
			return result;
		}

		return null;
	}

	enterTile(areaPrior,xPrior,yPrior,areaChanged) {
	
		let targetList = this.findAliveOthersAt(this.x,this.y);
		if( this.moveSwappingWith ) {
			targetList.exclude( this.moveSwappingWith );
		}
		let context = {
			target: targetList.first,
			allyToSwap: null
		}

		let prelim = this.enterTilePrelims(areaPrior,xPrior,yPrior,areaChanged,context);

		if( prelim && !areaChanged ) {
			return prelim;
		}

		let result = {
			prelim: prelim,
			status: 'enteredTile',
			entrySuccess: true,
		}

		if( context.allyToSwap ) {
			// Very complicated. Involuntary move, and set swapping to true.
			let moveSwappingWith = this;
			let allyResult = context.allyToSwap.setMoveTarget(
				areaPrior, Math.toTile(xPrior), Math.toTile(yPrior),
				false, false, null, false, moveSwappingWith
			);
			if( !allyResult.success ) {
				return {
					status: 'stoppedUnableToSwapWithAlly',
					allyResult: allyResult,
					success: false
				}
			}
			result.allyToSwap = context.allyToSwap;
		}

		if( !this.dead && this.jumpLeft > 0 ) {
			this.jumpLeft = this.jumpLeft - 1;
		}

		if( !this.dead && areaPrior && this.trail ) {
			this.leaveTrail(areaPrior,xPrior,yPrior,result);
		}

		if( !this.dead && this.onEnterTile ) {
			result.onEnterTile = this.onEnterTile.call(this,this.x,this.y);
		}

		if( !this.dead && this.mindset('pickup') && this.able('pickup') ) {
			let f = this.map.findItemAt(this.x,this.y).filter( item => item.mayPickup!==false );
			result.pickupResult = f.map( item => this.actPickup(item) );
		}

		if( !this.dead && this.mindset('harvest') && this.able('harvest') ) {
			let f = this.map.findItemAt(this.x,this.y).filter( item => item.mayHarvest );
			result.harvestResult = f.map( item => this.actHarvest(item) );
		}

		return result;
	}

	handleExecute() {
		let result = {
			status: 'execute',
			success: false
		};

		let xTarget = Number.isFinite(this.commandX) ? this.commandX : this.x;
		let yTarget = Number.isFinite(this.commandY) ? this.commandY : this.y;
		
		//
		// Crafting Dialog
		//
		if( this.commandItem && this.commandItem.craftId ) {
			guiMessage( 'open', {
				viewClass: 'ViewCraft',
				craftId: this.commandItem.craftId,
				crafter: this.commandItem.owner,
				entity: this
			});
			result.status = 'ViewCraft';
			result.success = true;
			return result;

		}

		//
		// Enter a gate
		//
		let gate = this.map.findItemAt(xTarget,yTarget).filter( item => item.gateDir!==undefined ).first;
		if( gate && this.x==xTarget && this.y==yTarget) {
			return this.actEnterGate(gate);
		}

		//
		// Merchant Dialog
		//
		let f = this.findAliveOthersNearby().filter( e=>e.id==this.lastBumpedId || (this.seeingSignOf && this.seeingSignOf.id == e.id) );
		if( f.first && this.isUser && f.first.isMerchant ) {
			guiMessage( 'open', {
				viewClass: 'ViewMerchant',
				entity: this,
				merchant: f.first,
			});
			result.status = 'ViewMerchant';
			result.success = true;
		}
		return result;
	}

	actOnCommand() {
		if( this.command == undefined ) debugger;

		switch( this.command ) {
			case Command.BUSY: {
				return this.actBusy();
			}
			case Command.LOSETURN: {
				return this.actLoseTurn();
			}
			case Command.WAIT: {
				return this.actWait();
			}
			case Command.ENTERGATE: {
				let gate = this.map.findItemAt(this.x,this.y).filter( gate=>gate.gateDir!==undefined ).first;
				return this.actEnterGate(gate);
			}
			case Command.EXECUTE: {
				return this.handleExecute();
			}
			case Command.EAT: {
				let result = this.actEat(this.commandItem.single());
				this.commandItem = null;
				return result;
			}
			case Command.PICKUP: {
				let result = this.actPickup(this.commandItem);
				this.commandItem = null;
				return result;
			}
			case Command.LOOT: {
				let item = this.commandItem;
				return this.actLoot(item);
			}
			case Command.DROP: {
				let item = this.commandItem;
				return this.actDrop(item);
			}
			case Command.QUAFF: {
				let item = this.commandItem.single();
				this.commandItem = null;
				return this.actQuaff(item);
			}
			case Command.GAZE: {
				let item = this.commandItem.single();
				this.commandItem = null;
				return this.actGaze(item);
			}
			case Command.ATTACK: {
				let target = this.commandTarget;
				let weapon = this.commandItem;
				return this.actAttack(target,weapon);
			}
			case Command.THROW: {
				let item = this.commandItem;
				this.commandItem = null;
				return this.actThrow(item,this.commandTarget);
			}
			case Command.CAST: {
				let item = this.commandItem;
				this.commandItem = null;
				return this.actCast(item,this.commandTarget);
			}
			case Command.SHOOT: {
				let item = this.commandItem;
				this.commandItem = null;
				return this.actShoot(item,this.commandTarget);
			}
			case Command.TRIGGER: {
				let item = this.commandItem;
				this.commandItem = null;
				return this.actTrigger(item,this.commandTarget || this);
			}
			case Command.DIG: {
				let target = this.commandTarget;
				return this.actDig(target);
			}
			case Command.CRAFT: {
				debugger;
				let item = this.commandItem;
				this.commandItem = null;
				return this.actCraft(item,this.commandTarget || this);
			}
			case Command.USE: {
				let item = this.commandItem;
				this.commandItem = null;
				return this.actUse(item);
			}
			case Command.BUY: {
				let item = this.commandItem.single();
				this.commandItem = null;
				let seller = this.commandTarget;
				return this.actBuy(item,seller);
			}
			case Command.SELL: {
				let item = this.commandItem.single();
				this.commandItem = null;
				let buyer = this.commandTarget;
				return this.actSell(item,buyer);
			}
			case Command.PRAY: {
				if( Random.chance100(15) ) {
					tell(mSubject,this,': ',this.sayPrayer || '<praying...>');
				}
				return {
					status: 'pray',
					success: true
				}
			}
			case Command.DEBUGTEST: {
				Tile.revealAll = !Tile.revealAll;

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
				if( !this.senseTreasure ) {
					this.senseTreasure = true;
					this.senseLiving = true;
				}
				else {
					this.senseTreasure = false;
					this.senseLiving = false;
				}
				guiMessage('revealMinimap');
				break;
			}
			case Command.DEBUGANIM: {
				break;
			}
		};
	}
	mayDon(item) {
		return item.slot && this.bodySlots && this.bodySlots[item.slot] && this.getItemsInSlot(item.slot).count < this.bodySlots[item.slot];
	}
	anySlotFilled(slotList) {
		return new Finder(this.inventory).filter( i => i.inSlot && slotList.includes(i.inSlot)).count > 0;
	}
	getItemsInSlot(slot) {
		return new Finder(this.inventory).filter( i => i.inSlot==slot);
	}
	getFirstItemInSlot(slot) {
		let f = this.getItemsInSlot(slot);
		return f.first;
	}

	mustBreathe() {
		return this.breathIgnore!==true && !this.isImmune(DamageType.SUFFOCATE);
	}

	checkRegenerate() {
		if( this.regenerate && this.health < this.healthMax ) {
			this.health = Math.clamp(this.health+this.regenerate*this.healthMax,0.0,this.healthMax);
		}
	}

	checkBreath() {
		if( (this.breathStopped || this.map.isAirless) && this.mustBreathe() ) {
			this.breathLast = (this.breathLast||0)+1;
		}
		else {
			this.breathLast = 0;
		}
		let limit = this.breathIgnore===true ? Rules.breathLimitToDamage : (this.breathIgnore||0)
		if( this.breathLast > limit ) {
			let effect = {
				name: 'suffocate',
				op: 'damage',
				value: Rules.breathDamage(this.health),
				damageType: DamageType.SUFFOCATE,
				duration: 0
			};
			let deed = this.deedFind(deed=>deed.damageType==DamageType.SUFFOCATE);
			let source = deed ? deed.source : this.map;
			effectApply( effect, this, source, null, 'onBreath' );
		}
	}

	checkMapEffects() {
		this.map.passiveEffectList.forEach( effect => {
			effectApply( effect, this, this.map, null, 'onMapPassive' );
		});
	}

	checkCharge() {
		// This will need a rewrite
		return;

		if( this.command == Command.NONE ) {
			return;
		}
		if( !this.jumpLeft && Command.Movement.includes(this.command) && this.commandResult.success ) {
			let dir = Direction.fromCommand(this.command);
			if( dir === this.lastDir ) {
				this.chargeDist = (this.chargeDist||0)+1;
			}
			this.lastDir = dir;
		}
		else {
			delete this.chargeDist;
		}
	}

	checkBumpBy() {
		if( this.bumpCount ) {
			// If the user ever isn't adjacent to you, then you must be relieved of bump obligations.
			let f = this.findAliveOthersNearby().isId(this.bumpBy).nearMe(1);
			if( !f.first ) this.bumpCount=0;
		}
	}

	checkTouchTile() {
		// Important for this to happen after we establish whether you are jumping at this moment.
		let tileType = this.map.tileTypeGet(this.x,this.y);
		if( tileType.onTouch ) {
			tileType.onTouch(this,this.map.getTileEntity(this.x,this.y));
		}
	}

	checkTouchItem() {
		this.map.findItemAt(this.x,this.y).forEach( item => {
			if( item.onTouch ) {
				item.onTouch( this, item );
			}
		});
	}

	checkLightDamage() {
		if( !this.lightHarms ) {
			return;
		}
		let light = this.map.getLightAt(this.x,this.y);
		if( light >= this.lightHarms ) {
			let pct = 1.0 - ((20-light) / (20-Math.clamp(this.lightHarms,0,19)));
			let damage = Math.max(1,Math.floor(Rules.pickDamage(this.area.depth,0,null) * pct * 0.2));
			let lightEffect = {
				op: 'damage',
				damageType: DamageType.LIGHT,
				value: damage,
				duration: 0,
				icon: 'gui/icons/eLight.png'
			}
			effectApply(lightEffect,this,null,null,'ambientLight');
		}
	}

	act() {
		let dir = Direction.fromCommand(this.command);
		if( this.isDead() ) {
			if( this.isSpectator && dir !== false ) {
				let x = this.x + Direction.add[dir].x;
				let y = this.y + Direction.add[dir].y;
				if( this.map.inBounds(x,y) ) {
					this.x = x;
					this.y = y;
				}
			}
			this.commandSpeed = 0;
			return true;
		}

		//
		// Move a direction, or take an action
		//
		if( this.command === Command.NONE ) {
			this.commandSpeed = 0;
			return false;
		}

		let xOld = this.x;
		let yOld = this.y;
		let result = null;

		if( Direction.fromCommand(this.command) !== false ) {
			// This should be the ONE AND ONLY call to moveDir.
			result = this.setMoveTargetDir(dir,this.commandItem,true);
			if( result.success ) {
				this.commandSpeed = this.speedMove;
			}
			if( this.isUser && result.success ) {
				guiMessage('hideInfo','user moved');
			}
		}

		if( !result || !result.success ) {
			result = this.actOnCommand();
			this.commandSpeed = Command.Free.includes(this.command) ? 0 : this.speedAction;
		}

		console.watchCommand( this, this.command, result );
		this.commandResult = result;

		console.assert( this.command !== Command.NONE );
		
		this.isStill = ( this.x == xOld && this.y == yOld );
		this.isBraced = this.isStill;

		// Just making sure we don't have any item weirdness.
		this.inventory.forEach( item => {
			console.assert( item.owner.id == this.id );
			console.assert( item.ownerOfRecord.id == this.id );
		});

	}
	clearCommands() {
		if( this.command !== Command.NONE ) {
			console.watchCommand( this, 'clearCommands (was '+this.command+')' );
		}
		this.commandLast = this.command;
		this.commandItemLast = this.commandItem;
		this.commandTargetLast = this.commandTarget;
		this.commandTarget2Last = this.commandTarget2;
		this.commandXLast = this.commandX;
		this.commandYLast = this.commandY;
		this.commandSpeedLast = this.commandSpeed;
		this.command = Command.NONE;
		this.commandItem = null;
		this.commandTarget = null;
		this.commandTarget2 = null;
		this.commandX = null;
		this.commandY = null;
		this.commandSpeed = 0.0;
	}

	findSafeGateDestination(area,x,y) {
		let c = !area.map.inBounds(x,y) ? true : GlobalFindFirstCollider(this,this.travelMode,area.map,x,y,this);
		if( c ) {
			[x,y] = area.map.spiralFind( x, y, (x,y,tile) => {
				return tile && tile.mayWalk && !tile.isProblem && !GlobalFindFirstCollider(this,this.travelMode,area.map,x,y,this);
			});
			console.assert( x!==false );
		}
		return [x,y];
	}

	recognizeLeaveVoid() {
		if( Gab ) {
			Gab.entityPostProcess(this);
		}
	}

	recognizeMove(areaPrior,xPrior,yPrior,areaChanged) {
		if( !areaPrior ) {
			console.assert( this.area );
			this.origin = this.area.map.getTileEntity(this.x,this.y);
			this.origin.name = 'origin';
		}

		if( areaPrior && areaPrior.map.inBounds(xPrior,yPrior) ) {
			console.assert( areaPrior && xPrior !== undefined );
			areaPrior.map.scentLeave(xPrior,yPrior,this,this.scentReduce||0); // Only leave scent where you WERE, so you can sell it where you ARE.
			areaPrior.map._entityRemove(this,xPrior,yPrior);
			areaPrior.map.calcWalkable(xPrior,yPrior);	// NUANCE: must be after the entityRemove!
		}

		if( areaChanged ) {
			if( areaPrior ) {
				// DANGER! Doing this while within a loop across the entityList will result in pain!
				Array.filterInPlace( areaPrior.entityList, entity => entity.id!=this.id );
			}
			let fnName = this.isUser ? 'unshift' : 'push';	// the player happens to always be pushed to first in the list.
			this.area.entityList[fnName](this);

			tell(mSubject|mCares,this,' ',mVerb,'are',' now on level '+this.area.name)
		}

		this.map._entityInsert(this,this.x,this.y);
		this.map.calcWalkable(this.x,this.y);	// NUANCE: must be after the entityInsert!
		// This just makes sure that items have coordinates, for when they're the root of things.
		this.inventory.forEach( item => { item.x=this.x; item.y=this.y; } );

		// Any visibility cache flushing should happen here.
		if( areaChanged && this.isUser ) {
			this.area.world.setTickingAreas(this.area.id);
			guiMessage('changeArea', { area: this.area, areaPrior: areaPrior } );
		}
	}

	checkPit() {
		let tileType = this.map.tileTypeGet(this.x,this.y);
		if( tileType.isPit && this.travelMode != 'fly' && !this.jumpLeft ) {
			let stairs = this.map.findItem(this).filter( item=>item.gateDir==1 ).first;
			if( !stairs && !this.isUser ) {
				return vanishIntoPit();
			}
			if( !stairs ) {
				// HEY! If there are no stairs, have the mason scan the map and just put floor where ever
				// there is pit. Then put in a vine to climb up.
				debugger;
				return;
			}

			tell(mSubject,this,' ',mVerb,'fall',' down a pit!');
			let gateEffect = this.createGateEffect({
				name:      'pit',
				toAreaId:  stairs.toAreaId,
				toDepth:   stairs.toDepth,
				toThemeId: stairs.toThemeId,
				oneway:    true,
				xTarget:   stairs.x,
				yTarget:   stairs.y
			});

			return this.takeGateEffect( gateEffect );
		}
	}

	onMove() {
		let xPrior    = this.x;
		let yPrior    = this.y;
		let areaPrior = this.area;

		let areaChanged = !areaPrior || this.areaMove.id !== areaPrior.id;

		if( areaChanged ) {
			this.moveInstantly = true;
			[this.xMove,this.yMove] = this.findSafeGateDestination(this.areaMove,this.xMove,this.yMove);
		}

		//
		// Move me
		//
		this.area = this.areaMove;
		this.x    = this.xMove;
		this.y    = this.yMove;

		//
		// Enter Tile
		//
		let result = this.enterTile(areaPrior,xPrior,yPrior);
		let revertMovement = !areaChanged && !result.entrySuccess;

		if( revertMovement ) {
			this.area = areaPrior;
			this.x = xPrior;
			this.y = yPrior;

			this.areaMove = this.area;
			this.xMove = this.x;
			this.yMove = this.y;
			result.success = false;
			return result;
		}

		this.recognizeMove(areaPrior,xPrior,yPrior,areaChanged);

		Gui.dirty('miniMap');
		Gui.dirty('map');

		if( areaChanged && !areaPrior ) {
			this.recognizeLeaveVoid();
			this.calculateVisbility()
		}

		if( this.light ) {
			this.area.lightDirty = true;
		}
		if( this.isUser ) {
			this.area.pathClip.setCtr(this.x,this.y,MapVisDefault*2);
			this.area.thinkClip.setCtr(this.x,this.y,MapVisDefault*5);
		}

		let dest = this.destination;
		if( dest && this.nearTarget(dest,dest.closeEnough) ) {
			this.record( "ARRIVED", true );
			if( dest.onArrive ) {
				dest.onArrive(this.dest);
			}
			this.destination = null;
		}

		this.checkPit();
		return {
			status: 'onMove',
			success: true
		};
	}

	tickRound() {
		this.tickRoundList = this.tickRoundList || [
			()=>this.checkRegenerate(),
			()=>this.checkBreath(),
			()=>this.checkMapEffects(),
			()=>this.checkCharge(),
			()=>this.checkBumpBy(),
			()=>this.checkTouchTile(),
			()=>this.checkTouchItem(),
			()=>this.checkLightDamage(),
		];

		this.tickRoundList.forEach( fn => fn() );

		if( this.onTickRound ) {
			this.onTickRound.call(this);
		}
	}


	tick720(dt720) {
		console.assert( Time.is720(dt720) );

		if( this.legacyId && !this.perkList ) {
			this.grantPerks();
		}

		if( this.isDead() ) {
			return;
		}

		DeedManager.tick720( this, dt720 );

		if( this.actionLeft720 <= 0 ) {
			if( this.area.thinkClip.contains(this.x,this.y) ) {
				if( this.isUser ) {
					console.assert( this.command == Command.NONE );
				}
				// We might be able to move this to happen when they enter a tile
				// instead of every time they think. Might be faster.
				this.calculateVisbility();
				this.think();
				this.act();
				let timeCost720 = this.commandSpeed<=0 ? 0 : Time.to720(1/this.commandSpeed);
				this.actionLeft720 += timeCost720;
				this.clearCommands();
			}
			DeedManager.calc(this);
		}

		if( this.actionLeft720 > 0 ) {
			this.actionLeft720 -= dt720;
		}
		console.assert( Time.is720(this.actionLeft720) );

		if( this.inventory && this.inventory.length ) {
			this.roundTicker720 += dt720;
			if( this.roundTicker720 >= Time.one720 ) {
				this.tickRound();
				this.area.world.itemListTickRound(this.inventory,this.rechargeRate||1);
				this.roundTicker720 -= Time.one720;
			}
		}

		if( this.isUser ) {
			// This is a bit of hack at the moment, just to make sure the user always has
			// a cached visibility.
			// If the user didn't act this tick, but other things made visibility change a lot
			// then we need to recalc it so the player can see what is going on.
			this.calculateVisbility();
		}
	}

}

function nop() {
}

function bonk(entity,target) {
	tell( mSubject|mCares, entity, ' ', mVerb, 'run', ' into ', mObject, target, '.' );
	if( target.isWall && target.invisible && target.isTileEntity ) {
//		target.wasBonked = true;
		target.invisible = false;
		guiMessage( 'revealInvisible', target );
	}
	if( target.isWall ) {
		return 'wall';
	}
	if( target.invisible ) {
		return 'invisible';
	}
	return 'other';
}

return {
	Entity: Entity
}

});
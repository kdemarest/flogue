class Finder {
	constructor(entityList,me,makeDupe=true) {
		if( !entityList ) {
			debugger;
		}
		if( entityList instanceof Finder ) {
			debugger;
			me = me || entityList.me;
			entityList = entityList.result;
		}
		this.result = makeDupe ? entityList.slice() : entityList;
		this.me = me;

	}
	get first() {
		// Readout.render depends on this returning false if there is nothing in the list.
		return this.result.length <= 0 ? false : this.result[0];
	}
	get count() {
		return this.result.length;
	}
	get all() {
		return this.result;
	}

	exclude(entity) {
		console.assert(entity);
		return this.filter( e => e.id!=entity.id );
	}
	prepend(entity) {
		console.assert(entity);
		if( !this.result.includes(entity) ) {
			this.result.unshift(entity);
		}
		return this;
	}
	arrayMap(fn) {
		return this.result.map(fn);
	}
	filter(fn) {
		Array.filterInPlace( this.result, fn );
		return this;
	}
	isId(id) {
		return this.filter( e => e.id==id );
	}
	includesId(id) {
		return this.result.find( e => e.id==id );
	}
	find(fn) {
		return this.result.find( fn );
	}
	shuffle() {
		Array.shuffle(this.result);
		return this;
	}
	at(x,y) {
		return this.filter( e => e.x==x && e.y==y );
	}
	near(x,y,rectDist=1) {
		return this.filter( e => (Math.abs(e.x-x)<=rectDist && Math.abs(e.y-y)<=rectDist) );
	}
	far(x,y,rectDist=1) {
		return this.filter( e => (Math.abs(e.x-x)>rectDist || Math.abs(e.y-y)>rectDist) );
	}
	clearShot() {
		return this.filter( e => shootRange(this.me.x,this.me.y,e.x,e.y, (x,y) => this.me.map.tileTypeGet(x,y).mayFly) );
	}
	closest(x,y) {
		if( !this.result.length ) return this;
		let c = [];
		let ax = this.result[0].x-x;
		let ay = this.result[0].y-y;
		ax = ax*ax;
		ay = ay*ay;
		let bestIndex = 0;
		let bestDist = ax+ay;
		for( let i=1 ; i<this.result.length ; ++i ) {
			let ax = this.result[i].x-x;
			let ay = this.result[i].y-y;
			let dist = ax*ax + ay*ay;
			if( dist < bestDist ) {
				bestIndex = i;
				bestDist = dist;
				if( dist == 1 ) break;
			}
		};
		this.result = [this.result[bestIndex]];
		return this;
	}
	byDistanceFromPosition(x,y) {
		if( this.result.length > 40 ) debugger;
		this.result.sort( (a,b) => ((a.x-x)*(a.x-x)+(a.y-y)*(a.y-y)) - ((b.x-x)*(b.x-x)+(b.y-y)*(b.y-y))  );
		return this;
	}
	isReal() {
		return this.filter( e=>!e.fake );
	}
	keepTop(n) {
		this.result.length = Math.min(this.result.length,n);
		return this;
	}
	process(fn) {
		this.result.forEach(fn);
		return this;
	}
	isTypeId(typeId) {
		return this.filter( e => e.typeId == typeId );
	}
	getId(id) {
		for( let e of this.result ) {
			if( e.id == id ) {
				return e;
			}
		}
		return false;
	}

	isAlive() {
		return this.filter( e => !e.isDead() );
	}
	byHealth() {
		this.result.sort( (a,b) => a.health-b.health );
		return this;
	}
	byRange() {
		this.result.sort( (a,b) => (a.range || a.reach) - (b.range || b.reach) );
		return this;
	}

// ME-oriented capabilities
	includeMe() {
		this.result.unshift(this.me);
		return this;
	}
	excludeMe() {
		return this.exclude(this.me);
	}
	nearMe(rectDist=1) {
		return this.near(this.me.x,this.me.y,rectDist);
	}
	farFromMe(rectDist=1) {
		return this.far(this.me.x,this.me.y,rectDist);
	}
	canTargetEntity(x,y) {
		return this.filter( e => this.me.canTargetEntity(e) );
	}
	canTargetPosition(x,y) {
		return this.filter( e => this.me.canTargetPosition(x,y) );
	}
	canPerceiveEntity() {
		return this.filter( e => this.me.canPerceiveEntity(e) );
	}
	isMyEnemy() {
		return this.filter( e => this.me.isMyEnemy(e) );
	}
	isMyFriend() {
		return this.filter( e => this.me.isMyFriend(e) );
	}
	isMyPack() {
		return this.filter( e => this.me.isMyPack(e) );
	}
	isMySuperior() {
		return this.filter( e => this.me.isMySuperior(e) );
	}
	isMyInferior() {
		return this.filter( e => this.me.isMyInferior(e) );
	}
	isNotMyFriend() {
		return this.filter( e => !this.me.isMyFriend(e) );
	}
	isMyNeutral() {
		return this.filter( e => this.me.isMyNeutral(e) );
	}
	closestToMe() {
		return this.closest(this.me.x,this.me.y);
	}
	byDistanceFromMe() {
		return this.byDistanceFromPosition(this.me.x,this.me.y);
	}
}

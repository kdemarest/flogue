class FinderBase {
	constructor() {
		this.result = null;
	}
	filter(fn) {
		Array.filterInPlace( this.result, fn );
		return this;
	}
	includesId(id) {
		return this.result.find( e => e.id==id );
	}
	at(x,y) {
		return this.filter( e => e.x==x && e.y==y );
	}
	atDir(x,y,dir) {
		return this.at( x + DirectionAdd[dir].x, y + DirectionAdd[dir].y );
	}
	near(x,y,rectDist=1) {
		return this.filter( e => (Math.abs(e.x-x)<=rectDist && Math.abs(e.y-y)<=rectDist) );
	}
	far(x,y,rectDist=1) {
		return this.filter( e => (Math.abs(e.x-x)>rectDist || Math.abs(e.y-y)>rectDist) );
	}
	byDistanceFromPosition(x,y) {
		this.result.sort( (a,b) => ((a.x-x)*(a.x-x)+(a.y-y)*(a.y-y)) - ((b.x-x)*(b.x-x)+(b.y-y)*(b.y-y))  );
		return this;
	}
	keepTop(n) {
		this.result.length = Math.min(this.result.length,n);
		return this;
	}
	process(fn) {
		this.result.map(fn);
		return this;
	}
	isTypeId(typeId) {
		return this.filter( e => e.typeId == typeId );
	}
	isId(id) {
		return this.filter( e => e.id==id );
	}
	getId(id) {
		for( let e of this.result ) {
			if( e.id == id ) {
				return e;
			}
		}
		return false;
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
}

class ItemFinder extends FinderBase {
	constructor(itemList) {
		super();
		this.result = itemList.slice();
	}
}


class Finder extends FinderBase {
	constructor(entityList) {
		if( !entityList ) {
			debugger;
		}

		super();
		this.result = entityList.slice();
	}
	exclude(entity) {
		return this.filter( e => e!=entity );
	}
	prepend(entity) {
		if( !this.result.includes(entity) ) {
			this.result.unshift(entity);
		}
		return this;
	}
	teamDifferent(team) {
		return this.filter( e => e.team!=team );
	}
	teamSame(team) {
		return this.filter( e => e.team==team );
	}
	isAlive() {
		return this.filter( e => !e.isDead() );
	}
	byHealth() {
		this.result.sort( (a,b) => a.health-b.health );
		return this;
	}
}

class EntityFinder extends Finder {
	constructor(entity,entityList) {
		if( entity instanceof EntityFinder ) {
			super(entity.entityList);
			this.entity = entity.entity;
			return;
		}
		if( !entity ) {
			debugger;
		}
		super(entityList);
		this.entity = entity;
	}
	includeMe() {
		this.result.unshift(this.entity);
		return this;
	}
	excludeMe() {
		return this.exclude(this.entity);
	}
	atDirFromMe(dir) {
		return this.atDir(this.entity.x,this.entity.y,dir);
	}
	nearMe(rectDist=1) {
		return this.near(this.entity.x,this.entity.y,rectDist);
	}
	farFromMe(rectDist=1) {
		return this.far(this.entity.x,this.entity.y,rectDist);
	}
	canPeceivePosition(x,y) {
		return this.filter( e => this.entity.canPerceivePosition(x,y) );
	}
	canPerceiveEntity() {
		return this.filter( e => this.entity.canPerceiveEntity(e) );
	}
	isMyEnemy() {
		return this.filter( e => this.entity.isMyEnemy(e) );
	}
	isMyFriend() {
		return this.filter( e => this.entity.isMyFriend(e) );
	}
	isMyNeutral() {
		return this.filter( e => this.entity.isMyNeutral(e) );
	}
	byDistanceFromMe(entity) {
		return super.byDistanceFromPosition(this.entity.x,this.entity.y);
	}
}

Module.add('utilPick',function() {

let Pick = {};

//**
// Takes a table of things, whatever you want, and uses the chanceFn to get values of likelihood.
// Then it traverses again picking a random one by poportions. If it fails (total=0) it tries the fallbackFn instead.
//**
Pick.Table = class {
	constructor() {
		this.table = null;
		this.chance = null;
		this.total = 0;
		this.indexPicked = -1;
		this.valuePicked = null;
	}
	isEmpty() {
		return !this.table || this.table.length == 0;
	}
	makeBlank() {
		this.table = [];
		this.chance = [];
		this.total = 0;
		this.indexPicked = -1;
		this.valuePicked = null;
	}
	scanArray(table,chanceFn) {
		console.assert( table && table.length );
		this.makeBlank();
		this.sourceArray = table;
		this.reset = () => this.scanArray(table,fn);
		for( let i=0 ; i<table.length ; i++ ) {
			if( !table[i] ) debugger;
			let value = chanceFn(table[i]);
			if( value !== undefined && value !== null && value !== false) {
				if( typeof value != 'number' ) debugger;
				this.table.push( table[i] );
				this.chance.push( value );
				this.total += Math.max(0,value);
			}
		}
		return this;
	}
	scanPickTable(pick,keepFn) {
		console.assert( pick && pick.table && pick.table.length && pick.chance && pick.chance.length==pick.table.length);
		this.makeBlank();
		this.sourceArray = pick.table;
		this.reset = () => this.scanPickTable(pick,keepFn);
		for( let i=0 ; i<pick.table.length ; i++ ) {
			if( !pick.table[i] ) debugger;
			let value = keepFn(pick.table[i],pick.chance[i]);
			if( value !== undefined && value !== null && value !== false) {
				if( typeof value != 'number' ) debugger;
				this.table.push( pick.table[i] );
				this.chance.push( value );
				this.total += Math.max(0,value);
			}
		}
		return this;
	}
	// scans the hash and builds its table from whatever
	// - hash is something like { thing1: anyStructOrData, thing2: anyStructOrData }
	// - fn returns as the probability for each item
	scanHash(hash,fn) {
		this.makeBlank();
		this.sourceHash = hash;
		this.reset = () => this.scanHash(hash,fn);
		for( let key in hash ) {
			let value = fn( hash[key], key );
			if( value !== undefined && value !== null && value !== false) {
				console.assert( Number.isFinite(value) );
				console.assert( hash[key] );
				this.table.push( hash[key] )
				this.chance.push( value );
				this.total += Math.max(0,value);
			}
		}
		return this;
	}
	scanKeys(hash) {
		this.makeBlank();
		this.sourceHash = hash;
		this.reset = () => this.scanKeys(hash);
		for( let key in hash ) {
			this.table.push( key )
			this.chance.push( hash[key] );
			this.total += Math.max(0,hash[key]);
		}
		return this;
	}
	validate(typeList) {
		for( let i=0 ; i<this.table.length ; ++i ) {
			let key = this.table[i].typeId || this.table[i];
			console.assert(typeList[key]);
		}
	}
	pick() {
		let n = Random.Pseudo.floatRange(0,this.total);
		for( let i=0 ; i<this.table.length ; ++i ) {
			n -= Math.max(0,this.chance[i]);
			if( n<=0 ) {
				this.indexPicked = i;
				this.valuePicked = this.table[i];
				return this.valuePicked;
			}
		}
		debugger;
	}
	anyWithoutChance() {
		for( let i=0 ; i<this.chance.length ; ++i ) {
			if( this.chance[i] <= 0 ) return false;		// negative chances supported.
		}
		return true;
	}
	noChances() {
		for( let i=0 ; i<this.chance.length ; ++i ) {
			if( this.chance[i] > 0 ) return false;		// negative chances supported.
		}
		return true;
	}
	forbidLast() {
		console.assert( !this.isEmpty() );
		if( this.chance[this.indexPicked] > 0 ) {
			this.total -= this.chance[this.indexPicked];
			this.chance[this.indexPicked] = 0;
		}
	}
	decrementLast(amount) {
		console.assert( !this.isEmpty() );
		let totalDec = Math.max(0,Math.min(amount,this.chance[this.indexPicked]));
		this.total -= totalDec;
		this.chance[this.indexPicked] -= amount;	// Allowed to go into negatives.
	}
	forbid(fn) {
		console.assert( !this.isEmpty() );
		for( let i=0 ; i<this.table.length ; ++i ) {
			if( fn(this.table[i]) ) {
				if( this.chance[i] > 0 ) {
					this.total -= this.chance[i];
					this.chance[i] = 0;
				}
			}
		}
	} 
}

return {
	Pick: Pick
}
});

// STATIC UTILITY FUNCTIONS

function nop() {}

(function(){
	Math.clamp = function(value,min,max) {
		return Math.max(min,Math.min(max,value));
	}

	Math.randInt = function(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}
	Math.randIntBell = function(min, max) {
		let span = (max-min)/3;
		return min + Math.floor( Math.random()*span + Math.random()*span + Math.random()*span );
	}
	Math.rand = function(min, max) {
		return Math.random()*(max-min)+min;
	}
	Math.randBell = function(min, max) {
		let span = (max-min)/3;
		return min + Math.random()*span + Math.random()*span + Math.random()*span;
	}
	Math.triangular = function(n) {
		// 1, 3, 6, 10, 15, 21, 28 etc.
		return (n*(n+1))/2;
	}
	Math.chance = function(percent) {
		return Math.rand(0,100) < percent;
	}
	Math.fixed = function(value,decimals) {
		let p = Number.parseFloat(value).toString().split('.');
		if( p[1] == undefined ) p[1] = '0';
		while( p[1].length < decimals ) p[1]+='0';
		return p[0]+'.'+p[1].substr(0,decimals);
	}
	Math.percent = function(value,decimals) {
		let p = 100*Math.pow(10,decimals);
		let n = '            '+Math.floor(value*p);
		n = n.substr(0,n.length-decimals)+(decimals>0 ? '.'+n.substr(n.length-decimals) : '');
		return n.substr(-(3+decimals));
	}
	String.splice = function(str, start, delCount, newSubStr) {
        return str.slice(0, start) + newSubStr + str.slice(start + Math.abs(delCount));
    }
	String.insert = function (str, index, string) {
		if (index > 0)
			return str.substring(0, index) + string + str.substring(index, str.length);
		else
			return string + str;
	}
	String.capitalize = function(s) {
	    return s.charAt(0).toUpperCase() + s.slice(1);
	}
	String.uncamel = function(id) {
		let s = '';
		for( let i=0 ; i<id.length ; ++i ) {
			let c = id.charAt(i);
			s += c != c.toLowerCase() ? ' '+c.toLowerCase() : c;
		}
		return s;
	}
	String.padLeft = function(s,len,char=' ') {
		while( s.length < len ) {
			s = char + s;
		}
		return s;
	}
	Array.filterInPlace = function(a, condition, thisArg) {
		let j = 0;

		a.forEach((e, i) => { 
			if (condition.call(thisArg, e, i, a)) {
				if (i!==j) a[j] = e; 
				j++;
			}
		});

		a.length = j;
		return a;
	}
	Array.filterPairsInPlace = function(a, condition, thisArg) {
		let j = 0;
		let i = 0;
		while( i < a.length ) {
			if( condition.call(thisArg, a[i], a[i+1], i, a)) {
				if (i!==j) {
					a[j] = a[i]; 
					a[j+1] = a[i+1];
				} 
			}
			i += 2;
		}

		a.length = j;
		return a;
	}
	Array.count = function(array,fn) {
		let total = 0;
		array.forEach( a => {
			let n = fn(a);
			total += n===true ? 1 : (typeof n == 'number' ? n : 0);
		});
		return total;
	}
	Array.shuffle = function(array) {
		for (let i = array.length - 1; i > 0; i--) {
			let j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}
	Array.shufflePairs = function(array) {
		for (let i = array.length/2 - 1; i > 0; i-=1) {
			let j = Math.floor(Math.random() * (i + 1));
			[array[2*i+0],array[2*i+1], array[2*j+0],array[2*j+1]] = [array[2*j+0],array[2*j+1], array[2*i+0],array[2*i+1]];
		}
		return array;
	}
	Array.traverseSpan = function(array,span,fn) {
		for( let i=0 ; i<array.length ; i+=span ) {
			if( fn(array[i+0],array[i+1],array[i+2],array[i+3],array[i+4]) === false ) {
				return;
			}
		}
	}
	Array.traversePairs = function(array,fn) {
		for( let i=0 ; i<array.length ; i+=2 ) {
			if( fn(array[i+0],array[i+1]) === false ) {
				return;
			}
		}
	}
	Array.pickFromPairs = function(array) {
		let n = Math.randInt(0,array.length/2) * 2;
		return [array[n+0],array[n+1]];
	}
	Array.move = function(array, from, to) {
	    array.splice(to, 0, array.splice(from, 1)[0]);
	}

	Object.isEmpty= function(obj) {
		for(var key in obj) {
			if(obj.hasOwnProperty(key))
				return false;
		}
		return true;
	}
	Object.countMembers= function(obj) {
		let count = 0;
		for(var key in obj) {
			if(obj.hasOwnProperty(key))
				++count;
		}
		return count;
	}
	Object.each = function(obj,fn) {
		for( let key in obj ) {
			fn(obj[key],key);
		}
	}
	Object.merge = function(target,source,ignore) {
		if( source ) {
			for( let key in source ) {
				if( ignore[key] ) {
					continue;
				}
				target[key] = source[key];
			}
		}
		return target;
	}
	Object.copySelected = function(target,source,select) {
		if( source ) {
			for( let key in source ) {
				if( select[key] !== undefined ) {
					target[key] = source[key];
				}
			}
		}
		return target;
	}

	// Produces a new object composed of each key that the fn returned true for.
	Object.filter = function(obj,fn) {
		let result = {};
		for( let key in obj ) {
			if( fn(obj[key],key) ) {
				result[key] = obj[key];
			}
		}
		return result;
	}
	Object.find = function(obj,fn) {
		for( let key in obj ) {
			if( fn(obj[key],key) ) {
				return obj[key];
			}
		}
		return false;
	}
	// Converts an incoming object into another object. The fn should return an object that will be object assigned into the source object.
	Object.convert = function(obj,fn) {
		let result = {};
		for( let key in obj ) {
			Object.assign(result, fn.call(obj,obj[key],key));
		}
		return result;
	}

	Array.supplyConcat = function(...args) {
		let result = [];
		for( let i=0 ; i <args.length ; ++i ) {
			if( !args[i] ) continue;
			if( Array.isArray(args[i]) ) {
				if( !args[i].length ) {
					continue;
				}
				result.push(...args[i]);
				continue;
			}
			result.push(args[i]);
		}
		return result;
	}

	let ChParser = /\s*([\d]+x)*\s*(\d+%)*\s*([^,]+|[*])\s*[,]*/g;
	Array.supplyParse = function(supplyMixed) {

		function supplyStringParse(supplyString) {
			let supply = [];
			supplyString.replace( ChParser, function( match, count, chance, typeFilter ) {
				count = count ? (parseInt(count) || 1) : 1;
				if( chance===undefined ) { chance='100'; }
				chance = parseInt(chance)||100;
				supply.push( { count: count, chance: chance, typeFilter: typeFilter } );
			});
			return supply;
		}

		let supplyArray = [];
		supplyMixed = Array.isArray(supplyMixed) ? supplyMixed : [supplyMixed];
		for( let mix of supplyMixed ) {
			if( typeof mix == 'string' ) {
				supplyArray.push(...supplyStringParse(mix));
			}
			if( typeof mix == 'object' ) {
				console.assert( mix.typeFilter || mix.pick );
				if( mix.pick ) {
					supplyArray.push( mix );	// { pick: [ 'floor', 'pit', 'mist' ] }
				}
				else {
					supplyArray.push(Object.assign({},{count:1, chance:100},mix));
				}
			}
		}
		return supplyArray;
	}

	Array.supplyValidate = function( supplyArray, typeList ) {
		supplyArray.forEach( supply => {
			if( supply.pick ) {
				supply.pick.forEach( typeFilter => console.assert(typeList[typeFilter.split('.')[0]]) );
			}
			else {
				console.assert(typeList[supply.typeFilter.split('.')[0]]);
			}
		});
	}

	Array.supplyToMake = function(supplyArray,sandBag=1.0,onPick=pick) {
		let makeList = [];
		for( let supply of supplyArray ) {
			if( supply.pick ) {
				makeList.push({typeFilter: onPick(supply.pick)});
				continue;
			}
			for( let i=0 ; i<(supply.count||1) ; ++i ) {
				let chance = supply.chance || 100;
				if( Math.chance(chance>= 100 ? 100 : chance*sandBag) ) {
					let temp = Object.assign({},supply);
					delete temp.count;
					delete temp.chance;
					makeList.push(temp);
				}
			}
		}
		return makeList;
	}

	String.combine = function(delim,...args) {
		let result = '';
		for( let i=0 ; i <args.length ; ++i ) {
			if( !args[i] ) continue;
			if( result ) {
				result += delim;
			}
			result += args[i];
		}
		return result;
	}

	String.arSplit = function(s,delim=',') {
		if( !s ) {
			return [];
		}
		let temp = s.split(delim);
		if( temp.length==1 && temp[0]=='' ) {
			temp.length=0;
		}
		return temp;
	}
	String.arAdd = function(str,add) {
		let temp = String.arSplit(str,',');
		temp.push(add);
		return temp.join(',');
	}
	String.arSub = function(str,add) {
		let temp = String.arSplit(str,',');
		let index = temp.find(add);
		if( index !== undefined ) {
			temp.splice(index,1);
		}
		return temp.join(',');
	}
	String.arIncludes = function(str,find) {
		return String.arSplit(str,',').includes(find);
	}
	String.arExtra = function(base,comp) {
		base = String.arSplit(base,',');
		comp = String.arSplit(comp,',');
		for( let i=0 ; i<base.length ; ++i ) {
			if( !comp.includes(base[i]) ) {
				return base[i];
			}
		}
		return '';
	}
	String.tokenReplace = function(s,obj) {
		return s.replace(/{([%]*)([?]*)([+]*)(\w+)}|([\w\s]+)/g,function(whole,pct,hasQ,plus,key,words) {
			if( words !== undefined ) return words;

			let isPercent = pct=='%';
			let isPlus = plus=='+';
			let useOf = hasQ=='?';

			if( (useOf || isPlus) && obj[key] === undefined ) {
				return '';
			}
			if( typeof obj[key] == 'number' ) {
				if( isPlus && !obj[key] ) return '';
				let p = isPlus && obj[key] ? ' +' : '';
				return p+(obj[key] * (isPercent?100:1))+(isPercent?'%':'');
			}
			if( obj[key] === false ) {
				return '';
			}
			if( typeof obj[key] == 'string' ) {
				if( obj[key] === '' ) return '';
				return (useOf && obj[key] ? ' of ' : '')+obj[key];
			}
			if( Array.isArray(obj[key]) ) {
				return obj[key].join(',');
			}
			if( typeof obj[key] == 'object' ) {
				if( obj[key] ) {
					if( obj[key].name === false || obj[key].name === '' ) return '';
					return (useOf && obj[key].name ? ' of ' : '')+(obj[key].name || 'NONAME ['+key+']');
				}
			}
			debugger;
			return 'UNKNOWN '+key;
		});
	}

//let qqq = String.tokenReplace("{material} arrow{+plus}", {material:{name:'frog'},plus:2});
//debugger;

	Math.chanceToAppearSimple = function(entityLevel,mapLevel) {
		if( mapLevel < entityLevel ) {
			return 0;
		}
		let span = Math.max(3,DEPTH_SPAN/10);
		let x = (entityLevel+span)-mapLevel;
		let n = 1-Math.abs(x/span);
		return Math.clamp( n, 0.02, 1.0 );
	}

	Math.chanceToAppearRamp = function(entityLevel,mapLevel) {
		if( mapLevel < entityLevel ) {
			return 0;
		}

		let amt = 0.01 * (entityLevel*entityLevel*entityLevel+1) / (DEPTH_MAX*DEPTH_MAX*DEPTH_MAX);
		return amt*(mapLevel-entityLevel+1);

		return (entityLevel+mapLevel) / (DEPTH_MAX*2);

		let total  = DEPTH_MAX+1-entityLevel;
		let remain = DEPTH_MAX+1-mapLevel;
		return 0.1*entityLevel + remain/total;
	}

	Math.chanceToAppearBell = function(entityLevel,mapLevel) {
		if( mapLevel < entityLevel ) {
			return 0;
		}
		let o = 0.65;
		let u = 2.0;
		let x = (mapLevel - entityLevel)/10*DEPTH_SPAN;

		// Creates a bell curve which is near 1.0 at five levels above 
		let chance = 1.629308 * (1/(o*Math.sqrt(2*Math.PI))) * Math.exp( -( Math.pow((x/5)-u,2) / (2*o*o) ) );

		return chance;
	}

	Math.chanceToAppearSigmoid = function(entityLevel,mapLevel,span=DEPTH_SPAN) {
		if( mapLevel < entityLevel ) {
			return 0;
		}
		// it takes <span> levels for this thing to get from 0.0 frequency to 1.0 frequency.
		let x = mapLevel - entityLevel;

		// Increases chances from about 7% to near 100% ten levels away from starting level.
		//let chance = 1 - (1 / (1+Math.exp(x*(5/span)-(span*0.25))));
		let chance = 1-(1/(1+Math.pow(100,x/(0.5*span)-1)));

		return chance;
	}

	Math.chanceToAppearSigmoidDropping = function(entityLevel,mapLevel,span=DEPTH_SPAN*0.25) {
		if( mapLevel < entityLevel ) {
			return 0;
		}
		// it takes <span> levels for this thing to get from 0.0 frequency to 1.0 frequency.
		let x = mapLevel - entityLevel;

		// Increases chances from about 7% to near 100% ten levels away from starting level.
		//let chance = 1 - (1 / (1+Math.exp(x*(5/span)-(span*0.25))));
		let chance = 1-(1/(1+Math.pow(100,x/(0.5*span)-1)));

		let base   = entityLevel+span;
		let total  = DEPTH_MAX+1-base;
		let remain = DEPTH_MAX+1-mapLevel;
		if( remain > 0 && total > 0 ) {
			chance = (entityLevel+1)/(mapLevel+1); //(remain/total);
		}
		return chance;
	}

})();

let GetTimeBasedUid = (function() {
	let codes = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	let counter = 0;

	return function() {
		counter = (counter+1)%100000;	// assumes we won't make more than n items in the same millisecond
		let n = Math.floor(Date.now()/1000)*100000 + counter;
		let uid = '';
		while( n > 0 ) {
			let q = n - Math.floor(n/codes.length)*codes.length;
			n = Math.floor(n/codes.length);
			uid += codes.charAt(q);
		}
		return uid;
	}
})();

//let qList = {};
//for( let q=0 ; q<100000 ; ++q ) {
//	let n = GetTimeBasedUid();
//	if( qList[n] ) debugger;
//	qList[n] = 1;
//}


let GetUniqueEntityId = (function() {
	let humanNameList = null;
	let shuffled = false;

	return function(typeId,level) {
		if( !shuffled && getHumanNameList ) {
			humanNameList = Array.shuffle(getHumanNameList());
			shuffled = true;
		}

		let id = (humanNameList?pick(humanNameList)+'.':'')+typeId+(level?'.'+level:'')+'.'+GetTimeBasedUid();
		return id;
	}

})();


function validCoords(target) {
	let ok = true;
	ok = ok && typeof target.x == 'number' && !isNaN(target.x);
	ok = ok && typeof target.y == 'number' && !isNaN(target.y);
	ok = ok && target.area && target.area.isArea;
	return ok;
}

function pick(listRaw) {
	let list = listRaw;
	if( typeof list == 'object' && !Array.isArray(list) ) {
		var keys = Object.keys(list);
		if( keys.length <= 0 ) {
			return null;
		}
		let n;
		do {
			n = Math.randInt(0,keys.length);
		} while( list[keys[n]].neverPick );

	    return list[keys[n]];
	}
	return list.length==0 ? null : list[Math.randInt(0,list.length)];
}

function rollDice(diceString) {
	if( typeof diceString !== 'string' ) {
		return diceString;
	}
	if( diceString.charAt(0)<'0' || diceString.charAt(0)>'9' ) {
		return diceString;
	}
	let parts = diceString.split( /[d\+]/ );
	let numDice = parseInt(parts[0] || "1");
	let dieFaces = parseInt(parts[1]);
	let plus = parseInt(parts[2] || "0");
	let result = plus || 0;
	while( numDice-- ) { result += Math.randInt(1,dieFaces+1); }
	return result;
}

//**
// Takes a table of things, whatever you want, and uses the chanceFn to get values of likelihood.
// Then it traverses again picking a random one by poportions. If it fails (total=0) it tries the fallbackFn instead.
//**
class PickTable {
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
	scanHash(hash,fn) {
		this.makeBlank();
		this.sourceHash = hash;
		this.reset = () => this.scanHash(hash,fn);
		for( let key in hash ) {
			let value = fn( hash[key], key );
			if( value !== undefined && value !== null && value !== false) {
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
		let n = Math.rand(0,this.total);
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
	noChances() {
		for( let i=0 ; i<this.chance.length ; ++i ) {
			if( this.chance[i] <= 0 ) return false;		// negative chances supported.
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


function showHealthBar(id,newValue,lastValue,total,label,backgroundColor) {
	let hBar = $(id);
	let bar = hBar.find(' .bar');
	let hit = hBar.find(' .hit');

	let damage = lastValue - newValue;
	// calculate the percentage of the total width
	var barWidth = (newValue / total) * 100;
	var hitWidth = (damage / lastValue) * 100 + "%";

	// show hit bar and set the width
	bar.text('  '+label);
	hit.css('width', hitWidth);
	hBar.data('value', newValue);
	bar.css('background-color', backgroundColor);

	setTimeout(function(){
		hit.css({'width': '0'});
		bar.css('width', barWidth + "%");
	}, 500);
}

function shootRange(x1,y1,x2,y2,testFn,onStep) {
	// Define differences and error check
	var dx = Math.abs(x2 - x1);
	var dy = Math.abs(y2 - y1);
	var sx = (x1 < x2) ? 1 : -1;
	var sy = (y1 < y2) ? 1 : -1;
	var err = dx - dy;

	let ok = true;
	if( onStep ) onStep(x1,y1,ok);
	while (!((x1 == x2) && (y1 == y2))) {
		var e2 = err << 1;
		if (e2 > -dy) {
			err -= dy;
			x1 += sx;
		}
		if (e2 < dx) {
			err += dx;
			y1 += sy;
		}
		ok = ok && testFn(x1,y1);
		if( onStep ) onStep(x1,y1,ok);
	}
	return ok;
}


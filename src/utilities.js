Module.add('profileNull',function(extern){
	// If you really want profiling, you need to instantiate your own profiler
	// in the .html file before loading. This is just to make sure that, if you
	// decide you DON'T want it, that all the calls to Profile do nothing.
	if( !extern.Profile ) {
		extern.Profile = new class {
			start()	{ return this; }
			end()	{ return this; }
			tell()	{ return this; }
		}
	}
	return {
		Profile: extern.Profile
	}
});

// STATIC UTILITY FUNCTIONS
Module.add('utilities',function(extern){

	let Random = {};

	Random.Base = class {
		intRange(min, max) {
			return Math.floor( this.randomFloat * (max - min) ) + min;
		}
		intBell(min, max) {
			let span = (max-min)/3;
			return min + Math.floor( this.randomFloat*span + this.randomFloat*span + this.randomFloat*span );
		}
		chance100(percent) {
			return this.floatRange(0,100) < percent;
		}
		floatRange(min, max) {
			return this.randomFloat*(max-min)+min;
		}
		floatBell(min, max) {
			let span = (max-min)/3;
			return min + this.randomFloat*span + this.randomFloat*span + this.randomFloat*span;
		}
		chance(fPercent) {
			return this.randomFloat < fPercent;
		}
	}

	Random.TrueGenerator = class extends Random.Base {
		constructor() {
			super();
			this.trueRandom = Math.random;
			Math.random = ()=>console.assert(false);
		}
		get randomFloat() {
			return this.trueRandom();
		}
	}

	Random.True = new Random.TrueGenerator();

	Random.PseudoGenerator = class extends Random.Base {
		constructor() {
			super();
			this.seedOriginal = null;
			this._seed = null;
		}
		seed(seed) {
			console.assert( Number.isInteger(seed) );
			this.seedOriginal = seed;
			this._seed = seed % 2147483647;
			if (this._seed <= 0) { this._seed += 2147483646; }
		}
		get randomMaxInt() {
			console.assert( this.seedOriginal !== null );
			this._seed = this._seed * 16807 % 2147483647;
			return this._seed;
		}
		get randomFloat() {
			return this.randomMaxInt / 2147483647;
		}
	};

	Random.Pseudo = new Random.PseudoGenerator();


	Math.clamp = function(value,min,max) {
		return Math.max(min,Math.min(max,value));
	}
	Math.triangular = function(n) {
		// 1, 3, 6, 10, 15, 21, 28 etc.
		return (n*(n+1))/2;
	}


	// Important - this is how the game will take x,y coords and consider which tile they fall into.
	Math.toTile = Math.round; //floor; //round;

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
	Number.roman = function(num) {
		var lookup = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1},roman = '',i;
		for ( i in lookup ) {
			while ( num >= lookup[i] ) {
				roman += i;
				num -= lookup[i];
			}
		}
		return roman;
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
	String.getIs = function(s) {
		return 'is'+String.capitalize(s);
	}
	String.getOf = function(s) {
		return 'of'+String.capitalize(s);
	}
	String.coords = function(x,y) {
		if( x==Math.floor(x) && y==Math.floor(y) ) {
			return '('+x+','+y+')';
		}
		return '('+Math.fixed(x,3)+','+Math.fixed(y,3)+')';
	}

	Array.filterInPlace = function(a, condition, thisArg) {
		let j = 0;
		// I made this a for loop to optimize speed.
		for( let i=0 ; i<a.length ; ++i ) {
			let e = a[i];
			if (condition.call(thisArg, e, i, a)) {
				if (i!==j) a[j] = e; 
				j++;
			}
		}

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
	Array.shuffle = function(array,randomGenerator=Random.Pseudo) {
		for (let i = array.length - 1; i > 0; i--) {
			let j = randomGenerator.intRange( 0, (i + 1) );
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}
	Array.shufflePairs = function(array,randomGenerator=Random.Pseudo) {
		for (let i = array.length/2 - 1; i > 0; i-=1) {
			let j = randomGenerator.intRange( 0, (i + 1) );
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
		let n = Random.Pseudo.intRange(0,array.length/2) * 2;
		return [array[n+0],array[n+1]];
	}
	Array.move = function(array, from, to) {
	    array.splice(to, 0, array.splice(from, 1)[0]);
	}

	Object.isObject = function(obj) {
		return typeof obj=='object' && obj !== null && !Array.isArray(obj);
	}

	Object.isEmpty = function(obj) {
		for(var key in obj) {
			if(obj.hasOwnProperty(key))
				return false;
		}
		return true;
	}
	Object.count = function(obj) {
		let count = 0;
		for(var key in obj) {
			if(obj.hasOwnProperty(key))
				++count;
		}
		return count;
	}
	Object.each = function(obj,fn) {
		for( let key in obj ) {
			if( fn(obj[key],key) === false ) {
				break;
			}
		}
	}
	Object.manyEach = function() {
		let fn = arguments[arguments.length-1];
		for( let i=0 ; i<arguments.length-1 ; ++i ) {
			let obj = arguments[i];
			if( !obj ) continue;
			for( let key in obj ) {
				if( fn(obj[key],key) === false ) {
					return false;
				}
			}
		}
	}
	Object.map = function(obj,fn) {
		let result = {};
		Object.each(obj,(value,key)=>result[key]=fn(value,key));
		return result;
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
	Object.strip = function(target,fn) {
		for( let key in target ) {
			if( !fn || fn(target[key],key) ) {
				delete target[key];
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
	Object.filterInPlace = function(obj,fn) {
		let temp = Object.assign({},obj);
		for( let key in temp ) {
			if( !fn(temp[key],key) ) {
				delete obj[key];
			}
		}
		return obj;
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
	Object.extract = function(obj,memberId) {
		let result = {};
		for( let key in obj ) {
			result[obj[key][memberId]] = true;
		}
		return result;
	}
	Object.findByFlag = function( target, flagValueList ) {
		for( let key in flagValueList ) {
			if( target[key] ) {
				return flagValueList[key];
			}
		}
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

/*
Supplies can come in two forms: String and Object. Both can be encapsulated in an array if you wish to 
describe a list of supplies.

STRING FORM
	3x 50% TypeFilter permuteCode
	- every part is optional except TypeFilter
	- Rolls 4 times, with 10% chance to appear each time.
	- The permuteCode cooresponds one of 1,L,V,2,3,4,5,6,F to force certain permutations.
	- TypeFilter is a filter string. See filterStringParse for dtails.

ARRAY FORM
	{ count: n, chance: 60, id: 'weapon.dagger', permute: 'L', typeFilter: 'itemType.etc.etc' }
	Instead of typeFilter it may contain { pick: [ 'floor', 'pit', 'mist' ] } to choose one of those randomly
*/

	let ChParser = /\s*([\d]+x)*\s*(\d+%)*\s*([^/,]+)(\/([a-zA-Z0-9$]+\s*)|\s*,?)/g;
	Array.supplyParse = function(supplyMixed) {

		function supplyStringParse(supplyString) {
			let supply = [];
			supplyString.replace( ChParser, function( match, count, chance, typeFilter, ignore, permute) {
				count = count ? (parseInt(count) || 1) : 1;
				if( chance===undefined ) { chance='100'; }
				chance = parseInt(chance)||100;
				let result = { count: count, chance: chance, typeFilter: typeFilter };
				if( permute ) {
					result.permute = permute;
				}
				supply.push( result );
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
				if( Random.Pseudo.chance100(chance>= 100 ? 100 : chance*sandBag) ) {
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
		return (s || '')
			.split(delim)
			.filter( entry => entry !== undefined && entry !== null && entry !== '' )
			.filter( (value,index,self) => self.indexOf(value)===index );
	}
	String.arAdd = function(str,add) {
		let a = String.arSplit(str)
			.concat( String.arSplit(add) )
			.filter( (value,index,self) => self.indexOf(value)===index );
		return a.join(',');
	}
	String.arSub = function(str,remove) {
		let temp = String.arSplit(str);
		let index = temp.find(remove);
		if( index !== undefined ) {
			temp.splice(index,1);
		}
		return temp.join(',');
	}
	String.arIncludes = function(str,find) {
		return String.arSplit(str).includes(find);
	}
	String.arExtra = function(base,comp) {
		let aBase = String.arSplit(base);
		let aComp = String.arSplit(comp);
		for( let i=0 ; i<aBase.length ; ++i ) {
			if( !aComp.includes(aBase[i]) ) {
				return aBase[i];
			}
		}
		return '';
	}
	String.uncamelTypeId = function(typeId) {
		let result = String.uncamel(typeId);
		if( result.charAt(1) == ' ' ) {	// converts eMyEffect to e my effect and then my effect.
			result = result.substr(2);
		}
		return result;
	}

	String.calcName = function(obj) {
		// When calculating names for effects, they should have a name, but if not you can try to use their op.
		obj.namePattern = obj.namePattern || obj.name || String.uncamelTypeId(obj.typeId || obj.op || '');
		if( obj.namePattern == obj.op ) {
			console.log('fallback to op');
		}
		if( !obj.namePattern ) {
			debugger;
		}
		obj.name  = String.tokenReplace(obj.namePattern,obj);
		obj.aboutPattern = obj.aboutPattern || obj.about || '';
		obj.about = String.tokenReplace(obj.aboutPattern,obj);
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
					if( !obj[key].name && !obj[key].typeId ) debugger;
					let name = obj[key].name || String.uncamelTypeId(obj[key].typeId || 'NOTYPE2');
					return (useOf && name ? ' of ' : '')+(name || 'NONAME ['+key+']');
				}
			}
			debugger;
			return 'UNKNOWN '+key;
		});
	}

	Date.makeUid = (function() {
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

	Date.makeEntityId = (function() {
		let humanNameList = null;
		let shuffled = false;

		return function(typeId,level) {
			if( !shuffled && getHumanNameList ) {
				humanNameList = Array.shuffle(getHumanNameList());
				shuffled = true;
			}

			let id = (humanNameList?pick(humanNameList)+'.':'')+typeId+(level?'.'+level:'')+'.'+Date.makeUid();
			return id;
		}

	})();

	return {
		Random: Random
	}

});


Module.add('utilities2',function() {

	let Cookie = {
		set: function(name,value,days) {
			var expires = "";
			if( days === undefined ) {
				days = 365*10;
			}
			if (days) {
				var date = new Date();
				date.setTime(date.getTime() + (days*24*60*60*1000));
				expires = "; expires=" + date.toUTCString();
			}
			document.cookie = name + "=" + (value || "")  + expires + "; path=/";
		},
		get: function(name) {
			var nameEQ = name + "=";
			var ca = document.cookie.split(';');
			for(var i=0;i < ca.length;i++) {
				var c = ca[i];
				while (c.charAt(0)==' ') c = c.substring(1,c.length);
				if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
			}
			return null;
		},
		erase: function(name) {   
			document.cookie = name+'=; Max-Age=-99999999;';  
		}
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
				n = Random.Pseudo.intRange(0,keys.length);
			} while( list[keys[n]].neverPick );

		    return list[keys[n]];
		}
		return list.length==0 ? null : list[Random.Pseudo.intRange(0,list.length)];
	}


	function shootRange(x1,y1,x2,y2,testFn,onStep) {
		x1=Math.floor(x1);
		y1=Math.floor(y1);
		x2=Math.floor(x2);
		y2=Math.floor(y2);
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

	return {
		Cookie: Cookie,
		pick: pick,
		shootRange: shootRange
	}
});
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
	Array.count = function(array,fn) {
		let total = 0;
		array.forEach( a => total += fn(a) ? 1 : 0 );
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
	Array.traversePairs = function(array,fn) {
		for( let i=0 ; i<array.length ; i+=2 ) {
			if( fn(array[i+0],array[i+1]) === false ) {
				return;
			}
		}
	}
	Object.isEmpty= function(obj) {
		for(var key in obj) {
			if(obj.hasOwnProperty(key))
				return false;
		}
		return true;
	}
	Object.each = function(obj,fn) {
		for( let key in obj ) {
			fn(obj[key],key);
		}
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
	// Converts an incoming object into another object. The fn should return an object that will be object assigned into the source object.
	Object.convert = function(obj,fn) {
		let result = {};
		for( let key in obj ) {
			Object.assign(result, fn.call(obj,obj[key],key));
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

	function betterSplit(s,delim) {
		let temp = s.split(delim);
		if( temp.length==1 && temp[0]=='' ) {
			temp.length=0;
		}
		return temp;
	}
	String.arAdd = function(str,add) {
		let temp = betterSplit(str,',');
		temp.push(add);
		return temp.join(',');
	}
	String.arSub = function(str,add) {
		let temp = betterSplit(str,',');
		let index = temp.find(add);
		if( index !== undefined ) {
			temp.splice(index,1);
		}
		return temp.join(',');
	}
	String.arIncludes = function(str,find) {
		return betterSplit(str,',').includes(find);
	}
	String.arExtra = function(base,comp) {
		base = betterSplit(base,',');
		comp = betterSplit(comp,',');
		for( let i=0 ; i<base.length ; ++i ) {
			if( !comp.includes(base[i]) ) {
				return base[i];
			}
		}
		return '';
	}
	String.tokenReplace = function(s,obj) {
		return s.replace(/{([%]*)([?]*)(\w+)}/g,function(whole,pct,hasQ,key) {
			let isPercent = pct=='%';
			let useOf = hasQ=='?';

			if( useOf && obj[key] === undefined ) {
				return '';
			}
			if( typeof obj[key] == 'number' ) {
				return (obj[key] * (isPercent?100:1))+(isPercent?'%':'');
			}
			if( typeof obj[key] == 'string' ) {
				return (useOf && obj[key] ? ' of ' : '')+obj[key];
			}
			if( Array.isArray(obj[key]) ) {
				return obj[key].join(',');
			}
			if( typeof obj[key] == 'object' ) {
				if( obj[key] ) return (useOf && obj[key].name ? ' of ' : '')+(obj[key].name || 'NONAME');
			}
			debugger;
			return 'UNKNOWN '+key;
		});
	}

	Math.chanceToAppearSimple = function(entityLevel,mapLevel) {
		if( mapLevel < entityLevel ) {
			return 0;
		}
		let span = 10;
		let x = (entityLevel+span)-mapLevel;
		let n = 1-Math.abs(x/span);
		return Math.clamp( n, 0.1, 1.0 );
	}

	Math.chanceToAppearBell = function(entityLevel,mapLevel) {
		if( mapLevel < entityLevel ) {
			return 0;
		}
		let o = 0.65;
		let u = 2.0;
		let x = mapLevel - entityLevel;

		// Creates a bell curve which is near 1.0 at five levels above 
		let chance = 1.629308 * (1/(o*Math.sqrt(2*Math.PI))) * Math.exp( -( Math.pow((x/5)-u,2) / (2*o*o) ) );

		return chance;
	}

	Math.chanceToAppearSigmoid = function(entityLevel,mapLevel,span=20) {
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

	window.Rules = new class {
		constructor() {

		}
		 playerHealth(playerLevel) {
		 	return 90+(10*playerLevel);
		 }
		 playerArmor(playerLevel) {
		 	let armorAtLevelMin = 0.30;
		 	let armorAtLevelMax = 0.80;
		 	let armor = armorAtLevelMin+((playerLevel-1)/DEPTH_SPAN)*(armorAtLevelMax-armorAtLevelMin);
		 	return Math.clamp(armor,0.0,1.0);
		 }
		 playerDamage(playerLevel) {
		 	// Always just 1/10th of the player's hit points at this level. Monster health will scale to it.
		 	let damage = this.playerHealth(playerLevel)/10;
		 	return Math.max(1,Math.floor(damage));
		 }
		 monsterHealth(monsterLevel,hitsToKillMonster=3) {
		 	if( !hitsToKillMonster ) debugger;
		 	return Math.max(1,Math.floor(this.playerDamage(monsterLevel)*hitsToKillMonster));
		 }
		 monsterDamage(monsterLevel,hitsToKillPlayer=10) {
		 	if( !hitsToKillPlayer ) debugger;
		 	let damage = this.playerHealth(monsterLevel)/(hitsToKillPlayer*(1-this.playerArmor(monsterLevel)));
		 	return Math.max(1,Math.floor(damage));
		 }
	};
})();

let GetTimeBasedUid = (function() {
	let codes = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	let counter = 0;

	return function() {
		counter = (counter+1)%10000;	// assumes we won't make more than 10,000 items in the same millisecond
		let n = (new Date().getTime())*10000 + counter;
		let uid = '';
		while( n > 0 ) {
			let q = n - Math.floor(n/codes.length)*codes.length;
			n = Math.floor(n/codes.length);
			uid += codes.charAt(q);
		}
		return uid;
	}
})();

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
		for( let i=0 ; i<table.length ; i++ ) {
			if( !table[i] ) debugger;
			let value = chanceFn(table[i]);
			if( value !== undefined && value !== null && value !== false) {
				if( typeof value != 'number' ) debugger;
				this.table.push( table[i] );
				this.chance.push( value );
				this.total += value;
			}
		}
		return this;
	}
	scanHash(hash,fn) {
		this.makeBlank();
		for( let key in hash ) {
			let value = fn( hash[key], key );
			if( value !== undefined && value !== null && value !== false) {
				this.table.push( hash[key] )
				this.chance.push( value );
				this.total += value;
			}
		}
		return this;
	}
	pick() {
		let n = Math.rand(0,this.total);
		for( let i=0 ; i<this.table.length ; ++i ) {
			n -= this.chance[i];
			if( n<=0 ) {
				this.indexPicked = i;
				this.valuePicked = this.table[i];
				return this.valuePicked;
			}
		}
		debugger;
	}
	forbidLast() {
		console.assert( !this.isEmpty() );
		this.total -= this.chance[this.indexPicked];
		this.chance[this.indexPicked] = 0;
	}
	forbid(fn) {
		console.assert( !this.isEmpty() );
		for( let i=0 ; i<this.table.length ; ++i ) {
			if( fn(this.table[i]) ) {
				this.total -= this.chance[i];
				this.chance[i] = 0;
			}
		}
	} 
}


function showHealthBar(id,newValue,lastValue,total,label) {
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


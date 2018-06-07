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
		n = n.substr(0,n.length-decimals)+'.'+n.substr(n.length-decimals);
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
	let ChParser = /\s*([\d]+x)*\s*(\d+%)*\s*([^,]+|[*])\s*[,]*/g;
	String.chanceParse = function(lootString) {
		let result = [];
		lootString.replace( ChParser, function( match, count, chance, id ) {
			count = count ? (parseInt(count) || 1) : 1;
			if( chance===undefined ) { chance='100'; }
			chance = parseInt(chance)||100;
			result.push( { count: count, chance: chance, id: id } );
		});
		return result;
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

	Array.chancePick = function(lootArray,sandBag=1.0) {
		let result = [];
		for( let loot of lootArray ) {
			for( let i=0 ; i<loot.count ; ++i ) {
				if( Math.chance(loot.chance>= 100 ? 100 : loot.chance*sandBag) ) {
					result.push(loot.id);
				}
			}
		}
		return result;
	}

	Array.makePickTable = function(table,chanceFn) {
		console.assert( table && table.length );
		let chance = [];
		let total = 0;
		for( let i=0 ; i<table.length ; i++ ) {
			if( !table[i] ) debugger;
			let value = chanceFn(table[i]);
			if( typeof value != 'number' ) debugger;
			chance[i] = value;
			total += chance[i];
		}
		return { table:table, chance:chance, total:total };
	}

	//**
	// Takes a table of things, whatever you want, and uses the chanceFn to get values of likelihood.
	// Then it traverses again picking a random one by poportions. If it fails (total=0) it tries the fallbackFn instead.
	Array.pickFrom = function(table,chance,total) {
		let n = Math.rand(0,total);
		for( let i=0 ; i<table.length ; ++i ) {
			n -= chance[i];
			if( n<=0 ) return table[i];
		}
		debugger;
	}
	Array.pickFromPaired = function(table) {
		let total = 0;
		for( let i=0 ; i<table.length ; i+=2 ) {
			total += table[i];
		}
		let n = Math.rand(0,total);
		for( let i=0 ; i<table.length ; i+=2 ) {
			n -= table[i];
			if( n<=0 ) return table[i+1];
		}
		debugger;
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
		 	let armorAtLevel1 = 0.30;
		 	let armorAtLevel100 = 0.80;
		 	let armor = armorAtLevel1+((playerLevel-1)/100)*(armorAtLevel100-armorAtLevel1);
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

let GetUniqueEntityId = (function() {
	let humanNameList = null;
	let shuffled = false;
	let codes = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	let counter = 0;

	function timeBasedUid() {
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

	return function(typeId,level) {
		if( !shuffled && getHumanNameList ) {
			humanNameList = Array.shuffle(getHumanNameList());
			shuffled = true;
		}

		let id = (humanNameList?pick(humanNameList)+'.':'')+typeId+(level?'.'+level:'')+'.'+timeBasedUid();
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

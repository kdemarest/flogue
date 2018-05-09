// STATIC UTILITY FUNCTIONS

function nop() {}

(function(){
	Math.clamp = function(value,min,max) {
		return Math.max(min,Math.min(max,value));
	}

	Math.randInt = function(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}
	Math.rand = function(min, max) {
		return Math.random()*(max-min)+min;
	}
	Math.chance = function(percent) {
		return Math.rand(0,100) < percent;
	}
	String.capitalize = function(s) {
	    return s.charAt(0).toUpperCase() + s.slice(1);
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
})();

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

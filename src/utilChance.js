Module.add('utilChance',function() {

let ChanceToAppear = {};

ChanceToAppear.Simple = function(entityLevel,mapLevel) {
	if( entityLevel > mapLevel ) {
		return 0;
	}
	// This used to be complicated, making it so that things of lower level tended to appear.
	// But that seems silly.
	let spanOfLevelsThingsAppear = Rules.DEPTH_SPAN/5;	// about 4 levels.
	if( entityLevel <= mapLevel - spanOfLevelsThingsAppear ) {
		return 0.02;
	}
	return 1.0;


//	let span = Math.max(3,Rules.DEPTH_SPAN/10);
//	let x = (entityLevel+span)-mapLevel;
//	let n = 1-Math.abs(x/span);
//	return Math.clamp( n, 0.02, 1.0 );
}

ChanceToAppear.Ramp = function(entityLevel,mapLevel) {
	if( entityLevel > mapLevel ) {
		return 0;
	}

	let amt = 0.01 * (entityLevel*entityLevel*entityLevel+1) / (Rules.DEPTH_MAX*Rules.DEPTH_MAX*Rules.DEPTH_MAX);
	return amt*(mapLevel-entityLevel+1);

	return (entityLevel+mapLevel) / (Rules.DEPTH_MAX*2);

	let total  = Rules.DEPTH_MAX+1-entityLevel;
	let remain = Rules.DEPTH_MAX+1-mapLevel;
	return 0.1*entityLevel + remain/total;
}

ChanceToAppear.Bell = function(entityLevel,mapLevel) {
	if( mapLevel < entityLevel ) {
		return 0;
	}
	let o = 0.65;
	let u = 2.0;
	let x = (mapLevel - entityLevel)/10*Rules.DEPTH_SPAN;

	// Creates a bell curve which is near 1.0 at five levels above 
	let chance = 1.629308 * (1/(o*Math.sqrt(2*Math.PI))) * Math.exp( -( Math.pow((x/5)-u,2) / (2*o*o) ) );

	return chance;
}

ChanceToAppear.Sigmoid = function(entityLevel,mapLevel,span=Rules.DEPTH_SPAN) {
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

ChanceToAppear.SigmoidDropping = function(entityLevel,mapLevel,span=Rules.DEPTH_SPAN*0.25) {
	if( mapLevel < entityLevel ) {
		return 0;
	}
	// it takes <span> levels for this thing to get from 0.0 frequency to 1.0 frequency.
	let x = mapLevel - entityLevel;

	// Increases chances from about 7% to near 100% ten levels away from starting level.
	//let chance = 1 - (1 / (1+Math.exp(x*(5/span)-(span*0.25))));
	let chance = 1-(1/(1+Math.pow(100,x/(0.5*span)-1)));

	let base   = entityLevel+span;
	let total  = Rules.DEPTH_MAX+1-base;
	let remain = Rules.DEPTH_MAX+1-mapLevel;
	if( remain > 0 && total > 0 ) {
		chance = (entityLevel+1)/(mapLevel+1); //(remain/total);
	}
	return chance;
}

return {
	ChanceToAppear: ChanceToAppear
}

});

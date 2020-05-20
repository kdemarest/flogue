Module.add('dataChecker',function(extern) {

let Checker = {};

Checker.checkSupply = function(supplyMixed,sourceId,allowTilesAndMonsters) {
	if( !supplyMixed ) {
		return;
	}
	let picker = new Picker(0);
	let supplyArray = Array.supplyParse(supplyMixed);		
	for( let i=0 ; i<supplyArray.length ; ++i ) {
		supplyArray[i].chance = 100;
	}
	let makeList = Array.supplyToMake(supplyArray);
	makeList.forEach( make => {
		if( allowTilesAndMonsters && TypeIdToSymbol[make.typeFilter] ) {
			return;
		}
		let any = (''+make.typeFilter).toLowerCase()==='any';
		let type = picker.pickItem( [any ? '' : make.typeFilter,any ? 'isTreasure' : ''].join(' ').trim(), null, false );
		if( any && type && !type.isTreasure ) {
			debugger;
		}
		if( !type ) {
			console.log( 'Type '+sourceId+' has illegal loot '+make.typeFilter );
			debugger;
		}
	});
}

Checker.checkLoot = type => {
	Checker.checkSupply(type.carrying,type.typeId);
	Checker.checkSupply(type.wearing,type.typeId);
	Checker.checkSupply(type.loot,type.typeId);
	Checker.checkSupply(type.harvestLoot,type.typeId);
	Checker.checkSupply(type.lootOnDrop,type.typeId);
	Checker.checkSupply(type.trail,type.typeId);
}

Checker.checkResistance = irvString => {
	if( !irvString ) return;

	let resistanceList = {}
	ResistanceList.forEach( res => resistanceList[res] = true );

	let irvArray = String.arSplit(irvString);
	irvArray.forEach( irv => {
		console.assert( resistanceList[irv] || resistanceList[irv.toUpperCase()] );
	});
}

return {
	Checker: Checker
}

});
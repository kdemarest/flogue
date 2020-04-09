Module.add('dataConditioner',function(extern) {

extern.Type.checkSupply = function(supplyMixed,sourceId,allowTilesAndMonsters) {
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

extern.Type.checkLoot = type => {
	Type.checkSupply(type.carrying,type.typeId);
	Type.checkSupply(type.wearing,type.typeId);
	Type.checkSupply(type.loot,type.typeId);
	Type.checkSupply(type.harvestLoot,type.typeId);
	Type.checkSupply(type.lootOnDrop,type.typeId);
}

extern.Type.checkResistance = irvString => {
	if( !irvString ) return;

	let resistanceList = {}
	ResistanceList.forEach( res => Object.assign(resistanceList,res) );

	let irvArray = String.arSplit(irvString);
	irvArray.forEach( irv => {
		console.assert( resistanceList[irv] || resistanceList[irv.toUpperCase()] );
	});
}

return {
}

});
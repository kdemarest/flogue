Module.add('inventory',function() {


	class Inventory {
	};

	Inventory.lootGenerate = function( lootSpec, level ) {
		let itemList = [];
		new Picker(level).pickLoot( lootSpec, item=>{
			item._addToListAndBunch(itemList);
		});
		return itemList;
	}

	Inventory.lootTo = function( target, lootSpec, level, originatingEntity, quiet, onEachRaw, onEachGiven ) {
		let itemList = Inventory.lootGenerate( lootSpec, level );
		Inventory.giveTo( target, itemList, originatingEntity, quiet, onEachRaw, onEachGiven);
		return itemList;
	}


	Inventory.giveTo = function(target, inventory, originatingEntity, quiet, onEachRaw, onEachGiven) {
		let found = [];
		let inventoryTemp = inventory.slice();	// because the inventory could chage out from under us!
		Object.each( inventoryTemp, item => {
			//if( !item.isTreasure && !item.isNatural ) debugger;
			// BEWARE that giveTo() can aggregate, so deal with found and onEach FIRST.
			found.push(mObject|mA|mList|mBold,item);
			// WARNING: We have to give the item to the entity before calling onEach, because what if
			// it needs to unbunch? That can only happen 
			if( onEachRaw ) { onEachRaw(item); }
			let possiblyAggregatedItem = item.giveTo( target, target.isMap ? originatingEntity.x : target.x, target.isMap ? originatingEntity.y : target.y);
			if( onEachGiven ) { onEachGiven(possiblyAggregatedItem); }
		});

		// Tell the player about it. This is unfortunately really long.
		if( !quiet && !target.inVoid ) {
			let verb = originatingEntity && originatingEntity.mayHarvest ? 'harvest' : 'find'
			let predicate = 'on';
			if( originatingEntity && originatingEntity.isItemType && !originatingEntity.usedToBe ) predicate = 'in';
			if( originatingEntity && originatingEntity.mayHarvest ) predicate = 'from';
			let description = [
				mSubject,target,' ',mVerb,verb,' '
			].concat( 
				found.length ? found : ['nothing'],
				originatingEntity ? [' ',predicate,' ',mObject,originatingEntity] : [''],
				'.'
			);
			tell(...description);
		}
	}

return {
	Inventory: Inventory
}

});
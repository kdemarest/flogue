class DataConditioner {
	constructor() {
	}

	integratePlaceData() {

		let s2t = {};
		let t2s = {};
		function extract() {
			for( let typeList of arguments ) {
				for( let t in typeList ) {
					let s = typeList[t].symbol;
					s2t[s] = t;
					t2s[t] = s;
				}
			}
		}
		extract(TileTypeList,ItemTypeList,MonsterTypeList);
		if( s2t[TILE_UNKNOWN] ) {
			// WARNING: I'm reserving the ' ' symbol to mean 'nothing here, replaceable' in a place map.
			debugger;
		}

		let sIndex = 32+1;
		function getUnusedSymbol() {
			while( s2t[String.fromCharCode(sIndex)] ) {
				++sIndex;
			}
			return String.fromCharCode(sIndex);
		}

		// Give symbols to anything that lacks a symbol.
		for( let placeId in PlaceSourceList ) {

			let place = PlaceSourceList[placeId];	// make a copy so that we can mangle it.
			place.id = placeId;
			let roster = Object.assign({},place.monsterTypes,place.itemTypes,place.tileTypes);
			for( let typeId in roster ) {
				// If there is no symbol in the existing corpus...
				if( !t2s[typeId] ) {
					let s = getUnusedSymbol();
					t2s[typeId] = s;
					s2t[s] = typeId;
				}
			}

			Object.assign(StickerList,		place.stickers);
			Object.assign(DamageType,		place.damageType);
			Object.assign(Attitude,			place.attitude);
			Object.assign(PickImmune,		place.pickImmune);
			Object.assign(PickVuln,			place.pickVuln);
			Object.assign(PickResist,		place.pickResist);
			Object.assign(EffectTypeList,	place.effectList);

			function processTypeList(targetList,typeList) {
				for( let typeId in typeList ) {
					let type = typeList[typeId];
					let targetType = targetList[typeId];
					let newType = Object.assign( {}, type.basis ? targetList[type.basis] || {} : {}, targetType || {}, type, {symbol:t2s[typeId]} );
					targetList[typeId] = newType;
				}
			}
			processTypeList( TileTypeList, 		place.tileTypes );
			processTypeList( ItemTypeList,		place.itemTypes );
			processTypeList( MonsterTypeList,	place.monsterTypes );
		}
	}

	prepareStaticData() {
		for( let list of FabList ) {
			for( let key in list ) {
				list[key] = fab(list[key],key);
			}
		}

		Object.entries(StickerList).forEach( ([typeId,sticker]) => {
			fab(sticker,typeId,'isSticker');
		} );
		Object.entries(TileTypeList).forEach( ([typeId,tileType]) => {
			fab(tileType,typeId,'isTileType');
		} );
		Object.entries(ItemTypeList).forEach( ([typeId,itemType]) =>  {
			itemType = Object.assign( {}, ItemTypeDefaults, itemType );
			itemType.namePattern = itemType.namePattern || typeId;
			ItemTypeList[typeId] = fab(itemType,typeId,'isItemType');
		} );
		Object.entries(MonsterTypeList).forEach( ([typeId,monsterType]) =>  {
			monsterType = Object.assign( {}, MonsterTypeDefaults, MonsterTypeList[typeId] );
			MonsterTypeList[typeId] = fab(monsterType,typeId,'isMonsterType');
		} );
	}
};

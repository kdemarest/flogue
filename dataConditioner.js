class DataConditioner {
	constructor() {
		this.validateAndConditionThemeData();
		this.integratePlaceData();
		this.prepareStaticData();
	}

	validateAndConditionThemeData() {
		function extractRarity(theme,rarity,list) {
			if( !list ) {
				return;
			}
			list = String.chanceParse(list);
			list.map( chance => {
				if( theme.rarityTable[chance.id] ) {
					// This placeId is duplicated in the same or another rarity table.
					debugger;
				}

				theme.rarityTable[chance.id] = rarity;
				if( !PlaceList[chance.id] ) {
					debugger;
				}
			});

		}

		for( let themeId in ThemeList ) {
			let theme = ThemeList[themeId];
			theme.id = themeId;
			theme.rarityTable = {};
			extractRarity(theme,rPROFUSE,theme.rPROFUSE);
			extractRarity(theme,rCOMMON,theme.rCOMMON);
			extractRarity(theme,rUNCOMMON,theme.rUNCOMMON);
			extractRarity(theme,rRARE,theme.rRARE);
			extractRarity(theme,rEPIC,theme.rEPIC);
			extractRarity(theme,rLEGENDARY,theme.rLEGENDARY);
		}
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
		for( let placeId in PlaceList ) {

			let place = PlaceList[placeId];
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
			Object.assign(PickIgnore,		place.pickIgnore);
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

		// Be sure to do this afterwards, just in case a place uses a monster from a place further down the list.
		for( let placeId in PlaceList ) {
			let NO_MONSTERS = -1;
			let level = NO_MONSTERS;
			let place = PlaceList[placeId];
			if( !place.map && !place.floodId ) {
				debugger;
			}
			if( place.map ) {
				place.tileCount = 0;
				for( let i=0 ; i<place.map.length ; ++i ) {
					let s = place.map.charAt(i);
					if( s=='\t' || s=='\n' ) continue;
					place.tileCount ++;
					let monster = MonsterTypeList[place.symbols[s] || s2t[s]];
					if( monster ) {
						level = Math.max(level,monster.level||1);
					}
				}
			}
			if( !place.tileCount ) debugger;
			if( place.level && level > place.level+5 ) {
				console.log("WARNING: Place "+placeId+" is level "+place.level+" but has level "+level+" monsters.");
			}
			place.level = place.level || level;
			if( place.level == NO_MONSTERS ) {
				place.level = 'any';
			}
			//console.log("place "+place.id+" is level "+place.level);
		}
	}

	prepareStaticData() {
		for( let list of FabList ) {
			for( let key in list ) {
				list[key] = fab(list[key],key);
			}
		}

		Object.entries(EffectTypeList).forEach( ([typeId,effect]) => {
			fab(effect,typeId,'isEffect');
		} );
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

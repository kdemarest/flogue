class DataConditioner {
	constructor() {
		this.mergePlaceTypesToGlobals();
		this.fabAllData();
		this.determinePlaceLevels();
		this.determinePlaceSymbolHash();
		this.validateAndConditionThemeData();
	}

	validateAndConditionThemeData() {
		function extractRarityHash(theme,rarity,list) {
			if( !list ) {
				return;
			}
			list = String.chanceParse(list);
			list.map( chance => {
				if( theme.rarityHash[chance.id] ) {
					// This placeId is duplicated in the same or another rarity table.
					debugger;
				}

				theme.rarityHash[chance.id] = rarity;
				if( !PlaceTypeList[chance.id] ) {
					debugger;
				}
			});

		}

		for( let themeId in ThemeList ) {
			let theme = ThemeList[themeId];
			theme.id = themeId;
			theme.rarityHash = {};
			extractRarityHash(theme,rPROFUSE,theme.rPROFUSE);
			extractRarityHash(theme,rCOMMON,theme.rCOMMON);
			extractRarityHash(theme,rUNCOMMON,theme.rUNCOMMON);
			extractRarityHash(theme,rRARE,theme.rRARE);
			extractRarityHash(theme,rEPIC,theme.rEPIC);
			extractRarityHash(theme,rLEGENDARY,theme.rLEGENDARY);
		}
	}

	mergePlaceTypesToGlobals() {

		for( let placeId in PlaceTypeList ) {
			let place = PlaceTypeList[placeId];
			place.id = placeId;

			function mergeSimple(a,b) {
				Object.assign(a,b);
			}

			function merge(targetList,typeList) {
				for( let typeId in typeList ) {
					console.assert( !targetList[typeId] );
					let type = typeList[typeId];

					targetList[typeId] = Object.assign(
						{},
						type.basis ? targetList[type.basis] || typeList[type.basis] || {} : {},
						type
					);
					typeList[typeId] = targetList[typeId];
				}
			}

			mergeSimple( DamageType,	place.damageType);
			mergeSimple( Attitude,		place.attitude);
			mergeSimple( PickIgnore,	place.pickIgnore);
			mergeSimple( PickVuln,		place.pickVuln);
			mergeSimple( PickResist,	place.pickResist);

			merge( StickerList,		place.stickers );
			merge( EffectTypeList,	place.effectList );
			merge( TileTypeList, 	place.tileTypes );
			merge( ItemTypeList,	place.itemTypes );
			merge( MonsterTypeList,	place.monsterTypes );
		}
	}

	determinePlaceLevels() {

		// Be sure to do this afterwards, just in case a place uses a monster from a place further down the list.
		for( let placeId in PlaceTypeList ) {
			let NO_MONSTERS = -1;
			let level = NO_MONSTERS;
			let place = PlaceTypeList[placeId];
			if( !place.map && !place.floodId ) {
				debugger;
			}
			if( place.map ) {
				place.tileCount = 0;
				for( let i=0 ; i<place.map.length ; ++i ) {
					let s = place.map.charAt(i);
					if( s=='\t' || s=='\n' || s==TILE_UNKNOWN ) continue;
					place.tileCount ++;
					let monster = MonsterTypeList[place.symbols[s]];
					if( monster ) {
						level = Math.max(level,monster.level||MIN_DEPTH);
					}
				}
			}
			if( !place.tileCount && !place.tilePercent ) debugger;
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

	determinePlaceSymbolHash() {
		Object.each( PlaceTypeList, place => {
			let symbolHash = {};
			function add(typeId) {
				console.assert( typeId );
				let symbol = TypeIdToSymbol[typeId];
				console.assert(symbol);
				symbolHash[symbol] = true;
			}

			Object.each( place.symbols, option => {
				// When you specify symbol.w: 'weapon.dagger' this triggers
				if( typeof option == 'string' ) {
					add( option.split('.')[0] )
					return;
				}
				// Specify an array to pick among.
				if( Array.isArray(option) ) {
					option.forEach( typeId => add(typeId.split('.')[0]) );
					return;
				}
				// When you specify symbol.w: { typeId: 'weapon.dagger', isWonderful: true } this triggers
				if( option !== undefined && typeof option == 'object' ) {
					console.assert( option.typeId );
					add( option.typeId.split('.')[0] );
					return;
				}
				console.assert(false);	// unhandled type in place list.
			});
			place.symbolHash = symbolHash;
		});
	}


	fabAllData() {
		Fab.add( 'isScape',			ScapeList );
		Fab.add( 'isTheme',			ThemeList );
		Fab.add( 'isPlace',			PlaceTypeList );
		Fab.add( 'isSticker', 		StickerList );
		Fab.add( 'isEffect',		EffectTypeList );
		Fab.add( 'isTileType', 		TileTypeList, 	true, true );
		Fab.add( 'isItemType',		ItemTypeList, 	true, true, ItemTypeDefaults );
		Fab.add( 'isMonsterType',	MonsterTypeList, true, true, MonsterTypeDefaults );

		Fab.process();

		Object.entries(ItemTypeList).forEach( ([typeId,itemType]) =>  {
			itemType.namePattern = itemType.namePattern || typeId;

		} );
	}
};

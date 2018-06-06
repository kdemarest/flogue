class DataConditioner {
	constructor() {
		this.mergePlaceTypesToGlobals();
		this.fabAllData();
		this.determinePlaceLevels();
		this.validateAndConditionThemeData();
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

	mergePlaceTypesToGlobals() {

		for( let placeId in PlaceList ) {
			let place = PlaceList[placeId];
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
					if( s=='\t' || s=='\n' || s==TILE_UNKNOWN ) continue;
					place.tileCount ++;
					let monster = MonsterTypeList[place.symbols[s]];
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

	fabAllData() {
		Fab.add( 'isScape',			ScapeList );
		Fab.add( 'isTheme',			ThemeList );
		Fab.add( 'isPlace',			PlaceList );
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

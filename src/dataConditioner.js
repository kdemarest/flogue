class DataConditioner {
	constructor() {
		this.mergePlaceTypesToGlobals();
		this.fabAllData();
		this.determinePlaceLevels();
		this.determineAndValidatePlaceSymbolHash();
		this.validateAndConditionThemeData();
		this.validateLoot();
		this.validateResistances();
	}

	// Within any category of rarity, like rCOMMON, you can give a chance that further alters the probability,
	// for example rCOMMON: 'dog, 50% cat'
	validateAndConditionThemeData() {
		function extractRarityHash(theme,rarity,supplyMixed) {
			if( !supplyMixed ) {
				return;
			}
			let supplyArray = Array.supplyParse(supplyMixed);
			supplyArray.map( supply => {
				console.assert( supply.count==1 );
				console.assert( supply.typeFilter );
				if( theme.rarityHash[supply.typeFilter] ) {
					// This placeId is duplicated in the same or another rarity table.
					debugger;
				}

				theme.rarityHash[supply.typeFilter] = rarity * supply.chance/100;
				if( !PlaceTypeList[supply.typeFilter] ) {
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

			let supplyArray = Array.supplyParse( theme.rREQUIRED || '' );
			Array.supplyValidate( supplyArray, PlaceTypeList );

			if( theme.jobSupply ) {
				let jobSupply = Array.supplyParse( theme.jobSupply || '' );
				Array.supplyValidate( jobSupply, JobTypeList );
			}
			if( theme.jobPick ) {
				let pt = new PickTable().scanKeys(theme.jobPick);
				pt.validate(JobTypeList);
			}
		}
	}

	validateResistances() {
		let hash = {};
		Object.assign(hash,DamageType);
		Object.assign(hash,DeedOp);
		Object.assign(hash,Attitude);
		Object.assign(hash,MiscImmunity);
		Object.assign(hash,EffectTypeList);
		Object.assign(hash,WeaponMaterialList);
		Object.assign(hash,BowMaterialList);

		function check(irv) {
			if( !irv ) return;
			let a = String.arSplit(irv);
			a.forEach( imm => {
				console.assert( hash[imm] || hash[imm.toUpperCase()] );
			});
		}

		Object.each( MonsterTypeList, m => {
			check( m.immune );
			check( m.resist );
			check( m.vuln );
		});
	}

	checkSupply(supplyMixed,sourceId,allowTilesAndMonsters) {
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

	validateLoot() {

		let picker = new Picker(0);
		Object.each( MonsterTypeList, m => {
			let supplyMixed = Array.supplyConcat( m.inventoryLoot, m.inventoryWear );
			this.checkSupply(supplyMixed,m.typeId);
		});

		Object.each( ItemTypeList, item => {
			if( item.inventoryLoot ) {
				this.checkSupply(item.inventoryLoot,item.typeId);
			}
			if( item.ammoType ) {
				if( !item.ammoSpec ) {
					console.log( 'Item '+item.typeId+' needs an ammoSpec!' );
					debugger;
				}
				else {
					let type = picker.pickItem( item.ammoSpec, null, false );
					if( !type ) {
						console.log( 'Item '+item.typeId+' has illegal ammoSpec ['+item.ammoSpec+']' );
					}
				}
			}
		});
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
					if( type.basis ) {
						console.assert( targetList[type.basis] || typeList[type.basis] );
					}

					targetList[typeId] = Object.assign(
						{},
						type.basis ? targetList[type.basis] || typeList[type.basis] || {} : {},
						type
					);
					typeList[typeId] = targetList[typeId];

					if( targetList[typeId].isMonsterType ) {
						// Do this AFTER any merge due to "basis", notably for the body slots.
						monsterPreProcess(typeId,targetList[typeId]);
					}
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
					let supplyArray = Array.supplyParse(place.symbols[s]);
					supplyArray.forEach( supply => {
						console.assert(supply.typeFilter || supply.pick);
						// We don't check on the pick list. Maybe we should.
						let monster = supply.typeFilter ? MonsterTypeList[supply.typeFilter.split('.')[0]] : null;
						if( monster ) {
							level = Math.max(level,monster.level||DEPTH_MIN);
							place.comesWithMonsters = true;
						}
					});
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

	determineAndValidatePlaceSymbolHash() {
		Object.each( PlaceTypeList, place => {
			let symbolHash = {};
			function add(typeId) {
				console.assert( typeId );
				let symbol = TypeIdToSymbol[typeId];
				console.assert(symbol);
				symbolHash[symbol] = true;
			}

			Object.each( place.symbols, option => {
				this.checkSupply( option, place.typeId, true );
				let supplyArray = Array.supplyParse(option);
				supplyArray.forEach( supply => {
					if( supply.pick ) {
						supply.pick.forEach( typeFilter => add( typeFilter.split('.')[0] ) );
					}
					else {
						if( supply.inventoryLoot ) {
							this.checkSupply( supply.inventoryLoot, place.typeId+':'+supply.typeFilter );
						}
						add( supply.typeFilter.split('.')[0] );
					}
				});
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
		Fab.add( 'isJobType',		JobTypeList );

		Fab.process();

		Object.entries(ItemTypeList).forEach( ([typeId,itemType]) =>  {
			itemType.namePattern = itemType.namePattern || typeId;

		} );
	}
};
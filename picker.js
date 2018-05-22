class Picker {
	constructor(level) {
		this.level = level;
	}

	// Contains entries from PlaceSourceList
	buildPlaceTable() {
		let placeTable = [];
		for( let placeId in PlaceSourceList ) {
			let p = PlaceSourceList[placeId];
			if( p.level > this.level || p.neverPick ) {
				continue;
			}
			let placeLevel = p.level || this.level;
			let chance = Math.floor(Math.clamp(Math.chanceToAppearSimple(placeLevel,this.level) * 100000, 1, 100000));
			chance *= (p.rarity || 1);
			placeTable.push(chance,p);
		}
		return placeTable;
	}

	// Contains entries in MonsterTypeList
	buildMonsterTable() {
		let monsterTable = [];
		for( let typeId in MonsterTypeList ) {
			let m = MonsterTypeList[typeId];
			if( m.level > this.level || m.neverPick ) {
				continue;
			}
			let chance = Math.floor(Math.clamp(Math.chanceToAppearSimple(m.level,this.level) * 100000, 1, 100000));
			chance *= (m.rarity || 1);
			monsterTable.push(chance,m);
		}
		return monsterTable;
	}

	// Contains { typeId, itemType, presets }
	buildItemTable() {
		let itemTable = [];

		let one = { nothing: { skip:true, level:0 } };
		Object.each(ItemTypeList, item => {
			let startIndex = itemTable.length;
			let chanceTotal = 0;
			Object.each( item.varieties || one, v => {
				Object.each( item.materials || one, m => {
					Object.each( item.qualities || one, q => {
						Object.each( item.effectChoices || one, e => {
							let level = (item.level||0) + (v.level||0) + (m.level||0) + (q.level||0) + (e.level||0);
							if( level > this.level || item.neverPick || v.neverPick || m.neverPick || q.neverPick || e.neverPick ) {
								return;
							}
							let chance = Math.floor(Math.clamp(Math.chanceToAppearSigmoid(level,this.level) * 100000, 1000, 100000));
							chance *= (v.rarity||1) * (m.rarity||1) * (q.rarity||1) * (e.rarity||1);
							chanceTotal += chance;
							let obj = { typeId: item.typeId, item: item, presets: {} };
							if( !v.skip ) obj.presets.variety = v;
							if( !m.skip ) obj.presets.material = m;
							if( !q.skip ) obj.presets.quality = q;
							if( !e.skip ) obj.presets.effectType = e;
							itemTable.push(chance,obj);
						});
					});
				});
			});
			// Now rebalance because the number of varieties should not tilt the chance...
			if( chanceTotal ) {
				let ratio = (100000 / chanceTotal) * (item.rarity||1);
				console.log(item.typeId+' balanced by '+ratio);
				for( let i=startIndex ; i<itemTable.length ; i+=2 ) {
					itemTable[i] = Math.clamp(Math.floor(itemTable[i]*ratio),1,100000);
				}
			}
		});
		return itemTable;
	}

	pick(table,typeId) {
		let total = 0;
		for( let i=0 ; i<table.length ; i += 2 ) {
			if( !typeId || table[i+1].typeId == typeId ) {
				total += table[i];
			}
		}
		if( !total ) {
			return false;
		}
		let n = Math.rand(0,total);
		let i = -2;
		do {
			i += 2;
			if( !typeId || table[i+1].typeId == typeId ) {
				n -= table[i];
			}
		} while( n>0 );
		if( i>table.length ) {
			debugger;
		}

		return table[i+1];
	}
}

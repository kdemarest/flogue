(function() {

let PickerCache = {
};

function PickerSetTheme(theme) {
	PickerCache.theme = theme;
}

class Picker {
	constructor(level,theme) {
		this.level = level;
		this.theme = theme || PickerCache.theme;
		this.cacheId = this.theme.id+'.'+this.level;
	}

	cache(type,table) {
		if( table ) {
			PickerCache[this.cacheId+'.'+type] = table;
		}
		return PickerCache[this.cacheId+'.'+type];
	}

	generatePlacesRequired() {
		let chanceList = String.chanceParse( this.theme.rREQUIRED || '' );
		let table = Array.chancePick(chanceList);
		return table;
	}

	// Contains entries from PlaceList
	get placeTable() {
		if( !this.cache('place') ) {
			let table = [];
			for( let placeId in PlaceList ) {
				let place = PlaceList[placeId];
				if( place.neverPick || (place.level != 'any' && place.level > this.level) ) {
					continue;
				}
				if( !this.theme.rarityTable[placeId] ) {
					continue;
				}
				let placeLevel = (place.level=='any' ? this.level : place.level);
				let chance = Math.floor(Math.clamp(Math.chanceToAppearSimple(placeLevel,this.level) * 100000, 1, 100000));
				chance *= (this.theme.rarityTable[placeId] || 1);
				table.push(chance,place);
			}
			this.cache('place',table);
		}
		return this.cache('place');
	}

	// Contains entries in MonsterTypeList
	get monsterTable() {
		if( !this.cache('monster') ) {
			let table = [];
			for( let typeId in MonsterTypeList ) {
				let m = MonsterTypeList[typeId];

				if( this.theme.monsters ) {
					let ok = false;
					for( let stat of this.theme.monsters ) {
						ok = ok || m[stat];		// like 'isAnimal' or 'isUndead'
					}
					if( !ok ) {
						continue;
					}
				}
				if( m.level > this.level || m.neverPick ) {
					continue;
				}
				let chance = Math.floor(Math.clamp(Math.chanceToAppearSimple(m.level,this.level) * 100000, 1, 100000));
				chance *= (m.rarity || 1);
				table.push(chance,m);
			}
			this.cache('monster',table);
		}
		return this.cache('monster');
	}

	// Contains { typeId, itemType, presets }
	get itemTable() {
		if( !this.cache('item') ) {

			let table = [];
			let gScale = 1000000;

			let chanceGrandTotal = 0;
			let itemTypeChance = {};
			let one = { nothing: { skip:true, level:0 } };
			Object.each(ItemTypeList, item => {
				let startIndex = table.length;
				let chanceTotal = 0;
				Object.each( item.varieties || one, v => {
					Object.each( item.materials || one, m => {
						Object.each( item.qualities || one, q => {
							Object.each( item.effects || one, e => {
								let chance = 0;
								let level = (item.level||0) + (v.level||0) + (m.level||0) + (q.level||0) + (e.level||0);
								if( level > this.level ) {
									chance = 0;
								}
								else {
									if( !this.level ) debugger;
									let chance = Math.chanceToAppearSigmoid(level,this.level) * gScale;
									chance *= (v.rarity||1) * (m.rarity||1) * (q.rarity||1) * (e.rarity||1);
									if( item.neverPick || v.neverPick || m.neverPick || q.neverPick || e.neverPick ) {
										chance = 0;
										// WARNING! This means it will never be RANDOMLY picked, but it also means that when
										// specified it will be FOUND!
									}
								}

								// Someday let the theme prefer items

								chanceTotal += chance;
								item = Object.assign( {}, item, {
									level: level,
									keywords: '!'+item.typeId+'!',
									presets: {}
								});
								if( !v.skip ) { item.presets.variety = v; item.keywords += item.typeId+'.'+v.typeId+'!'+v.typeId+'!'; }
								if( !m.skip ) { item.presets.material = m; item.keywords += item.typeId+'.'+m.typeId+'!'+m.typeId+'!'; }
								if( !q.skip ) item.presets.quality = q;
								if( !e.skip ) { item.presets.effect = e; item.keywords += item.typeId+'.'+e.typeId+'!' }
								if( item.rechargeTime ) item.presets.rechargeTime = this.pickRechargeTime(item);
								if( item.isArmor ) item.presets.armor = this.pickArmor(item,m,v,q,e);
								if( item.isWeapon ) item.presets.damage = this.pickDamage(item.presets.rechargeTime,item,m,v,q,e);
								// WARNING! This will skew the gold count improperly!
								if( item.isGold ) item.presets.goldCount = this.pickGoldCount(item);
								table.push(chance,item);
							});
						});
					});
				});
				itemTypeChance[item.typeId] = chanceTotal;
				chanceGrandTotal += chanceTotal;
			});

			if( chanceGrandTotal ) {
				Object.each(ItemTypeList, itemType => {
					if( !itemTypeChance[itemType.typeId] ) {
						return;
					}
					// Now rebalance because the number of varieties should not tilt the chance...
					if( !itemType.rarity ) debugger;
					let ratio = (gScale / itemTypeChance[itemType.typeId]) * itemType.rarity;
					console.log(itemType.typeId+' balanced by '+ratio);
					for( let i=0 ; i<table.length ; i+=2 ) {
						if( table[i+1].typeId == itemType.typeId ) {
							table[i] = table[i]*ratio;
						}
					}
				});
			}

			let actual = {};
			let count = {};
			let actualTotal = 0;
			for( let i=0 ; i<table.length ; i += 2 ) {
				if( !table[i+1].isTreasure ) continue;
				let t = table[i+1].typeId;
				actual[t] = (actual[t] || 0)+table[i];
				count[t] = (count[t] || 0)+1;
				actualTotal += table[i];
			}
			Object.each( ItemTypeList, item => {
				let t = item.typeId;
				if( !actual[t] ) return;
				let pct = Math.percent(actual[t]/actualTotal,3);
				console.log(pct+'% '+t+' in '+count[t]+' varieties');
			});

			let t = [];
			for( let i=0 ; i<table.length ; i+=2 ) {
				t.push([table[i],'L'+table[i+1].level+' '+table[i+1].typeId+' '+(table[i+1].presets.effect ? table[i+1].presets.effect.typeId : 'x')]);
			}
			t.sort( function(a,b) { return b[0]-a[0]; } );
			console.log("Top 20 items are: ");
			for( let i=0 ; i<20 ; ++i ) {
				console.log( Math.percent(t[i][0]/actualTotal,3)+'  '+t[i][1]);
			}

			this.cache('item',table);
		}
		return this.cache('item');
	}

	pickRechargeTime(itemType) {
		return rollDice(itemType.rechargeTime);
	}

	pickArmor(i,m,v,q,e) {
		let am = 1;
		if( i && i.armorMultiplier ) am *= i.armorMultiplier;
		if( m && m.armorMultiplier ) am *= m.armorMultiplier;
		if( v && v.armorMultiplier ) am *= v.armorMultiplier;
		if( q && q.armorMultiplier ) am *= q.armorMultiplier;
		if( e && e.armorMultiplier ) am *= e.armorMultiplier;

		// Intentionally leave out the effect level, because that is due to the effect.
		let x = {level:0};
		let itemLevel = (i.level||0)+((v||x).level||0)+((m||x).level||0)+((q||x).level||0);

		let avgLevel = (itemLevel+this.level)/2;
		let baseArmor = Rules.playerArmor(avgLevel)*am;
		if( isNaN(baseArmor) ) debugger;
		return Math.floor(baseArmor*ARMOR_SCALE);
	}
	pickDamage(rechargeTime,i,m,v,q,e) {
		let dm = 1;
		if( i && i.damageMultiplier ) dm *= i.damageMultiplier;
		if( m && m.damageMultiplier ) dm *= m.damageMultiplier;
		if( v && v.damageMultiplier ) dm *= v.damageMultiplier;
		if( q && q.damageMultiplier ) dm *= q.damageMultiplier;
		if( e && e.damageMultiplier ) dm *= e.damageMultiplier;

		let mult = (rechargeTime||0)>1 ? 1+rechargeTime*DEFAULT_DAMAGE_BONUS_FOR_RECHARGE : 1;
		let damage = Rules.playerDamage(this.level) * mult * dm;
		return Math.max(1,Math.floor(damage));
	}
	pickGoldCount(item) {
		let base = this.level;
		return base;
	}

	// picks it, but doesn't give it to anyone.
	pickLoot(lootString,callback) {
		let chanceList = String.chanceParse(lootString);
		let idList = new Finder( Array.chancePick(chanceList) );
		let list = [];
		idList.process( id => {
			let any = (''+id).toLowerCase()==='any';
			let type = this.pick( this.itemTable, any ? null : id, any ? 'isTreasure' : null );
			if( type ) {
				let loot = new Item( this.level, type, type.presets, {isLoot:true} );
				if( callback ) {
					callback(loot);
				}
			}
		});
		return new Finder(list);
	}

	pick(rawTable,typeId,filter) {

		let table = [];
		let total = 0;

		// We are allowed to pass in any VARIETY or MATERIAL to this, and it will
		let k = typeId ? '!'+typeId+'!' : null;
		let filterBool = filter ? filter.match( /\s*(!)?\s*(\w+)/ )[1] !== '!' : true;
		let filterKey  = filter ? filter.match( /\s*(!)?\s*(\w+)/ )[2] : null;

		let debug = "Picking "+typeId+" "+filter+'\n';
		for( let i=0 ; i<rawTable.length ; i += 2 ) {
			let c = rawTable[i];
			let t = rawTable[i+1];
			let ok = ( !typeId || (t.typeId && t.typeId == typeId) ) || ( t.keywords && t.keywords.indexOf(k)>=0 );
//			if( t.isCorpse && filterKey ) debugger;
			ok = ok && (!filter || !!t[filterKey]==filterBool);	// like, isTreasure
			if( ok ) {
				table.push(c,t);
				total += c;
				debug += "YES  "+t.typeId+" = "+c+" "+t.keywords+'\n';
			}
			else {
				debug += "NO   "+t.typeId+" = "+c+" "+t.keywords+'\n';
			}
		}


		if( !total && table.length ) {
			// It was all neverPicks, so just choose from among those. REMEMBER that the table is
			// pairs of data, so we can't just call pick(). We should alter the table.
			for( let i=0 ; i<table.length ; i += 2 ) {
				table[i] = 1;	// just need some, even number
				++total;
			}
		}

		if( !total ) {
			debugger;
			return false;
		}
		debug += 'a';
		debug = '';

		let n = Math.rand(0,total);
		let i = -2;
		do {
			i += 2;
			n -= table[i];
		} while( n>0 );
		if( i>table.length ) {
			debugger;
		}

		return table[i+1];
	}
}

window.Picker = Picker;
window.PickerSetTheme = PickerSetTheme;
})();
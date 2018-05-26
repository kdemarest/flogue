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

	get placesRequired() {
		let table = [];
		for( let placeId in PlaceList ) {
			let place = PlaceList[placeId];
			if( this.theme.rarityTable[placeId]=='required' ) {
				table.push(place);
			}
		}
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
				if( !this.theme.rarityTable[placeId] || this.theme.rarityTable[placeId]=='required' ) {
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
								let level;
								level = (item.level||0) + (v.level||0) + (m.level||0) + (q.level||0) + (e.level||0);
								if( level > this.level ) {
									return;
								}
								if( item.neverPick || v.neverPick || m.neverPick || q.neverPick || e.neverPick ) {
									return;
								}
								if( !this.level ) debugger;
								let chance = Math.chanceToAppearSigmoid(level,this.level) * gScale;
								chance *= (v.rarity||1) * (m.rarity||1) * (q.rarity||1) * (e.rarity||1);

								// Someday let the theme prefer items

								chanceTotal += chance;
								let obj = {
									level: level,
									keywords: '!'+item.typeId+'!',
									item: item,
									presets: {}
								};
								if( !v.skip ) { obj.presets.variety = v; obj.keywords += item.typeId+'.'+v.typeId+'!'+v.typeId+'!'; }
								if( !m.skip ) { obj.presets.material = m; obj.keywords += item.typeId+'.'+m.typeId+'!'+m.typeId+'!'; }
								if( !q.skip ) obj.presets.quality = q;
								if( !e.skip ) { obj.presets.effect = e; obj.keywords += item.typeId+'.'+e.typeId+'!' }
								if( item.rechargeTime ) obj.presets.rechargeTime = this.pickRechargeTime(item);
								if( item.isArmor ) obj.presets.armor = this.pickArmor(item,m,v,q,e);
								if( item.isWeapon ) obj.presets.damage = this.pickDamage(obj.presets.rechargeTime,item,m,v,q,e);
								// WARNING! This will skew the gold count improperly!
								if( item.isGold ) obj.presets.goldCount = this.pickGoldCount(item);
								table.push(chance,obj);
							});
						});
					});
				});
				itemTypeChance[item.typeId] = chanceTotal;
				chanceGrandTotal += chanceTotal;
			});

			if( chanceGrandTotal ) {
				Object.each(ItemTypeList, item => {
					if( !itemTypeChance[item.typeId] ) {
						return;
					}
					// Now rebalance because the number of varieties should not tilt the chance...
					if( !item.rarity ) debugger;
					let ratio = (gScale / itemTypeChance[item.typeId]) * item.rarity;
					console.log(item.typeId+' balanced by '+ratio);
					for( let i=0 ; i<table.length ; i+=2 ) {
						if( table[i+1].item.typeId == item.typeId ) {
							table[i] = table[i]*ratio;
						}
					}
				});
			}

			let actual = {};
			let count = {};
			let actualTotal = 0;
			for( let i=0 ; i<table.length ; i += 2 ) {
				let t = table[i+1].item.typeId;
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
				t.push([table[i],'L'+table[i+1].level+' '+table[i+1].item.typeId+' '+(table[i+1].presets.effect ? table[i+1].presets.effect.typeId : 'x')]);
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

	pickLoot(_table,lootString) {
		let lootList = String.lootParse(lootString);
		let idList = new Finder( Array.lootPick(lootList) );
		let list = [];
		idList.process( id => {
			let obj = this.pick(_table,id);
			if( obj ) {
				list.push(obj);
			}
		});
		return new Finder(list);
	}
	pick(_table,typeId) {

		let table;
		let total = 0;

		if( !typeId ) {
			table = _table;
			for( let i=0 ; i<table.length ; i += 2 ) {
				total += table[i];
			}
		}
		else {
			// We are allowed to pass in any VARIETY or MATERIAL to this, and it will
			let choices = [];
			table = _table;
			let k = '!'+typeId+'!';
			for( let i=0 ; i<table.length ; i += 2 ) {
				let t = table[i+1];
				let ok = ( t.typeId && t.typeId == typeId ) || ( t.keywords && t.keywords.indexOf(k)>=0 );
				if( ok ) {
					choices.push(table[i],table[i+1]);
					total += table[i];
				}
			}
			table = choices;
		}

		if( !total ) {
			debugger;
			return false;
		}

//		if( table.length == 2 ) {
//			debugger;
//		}

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
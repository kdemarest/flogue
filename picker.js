let PickerCache = {
	placeTable: [],
	monsterTable: [],
	itemTable: []
};

class Picker {
	constructor(level) {
		this.level = level;
	}

	// Contains entries from PlaceSourceList
	get placeTable() {
		if( !PickerCache.placeTable[this.level] ) {
			let table = [];
			for( let placeId in PlaceSourceList ) {
				let p = PlaceSourceList[placeId];
				if( p.level > this.level || p.neverPick ) {
					continue;
				}
				let placeLevel = p.level || this.level;
				let chance = Math.floor(Math.clamp(Math.chanceToAppearSimple(placeLevel,this.level) * 100000, 1, 100000));
				chance *= (p.rarity || 1);
				table.push(chance,p);
			}
			PickerCache.placeTable[this.level] = table;
		}
		return PickerCache.placeTable[this.level];
	}

	// Contains entries in MonsterTypeList
	get monsterTable() {
		if( !PickerCache.monsterTable[this.level] ) {
			let table = [];
			for( let typeId in MonsterTypeList ) {
				let m = MonsterTypeList[typeId];
				if( m.level > this.level || m.neverPick ) {
					continue;
				}
				let chance = Math.floor(Math.clamp(Math.chanceToAppearSimple(m.level,this.level) * 100000, 1, 100000));
				chance *= (m.rarity || 1);
				table.push(chance,m);
			}
			PickerCache.monsterTable[this.level] = table;
		}
		return PickerCache.monsterTable[this.level];
	}

	// Contains { typeId, itemType, presets }
	get itemTable() {
		if( !PickerCache.itemTable[this.level] ) {

			let table = [];

			let one = { nothing: { skip:true, level:0 } };
			Object.each(ItemTypeList, item => {
				let startIndex = table.length;
				let chanceTotal = 0;
				Object.each( item.varieties || one, v => {
					Object.each( item.materials || one, m => {
						Object.each( item.qualities || one, q => {
							Object.each( item.effects || one, e => {
								let level = (item.level||0) + (v.level||0) + (m.level||0) + (q.level||0) + (e.level||0);
								if( level > this.level || item.neverPick || v.neverPick || m.neverPick || q.neverPick || e.neverPick ) {
									return;
								}
								if( !this.level ) debugger;
								let chance = Math.floor(Math.clamp(Math.chanceToAppearSigmoid(level,this.level) * 100000, 1000, 100000));
								chance *= (v.rarity||1) * (m.rarity||1) * (q.rarity||1) * (e.rarity||1);
								chanceTotal += chance;
								let obj = { typeId: item.typeId, item: item, presets: {} };
								if( !v.skip ) obj.presets.variety = v;
								if( !m.skip ) obj.presets.material = m;
								if( !q.skip ) obj.presets.quality = q;
								if( !e.skip ) obj.presets.effect = e;
								if( item.rechargeTime ) obj.presets.rechargeTime = this.pickRechargeTime(item);
								if( item.isArmor ) obj.presets.armor = this.pickArmor(item,m,v,q,e);
								if( item.isWeapon ) obj.presets.damage = this.pickDamage(obj.presets.rechargeTime,item,m,v,q,e);
								if( item.isGold ) obj.presets.goldCount = this.pickGoldCount();
								table.push(chance,obj);
							});
						});
					});
				});
				// Now rebalance because the number of varieties should not tilt the chance...
				if( chanceTotal ) {
					let ratio = (100000 / chanceTotal) * (item.rarity||1);
					console.log(item.typeId+' balanced by '+ratio);
					for( let i=startIndex ; i<table.length ; i+=2 ) {
						table[i] = Math.clamp(Math.floor(table[i]*ratio),1,100000);
					}
				}
			});
			PickerCache.itemTable[this.level] = table;
		}
		return PickerCache.itemTable[this.level];
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
		return Math.floor(baseArmor*100)/100;
	}
	pickDamage(rechargeTime,i,m,v,q,e) {
		let dm = 1;
		if( i && i.damageMultiplier ) dm *= i.damageMultiplier;
		if( m && m.damageMultiplier ) dm *= m.damageMultiplier;
		if( v && v.damageMultiplier ) dm *= v.damageMultiplier;
		if( q && q.damageMultiplier ) dm *= q.damageMultiplier;
		if( e && e.damageMultiplier ) dm *= e.damageMultiplier;

		let mult = (rechargeTime||0)>1 ? 1+rechargeTime*DEFAULT_DAMAGE_BONUS_FOR_RECHARGE : 1;
		return Math.max(1,Math.floor(Rules.playerDamage(this.level) * mult * dm));
	}
	pickGoldCount() {
		return Math.max(1,this.level);
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

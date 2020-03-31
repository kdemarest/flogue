Module.add('dataPermute',function() {

let EffectPermutationEngine = (new function() {

	let permutationList = {
		isDmg: (item,effect) => {
			if( effect.duration === true || effect.duration !== 0 ) {
				return false;
			}
			return {
				'1': { rarity: 4.00, effectShape: EffectShape.SINGLE },
				'2': { rarity: 0.50, effectShape: EffectShape.BLAST2, xDamage: 0.80, xPrice: 1.5 },
				'3': { rarity: 0.25, effectShape: EffectShape.BLAST3, xDamage: 0.70, xPrice: 2.0 },
				'4': { rarity: 0.05, effectShape: EffectShape.BLAST4, xDamage: 0.60, xPrice: 2.5 },
				'5': { rarity: 0.01, effectShape: EffectShape.BLAST5, xDamage: 0.50, xPrice: 3.0 },
			};
		},
		isDeb: (item,effect) => {
			if( effect.duration === true || effect.duration === 0 ) {
				return false;
			}
			return {
				'1': { rarity: 4.00, effectShape: EffectShape.SINGLE },
				'2': { rarity: 0.50, effectShape: EffectShape.BLAST2, xPrice: 1.2, xDuration: 0.80 },
				'3': { rarity: 0.25, effectShape: EffectShape.BLAST3, xPrice: 1.6, xDuration: 0.70 },
				'4': { rarity: 0.05, effectShape: EffectShape.BLAST4, xPrice: 2.2, xDuration: 0.60 },
				'5': { rarity: 0.01, effectShape: EffectShape.BLAST5, xPrice: 2.4, xDuration: 0.50 },
			};
		},
		isBuf: (item,effect) => {
			if( effect.duration === true || effect.duration !== 0 ) {
				return false;
			}
			let xDuration = (effect.xDuration||1);
			return {
				'1': { rarity: 2.00, effectShape: EffectShape.SINGLE },
				'L': { rarity: 0.50, effectShape: EffectShape.SINGLE, xPrice: 1.3, xDuration: xDuration*2, moreDuration: 2, permuteDesc: 'lasts 2x' },
				'V': { rarity: 0.20, effectShape: EffectShape.SINGLE, xPrice: 1.6, xDuration: xDuration*3, moreDuration: 3, permuteDesc: 'lasts 3x' },
				'F': { rarity: item.hasRecharge() ? 0.20 : 0.0, effectShape: EffectShape.SINGLE, xPrice: 2.0, xRecharge: xDuration*0.7, rechargeBonus: 0.7, permuteDesc: '+30% recharge' },
			}
		},
		isTac: (item,effect) => {
			if( effect.duration === true || effect.duration !== 0 ) {
				return false;
			}
			let xDuration = (effect.xDuration||1);
			let result = {
				'1': { rarity: 2.00, effectShape: EffectShape.SINGLE },
				'L': { rarity: 0.50, effectShape: EffectShape.SINGLE, xPrice: 1.3, xDuration: xDuration*2, moreDuration: 2, permuteDesc: 'lasts 2x' },
				'V': { rarity: 0.20, effectShape: EffectShape.SINGLE, xPrice: 1.6, xDuration: xDuration*3, moreDuration: 3, permuteDesc: 'lasts 3x' },
				'F': { rarity: item.hasRecharge() ? 0.20 : 0.0, effectShape: EffectShape.SINGLE, xPrice: 2.0, xRecharge: xDuration*0.7, rechargeBonus: 0.7, permuteDesc: '+30% recharge' },
			}
			return result;

		}
	}

	function permuteByTable(depth,level,effect,table) {
		let picker = new Pick.Table();

		// We might be able to do something simple. Items < current depth cause the
		// least rare (EffectShape.SINGLE) to become less and less likely, but never < 1.0

		picker.scanHash( table, entry => {
			// By the time you're at the final level, all types are equally likely to occur,
			// that is, you might find blast5 just as often as no blast at all.
			return entry.rarity+( (1-entry.rarity) * (level/Rules.DEPTH_SPAN));
		});
		let result = picker.pick();
		if( result.xPrice || effect.xPrice ) {
			result.xPrice = (result.xPrice||1) * (effect.xPrice||1);
		}
		if( result.xDamage || effect.xDamage ) {
			result.xDamage = (result.xDamage||1) * (effect.xDamage||1);
		}
		if( result.xDuration || effect.xDuration ) {
			result.xDuration = (result.xDuration||1) * (effect.xDuration||1);
		}
		return Object.assign( {}, effect, result );		
	}

	function permute(depth,level,item,effect,forceType=null) {
		if( effect.noPermute ) {
			return effect;
		}
		let table;
		for( let p in permutationList ) {
			if( effect[p] ) {
				table = permutationList[p](item,effect);
				if( table && (!forceType || table[forceType]) ) {
					break;
				}
			}
		}
		if( table ) {
			console.assert( !forceType || table[forceType] );
			table = !forceType || !table[forceType] ? table : Object.filter( table, (entry,key) => key==forceType );
			return permuteByTable(depth,level,effect,table);
		}
		return effect;
	}

	return {
		permute: permute
	}
}());

return {
	EffectPermutationEngine: EffectPermutationEngine
}

});

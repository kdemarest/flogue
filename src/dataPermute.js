let EffectPermutationEngine = (new function() {
	let permutationList = {
		isDmg: (effect) => {
			if( effect.duration === true || effect.duration !== 0 ) {
				return false;
			}
			return {
				'1': { rarity: 4.00, effectShape: EffectShape.SINGLE },
				'L': { rarity: 0.50, effectShape: EffectShape.SINGLE, xDamage: 0.3, duration: 5, permuteName: 'long lasting' },
				'V': { rarity: 0.20, effectShape: EffectShape.SINGLE, xDamage: 0.2, duration: 10, permuteName: 'very long lasting' },
				'2': { rarity: 0.50, effectShape: EffectShape.BLAST2, xDamage: 0.80 },
				'3': { rarity: 0.35, effectShape: EffectShape.BLAST3, xDamage: 0.70 },
				'4': { rarity: 0.20, effectShape: EffectShape.BLAST4, xDamage: 0.60 },
				'5': { rarity: 0.10, effectShape: EffectShape.BLAST5, xDamage: 0.50 },
				'6': { rarity: 0.05, effectShape: EffectShape.BLAST6, xDamage: 0.40 },
			};
		},
		isDeb: (effect) => {
			if( effect.duration === true || effect.duration === 0 ) {
				return false;
			}
			return {
				'1': { rarity: 4.00, effectShape: EffectShape.SINGLE },
				'L': { rarity: 0.50, effectShape: EffectShape.SINGLE, xDuration: (effect.xDuration||1)*2, permuteName: 'long lasting' },
				'V': { rarity: 0.20, effectShape: EffectShape.SINGLE, xDuration: (effect.xDuration||1)*3, permuteName: 'very long lasting' },
				'2': { rarity: 0.50, effectShape: EffectShape.BLAST2 },
				'3': { rarity: 0.35, effectShape: EffectShape.BLAST3 },
				'4': { rarity: 0.20, effectShape: EffectShape.BLAST4 },
				'5': { rarity: 0.10, effectShape: EffectShape.BLAST5 },
				'6': { rarity: 0.05, effectShape: EffectShape.BLAST6 },
			};
		},
		isBuf: (effect) => {
			if( effect.duration === true || effect.duration !== 0 ) {
				return false;
			}
			return {
				'1': { rarity: 2.00, effectShape: EffectShape.SINGLE },
				'L': { rarity: 0.50, effectShape: EffectShape.SINGLE, xDuration: (effect.xDuration||1)*2, permuteName: 'long lasting' },
				'V': { rarity: 0.20, effectShape: EffectShape.SINGLE, xDuration: (effect.xDuration||1)*3, permuteName: 'very long lasting' },
				'F': { rarity: 0.20, effectShape: EffectShape.SINGLE, xRecharge: (effect.xRecharge||1)*0.7, permuteName: 'fast recharge' },
			}
		},
		isTac: (effect) => {
			if( effect.duration === true || effect.duration !== 0 ) {
				return false;
			}
			return {
				'1': { rarity: 2.00, effectShape: EffectShape.SINGLE },
				'L': { rarity: 0.50, effectShape: EffectShape.SINGLE, xDuration: (effect.xDuration||1)*2, permuteName: 'long lasting' },
				'V': { rarity: 0.20, effectShape: EffectShape.SINGLE, xDuration: (effect.xDuration||1)*3, permuteName: 'very long lasting' },
				'F': { rarity: 0.20, effectShape: EffectShape.SINGLE, xRecharge: (effect.xRecharge||1)*0.7, permuteName: 'fast recharge' },
			}
		}
	}

	function permuteByTable(depth,effect,table) {
		let p = new PickTable();
		// By the time you're at the final level, all of these things are of
		// equal weight to occur.
		p.scanHash( table, entry => entry.rarity+( (1-entry.rarity) * (depth/DEPTH_SPAN) ) );
		let result = p.pick();
		return Object.assign( {}, effect, result );		
	}

	function permute(depth,effect,forceType=null) {
		if( effect.noPermute ) {
			return effect;
		}
		let table;
		for( let p in permutationList ) {
			if( effect[p] ) {
				table = permutationList[p](effect);
				if( table && (!forceType || table[forceType]) ) {
					break;
				}
			}
		}
		if( table ) {
			console.assert( !forceType || table[forceType] );
			table = !forceType || !table[forceType] ? table : Object.filter( table, (entry,key) => key==forceType );
			return permuteByTable(depth,effect,table);
		}
		return effect;
	}

	return {
		permute: permute
	}
}());

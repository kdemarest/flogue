Module.add('dataPicker',function() {

class Picker {
	constructor(depth) {
		console.assert(depth>=0);
		this.depth = depth;
	}

	// Contains entries in MonsterTypeList
	monsterTable(monsterConstraint,criteriaFn) {
		let table = [];
		let closest = [];
		for( let typeId in MonsterTypeList ) {
			let m = MonsterTypeList[typeId];
			if( criteriaFn && !criteriaFn(m) ) {
				continue;
			}
			if( monsterConstraint ) {
				let ok = false;
				if( typeof monsterConstraint == 'function' ) {
					ok = monsterConstraint(m);
				}
				else {
					for( let statOrTypeId of monsterConstraint ) {
						ok = ok || m[statOrTypeId] || m.typeId==statOrTypeId;		// like 'isAnimal' or 'isUndead'
					}
				}
				if( !ok ) {
					continue;
				}
			}
			let deltaMe = Math.abs(m.level-this.depth);
			let deltaC  = !closest.length ? 9999 : Math.abs(closest[1].level-this.depth);
			if( deltaMe <= deltaC ) {
				if( deltaMe < deltaC ) { closest = []; }	// if I'm closer, restart the table. But any equal get added to the table.
				closest.push(1,m);
			}

			if( m.level > this.depth || m.neverPick ) {
				continue;
			}
			let chance = Math.floor(Math.clamp(ChanceToAppear.Simple(m.level,this.depth) * 100000, 1, 100000));
			if( m.rarity ) console.assert( m.rarity>=0 );
			chance *= (m.rarity || 1);
			table.push(chance,m);
		}
		return table.length ? table : closest;
	}

	//**
	// itemTypeId is allowed to be empty, although it will make the search take substantially longer.
	// filter should be an instance of filterStringParam() above.
	//**
	itemTraverse( itemTypeId, filter, fn ) {
		let depth = this.depth;
		let count = 0;
		let one = { nothing: { skip:1, level: 0, rarity: 1 } };	// be sure effectChance is undefined in here!!
		let oneInert = { typeId: 'eInert', name: 'inert', level: 0, rarity: 0, isInert: 1 };
		let l0 = { level: 0 };
		let r1 = { rarity: 1 };
		let done = {};
		let itemTypeProxy = {};
		if( itemTypeId ) {
			console.assert( ItemTypeList[itemTypeId] );
			itemTypeProxy[itemTypeId] = ItemTypeList[itemTypeId];
		}
		else {
			itemTypeProxy = ItemTypeList;
		}
		let logging = false;
//		if( filter.keepIs.includes('isArrow') ) {
//			logging = true;
//		}

		for( let ii in itemTypeProxy ) {
			let item = itemTypeProxy[ii];
			let noneChance = item.noneChance || 0;

			let vRarityTotal = 0;
			let vAppearTotal = 0;
			let varietyArray = Object.values( item.varieties || one );
			for( let vIndex=0 ; vIndex < varietyArray.length ; ++vIndex ) {
				let v = varietyArray[vIndex];
				let vi = v.typeId || 'nothing';
				if( filter.killId[vi] ) {
					if( logging ) console.log( item.typeId+' killed for being '+vi );
					continue;
				}
				let materialHash = v.materials === undefined ? (item.materials || one) : (v.materials || one);
				for( let mi in materialHash ) {
					if( filter.killId[mi] ) {
						if( logging ) console.log( item.typeId+' killed for being '+mi );
						continue;
					}
					let m = materialHash[mi];
					let qualityHash = v.qualities || m.qualities || item.qualities || one;
					for( let qi in qualityHash ) {
						if( filter.killId[qi] ) {
							if( logging ) console.log( item.typeId+' killed for being '+qi );
							continue;
						}
						let q = qualityHash[qi];

						// Must be in QMVI order.
						let matter = q.matter || m.matter || v.matter || item.matter;
						if( filter.matter && filter.matter !== matter ) {
							if( logging ) console.log( item.typeId+' lacks correct matter '+filter.matter );
							continue;
						}

						if( !filter.testMembers(item) && !filter.testMembers(v) && !filter.testMembers(m) && !filter.testMembers(q) ) {
							if( logging ) console.log( item.typeId+' lacks member' );
							continue;
						}

						// WARNING! If the items has an effect: set, then no matter what you specify for the effect (like eInert) it simply
						// won't happen and the effect specified will ALWAYS be what it gets. They only way to make that effect
						// specifyable or simetimes-occuring is to set effectChance:100 and effects: { myEffectid: { theEffect }}

						// Order here MUST be the same as in Item constructor.  QMVI
						let effectArray = Object.values(q.effects || m.effects || v.effects || item.effects || one);
						if( v.effects ) {
							//console.log(v.typeId+' has custom effects.');
						}
						if( !effectArray[0].skip ) {
							Array.filterInPlace( effectArray, e=>e.typeId!='eInert' );
							effectArray.push( oneInert );
						}

						// Order here MUST be the same as in Item constructor.
						let effectChance = v.effectChance!==undefined ? v.effectChance : (m.effectChance!==undefined ? m.effectChance : (q.varietyChance!==undefined ? q.varietyChance : item.effectChance || 0));
						effectChance = Math.clamp(effectChance * Rules.xEffectChance, 0.0, 1.0);
						let appearTotal = 0;
						let rarityTotal = 0;
						//if( depth == 5 ) debugger;
						for( let index=0 ; index<effectArray.length ; ++index ) {
							let e = effectArray[index];
							let ei = e.typeId;
							let id = ii+(!v.skip?'.'+vi:'')+(!m.skip?'.'+mi:'')+(!q.skip?'.'+qi:'')+(!e.skip && !e.isInert?'.'+ei:'');
							//if( done[id] ) { debugger; continue; }
							//done[id] = 1;
							let level = Math.max(0,(item.level||0) + (v.level||0) + (m.level||0) + (q.level||0) + (e.isInert ? 0 : (e.level||0)));
							let appear = ChanceToAppear.Ramp(level,depth);

							let rarity = (v.rarity||1) * (m.rarity||1) * (q.rarity||1) * (e.rarity||1);
							if( v.rarity === 0 || m.rarity === 0 || q.rarity === 0 || e.rarity === 0 ) {
								rarity = 0;
							}

							// Scale to depth...
							if( rarity > 0.0 && rarity < 1.0 ) {
								let delta = 1.0 - rarity;
								let pct = Math.clamp(depth/Rules.DEPTH_SPAN,0.0,1.0);
								rarity = rarity + delta*pct;
								console.assert( rarity >= 0 );
							}

							//when a certian weapon has a GREATER effectChance, then its inert chance is SMALLER, meaning
							//that OVERALL you see it less! So it is important for the CUMULATIVE chance of one thing to be the same
							// as the cumulative chance for another. The only way to scale this is to multiple by effectChance. Maybe.

							if( effectChance ) {
								rarity *= effectChance / effectArray.length
							}

							// noneChance is specifically for ore to force there to be
							// lots of ore that is normal. The regular ore gets the flag isNone
							// so that this little piece of code can work.
							let didNone = false;
							if( noneChance && v.isNone ) {
								didNone = true;
								console.assert( vIndex == varietyArray.length-1 );
								rarity = (vRarityTotal / (1-noneChance))-vRarityTotal;	// if div by zero, fix the item type list!
								//rarity = rarity || 1;
								console.assert( rarity >= 0 );
								// Use the .max here because, what if ALL other entities have a 'never appear' level problem?
								appear = vAppearTotal / (varietyArray.length-1);	// an average
								//appear = appear || 1;
							}


							if( ei == 'eInert' ) {
								console.assert(!didNone);
								// Slight contradiction here. Some things have 100% chance for an effect, so
								// the rarity of eInert will be zero.
								rarity = effectChance<=0 ? 100000 : (rarityTotal / effectChance)-rarityTotal;	// if div by zero, fix the item type list!
								console.assert( rarity >= 0 );
								// Use the .max here because, what if ALL other entities have a 'never appear' level problem?
								appear = appearTotal / (effectArray.length-1);	// an average
								if( !appear ) {
									// None of the effects on this item were low enough level, probably
									// so just use inert as level zero and re-calculate.
									if( !e.level == 0 ) debugger;	// inet should ALWAYS be level zero.
									appear = ChanceToAppear.Ramp(level,depth);
									// Note that this might STILL result in a zero appear. And that is OK, we just have to
									// trust that something else will appear!
								}
								//if( !appear && level < depth ) debugger;	// the sigmoid might be wrong!
							}
							if( isNaN(rarity) ) debugger;
							if( isNaN(appear) ) debugger;
							appearTotal += appear;
							rarityTotal += rarity;
							vAppearTotal += appear;
							vRarityTotal += rarity;

							// Yes, these are LATE in the function. They have to be!
							if( filter.killId[ei] ) {
								if( logging ) console.log( id+' killed for being '+ei );
								continue;
							}

							if( !filter.testKeepId(ii,vi,mi,qi,ei) ) {
								if( logging ) console.log( id+' lacked id '+filter.keepId );
								continue;
							}
							let thing = Object.assign( {}, item, {
								presets: {},
								level: level,
								depth: depth,
								appear: appear,
								rarity: rarity,
								_id: id
							});
							//console.log( thing._id+' D'+thing.depth+' L'+thing.level+' appear: '+thing.appear+' rarity: '+thing.rarity);
							if( !v.skip ) { thing.presets.variety = v; }
							if( !m.skip ) { thing.presets.material = m; }
							if( !q.skip ) { thing.presets.quality = q; }
							if( !e.skip ) { thing.presets.effect = e; }
							
							fn(thing);
						}
					}
				}
			}
		}
	}

	
	//**
	// depth 		- the depth of the map you are on.
	// itemTypeId	- potion, spell, armor, ring, etc. Leave blank and it will pick one.
	// filterString - often empty, can contain both limits on what ids are getting picked, as well as requirements that the
	// 		item have (or not have) certain flags. Here are examples:
	// 		'isTreasure'		- only picks items marked with isTreasure
	// 		'!isTreasure'		- makes sure the picked item is not treasure
	// 		'dagger'			- only picks items that have 'dagger' as the typeId of the item, variety, material, quality or effect
	//		'potion.eHealing'	- a healing potion will be selected
	//		'!healing'			- an item that does NOT have the healing effect
	//**

	pickItem(filterString,criteriaFn,defaultToCoins=true) {
		let filter = Picker.filterStringParse(filterString);
		let itemTypeId;
		if( ItemTypeList[filter.firstId] ) {
			itemTypeId = filter.firstId;
		}
		// No item type was specified, so use the master chance table to pick one.
		if( !itemTypeId && !filter.specifiesId ) {
			let p = new Pick.Table().scanArray( Object.keys(Rules.ItemBag), typeId => {
				//console.log( typeId+' = '+Rules.ItemBag[typeId].cGen );
				return Rules.ItemBag[typeId].cGen;
			});
			itemTypeId = p.pick();
		}
		// Make a table of all items that meet the criteria
		let table = [];
		this.itemTraverse( itemTypeId, filter, thing => {
			if( criteriaFn && !criteriaFn(thing) ) {
				return;
			}
			table.push(thing);
		});
		// If no items meet the criteria, we shoud return a fallback item, like gold.
		if( !table.length ) {
			if( !defaultToCoins ) {
				return false;
			}
			debugger;
			return ItemTypeList.coin;
		}
		// Make a table with all the chances to appear figured out.
		let p = new Pick.Table().scanArray( table, thing=> thing.appear*thing.rarity );
		// Pick an item, based on chance to appear.
		let depth = this.depth;
		let choice = p.total ? p.pick() : function() {
			// If all the items have zero chance to appear, then choose an item
			// closest in level to the current depth, with the most common rarity.
			table.sort( (a,b) => a.level == b.level ? b.rarity-a.rarity : Math.abs(a.level-depth)-Math.abs(b.level-depth) );
			return table[0];
		}();
		return choice;
	}

	// Picks loot using the supplyMixed spec, but doesn't give it to anyone.
	// See Array.supplyParse for full details.
	pickLoot(supplyMixed,callback) {
		let supplyArray = Array.supplyParse(supplyMixed);		
		let makeList = new Finder( Array.supplyToMake(supplyArray,Rules.xLootFrequency) );
		let list = [];
		makeList.forEach( make => {
			let any = (''+make.typeFilter).toLowerCase()==='any';
			let type = this.pickItem( [any ? '' : make.typeFilter,any ? 'isTreasure' : ''].join(' ').trim() );
			if( !type ) {
				debugger;
				return;
			}
			if( any && !type.isTreasure ) debugger;

			let inject = Object.assign( {}, make );
			delete inject.count;
			delete inject.chance;
			delete inject.id;
			inject.isLoot = true;
			let loot = new Item( this.depth, type, type.presets, inject );
			if( callback ) {
				callback(loot);
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

/*
	A filterString, also called a TypeFilter, specifies limits as to what may be picked.
	The format is:
		itemType[.variety][.material][.quality][.effect] [isFlag] [mayFlag] [bitEffectId] [ofMatter]
		- Every part is optional except itemType.
		- TypeFilter "any" means to pick any isTreasure type.
		- Must be of type itemType, of the named variety, material, quality or effect.
		isFlag mayFlag
		-  Flag(s) must exist in the item, variety, material and quality.
		ofMatter
		- This matter type must exist in the quality, material, variety or item
		bitEffectId
		- This effect must exist on the item, variety, material or quality. See monsterPreProcess.

	You may prefix flags with ! to make sure it lacks this flag
*/
Picker.filterStringParse = function(filterString) {
	if( filterString ) { filterString = filterString.trim(); }
	let nopTrue = () => true;
	let nop = () => {};

	let self = {
		killId: {},
		testMembers: nopTrue,
		testKeepId: nopTrue,
		firstId: null,
		specifiesId: false
	};
	if( typeof filterString != 'string' || !filterString ) {
		return self;
	}
	let keepIs = [];
	let killIs = [];
	let keepId = {};
	let killId = {};
	filterString.replace( /\s*(!)*(is|may|bit|of)*(\S+|\S+)/g, function( whole, not, is, token ) {
		if( is ) {
			if( is == 'of' ) {
				// special case hack to detect matter
				self.matter = token.toLowerCase();
			}
			else {
				(not ? killIs.push(is+token) : keepIs.push(is+token));
			}
		}
		else {
			// Split by the dot
			//console.log('processing '+token );
			token.replace( /([^\s.]+)[\s.]*/g, function( whole, token ) {
				//console.log('adding '+token );
				self.specifiesId = true;
				(not ? killId[token]=1 : keepId[token]=1);
				self.firstId = self.firstId || token;
			});
		}
	});
	if( killIs.length || keepIs.length ) {
		self.testMembers = (item => {
			for( let keep of keepIs ) if( !item[keep] ) return false;
			for( let kill of killIs ) if( item[kill] ) return false;
			return true;
		});
	}
	self.killId = killId;
	self.keepId = keepId;
	self.keepIs = keepIs;
	self.killIs = killIs;
	let keepIdCount = Object.keys(keepId).length || 0;
	if( keepIdCount ) {
		self.testKeepId = (...argList) => {
			let count=0;
			let arg;
			while( argList.length ) {
				let arg=argList.shift();
				count += keepId[arg] ? 1 : 0;
			}
			return count >= keepIdCount;
		}
	}
	return self;
}

return {
	Picker: Picker
}

});
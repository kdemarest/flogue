Module.add('types',function(extern){

let SymbolToType = {};
let TypeIdToSymbol = {};

let Symbol = new class {
	constructor() {
		this.forbidden = { ' ': 1, '.': 1, '#': 1 };
		this.sIndex = 32+1;
		this.SYM = 111;
	}
	getUnusedSymbol() {
		while( SymbolToType[String.fromCharCode(this.sIndex)] || this.forbidden[String.fromCharCode(this.sIndex)] ) {
			++this.sIndex;
		}
		return String.fromCharCode(this.sIndex);
	}

	assign(type,symbol) {
		console.assert( symbol != Tile.UNKNOWN );
		console.assert( type.typeId );	// You have a duplicate typeId.
		console.assert( !TypeIdToSymbol[type.typeId] );	// You have a duplicate typeId.
		console.assert( !SymbolToType[symbol] );	// You have a duplicate typeId.
		SymbolToType[symbol] = type;
		TypeIdToSymbol[type.typeId] = symbol;
		return symbol;
	}
	reserve(type) {
		if( type.symbol && type.symbol!==this.SYM ) {
			this.assign(type,type.symbol);
		}
	}
	allocate(type) {
		if( !type.symbol || type.symbol===this.SYM ) {
			type.symbol = this.assign(type,this.getUnusedSymbol());
		}
	}
}

let TypeUnique = new class {
	constructor() {
		this.uniques = {};
	}
	check(registrant,dupeAllowed) {
		// We allow variety names to collide, because they are more like keywords. They don't have to authoritatively
		// lead back to their specific type.
		if( this.uniques[registrant.typeId] && !dupeAllowed ) {
			// Non-unique
			debugger;
		}
		this.uniques[registrant.typeId] = registrant;
		return registrant;
	}
}

let levelAdjust = (type) => {
	if( type.power !== undefined ) {
		console.assert(!type.levelAdjusted);
		type.level = Math.floor(type.power/100*Rules.DEPTH_SPAN);
		type.levelAdjusted = true;
	}
}

/**
A policy contains
	accessor				- the global name of its accessor variable.
	defaults				- data to inject into every single entity.
	typeIdUnique			- must each element have a unique typeId?
	useSymbols				- should each element get a symbol?
	onRegister(typeData)	- function to call the moment this thing is added.
	onMerge(typeData)		- returns only fields from this that you want to dominate the otherwise-overwrite nature of a merge.
	onFinalize(typeData)	- stuff to do after everything else.

When declaring a type, especially in a plugin, any type. Note the use of the word "Addition"
at the end of certain words.

( -- no longer exists -- window.config,	type.config );
( Rules,			type.rules);
( DamageType,		type.damageTypeAddition);
( Attitude,			type.attitudeAddition);
( PaletteList,		type.palette);
( ScapeList,		type.scapeList);

( 'Sticker',		type.stickerList );
( 'EffectType',		type.effectTypeList );
( 'TileType', 		type.tileTypeList );
( 'ItemType',		type.itemTypeList );
( 'MonsterType',	type.monsterTypeList );
( 'PlaceType',   	type.placeTypeList );
( 'Theme',       	type.themeList );

*/

let Type = new class {
	constructor() {
		this.policy = {};
		this.list = {};
	}
	establish(typeSymbol, policy,typeDataList) {
		policy.accessor = policy.accessor || {};
		policy.id = typeSymbol;
		this.policy[typeSymbol] = policy;
		if( typeDataList ) {
			this.register(typeSymbol,typeDataList);
		}
		this[typeSymbol] = policy.accessor;
		return policy.accessor;
	}
	register(typeSymbol,typeDataList) {
		if( !typeDataList ) {
			return;
		}
		let policy   = this.policy[typeSymbol];
		if( !policy && Type.loosePolicy ) {
			// This is valid ONLY for little plugins, like the mason.html
			return;
		}
		let accessor = policy.accessor;
		console.assert( policy );
		Object.each( typeDataList, (typeData,typeId) => {
			if( accessor[typeId] && !typeData.mergeWithExistingData ) {
				throw "Duplicate "+typeSymbol+" in "+policy.id+'.'+typeId;
			}
			let isMerge = accessor[typeId]; 
			if( typeof typeData == 'function' ) {
				// Assign the function.
				accessor[typeId] = typeData;
			}
			else {
				// emulate inheritance
				// doing it this was preserves the references in place, for use by SymbolToType etc.!!
				typeData.typeId = typeId;
				let incoming  = Object.assign({},typeData);		// Critical to do this before first assign.
				if( !isMerge ) {
					let defaults = $.extend(true,{},policy.defaults);
					let basis = typeData.basis ? $.extend(true,{},accessor[typeData.basis] || typeDataList[typeData.basis]) : null;
					accessor[typeId] = Object.assign( typeData, defaults, basis, incoming );
				}
				else {
					let merged;
					if( policy.onMerge ) {
						console.assert( !typeData.basis );	// May not attempt to inherit when you're already overwriting a type.
						merged = policy.onMerge( accessor[typeId], incoming );
						merged.isMerged = true;
					}
					accessor[typeId] = Object.assign( accessor[typeId], incoming, merged );
				}
			}
			if( policy.typeIdUnique ) {
				TypeUnique.check( accessor[typeId], typeData.mergeWithExistingData );
			}
			if( policy.useSymbols && !isMerge ) {
				Symbol.reserve( accessor[typeId] );
			}
			if( policy.onRegister ) {
				policy.onRegister(accessor[typeId],typeId);
			}
		});
		return this;
	}
	derive(typeSymbol,typeId,inject) {
		let policy = this.policy[typeSymbol];
		if( !policy && Type.loosePolicy ) {
			return Object.assign( {}, inject );
		}
		console.assert( policy.accessor[typeId] );
		return Object.assign( {}, policy.accessor[typeId], inject );
	}

	mergeToGlobals(type) {

		console.assert( !type.effectList );

		Object.assign( Config.instance,	type.Config );

		this.mergeObj( Rules,			type.Rules);
		this.mergeObj( DamageType,		type.DamageType);
		this.mergeObj( Attitude,		type.Attitude);
		this.mergeObj( PaletteList,		type.Palette, true);
		this.mergeObj( ScapeList,		type.ScapeList, true);

		this.register( 'Sticker',		type.StickerList );
		this.register( 'EffectType',	type.EffectTypeList );
		this.register( 'TileType', 		type.TileTypeList );
		this.register( 'ItemType',		type.ItemTypeList );
		this.register( 'MonsterType',	type.MonsterTypeList );
		this.register( 'PlaceType',   	type.PlaceTypeList );
		this.register( 'Theme',       	type.ThemeList );
	}
	mergeObj(target,source,mayOverwrite) {
		if( !source ) {
			return;
		}
		Object.each( source, (value,key) => {
			if( target[key] && key != 'basis' ) throw "Illegal to overwrite "+key;
		});
		Object.assign(target,source);
	}
	traverse(fn) {
		Object.each( this.policy, policy => {
			Object.each( policy.accessor, (typeData,typeId) => {
				fn(typeData,typeId,policy);
			});
		});
	}
	merge() {
		// Possibly we should do this in type order, that is, first Rules, then DamageType, then... to Theme
		this.traverse( type=>this.mergeToGlobals(type) );
	}
	finalize(checker) {
		this.traverse( (typeData,typeId,policy) => {
			if( policy.useSymbols ) {
				Symbol.allocate( typeData );
			}
			levelAdjust(typeData);
			if( typeData.materials ) {
				Object.each( typeData.materials, material => levelAdjust(material) );
			}
			if( typeData.varieties ) {
				Object.each( typeData.varieties, variety => levelAdjust(variety) );
			}
			if( typeData.qualities ) {
				Object.each( typeData.qualities, quality => levelAdjust(quality) );
			}
			if( policy.onFinalize ) {
				policy.onFinalize( typeData, typeId, checker );
			}
			if( checker && policy.onValidate ) {
				policy.onValidate( typeData, typeId, checker );
			}
		});
	}
}

Type.giveTypeIds = obj => obj ? Object.each(obj, (member,key)=>member.typeId = key ) : null;
Type.loosePolicy = extern.MetaConfig ? extern.MetaConfig.loosePolicy : false;


return {
	Type: Type,
	SymbolToType: SymbolToType,
	TypeIdToSymbol: TypeIdToSymbol
}

});
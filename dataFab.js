
let Fab = (function() {
	let fabList = [];
	let typeMaster = {};

	let getUnusedSymbol = (function() {
		let sIndex = 32+1;
		return function() {
			while( SymbolToType[String.fromCharCode(sIndex)] ) {
				++sIndex;
			}
			return String.fromCharCode(sIndex);
		}
	})();

	function assignSymbol(type,symbol) {
		if( symbol===undefined || symbol === SYM ) {
			symbol = getUnusedSymbol();
		}
		console.assert( symbol != TILE_UNKNOWN );
		console.assert( type.typeId );	// You have a duplicate typeId.
		console.assert( !TypeIdToSymbol[type.typeId] );	// You have a duplicate typeId.
		console.assert( !SymbolToType[symbol] );	// You have a duplicate typeId.
		SymbolToType[symbol] = type;
		TypeIdToSymbol[type.typeId] = symbol;
		return symbol;
	}

	function add( isWhat, typeList, useSymbols, uniqueId, defaults) {
		console.assert( typeof isWhat == 'string' );
		console.assert( typeof typeList == 'object' );
		fabList.push({ typeList: typeList, isWhat: isWhat, useSymbols: useSymbols, uniqueId: uniqueId, defaults: defaults });
		return typeList;
	}

	function process() {
		// Assign all typeId's to all types.
		fabList.forEach( list => {
			for( let typeId in list.typeList ) {
				// We allow variety names to collide, because they are more like keywords. They don't have to authoritatively
				// lead back to their specific type.
				if( list.uniqueId && typeMaster[typeId] ) debugger;
				list.typeList[typeId].typeId = typeId;
				if( list.uniqueId ) typeMaster[typeId] = list.typeList[typeId];
			}
		});
		// Adjust the level span
		fabList.forEach( list => {
			Object.each( list.typeList, type => {
				if( type.level !== undefined ) {
					console.assert(!type.levelAdjusted);
					type.level = Math.floor(type.level*DEPTH_SPAN/100);
					type.levelAdjusted = true;
				}
			});
		});
		// Make sure all the symbols already claimed have reserved spaces.
		fabList.forEach( list => {
			Object.each( list.typeList, type => {
				if( type.symbol && type.symbol!==SYM ) {
					assignSymbol(type,type.symbol);
				}
			});
		});
		// Assign remaining symbols, defaults etc to everything
		fabList.forEach( list => {
			Object.each( list.typeList, type => {
				if( list.useSymbols && (!type.symbol || type.symbol===SYM) ) {
					type.symbol = assignSymbol(type,type.symbol);
				}
				if( list.defaults ) {
					let original = Object.assign({},type);
					Object.assign( type, list.defaults, original );	// doing it this was preserves the references in place, for use by SymbolToType etc.!!
				}
				if( list.isWhat ) {
					type[list.isWhat] = true;
				}
				if( !type.namePattern ) {
					type.name = type.name || String.uncamel(type.typeId);
					if( type.name.charAt(1) == ' ' ) {	// hack special case to fix effect names with ePrefix format.
						type.name = type.name.substr(2);
					}
				}
			});
		});
	}
	return {
		add: add,
		process: process
	}
})();

function monsterPreProcess(typeId,m) {
	if( m.core ) {
		m.symbol = m.core[0];
		m.level = m.core[1];
		m.power = m.core[2];
		m.team  = m.core[3];
		m.damageType = m.core[4];
		m.img = m.core[5];
		m.pronoun = m.core[6];
		delete m.core;
	}

	let blood = {
		isPlanar: 	'bloodYellow',
		isUndead: 	'bloodWhite',
		isDemon: 	'bloodBlack',
		isEarthChild: 'bloodGreen',
		isAnimal: 	'bloodRed',
		isSunChild: 'bloodRed',
		isLunarChild: 'bloodBlue'
	};
	for( let key in blood ) {
		if( m[key] ) {
			m.bloodId = m.bloodId || blood[key];
			break;
		}
	}
	m.bloodId = m.bloodId || 'bloodRed';

	m.inventoryLoot = m.inventoryLoot || [];
	m.inventoryLoot = Array.isArray(m.inventoryLoot) ? m.inventoryLoot : [m.inventoryLoot];
	m.inventoryLoot.push( Object.assign({
		typeFilter: 'fake',
		isNatural: true,
		isMelee: true,
		isWeapon: true,
		fake: true,
		quick: 2,
		reach: m.reach || 1,
		damageType: m.damageType || DamageType.CUTS,
		name: m.damageType
	}, m.meleeWeapon ));
	delete m.meleeWeapon;
}
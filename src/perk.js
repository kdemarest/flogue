Module.add('perk',function() {

let perkNop = function() {}

let Perk = {};

// This assumes it has the right to alter the effect in-place.
Perk.apply = function(when,effect,details) {
	console.assert(effect);
	let source = effect.source ? effect.source : (effect.item ? effect.item.ownerOfRecord : null);
	if( !source || !source.isMonsterType || !source.perkList) {
		return effect;
	}
	Object.each( source.perkList, perk => {
		if( perk.dead ) {
			return;
		}
		let fn = perk.apply || perkNop;
		fn(when,effect,details);
	});
	return effect;
}

Perk.allow = function(perk,effect,details) {
	console.assert(perk && effect);
	let source = effect.source ? effect.source : (effect.item ? effect.item.ownerOfRecord : null);
	if( !source || !source.isMonsterType || !source.perkList) {
		return false;
	}
	let fn = perk.allow || perkNop;
	return fn(effect,details) !== false;
}
/*
Perk.visual = function(effect) {
	console.assert(effect);
	let source = effect.source;
	if( !source || !source.isMonsterType || !source.perkList) {
		return effect;
	}
	Object.each( source.perkList, perk => {
		if( perk.dead ) {
			return;
		}
		let fn = perk.visual || perkNop;
		fn(effect);
	});
	return effect;
}
*/

Perk.grant = function(entity, legacyId, level) {

	function zapSingular(entity,singularId) {
		if( !singularId ) {
			return;
		}
		entity.inventory.forEach( item => {
			if( item.singularId == singularId ) {
				item.destroy();
			}
		});
		DeedManager.end( deed => deed.target.id == entity.id && deed.singularId && deed.singularId == singularId );
	}

	function grantOne(perk) {
		zapSingular(entity,perk.singularId);
		if( perk.skill ) {
			entity.itemCreateByType( perk.skill, {} );
		}
		if( perk.item ) {
			entity.itemCreateByType( perk.item, perk.item.presets || {} );
		}
		if( perk.loot ) {
			entity.lootTake( perk.loot, level, null, true );
		}
		if( perk.effect ) {
			effectApply(perk.effect,entity,entity,null);
		}
		return perk;
	}

	let perkList = LegacyList[legacyId];

	Object.each( perkList, (perk,perkId) => {
		if( perk.level !== level ) {
			return;
		}

		// Is this perk already granted?
		if( entity.perkList && entity.perkList[perkId] ) {
			return;
		}

		// If this perk is singular, then get rid of the prior instance of it.
		if( perk.singularId && entity.perkList ) {
			Object.each( entity.perkList, p => {
				if( p.singularId===perk.singularId ) {
					p.dead = true;
				}
			});
		}

		entity.perkList = (entity.perkList || {});
		entity.perkList[perkId] = grantOne(perk);
	});
}

return {
	Perk: Perk
}

});
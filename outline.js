class Outline {
	constructor() {
		this.areaList = {};
	}

	makeThemeId(isCore) {
		console.log( "Picking theme" );
		let themePickList = Object.filter( ThemeList, theme => !!theme.allowInCore==isCore && !theme.isUnique);
		console.assert(!Object.isEmpty(themePickList));
		return pick( themePickList ).typeId;
		console.assert(gate.themeId);
	}

	makeCoreAreaId(depth) {
		return 'area.core.'+depth;
	}

	makeLimbAreaId(depth) {
		return GetUniqueEntityId('area',depth);
	}


				tileQuota.push({
					typeId: typeId,
					symbol: TypeIdToSymbol[typeId],
					putAnywhere: true,
					inject: injectFn()
				});


	makeCoreAreaBasics(depth) {
		return {
			areaId: makeCoreAreaId(depth),
			depth: depth,
			isCore: true,
			quota: []
		};
	}

	build() {
		level 0 is theme "surface"
		10 dwarf cities theme "dwarfTown"
		5 refugee camps theme "refugeeCamp", on limbs in the first 5 levels. has humans, dwarves, elves
		level 100 theme "balgurLevel"
		manaSolar is Math.chance( (1-(level/60))*100 );
		manaDeep is n=lvl/100 * 5;



		for( let depth=0 ; depth < 100 ; ++depth ) {
			let area = makeCoreAreaBasics(depth);
			if( depth > 0 ) {
				area.quota.push({
					toAreaId: makeCoreAreaId(depth+1),
					toDepth: depth+1,
					toCore: true,
					toGateId: null,
					themeId: makeThemeId(true)

		}

			assure( 'stairsDown', 1, () => ({
				toAreaId: makeCoreAreaId(depth+1),
				toDepth: depth+1,
				toCore: true,
				toGateId: null,
				themeId: makeThemeId(true)
			});
			assure( 'stairsUp', depth>0 ? 1 : 0, () => ({
				toAreaId: makeCoreAreaId(depth-1),
				toDepth: depth-1,
				toCore: true,
				toGateId: null,
				themeId: makeThemeId(true)
			});
			assure( 'gateway', 1, () => { toAreaId: makeLimbAreaId(depth), toGateId: null, themeId: makeThemeId(false) });
			assure( 'portal', 1, () => { toAreaId: makeLimbAreaId(depth), toGateId: null, themeId: 'hellscape' });
			assure( 'deepFont', 1 );
			assure( 'solarFont', 1 );


	}

}

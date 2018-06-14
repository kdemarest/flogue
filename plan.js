let Plan = (new class {
	constructor() {
	}

	getPlan(key,depth) {
		let plan = {
			core: {
				0: {
					themeId: 'surface',
					make: [
					]
				},
				1: {
					themeId: 'coreCavernRooms',
					make: [
						{ typeFilter: 'gateway', themeId: 'dwarfTown' },
						{ typeFilter: 'gateway', themeId: 'refugeeCamp' },
						{ typeFilter: 'fontSolar' },
					]
				},
				2: {
					themeId: 'corePits',
					make: [
						{ typeFilter: 'gateway', themeId: 'dwarfTown' },
						{ typeFilter: 'gateway', themeId: 'refugeeCampSlaughter' },
						{ typeFilter: 'fontSolar' },
					]
				},
				3: {
					themeId: 'coreCavernRooms',
					make: [
						{ typeFilter: 'gateway', themeId: 'spooky' },
						{ typeFilter: 'gateway', themeId: 'refugeeCampSlaughter' },
						{ typeFilter: 'fontDeep' },
					]
				},
				4: {
					themeId: 'coreMaze',
					make: [
						{ typeFilter: 'gateway', themeId: 'dwarfTown' },
						{ typeFilter: 'portal', themeId: 'hellscape'  },
						{ typeFilter: 'fontSolar' },
					]
				},
				5: {
					themeId: 'coreBridges',
					make: [
						{ typeFilter: 'gateway', themeId: 'dwarfGoblinBattle' },
						{ typeFilter: 'fontDeep' },
					]
				},
				6: {
					themeId: 'coreSea',
					make: [
						{ typeFilter: 'gateway', themeId: 'dwarfTown' },
						{ typeFilter: 'fontSolar' },
						{ typeFilter: 'fontDeep' },
					]
				},
				default: {
					themeId: 'coreCavernMedium',
					make: [
						{ typeFilter: 'gateway' },
						{ typeFilter: 'fontDeep' },
					]
				}
			},
			limb: {
				default: {
					themeId: null,
					make: [
						{ typeFilter: 'gateway' },
					]
				}
			}
		};
		let p = plan[key][depth] || plan[key].default;
		if( p.make && key=='core' ) {
			if( depth > 0 ) p.make.push( { typeFilter: 'stairsUp' } );
			if( depth < MAX_DEPTH ) p.make.push( { typeFilter: 'stairsDown' } );
		}

		return p;
	}

	shapeWorld(currentAreaId,depth,theme,isCore,gateList=[]) {

		let plan = this.getPlan(isCore?'core':'limb',depth) || {};

		let tileQuota = [];

		// Create gates that link to this gate
		gateList.forEach( gate => {
			if( gate.gateInverse == false ) {
				return;
			}
			console.assert(currentAreaId);
			// Prune this gate from the plan because we're making the required type.
			if( plan.make ) {
				let found = false;
				Array.filterInPlace( plan.make, supply => {
					if( !found && supply.typeFilter.split('.')[0] == gate.gateInverse ) {
						found = true;
						return false;
					}
					return true;
				});
			}
			// Vertical gates match locations. Horizontal don't.
			tileQuota.push(
				Object.assign({
					typeId: gate.gateInverse,
					symbol: TypeIdToSymbol[gate.gateInverse],
					inject: { typeFilter: gate.gateInverse, toAreaId: currentAreaId, toGateId: gate.id }
				},
					gate.gateDir && !theme.inControl ? { x:gate.x, y:gate.y } : { putAnywhere: true }
				)
			);
			console.log( "Quota: "+gate.gateInverse+" leading to "+currentAreaId+" / "+gate.id );
		});

		// The theme may choose to control what happens there. Typically the surface does this,
		// but not others. In general the PLAN should control.
		if( isCore && !theme.inControl && plan.make ) {
			plan.make.forEach( supply => {
				let typeId = supply.typeFilter.split('.')[0];
				tileQuota.push({
					typeId: typeId,
					symbol: TypeIdToSymbol[typeId],
					putAnywhere: true,
					inject: supply
				});
			});
		}

		tileQuota.forEach( q => q.fromQuota=true );
		return tileQuota;
	}
	determineTheme(depth,isCore) {
		let plan = this.getPlan(isCore?'core':'limb',depth);

		if( plan && plan.themeId ) {
			let themeId = plan.themeId;
			console.log( "Theme from plan is "+themeId );
			return themeId;
		}

		let themePickList = Object.filter( ThemeList, theme => !theme.isUnique);
		console.assert(!Object.isEmpty(themePickList));
		let themeId = pick( themePickList ).typeId;
		console.assert(themeId);
		console.log( "Picked random theme "+themeId );
		return themeId;
	}

}());

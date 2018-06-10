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
						{ typeId: 'gateway', themeId: 'dwarfTown' },
						{ typeId: 'gateway', themeId: 'refugeeCamp' },
						{ typeId: 'fontSolar' },
					]
				},
				2: {
					themeId: 'corePits',
					make: [
						{ typeId: 'gateway', themeId: 'dwarfTown' },
						{ typeId: 'gateway', themeId: 'refugeeCampSlaughter' },
						{ typeId: 'fontSolar' },
					]
				},
				3: {
					themeId: 'coreCavernRooms',
					make: [
						{ typeId: 'gateway', themeId: 'spooky' },
						{ typeId: 'gateway', themeId: 'refugeeCampSlaughter' },
						{ typeId: 'fontDeep' },
					]
				},
				4: {
					themeId: 'coreMaze',
					make: [
						{ typeId: 'gateway', themeId: 'dwarfTown' },
						{ typeId: 'portal', themeId: 'hellscape'  },
						{ typeId: 'fontSolar' },
					]
				},
				5: {
					themeId: 'coreBridges',
					make: [
						{ typeId: 'gateway', themeId: 'dwarfGoblinBattle' },
						{ typeId: 'fontDeep' },
					]
				},
				6: {
					themeId: 'coreSea',
					make: [
						{ typeId: 'gateway', themeId: 'dwarfTown' },
						{ typeId: 'fontSolar' },
						{ typeId: 'fontDeep' },
					]
				},
				default: {
					themeId: 'coreCavernMedium',
					make: [
						{ typeId: 'gateway' },
						{ typeId: 'fontDeep' },
					]
				}
			},
			limb: {
				default: {
					themeId: null,
					make: [
						{ typeId: 'gateway' },
					]
				}
			}
		};
		let p = plan[key][depth] || plan[key].default;
		if( p.make && key=='core' ) {
			if( depth > 0 ) p.make.push( { typeId: 'stairsUp' } );
			if( depth < MAX_DEPTH ) p.make.push( { typeId: 'stairsDown' } );
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
				Array.filterInPlace( plan.make, schematic => {
					if( !found && schematic.typeId == gate.gateInverse ) {
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
					inject: { toAreaId: currentAreaId, toGateId: gate.id }
				},
					gate.gateDir && !theme.inControl ? { x:gate.x, y:gate.y } : { putAnywhere: true }
				)
			);
			console.log( "Quota: "+gate.gateInverse+" leading to "+currentAreaId+" / "+gate.id );
		});

		// The theme may choose to control what happens there. Typically the surface does this,
		// but not others. In general the PLAN should control.
		if( isCore && !theme.inControl && plan.make ) {
			plan.make.forEach( schematic => {
				let typeId = schematic.typeId.split('.')[0];
				tileQuota.push({
					typeId: typeId,
					symbol: TypeIdToSymbol[typeId],
					putAnywhere: true,
					inject: schematic
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

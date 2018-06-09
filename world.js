class World {
	constructor(getPlayer,onAreaChange) {
		this.getPlayer = getPlayer;
		this.areaList = {};
		this.area = null;
		this.pending = {
			gate: null
		};
		this.onAreaChange = onAreaChange;
	}

	get player() {
		return this.getPlayer();
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
						{ typeId: 'gateway', themeId: 'dwarfTown', sign: 'To Thurmulna' },
						{ typeId: 'gateway', themeId: 'refugeeCampSlaughter' },
						{ typeId: 'fontSolar' },
					]
				},
				3: {
					themeId: 'coreCavernRooms',
					make: [
						{ typeId: 'gateway', themeId: 'spooky', sign: 'Warning: Undead Area. Keep Out.' },
						{ typeId: 'gateway', themeId: 'refugeeCampSlaughter', sign: 'Refugee Camp "Prosperous Tranquility" Ahead' },
						{ typeId: 'fontDeep' },
					]
				},
				4: {
					themeId: 'coreMaze',
					make: [
						{ typeId: 'gateway', themeId: 'dwarfTown', sign: 'To Kurstifal' },
						{ typeId: 'portal', themeId: 'hellscape', sign: 'This rift in space pulses with menace.'  },
						{ typeId: 'fontSolar' },
					]
				},
				5: {
					themeId: 'coreBridges',
					make: [
						{ typeId: 'gateway', themeId: 'dwarfGoblinBattle', sign: 'Send reinforcements!' },
						{ typeId: 'fontDeep' },
					]
				},
				6: {
					themeId: 'coreSea',
					make: [
						{ typeId: 'gateway', themeId: 'dwarfTown', sign: 'To Unkruzia' },
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

	shapeWorld(depth,theme,isCore,gateList=[]) {

		let plan = this.getPlan(isCore?'core':'limb',depth) || {};

		let tileQuota = [];

		// Create gates that link to this gate
		gateList.forEach( gate => {
			if( gate.gateInverse == false ) {
				return;
			}
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
					inject: { toAreaId: this.area.id, toGateId: gate.id }
				},
					gate.gateDir && !theme.inControl ? { x:gate.x, y:gate.y } : { putAnywhere: true }
				)
			);
			console.log( "Quota: "+gate.gateInverse+" leading to "+this.area.id+" / "+gate.id );
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
		let themeId;
		if( plan && plan.themeId ) {
			themeId = plan.themeId;
			console.log( "Theme from plan is "+themeId );
		}
		else {
			let themePickList = Object.filter( ThemeList, theme => !theme.isUnique);
			console.assert(!Object.isEmpty(themePickList));
			themeId = pick( themePickList ).typeId;
			console.assert(themeId);
			console.log( "Picked random theme "+themeId );
		}
		return themeId;
	}
	createArea(depth,theme,isCore,gateList) {
		console.assert(depth !== undefined && !isNaN(depth));

		theme = Object.assign(
			{},
			ThemeDefault(),
			theme,
			{ depth: depth },
			theme.scapeId ? ScapeList[theme.scapeId]() : {}
		);

		console.log( "\nCreating area "+theme.typeId+" at depth "+depth+" core="+isCore );
		let coreAreaId = 'area.core.'+depth;
		let areaId = !this.areaList[coreAreaId] ? coreAreaId : GetUniqueEntityId('area',depth);
		let tileQuota = this.shapeWorld(depth,theme,isCore,gateList);
		let area = new Area(areaId,depth,theme);
		area.isCore = isCore;
		area.world = this;
		this.areaList[areaId] = area;	// critical that this happen BEFORE the .build() so that the theme is set for the picker.
		area.build(tileQuota)
		return area;
	}
	setPending(gate) {
		let toArea = this.areaList[gate.toAreaId];
		if( !toArea ) {
			console.log( "Gate "+gate.id+" has no toAreaId" );
			let isCore = this.area.isCore && gate.gateDir!=0;
			let depth = this.area.depth + gate.gateDir;

			if( !gate.themeId ) {
				gate.themeId = this.determineTheme(depth,isCore);
			}
			let theme = ThemeList[gate.themeId];
			let gateList = this.area.gateList.filter( g => {
				return (g.id == gate.id) || (isCore && g.gateDir == gate.gateDir);
			});
			console.log( "gateList: "+gateList.length );

			toArea = this.createArea(depth,theme,isCore,gateList);
		}

		gate.toAreaId = toArea.id;

		if( gate.gateInverse !== false ) {
			let g = toArea.gateList.filter( foreignGate => foreignGate.toGateId==gate.id );
			if( !g[0] ) {
				g = toArea.gateList.filter( foreignGate => foreignGate.typeId == gate.gateInverse && (!foreignGate.toAreaId || foreignGate.toAreaId==this.area.id) );
			}
			let gate2 = g[0];
			if( !gate2 ) {
				console.log( "No receiving gate. Creating one." );
				let pos = toArea.map.pickPosEmpty();
				gate2 = toArea.map.itemCreateByTypeId(pos[0],pos[1],gate.gateInverse,{});
				toArea.gateList.push(gate2);
			}
			// Always set these, since even if it was a found gate it should still properly link...
			gate2.toAreaId = this.area.id;
			gate2.toGateId = gate.id;
			gate2.toPos = { x: gate.x, y: gate.y };
			console.assert( gate2.toAreaId && gate2.toGateId );
			gate.toGateId = gate2.id;
			gate.toPos = { x: gate2.x, y: gate2.y };
			console.log( "Gates linked." );
		}
		else {
			// need to adjust this by the level relative offset
			console.log( "Gate has no inverse. Using toPos instead." );
			gate.toPos = { x: gate.x, y: gate.y };
		}

		console.assert( gate.toAreaId );
		console.assert( gate.toGateId || gate.toPos );
		this.pending.gate = gate;
	}
	detectPlayerOnGate(map,entityList) {
		// checking the commandToDirection means the player just moved, and isn't just standing there.
		if( !this.player || this.player.commandLast!=Command.WAIT ) {
			return;
		}
		let gateHere = map.findItem().at(this.player.x,this.player.y).filter( item => item.gateDir!==undefined );
		if( !gateHere.first ) {
			return;
		}
		let gate = gateHere.first;
		if( map.area.depth == 0 && gate.gateDir<0 ) {
			return;
		}
		this.setPending(gate)
	}
	gateTo(areaId,x,y) {
		let area = this.areaList[areaId];
		if( !area ) debugger;
		let oldArea = this.area;
		this.area = area;
		this.onAreaChange(oldArea,area,x,y);
		return area;
	}
	areaChange() {
		this.detectPlayerOnGate(this.area.map,this.area.entityList);

		let gate = this.pending.gate;
		if( !gate ) {
			return;
		}
		this.pending.gate = null;

		tell(mSubject,this.player,' ',mVerb,gate.useVerb || 'teleport',' ',mObject,gate);

		// WARNING! Someday we will need to push the DeedList that is NOT the player into the old area.
		// and resurrect the new area's deed list.
		let oldArea = this.area;
		let newArea = this.gateTo(gate.toAreaId,gate.toPos.x,gate.toPos.y);
		if( gate.killMeWhenDone ) {
			gate.destroy();
		}
		return newArea;
	}

}

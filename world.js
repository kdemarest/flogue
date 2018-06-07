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

	shapeWorld(depth,theme,isCore,gateList=[]) {

		function assure(typeId,count) {
			let reps = 100;
			// The reduce below coulds how many of the typeId already exist in the quota
			while( reps-- && tileQuota.reduce( (total,q) => total + (q.typeId==typeId ? 1 : 0), 0 ) < count ) {
				tileQuota.push({ typeId: typeId, symbol: TypeIdToSymbol[typeId], putAnywhere: true });
			}
		}

		let tileQuota = [];
		gateList.forEach( gate => {
			if( gate.gateInverse == false ) {
				return;
			}
			// Vertical gates match locations. Horizontal don't.
			tileQuota.push(
				Object.assign({
					typeId: gate.gateInverse,
					symbol: TypeIdToSymbol[gate.gateInverse],
					inject: { toAreaId: this.area.id, toGateId: gate.id }
				},
					gate.gateDir ? { x:gate.x, y:gate.y } : { putAnywhere: true }
				)
			);
			console.log( "Added "+gate.gateInverse+" at ("+gate.x+","+gate.y+") leading to "+this.area.id+" / "+gate.id );
		});

		if( isCore && !theme.inControl ) {
			assure( 'stairsDown', depth<MAX_DEPTH ? 1 : 0 );
			assure( 'stairsUp', depth>MIN_DEPTH ? 1 : 0 );
			assure( 'gateway', 1 );
			assure( 'portal', 1 );
			assure( 'deepFont', 1 );
			assure( 'solarFont', 1 );
		}
		return tileQuota;
	}
	createArea(depth,theme,isCore,gateList) {
		console.assert(depth !== undefined && !isNaN(depth)); 
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
				console.log( "Picking theme" );
				let themePickList = Object.filter( ThemeList, theme => !!theme.allowInCore==isCore && !theme.isUnique);
				console.assert(!Object.isEmpty(themePickList));
				gate.themeId = pick( themePickList ).typeId;
				console.assert(gate.themeId);
			}
			let theme = ThemeList[gate.themeId];
			let gateList = this.area.gateList.filter( g => {
				return (g.id == gate.id) || (isCore && g.gateDir == gate.gateDir);
			});
			console.log( "gateList: "+gateList.length );

//			if( gate.gateInverse === false ) {
//				gateList.push( { gateInverse: 'floor', x: gate.x, y: gate.y } );
//			}
			toArea = this.createArea(depth,theme,isCore,gateList);
		}

		gate.toAreaId = toArea.id;

		if( gate.gateInverse !== false ) {
			let gate2 = toArea.getGateThatLeadsTo(gate.id);	// createArea() causes this thing to exist...
			if( !gate2 ) {
				console.log( "No receiving gate. Creating one." );
				let pos = toArea.map.pickPosEmpty();
				gate2 = toArea.map.itemCreateByTypeId(pos[0],pos[1],gate.gateInverse,{});
				gate2.toAreaId = this.area.id;
				gate2.toGateId = gate.id;
			}
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
	gateTo(areaId) {
		let area = this.areaList[areaId];
		if( !area ) debugger;
		this.area = area;
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
		let newArea = this.gateTo(gate.toAreaId);
		this.onAreaChange(oldArea,newArea,gate.toPos.x,gate.toPos.y);
		if( gate.killMeWhenDone ) {
			gate.destroy();
		}
		return newArea;
	}

}

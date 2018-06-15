class World {
	constructor(getPlayer,onAreaChange) {
		this.getPlayer = getPlayer;
		this.areaList = {};
		this.area = null;
		this.pending = {
			gate: null
		};
		this.onAreaChange = onAreaChange;
		// Hack of convenience...
		Gab.world = this;
	}

	get player() {
		return this.getPlayer();
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
		let tileQuota = Plan.shapeWorld(this.area?this.area.id:null,depth,theme,isCore,gateList);
		let areaId = isCore ? 'area.core.'+depth : 'area.'+theme.typeId+'.'+depth+'.'+GetTimeBasedUid();
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
			console.assert(gate.themeId);
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
	getAreaById(areaId) {
		return this.areaList[areaId];
	}
	gateTo(areaId,x,y) {
		let area = this.getAreaById(areaId);
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

class World {
	constructor(getPlayer,onAreaChange) {
		this.getPlayer = getPlayer;
		this.areaList = {};
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

	createArea(currentAreaId,depth,theme,isCore,gateList) {
		console.assert(depth !== undefined && !isNaN(depth));

		theme = Object.assign(
			{},
			ThemeDefault(),
			theme,
			{ depth: depth },
			theme.scapeId ? ScapeList[theme.scapeId]() : {}
		);

		console.log( "\nCreating area "+theme.typeId+" at depth "+depth+" core="+isCore );
		let tileQuota = Plan.shapeWorld(currentAreaId,depth,theme,isCore,gateList);
		let areaId = isCore ? 'area.core.'+depth : 'area.'+theme.typeId+'.'+depth+'.'+GetTimeBasedUid();
		let area = new Area(areaId,depth,theme);
		area.isCore = isCore;
		area.world = this;
		this.areaList[areaId] = area;	// critical that this happen BEFORE the .build() so that the theme is set for the picker.
		area.build(tileQuota)
		return area;
	}
	linkGatesAndCreateArea(gate,curArea,toArea) {
		if( !toArea ) {
			console.log( "Gate "+gate.id+" has no toAreaId" );
			let isCore = curArea.isCore && gate.gateDir!=0;
			let depth = curArea.depth + gate.gateDir;
			console.assert(gate.themeId);
			let theme = ThemeList[gate.themeId];
			let gateList = curArea.gateList.filter( g => {
				return (g.id == gate.id) || (isCore && g.gateDir == gate.gateDir);
			});
			console.log( "gateList: "+gateList.length );

			toArea = this.createArea(curArea.id,depth,theme,isCore,gateList);
		}

		gate.toAreaId = toArea.id;

		if( gate.gateInverse !== false ) {
			let g = toArea.gateList.filter( foreignGate => foreignGate.toGateId==gate.id );
			if( !g[0] ) {
				g = toArea.gateList.filter( foreignGate => {
					return foreignGate.typeId == gate.gateInverse && (!foreignGate.toAreaId || foreignGate.toAreaId==curArea.id)
				});
			}
			let gate2 = g[0];
			if( !gate2 ) {
				console.log( "No receiving gate. Creating one." );
				let pos = toArea.map.pickPosEmpty();
				gate2 = toArea.map.itemCreateByTypeId(pos[0],pos[1],gate.gateInverse,{});
				toArea.gateList.push(gate2);
			}
			// Always set these, since even if it was a found gate it should still properly link...
			gate2.toAreaId = curArea.id;
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
	}
	setPending(gate) {
		this.linkGatesAndCreateArea(gate,gate.area,this.areaList[gate.toAreaId]);
		this.pending.gate = gate;
	}
	detectPlayerOnGate() {
		// checking the commandToDirection means the player just moved, and isn't just standing there.
		let player = this.player;
		if( !player || player.commandLast!=Command.WAIT ) {
			return;
		}
		let gateHere = player.map.findItemAt(player.x,player.y).filter( item => item.gateDir!==undefined );
		if( !gateHere.first ) {
			return;
		}
		let gate = gateHere.first;
		if( player.area.depth == 0 && gate.gateDir<0 ) {
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
		this.onAreaChange(area,x,y);
		return area;
	}
	areaChange() {
		this.detectPlayerOnGate();

		if( !this.pending.gate ) {
			return;
		}
		let gate = this.pending.gate;
		this.pending.gate = null;

		tell(mSubject,this.player,' ',mVerb,gate.useVerb || 'teleport',' ',mObject,gate);

		// WARNING! Someday we will need to push the DeedList that is NOT the player into the old area.
		// and resurrect the new area's deed list.
		let newArea = this.gateTo(gate.toAreaId,gate.toPos.x,gate.toPos.y);
		if( gate.killMeWhenDone ) {
			gate.destroy();
		}
		return newArea;
	}

}

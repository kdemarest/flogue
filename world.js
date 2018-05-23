class World {
	constructor(startingLevel=1) {
		this.areaList = {};
		this.area = null;
		this.startingLevel = startingLevel;
		this.pending = {
			gate: null
		};
	}
	createArea(areaId,levelDelta=0) {
		let level = this.area ? this.area.level+levelDelta : this.startingLevel;
		areaId = areaId || 'area.'+humanNameList.pop()+'.'+level;
		let entrance = this.area===null ? ItemTypeList.stairsUp : (levelDelta>0 ? ItemTypeList.stairsUp : (levelDelta<0 ? ItemTypeList.stairsDown : ItemTypeList.gateway));
		let area = new Area(areaId,level,entrance);
		this.areaList[areaId] = area;
		return area;
	}
	gateTo(areaId) {
		let area = this.areaList[areaId];
		if( !area ) debugger;
		this.area = area;
		return area;
	}
	setPending(gate) {
		let toArea = this.areaList[gate.toAreaId];
		if( !toArea ) {
			toArea = this.createArea(gate.toAreaId,gate.gateDir);
		}

		let gate2 = gate.toGateId ? toArea.getGate(gate.toGateId) : toArea.getUnusedGateByTypeId(gate.gateInverse);
		if( !gate2 ) {
			let pos = toArea.map.pickPosEmpty();
			gate2 = toArea.map.itemCreateByTypeId(pos[0],pos[1],gate.gateInverse);
		}

		gate.toAreaId = toArea.id;
		gate.toGateId = gate2.id;
		gate2.toAreaId = this.area.id;
		gate2.toGateId = gate.id;
		if( !gate.toAreaId || !gate.toGateId || !gate2.toAreaId || !gate2.toGateId ) {
			debugger;
		}
		this.pending.gate = gate;
	}
	detectPlayerOnGate(map,entityList) {
		let player = playerFind(entityList);

		// checking the commandToDirection means the player just moved, and isn't just standing there.
		if( !player || ( player.commandLast!=Command.WAIT && commandToDirection(player.commandLast)===false) ) {
			return;
		}
		let x = player.x;
		let y = player.y;
		let gateHere = new ItemFinder(map.itemList).at(x,y).filter( item => item.gateDir!==undefined );
		if( !gateHere.first ) {
			return;
		}
		let gate = gateHere.first;
		if( map.level == 1 && gate.gateDir<0 ) {
			return;
		}
		this.setPending(gate)
	}

	levelChange(map,entityList) {
		this.detectPlayerOnGate(map,entityList);

		let gate = this.pending.gate;
		if( !gate ) {
			return;
		}
		this.pending.gate = null;

		let player = playerFind(entityList);
		tell(mSubject,player,' ',mVerb,gate.useVerb || 'teleport',' ',mObject,gate);

		// WARNING! Someday we will need to push the DeedList that is NOT the player into the old area.
		// and resurrect the new area's deed list.
		let newArea = this.gateTo(gate.toAreaId);
		let g = new ItemFinder(newArea.map.itemList).isId(gate.toGateId);
		if( !g.first ) debugger;

		player.gateTo(newArea,g.first.x,g.first.y);
		tell(mSubject,player,' ',mVerb,'are',' now on level '+newArea.id)
		return newArea;
	}

}

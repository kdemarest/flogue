class World {
	constructor(startingLevel=1) {
		this.areaList = {};
		this.area = null;
		this.startingLevel = startingLevel;
	}
	createArea(levelDelta=0) {
		let level = this.area ? this.area.level+levelDelta : this.startingLevel;
		let areaId = 'area.'+humanNameList.pop()+'.'+level;
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

	levelChange(map,entityList) {
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
		let verb = (gate.gateDir<0 ? 'ascend' : (gate.gateDir>0 ? 'descend' : 'enter'));
		tell(mSubject,player,' ',mVerb,verb,' ',mObject,gate);

		if( !gate.toAreaId ) {
			let toArea = this.createArea(gate.gateDir);
			let gate2 = toArea.getGate(-gate.gateDir);
			gate.toAreaId = toArea.id;
			gate.toGateId = gate2.id;
			gate2.toAreaId = this.area.id;
			gate2.toGateId = gate.id;
		}
		// WARNING! Someday we will need to push the DeedList that is NOT the player into the old area.
		// and resurrect the new area's deed list.
		let newArea = this.gateTo(gate.toAreaId);
		player.gateTo(newArea,gate.toGateId);
		tell(mSubject,player,' ',mVerb,'are',' now on level '+newArea.id)
		return newArea;
	}

}

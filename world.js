class World {
	constructor(startingLevel=1,onAreaChange) {
		this.areaList = {};
		this.area = null;
		this.startingLevel = startingLevel;
		this.pending = {
			gate: null
		};
		this.onAreaChange = onAreaChange;
	}
	createArea(areaId,levelDelta,theme,entranceSymbol) {
		let level = this.area ? this.area.level+levelDelta : this.startingLevel;
		let isCore = false;
		if( !areaId ) {
			let coreAreaId = 'area.core.'+level;
			if( !this.areaList[coreAreaId] ) {
				areaId = coreAreaId;
				isCore = true;
			}
			else {
				areaId = GetUniqueEntityId('area',level);
			}
		}
		let palette = {
			floor: TileTypeList.floor.symbol,
			wall: TileTypeList.wall.symbol,
			unknown: TILE_UNKNOWN,
			entrance: this.area===null ? ItemTypeList.stairsUp.symbol : entranceSymbol,
			// (levelDelta>0 ? ItemTypeList.stairsUp : (levelDelta<0 ? ItemTypeList.stairsDown : ItemTypeList.gateway)),
			exit: ItemTypeList.stairsDown.symbol
		};

		let area = new Area(areaId,level,theme,isCore);
		this.areaList[areaId] = area;	// critical that this happen BEFORE the .build() so that the theme is set for the picker.
		area.build(palette)
		return area;
	}
	gateTo(areaId) {
		let area = this.areaList[areaId];
		if( !area ) debugger;
		this.area = area;
		this.onAreaChange(this.area);
		return area;
	}
	setPending(gate) {
		let toArea = this.areaList[gate.toAreaId];
		if( !toArea ) {
			let theme = ThemeList[gate.themeId || 'cavern'];
			let inverseGateSymbol = ItemTypeList[gate.gateInverse].symbol;
			toArea = this.createArea(gate.toAreaId,gate.gateDir,theme,inverseGateSymbol);
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
		let gateHere = map.findItem().at(x,y).filter( item => item.gateDir!==undefined );
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
		let g = newArea.map.findItem().isId(gate.toGateId);
		if( !g.first ) debugger;

		player.gateTo(newArea,g.first.x,g.first.y);
		tell(mSubject,player,' ',mVerb,'are',' now on level '+newArea.id)
		return newArea;
	}

}

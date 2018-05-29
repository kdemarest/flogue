class World {
	constructor(startingLevel=1,getPlayer,onAreaChange) {
		this.getPlayer = getPlayer;
		this.areaList = {};
		this.area = null;
		this.startingLevel = startingLevel;
		this.pending = {
			gate: null
		};
		this.onAreaChange = onAreaChange;
	}
	get player() {
		return this.getPlayer();
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
			floor: 			TileTypeList.floor.symbol,
			wall:  			TileTypeList.wall.symbol,
			door:  			TileTypeList.door.symbol,
			fillFloor:  	TileTypeList.floor.symbol,
			fillWall:  		TileTypeList.wall.symbol,
			outlineWall:  	TileTypeList.wall.symbol,
			passageFloor: 	TileTypeList.floor.symbol,
			unknown: 		TILE_UNKNOWN,
			entrance: 		this.area===null ? ItemTypeList.stairsUp.symbol : entranceSymbol,
			exit: 			ItemTypeList.stairsDown.symbol
		};

		let area = new Area(areaId,level,theme,isCore);
		this.areaList[areaId] = area;	// critical that this happen BEFORE the .build() so that the theme is set for the picker.
		area.build(palette)
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
		// checking the commandToDirection means the player just moved, and isn't just standing there.
		if( !this.player || ( this.player.commandLast!=Command.WAIT && commandToDirection(this.player.commandLast)===false) ) {
			return;
		}
		let gateHere = map.findItem().at(this.player.x,this.player.y).filter( item => item.gateDir!==undefined );
		if( !gateHere.first ) {
			return;
		}
		let gate = gateHere.first;
		if( map.level == 1 && gate.gateDir<0 ) {
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
	levelChange() {
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
		this.onAreaChange(oldArea,newArea,gate.toGateId);
		return newArea;
	}

}

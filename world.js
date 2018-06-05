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
	shapeWorld(depth,isCore) {
		function add(typeId,amount) {
			console.assert(amount!==undefined);
			tileQuota[typeId] = (tileQuota[typeId]||0) + amount;
		}

		let tileQuota = {};
		add( 'stairsDown',	isCore ? 1 : 0 );
		add( 'stairsUp',	isCore && depth>0 ? 1 : 0 );
		add( 'gateway',		isCore ? 1 : 0 );
		add( 'portal',		isCore ? 1 : 0 );
		add( 'deepFont',	isCore ? 1 : 0 );
		add( 'solarFont', 	isCore ? 1 : 0 );
		return tileQuota;
	}
	createArea(depth,theme,isCore) {
		console.assert(depth !== undefined && !isNaN(depth)); 
		let coreAreaId = 'area.core.'+depth;
		let areaId = !this.areaList[coreAreaId] ? coreAreaId : GetUniqueEntityId('area',depth);
		let tileQuota = this.shapeWorld(depth,isCore);
		let area = new Area(areaId,depth,theme);
		area.isCore = isCore;
		this.areaList[areaId] = area;	// critical that this happen BEFORE the .build() so that the theme is set for the picker.
		area.build(tileQuota)
		return area;
	}
	setPending(gate) {
		let toArea = this.areaList[gate.toAreaId];
		if( !toArea ) {
			let isCore = this.area.isCore && gate.gateDir!=0;
			let depth = this.area.depth + gate.gateDir;
			if( !gate.themeId ) {
				let themePickList = Object.filter( ThemeList, theme => !!theme.allowInCore==isCore && !theme.isUnique);
				console.assert(!Object.isEmpty(themePickList));
				gate.themeId = pick( themePickList ).typeId;
				console.assert(gate.themeId);
			}
			let theme = ThemeList[gate.themeId];
			toArea = this.createArea(depth,theme,isCore);
		}

		let gate2 = gate.toGateId ? toArea.getGate(gate.toGateId) : toArea.getUnusedGateByTypeId(gate.gateInverse);
		if( !gate2 ) {
			let pos = toArea.map.pickPosEmpty();
			gate2 = toArea.map.itemCreateByTypeId(pos[0],pos[1],gate.gateInverse,{});
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
		this.onAreaChange(oldArea,newArea,gate.toGateId);
		return newArea;
	}

}

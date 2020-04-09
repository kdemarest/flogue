Module.add('world',function() {

class World {
	constructor(plan) {
		this.plan = plan;
		this.areaList = {};
		// Hack of convenience...
		Gab.world = this;
	}

	quotaAddGates(quota,toAreaId) {
		let incomingGateItemList = [];

		// Scan gates in all areas that want to link to this areaId.
		Object.each( this.areaList, area => {
			incomingGateItemList.push( ...area.gateList.filter( item=>item.toAreaId==toAreaId && !item.oneway ) );
		});

		// This creates a so-called "quota" that the Mason will use to force into
		// existence the right items, in the right places. In this case gates.
		// Vertical gates match locations. Horizontal don't.
		incomingGateItemList.forEach( item => {
			let typeId = item.gateInverse;
			let gateBasics = {
				typeId: typeId,
				symbol: TypeIdToSymbol[typeId],
				inject: {
					typeFilter: typeId,
					toAreaId:   item.area.id,
					toGateId:   item.id
				}
			}
			let theme = this.plan.get(toAreaId).theme;
			let gateLocation = item.gateDir && !theme.iDescribeMyGates ? { x:item.x, y:item.y } : { putAnywhere: true };
			quota.push( Object.assign( {}, gateBasics, gateLocation, { why: 'area '+item.area.id+' connects to me' } ) );
		});
		return quota;
	}


	linkGates(area) {
		// Link all the gates we can.
		area.gateList.forEach( gate => {
			if( gate.toGate ) {
				gate.toGate.toGateId = gate.id;
				console.log( gate.area.id,'/',gate.id,'<==>',gate.toGate.area.id,'/',gate.toGate.id );
				console.log(gate,gate.toGate);
			}
			else {
				console.log( gate.area.id,'/',gate.id,' still not linked' );
			}
		});
		area.gateList.forEach( gate => {
			gate.toThemeId = gate.toThemeId || this.plan.get(gate.toAreaId).themeId;
		});

	}

	planExists(areaId) {
		return this.plan.get(areaId);
	}

	createArea(toAreaId) {

		let plan  = this.plan.get(toAreaId);
		console.assert( plan.theme );
		let themeMerged = Object.assign(
			{},
			plan.theme,
			{ depth: plan.depth },
			plan.theme.scapeId ? ScapeList[plan.theme.scapeId]() : {}
		);

		console.log( "\nCreating area",plan, themeMerged );
		let quota = [];
		this.quotaAddGates( quota, toAreaId );
		this.plan.quotaAdd( quota, toAreaId );
		console.log(quota);
		let toArea = new Area(toAreaId,plan.depth,themeMerged);
		toArea.world = this;
		this.areaList[toAreaId] = toArea;	// critical that this happen BEFORE the .build() so that the theme is set for the picker.
		toArea.build( quota );

		this.linkGates(toArea);

		return toArea;
	}
	createAreaAsNeeded(areaId,planFn) {
		if( !this.planExists(areaId) ) {
			// we could spontaneously add this area to the plan.
			this.plan.add( planFn() );
		}
		return this.areaList[areaId] || this.createArea( areaId );
	}
/*
	createAreaFromGate(gate) {
		if( !this.plan.get(gate.toAreaId) ) {
			// we could spontaneously add this area to the plan.
			console.assert(gate.allowAreaCreate);
			this.plan.add({
				areaId:  gate.toAreaId,
				depth:   gate.area.depth,
				themeId: gate.themeId
			});
		}
		return gate.toArea || this.createArea( gate.toAreaId );
	}
*/
	getAreaById(areaId) {
		return this.areaList[areaId];
	}
}

return {
	World: World
}

});

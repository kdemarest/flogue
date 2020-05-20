Module.add('world',function() {

Math.toDt = dt60 => {
	return dt60 / 60;
}

class World {
	constructor(plan) {
		this.plan = plan;
		this.areaList = {};
		this.userList = [];

		this._timeFund720 = 0;

		// Hack of convenience...
		Gab.world = this;
	}

	traverse(fn) {
		Object.each( this.areaList, area => fn(area) );
	}

	setTickingAreas(areaId) {
		this.traverse( area => {
			area.isTicking = area.connectsTo(areaId) || area.id==areaId;
		});
	}

	itemListTickRound(_itemList,rechargeRate) {
		console.assert(rechargeRate);
		let itemList = _itemList.slice();	// Any item might get destroyed during this process.
		for( let item of itemList ) {
			item.tickRound(rechargeRate);
		}
	}


	tick720( dtWall720 ) {

		dtWall720 = Time.mult720(dtWall720,Rules.displayVelocity);

		Tester.tick();

		let userEntity = this.userList[0].entity;
		console.assert( userEntity.isUser );

		if( userEntity.controlSuborned ) {
			if( userEntity.command == Command.WAIT || userEntity.playerUnderTestControl ) {
				this._timeFund720 += Time.one720;
			}
			userEntity.clearCommands();
		}

		if( userEntity.command !== Command.NONE ) {
			userEntity.act();
			let timeCost720 = userEntity.commandSpeed<=0 ? 0 : Time.to720(1/userEntity.commandSpeed);
			console.logCommand( 'player '+userEntity.command+' took '+timeCost720 );
			this._timeFund720 += timeCost720;
			userEntity.actionLeft720 += timeCost720;
			console.assert( Time.is720(userEntity.actionLeft720) );
			userEntity.clearCommands();
		}

		// Only let time advance if the user has acted, othewise, sim time is halted.
		let dt720 = Math.min( dtWall720, this._timeFund720 );
		this._timeFund720 -= dt720;

		this.traverse( area => {
			area.tick720( dt720, dtWall720 );
		});

		// This goes last because it includes gui render.
		// Especially, the sprite movement has to look right.
		this.userList.forEach( user => {
			user.tickGui( Time.from720(dtWall720) );
		});

		Tester.check();
		
		Time.sim.timeAdvance720( dt720 );
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


	// Link all the gates we can.
	linkGates(area) {

		// Back-link any gate that leads to a prior area.
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

		// Any gates that only lead to areas, but don't know their theme, inform them.
		area.gateList.forEach( gate => {
			if( !gate.toThemeId ) {
				if( !gate.toAreaId ) {
					console.log('winging it');
					let plan = this.plan.add({
						areaId:		'user-'+Date.makeUid(),
						depth:		area.depth,
						themeId:	area.theme.id,
						isSpontaneous: true
					});
					gate.toAreaId = plan.areaId;
				}
				gate.toThemeId = this.plan.get(gate.toAreaId).themeId
			}
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
		toArea.underConstruction = false;

		return toArea;
	}
	createAreaAsNeeded(areaId,planDefinitionFn) {
		if( !this.planExists(areaId) ) {
			// we could spontaneously add this area to the plan.
			this.plan.add( planDefinitionFn() );
		}
		return this.area(areaId) || this.createArea( areaId );
	}
	area(areaId) {
		return this.areaList[areaId];
	}
}

return {
	World: World
}

});

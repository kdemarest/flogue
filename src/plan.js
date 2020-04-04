Module.add('plan',function() {

let PlanData = {
	'core.0': {
		themeId:	'surface',
		links:		'core.1',
		make:		''
	},
	'core.1': {
		themeId:	'coreCavernRooms',
		links:		'core.2,wildlands,dwarfTown,dwarfTown,dwarfTown,dwarfTown,dwarfTown,dwarfTown,dwarfTown,dwarfTown,refugeeCamp,moonTheme',
		make:		'fontSolar'
	},
	'core.2': {
		themeId:	'corePits',
		links:		'core.3,wildlands,dwarfTown,refugeeCampSlaughter',
		make:		'fontSolar'
	},
	'core.3': {
		themeId:	'coreRooms',
		links:		'core.4,wildlands,spooky,refugeeCampSlaughter',
		make:		'fontDeep'
	},
	'core.4': {
		themeId:	'coreMaze',
		links:		'core.5,wildlands,dwarfTown,hellTheme',
		make:		'fontSolar'
	},
	'core.5': {
		themeId:	'coreBridges',
		links:		'core.6,wildlands,dwarfGoblinBattle',
		make:		'fontDeep'
	},
	'core.6': {
		themeId:	'coreSea',
		links:		'core.7,wildlands,dwarfTown',
		make:		'fontDeep'
	},
	'core.7': {
		themeId:	'coreMorphousRooms',
		links:		'core.8,wildlands,dwarfTown',
		make:		'fontSolar,fontDeep'
	},
	'core.8': {
		themeId:	'coreCavernRooms',
		links:		'core.9,wildlands,spooky',
		make:		'fontSolar'
	},
	'core.9': {
		themeId:	'coreMixedRooms',
		links:		'core.10,wildlands,dwarfTown,spooky',
		make:		'fontSolar,fontDeep'
	},
	'core.10': {
		themeId:	'coreMorphousRooms',
		links:		'core.11,wildlands,dwarfTown',
		make:		'fontSolar,fontDeep'
	},
	'core.11': {
		themeId:	'coreMixedRooms',
		links:		'core.12,wildlands,dwarfTown,spooky',
		make:		'fontSolar,fontDeep'
	},
	'core.12': {
		themeId:	'coreMixedRooms',
		links:		'core.13,wildlands,dwarfTown,spooky',
		make:		'fontSolar,fontDeep'
	},
	'core.13': {
		themeId:	'coreMorphousRooms',
		links:		'core.14,wildlands,dwarfTown,spooky',
		make:		'fontSolar,fontDeep'
	},
	'core.14': {
		themeId:	'coreMixedRooms',
		links:		'core.15,wildlands,dwarfTown',
		make:		'fontSolar,fontDeep'
	},
	'core.15': {
		themeId:	'coreBridges',
		links:		'core.16,wildlands,dwarfTown',
		make:		'fontSolar,fontDeep'
	},
	'core.16': {
		themeId:	'coreMixedRooms',
		links:		'core.17,wildlands,dwarfTown',
		make:		'fontSolar,fontDeep'
	},
	'core.17': {
		themeId:	'coreMixedRooms',
		links:		'core.18,wildlands,dwarfTown',
		make:		'fontSolar,fontDeep'
	},
	'core.18': {
		themeId:	'coreHellTheme',
		links:		'core.19,wildlands,dwarfTown',
		make:		'fontDeep,fontDeep'
	},
	'core.19': {
		themeId:	'coreFinalLevel',
		links:		'',
		make:		'fontDeep,fontDeep,fontDeep'
	},
};

function planParse(raw) {
	let cut = (s,delim) => {
		let temp = s.split(delim);
		if( temp.length == 1 && temp[0]=='' ) {
			return [];
		}
		return temp;
	}
	let cutMake = (m,delim) => {
		return (Array.isArray(m) ? m : cut(m,delim) )
			.map( entry=>typeof entry == 'object' ? entry : { typeFilter: entry } );
	}
	let getDepth = (s) => {
		let d = s.split('.')[1];
		return d===undefined ? null : parseInt(d);
	}
	let deduceGateType = (from,to) => {
		if( from.depth > to.depth ) return 'stairsUp';
		if( from.depth < to.depth ) return 'stairsDown';
		return (ThemeList[to.themeId] ? ThemeList[to.themeId].gateType : '') || 'gateway';
	}
	let planList = {};
	Object.each( raw, (data,myAreaId) => {
		let p = planList[myAreaId] = {};
		console.assert( myAreaId !== undefined );
		Object.assign( p, {
			areaId:		myAreaId,
			themeId:	data.themeId || (1/0),
			depth:		getDepth(myAreaId),
			gateList:	Object.assign( {}, data.gateList || {} ),
			make:		cutMake(data.make,',')
		});
		let linkList = cut(data.links,',');
		linkList.forEach( areaId => {
			console.assert( areaId !== undefined );
			let themeId = areaId;
			if( getDepth(areaId) === null ) {
				areaId += '.'+p.depth;
			}
			console.assert( areaId !== undefined );
			planList[areaId] = planList[areaId] || {};
			Object.assign( planList[areaId], {
				areaId:		areaId,
				themeId:	themeId,
				depth:		getDepth(areaId),
				gateList:	{}, //{ [myAreaId]: myAreaId },
				make:		[]
			});
			p.gateList[areaId] = areaId;
		});
	});
	// Assure all the back-links.
	Object.each( planList, plan => {
		Object.each( plan.gateList, (X,areaId) => {
			let toGateType = deduceGateType(planList[plan.areaId],planList[areaId]);
			console.assert( areaId != plan.areaId );
			plan.gateList[areaId] = {
				toAreaId:		areaId,
				//toGateId:		'gate'+(this.gateCount++),
				toGateType:		toGateType
			}
		});
	});
	return Object.map( planList, planData => new Plan(planData) );
}

class Plan {
	constructor(data) {
		Object.assign(
			this,
			{
				areaId:		null,
				themeId:	null,
				depth:		0,
				gateList:	{},
				make:		[]
			},
			data
		);
	}
	get theme() {
		return ThemeList[this.themeId];
	}
}

class PlanList {
	constructor() {
		//this.gateCount = 0;
		this.list = planParse(PlanData);
	}

	get(areaId) {
		return this.list[areaId];
	}

	findFirst(fn) {
		return Object.find( this.list, fn );
	}
	add(data) {
		console.assert( !this.list[data.areaId] );
		let plan = this.list[data.areaId] = new Plan( Object.assign(data) );	
		return plan;
	}

	quotaAdd(quota,toAreaId) {

		let plan = this.get(toAreaId);
		Object.each( plan.gateList, gate => {
			console.assert( gate.toAreaId !== toAreaId );
			quota.push({
				typeId: gate.toGateType,
				symbol: TypeIdToSymbol[gate.toGateType],
				putAnywhere: true,
				inject: {
					typeFilter: gate.toGateType,
					toAreaId:	gate.toAreaId,
				}
			});
		});

		// The theme may choose to control what happens there. Typically the surface does this,
		// but not others. In general the PLAN should control.
		if( !plan.theme.inControl && plan.make ) {
			plan.make.forEach( supply => {
				let typeId = supply.typeFilter.split('.')[0];
				quota.push({
					typeId: typeId,
					symbol: TypeIdToSymbol[typeId],
					putAnywhere: true,
					inject: supply
				});
			});
		}

		quota.forEach( q => { q.fromQuota=true; q.inject.fromQuota=true; } );
		return quota;
	}
	themePick(depth,isCore) {
		let themePickList = Object.filter( ThemeList, theme => !theme.isUnique);
		console.assert(!Object.isEmpty(themePickList));
		let themeId = pick( themePickList ).typeId;
		console.assert(themeId);
		console.log( "Picked random theme "+themeId );
		return themeId;
	}

}

return {
	PlanData: PlanData,
	PlanList: PlanList
}

});

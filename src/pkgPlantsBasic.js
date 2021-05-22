Module.add('pkgPlantsBasic',function(X,moduleId) {

let plugin = new Plugin('pkgPlantsBasic');

const PlantQualityList = Type.establish('PlantQuality',{},{
	"wilted": 		{ level:  0, rarity: 1.0 },
	"thriving": 	{ level:  0, rarity: 1.0 },
});

const PlantVarietyList = Type.establish('PlantVarieties',{},{
	"wheatPlant": 		{ level:  0, rarity:  1.0, needLight: 6, harvestReps: 1, harvestLoot: '2x stuff.wheat', img: "plant/wheatPlant.png" },
	"barleyPlant": 		{ level:  0, rarity:  1.0, needLight: 6, harvestReps: 1, harvestLoot: '3x stuff.barley', img: "plant/barleyPlant.png" },
	"carrotPlant": 		{ level:  0, rarity:  1.0, needLight: 6, harvestReps: 1, harvestLoot: '1x stuff.carrot', img: "plant/carrotPlant.png" },
	"potatoPlant": 		{ level:  0, rarity:  1.0, needLight: 6, harvestReps: 1, harvestLoot: '1x stuff.potato, 50% stuff.potato', img: "plant/potatoPlant.png" },
	"peaPlant": 		{ level:  0, rarity:  1.0, needLight: 6, harvestReps: 3, harvestLoot: '1x stuff.pea, 2x 50% stuff.pea', img: "plant/peaPlant.png" },
	"beanPlant": 		{ level:  0, rarity:  1.0, needLight: 6, harvestReps: 3, harvestLoot: '1x stuff.bean, 2x 50% stuff.bean', img: "plant/beanPlant.png" },
	"cabbagePlant": 	{ level:  0, rarity:  1.0, needLight: 6, harvestReps: 1, harvestLoot: '1x stuff.cabbage', img: "plant/cabbagePlant.png" },
});

const MushroomVarietyList = Type.establish('MushroomVariety',{},{
	"amanitaMushroom": 		{ level:  0, rarity:  1.0, harvestLoot: '1x stuff.amanita', img: "mushroom/amanita.png",
		effectOnHarvest: Object.assign( {}, EffectTypeList.ePoison, {xDamage:0.3} ) },
	"blurellaMushroom": 	{ level:  0, rarity:  1.0, light: 4, glow: 1, harvestLoot: '1x stuff.blurella', img: "mushroom/blurella.png" },
	"coxilliaMushroom": 	{ level:  0, rarity:  1.0, harvestLoot: '1x stuff.coxillia', img: "mushroom/coxillia.png" },
	"grollotusMushroom": 	{ level:  0, rarity:  1.0, harvestLoot: '1x stuff.grollotus', img: "mushroom/grollotus.png" },
	"klinulusMushroom": 	{ level:  0, rarity:  1.0, harvestLoot: '1x stuff.klinulus', img: "mushroom/klinulus.png" },
	"rhodotusMushroom": 	{ level:  0, rarity:  1.0, harvestLoot: '1x stuff.rhodotus', img: "mushroom/rhodotus.png" },
});

const SeedVarietyList = Type.establish('SeedVariety',{},{
	"wheatSeed": 		{ rarity: 1.0, matter: 'plant', scale: 0.3, lootOnDrop: 'plant.wheatPlant' },
	"barleySeed": 		{ rarity: 1.0, matter: 'plant', scale: 0.3, lootOnDrop: 'plant.barleyPlant' },
	"carrotSeed": 		{ rarity: 1.0, matter: 'plant', scale: 0.3, lootOnDrop: 'plant.carrotPlant' },
	"potatoSeed": 		{ rarity: 1.0, matter: 'plant', scale: 0.3, lootOnDrop: 'plant.potatoPlant' },
	"peaSeed": 			{ rarity: 1.0, matter: 'plant', scale: 0.3, lootOnDrop: 'plant.peaPlant' },
	"beanSeed": 		{ rarity: 1.0, matter: 'plant', scale: 0.3, lootOnDrop: 'plant.beanPlant' },
	"cabbageSeed": 		{ rarity: 1.0, matter: 'plant', scale: 0.3, lootOnDrop: 'plant.cabbagePlant' },
	"amanitaSeed": 		{ rarity: 1.0, matter: 'fungus', scale: 0.3, lootOnDrop: 'mushroom.amanitaMushroom' },
	"blurellaSeed": 	{ rarity: 1.0, matter: 'fungus', scale: 0.3, lootOnDrop: 'mushroom.blurellaMushroom' },
	"coxilliaSeed": 	{ rarity: 1.0, matter: 'fungus', scale: 0.3, lootOnDrop: 'mushroom.coxilliaMushroom' },
	"grollotusSeed":	{ rarity: 1.0, matter: 'fungus', scale: 0.3, lootOnDrop: 'mushroom.grollotusMushroom' },
	"klinulusSeed": 	{ rarity: 1.0, matter: 'fungus', scale: 0.3, lootOnDrop: 'mushroom.klinulusMushroom' },
	"rhodotusSeed": 	{ rarity: 1.0, matter: 'fungus', scale: 0.3, lootOnDrop: 'mushroom.rhodotusMushroom' },
});

const StuffVarietyList = {
	"mushroomBread": 	{ rarity: 1.0, matter: 'plant', mayThrow: true, mayTargetPosition: true, isEdible: true, img: 'item/food/bread_ration.png'},

	"wheat": 			{ rarity: 1.0, matter: 'plant', isEdible: true, img: "plant/wheat.png" },
	"barley": 			{ rarity: 1.0, matter: 'plant', isEdible: true, img: "plant/barley.png" },
	"carrot": 			{ rarity: 1.0, matter: 'plant', isEdible: true, img: "plant/carrot.png" },
	"potato": 			{ rarity: 1.0, matter: 'plant', isEdible: true, img: "plant/potato.png" },
	"pea": 				{ rarity: 1.0, matter: 'plant', isEdible: true, img: "plant/pea.png" },
	"bean": 			{ rarity: 1.0, matter: 'plant', isEdible: true, img: "plant/bean.png" },
	"cabbage": 			{ rarity: 1.0, matter: 'plant', isEdible: true, img: "plant/cabbage.png" },
	"amanita": 			{ rarity: 1.0, matter: 'fungus', isFungus: true, isEdible: true, scale: 0.3, img: "mushroom/amanita.png" },
	"blurella": 		{ rarity: 1.0, matter: 'fungus', isFungus: true, isEdible: true, scale: 0.3, img: "mushroom/blurella.png" },
	"coxillia": 		{ rarity: 1.0, matter: 'fungus', isFungus: true, isEdible: true, scale: 0.3, img: "mushroom/coxillia.png" },
	"grollotus": 		{ rarity: 1.0, matter: 'fungus', isFungus: true, isEdible: true, scale: 0.3, img: "mushroom/grollotus.png" },
	"klinulus": 		{ rarity: 1.0, matter: 'fungus', isFungus: true, isEdible: true, scale: 0.3, img: "mushroom/klinulus.png" },
	"rhodotus": 		{ rarity: 1.0, matter: 'fungus', isFungus: true, isEdible: true, scale: 0.3, img: "mushroom/rhodotus.png" },
};




let ItemTypeList = {
	"stuff": {
		mergeWithExistingData: true,
		varieties: StuffVarietyList,
	},
// Plants
	"plant": 	{
		rarity: 		0,
		mayWalk: 		true,
		mayFly: 		true,
		mayPickup: 		false,
		mayHarvest: 	true,
		harvestReps:	1,
		rechargeTime: 	40,
		name: 			'{state} {variety}',
		properNoun: 	true,
		growing:		false,
		state: 			'wilted',
		states: 		{ wilted: { growing: false }, thriving: { growing: true } },
		varieties: 		PlantVarietyList,
		matter: 		'plant',
		isPlant:		true,
		sign: 			"",
		signLack: 		"This plant needs more light to grow.",
		signFine: 		"This plant is growing well.",
		signMature: 	"This plant is ready to harvest.",
		icon: 			'/gui/icons/plant.png',
		imgChooseFn: 	self => self.growing ? self.variety.img : self.imgChoices.wilted.img,
		imgChoices: 	{ wilted: { img: 'plant/wilted.png' } },
	},
// Mushrooms
	"mushroom": 	{
		rarity: 		0,
		mayWalk: 		true,
		mayFly: 		true,
		mayPickup: 		false,
		mayHarvest: 	true,
		harvestReps:	1,
		rechargeTime: 	400,
		name: 			'{variety}',
		varieties: 		MushroomVarietyList,
		matter: 		'fungus',
		isMushroom:		true,
		icon: 			'/gui/icons/plant.png',
	},
// Seeds for plants and mushrooms
	"seed": {
		rarity: 		0.1,
		isTreasure:		true,
		isSeed:			true,
		mayWalk: 		true,
		mayFly: 		true,
		mayPickup: 		true,
		name: 			'{variety}',
		varieties: 		SeedVarietyList,
		icon: 			'/gui/icons/plant.png',
		img:			"plant/seed.png"
	}
}

ItemTypeList.plant.onPutInWorld = function() {
	this.resetRecharge();
}

ItemTypeList.plant.rechargeCriteria = function() {
	return this.owner && this.owner.isMap && this.owner.getLightAt(this.x,this.y) >= this.needLight;
}

ItemTypeList.plant.onTickRound = function() {
	let pct = this.rechargePercent();
	this.scale = 0.1+(0.9*pct);
	this.spriteSetMember('scale',this.scale);

	if( this.isRecharged() ) {
		this.sign = this.signMature;
		return;
	}
	let hasLight = this.rechargeCriteria.call(this);
	let newState = hasLight ? 'thriving' : 'wilted';
	if( this.state !== newState ) {
		this.stateCounter = (this.stateCounter||0)+1;
		if( this.stateCounter >= 20 ) {
			this.setState( newState );
		}
	}
	else {
		this.stateCounter = 0;
	}

	this.sign = this.growing ? this.signFine : this.signLack;
}

ItemTypeList.mushroom.onTickRound = function() {
	let pct = this.rechargePercent();
	this.scale = 0.1+(0.9*pct);
	this.spriteSetMember('scale',this.scale);
}

MushroomVarietyList.amanitaMushroom.isProblem = function(entity,self) {
	if( entity.mindset('harvest') ) {
		return Problem.MILD;
	}
	return Problem.NONE;
}


MushroomVarietyList.blurellaMushroom.onHarvest = function(harvester,item) {
}

// amanitaMushroom
//	"blurellaMushroom":
//	"coxilliaMushroom":
//	"grollotusMushroom":
//	"klinulusMushroom":
//	"rhodotusMushroom":


ItemTypeList.mushroom.onHarvest = function(harvester,item) {
	if( !item.effectOnHarvest || !harvester.mustBreathe() ) {
		return;
	}
	effectApply(item.effectOnHarvest,harvester,item);
}

let PlaceTypeList = {
	mushrooms:{
		map:
`
..m.m
m..m.
..m.m
mm.m.
m.m..
`,
		flags: { rotate: true },
		symbols: {
			m: 'mushroom',
		}
	}
}

Object.assign(plugin,{
	ItemTypeList: ItemTypeList,
	PlaceTypeList: PlaceTypeList
});


Plugin.Manager.register( plugin );

return {
}

});

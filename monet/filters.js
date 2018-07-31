let decorWall  = { normalize: false, brightness: -0.3, outline: false };
let decorFloor = { brightness: -0.6, contrast: -0.3, outline: false };

FilterSpec = {
	"mon/solarCenturion.png": 		{ shadow: { yRatio: 0.3 }, edgeFade: 2 },
	"mon/playerThick.png": 			{ outline: { thickness: 4 } },
	"mon/demon/daispine.png": 		{},
	"mon/demon/daikay.png": 		{ flying: 1 },
	"mon/demon/daimaul.png": 		{ glow: '#fafa00E0' },
	"mon/demon/dailectra.png": 		{ shadow: false },
	"mon/demon/daishulk.png": 		{ shadow: { yRatio: 0.4, xRatio: 0.3 } },
	"mon/demon/daiskorsh.png": 		{ outline: false, shadow: false, edgeFade: 4 },
	"mon/demon/daisteria.png": 		{ brightness: -0.5, shadow: false },
	"mon/demon/daifury.png": 		{ shadow: false },
	"mon/demon/daiphant.png": 		{ brightness: 0.2, normalize: false, shadow: false },
	"mon/demon/daifahng.png": 		{ normalize: false, brightness: 0 },
	"mon/shade.png": 				{ normalize: false, brightness: 0, outline: false, shadow: false },
	"mon/earth/goblin.png": 		{ normalize: false, brightness: 0 },
	"mon/earth/goblinPriest.png":   { normalize: false, brightness: 0 },
	"mon/human/solarPriest.png": 	{ strip: 0xA0 },
	"item/stuff/darkLantern.png": 	{ shadow: { xRatio: 0.8 } },
	"item/solariumBlade.png": 		{ normalize: false },
	"decor/brazierLit.png": 		{ normalize: false, outline: false, brightness: 0.01 },
	"decor/brazierUnLit.png": 		{ normalize: false, },
	"decor/boulder1.png": 			decorWall,
	"decor/boulder2.png": 			decorWall,
	"decor/boulder3.png": 			decorWall,
	"decor/boulder4.png": 			decorWall,
	"decor/jagged1.png": 			decorWall,
	"decor/jagged2.png": 			decorWall,
	"decor/jagged3.png": 			decorWall,
	"decor/jagged4.png": 			decorWall,
	"decor/floorFancyTile.png": 	decorFloor,
	"decor/floorSandstone.png": 	decorFloor,
	"decor/floorSandstoneChunky.png": decorFloor,
	"decor/floorDirt.png": 			{ normalize: false, brightness: -0.6, desaturate: 0.2 },
	"decor/floorSlate.png": 		decorFloor,
	"effect/arrowInFlight.png": 	{ shadow: false },
	"effect/dartInFlight.png": 		{ shadow: false },
	"effect/lightRayCircle.png": 	{ normalize: false, shadow: false, outline: false },
	"effect/fire.png": 				{ normalize: false, shadow: false, outline: false, brightness: 0.01 },
}

DirSpec = {
	"mon/": true,
	"item/": true,
	"decor/": true,
	"effect/": true,
}

FilterDefault = {
	normalize: true,
	brightness: -0.3,
	contrast: 0,
	shadow: {
		threshold: 0x20,
		flying: false,
		xRatio: 0.7,
		yRatio: 0.7,
		color: '#000000D0'
	},
	outline: {
		thickness: 2,
		threshold: 0x20,
		color: '#000000FF'
	},
};

// To test one of these filters, visit
// http://localhost:3010/tiles/{stemBelow}

/*
Options:
size						- the x,y size for the final processed image
normalize: false			- auto-adjust the image brightness and contrast
brightness: 0.0				- Adjust the brightness plus or minus
contrast: 0					- Adjust the contrast up or down
desaturate: 0				- Desaturates the image, from 0.0 to 1.0 

flying: 0					- 1 means appear as if flying by placing the shadow as low as possible.
glow: null					- A color to make the thing glow. Nullifies shadow and outline.
strip: null					- Remove all translucency less opaque than this. Cleans up speckles.
sweep: fn					- Process every single pixel, returning a color to change it to, or null if no change needed
edgeFade: 0					- Fade the edges of the image N pixels deep to remove hard pixel edges. Default = 0

shadow: false				- do not add the default shadow. Defaults to not false.
shadow.xRatio: 0.7			- Cast the shadow this % to the right
shadow.yRatio: 0.7			- Case the shadow this % below
shadow.color: '#000000D0'	- Color of the shadow to generate, typicaly black with slight translucency

outline.thickness: 2		- How thick you want the black outline
outline.threshold: 0x20		- Only outline things with this level or transparency or bolder
outline.color: '#000000FF'	- Color of the outline
*/

let decorWall  = { normalize: false, brightness: -0.3, outline: false };
let decorFloor = { brightness: -0.6, contrast: -0.3, outline: false };
let killWhite  = (r,g,b,a)=>r>0xC0 && g>0xC0 && b>0xC0 ? 0x00000000 : null;

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
	"mon/human/solarPriest2.png": 	{ strip: 0xA0 },
	"mon/human/solarPriest3.png": 	{ strip: 0xA0 },
	"mon/human/soldier.png": 		{ strip: 0xA0, normalize: 1, brightness: 0.06 },
	"item/stuff/darkLantern.png": 	{ shadow: { xRatio: 0.8 } },
	"item/stuff/solarOrb.png": 		{ shadow: false, outline: false },
	"item/solariumBlade.png": 		{ normalize: false },
	"item/weapon/dagger.png": 		{ normalize: false },
	"item/weapon/hammer.png":		{ sweepFn: killWhite, edgeFade:3, url: 'https://images-na.ssl-images-amazon.com/images/I/61uKosIDaSL._AC_SX425_.jpg' },
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
	"mon/": {
		size: 192
	},
	"item/": {
		size: 96
	},
	"decor/": {
		size: 96
	},
	"effect/":  {
		size: 96
	},
	"plant/":  {
		size: 96
	},
	"mushroom/":  {
		size: 96
	},
}

FilterDefault = {
	sweepFn: null,
	normalize: false,
	brightness: 0.0,
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

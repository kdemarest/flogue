// To test one of these filters, visit
// http://localhost:3010/tiles/{stemBelow}

/*
Options:
size						- the x,y size for the final processed image
url							- a source URL to pull this thing from, when not already cached

resize: true				- turn this off if you need to make sure that multiple frames of an image must stay aligned
autocrop: 0.0				- shrinks the edges down to only pixels <strip> alpha or above. Set false to not autocrop.

normalize: false			- auto-adjust the image brightness and contrast
brightness: 0.0				- Adjust the brightness plus or minus
contrast: 0					- Adjust the contrast up or down
desaturate: 0				- Desaturates the image, from 0.0 to 1.0 
ungradient: null			- Removes a background gradient. 0x20 is common
despeckle: null				- Removes singleton dots from the image. despeckle: 3 does 3 passes

flying: 0					- 1 means appear as if flying by placing the shadow as low as possible.
glow: null					- A color to make the thing glow. Nullifies shadow and outline.
strip: null					- Remove all translucency less opaque than this. Cleans up speckles.
sweep: fn					- Process every single pixel, returning a color to change it to, or null if no change needed
edgeFade: 0					- Fade the edges of the image N pixels deep, where N is a decimal percentage of image width, to remove hard pixel edges. Default = 0

bgFlood.find				- find pixels of this color
bgFlood.remove				- and then floodfill with this color and remove all found
bgFlood.percent				- but only if we found this percentage of the image in points.
bgFlood.color: 0x00000000	- what color to fill with

shadow: false				- do not add the default shadow. Defaults to not false.
shadow.xRatio: 0.7			- Cast the shadow this % to the right
shadow.yRatio: 0.7			- Case the shadow this % below
shadow.color: '#000000D0'	- Color of the shadow to generate, typicaly black with slight translucency

outline.thickness: 0.03		- How thick you want the black outline, as a percentage of width
outline.threshold: 0x20		- Only outline things with this level or transparency or bolder
outline.color: '#000000FF'	- Color of the outline
*/

let terrainWall  = { normalize: false, brightness: -0.3 };
let terrainFloor = { brightness: -0.6 };

FilterSpec = {
	"mon/solarCenturion.png": 		{ shadow: { yRatio: 0.3 }, edgeFade: 0.03 },
	"mon/demon/daibelade.png": 		{ strip: 0xA0, contrast: 0.4 },
	"mon/demon/daispine.png": 		{},
	"mon/demon/daikay.png": 		{ flying: 1 },
	"mon/demon/daimaul.png": 		{ glow: '#fafa00E0' },
	"mon/demon/dailectra.png": 		{ shadow: false },
	"mon/demon/daishulk.png": 		{ shadow: { yRatio: 0.4, xRatio: 0.3 } },
	"mon/demon/daiskorsh.png": 		{ outline: false, shadow: false, edgeFade: 0.03 },
	"mon/demon/daisteria.png": 		{ brightness: -0.5, shadow: false },
	"mon/demon/daifury.png": 		{ shadow: false },
	"mon/demon/daiphant.png": 		{ brightness: 0.2, normalize: false, shadow: false },
	"mon/demon/daifahng.png": 		{ normalize: false, brightness: 0 },
	"mon/shade.png": 				{ normalize: false, brightness: 0, outline: false, shadow: false },
	"mon/earth/goblin.png": 		{ normalize: false, brightness: 0 },
	"mon/earth/goblinPriest.png":   { normalize: false, brightness: 0 },
	"mon/insect/centipede.png":		{ ungradient: 0x10, shadow:false, recolor: { apply: 'spin', params: [180] }, url: 'https://gamespot1.cbsistatic.com/uploads/scale_super/1552/15524586/2945271-fortress_enemies_centipede_v1_white.jpg' },
	"mon/human/solarPriest.png": 	{ strip: 0xA0 },
	"mon/human/solarPriest2.png": 	{ strip: 0xA0 },
	"mon/human/solarPriest3.png": 	{ strip: 0xA0 },
	"mon/human/soldier.png": 		{ strip: 0xA0, normalize: 1, brightness: 0.06 },
	"mon/dwarf/dwarfWarrior.png":	{ ungradient: 0x20, despeckle: 3, brightness: 0.05, contrast: 0.3, desaturate:-0.5,edgeFade: 0.03, shadow:false, url: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/8eccb115-fdb3-4d95-9b2e-5653ada13056/d8ias6v-25a4b47d-8b37-4690-bdf6-ce5c69f140f0.jpg/v1/fill/w_1280,h_1426,q_75,strp/dwarf_warrior_for_dragonheim_rpg_by_ortizfreelance_d8ias6v-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTQyNiIsInBhdGgiOiJcL2ZcLzhlY2NiMTE1LWZkYjMtNGQ5NS05YjJlLTU2NTNhZGExMzA1NlwvZDhpYXM2di0yNWE0YjQ3ZC04YjM3LTQ2OTAtYmRmNi1jZTVjNjlmMTQwZjAuanBnIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.eo3JdQwanjjgpTlireObu11SFr2HHgPLkmRlZuP2qCM" },
	"mon/corpse.png":				{ bgRemove: {find:0,remove:10,percent:0.002}, recolor: {apply:'red',params:[90]}, edgeFade:0.03, url: 'https://cdn.mos.cms.futurecdn.net/u8wSHMmMMXzZuAFBCmcsCK.jpg' },
	"item/stuff/darkLantern.png": 	{ shadow: { xRatio: 0.8 } },
	"item/stuff/solarOrb.png": 		{ shadow: false, outline: false },
	"item/solariumBlade.png": 		{ normalize: false },
	"item/weapon/dagger.png": 		{ normalize: false },
	"item/weapon/hammer.png":		{ bgRemove: {find:0,remove:10}, despeckle: 1, edgeFade:0.03, url: 'https://images-na.ssl-images-amazon.com/images/I/61uKosIDaSL._AC_SX425_.jpg' },
	"decor/brazierLit.png": 		{ resize: false, autocrop: false, normalize: false, outline: false, brightness: 0.01 },
	"decor/brazierUnlit.png": 		{ resize: false, autocrop: false, normalize: false, },
	"terrain/boulder1.png": 		terrainWall,
	"terrain/boulder2.png": 		terrainWall,
	"terrain/boulder3.png": 		terrainWall,
	"terrain/boulder4.png": 		terrainWall,
	"terrain/jagged1.png": 			terrainWall,
	"terrain/jagged2.png": 			terrainWall,
	"terrain/jagged3.png": 			terrainWall,
	"terrain/jagged4.png": 			terrainWall,
	"terrain/floorFancyTile.png": 	terrainFloor,
	"terrain/floorSandstone.png": 	terrainFloor,
	"terrain/floorSandstoneChunky.png": terrainFloor,
	"terrain/floorDirt.png": 		{ normalize: false, brightness: -0.6, desaturate: 0.2 },
	"terrain/floorSlate.png": 		terrainFloor,
	"effect/arrowInFlight.png": 	{ shadow: false },
	"effect/dartInFlight.png": 		{ shadow: false },
	"effect/lightRayCircle.png": 	{ normalize: false, shadow: false, outline: false },
	"effect/fire.png": 				{ normalize: false, shadow: false, outline: false, brightness: 0.01 },
	"effect/portal.png":			{ autocrop: false, normalize: false, shadow: false, outline: false },
	"decor/water.png":				{ shadow: false, outline: false, normalize: false, brightness: -0.6, url: 'https://i.pinimg.com/originals/26/e3/2d/26e32d921f8820b4e459d27888276d4a.jpg' },
}

DirSpec = {
	"gui/": {
		autocrop: false,
		resize: false,
		despeckle: false,
		normalize: false,
		size: false,
		shadow: false,
		outline: false,
	},
	"mon/": {
		size: 192
	},
	"item/potion": {
		size: 96,
		shadow: false,
		outline: false,
	},
	"item/armor": {
		size: 96,
	},
	"item/": {
		edgeFade: 0.01,
		size: 96
	},
	"decor/": {
		size: 96
	},
	"portal/": {
		size: 96,
		shadow: false,
		outline: false,
	},
	"effect/":  {
		size: 96
	},
	"ore/": {
		size: 96,
		shadow: false,
		outline: false,
	},
	"plant/":  {
		size: 96
	},
	"mushroom/":  {
		size: 96
	},
	"part/":  {
		size: 96,
		shadow: false,
		threshold: 0x20,
		edgeFade: 0.01,
	},
	"terrain/": {
		size: 96,
		shadow: false,
		outline: false,
	},
}

PortraitImport = {
	size: 384,
	quality: 92,
	tempFile: 'portraitTemp.jpg',
	extension: '.jpg'
}

FilterDefault = {
	autocrop: 0.0,
	resize: true,
	despeckle: 1,
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
		thickness: 0.03,
		threshold: 0x20,
		color: '#000000FF',
		antialias: true
	},
};

(function() {
let PlaceList = {};

/*
PlaceList.uniqueIdentity = {
	map:
`
.......
`,
	symbols: {
	},
	stickers: {
	},
	tileTypes: {
	},
	itemTypes: {
	},
	monsterTypes: {
	},
	onEntityCreate: {
	}
};
*/

PlaceList.goblinGathering = {
	map:
`
.......
.x.P.x.
...A...
..ggg..
.......
`,
	flags: { rotate: true },
	symbols: {
		A: 'goblinAltar',
		P: 'goblinPriest',
		x: 'brazier'
	},
	stickers: {
		darkPower: { img: "effect/bolt08.png", scale: 0.6, xAnchor: 0.5, yAnchor: 0.5 }
	},
	tileTypes: {
	},
	itemTypes: {
		goblinAltar: { mayWalk: false, mayFly: false, name: "goblin altar", rechargeTime: 4, img: "dc-dngn/altars/dngn_altar_jiyva01.png" }
	},
	monsterTypes: {
		goblinPriest: { basis: 'goblin', damage: '2d6+2', damageType: DamageType.ROT, isGoblin: true,
						attitude: Attitude.WORSHIP, shout: 'Death to all heretic overworld invaders!',
						img: "dc-mon/gnoll.png" }
	},
	onEntityCreate: {
		goblin: { attitude: Attitude.WORSHIP }
	}
};

PlaceList.goblinGathering.itemTypes.goblinAltar.onTick = function(dt,map,entityList) {
	if( !this.rechargeLeft ) {
		let f = new Finder(entityList).filter(e=>e.isGoblin && e.health<e.healthMax).near(this.x,this.y,6);
		if( f.count ) {
			let entity = pick(f.all);
			entity.takeHealing(this,rollDice('1d4'),DamageType.ROT,true);
			tell( mSubject,this,' ',mVerb,'imbue',' ',mObject,entity,' with dark power.');
			animationAdd( new AniPaste({
				entity: entity, xOfs: 0.5, yOfs: 0.5,
				sticker: StickerList.darkPower,
				x: this.x,
				y: this.y,
				duration: 0.8
			}));
			animationAdd( new AniPaste({
				entity: entity, xOfs: 0.5, yOfs: 0.5,
				sticker: StickerList.darkPower,
				x: entity.x,
				y: entity.y,
				duration: 0.8
			}));
			this.rechargeLeft = this.rechargeTime;
		}
	}
	this.glow = !this.rechargeLeft;
	this.light = this.rechargeLeft ? 0 : 4;
}


PlaceList.circle = {
	map:
`
..xxx..
.xxxxx.
xx...xx
xx.....
xx...xx
.xxxxx.
..xxx..
`,
	flags: { rotate: true },
	symbols: {
		x: function() { return pick(['pit','fire','water','mist','mud','forcefield']); }
	}
}


	// Export the placelist.
	window.loadPlaceList = () => PlaceList;
})();

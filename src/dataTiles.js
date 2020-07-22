Module.add('dataTiles',function(){

let TileTypeList = Type.establish( 'TileType', {
	typeIdUnique:	true,
	useSymbols:		true,
	defaults: {
		isTileType: true
	}
});

const ImgBridges = {
	NS: { img: "dc-dngn/bridgeNS.png" },
	EW: { img: "dc-dngn/bridgeEW.png" }
}

// Tile Events
// onTouch - fires each round a monster is standing on a tile. Also fires when you WAIT or LOSE TURN upon a tile.
// onBump - fires when you bonk into a non-passable tile.
// onDepart - fires every single time you leave this tile, whether you're heading into another similar tile or not
//				return false to stop the movement.
// onDepartType - fires when you are leaving this tile type, like stepping out of fire or mud or water.
//				return false to stop the movement.
// onEnterType - if you are entering a tile type from another tile NOT of the same type.
//				return false to stop the movement.

let WallRand = new class {
	constructor() {
		this.randList = [];
		for( let i=0 ; i<256 ; ++i ) {
			this.randList.push( Random.True.intRange( 0, 1023 ) );
		}
	}
	numSeed(x,y) {
		if( x===undefined ) return 0;
		x = Math.toTile(x);
		y = Math.toTile(y);
		return this.randList[x&0xFF]+7+this.randList[y&0xFF];
	}
};

let CaveWallImgChooseFn = self => {
	// Would be a lot better to pre-calculate this.
	let num = WallRand.numSeed(self.x,self.y)%4;
	return self.imgChoices[num].img
}

Type.register('TileType',{
	"floorCave":  { mayWalk: true,  mayFly: true,  opacity: 0, name: "cave floor",
					img: "terrain/floorSlate.png",
					isFloor: true },
	"floorDirt":  { mayWalk: true,  mayFly: true,  opacity: 0, name: "dirt floor",
					img: "terrain/floorDirt.png",
					isFloor: true },
	"floorSlate":  { mayWalk: true,  mayFly: true,  opacity: 0, name: "slate floor",
					img: "terrain/floorSlate.png",
					isFloor: true },
	"floorStone":  { mayWalk: true,  mayFly: true,  opacity: 0, name: "stone floor",
					img: "dc-dngn/floor/rect_gray1.png", isFloor: true
					},
	"wallCave":   { mayWalk: false, mayFly: false, opacity: 1, name: "cave wall", 
					addFloor: true,
					imgChoices: {
						0: { img: "terrain/boulder1.png" },
						1: { img: "terrain/boulder2.png" },
						2: { img: "terrain/boulder3.png" },
						3: { img: "terrain/boulder4.png" },
					},
					imgChooseFn: CaveWallImgChooseFn,
					isWall: true
				},
	"wallJagged":   { mayWalk: false, mayFly: false, opacity: 1, name: "jagged wall", 
					addFloor: true,
					imgChoices: {
						0: { img: "terrain/jagged1.png" },
						1: { img: "terrain/jagged2.png" },
						2: { img: "terrain/jagged3.png" },
						3: { img: "terrain/jagged4.png" },
					},
					imgChooseFn: CaveWallImgChooseFn,
					isWall: true,
					scale: 0.7 },
	"wallStone":   { mayWalk: false, mayFly: false, opacity: 1, name: "tile stone wall",
					img: "dc-dngn/floor/pedestal_full.png", isWall: true, wantsDoor: true
					},
	"pit": {
		symbol: ':',
		mayWalk: true,
		mayFly: true,
		opacity: 0,
		noScent: true,
		name: "pit",
		mayJump: true,
		isPit: true,
		// NOTE! Technically the pit isRemovable when you build bridges with a hammer. But
		// that is for another day.
		wantsBridge: true,
		img: "terrain/pit.png"
	},
	"bridge": {
		mayWalk: true,
		mayFly: true,
		opacity: 0,
		name: "bridge",
		isBridge: true,
		// NOTE! Although the bridge isRemovable doing so turns it into PIT, and the isRemovable
		// flag only means "can be removed in such a way as to be walked upon later.
		img: "dc-dngn/bridgeNS.png",
		imgChoices: ImgBridges,
		imgChooseFn: self => self.img	// the image will be custom altered among the choices
	},
	"water": {
		symbol: '~',
		mayWalk: true,
		mayFly: true,
		maySwim: true,
		noScent: true,
		isWater: true,
		opacity: 0,
		mayJump: true,
		wantsBridge: true,
		name: "water",
		img: "decor/water.png"
	},
	"grass": {
		mayWalk: true,
		mayFly: true,
		opacity: 0,
		name: "grass",
		img: "dc-dngn/floor/grass/grass_flowers_blue1.png",
		isFloor: true
	},
	"glass": {
		mayWalk: false,
		mayFly: false,
		opacity: 0,
		name: "glass",
		img: "dc-dngn/wall/dngn_mirrored_wall.png",
		isWall: true
	},
	"shaft": {
		mayWalk: false,
		mayFly: true,
		opacity: 0,
		noScent: true,
		name: "shaft",
		mayJump: true,
		addFloor: true,
		img: "terrain/shaft.png"
	},
	"flames": {
		mayWalk: true,
		mayFly: true,
		opacity: 0.26,
		damageType: DamageType.BURN,
		noScent: true,
		isFire: true,
		addFloor: true,
		name: "flames",
		light: 7,			// NOTE! Must be under the demon-harming light threshold.
		glow: 1,
		effect: {
			op: 'damage',
			xDamage: 4.0,
			damageType: DamageType.BURN,
			duration: 0,
			icon: 'gui/icons/eBurn.png'
		},
		img: "effect/fire.png"
	},
	"lava": {
		mayWalk: true,
		mayFly: true,
		maySwim: true,
		noScent: true,
		opacity: 0,
		damageType: DamageType.BURN,
		isFire: true,
		mayJump: true,
		name: "lava",
		light: 5,
		glow: 1,
		effect: {
			op: 'damage',
			xDamage: 8.0,
			damageType: DamageType.BURN,
			duration: 0,
			icon: 'gui/icons/eBurn.png'
		},
		img: "terrain/floorLava.png"
	},
	"mist": {
		mayWalk: true,
		mayFly: true,
		opacity: 0.34,
		name: "mist",
		zOrder: Tile.zOrder.MIST,
		addFloor: true,
		img: "effect/smoke.png",
		layer: 3
	},
	"mud": {
		mayWalk: true,
		mayFly: true,
		opacity: 0,
		noScent: true,
		mayJump: true,
		name: "mud",
		img: "terrain/floorMud.png"
	},
	"ghostStone": {
		mayWalk: false,
		mayFly: false,
		opacity: 0,
		name: "ghost stone",
		addFloor: true,
		img: "terrain/ghostStone.png",
		effect: {
			op: 'set',
			stat: 'invisible',
			value: true
		}
	},
	"obelisk": {
		mayWalk: false,
		mayFly: false,
		opacity: 0,
		name: "obsidian obelisk",
		addFloor: true,
		img: "terrain/obelisk.png",
		effect: {
			op: 'set',
			stat: 'senseBlind',
			value: true
		}
	},
	"crystal": {
		mayWalk: false,
		mayFly: false,
		opacity: 0,
		name: "shimmering crystal",
		glow: 1,
		addFloor: true,
		img: "terrain/crystal.png",
		effect: {
			op: 'add',
			stat: 'speed',
			value: 3
		}
	},
	"forcefield": {
		mayWalk: true,
		mayFly: true,
		opacity: 1,
		name: "force field",
		light: 3,
		glow: 1,
		addFloor: true,
		img: "terrain/forcefield.png"
	},
});



TileTypeList.obelisk.onBump = function(toucher,self) {
	if( !toucher.senseBlind ) {
		tell(mSubject,toucher,' ',mVerb,'touch',' ',mObject,self,'.');
		effectApply( self.effect, toucher, null, self, 'bump' );
	}
	else {
		tell(mSubject,toucher,' ',mVerb,'touch',' ',mObject,self,' but ',mVerb,'are',' already blind.');
	}
}

TileTypeList.crystal.onBump = function(entity,self) {
	if( entity.speed <= 1 ) {
		tell(mSubject,entity,' ',mVerb,'touch',' ',mObject,self,' and ',mSubject|mVerb,'blur',' with speed!');
		effectApply( self.effect, toucher, null, self, 'bump' );
	}
	else {
		tell( mSubject,entity,' ',mVerb,'touch',' ',mObject,self,', but ',mVerb,'are',' already moving fast.');
	}
}

TileTypeList.pit.isProblem = function(entity,self) {
	if( entity.travelMode == 'walk' ) {
		// This is a temporary fix to the problem that dogs that can jump are allowed to enter
		// pit squares but might actually have no viable path out...
		return Problem.DEATH;
	}
	if( entity.travelMode == 'walk' && (!entity.jumpMax || entity.jumpLeft) ) {
		return Problem.DEATH;
	}
	if( entity.travelMode == 'walk' && entity.attitude !== Attitude.AGGRESSIVE ) {
		return Problem.MILD;
	}
	return Problem.NONE;
}


TileTypeList.pit.onTouch = function(entity,self) {
	if( entity.travelMode == "walk" && !entity.jumpLeft ) {
		tell(mSubject|mCares,entity,' ',mVerb,'are',' at the edge of ',mObject,self);
	}
}

TileTypeList.flames.onEnterType = function(entity,self) {
	tell( mSubject|mCares,entity,' ',mVerb,'enter',' ',mObject,self,'.' );
}

TileTypeList.flames.onDepartType = function(entity,self) {
	tell( mSubject|mCares,entity,' ',mVerb,'leave',' ',mObject,self,'.' );
}

TileTypeList.flames.getDamage = function(toucher,self) {
	return value
}

// TouchDamage
// To use this convenience function, assign your type a damageType and optionally an xDamage
// and those will be used automagically. 
// NOTE: We need to turn this into a 'bundle', so that post-processing can assign everything
// automatically, like Object.each( BundleType[this.bundle], (value,key) => this[key] = value );
//
let TouchDamage = {
	isProblem: function(entity,self) {
		if( entity.isImmune(self.damageType || (self.effect ? self.effect.damageType : null)) ) {
			return Problem.NONE;
		}
		let xDamage = xCalc(self,self,'xDamage','*');
		let damage = Math.max(1,Math.floor(Rules.pickDamage(entity.area.depth,self.rechargeTime) * xDamage))
		let ratio = damage/entity.health;
		if( ratio <= 0.3 ) return Problem.MILD;
		if( ratio <= 0.7 ) return Problem.HARSH;
		return Problem.DEATH;
	},
	onTouch: function(toucher,self) {
		// We could pass in an onDamage that would also catch you on fire...
		let xDamage = xCalc(self,self,'xDamage','*');
		let damageType = self.damageType || (self.effect ? self.effect.damageType : DamageType.BURN);
		let effectDefault = {
			op: 'damage',
			damageType: damageType,
			duration: 0,
			icon: StickerList[damageType+'Icon'].img
		};
		let effect = Object.assign( {}, self.effect || effectDefault, { xDamage: xDamage } );
		effect = new Effect( toucher.area.depth, effect, self );
		// This used to pass source=null, but then the cause of damage couldn't be attributed...
		effectApply( effect, toucher, self, self, 'touch' );
	},
	onTouchWalk: function(toucher,self) {
		if( toucher.travelMode != "walk" || toucher.jumpLeft ) {
			return;
		}
		return TouchDamage.onTouch(toucher,self);
	}

};

TileTypeList.flames.isProblem 	= TouchDamage.isProblem;
TileTypeList.flames.onTouch 	= TouchDamage.onTouch;

TileTypeList.lava.onEnterType = function(entity,self) {
	tell( mSubject|mCares,entity,' ',mVerb,'enter',' ',mObject,self,'.' );
}

TileTypeList.lava.onDepartType = function(entity,self) {
	tell( mSubject|mCares,entity,' ',mVerb,'leave',' ',mObject,self,'.' );
}

TileTypeList.lava.isProblem = TouchDamage.isProblem;
TileTypeList.lava.onTouch 	= TouchDamage.onTouchWalk;

TileTypeList.mud.isProblem = function(entity,self) {
	if( !entity.isImmune(self.typeId) && entity.travelMode == "walk" ) {
		return Problem.HARSH;
	}
	return Problem.NONE;
}

TileTypeList.mud.onEnterType = function(entity,self) {
	if( entity.travelMode == "walk" && !entity.jumpLeft ) {
		tell( mSubject|mCares,entity,' ',mVerb,'enter',' ',mObject,self,'.' );
	}
}

TileTypeList.mud.onDepartType = function(entity,self) {
	if( entity.travelMode == "walk" && !entity.jumpLeft ) {
		tell( mSubject|mCares,entity,' ',mVerb,'escape',' ',mObject,self,'.' );
	}
}

TileTypeList.mud.onDepart = function(entity,self) {
	if( entity.travelMode == "walk" && entity.jumpLeft ) {
		return;
	}

	if( entity.isImmune(self.typeId) || ( entity.isResist(self.typeId) && Random.Pseudo.chance100(50) ) ) {
		return;
	}

	if( entity.travelMode == "walk" && !entity.mudded ) {
		entity.mudded = true;
		tell( mSubject|mCares,entity,' ',mVerb,'is',' stuck in the mud.');
		return false;
	}
	entity.mudded = false;
}



TileTypeList.forcefield.onEnterType = function(entity,self) {
	if( entity.isImmune(self.typeId) || ( entity.isResist(self.typeId) && Random.Pseudo.chance100(50) ) ) {
		return;
	}

	if( Random.Pseudo.chance100(70) ) {
		tell( mSubject|mCares,entity,' ',mVerb,'is',' stopped by the ',mObject,self,'.' );
		return false;
	}
}

TileTypeList.ghostStone.onBump = function(toucher,self) {
	if( !toucher.invisible ) {
		tell( mSubject,toucher,' ',mVerb,['touch','touches'],' ',mObject,self,'.' );
		effectApply( this.effect, toucher, null, self, 'bump' );
	}
	else {
		tell( mSubject,toucher,' ',mVerb,'touch',' ',mObject,self,', but ',mVerb,'are',' already invisible.');
	}
}


TileTypeList.bridge.imgDetermine = function(map,x,y) {
	let w = map.tileTypeGet(x-1,y);
	let e = map.tileTypeGet(x+1,y);
	let n = map.tileTypeGet(x,y-1);
	let s = map.tileTypeGet(x,y+1);
	if( w.isPit && e.isPit ) {
		this.img = this.imgChoices.NS.img;
		return;
	}
	this.img = this.imgChoices.EW.img;
}


return {
	TileTypeList: TileTypeList,
	TouchDamage: TouchDamage
}

});
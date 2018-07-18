Module.add('dataTiles',function(){

const ImgBridges = {
	NS: { img: "dc-dngn/bridgeNS.png" },
	EW: { img: "dc-dngn/bridgeEW.png" }
}


const TileTypeList = {
	"floorCave":  { symbol: SYM, mayWalk: true,  mayFly: true,  opacity: 0, name: "cave floor",
					img: "decor/floorSlate.png",
					isFloor: true },
	"floorDirt":  { symbol: SYM, mayWalk: true,  mayFly: true,  opacity: 0, name: "dirt floor",
					img: "decor/floorDirt.png",
					isFloor: true },
	"floorSlate":  { symbol: SYM, mayWalk: true,  mayFly: true,  opacity: 0, name: "slate floor",
					img: "decor/floorSlate.png",
					isFloor: true },
	"floorStone":  { symbol: SYM, mayWalk: true,  mayFly: true,  opacity: 0, name: "stone floor",
					img: "dc-dngn/floor/rect_gray1.png", isFloor: true
					},
	"wallCave":   { symbol: SYM, mayWalk: false, mayFly: false, opacity: 1, name: "cave wall", 
					addFloor: true,
					imgChoices: {
						0: { img: "decor/boulder1.png" },
						1: { img: "decor/boulder2.png" },
						2: { img: "decor/boulder3.png" },
						3: { img: "decor/boulder4.png" },
					},
					imgGet: (self,img,num) => img || self.imgChoices[num%4].img, isWall: true },
	"wallJagged":   { symbol: SYM, mayWalk: false, mayFly: false, opacity: 1, name: "jagged wall", 
					addFloor: true,
					imgChoices: {
						0: { img: "decor/jagged1.png" },
						1: { img: "decor/jagged2.png" },
						2: { img: "decor/jagged3.png" },
						3: { img: "decor/jagged4.png" },
					},
					imgGet: (self,img,num) => img || self.imgChoices[num%4].img, isWall: true, scale: 0.7 },
	"wallStone":   { symbol: SYM, mayWalk: false, mayFly: false, opacity: 1, name: "tile stone wall",
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
		img: "dc-dngn/pit.png"
	},
	"bridge": {
		symbol: SYM,
		mayWalk: true,
		mayFly: true,
		opacity: 0,
		name: "bridge",
		isBridge: true,
		// NOTE! Although the bridge isRemovable doing so turns it into PIT, and the isRemovable
		// flag only means "can be removed in such a way as to be walked upon later.
		img: "dc-dngn/bridgeNS.png",
		imgChoices: ImgBridges,
		imgGet: (self, img) => img || self.img
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
		img: "dc-dngn/water/dngn_shoals_shallow_water1.png"
	},
	"grass": {
		symbol: SYM,
		mayWalk: true,
		mayFly: true,
		opacity: 0,
		name: "grass",
		img: "dc-dngn/floor/grass/grass_flowers_blue1.png",
		isFloor: true
	},
	"glass": {
		symbol: SYM,
		mayWalk: false,
		mayFly: false,
		opacity: 0,
		name: "glass",
		img: "dc-dngn/wall/dngn_mirrored_wall.png",
		isWall: true
	},
	"shaft": {
		symbol: SYM,
		mayWalk: false,
		mayFly: true,
		opacity: 0,
		noScent: true,
		name: "shaft",
		mayJump: true,
		addFloor: true,
		img: "dc-dngn/dngn_trap_shaft.png"
	},
	"flames": {
		symbol: SYM,
		mayWalk: true,
		mayFly: true,
		opacity: 0.26,
		damageType: DamageType.BURN,
		noScent: true,
		isFire: true,
		addFloor: true,
		name: "flames",
		light: 9,
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
		symbol: SYM,
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
		img: "UNUSED/features/dngn_lava.png"
	},
	"mist": {
		symbol: SYM,
		mayWalk: true,
		mayFly: true,
		opacity: 0.34,
		name: "mist",
		zOrder: Tile.zOrder.MIST,
		addFloor: true,
		img: "effect/cloud_grey_smoke.png",
		layer: 3
	},
	"mud": {
		symbol: SYM,
		mayWalk: true,
		mayFly: true,
		opacity: 0,
		noScent: true,
		mayJump: true,
		name: "mud",
		img: "dc-dngn/floor/dirt0.png"
	},
	"ghostStone": {
		symbol: SYM,
		mayWalk: false,
		mayFly: false,
		opacity: 0,
		name: "ghost stone",
		addFloor: true,
		img: "dc-dngn/altars/dngn_altar_vehumet.png",
		effect: {
			op: 'set',
			stat: 'invisible',
			value: true
		}
	},
	"obelisk": {
		symbol: SYM,
		mayWalk: false,
		mayFly: false,
		opacity: 0,
		name: "obsidian obelisk",
		addFloor: true,
		img: "dc-dngn/altars/dngn_altar_sif_muna.png",
		effect: {
			op: 'set',
			stat: 'senseBlind',
			value: true
		}
	},
	"crystal": {
		symbol: SYM,
		mayWalk: false,
		mayFly: false,
		opacity: 0,
		name: "shimmering crystal",
		glow: 1,
		addFloor: true,
		img: "dc-dngn/altars/dngn_altar_beogh.png",
		effect: {
			op: 'add',
			stat: 'speed',
			value: 3
		}
	},
	"forcefield": {
		symbol: SYM,
		mayWalk: true,
		mayFly: true,
		opacity: 1,
		name: "force field",
		light: 3,
		glow: 1,
		addFloor: true,
		img: "spells/air/static_discharge.png"
	},
};



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
	if( entity.travelMode == 'walk' && (!entity.jumpMax || entity.jump>0) ) {
		return Problem.DEATH;
	}
	if( entity.travelMode == 'walk' && entity.attitude !== Attitude.AGGRESSIVE ) {
		return Problem.MILD;
	}
	return Problem.NONE;
}


TileTypeList.pit.onTouch = function(entity,self) {
	if( entity.travelMode == "walk" && !entity.jump ) {
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
		effectApply( effect, toucher, null, self, 'touch' );
	},
	onTouchWalk: function(toucher,self) {
		if( toucher.travelMode != "walk" || toucher.jump ) {
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
	if( entity.travelMode == "walk" && !entity.jump ) {
		tell( mSubject|mCares,entity,' ',mVerb,'enter',' ',mObject,self,'.' );
	}
}

TileTypeList.mud.onDepartType = function(entity,self) {
	if( entity.travelMode == "walk" && !entity.jump ) {
		tell( mSubject|mCares,entity,' ',mVerb,'escape',' ',mObject,self,'.' );
	}
}

TileTypeList.mud.onDepart = function(entity,self) {
	if( entity.travelMode == "walk" && entity.jump ) {
		return;
	}

	if( entity.isImmune(self.typeId) || ( entity.isResist(self.typeId) && Math.chance(50) ) ) {
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
	if( entity.isImmune(self.typeId) || ( entity.isResist(self.typeId) && Math.chance(50) ) ) {
		return;
	}

	if( Math.chance(70) ) {
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


TileTypeList.bridge.imgChoose = function(map,x,y) {
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
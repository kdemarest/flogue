Module.add('animHelpers',function() {

Anim.Duration = {
	untilAllDead: a => a.spritesMade && a.spritesAlive==0,
};

Anim.wCount = 0;
Anim.FloatUp = function(delayId,follow,icon,duration=0.4) {
	++Anim.wCount;
	if( icon !== false ) {
		return new Anim({
			name:		'floatUp',
			follow: 	follow,
			watch:		Anim.wCount==21,
			img: 		icon || StickerList.bloodBlue.img,
			duration: 	0.4,
			delayId: 	delayId,
			onInit: 		a => { a.create(1); },
			onSpriteMake: 	s => { s.sVelTo(0,-1,0.4).sScaleSet(0.75); },
			onSpriteTick: 	s => { s.sMoveRel(s.xVel,s.yVel).sAlpha(1-Math.max(0,(2*s.elapsed/s.duration-1))); }
		});
		Anim.myWatch = false;
	}
}

Anim.Upon = function(delayId,target,icon,duration=0.2,scale=0.75) {
	return new Anim({
		follow: 	target,
		img: 		icon,
		delayId: 	delayId,
		duration: 	duration,
		onInit: 		a => { a.create(1); },
		onSpriteMake: 	s => { s.sScaleSet(scale); },
		onSpriteTick: 	s => { }
	});
}

Anim.Cloud = function(delayId,x,y,area,groupId,icon) {
	return new Anim({
		at:			{ x: x, y: y, area: area },
		groupId: 	groupId,
		alpha: 		0.2,
		img: 		icon,
		deathTime: 	Time.simTime+2,
		delayId: 	delayId,
		duration: 	(self) => Time.simTime >= self.deathTime ? 'die' : '',
		onInit: 		a => { a.create(1); },
		onSpriteMake: 	s => { s.sScaleSet(0.75); },
		onSpriteTick: 	s => { }
	});
}

Anim.At = function(delayId,x,y,area,icon) {
	return new Anim({
		at:			{ x: x, y: y, area: area },
		img: 		icon,
		delayId: 	delayId,
		duration: 	0.2,
		onInit: 		a => { a.create(1); },
		onSpriteMake: 	s => { s.sScaleSet(0.75); },
		onSpriteTick: 	s => { }
	});
}

Anim.Above = function(delayId,target,icon) {
	return new Anim({
		follow: 	target,
		img: 		icon,
		delayId: 	delayId,
		duration: 	0.2,
		onInit: 		a => { a.create(1); },
		onSpriteMake: 	s => { s.sScaleSet(0.75).sPosRel(0,-1); },
		onSpriteTick: 	s => { }
	});
}

Anim.Fly = function(delayId,delayAdd,sx,sy,ex,ey,area,img) {
	let dx = ex-sx;
	let dy = ey-sy;
	let rangeDuration = Math.max(0.1,Distance.get(dx,dy) / 10);
	return new Anim({
		at:			{ x: sx, y: sy, area: area },
		img: 		img,
		delayId: 	delayId,
		delayAdd: 	delayAdd,
		duration: 	rangeDuration,
		onInit: 		a => { a.create(1); },
		onSpriteMake: 	s => { s.sVelTo(dx,dy,rangeDuration); },
		onSpriteTick: 	s => { s.sMoveRel(s.xVel,s.yVel); }
	});
}

Anim.Fountain = function(delayId,entity,num=40,duration=2,velocity=0.6,img) {
	return new Anim({
		follow: 	entity,
		img: 		img,
		delayId: 	delayId,
		duration: 		Anim.Duration.untilAllDead,
		onInit: 		a => { },
		onTick: 		a => a.createPerSec(num,duration),
		onSpriteMake: 	s => s.sScaleSet(0.30).sVel(Math.rand(-30,30),Math.rand(velocity,2*velocity)).duration=1,
		onSpriteTick: 	s => s.sMoveRel(s.xVel,s.yVel).sGrav(10)
	});
}

Anim.Homing = function(delayId,entity,target,img,offAngle=45,num=40,duration=2,velocity=3) {
	let dx = target.x - entity.x ;
	let dy = target.y - entity.y;
	let deg = deltaToDeg(dx,dy);

	return new Anim({
		follow: 	entity,
		target: 	target,
		img: 		img,
		delayId: 	delayId,
		duration: 		Anim.Duration.untilAllDead,
		onInit: 		a => { },
		onTick: 		a => a.createPerSec(num,duration),
		onSpriteMake: 	s => s.sScaleSet(0.30).sVel(deg+Math.rand(-offAngle,offAngle),Math.rand(velocity,2*velocity)).duration=duration,
		onSpriteTick: 	s => !s.sPursuit(90*duration).sMoveRel(s.xVel,s.yVel).sArrived(0.3),
	});
}

Anim.Blam = function(delayId, target, scale=0.20, num=10, duration=0.2, fromDeg=0, arc=45, mag0=4, mag1=10, grav=10, rot=0, img ) {
	return new Anim({
		follow: 	target,
		img: 		img,
		delayId: 	delayId,
		duration: 	duration,
		onInit: 		a => { a.create(num); },
		onSpriteMake: 	s => { s.sScaleSet(scale).sVel(Math.rand(fromDeg-arc,fromDeg+arc),Math.rand(mag0,mag1)); },
		onSpriteTick: 	s => { s.sMoveRel(s.xVel,s.yVel).sGrav(grav); s.rotation += rot*s.dt; }
	});
}

});

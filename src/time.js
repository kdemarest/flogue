Module.add('time',function() {

let Time = (new class {
	constructor() {
		this.frameDt = 1000/60;
		this.simTime = 1;
	}
	get wallTime() {
		return Date.now()/1000;
	}
	simTimeAdd(dt) {
		this.frameDt = dt;
		this.simTime+=dt;
	}
	remaining(futureSimTime) {
		return Math.max(0,futureSimTime - this.simTime);
	}
	elapsed(simTime) {
		console.assert(simTime);
		return Math.max(0,this.simTime - simTime);
	}
	tickOnInterval(interval,dt,trackingObject,fn) {
		let repsLimit = 3.0;
		let tickerId = '_interval'+interval;
		trackingObject[tickerId] = Math.min( interval*repsLimit, (trackingObject[tickerId]||0)+dt);
		while( trackingObject[tickerId] >= interval ) {
			fn.call(trackingObject,interval);
			trackingObject[tickerId] -= interval;
		}
		return trackingObject;
	}
	tickOnTheSecond(dt,trackingObject,fn) {
		return this.tickOnInterval(1,dt,trackingObject,fn);
	}
}());

class SimTimer {
	constructor(duration) {
		this.simTimeStart = Time.simTime;
		this.simTimeEnd = Time.simTime+duration;
	}
	get remaining() {
		return Time.remaining(this.simTimeEnd);
	}
	get elapsed() {
		return Time.elapsed(this.simTimeStart);
	}
	get expired() {
		return Time.remaining(this.simTimeEnd) <= 0;
	}
}

return {
	Time: Time,
	SimTimer: SimTimer
}

});

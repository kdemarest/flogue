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
}());

Time.Periodic = class {
	constructor() {
		this.dtTotal = 0.0;
	}

	tick(interval,dt,fn) {
		let repsLimit = 3.0;
		this.dtTotal = Math.min( interval*repsLimit, this.dtTotal+dt);
		while( this.dtTotal >= interval ) {
			fn(interval);
			this.dtTotal -= interval;
		}
	}
}



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

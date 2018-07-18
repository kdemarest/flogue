Module.add('time',function() {

let Time = (new class {
	constructor() {
		this.simTime = 1;
	}
	get wallTime() {
		return Date.now()/1000;
	}
	simTimeInc() {
		this.simTime++;
	}
	remaining(futureSimTime) {
		return Math.max(0,futureSimTime - this.simTime);
	}
	elapsed(simTime) {
		console.assert(simTime);
		return Math.max(0,this.simTime - simTime);
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

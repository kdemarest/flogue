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
}());

class SimTimer {
	constructor(duration) {
		this.simTimeStart = Time.simTime;
		this.simTimeEnd = Time.simTime+duration;
	}
	get remaining() {
		return this.simTimeEnd - Time.simTime;
	}
	get elapsed() {
		return Time.simTime - this.simTimeStart;
	}
	get expired() {
		return Time.simTime >= this.simTimeEnd;
	}
}

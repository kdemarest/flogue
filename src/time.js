Module.add('time',function() {

let Time = {};
Time.one720 = 720;

Time.TimeKeeper = class {
	constructor() {
		// This starts at 1 second for obscure reasons that I forget, but I think it matters.
		this.time720 = Time.one720;
	}
	get time() {
		return Time.from720(this.time720);
	}
	timeAdvance720(dt720) {
		console.assert( Number.isFinite(this.time720) && Number.isFinite(dt720) );
		this.time720 += dt720;
	}
	until(futureTime) {
		console.assert( Number.isFinite(futureTime) );
		return futureTime - this.time;
	}
	since(pastTime) {
		console.assert( Number.isFinite(pastTime) );
		return this.time - pastTime;
	}
	remaining(futureTime) {
		return Math.max( 0, this.until(futureTime) );
	}
	elapsed(pastTime) {
		return Math.max( 0, this.since(pastTime) );
	}
}

Time.mult720 = (time720,mult) => {
	return Math.floor(time720*mult);
}

Time.to720 = timeInSeconds => {
	return Math.floor(timeInSeconds*720);
}

Time.from720 = time720 => {
	let actualSeconds = time720/720;
	return actualSeconds;
}

Time.is720 = time720 => {
	return Number.isInteger(time720);
}

Time.Interval720 = class {
	constructor() {
		this.dtTotal720 = 0;
	}

	tick(interval720,dt720,fn) {
		let repsLimit = 3;
		this.dtTotal720 += dt720;
		this.dtTotal720 = Math.min( interval720 * repsLimit, this.dtTotal720 );
		while( this.dtTotal720 >= interval720 ) {
			fn();
			this.dtTotal720 -= interval720;
		}
	}
}

Time.TimerSimple = class {
	constructor(period,fn) {
		this.remaining720 = null;
		this.period720 = Time.to720(period);
		this.fn = fn;		
		this.reset();
	}
	reset() {
		this.remaining720 = this.period720;
	}
	tick(dt) {
		this.remaining720 -= Time.to720(dt);
		if( this.remaining720 <= 0 ) {
			this.fn();
			this.reset();
		}
	}

};


return {
	Time: Time
}

});

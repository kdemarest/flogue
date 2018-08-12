window.Module = new class {
	constructor() {
		this.list = {};
		this.count = 10;
	}
	add(id,fn) {
		if( typeof id === 'function' ) {
			fn = id;
			id = this.count++;
		}
		this.list[id] = fn;
	}
	realize() {
		for( let id in this.list ) {
			//console.log('Initializing '+id);
			let globals = this.list[id](window);
			for( let varId in globals ) {
				// console.log('Importing '+varId);
				window[varId] = globals[varId];
			}
			for( let i in this ) {
				if( i!=='list' && i!=='count' ) {
					console.log("Rogue declaration "+i);
					delete this[i]
				}
			}
		}
	}
};

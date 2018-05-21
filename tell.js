let MessageManager = (new class {
	constructor() {
		this.recipientList = [];
		this.accumulate = 0;
	}
	addRecipient( observer, canPerceiveEntityFn, receiveFn ) {
		this.recipientList.push( { observer: observer, canPerceiveEntityFn: canPerceiveEntityFn, receiveFn: receiveFn, history: [], buffer: [] });
	}
	hold() {
		this.accumulate++;
	}
	release() {
		this.accumulate--;
		if( !this.accumulate ) {

		}
	}
	tell() {
		let sentence = ( arguments[0] instanceof Sentence ) ? arguments[0] : new Sentence(...arguments);
		if( !sentence.subject ) {
			debugger;
		}
		this.recipientList.map( recipient => {
			let cp = recipient.canPerceiveEntityFn(recipient.observer,sentence.subject);
			if( sentence.object ) {
				cp = cp || recipient.canPerceiveEntityFn(recipient.observer,sentence.object);
			}

			if( cp || recipient.observer.observeDistantEvents ) {
				let message = (cp?'':'FAR: ')+sentence.refine(recipient.observer);
				if( this.accumulate ) {
					recipient.buffer.unshift(message);
				}
				else {
					while( recipient.buffer.length ) {
						recipient.history.unshift( recipient.buffer.pop() );
					}
					recipient.history.unshift(message);
				}
				recipient.receiveFn(message,recipient.history);
			}
		});
	}
}());

function tell() {
	MessageManager.tell(...arguments);
}

Module.add('tell',function() {

let Narrative = (new class {
	constructor() {
		this.recipientList = [];
		this.accumulate = 0;
	}
	addRecipient( observerFn, canPerceiveEntityFn, receiveFn ) {
		this.recipientList.push( { observerFn: observerFn, canPerceiveEntityFn: canPerceiveEntityFn, receiveFn: receiveFn, history: [], buffer: [] });
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
		let toldList = [];
		this.recipientList.map( recipient => {
			let observer = recipient.observerFn();
			let observerCares = sentence.doesObserverCare(observer.id);
			if( !observerCares ) {
				return;
			}
			let cp = recipient.canPerceiveEntityFn(observer,sentence.subject);
			if( sentence.object && !sentence.object.isEffect ) {
				cp = cp || recipient.canPerceiveEntityFn(observer,sentence.object);
			}

			if( cp || observer.observeDistantEvents ) {
				let message = (cp?'':'FAR: ')+sentence.refine(observer);
				toldList.push( {recipient: recipient, message: message} );
				if( this.accumulate ) {
					recipient.buffer.unshift(message);
				}
				else {
					while( recipient.buffer.length ) {
						recipient.history.push( recipient.buffer.pop() );
					}
					recipient.history.push(message);
					while( recipient.history.length > Rules.narrativeHistoryLength ) {
						recipient.history.shift();
					}

				}
				recipient.receiveFn(message,recipient.history);
			}
		});
		return toldList;
	}
}());

function tellGet(observer,sentenceArray) {
	return new Sentence(...sentenceArray).refine(observer);
}

function tell() {
	return Narrative.tell(...arguments);
}

return {
	Narrative: Narrative,
	tell: tell,
	tellGet: tellGet
}

});

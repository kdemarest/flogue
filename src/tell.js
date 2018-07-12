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
				if( this.accumulate ) {
					recipient.buffer.unshift(message);
				}
				else {
					while( recipient.buffer.length ) {
						recipient.history.push( recipient.buffer.pop() );
					}
					recipient.history.push(message);
				}
				recipient.receiveFn(message,recipient.history);
			}
		});
	}
}());

function bonk(entity,target) {
	tell( mSubject|mCares, entity, ' ', mVerb, 'run', ' into ', mObject, target, '.' );
	if( target.isWall && target.invisible && target.isPosition ) {
//		target.wasBonked = true;
		target.invisible = false;
		guiMessage( 'reveal', target );
	}
}

function tell() {
	Narrative.tell(...arguments);
}

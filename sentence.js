let mSubject = 1;
let mObject = 2;
let mPronoun = 4;
let mPossessive = 8;
let mPossessed = 16;
let mA = 32;
let mList = 64;
let mBold = 128;
let mVerb = 256;
let mCares = 512;

let IrregularVerbs = [['are','is'],['have','has'],['go','goes']];

let SentenceReusableArray = [];
class Sentence {
	constructor() {
		this.list = [];
		this.subject = null;
		this.object = null;
		if( arguments.length && Array.isArray(arguments[0]) ) {
			this.concise(...arguments[0]);
		}
		else {
			this.add(...arguments);
		}
	}
	scan() {
		let m = this.list;
		for( let i=0 ; i<m.length ; ++i ) {
			if( m[i]&mSubject ) {
				this.subject = this.subject || m[++i];
			}
			else
			if( m[i]&mObject ) {
				this.Object = this.Object || m[++i];
			}
		}
	}
	concise() {
		this.subject = arguments[0];
		this.object = arguments[1];
		let lastWasYou;
		let result = arguments[2];
		let self = this;
		let atSentenceStart = true;
		result.replace( /\w+\$?|\s|./g, function(p,b,c) {
			if( atSentenceStart && /\w/.test(p.charAt(0)) ) {
				p = String.capitalize(p);
				atSentenceStart = false;
			}
			if( p.toLowerCase()=='you' ) {
				self.list.push(mSubject,self.subject);
				lastWasYou=true;
				return;
			}
			if( p.toLowerCase()=='are' ) {
				self.list.push(mVerb,p);
				return;
			}
			if( p=='*' ) {
				lastWasYou=false;
				self.list.push(mObject,self.object);
				return;
			}
			self.list.push(p.replace(/\$/g,lastWasYou?'':'s'));
			if( ['!','.','?'].includes(p) ) {
				atSentenceStart = true;
			}
		});
		return this;
	}
	add() {
		// takes either an array, or a simple list of values.
		if( arguments.length == 1 && arguments[0] === undefined ) {
			// ignore...
		}
		else
		if( arguments.length == 1 && Array.isArray(arguments[0]) ) {
			this.list.push(...arguments[0]);
		}
		else {
			this.list.push(...arguments);
		}
		return this.scan();
	}
	doesObserverCare(observerId) {
		let allCare = true;
		let m = this.list;
		let i = 0;
		while( i < m.length ) {
			if( (typeof m[i]=='number') && (m[i] & mCares) ) {
				allCare = false;
				++i;
				let who = m[i];
				if( who && typeof who=='object' && who.id == observerId ) {
					return true;
				}
			}
			++i;
		}
		return allCare;
	}
	refine(you) {
		function irregular(verb) {
			let found;
			IrregularVerbs.forEach( pair => { if( verb==pair[0] || verb==pair[1] ) { found=pair; } } );
			return found;
		}

		let vowels = 'aeiou';
		let numbers = '0123456789';

		let s = '';
		let i = 0;
		let m = this.list;
		let lastNounWasYou;
		let inListCount = 0;
		while( i < m.length ) {
			if( (typeof m[i]=='number') && (m[i] & mVerb) ) {
				let flags = m[i];
				let verb = m[++i];
				let lastTwo = typeof verb=='string' ? verb.substr(verb.length-2) : '';
				let affix = (lastTwo=='sh' || lastTwo=='ch' ? 'es' : 's');
				let a = Array.isArray(verb) ? verb : ( irregular(verb) || [verb,verb+affix] );
				let isYou = (flags&mSubject ? this.subject.id==you.id : (flags&mObject ? this.object.id==you.id : lastNounWasYou));
				s += isYou ? a[0] : a[1];
			}
			else
			if( (typeof m[i]=='number') && (m[i] == mCares) ) {
				// If mCares is unaccompanied by mSubect or anything else, then this is not part of the sentence
				// but rather just a signifier about caring.
				i += 2;
				continue;
			}
			else
			if( (typeof m[i]=='number') && (m[i] & (mSubject|mObject|mPronoun|mPossessive)) ) {
				let flags = m[i] & (mPronoun|mPossessive);
				let useA = m[i] & mA;
				let inList = m[i] & mList;
				let isBold = m[i] & mBold;
				let isPossessed = m[i] & mPossessed;
				let who = m[++i];
				let specifier = 'the ';
				if( useA ) {
					specifier = vowels.indexOf(who.name.charAt(0))>=0 ? 'an ': 'a ';
				}
				if( isPossessed || numbers.indexOf(who.name.charAt(0))>=0 ) {
					specifier = '';
				}
				let thing = (who.properNoun ? '' : specifier)+who.name;
				let a = SentenceReusableArray;
				a[0] = {you:'you',he:thing,she:thing,it:thing};
				a[mPronoun] = {you:'you',he:'he',she:'she',it:'it'};
				a[mPossessive] = {you:'your',he:thing+"'s",she:thing+"'s",it:thing+"'s"};
				a[mPronoun|mPossessive] = {you:'your',he:'his',she:'her',it:'its'};

				lastNounWasYou = (who.id == you.id);
				let index = lastNounWasYou ? 'you' : (who.pronoun || 'it');
				if( inList && inListCount>0 && (i+1>=m.length || !(parseInt(m[i+1])&mList) ) ) {
					s += ' and ';
				}
				else
				if( inList && i>1 && (parseInt(m[i-3])&mList) && inListCount>0 ) {
					s += ', ';
				}
				if( !inList ) { inListCount = 0; } else { ++inListCount; }
				s += (isBold?'<b>':'')+a[flags][index]+(isBold?'</b>':'');
			}
			else {
				s += (typeof m[i]=="string") ? m[i] : (m[i].name ? m[i].name : 'UNKNOWN');
			}
			++i;
		}
		s = String.capitalize(s);
		return s;
	}
}

Module.add('dataDialog',function(){

let QuestTypeList = Type.establish('QuestType',{

});

Type.register('QuestType',{
	linear: {
		// This would establish a linear conversation thread.
	},
	fetch: {
	},
	kill: {
	}
});

/**
A Dialog is composed of threads. A single quest or something the character knows is typically one
thread. You add threads to characters when there is a quest, or they are a barkeep and have a 
standard dialog, or whatever.

a speaker gets a simple array threadList and when a conversation happens the user gets a Dialog populated
with their threadList.

Each character also has common knowledge, which is put in the top-right corner of the discussion for the
player to click on if they choose. Like this.

S: Welcome to Smitty's bar						Discuss:	monsters
P: What is tending bar like?								local people
   I have the rubella herb you wanted						the town
   What have you got?										dwarves



*/


class Dialog {
	constructor(speakerId,threadList,speakerMemory) {
		console.assert(speakerMemory);
		this.speakerId = speakerId
		this.threadList = threadList || { say: 'no dialog' };
		this.speakerMemory = speakerMemory;
		this.threadId = null;
	}
	addThread(thread) {
		this.threadList[thread.id] = thread;
		thread.phraseId = null;
	}
	memory(key,fn) {
		let key = key.replace( /(\w)\.?/g, (match,p1,dot) => {
			if( p1=='t' ) return this.tokenId+dot;
			if( p1=='p' ) return this.phraseId+dot;
			return p1;
		});
		if( fn ) {
			this.memory[key] = fn( this.memory[key] );
		}
		return this.memory[key];
	}
	get speech() {
		function expandOption(option) {
			let result = {
				toThreadId: null,
				toPhraseId: null,
				text: 'no text'
			}
			let match = option.match( /(\w+\.)?(\w+\/)?(.*)/ );
			result.toThreadId = match[1] ? match[1].slice(0,-1) : null;
			result.toPhraseId = match[2] ? match[2].slice(0,-1) : null;
			result.text       = match[3];
			return result;
		}
		function phraseAfter(currentPhraseId,phraseList) {
			let phraseId = currentPhraseId.replace( /([a-zA-Z]+)([0-9]+)/, (match,p1,p2) => p1+(parseInt(p2||0)+1) );
			return phraseList[phraseId] ? phraseId : null;
		}

		let speech = {
			say: null,
			reply: [],
			topic: [],
		};
		Object.each( this.threadList, thread => {
			if( !this.threadId || this.threadId == thread.id ) {
				let phraseId   = thread.phraseId||'top';
				let phrase     = thread.phrase[phraseId];
				speech.say     = speech.say || phrase.say;
				let replyListRaw = Array.isArray(phrase.player) ? phrase.player : [phrase.player];
				let replyList  = replyListRaw.map( optionRaw => {
					let option = expandOptions(optionRaw);
					return {
						originThreadId: threadId,
						originPhraseId:	phraseId,
						toThreadId:		option.toThreadId || threadId,
						toPhraseId: 	option.toPhraseId || phraseAfter(phraseId,phrase),
						text:			option.text
					}
				});
				speech.replyList = replyList;
				if( thread.topic ) {
					speech.topic.push(thread.topic);
				}
			}
		});
		speech.say = speech.say || "I have nothing to say";
		return speech;
	}
	select(reply) {
		// Only if the player actually responds do we want to remember that we said this.
		this.memory( 't.p.timesSaid', value => (value||0)+1 );

		let result = {
			player: reply.player
		}

		if( !reply.player ) {
			this.threadId = null;
			this.phraseId = null;
		}
		else {
			this.threadId = reply.toThreadId || reply.origin.threadId;
			this.phraseId = reply.toPhraseId;
		}
	}
}

let dialog = new Dialog;
speaker.threadList.forEach( thread => dialog.addThread(thread) );

let GameGreeterThread = {
	id: 'game.greeting',
	phrase: {
		top: {
			player: 'c1/To dust we ever shall return. Even the mighty may not withstand time.',
		},
		c1: {
			say: 'But upon what authority comes this information to you, for I have seen much.',
			player: 'Only gods live forever.'
		},
		c2: {
			say: 'No, for what is life but the use of energy. There is more than enough to power our slight frames, even to the end of all things. If only one had the will, and the means.',
			player: 'Do not envy what only gods possess, for that way lies cataclysm.',
		}
		c3: {
			say: 'But I do envy it. I do.'
		}
	}
}

let dwarvenKnowledge = {
	id: 'dwarvenKnowledge',
	topic: 'dwarves',
	phrase: {
		top: {
			say: 'What would you like to know about dwarves?',
			player: [
				'whyUnder/Why do you live under ground?',
				'insult/I heard dwarven women have beards.'
			]
		},
		whyUnder: {
			say: 'All the better to be close to the gems. Glorious gems!',
		},
		insult: {
			say: 'That is outrageous!',
			fnOnce: context => context.player.affinity.dwarves--
		}
	}
}


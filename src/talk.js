Module.add('talk',function() {


/**

FIXED BUG: Stairs need to say enter
FIXED BUG: Dropping things needs to be allowed directly under an entity. Also, thrown things need the same.
FIXED BUG: Somehow a daibelade picked up a coffin.
FIXED BUG: I died and vanished. I think maybe I was puppeted and still drawing elsewhere. We need to un-puppet upon death.
FIXED BUG: Flames made by potion of fire should be short-lived. 1 turn.
CHECK BUG: A potion flew to a daibelade, but it was immune to burn, and the potion was not destroyed...
FIXED Most demons seem like they should resist possess, and some should be immune.
FIXED Cloaks should be defense against various elements.
FIXED All demons should resist rot
FIXED BUG: Daifahng should not be flying
FIXED BUG: Things fly out of chests in a lump
FIXED BUG: Figurines I throw no longer manifest.
FIXED BUG: Sorting by damage seems to be a text sort, but it should sort by parseInt of the first number


BUG: Iron mace of shock didn't say how much shock. Perhaps it is not understood as that kind of effect?
BUG: Corpses should not form over pits. Pits should be considered forbidden. Maybe entity.die() doesn't giveTo() properly?
BUG: Way more things need to allow LEP and perhaps basic pathing?
BUG: A bear tried to use the iron mace of shock
BUG: You should be able to swap places, I think, with your mindless husk
BUG: I tried to possess a goblin who was out of my sight. It did the right thing saying "but in the wrong diretion" but failed to consume my spell.
Possess should probably start much closer range, and recharge much slower
Perhaps goblin priests, or whatever shows up on the next level, should cast darkness so that all the darkvision and luminaris are useful.
Definitely put things on the other sides of pits so that possessing a daispine to daibelade lets you fly over to them. How to pick them up is another matter.
Rocks and arrow ammo should be WAY more common, maybe even just added during the adventure pass, arrows stuck into chests, rocks on the ground or accessible from
crumbling rock walls
Ranged weapons like bow and sling need to not be regular weapons, but rather explicitly a category of ranged weapons.
BUG: Freeze spell should put out flames, not be stopped by them.
WORRY: How did I get scale armor of regeneration AC 31 on level 1?
**/


function TalkGreet(me,you,logic,helper) {
	return {
		greet: ()=>String.capitalize(pick(['hello','greetings','salutations','well met']))+' '+you.name
	}
}

function TalkDonate(me,you,logic,helper) {
	let charityEffect = EffectTypeList.eStalwart;
	logic.has = (n)=>you.coinCount>=n;
	logic.lose = (n)=> { you.coinCount-=n; effectApply(charityEffect,you,null,null); };

	return `
	- ?has(1) Donate 1 coin.
		- +lose(1) Thank you for your charity!
	- ?has(5) Donate 5 coins.
		- +lose(5) May the light of Solarus shine upon you!
	`;
}


function TalkRetrieveQuest(me,you,logic,helper) {
	if( !logic.enemy ) {
		logic.area = helper.pickArea(2);
		logic.enemy = logic.area.pickEnemy('isEarthChild');
		logic.lover = helper.pickPersonOppositeGender();
		logic.lostItem = helper.generatePlotItem( pick(['stuff.locket','ring']), logic.enemy );
		logic.knowsSecret = false;
		logic.gotTask = false;
		logic.enemyDead = () => logic.enemy.isDead()
		logic.hasLostItem = () => you.item(i=>i.id==logic.lostItem.id)
		logic.persuade = () => you.persuade(me);
		logic.reward = () => you.coinCount += 400;
	}

	return `
	- !gotTask I have a little [enemy] problem. Perhaps you could help?
		- Perhaps. Tell me more.
			- On core level [level] is a big, nasty [enemy]. It has my [lostItem], for reasons I would rather not discuss.
				- What are the reasons?
					- ?persuade Well, I was meeting somebody, if you must know. [lover] gave me the [lostItem]. +knowsSecret
					- !persuade I simply will not tell you. Can you help me or not?
				- I will kill the [enemy]. +gotTask
	- ?gotTask Have you slain that [enemy] yet?
		- ?enemyDead Yes!
			- Well done! And may I have my [lostItem] please?
				- ?hasLostItem Here it is.
					- You have done me a great service. +reward
				- I do not have it.
					- What? Then... go get it!
		- No, the [enemy] still lives. X
	`;

}

// and a carry quest...

function TalkFetchQuest(me,you,logic,helper) {
	if( !logic.item ) {
		logic.holder = helper.pickMonster('isSunChild');
		logic.item = helper.generatePlotItem( pick(['stuff.locket','ring']), logic.holder );
		logic.gotTask = false;
		logic.reward = () => you.coinCount += 400;
	}

	return `
	- !gotTask My favorite [item] is...?
		- Perhaps. Tell me more.
			- On core level [level] is a big, nasty [enemy]. It has my [lostItem], for reasons I would rather not discuss.
				- What are the reasons?
					- ?persuade Well, I was meeting somebody, if you must know. [lover] gave me the [lostItem]. +knowsSecret
					- !persuade I simply will not tell you. Can you help me or not?
				- I will kill the [enemy]. +gotTask
	- ?gotTask Have you slain that [enemy] yet?
		- ?enemyDead Yes!
			- Well done! And may I have my [lostItem] please?
				- ?hasLostItem Here it is.
					- You have done me a great service. +reward
				- I do not have it.
					- What? Then... go get it!
		- No, the [enemy] still lives. X
	`;

}


function Talk(_me,_you) {

	class TalkHelper {
		constructor(entity) {
			this.entity = entity;
			Object.assign( this, entity );
		}
		get area() {
			return this.entity.area;
		}
		item(fn) {
			return new Finder(this.entity.inventory).filter(fn);
		}
		held(slotId) {
			return new Finder(this.entity.inventory).filter(i=>i.inSlot==slotId).first || {};
		}
	}

	let me = new TalkHelper(_me);
	let you = new TalkHelper(_you);
	let area = _me.area;
	let map = _me.map;
	you.talkState = 'greet';
	let talkList = {};
	talkList.greet = new TalkGreet(me,you,you.talkFlag);
	talkList.donate = new TalkDonate(me,you,you.talkFlag);

	let output = function() {
		let speech = talkList[state].speech();
		let options = {};
		Object.each( talkList, talk => {
			let optionList = talk.options();
			Object.each( optionList, (option,optionId) => {
				if( option !== false ) {
					options[optionId] = option;
				}
			});
		});
		return {
			speech: speech,
			options: options
		}
	}

	let input = function(id) {

	}

	return {
		output: output,
		input: input
	};
}

class ViewTalk extends ViewObserver {
	constructor(p,onHide) {
		super();
		this.divId = '#guiTalk';
		this.talk = new Talk( p.me, p.you );
		Gui.keyHandler('viewTalk', this.onKeyDown.bind(this) );
		this.isVisible = false;
		this.onHide = onHide;
		this.show();
	}
	onKeyDown(e) {
		if( e.key == 'Escape' ) {
			this.hide();
			return false;
		}
		return false;
	}
	show() {
		this.isVisible = true;
	}
	hide() {
		$(this.divId).hide();
		$(document).off( '.ViewTalk' );
		this.isVisible = false;
		this.onHide();
	}
	render() {
		if( !this.isVisible ) {
			return;
		}
		let divId = this.divId;
		$(divId).show();
		talk = this.talk();
		$(divId).html( '<p>'+talk.speech+'</p>' );
		Object.each( talk.options, (option,optionId) => {
			$('<div>'+option+'</div>')
				.appendTo($(divId))
				// .click on this to pick this speech
		});
	}
	tick() {
	}
}

	return {
		Talk: Talk,
		ViewTalk: ViewTalk
	}

});
/**
A person has
- needs       (materials, tasks)
- knowledge   (where is, lore of)
- stance      (based on tribal perspective, but overloaded: towards you, towards others)
- observation (your stats, items, reputation)
	- low health needs healing if you.health% < 50 && town.has(priest)
	- if person.isMartial && !person.has([boots,armor,bracers],'armor') ['You might want to get ',w.armor]
	- if me.job in {smith:1,armorer:1} && your.wornItem(i=>i.level<depth-3,'weakArmor') ['Improve the ',w.weakArmor,' you\'re wearing.']
- stories     (religious, heroic, personal)
- history     (

Priests explain the sun problem
Bards talk about heroic exploits that explain nuances of combat and strategy
Academics speak of the taxonomy of monsters and their capabilities. entity.discuss and item.discuss (vs .explain)




0-4

0 ********
1 ******
2 ****
3 **
4 *


(n+1)^2

25

n-sqrt(randInt(0,(n+1)*(n+1))

0 *********   25-16   9
1 *******     16-9    7
2 *****        9-4    5
3 **           4-1    3
4 *            1-0

**/



/**
A person has
- needs       (materials, tasks)
- knowledge   (where is, lore of)
- stance      (based on tribal perspective, but overloaded: towards you, towards others)
- observation (your stats, items, reputation)
	- low health needs healing if you.health% < 50 && town.has(priest)
	- if person.isMartial && !person.has([boots,armor,bracers],'armor') ['You might want to get ',w.armor]
	- if my.job in {smith:1,armorer:1} && your.wornItem(i=>i.level<depth-3,'weakArmor') ['Improve the ',w.weakArmor,' you\'re wearing.']
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

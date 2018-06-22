Gab = (new function(priorGab) {
	console.assert(this!==window);
	Object.assign(this,priorGab);
	let self = this;
	let observer = null;
	let cityNameList = Array.shuffle(['Gunderhite','Thurmulna','Kurstifal','Unkruzia']);
	let areaId2CityName = {};

	function getCityName(areaId) {
		if( !areaId2CityName[areaId] ) {
			areaId2CityName[areaId] = cityNameList.pop();
		}
		return areaId2CityName[areaId];
	}

	function idToName(id) {
		return String.capitalize(id.split('.')[0]);
	}

	function getAreaName(themeId,areaId) {
		if( areaId && self.world.areaList[areaId] ) {
			return  self.world.areaList[areaId].name;
		}
		let theme = ThemeList[themeId];
		if( theme.name ) return theme.name;
		return themeId;
	}

//	function gateMakeName() {
//		let sentence = new Sentence(...arguments);
//		return sentence.refine(null);
//	}



	let sign4Type = {
		stairsUp: 	(e)=> () => 'These stairs ascend to '+getAreaName(e.themeId,e.toAreaId)+'.\nHit "'+commandToKey(Command.WAIT)+'" to ascend.',
		stairsDown: (e)=> () => 'These stairs descend to '+getAreaName(e.themeId,e.toAreaId)+'.\nHit "'+commandToKey(Command.WAIT)+'" to descend.',
		gateway: 	(e)=> () => 'To '+getAreaName(e.themeId,e.toAreaId)+'\nHit "'+commandToKey(Command.WAIT)+'" to enter.',
		portal: 	(e) => 'This portal pulses with an aura of menace.'
	}

	function signFor(e) {
		if( sign4Type[e.typeId] ) {
			return sign4Type[e.typeId](e);
		}
		if( e.isNamed ) {
			let s = e.name+' the '+(e.jobId ? e.typeId+' '+e.jobId : e.typeId);
			if( e.brainMaster ) {
				s += '('+(new Sentence(mSubject|mPossessive,e.brainMaster,' '+(e.isPet?'pet':'slave')).refine(observer))+')';
			}
			s += JobTypeList[e.jobId] ? '\n'+JobTypeList[e.jobId].sign+'\nHit [Enter] to talk.' : '';
			return s;
		}
	}

	function entityPostProcess(entity) {
		if( entity.isArea ) {
			let area = entity;
			if( area.theme.name ) {
				area.name = area.theme.name;
			}
			else {
				if( area.theme.isTown ) {
					area.name = getCityName(area.id);
					entity.properNoun = true;
				}
				else {
					entity.name = area.theme.typeId+' area';
				}
			}
			return;
		}

		if( entity.isNamed ) {
			entity.name = idToName(entity.id);
			entity.properNoun = true;
		}
		let sign = signFor(entity);
		if( sign ) { entity.sign = sign; }
	}


	this.entityPostProcess = entityPostProcess;

	this.damagePast = {
		"cut": "chopped",
		"stab": "pierced",
		"bite": "chewed",
		"claw": "mauled",
		"bash": "bashed up",
		"burn": "scorched",
		"freeze": "frosty",
		"corrode": "corroded",
		"poison": "poisoned",
		"smite": "smitten",
		"rot": "rotted"
	};


	this.describeStatChange = {
		invisible: function(subj,obj,oldValue,newValue) {
			return [mSubject,subj,' suddenly ',mVerb,newValue?'wink':'appear',newValue?' out of sight':' from thin air','!'];
		},
		senseInvisible: function(subj,obj,oldValue,newValue) {
			return [mSubject,subj,' can see invisible things!'];
		},
		speed: function(subj,obj,oldValue,newValue) {
			return [mSubject,subj,' ',mVerb,(newValue<oldValue?'slow':'speed'),' ',(newValue<oldValue?'down':'up'),'.'];
		},
		regenerate: function(subj,obj,oldValue,newValue) {
			return [mSubject|mPossessive,subj,' body ',newValue==0 ? 'stops regenerating.' : (newValue<oldValue ? 'regenerates a bit less.' : 'begins to knit itself back together.')];
		},
		immune: function(subj,obj,oldValue,newValue) {
			return [mSubject|mPossessive,subj,' ',mVerb,'is',' ',!oldValue ? 'now immune to '+newValue : 'no longer immune to '+oldValue,'s.'];
		},
		vuln: function(subj,obj,oldValue,newValue) {
			return [mSubject,subj,' ',mVerb,'is',' ',!oldValue ? 'now vulnerable to '+newValue : 'no longer vulnerable to '+oldValue,'s.'];
		},
		resist: function(subj,obj,oldValue,newValue) {
			return [mSubject|mPossessive,subj,' ',mVerb,'is',' ',!oldValue ? 'now resistant to '+newValue+'s.' : 'no longer resistant to '+oldValue+'s.'];
		},
		travelMode: function(subj,obj,oldValue,newValue) {
			return [mSubject,subj,' ',mSubject|mVerb,'begin',' to ',newValue,'.'];
		},
		attitude: function(subj,obj,oldValue,newValue) {
			return [mSubject,subj,' ',mSubject|mVerb,'become',' ',newValue,'.'];
		},
		senseBlind: function(subj,obj,oldValue,newValue) {
			return [mSubject,subj,' ',mSubject|mVerb,newValue?'lose':'regain',' ',mSubject|mPronoun|mPossessive,subj,' sight!'];
		},
		senseXray: function(subj,obj,oldValue,newValue) {
			return [mSubject,subj,' can '+(newValue?'':'no longer')+' see through walls!'];
		},
		senseItems: function(subj,obj,oldValue,newValue) {
			return [mSubject,subj,' '+(newValue?'':'no longer '),mVerb,'sense',' treasure!'];
		},
		senseLife: function(subj,obj,oldValue,newValue) {
			return [mSubject,subj,' '+(newValue?'':'no longer '),mVerb,'sense',' creatures!'];
		},
		light: function(subj,obj,oldValue,newValue) {
			return ['The area around ',mSubject,subj,' '+(newValue>oldValue?' brightens':'grows darker')+'.'];
		},
		loseTurn: function(subj,obj,oldValue,newValue) {
			return [mSubject,subj,' ',mVerb,'is',(!newValue?' no longer':''),' stunned.'];
		},
		eJump2: function(subj,obj,oldValue,newValue) {
			return [mSubject,subj,' legs ',mVerb,'feel',(!newValue?' less':''),' springy.'];
		},
		eJump3: function(subj,obj,oldValue,newValue) {
			return [mSubject,subj,' legs ',mVerb,'feel',(!newValue?' less':''),' springy.'];
		},
		_generic_: function(subj,obj,oldValue,newValue) {
			return [mSubject,subj,' ',mVerb,'is',' less enchanted.'];
		}
	};

	return this;
}(Gab));


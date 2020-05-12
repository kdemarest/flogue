Module.add('viewInfo',function() {

class ViewInfo extends ViewObserver {
	constructor(infoDivId) {
		super();
		this.infoDivId = infoDivId;
		$(this.infoDivId).empty();
	}
	show(entity,from) {
		if( this.observer.id != entity.id ) {
			this.override(entity);
			this.dirty = true;
			guiMessage('showCrosshair',entity);
			guiMessage('showExperience',entity);
			guiMessage('showStatus',entity);
		}
	}

	hide(from) {
		this.override(null);
		this.dirty = true;
		guiMessage('hideCrosshair');
		guiMessage('hideExperience');
		guiMessage('hideStatus');
	}

	message(msg,payload) {
		super.message(msg,payload);
		if( msg=='showInfo' ) {
			this.show( payload.entity, payload.from );
		}
		if( msg=='hideInfo' ) {
			this.hide( payload.from );
		}
	}	
	compile(replyFn) {
		let debug = false;
		let you = this.trueObserver;
		let entity = this.observer;

		function test(conditionList,t,text) {
			if( t ) {
				conditionList.push(text);
			}
		}

		let classList = {
			monColor: 0,
			healthWarn: 0,
			healthCritical: 0
		};

		if( entity.isTileType ) {
			return ['',classList];
		}


		let specialMessage = '';
		if( entity.id !== you.id ) {
			if( you.senseBlind ) {
				specialMessage = you.nearTarget(entity,1) ? 'Some kind of '+(entity.isMonsterType ? 'creature' : 'item')+'.' : 'You are blind.';
			}
			else
			if( entity.invisible && !you.senseInvisible ) {
				specialMessage = you.nearTarget(entity,1) ? 'An invisible '+(entity.isMonsterType ? 'creature' : 'item')+'.' : 'Unknown.';
			}
			if( specialMessage ) {
				let s = '<div class="monColor">'+specialMessage+'</div>';
				return [s,classList];
				return;
			}
		}

		function itemSummarize(ex,you,item,comp,header=true) {
			let mine = you.inventory.find(i=>i.id==item.id)
			let s = '';
			if( header ) {
				let lvl = !item.isTreasure ? '' : ' Level '+item.level+'<br>Value '+ex.priceWithCommas;
				s += true||item.isUnique ? '<img class="itemImage" src="'+ImageRepo.getImgFullPath(item)+'"><br>' :
					'<table class="itemIconTable"><tr><td>'+ex.icon+'</td><td>'+lvl+'</td></tr></table><br>';
				s += ex.description+(ex.permutation?' '+ex.permutation:'')+'<br>';
				if( ex.effectAbout ) {
					s += ex.effectAbout+'<br>';
				}
				if( ex.description2 ) {
					s += ex.description2+'<br>';
				}
				if( ex.deathReturn ) {
					s += '<span class="statAlert">'+ex.deathReturn+'</span><br>';
				}
				//if( item.effect && item.effect.stat && !item.isWeapon ) {
				//	s += item.effect.stat+' '+(''+item.effect.value).split(',').join(', ')+'<br>';
				//}
				//s += 'Value: '+ex.priceWithCommas+'<br>';
//				s += String.combine(' ',ex.effect,ex.permute,ex.effect || ex.permute ? '<br>' : '');
			}
			if( ex.duration ) {
				s += "Duration: "+ex.duration;
			}
			let dam='',arm='';
			if( ex.damage ) {
				dam = String.combine(' ',ex.damage,ex.damageType+' damage',ex.aoe,ex.quick,ex.condition);
				if( comp ) {
					if( comp.damage > item.damage ) dam = '<span class="worse">'+dam+'</span>';
					if( comp.damage < item.damage ) dam = '<span class="better">'+dam+'</span>';
				}
			}
			if( ex.armor ) {
				arm = ex.armor+' armor';
				if( comp ) {
					if( comp.armor > item.armor ) arm = '<span class="worse">'+arm+'</span>';
					if( comp.armor < item.armor ) arm = '<span class="better">'+arm+'</span>';
				}
			}
			if( dam || arm ) {
				s += dam+arm+'<br>';
			}
			s += (ex.bonus ? ex.bonus+' ' : '')+(ex.recharge ? ex.recharge+' recharge' : '')+'<br>';
			if( ex.perks ) {
				s += ex.perks+'<br>';
			}
			if( !mine ) {
				s = '<div class="monColor">'+s+'</div>';
			}
			return s;
		}

		let renderItemType = () => {
			let item = entity;
			let s = '<div class="monColor">';
			let ex = item.explain(null,you);
			s += itemSummarize(ex,you,item,false,true/*!item.inventory && item.isTreasure*/);

			// Compare it to any item I have in the same slot this belongs in.
			if( item.slot && !you.inventory.find(i=>i.id==item.id) ) {
				let f;
				f = you.getItemsInSlot(item.slot).filter(i=>i.typeId==item.typeId);
				if( !f.count ) {
					f = you.getItemsInSlot(item.slot);
				}
				if( !f.count ) {
					f = you.getItemsInSlot(item.slot);
				}
				if( f.count ) { s += '<hr>'; }
				f.forEach( i=>{
					let ex = i.explain(null,you);
					s += '<br>'+itemSummarize(ex,you,i,item);
				});
			}
			// If the item has inventory, tell what it is.
			if( item.inventory && !item.hideInventory ) {
				s += '<div class="invList">';
				if( item.state == 'shut' && !Distance.isNear(item.x-you.x,item.y-you.y,you.senseXray||0) ) {
					s += 'Contents unknown';
				}
				else {
					let any = false;
					item.inventory.forEach( item => {
						let ex = item.explain(null,you);
						s += (any ? ', ' : '')+'<span>'+ex.description+'</span>';
						any=true;
					});
					if( !any ) {
						s += 'Empty';
					}
				}
				s += '</div>';
			}
			if( item.sign ) {
				let sign = typeof item.sign == 'function' ? item.sign() : item.sign;
				s += sign.replace(/\n/g,'<br>');
			}
			if( ex.infoPostfix ) {
				s += ex.infoPostfix;
			}
			s += "</div>";
			s += '<div id="favMessage"></div>';
			return s;
		}

		if( entity.isItemType ) {
			return [renderItemType(), classList];
		}

		let s = "";
		if( debug && !entity.isUser ) {
			s += '['+(this.lastDirAttempt||'-')+'] ';
			s += entity.attitude+' '+(entity.bumpCount||'')+'<br>';
		}
		let tRow = function(a,b) {
			return '<tr><td>'+a+'</td><td>'+b+'</td></tr>';
		}

		s += '<div class="monsterImageBackground"><img class="monsterImage" src="'+ImageRepo.getImgFullPath(entity)+/*IMG_BASE+entity.img+*/'"></div><br>';

		s += '<table>';
		s += tRow( 'Health:', Math.ceil(entity.health)+' of '+Math.ceil(entity.healthMax)+(debug ? ' ('+entity.x+','+entity.y+')' : '') );
		if( !entity.isUser ) {
			s += tRow('Activity:',(entity.activity ? entity.activity : (entity.attitude|'uncertain'))+(this.enemyIsPresent?'*':''));
		}
		let shield = entity.getFirstItemInSlot(Slot.SHIELD);
		if( entity.isUser ) {
			let bc = shield ? shield.calcBlockChance('any',true,entity.isBraced,entity.braceBonus) : 0;
			let weapon = entity.calcDefaultWeapon();
			let weaponEx = weapon.explain(null,entity);
			let ammo = entity.getFirstItemInSlot(Slot.AMMO);
			let ex = ammo ? ammo.explain(null,entity) : false;

			let arMelee = Math.floor(entity.calcReduction(DamageType.CUT,false)*Rules.armorVisualScale);
			let arRanged = Math.floor(entity.calcReduction(DamageType.STAB,true)*Rules.armorVisualScale);
			let arString = arMelee+"M, "+arRanged+"R";
			if( arMelee <= 0 ) {
				arString = '<span class="statAlert">'+arString+'</span>';
			}
			s += tRow( "Armor:", arString );
			s += tRow( "Shield:", 
				(entity.isBraced?'<span class="shieldBonus">':'')+
				Math.floor(bc*100)+'%'+
				(entity.isBraced?'</span>':'')+
				" to block"
			);
			s += tRow( "Damage:", String.combine( ' ', weaponEx.damage||0, weaponEx.damageType, weaponEx.quick, weaponEx.reach, weaponEx.sneak ) );
			s += tRow( "Ammo:", ex ? ex.description : '<span class="statNotice">none ready</span>' );
			s += tRow( "Coins:", Math.floor(entity.coinCount||0) );
		}
		s += '</table>';


		let spd = entity.speed<1 ? ', slow' : ( entity.speed>1 ? ', fast '+entity.speed : '');
		let nim = entity.getDodge() == Quick.CLUMSY ? ', clumsy' : (entity.getDodge()==Quick.NIMBLE ? ', nimble' : '');
		s += (entity.chargeAttackMult && entity.chargeDist>0) ? '<span class="statAlert">CHARGING</span>' :
			(entity.jump>0 ? '<span class="statAlert">JUMPING</span>' :
			(entity.travelMode !== 'walk' ? '<b>'+entity.travelMode+'ing</b>' :
			entity.travelMode+'ing'))+spd+nim+'<br>';

		// Shield characteristics
		s += shield ? '<div class="monDetail">Blocking:</div>'+shield.blocks.split(',').join(', ')+'<br>' : '';

		// Conditions with duration
		let notable = { damage:1, attitude: 1, heal: 1, possess:1, immobile:1, stun: 1, summon: 1, sneak: 1 };
		let conditionList = [];
		DeedManager.traverseDeeds( entity, deed => {
			if( notable[deed.stat || deed.op] ) {
				conditionList.push('<b>'+deed.name+' '+(typeof deed.timeLeft == 'number' ? Math.ceil(deed.timeLeft) : '')+'</b>');
			}
		});
		test( conditionList, entity.map.getLightAt(entity.x,entity.y,1) <= 0, 'shrouded');
		test( conditionList, entity.invisible,				'invis');
		test( conditionList, (entity.rechargeRate||1)>1,	'manaUp');
		test( conditionList, entity.regenerate>MonsterTypeList[entity.typeId].regenerate,'regen '+Math.floor(entity.regenerate*100)+'%');
		s += conditionList.join(', ')+'<br>';

		// Altered senses
		let senseList = [];
		test( senseList, entity.senseBlind,		'blind');
		test( senseList, entity.senseSmell,		'scent');
		test( senseList, entity.senseXray,		'xray');
		test( senseList, entity.senseDarkVision, 'darkVis');
		test( senseList, entity.senseInvisible,	'invis');
		test( senseList, entity.senseTreasure,	'treasure');
		test( senseList, entity.senseLiving,	'living');
		test( senseList, entity.sensePerception,'intuit');
		test( senseList, entity.senseAlert,		'alert');
		s += senseList.length ? '<div class="monDetail">Senses:</div>'+senseList.join(', ')+'<br>' : '';

		// Immunity, resistance and vulnerability
		let summaryImmune = (entity.immune ||'').split(',').filter( i=>i!==DamageType.WATER && i!==DamageType.LIGHT );
		s += summaryImmune.length ? '<div class="monDetail">Immune:</div>'+summaryImmune.join(', ')+'<br>' : '';
		s += entity.resist ? '<div class="monDetail">Resist:</div>'+entity.resist.split(',').join(', ')+'<br>' : '';
		s += entity.vuln ? '<div class="monDetail">Weak:</div>'+entity.vuln.split(',').join(', ')+'<br>' : '';

		// Perks owned
		let showPerks = false;
		if( showPerks ) {
			let p = '';
			if( entity.perkList ) {
				Object.each(entity.perkList, perk => {
					if( perk.dead ) {
						return;
					}
					if( !p ) {
						p += '<span>PERKS</span><br>';
					}
					let allow = Perk.allow(perk,{source:entity}) ? '' : ' notAllowed';
					p += '<span class="infoPerk'+allow+'">'+perk.name+'<br>'+perk.description+'</span><br>';
				});
			}
			s += p;
		}
		if( !entity.isUser ) {
			s += debug ? (entity.history[0]||'')+(entity.history[1]||'')+(entity.history[2]||'') : '';
//			$('#guiPathDebugSummary').html(entity.path ? JSON.stringify(entity.path.status) : 'No Path');
//			$('#guiPathDebug').html(entity.path ? entity.path.render().join('\n') : '');
			classList.monColor = 1;
		}
		else {
			let healthRatio = entity.health/entity.healthMax;
			if( healthRatio < 0.15 ) {
				classList.healthCritical = 1;
			}
			else
			if( healthRatio < 0.35 ) {
				classList.healthWarn = 1;
			}
		}
		return [s,classList];

	}

	tick(dt) {
		this.periodicDirty = this.periodicDirty || new Time.Periodic();
		this.periodicDirty.tick( 0.2, dt, () => {
			this.dirty = true;
		});
	}

	render(dt) {
		console.logInfo('viewInfo.render');
		let [content,classList] = this.compile();
		Gui.cachedRenderDiv(this.infoDivId,content,classList);

	}
}


return {
	ViewInfo: ViewInfo
}

});
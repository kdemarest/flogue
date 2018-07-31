Module.add('viewInfo',function() {

class ViewInfo extends ViewObserver {
	constructor(infoDivId) {
		super();
		this.infoDivId = infoDivId;
		$(this.infoDivId).empty();
	}
	message(msg,payload) {
		super.message(msg,payload);
		if( msg=='show' ) {
			this.override(payload);
			this.render();
		}
		if( msg=='hide' ) {
			this.override(null);
			this.render();
		}
	}
	render() {
		let debug = false;
		let you = this.trueObserver;
		let entity = this.observer;

		function test(conditionList,t,text) {
			if( t ) {
				conditionList.push(text);
			}
		}

		$(this.infoDivId).empty().removeClass('monColor healthWarn healthCritical');
		if( entity.isTileType ) {
			return;
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
				$(this.infoDivId).show().html(s);
				return;
			}
		}

		function itemSummarize(you,item,comp,header=true) {
			let mine = you.inventory.find(i=>i.id==item.id)
			let ex = item.explain(null,you);
			let s = '';
			if( header ) {
				let lvl = !item.isTreasure ? '' : ' Level '+item.level+'<br>Value '+ex.priceWithCommas;
				s += item.isUnique ? '<img class="itemImage" src="'+IMG_BASE+item.img+'"><br>' :
					'<table class="itemIconTable"><tr><td>'+ex.icon+'</td><td>'+lvl+'</td></tr></table><br>';
				s += ex.description+(ex.permutation?' '+ex.permutation:'')+'<br>';
				if( ex.description2 ) {
					s += ex.description2+'<br>';
				}
				//if( item.effect && item.effect.stat && !item.isWeapon ) {
				//	s += item.effect.stat+' '+(''+item.effect.value).split(',').join(', ')+'<br>';
				//}
				//s += 'Value: '+ex.priceWithCommas+'<br>';
//				s += String.combine(' ',ex.effect,ex.permute,ex.effect || ex.permute ? '<br>' : '');
			}
			let dam='',arm='';
			if( ex.damage ) {
				dam = String.combine(' ',ex.damage,ex.damageType+' damage',ex.aoe);
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
			s += (ex.bonus ? ex.bonus+' ' : '')+(ex.recharge ? ex.recharge+' recharge' : '');
			if( !mine ) {
				s = '<div class="monColor">'+s+'</div>';
			}
			return s;
		}

		if( entity.isItemType ) {
			let item = entity;
			let s = '<div class="monColor">';
			s += itemSummarize(you,item,false,!item.inventory && item.isTreasure);

			// Compare it to any item I have in the same slot this belongs in.
			if( item.slot && !you.inventory.find(i=>i.id==item.id) ) {
				let f = you.getItemsInSlot(item.slot);
				if( f.count ) { s += '<hr>'; }
				f.forEach( i=>{ s += '<br>'+itemSummarize(you,i,item); });
			}
			// If the item has inventory, tell what it is.
			if( item.inventory ) {
				s += '<div class="invList">';
				if( item.state == 'shut' ) {
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
			s += "</div>";
			s += '<div id="favMessage"></div>';
			$(this.infoDivId).show().html(s);
			return;
		}

		let s = "";
		if( debug && !entity.isUser() ) {
			s += '['+(this.lastDirAttempt||'-')+'] ';
			s += entity.attitude+' '+(entity.bumpCount||'')+'<br>';
		}
		let tRow = function(a,b) {
			return '<tr><td>'+a+'</td><td>'+b+'</td></tr>';
		}

		s += '<div class="monsterImageBackground"><img class="monsterImage" src="'+IMG_BASE+entity.img+'"></div><br>';

		s += '<table>';
		s += tRow( 'Health:', Math.ceil(entity.health)+' of '+Math.ceil(entity.healthMax)+(debug ? ' ('+entity.x+','+entity.y+')' : '') );
		if( !entity.isUser() ) {
			s += tRow('Activity:',entity.brainState && entity.brainState.activity ? entity.brainState.activity : entity.attitude);
		}
		let shield = entity.getFirstItemInSlot(Slot.SHIELD);
		if( entity.isUser() ) {
			let bc = shield ? shield.calcBlockChance('any',true,entity.shieldBonus) : 0;
			let weapon = entity.calcDefaultWeapon();
			let weaponEx = weapon.explain(null,entity);
			let ammo = entity.getFirstItemInSlot(Slot.AMMO);
			let ex = ammo ? ammo.explain(null,entity) : false;
			s += tRow( "Armor:", Math.floor(entity.calcReduction(DamageType.CUT,false)*Rules.armorVisualScale)+"M, "+Math.floor(entity.calcReduction(DamageType.STAB,true)*Rules.armorVisualScale)+"R" );
			s += tRow( "Shield:", 
				(entity.shieldBonus?'<span class="shieldBonus">':'')+
				Math.floor(bc*100)+'%'+
				(entity.shieldBonus?'</span>':'')+
				" to block"
			);
			s += tRow( "Damage:", String.combine( ' ', weaponEx.damage||0, weaponEx.damageType, weaponEx.quick, weaponEx.reach, weaponEx.sneak ) );
			s += tRow( "Ammo:", ex ? ex.description : 'none ready' );
			s += tRow( "Coins:", Math.floor(entity.coinCount||0) );
		}
		s += '</table>';


		let spd = entity.speed<1 ? ', slow' : ( entity.speed>1 ? ', fast' : '');
		let nim = entity.dodge >= 2 ? ', lithe' : (entity.dodge==1 ? ', nimble' : '');
		s += (entity.chargeAttackMult && entity.chargeDist>0) ? '<span class="jump">CHARGING</span>' :
			(entity.jump>0 ? '<span class="jump">JUMPING</span>' :
			(entity.travelMode !== 'walk' ? '<b>'+entity.travelMode+'ing</b>' :
			entity.travelMode+'ing'))+spd+nim+'<br>';

		// Shield characteristics
		s += shield ? '<div class="monDetail">Blocking:</div>'+shield.blocks.split(',').join(', ')+'<br>' : '';

		// Conditions with duration
		let notable = { damage:1, attitude: 1, heal: 1, possess:1, immobile:1, stun: 1, summon: 1 };
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
		test( senseList, entity.darkVision,		'darkVis');
		test( senseList, entity.senseInvisible,	'invis');
		test( senseList, entity.senseTreasure,	'treasure');
		test( senseList, entity.senseLiving,	'living');
		s += senseList.length ? '<div class="monDetail">Senses:</div>'+senseList.join(', ')+'<br>' : '';

		// Immunity, resistance and vulnerability
		let summaryImmune = (entity.immune ||'').split(',').filter( i=>i!==DamageType.WATER );
		s += summaryImmune.length ? '<div class="monDetail">Immune:</div>'+summaryImmune.join(', ')+'<br>' : '';
		s += entity.resist ? '<div class="monDetail">Resist:</div>'+entity.resist.split(',').join(', ')+'<br>' : '';
		s += entity.vuln ? '<div class="monDetail">Weak:</div>'+entity.vuln.split(',').join(', ')+'<br>' : '';
		let p = '';
		if( entity.perkList ) {
			Object.each(entity.perkList, perk => {
				if( perk.dead ) {
					return;
				}
				if( !p ) {
					p += '<span>PERKS</span><br>';
				}
				let allow = Perk.allow(perk,{source:entity}) ? '' : ' class="notAllowed"';
				p += '<span'+allow+'>'+perk.name+'</span><br>';
			});
		}
		s += p;
		if( !entity.isUser() ) {
			s += debug ? (entity.history[0]||'')+(entity.history[1]||'')+(entity.history[2]||'') : '';
//			$('#guiPathDebugSummary').html(entity.path ? JSON.stringify(entity.path.status) : 'No Path');
//			$('#guiPathDebug').html(entity.path ? entity.path.render().join('\n') : '');
			$(this.infoDivId).addClass('monColor');
		}
		else {
			let healthRatio = entity.health/entity.healthMax;
			if( healthRatio < 0.15 ) {
				$(this.infoDivId).addClass('healthCritical');
			}
			else
			if( healthRatio < 0.35 ) {
				$(this.infoDivId).addClass('healthWarn');
			}
		}
		$(this.infoDivId).show().append(s);

	}

}


return {
	ViewInfo: ViewInfo
}

});
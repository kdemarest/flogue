Module.add('viewInventory',function() {

class ViewInventory extends ViewObserver {
	constructor(inventoryDivId,onItemChoose,colFilter) {
		super();
		this.inventoryDivId = inventoryDivId;
		$(this.inventoryDivId).empty();

		this.onItemChoose = this.onItemChoose || onItemChoose;
		this.inventory = null;
		this.inventoryFn = null;
		this.inventorySelector = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		this.everSeen = {};
		this.allowFilter = null;
		this.filterId = '';
		this.inventoryFn = null;
		this.visibleFn = null;
		this.colFilter = colFilter || {slot:1,key:1,icon:1,description:1,armor:1,damage:1,bonus:1,charges:1};
		this.sortColId = 'icon';
		this.sortAscending = true;
	}
	getItemByKey(keyPressed) {
		let n = this.inventorySelector.indexOf(keyPressed);
		if( n>=0 && n<this.inventory.count ) {
			return this.inventory.all[n];
		}
		return null;
	}
	prime(inventoryFn,allowFilter,visibleFn) {
		this.allowFilter = allowFilter;
		this.inventoryFn = inventoryFn;
		this.visibleFn = visibleFn;
		return this.div.is(":visible");
	}
	get div() {
		return $(this.inventoryDivId);
	}
	_hide() {
		if( this.userSawInventory ) {
			for( let i=0 ; i<this.inventory.all.length ; ++i ) {
				this.everSeen[this.inventory.all[i].id]=true;
			}
			this.userSawInventory = false;
		}
		this.div.hide();
	}
	message( msg, payload ) {
		super.message(msg,payload);
		if( msg == 'resize' ) {
			Gui.layout( {
				'#guiInventory': {
					height: self => $(window).height() - self.offset().top
				},
				'#guiInventory .invBody': {
					height: self => $(window).height() - self.offset().top
				},
				'#guiInventory .invBodyScroll': {
					height: self => $(window).height() - self.offset().top
				}
			});
			$('#guiInventory .invBodyScroll').scrollTop(this.scrollPos);
		}
	}

	render() {

		function sortOrder(a,b,sortDir,...fields) {
			function compare() {
				let fieldId;
				while( fieldId = fields.shift() ) {
					//f += fieldId+' ';
					let af = a[fieldId];
					let bf = b[fieldId]
					if( window.aa && (a.armor !== '' || b.armor !== '') ) debugger;
					if( !fieldId ) debugger;
					let afNul = !!(af === undefined || af === '');
					let bfNul = !!(bf === undefined || bf === '');
					if( afNul && !bfNul ) {
						//console.log( "a blank" );
						// WARNING! This is tricky. It must always return sortDir
						return sortDir;
					}
					if( !afNul && bfNul ) {
						//console.log( "b blank" );
						// WARNING! This is tricky. It must always return negative sortDir
						return -sortDir;
					}

					if( afNul !== bfNul ) {
						// If one or the other is blank, then we want to sort such things to the bottom.
						//	return -sortDir;
					}
					if( afNul && bfNul ) {
						//console.log( "both blank" );
						continue;
					}
					af = sortIsNumeric[fieldId] ? parseFloat(af) : af;
					bf = sortIsNumeric[fieldId] ? parseFloat(bf) : bf;
					if( af < bf ) return -1;
					if( af > bf ) return 1;
				}
				// The id comparisons add sorting stability, most noticeable in the crafting screen.
				if( a.id < b.id ) return -1;
				if( a.id > b.id ) return 1;
				return 0;
			}
			//let f = '';
			let n = compare();
			//console.log(f+': '+n);
			return n;
		}

		function doSort(inventory,explainFn,sortFn,asc) {
			let colData = inventory.arrayMap( item => explainFn(item) );
			let sortDir = asc ? 1 : -1;
			colData.sort( (a,b) => {
//				console.log( "Comparing "+a.name+" vs "+b.name );
				return sortFn(a,b,sortDir)*sortDir ;
			});
			return colData.map( ex => ex.item );
		}

		function icon(file) {
			return '<img src="'+IMG_BASE+'gui/icons/'+file+'">';
		}

		function colJoin( colFilter, colList, afterFn ) {
			let s = '';
			Object.each(colFilter, (ok,colId) => {
				if( ok ) {
					s += colList[colId].replace( /<\/td>/, function(token) {
						return (afterFn?afterFn(colId):'') + '</td>';
					});
				}
			});
			return s;
		}

		function td(spc,cls,text) {
			let c = spc||cls ? (' class="'+(spc?'invSpacer':'')+(spc&&cls?' ':'')+(cls?cls:'')+'"') : '';
			return '<td'+c+'>'+text+'</td>';
		}

		let observer = this.observer;

		if( !this.visibleFn || !this.visibleFn() ) {
			this._hide();
			return;
		}

		console.assert( this.div[0] );
		
		this.inventoryRaw = this.inventoryFn().isReal();
		if( this.allowFilter && this.filterId ) {
			let filterId = this.filterId;
			this.inventoryRaw.filter( item => ItemFilterGroup[filterId].includes(item.typeId) );
		}

		this.inventory = new Finder(this.inventoryRaw.all);
		let self = this;

		let cat = $('<div class="invCategories"></div>');
		if( this.allowFilter ) {
			$(document).off( '.ItemFilter' );
			ItemFilterOrder.map( filterId => {
				let typeIcon =  $(icon( filterId=='' ? 'all.png' : ItemTypeList[filterId].icon ));
				typeIcon.appendTo(cat)
				if( self.allowFilter && self.filterId==filterId ) {
					typeIcon.addClass('iconLit');
				}
				typeIcon.on( 'click.ItemFilter', null, function() {
					$('.invCategories img').removeClass('iconLit');
					self.filterId = filterId;
					self.render();
				})
				.appendTo(cat);
			});
		}

		let headerDiv = $('<div></div>');
		if( this.headerComponent ) {
			this.headerComponent(headerDiv);
		}

		let colHead = {
			slot: 			'<td class="invSlot"></td>',
			key: 			'<td class="invKey"></td>',
			icon: 			'<td class="invIcon right"></td>',
			description: 	'<td class="invDescription">Description</td>',
			armor: 			'<td class="invArmor">Armor</td>',
			damage: 		'<td class="invDamage"colspan="2">Damage</td>',
			bonus: 			'<td class="invBonus right">Bonus</td>',
			charges: 		'<td class="invCharges right">Chg</td>',
			price: 			'<td class="invPrice right">Price</td>'
		}

		let sortFn = {
			icon: 			(a,b,sortDir) => sortOrder(a,b,sortDir,'typeOrder','name'),
			description: 	(a,b,sortDir) => sortOrder(a,b,sortDir,'name'),
			armor: 			(a,b,sortDir) => sortOrder(a,b,sortDir,'armor','typeOrder','name'),
			damage: 		(a,b,sortDir) => sortOrder(a,b,sortDir,'damage','typeOrder','name'),
			bonus: 			(a,b,sortDir) => sortOrder(a,b,sortDir,'bonus','typeOrder','name'),
			charges: 		(a,b,sortDir) => sortOrder(a,b,sortDir,'recharge','typeOrder','name'),
			price: 			(a,b,sortDir) => sortOrder(a,b,sortDir,'price','name'),
		}

		let sortIsNumeric = { armor:1, damage:1, recharge:1, price:1 };

		let sortDirectionDefault = {
			icon: true,
			description: true,
			armor: false,
			damage: false,
			bonus: false,
			charges: false,
			price: false
		}

		let invBody = $('<div class="invBody"></div>');

		let sortIcon = '<img src="'+IMG_BASE+StickerList[this.sortAscending?'sortAscending':'sortDescending'].img+'">';
		let tHeadContent = (hide) => {
			return '<thead style="'+(hide?'visibility:hidden;':'')+'"><tr>'+colJoin(this.colFilter,colHead,colId=>self.sortColId==colId ? sortIcon : '')+'</tr></thead>';
		};
		let tableFixed = $( '<table class="inv" style="z-index: 101;"></table>' ).appendTo(invBody);
		let tHeadFixed = $(tHeadContent(false))
			.appendTo(tableFixed)
			.click( function(e) {
				let parts = e.target.className.match( /inv(\S+)/ );
				if( !parts ) {
					parts = $(e.target).parent().attr("class").match( /inv(\S+)/ );
				}
				let last = self.sortColId;
				let next = (parts[1] || '').toLowerCase();
				if( sortFn[next] ) {
					self.sortColId = next;
					self.sortAscending = self.sortColId !== last ? sortDirectionDefault[next] : !self.sortAscending;
					self.render();
				}
			});

		let invBodyScroll = $('<div class="invBodyScroll"></div>')
			.appendTo(invBody)
			.scroll( function() {
				self.scrollPos = $(this).scrollTop();
			});

		let table = $( '<table class="inv"></table>' ).appendTo(invBodyScroll);
		let tHead = $(tHeadContent(true))
			.appendTo(table);

		$(this.div).empty();
		if( headerDiv ) $(headerDiv).appendTo(this.div);
		if( cat ) $(cat).appendTo(this.div);
		$(invBody).appendTo(this.div);
		setTimeout( () => {
			$('thead',table).css( 'visibility', 'hidden' );
			let real = $('thead tr td',table);
			let fixed = $('thead tr td',tableFixed);
			for( let index=0 ; index < real.length ; ++index ) {
				$(real[index]).width( $(real[index]).width()+'px' );
				$(fixed[index]).width( $(real[index]).width()+'px' );
			}
			$(real).empty();
		}, 1 );


		let tBody = $('<tbody></tbody>').appendTo(table);
		let lastTypeId = '';

		//console.log("Sorting by "+this.sortColId);
		this.inventory.result = doSort(
			this.inventory,
			item => item.explain(this.mode,observer),
			sortFn[this.sortColId||'description'],
			this.sortAscending
		);

		for( let i=0 ; i<this.inventory.count ; ++i ) {
			let item = this.inventory.all[i];
			let ex = item.explain(this.mode,observer);

			let cell = {};
			let spc = this.sortColId == 'icon' && lastTypeId && lastTypeId!=item.typeId;
			lastTypeId = item.typeId;;

			cell.slot = td( spc, 'slotSpacer', 
				(item.inSlot ? icon('marked.png') : 
				(item.slot ? icon('unmarked.png') : 
				(!this.everSeen[item.id]?'<span class="newItem">NEW</span>' : ''
				)))
			);
			cell.key  			= td( spc, 'right', this.inventorySelector.charAt(i)+'.' );
			cell.icon 			= td( spc, '', ex.icon );
			cell.description 	= td( spc, '', String.combine(' ',ex.description,ex.reach,ex.aoe,ex.rechargeLeft) );
			cell.armor 			= td( spc, 'ctr', ex.armor );
			cell.damage 		= td( spc, 'right', ex.damage ) + td( spc, '', ex.damageType );
			cell.bonus 			= td( spc, 'right', ex.bonus );
			cell.charges 		= td( spc, 'ctr', ex.recharge || '&nbsp;' );
			cell.price 			= td( spc, 'right'+(this.mode=='buy' && ex.price>this.observer.coinCount?' tooExpensive':''), ex.priceWithCommas || '&nbsp;' );

			let s = '<tr>'+colJoin(this.colFilter,cell)+'</tr>';

			$(s).appendTo(tBody).click( event => {
				event.commandItem = item;
				this.onItemChoose(event);
			})
			.mouseover( event => {
				//console.log( 'ViewInventory mouseover' );
				guiMessage( 'show', item );
				guiMessage( 'favoriteCandidate', item );
				$("#favMessage").html("Press 0-9 to favorite");
			})
			.mouseout( event => {
				guiMessage( 'hide' );
				guiMessage( 'favoriteCandidate', null );
			});
		}
		if( !this.inventory.count ) {
			$("<tr><td colspan=4>Pick up some items by walking upon them.</td></tr>").appendTo(tBody);
		}
		this.userSawInventory = true;
		this.div.show();
		setTimeout( () => guiMessage('resize'), 1 );
	}
}

return {
	ViewInventory: ViewInventory
}

});

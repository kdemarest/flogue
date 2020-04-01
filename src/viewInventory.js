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

		this.heightHelper = { height: self => $(window).height() - self.offset().top };

		$(this.inventoryDivId).append('<div class="invCategories"></div>');
		$(this.inventoryDivId).append('<div class="invHeader"></div>');
		$(this.inventoryDivId).append('<div class="invSecret" style="visibility:hidden; position: absolute;"></div>');
		$(this.inventoryDivId).append('<div class="invBody"></div>');
	}

	selector(affix) {
		return this.inventoryDivId+affix;
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
	divId(innerDivId) {
		return this.inventoryDivId+innerDivId;
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
	doLayout() {
		let layout = {};
		layout[this.selector('')]					= this.heightHelper;
		layout[this.selector(' .invBody')]			= this.heightHelper;
		layout[this.selector(' .invBodyScroll')]	= this.heightHelper;
		Gui.layout(layout);
		$(this.selector(' .invBodyScroll')).scrollTop(this.scrollPos);
	}
	message( msg, payload ) {
		super.message(msg,payload);
		if( msg == 'resize' ) {
			this.doLayout();
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
			return compare();
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

		let generateCategories = ( allowFilter, isFilterFn, renderFn ) => {
			let cat = $('<div></div>');
			if( allowFilter ) {
				$(document).off( '.ItemFilter' );
				ItemFilterOrder.map( filterId => {
					let typeIcon =  $(icon( filterId=='' ? 'all.png' : ItemTypeList[filterId].icon ));
					if( allowFilter && isFilterFn(filterId) ) {
						typeIcon.addClass('iconLit');
					}
					typeIcon.on( 'click.ItemFilter', null, function() {
						$('#'+this.invCategories+' img').removeClass('iconLit');
						renderFn(filterId);
					});
					typeIcon.appendTo(cat);
				});
			}
			return cat;
		}

		let generateCellValues = ( observer, item, ex, sortColId, letter, isNew, mode) => {
			let exDescription = String.combine(
				' ',
				ex.description,
				ex.reach,
				ex.aoe,
				ex.permuteDesc?'<span class="statNotice">'+ex.permuteDesc+'</span>':'',
				ex.rechargeLeft
			);
			let exSlot =(!observer.isUser() ? '' :
				(item.inSlot ? icon('marked.png') : 
				(item.slot ? icon('unmarked.png') : 
				(!isNew?'<span class="newItem">NEW</span>' : ''
				))));

			let spc = sortColId == 'icon' && lastTypeId && lastTypeId!=item.typeId;
			lastTypeId = item.typeId;;

			let cell = {};
			cell.slot			= td( spc, 'slotSpacer', exSlot );
			cell.key  			= td( spc, 'right', letter+'.' );
			cell.icon 			= td( spc, '', ex.icon );
			cell.description 	= td( spc, '', exDescription );
			cell.armor 			= td( spc, 'ctr', ex.armor );
			cell.damage 		= td( spc, 'right', ex.damage ) + td( spc, '', ex.damageType );
			cell.bonus 			= td( spc, 'right', ex.bonus );
			cell.charges 		= td( spc, 'ctr', ex.recharge || '&nbsp;' );
			cell.price 			= td( spc, 'right'+(mode=='buy' && ex.price>observer.coinCount?' tooExpensive':''), ex.priceWithCommas || '&nbsp;' );

			return cell;
		}

		let generateHeadContent = (hide) => {
			return '<thead style="'+(hide?'visibility:collapse;':'')+'">'+
			'<tr>'+
			colJoin(this.colFilter,colHead,colId=>self.sortColId==colId ? sortIcon : '')+
			'</tr>'+
			'</thead>';
		};

		let adjustColumnWidths = (table,tableFixed) => {
			let real = $('thead tr td',table);
			let fixed = $('thead tr td',tableFixed);
			for( let index=0 ; index < real.length ; ++index ) {
				console.log(index,$(real[index]).width());
				$(real[index]).width( $(real[index]).width()+'px' );
			}
			// This is done separately because we need to know what the
			// column widths REALLY became, from the browser layout engine.
			for( let index=0 ; index < real.length ; ++index ) {
				console.log(index,$(real[index]).width());
				$(fixed[index]).width( $(real[index]).width()+'px' );
			}
		};

		let onClickHead = (e) => {
			let parts = e.target.className.match( /inv(\S+)/ );
			if( !parts ) {
				if( !$(e.target).parent().attr("class") ) {
					return;
				}
				parts = $(e.target).parent().attr("class").match( /inv(\S+)/ );
			}
			let last = this.sortColId;
			let next = (parts[1] || '').toLowerCase();
			if( sortFn[next] ) {
				this.sortColId = next;
				this.sortAscending = this.sortColId !== last ? sortDirectionDefault[next] : !this.sortAscending;
				this.render();
			}
		}

		let onScrollBody = function() {
			self.scrollPos = $(this).scrollTop();
		}

		let onClickBody = (event,item) => {
			event.commandItem = item;
			this.onItemChoose(event);
		}

		let onMouseoverBody = (event,item) => {
			//console.log( 'ViewInventory mouseover' );
			guiMessage( 'show', item );
			guiMessage( 'favoriteCandidate', item );
			$("#favMessage").html("Press 0-9 to favorite");
		}

		let onMouseoutBody = (event,item) =>{
			guiMessage( 'hide' );
			guiMessage( 'favoriteCandidate', null );
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

		class Ghost {
			constructor() {
				this.cache = {};
			}
			render(source,target) {
				let targetContent = $(target).html();
				let sourceContent = '<div>'+$(source).html()+'</div>';
				if( targetContent != sourceContent ) {
					$(target).empty();
					$(source).appendTo(target);
				}
			}
		}

		//
		// Function start
		//


		if( !this.visibleFn || !this.visibleFn() ) {
			this._hide();
			return;
		}

		let ghost = new Ghost();
		let self = this;
		let observer = this.observer;

		console.assert( this.div[0] );
		
		this.inventoryRaw = this.inventoryFn().isReal(true);
		if( this.allowFilter && this.filterId ) {
			this.inventoryRaw.filter( item => ItemFilterGroup[this.filterId].includes(item.typeId) );
		}

		this.inventory = new Finder(this.inventoryRaw.all);


		//
		// Categories
		//
		let catDiv = generateCategories(
			this.allowFilter,
			(filterId) => this.filterId==filterId,
			(filterId) => { this.filterId=filterId; this.render(); }
		);
		ghost.render( catDiv, this.selector(' .invCategories') );

		//
		// Middle Header
		// For use by subclasses
		//
		let headerDiv = $('<div></div>');
		if( this.headerComponent ) {
			this.headerComponent(headerDiv);
		}
		ghost.render( headerDiv, this.selector(' .invHeader') );

		//
		// Inventory
		//
		let divBody = $('<div></div>');

		let sortIcon   = '<img src="'+IMG_BASE+StickerList[this.sortAscending?'sortAscending':'sortDescending'].img+'">';

		//
		// Table Fixed Header
		// Contains the visible header, that never scrolls
		//
		let tableFixed = $( '<table class="inv" style="z-index: 101;"></table>' ).appendTo(divBody);
		let tHeadFixed = $(generateHeadContent(false))
			.appendTo(tableFixed)
			.click( onClickHead )

		//
		// Scrollable Div
		// Contains the actual data with a hidden header
		//
		let divBodyScroll = $('<div class="invBodyScroll"></div>')
			.appendTo(divBody)
			.scroll( onScrollBody );

		// The crazy invSecret stuff makes an invisible table so that we can let HTML
		// adjust column sizes. Then we manage the column widths, and move its contents into
		// the visible div invBody at the last moment.

		$(this.selector(' .invSecret')).show().empty();
		ghost.render( divBody, this.selector(' .invSecret') );

		//
		// Table Scrollable Header
		//
		let table = $( '<table class="inv"></table>' ).appendTo(divBodyScroll);
		let tHead = $(generateHeadContent(true)).appendTo(table);
		adjustColumnWidths(table,tableFixed);

		//
		// Table Scrollable Body
		//
		let tBody = $('<tbody></tbody>').appendTo(table);
		let lastTypeId = '';

		this.inventory.result = doSort(
			this.inventory,
			item => item.explain(this.mode,observer),
			sortFn[this.sortColId||'description'],
			this.sortAscending
		);

		for( let i=0 ; i<this.inventory.count ; ++i ) {
			let item = this.inventory.all[i];
			let ex   = item.explain(this.mode,observer);
			let cell = generateCellValues( observer, item, ex, this.sortColId, this.inventorySelector.charAt(i), this.everSeen[item.id], this.mode );
			let s    = '<tr>'+colJoin(this.colFilter,cell)+'</tr>';

			$(s).appendTo(tBody)
				.click(		event => onClickBody(event,item) )
				.mouseover(	event => onMouseoverBody(event,item) )
				.mouseout(	event => onMouseoutBody(event,item) )
			;
		}
		if( !this.inventory.count ) {
			$("<tr><td colspan=4>Pick up some items by walking upon them.</td></tr>").appendTo(tBody);
		}
		this.userSawInventory = true;

		// We can hid invSecret now because we've gotten the results of its layout exercise.
		$(this.selector(' .invSecret')).hide();
		ghost.render( divBody, this.selector(' .invBody') );
		this.div.show();

		// So this is weird. Apparently, until you ACTUALLY show the div, you don't have 
		// your final column widths and table height and so on.
		adjustColumnWidths(table,tableFixed);
		this.doLayout();

		// And even worse, the heights are deceptive until you've actually rendered.
		// And still worse, doing the render on the very next frame didn't work. Only
		// when I gave it a fill second did the scroll bar properly adjust to screen bottom.
		setTimeout( () => this.doLayout(), 1000 );
	}
}

return {
	ViewInventory: ViewInventory
}

});



class ViewInventory extends ViewObserver {
	constructor(inventoryDivId,imageRepo,onItemChoose,colFilter) {
		super();
		this.inventoryDivId = inventoryDivId;
		this.imageRepo = imageRepo;
		this.onItemChoose = this.onItemChoose || onItemChoose;
		this.inventory = null;
		this.inventoryFn = null;
		this.inventorySelector = '123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
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
		return $('#'+this.inventoryDivId);
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
	render() {

		function sortOrder(a,b,...fields) {
			let fieldId;
			while( fieldId = fields.shift() ) {
				let af = !fieldId ? '' : a[fieldId];
				let bf = !fieldId ? '' : b[fieldId];
				if( af < bf ) return -1;
				if( af > bf ) return 1;
			}
			return 0;
		}

		function doSort(inventory,explainFn,sortFn,asc) {
			let colData = inventory.arrayMap( item => explainFn(item) );
			let sortDir = asc ? 1 : -1;
			colData.sort( (a,b) => sortFn(a,b)*sortDir );
			return colData.map( ex => ex.item );
		}

		function icon(file) {
			return '<img src="tiles/gui/icons/'+file+'">';
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

		function qq(array) {
			let s = [];
			array.forEach( a => s.push(a.name) );
			return s;
		}

		let observer = this.observer;

		if( !this.visibleFn || !this.visibleFn() ) {
			this._hide();
			return;
		}

		this.inventoryRaw = this.inventoryFn().isReal();
		if( this.allowFilter && this.filterId ) {
			let filterId = this.filterId;
			this.inventoryRaw.filter( item => ItemFilterGroup[filterId].includes(item.typeId) );
		}

		this.inventory = new Finder(this.inventoryRaw.all);
/*
		this.inventoryRaw.process( item => {
			let sid = item.name+'&'+item.inSlot;
			if( !item.inSlot ) {
				let other = this.inventory.find( item => item._sid==sid );
				if( other ) {
					other.bunch++;
					return;
				}
			}
			item._sid = sid;
			item.bunch = 1;
			this.inventory.all.push(item);
		});
*/
		let self = this;
		$(this.div).empty();

		let cat = $('<div class="invCategories"></div>').appendTo(this.div);
		if( this.allowFilter ) {
			$(document).off( '.ItemFilter' );
			ItemFilterOrder.map( filterId => {
				let typeIcon =  $(icon( filterId=='' ? 'all.png' : ItemTypeList[filterId].icon ));
				typeIcon.appendTo(this.div)
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

		if( this.headerComponent ) {
			this.headerComponent().appendTo(this.div);
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
			icon: 			(a,b) => sortOrder(a,b,'typeOrder','name'),
			description: 	(a,b) => sortOrder(a,b,'name'),
			armor: 			(a,b) => sortOrder(a,b,'armor','typeOrder','name'),
			damage: 		(a,b) => sortOrder(a,b,'damage','typeOrder','name'),
			bonus: 			(a,b) => sortOrder(a,b,'bonus','typeOrder','name'),
			charges: 		(a,b) => sortOrder(a,b,'recharge','typeOrder','name'),
			price: 			(a,b) => sortOrder(a,b,'price','name'),
		}

		let sortDirectionDefault = {
			icon: true,
			description: true,
			armor: false,
			damage: false,
			bonus: false,
			charges: false,
			price: false
		}


		let table = $( '<table class="inv"></table>' ).appendTo(this.div);
		let sortIcon = '<img src="tiles/'+StickerList[this.sortAscending?'sortAscending':'sortDescending'].img+'">';

		let tHead = $('<thead><tr>'+colJoin(this.colFilter,colHead,colId=>self.sortColId==colId ? sortIcon : '')+'</tr></thead>' )
			.appendTo(table)
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
			})
			.mouseover( function(e) {

			});
		let tBody = $('<tbody></tbody>').appendTo(table);
		let lastTypeId = '';

		this.inventory.result = doSort(
			this.inventory,
			item => itemExplain(item,this.mode),
			sortFn[this.sortColId||'description'],
			this.sortAscending
		);

		for( let i=0 ; i<this.inventory.count ; ++i ) {
			let item = this.inventory.all[i];
			let ex = itemExplain(item,this.mode);

			let cell = {};
			let spc = this.sortColId == 'icon' && lastTypeId && lastTypeId!=item.typeId;
			lastTypeId = item.typeId;;

			cell.slot = td( spc, '', 
				(item.inSlot ? icon('marked.png') : 
				(item.slot ? icon('unmarked.png') : 
				(!this.everSeen[item.id]?'<span class="newItem">NEW</span>' : ''
				)))
			);
			cell.key  			= td( spc, 'right', this.inventorySelector.charAt(i)+'.' );
			cell.icon 			= td( spc, '', ex.icon );
			cell.description 	= td( spc, '', ex.description+ex.aoe );
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
				console.log( 'ViewInventory mouseover' );
				guiMessage( 'show', item );
			})
			.mouseout( event => {
				guiMessage( 'hide' );
			});
		}
		if( !this.inventory.count ) {
			$("<tr><td colspan=4>Pick up some items by walking upon them.</td></tr>").appendTo(tBody);
		}
		this.userSawInventory = true;
		this.div.show();
	}
}

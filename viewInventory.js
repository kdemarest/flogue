

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
		function order(typeId) {
			return String.fromCharCode(64+ItemSortOrder.indexOf(typeId));
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

		this.inventoryRaw.all.sort( function(a,b) { 
			let as = order(a.typeId)+' '+a.name;
			let bs = order(b.typeId)+' '+b.name;
			if( as < bs ) return -1;
			if( as > bs ) return 1;
			return 0;
		});

		this.inventory = new Finder([]);
		this.inventoryRaw.process( item => {
			let sid = item.name+'&'+item.inSlot;
			if( !item.inSlot ) {
				let other = this.inventory.find( item => item._sid==sid );
				if( other ) {
					other._count++;
					return;
				}
			}
			item._sid = sid;
			item._count = 1;
			this.inventory.all.push(item);
		});


		function icon(file) {
			return '<img src="tiles/gui/icons/'+file+'">';
		}

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

		function colJoin( colList ) {
			let s = '';
			Object.each(self.colFilter, (ok,col) => {
				if( ok ) { s += colList[col]; }
			});
			return s;
		}

		function td(spc,cls,text) {
			let c = spc||cls ? (' class="'+(spc?'invSpacer':'')+(spc&&cls?' ':'')+(cls?cls:'')+'"') : '';
			return '<td'+c+'>'+text+'</td>';
		}



		let colHead = {
			slot: 			'<td></td>',
			key: 			'<td></td>',
			icon: 			'<td class="right"></td>',
			description: 	'<td>Description</td>',
			armor: 			'<td>Armor</td>',
			damage: 		'<td colspan="2">Damage</td>',
			bonus: 			'<td class="right">Bonus</td>',
			charges: 		'<td class="right">Chg</td>',
			price: 			'<td class="right">Price</td>'
		};


		let table = $( '<table class="inv"></table>' ).appendTo(this.div);
		let tHead = $('<thead><tr>'+colJoin(colHead)+'</tr></thead>' ).appendTo(table);
		let tBody = $('<tbody></tbody>').appendTo(table);
		let lastTypeId = '';


		for( let i=0 ; i<this.inventory.count ; ++i ) {
			let item = this.inventory.all[i];
			let ex = itemExplain(item,this.mode);

			let cell = {};
			let spc = lastTypeId && lastTypeId!=item.typeId;
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
			cell.price 			= td( spc, 'right'+(ex.price>this.observer.coinCount?' tooExpensive':''), ex.price || '&nbsp;' );

			let s = '<tr>'+colJoin(cell)+'</tr>';

			$(s).appendTo(tBody).click( event => {
				event.commandItem = item;
				this.onItemChoose(event);
			})
			.mouseover( event => {
				guiMessage(null,'show',item);
			})
			.mouseout( event => {
				guiMessage(null,'hide');
			});
		}
		if( !this.inventory.count ) {
			$("<tr><td colspan=4>Pick up some items by walking upon them.</td></tr>").appendTo(tBody);
		}
		this.userSawInventory = true;
		this.div.show();
	}
}

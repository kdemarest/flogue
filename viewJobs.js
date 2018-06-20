
class ViewMerchant extends ViewInventory {
	constructor(p) {
		super(p.divId,p.imageRepo,null,p.colFilter);
		let self = this;
		this.onItemChoose = this._onItemChoose.bind(this);
		this.onEvent = p.onItemChoose;
		this.buyTest = p.buyTest
		this.merchant = p.entity;
		this.onClose = p.onClose;
		this.allowFilter = p.allowFilter;
		this.mode = null;
		$(document).on( 'keydown.ViewMerchant', null, this.onKeyDown.bind(this) );
	}
	onKeyDown(e) {
		if( e.key == 'Escape' ) {
			this.hide();
			e.stopPropagation();
			return;
		}
		if( e.key == 'Tab' ) {
			this.setMode('toggle');
			e.stopPropagation();
			e.preventDefault();
			return false;
		}
		let item = this.getItemByKey(e.key);
		if( item ) {
			e.commandItem = item;
			this.onItemChoose(e);
		}
	}
	setMode(mode) {
		if( mode == 'toggle' ) {
			mode = this.mode=='buy' ? 'sell' : 'buy';
		}
		let filterFn = (mode=='buy' ?
			() => new Finder(this.merchant.inventory) :
			() => new Finder(this.observer.inventory).filter( this.buyTest )
		);
		this.prime( filterFn, this.allowFilter, () => true );
		this.mode = mode;
		return this;
	}
	hide() {
		this.div.hide();
		$(document).off( '.ViewMerchant' );
		this.onClose();
		delete this;
	}
	_onItemChoose(event) {
		event.command = this.mode == 'buy' ? Command.BUY : Command.SELL;
		event.commandTarget = this.merchant;
		this.onEvent(event);
	}
	headerComponent() {
		let element = $('<div class="merchant">'+String.capitalize(this.observer.name)+' <span class="merchantOp"></span> '+this.merchant.name+'</div>');
		$(element).find('.merchantOp').on( 'click.ViewMerchant', null, () => {
			this.setMode('toggle').render();
		});
		$(element).find('.merchantOp').html( this.mode=='buy' ? '<- BUYING FROM <-' : '-> SELLING TO ->' );
		return element;

	}
	render() {
		if( !this.mode ) {
			this.setMode('buy');
		}
		super.render();
	}
	tick() {
	}
}
DynamicViewList['brewer'] = viewParams => {
	let p = Object.assign( {}, viewParams, {
		buyTest: item => item.isPotion || item.isStuff,
		colFilter: {slot:1,key:1,icon:1,description:1,price:1},
		allowFilter: false
	});
	return new ViewMerchant(p);
}

DynamicViewList['armorer'] = viewParams => {
	let p = Object.assign( {}, viewParams, {
		buyTest: item => item.isWeapon || item.isArmor,
		colFilter: {slot:1,key:1,icon:1,description:1,armor:1,damage:1,bonus:1,charges:1,price:1},
		allowFilter: true
	});
	return new ViewMerchant(p);
}

DynamicViewList['lapidary'] = viewParams => {
	let p = Object.assign( {}, viewParams, {
		buyTest: item => item.isGem,
		colFilter: {slot:1,key:1,icon:1,description:1,bonus:1,price:1},
		allowFilter: false
	});
	return new ViewMerchant(p);
}

DynamicViewList['jeweler'] = viewParams => {
	let p = Object.assign( {}, viewParams, {
		buyTest: item => item.isRing,
		colFilter: {slot:1,key:1,icon:1,description:1,bonus:1,price:1},
		allowFilter: false
	});
	return new ViewMerchant(p);
}

//DynamicViewList['smith'] = viewParams => new ViewMerchant(viewParams);
//DynamicViewList['brewer'] = viewParams => new ViewMerchant(viewParams);
//DynamicViewList['scribe'] = viewParams => new ViewMerchant(viewParams);
//DynamicViewList[''] = viewParams => new ViewMerchant(viewParams);

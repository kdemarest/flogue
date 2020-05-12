Module.add('viewMerchant',function() {

class ViewMerchant extends ViewInventory {
	constructor(p) {
		let colFilter = p.colFilter || p.entity.colFilter;
		super('#guiMerchant',null,colFilter);
		this.colFilter.price = 1;
		this.merchant = p.merchant;
		//this.buyTest = p.buyTest || p.entity.buyTest;
		this.allowFilter = p.allowFilter || p.entity.allowFilter;
		this.mode = null;
		Gui.keyHandler.add( 'ViewMerchant', this.onKeyDown.bind(this) );

		guiMessage( 'clearSign' );
		guiMessage( 'hideInfo', { from: 'viewMerchant' } );
	}
	onOpen(entity) {
		guiMessage('zoomPush',{zoom:5});
	}
	onClose() {
		guiMessage('zoomPop');
	}
	onItemChoose(event,item) {
		event.commandItem = item;
		event.command = this.mode == 'buy' ? Command.BUY : Command.SELL;
		event.commandTarget = this.merchant;
		return guiMessage('command',event);
	}
	onKeyDown(event) {
		if( event.key == 'Escape' ) {
			this.hide();
			return false;
		}
		if( event.key == 'Tab' ) {
			this.setMode('toggle');
			return false;
		}
		let item = this.getItemByKey(event.key);
		if( item ) {
			this.onItemChoose(event,item);
		}
		return false;
	}
	setMode(mode) {
		if( mode == 'toggle' ) {
			mode = this.mode=='buy' ? 'sell' : 'buy';
		}
		let filterFn = (mode=='buy' ?
			() => new Finder(this.merchant.inventory) :
			() => new Finder(this.observer.inventory).filter( this.merchant.buyTest )
		);
		this.prime( filterFn, this.allowFilter, () => true );
		this.mode = mode;
		this.dirty = true;
		return this;
	}
	hide() {
		$('#guiNarrative').removeClass('dim');
		this.div.hide();
		$(document).off( '.ViewMerchant' );
		Gui.remove(this);
	}
	headerComponent(div) {
		let element = $('<div class="merchant">'+String.capitalize(this.observer.name)+' <span class="merchantOp"></span> '+this.merchant.name+' the '+String.capitalize(this.merchant.jobId)+'</div>');
		$(element).find('.merchantOp').on( 'click.ViewMerchant', null, () => {
			this.setMode('toggle');
		});
		$(element).find('.merchantOp').html( this.mode=='buy' ? '<- BUYING FROM <-' : '-> SELLING TO ->' );
		element.appendTo(div);
	}
	message( msg, payload ) {
		super.message(msg,payload);
		if( msg == 'inventoryChange' && payload == this.observer ) {
			this.dirty = true;
		}
	}
	render() {
		if( !this.mode ) {
			this.setMode('buy');
		}
		$('#guiNarrative').removeClass('dim');
		$('#guiNarrative').addClass('dim');
		super.render();
	}
	tick(dt) {
		super.tick(dt);
	}
}

return {
	ViewMerchant: ViewMerchant
}

});

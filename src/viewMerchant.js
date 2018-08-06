Module.add('viewMerchant',function() {

class ViewMerchant extends ViewInventory {
	constructor(p) {
		super('#guiMerchant',null,p.colFilter || p.entity.colFilter);
		this.onEvent = p.onItemChoose;
		this.merchant = p.entity;
		//this.buyTest = p.buyTest || p.entity.buyTest;
		this.allowFilter = p.allowFilter || p.entity.allowFilter;
		this.onClose = p.onClose;
		this.mode = null;
		$(document).on( 'keydown.ViewMerchant', null, this.onKeyDown.bind(this) );

		guiMessage('clearSign');
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
			() => new Finder(this.observer.inventory).filter( this.merchant.buyTest )
		);
		this.prime( filterFn, this.allowFilter, () => true );
		this.mode = mode;
		return this;
	}
	hide() {
		$('#guiNarrative').removeClass('dim');
		this.div.hide();
		$(document).off( '.ViewMerchant' );
		this.onClose();
		delete this;
	}
	onItemChoose(event) {
		event.command = this.mode == 'buy' ? Command.BUY : Command.SELL;
		event.commandTarget = this.merchant;
		this.onEvent(event);
	}
	headerComponent(div) {
		let element = $('<div class="merchant">'+String.capitalize(this.observer.name)+' <span class="merchantOp"></span> '+this.merchant.name+' the '+String.capitalize(this.merchant.jobId)+'</div>');
		$(element).find('.merchantOp').on( 'click.ViewMerchant', null, () => {
			this.setMode('toggle').render();
		});
		$(element).find('.merchantOp').html( this.mode=='buy' ? '<- BUYING FROM <-' : '-> SELLING TO ->' );
		element.appendTo(div);
	}
	message( msg, payload ) {
		super.message(msg,payload);
		if( msg == 'resize' ) {
			Gui.layout( {
				'#guiMerchant': {
					height: self => $(window).height() - self.offset().top
				},
				'#guiMerchant .invBody': {
					height: self => $(window).height() - self.offset().top
				},
				'#guiMerchant .invBodyScroll': {
					height: self => $(window).height() - self.offset().top
				}
			});
			$('#guiMerchant .invBodyScroll').scrollTop(this.scrollPos);
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
	tick() {
	}
}

return {
	ViewMerchant: ViewMerchant
}

});

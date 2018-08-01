Module.add('viewCraft',function() {

let Craft = {};

/**
Craft.

colFilter
allowFilter
selecting it puts the item into the ingredientList
and then you can click a button that sets command=craft, commandItem=[item1,item2,...] and commandTarget=player
**/

class ViewCraft extends ViewInventory {
	constructor(p) {
		super('#guiCraft',null,p.colFilter || p.entity.colFilter);
		this.onEvent = p.onItemChoose;
		this.crafter = p.entity;
		this.allowFilter = p.allowFilter || p.entity.allowFilter;
		this.onClose = p.onClose;
		$(document).on( 'keydown.ViewCraft', null, this.onKeyDown.bind(this) );

		guiMessage('clearSign');

		let filterFn = () => new Finder(this.observer.inventory);
		this.prime( filterFn, this.allowFilter, () => true );
	}
	onKeyDown(e) {
		if( e.key == 'Escape' ) {
			this.hide();
			e.stopPropagation();
			return;
		}
		let item = this.getItemByKey(e.key);
		if( item ) {
			e.commandItem = item;
			this.onItemChoose(e);
		}
	}
	hide() {
		$('#guiNarrative').removeClass('dim');
		this.div.hide();
		$(document).off( '.ViewCraft' );
		this.onClose();
		delete this;
	}
	onItemChoose(event) {
		debugger;
		event.command = Command.CRAFT;
		event.commandTarget = this.crafter
		this.onEvent(event);
	}
	headerComponent() {
		let element = $('<div>Crafting header</div>');
		return element;

	}
	render() {
		debugger;
		$('#guiNarrative').removeClass('dim');
		$('#guiNarrative').addClass('dim');
		super.render();
	}
	tick() {
	}
}

return {
	ViewCraft: ViewCraft
}

});

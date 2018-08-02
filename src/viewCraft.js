Module.add('viewCraft',function() {

let Craft = {};

Craft.ordner = {
	title: 'Ordnance Crafting',
	colFilter: {slot:1,key:1,icon:1,description:1,bonus:1,price:1},
	allowFilter: false,
	makeHeader: function() {
		$(document).off( '.ViewCraft' );
		let ingredientNone = { name: '<i>none selected</i>' }
		let s = '';
		for( let i=0 ; i<3 ; ++i ) {
			let ing = (this.ingredientList[i] || ingredientNone).name;
			s += '<div>'+ing+'</div>';
		}
		return s;
	}
};

/**
Craft.

colFilter
allowFilter
selecting it puts the item into the ingredientList
and then you can click a button that sets command=craft, commandItem=[item1,item2,...] and commandTarget=player
**/

class ViewCraft extends ViewInventory {
	constructor(p) {
		super('#guiCraft',null,null);
		console.assert(p.craftId && Craft[p.craftId]);
		Object.assign( this, Craft[p.craftId] );
		this.onEvent = p.onItemChoose;
		this.craftId = p.craftId;
		this.crafter = p.crafter;
		this.customer = p.customer;
		this.onClose = p.onClose;
		this.ingedientList = [];
		Object.each(this,(fn,id)=>this[id]=fn.bind(this));
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
		let element = $('<h1>'+this.title+'</h1>'+this.makeHeader.call(this));
		return element;

	}
	render() {
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

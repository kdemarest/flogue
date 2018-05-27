
class ViewMerchant extends ViewInventory {
	constructor(p) {
		super(p.divId,p.imageRepo);
		this.merchant = p.entity;
		this.onClose = p.onClose;
		this.prime( ()=>new Finder(this.merchant.inventory), true, () => true );

	}
	hide() {
		super.hide();
		this.onClose();
		delete this;
	}
	render() {
		super.render();
	}
	tick() {
	}
}
DynamicViewList['smith'] = viewParams => new ViewMerchant(viewParams);

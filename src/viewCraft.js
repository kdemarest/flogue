Module.add('viewCraft',function() {

let Craft = {};
let RecipeList = {};

function dataConditionRecipes() {
	Object.each( ItemTypeList.potion.effects, potionEffect => {
		let effectId = potionEffect.typeId;
		let bitId = 'bit'+String.capitalize(effectId.slice(1));
		RecipeList['potion.'+effectId] = {
			product:  'potion.'+effectId,
			require:  "potion.eWater, "+bitId
		};
	});

	Object.each( RecipeList, recipe => {
		let supply = Array.supplyParse(recipe.require);
		supply.forEach( sup => {
			let filter = Picker.filterStringParse(sup.typeFilter);
			sup.match = filterMatch.bind(filter);
		});
		recipe.requireSupply = supply;
	});
}


function filterMatch(item) {
	if( ItemTypeList[this.firstId] && !item.typeId === this.firstId ) {
		return false;
	}

	if( this.matter && this.matter !== matter ) {
		return false;
	}

	if( !this.testMembers(item)  ) {
		return false;
	}

	if( this.killId[item.typeId] ||
		this.killId[item.variety?item.variety.typeId:''] ||
		this.killId[item.material?item.material.typeId:''] ||
		this.killId[item.quality?item.quality.typeId:''] ||
		this.killId[item.effect?item.effect.typeId:''] ) {
		return false;
	}

	if( !this.testKeepId(
		item.typeId,
		item.variety?item.variety.typeId:'',
		item.material?item.material.typeId:'',
		item.quality?item.quality.typeId:'',
		item.effect?item.effect.typeId:''
	) ) {
		return false;
	}

	return true;
}

function matchesAnyRecipe(ingredient) {
	let found = false;
	Object.each( RecipeList, recipe => {
		recipe.requireSupply.forEach( sup => {
			if( sup.match(ingredient) ) {
				found = true;
				return false;
			}
		});
		if( found ) {
			return false;
		}
	});
	return found;
}

function findMatchingRecipe(ingredientList) {
	let found;
	Object.each( RecipeList, recipe => {
		let allMet = true;
		recipe.requireSupply.forEach( sup => {
			sup.remain = sup.count;
			ingredientList.forEach( ingredient => {
				if( ingredient && sup.remain>0 && sup.match(ingredient) ) {
					sup.remain -= (ingredient.bunch||1);
				}
			});
			allMet = allMet && sup.remain<=0;
		});
		if( allMet ) {
			found = recipe;
			return false;
		}
	});
	return found;
}

Craft.ordner = {
	title: 'Ordnance Crafting',
	colFilter: {slot:1,key:1,icon:1,description:1,bonus:1,price:1},
	allowFilter: false,
	itemFilter: function() {
		return new Finder(this.crafter.inventory).filter( item => (item.isPotion || matchesAnyRecipe(item)) && !this.ingredientList.find( i=>i && i.id==item.id ) );
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
		let self = this;
		Object.assign( this, Craft[p.craftId] );
		this.onEvent = p.onItemChoose;
		this.craftId = p.craftId;
		this.crafter = p.crafter;
		this.customer = p.customer;
		this.onClose = p.onClose;
		this.ingredientList = [null,null,null];
		Object.each(this,(fn,id)=>{
			if( typeof fn === 'function' ) {
				this[id]=fn.bind(this);
			}
		});
		$(document).on( 'keydown.ViewCraft', null, this.onKeyDown.bind(this) );

		guiMessage('clearSign');

		this.prime( this.itemFilter, this.allowFilter, () => true );
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
		let index = null;
		for( let i=0 ; i<3 ; ++i ) {
			if( !this.ingredientList[i] ) {
				index = i;
				break;
			}
		}
		if( index === null ) {
			return;
		}

		let item = event.commandItem;
		if( (item.bunch||1) > 1 ) {
			item = item._unbunch();
		}
		this.ingredientList[index] = item;
		this.render();
	}
	headerComponent(div) {
		let title = () => {
			return $('<h1>'+this.title+'</h1>');
		}

		let ingredientList = () => {
			let list = $('<div class="ingredientList"></div>');
			let ingredientNone = { name: '<i>none selected</i>' }
			for( let i=0 ; i<3 ; ++i ) {
				let name = this.ingredientList[i] ? this.ingredientList[i].explain().name : ingredientNone.name;
				$('<div class="ingredient">'+name+'</div>')
					.on( 'click.ViewCraftHeader', null, e => {
						this.ingredientList[i] = null;
						this.render();
					})
					.appendTo(list);
			}
			return list;
		}

		let craftingArrow = () => {
			let recipe = findMatchingRecipe(this.ingredientList);
			return $('<div class="craftingArrow'+(recipe?' ready':'')+'"><img src="/tiles/gui/'+(recipe?'arrowOutlineGreen.png':'arrowOutline.png')+'"></div>');
		}

		let product = () => {
			let recipe = findMatchingRecipe(this.ingredientList);
			let product = $('<div class="craftingProduct'+(recipe?' ready':'')+'"></div>');
			let nameList = [];
			if( recipe ) {
				new Picker(this.crafter.level).pickLoot(recipe.product,item=>{
					let ex = item.explain();
					let s = '';
					s += ex.description+(ex.permutation?' '+ex.permutation:'')+'<br>';
					if( ex.description2 ) {
						s += ex.description2+'<br>';
					}
					nameList.push( s );
				});
			}
			$('<div>'+nameList.join('<br>')+'</div>')
				.on( 'click.ViewCraftHeader', null, e => {
					let recipe = findMatchingRecipe(this.ingredientList);
					if( !recipe ) return;
					let itemList = this.customer.lootTake( recipe.product, this.customer.level, this.crafter, true );
					tell( mSubject, this.crafter, ' ', mVerb, 'craft', ' ', mObject|mA, itemList[0], '.' );
					this.ingredientList.forEach( ingredient => ingredient ? ingredient.destroy() : null );
					this.ingredientList = [null,null,null];

					$( ".craftingProduct" ).addClass('productMade');
					setTimeout( () => {
						$( ".craftingProduct" ).removeClass('productMade');
						this.render();
					}, 400 );
				})
				.appendTo(product);
			return product;
		}

		$(document).off( '.ViewCraftHeader' );
		$('<div class="craftingHeader"></div>')
			.append( title() )
			.append( 
				$('<div class="craftingCentered"></div>')
					.append( ingredientList() )
					.append( craftingArrow() )
					.append( product() )
			)
			.append( $('<hr>') )
			.appendTo( div );
	}
	message( msg, payload ) {
		super.message(msg,payload);
		if( msg == 'resize' ) {
			Gui.layout( {
				'#guiCraft': {
					height: self => $(window).height() - self.offset().top
				},
				'#guiCraft .invBody': {
					height: self => $(window).height() - self.offset().top
				},
				'#guiCraft .invBodyScroll': {
					height: self => $(window).height() - self.offset().top
				}
			});
			$('#guiCraft .invBodyScroll').scrollTop(this.scrollPos);
		}
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
	ViewCraft: ViewCraft,
	dataConditionRecipes: dataConditionRecipes
}

});

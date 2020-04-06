Module.add('viewCraft',function() {

let Craft = {};

function toBit(effectId) {
	return 'bit'+String.capitalize(effectId.slice(1));
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

/*
we can loop through all items.varieties, .materials etc and verify that every single named thing has a fixin
this can also stand in for matter, so if the varietyId or materialId is not found, we just check the matter.
const FixinsList = {
	iron: 'ingotIron',
	silver: 'ingotSilver',
	ice: 'iceBlock',
	lunarium: 'ingotLunarium',
	deepium: 'ingotDeepium',
	solarium 'ingotSolarium',
	ash: 'wood',
	oak: 'wood',
	maple: 'wood',
	yew: 'wood',
	// Matter mappings
	leather: 'part isSkin',
	glass: 'part isGlass'
	//and so on
};


we need to just have little algorithms that build custom recipes by type. One for potions, one for weapons, etc.
The final piece of the Recipe.itemType['more'] is ALWAYS in the order Variety/Material/Quality/Effect
Use the word fixins to represent the materials that make a thing.

for each PotionEffect {
	find the Part that says it makes this effect
		Recipe.potion['eFlight'] = 'potion.eWater, part isWing';

^^ the great thing about doing it this way is that, based on the recipes we've got selected, we could  adjust
the above to say, if we kill an ogre, part isWing becomes part isOgre isWing, which of course can't exist
so we skip it.

REMEMBER that Picker.itemTraverse takes a fn and will generously call us back for each thing it finds
that fits each criteris in the recipe. That way we can tell, during data conditioning, if any such part exists.


for each weapon.varieties
	// don't forget to let each variety's personal materials list override the default materials
	weapon.materials.forEach( material => {
		// don't forget to let each variety's personal effects list override the default effects
		for each weapon.effects
			*** Except we shouldn't even consiter letting one forge effects directly into the weapon!
			*** That should be something else entirely.
			let m = material.
			Recipe.weapon['sword_iron'] = '2x ingotIron (low damage is 1 ingot, >0.5 is 2, and >1.0 is 3)
			Recipe.weapon['bow_ash'] = 'wood'

similar drill for armor and so on.


*/

class Recipe {
	constructor() {
		RecipeRepo.add(this);
	}
	matchCraft(craftId) {
	}
	matchItem(item) {
	}
	matchIngredients(ingredientList) {
	}
	productSample(crafter) {
	}
	product(crafter,ingredientList) {
	}
}

let RecipeRepo = new class {
	constructor() {
		this.list = [];
	}
	add(recipe) {
		this.list.push(recipe);
	}
	isCraftableItem(craftId,item) {
		for( let i=0 ; i<this.list ; ++i ) {
			if( this.list[i].matchCraft(craftId) && this.list[i].matchItem(item) ) {
				return true;
			}
		}
		return false;
	}
	findMatchingRecipe(craftId,ingredientList) {
		for( let i=0 ; i<this.list ; ++i ) {
			if( this.list[i].matchCraft(craftId) && this.list[i].matchIngredients(ingredientList) ) {
				return this.list[i];
			}
		}
	}
}

class RecipePotion extends Recipe {
	constructor(legalCrafters,product,requirements) {
		super();
		this.legalCrafters = legalCrafters;
		this.product = product;	
		let supply = Array.supplyParse(requirements);
		supply.forEach( sup => {
			let filter = Picker.filterStringParse(sup.typeFilter);
			sup.match = filterMatch.bind(filter);
		});
		this.require = supply;
	}
	matchCraft(craftId) {
		return this.byCraftId.includes(craftId);
	}
	matchItem(item) {
		console.assert(item);
		for( let index=0 ; index<this.require.length ; ++index ) {
			if( this.require[index].match(item) && this.require[index].count == (item.bunch||1) ) {
				return this.require[index];
			}
		}
	}
	matchIngredients(ingredientList) {
		let matchCount = 0;
		ingredientList.forEach( item => {
			matchCount += item && this.matchItem(item);
		});
		return matchCount == this.require.length;
	}
	createSample(crafter,ingredientList) {
		let product = null;
		new Picker(crafter.level).pickLoot(this.product,item => { product=item; });
		return product;
	}
	create(crafter,ingredientList) {
		let product;
		new Picker(crafter.level).pickLoot(this.product,item => { product=item; });
		tell( mSubject, crafter, ' ', mVerb, 'craft', ' ', mObject|mA, product, '.' );
		ingredientList.forEach( item => item ? item.destroy() : null );
		return product;
	}
};

/*
class RecipePotionAugment extends Recipe {
	constructor() {
		super();
	}
	matchCraft(craftId) {
		return craftId=='ordner';
	}
	matchItem(item) {
		if( !item.effect ) return;
		if( item.effect.typeId == '
	}
			let item = when=='recipe.ordner' ? e.ingredientList.first : false;
			if( item && item.isPotion && e.ingredientList.count == 1 && item.effect && (item.effect.isDeb || item.effect.isDmg) ) {
				let effectShape = [EffectShape.BLAST3,EffectShape.BLAST4,EffectShape.BLAST5][index];
				e.found = {
					augment:	e.ingredientList.first,
					transform:	item => item.effect.effectShape = effectShape,
					description: 'add blast area '+(3+index),
				}
			}
*/

function dataConditionRecipes() {
	let legalCrafters = ['ordner'];
	Object.each( ItemTypeList.potion.effects, potionEffect => {
		if( !potionEffect.isInert ) {
			new RecipePotion(
				legalCrafters,
				'potion.'+potionEffect.typeId,
				"potion.eWater, "+toBit(potionEffect.typeId)
			);
		}
	});
}


Craft.ordner = {
	title: 'Ordnance Crafting',
	colFilter: {slot:1,key:1,icon:1,description:1,bonus:1,price:1},
	allowFilter: false,
	itemFilter: function() {
		return new Finder(this.crafter.inventory).filter( item => (item.isPotion || this.isCraftableItem(this.craftId,item)) && !this.ingredientList.findId(item.id) );
	},
	maxIngredients: 3
};

/**
Craft.

colFilter
allowFilter
selecting it puts the item into the ingredientList
and then you can click a button that sets command=craft, commandItem=[item1,item2,...] and commandTarget=player
**/
class IngredientList {
	constructor(maxLen) {
		this.list = [];
		this.clear(maxLen);
	}
	set(index,value) {
		console.assert(this.list && index < this.list.length);
		this.list[index] = value;
	}
	reset(index) {
		this.set(index,null);
	}
	clear(maxLen=this.list.length) {
		this.list.length = maxLen;
		for( let i=0 ; i<this.list.length ; ++i ) {
			this.reset(i);
		}
	}
	getOpenSlot() {
		for( let i=0 ; i<this.list.length ; ++i ) {
			if( !this.list[i] ) {
				return i;
			}
		}
		return null;
	}
	findId(id) {
		return this.list.find( item=>item && item.id==id );
	}
	forEach(fn) {
		return this.list.forEach(fn);
	}
	get first() {
		for( let i=0 ; i <this.list.length ; ++i ) {
			if( this.list[i] ) {
				return this.list[i];
			}
		}
	}
	get count() {
		let c = 0;
		for( let i=0 ; i <this.list.length ; ++i ) {
			c += this.list[i] ? 1 : 0;
		}
		return c;
	}
}

class ViewCraft extends ViewInventory {
	constructor(p) {
		super('#guiCraft',null,null);
		console.assert(p.craftId && Craft[p.craftId]);
		let self = this;
		Object.assign( this, Craft[p.craftId] );
		this.onEvent = p.onItemChoose;
		this.craftId = p.craftId;
		this.crafter = p.crafter;
		this.customer = p.entity;
		this.ingredientList = new IngredientList(this.maxIngredients);
		Object.each(this,(fn,id)=>{
			if( typeof fn === 'function' ) {
				this[id]=fn.bind(this);
			}
		});
		Gui.keyHandler.add( 'ViewCraft', this.onKeyDown.bind(this) );

		guiMessage('clearSign');

		this.prime( this.itemFilter, this.allowFilter, () => true );
	}
	onKeyDown(e) {
		if( e.key == 'Escape' ) {
			this.hide();
			return false;
		}
		let item = this.getItemByKey(e.key);
		if( item ) {
			e.commandItem = item;
			this.onItemChoose(e);
		}
		return false;
	}
	hide() {
		$('#guiNarrative').removeClass('dim');
		this.div.hide();
		$(document).off( '.ViewCraft' );
		Gui.remove(this);
	}

	onItemChoose(event) {
		let index = this.ingredientList.getOpenSlot()
		if( index === null ) {
			return;
		}

		let item = event.commandItem;
		if( (item.bunch||1) > 1 ) {
			item = item._unbunch();
		}
		this.ingredientList.set(index,item);
		this.render();
	}
	isCraftableItem(craftId,item) {
		return RecipeRepo.isCraftableItem(craftId,item);
	}
	findMatchingRecipe(craftId,ingredientList) {
		let effect = {
			target: this.crafter,
			source: this.crafter,
			ingredientList: ingredientList,
			found: null
		};
		Perk.apply( 'recipe.'+craftId, effect );
		if( effect.found ) {
			return effect.found;
		}
		return RecipeRepo.findMatchingRecipe(craftId,ingredientList);
	}
	headerComponent(div) {
		let title = () => {
			return $('<h1>'+this.title+'</h1>');
		}

		let craftingIngredients = () => {
			let list = $('<div class="ingredientList"></div>');
			let ingredientNone = { name: '<i>none selected</i>' }
			this.ingredientList.forEach( (item,index) => {
				let name = item ? item.explain().name : ingredientNone.name;
				$('<div class="ingredient">'+name+'</div>')
					.on( 'click.ViewCraftHeader', null, e => {
						this.ingredientList.reset(index);
						guiMessage( 'hide' );
						this.render();
					})
					.on( 'mouseover.ViewCraftHeader', null, event => {
						if( item ) {
							guiMessage( 'show', item );
						}
					})
					.appendTo(list);
			});
			return list;
		}

		let craftingArrow = () => {
			let recipe = this.findMatchingRecipe(this.craftId,this.ingredientList);
			return $('<div class="craftingArrow'+(recipe?' ready':'')+'"><img src="/tiles/gui/'+(recipe?'arrowOutlineGreen.png':'arrowOutline.png')+'"></div>');
		}

		let craftingProduct = () => {
			let recipe = this.findMatchingRecipe(this.craftId,this.ingredientList);
			let product = $('<div class="craftingProduct'+(recipe?' ready':'')+'"></div>');
			let nameList = [];
			if( recipe ) {
				let product = recipe.createSample(this.crafter,this.ingredientList);
				let ex = product.explain();
				let s = '';
				s += ex.description+(ex.permutation?' '+ex.permutation:'')+'<br>';
				if( ex.description2 ) {
					s += ex.description2+'<br>';
				}
				if( ex.perks ) {
					s += ex.perks+'<br>';
				}
				s += recipe.description ? recipe.description+'<br>' : '';
				nameList.push( s );
			}
			$('<div>'+nameList.join('<br>')+'</div>')
				.on( 'click.ViewCraftHeader', null, e => {
					let recipe = this.findMatchingRecipe(this.craftId,this.ingredientList);
					if( !recipe ) return;
					let product = recipe.create(this.crafter,this.ingredientList);
					ingredientList.clear();

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
					.append( craftingIngredients() )
					.append( craftingArrow() )
					.append( craftingProduct() )
			)
			.append( $('<hr>') )
			.appendTo( div );
	}
	message( msg, payload ) {
		super.message(msg,payload);
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

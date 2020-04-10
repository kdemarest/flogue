Module.add('viewCraft',function() {

let Craft = {};
let EMPTY = {};

function toBit(effectId) {
	return 'bit'+String.capitalize(effectId.slice(1));
}

function filterMatch(item) {
	if( ItemTypeList[this.firstId] && item.typeId !== this.firstId ) {
		return false;
	}

	if( this.matter && this.matter !== matter ) {
		return false;
	}

	if( !this.testMembers(item,EMPTY,EMPTY,EMPTY)  ) {
		return false;
	}

	if( this.killId.length && (
		this.killId[item.typeId] ||
		this.killId[item.variety?item.variety.typeId:''] ||
		this.killId[item.material?item.material.typeId:''] ||
		this.killId[item.quality?item.quality.typeId:''] ||
		this.killId[item.effect?item.effect.typeId:''] )) {
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
// Old master of laketown disappeared into 'the waste' with a bunch of money
// Laketown has powerful merchants, I know the five most important and their details, the guilds etc.
// 

let RecipeList = {};
RecipeList = Type.establish('Recipe',{},RecipeList);

let nul = { nul: {nul:true} };	// not the same as inert!

let RecipeGenerator = new class {
	constructor() {
		this.exists = {};
	}

	add(recipe) {
		console.assert(recipe.product);
		console.assert(recipe.ingredients);

		if( this.exists[recipe.ingredients] ) {
			return;
		}
		let supply = Array.supplyParse(recipe.ingredients);
		console.assert( supply.length > 0 );
		supply.forEach( sup => {
			let filter = Picker.filterStringParse(sup.typeFilter);
			sup.match = filterMatch.bind(filter);
		});
		recipe.requirements = supply;
		RecipeList[recipe.product+'.'+Date.makeUid()] = recipe;
	}

	makeSupplyId(itemType,variety=nul,material=nul,quality=nul,effect=nul) {
		return String.combine(
			'.',
			itemType.typeId,
			variety.nul?0:variety.typeId,
			material.nul?0:material.typeId,
			quality.nul?0:quality.typeId,
			effect.nul?0:effect.typeId
		);
	}

	generateRecipePotion(itemType,variety,material,quality,effect) {
//return;
//if( effect.typeId !== 'eHaste' ) return;
		Object.each( Type.Part, part => {
			if( part.makes.includes(effect.typeId) ) {
				this.add({
					product:		'potion.'+effect.typeId,
					ingredients:	'potion.eWater, part '+String.getIs(part.typeId)
				});
			}
		});
		}

	generateRecipeArmor(itemType,variety,material,quality,effect) {
		if( variety.fixins && (effect.isInert || effect.nul) ) {
//return;
//if( variety.typeId !== 'fur' ) return;
			this.add({
				product: 'armor.'+variety.typeId,
				ingredients:  variety.fixins
			});
		}
	}

	generateRecipeNamed(itemType,variety,material,quality,effect) {
//return;
		if( !effect.nul && !effect.isInert ) {
			return;
		}
		if( variety.recipe ) {
			this.add({
				product:		this.makeSupplyId(itemType,variety),
				ingredients:	variety.recipe
			});
			return;
		}
		if( itemType.recipe ) {
			this.add({
				product:		this.makeSupplyId(itemType),
				ingredients:	itemType.recipe
			});
		}
	}

	generateRecipes() {
		let effectInert = { eInert: { isInert: 1 } };
		Object.each( ItemTypeList, itemType => {
			Object.each( itemType.varieties || nul, variety => {
				Object.each( variety.materials || itemType.materials || nul, material => {
					Object.each( material.qualities || variety.qualities || itemType.materials || nul, quality => {
						Object.manyEach( effectInert, quality.effects || material.effects || variety.effects || itemType.effects || null, effect => {
							let callName = 'generateRecipe'+String.capitalize(itemType.typeId);
							if( this[callName] ) {
								this[callName]( itemType, variety, material, quality, effect );
							}
							this.generateRecipeNamed( itemType, variety, material, quality, effect );
						});
					});
				});
			});
		});
	}
}

function test() {
	let craftId = 'ordner';
	{
//		let ingredientList = [ { id: 'a', typeId: 'part', isSkin:1, variety: { typeId: 'leather' } }, null, null ];
//		let recipe = RecipeManager.findOutcomes(craftId,ingredientList);
//		console.assert(recipe);
//		let item = RecipeManager.createSample({level:1},recipe);
//		console.assert(item);
	}
//		{ id: 'a', typeId: 'part', isWing:1, variety: { typeId: 'something' } },

}

Type.establish('RecipeGenerator',{
	onFinalize: X => {
		RecipeGenerator.generateRecipes();
		test();
	}
},{ fake: {} } );

let RecipeManager = new class {
	constructor() {
		this.list = RecipeList;
	}
	determineOutcome(recipe,ingredientList) {
		let outcome = {
			recipe: recipe,
			ingredientStatus: {},
			extraIngredients: 0,
			satisfied: false,
		};
		let metCount = 0;
		for( let r=0 ; r<recipe.requirements.length ; ++r ) {
			for( let i=0 ; i<ingredientList.length ; ++i ) {
				let item = ingredientList[i];
				if( !item || outcome.ingredientStatus[item.id] ) {
					continue;
				}
				let isMatch = recipe.requirements[r].match(item);
				let isCount = recipe.requirements[r].count == (item.bunch||1);
				if( isMatch && isCount ) {
					outcome.ingredientStatus[item.id] = 'consumed';
					metCount++;
					break;
				}
				if( !isMatch ) {
					outcome.extraIngredients++;
				}
			}
		}
		outcome.satisfied = (metCount >= recipe.requirements.length);
		return outcome;
	}

	findOutcomes(craftId,ingredientList) {
		let outcomeList = [];
		Object.each( RecipeList, recipe => {
			let outcome = this.determineOutcome(recipe,ingredientList);
			if( outcome.satisfied ) {
				outcomeList.push(outcome);
			}
		});
		outcomeList.sort( (a,b)=>a.extraIngredients>b.extraIngredients ? 1 : a.extraIngredients<b.extraIngredients ? -1 : 0 );
		if( outcomeList.length >= 2 ) {
			console.assert( outcomeList[0].extraIngredients <= outcomeList[1].extraIngredients );
		}
		return outcomeList;
	}
	createSample(crafter,recipe) {
		let product = null;
		new Picker(crafter.level).pickLoot( recipe.product, item => { product=item; } );
		return product;
	}
};




Craft.ordner = {
	title: 'Ordnance Crafting',
	colFilter: {slot:1,key:1,icon:1,description:1,bonus:1,price:1},
	allowFilter: false,
	fetchCraftableItems: function() {
		return new Finder(this.crafter.inventory).filter( item => {
			return (item.isPotion || item.isPart) && !this.ingredientList.findId(item.id);
		});
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
	destroy() {
		this.list.forEach( item => !item || item.destroy() );
		this.clear();
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

		this.prime( this.fetchCraftableItems, this.allowFilter, () => true );
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
	findOutcomes(craftId,ingredientList) {
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
		return RecipeManager.findOutcomes(craftId,ingredientList);
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
			let outcomeList = this.findOutcomes(this.craftId,this.ingredientList.list);
			let recipe = outcomeList.length ? outcomeList[0].recipe : null;
			return $('<div class="craftingArrow'+(recipe?' ready':'')+'"><img src="/tiles/gui/'+(recipe?'arrowOutlineGreen.png':'arrowOutline.png')+'"></div>');
		}

		let craftingProduct = () => {
			let outcomeList = this.findOutcomes(this.craftId,this.ingredientList.list);
			let recipe = outcomeList.length ? outcomeList[0].recipe : null;
			let product = $('<div class="craftingProduct'+(recipe?' ready':'')+'"></div>');
			let nameList = [];
			if( recipe ) {
				let product = RecipeManager.createSample(this.crafter,recipe);
				if( !product ) {
					// you are not high enough level
					nameList.push( 'Not high level' );
				}
				else {
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
			}
			$('<div>'+nameList.join('<br>')+'</div>')
				.on( 'click.ViewCraftHeader', null, e => {
					let outcomeList = this.findOutcomes(this.craftId,this.ingredientList.list);
					let recipe = outcomeList.length ? outcomeList[0].recipe : null;
					if( !recipe ) return;
					Inventory.lootTo( this.crafter, recipe.product, this.crafter.level, this.crafter );
					this.ingredientList.destroy();

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
	RecipeManager: RecipeManager
}

});

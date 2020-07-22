Module.add('plugin',function() {

class Plugin {
	constructor(id) {
		this.id = id;
		this.isPlugin = true;
		this._validFields = ['id','isPlugin','Config','Rules','TileTypeList','ItemTypeList','MonsterTypeList','ScapeList','PlaceTypeList','ThemeList'];
		this.Config				= {};
		this.Rules				= {};
		this.TileTypeList		= {};
		this.ItemTypeList		= {};
		this.MonsterTypeList	= {};
		this.ScapeList			= {};
		this.PlaceTypeList		= {};
		this.ThemeList			= {};

	}
	validate() {
		Object.each( this, (field,fieldId) => {
			if( !this._validFields.includes(fieldId) && fieldId.substr(0,1) !== '_' ) {
				throw "Plugin "+this.id+" has invalid field "+fieldId;
				return false;
			}
		});
		return true;
	}
}

Plugin.Manager = new class {
	constructor() {
		this.list = {};
		this.status = {};
	}
	addForLoad(pluginId,url) {
		console.assert( !this.list[pluginId] && !this.status[pluginId] );
		if( !url ) {
			url = pluginId + '.js';
		}
		this.status[pluginId] = {
			id:			pluginId,
			url:		url,
			enqueued:	false,
			loaded:		false,
			content:    null
		};
	}
	register(plugin) {
		console.assert( plugin.id );
		console.assert( plugin.id == this.status[plugin.id].id );
		console.assert( !this.list[plugin.id] && this.status[plugin.id].loaded );
		console.assert( plugin.validate() );
		this.list[plugin.id] = plugin;
	}
	async load(pluginId) {
		return new Promise( (resolve,reject)=> {
			let status = this.status[pluginId];
			console.assert(status);
			status.enqueued = true;
			let jsElement=document.createElement('script')
			jsElement.onload = () => {
				status.loaded = true;
				resolve(pluginId);
			}
			jsElement.onerror = function() {
				status.loaded = null;
				reject(pluginId);
			}
			jsElement.setAttribute("type","text/javascript")
			jsElement.setAttribute("src", status.url)

			if (typeof jsElement!="undefined") {
				document.getElementsByTagName("head")[0].appendChild(jsElement)
			}
		});
	}
	async loadAll() {
		let loaderList = [];
		Object.each( this.status, status => {
			if( !status.enqueued ) {
				loaderList.push( this.load( status.id ) );
			}
		});
		return Promise.allSettled(loaderList);
	}

	forEach(fn) {
		Object.each( this.list, (plugin,pluginId) => {
			plugin.validate();
			fn(plugin);
		});
	}
}();

return {
	Plugin: Plugin
}
});

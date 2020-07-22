Module.add('config',function() {

class Config {
	constructor(cookieId) {
		Config.instance = this;
		this.cookieId = cookieId;
		this.id = Cookie.get(this.cookieId);
	}
}

Config.instance = null;

Config.setConfigId = function(value) {
	Cookie.set(Config.instance.cookieId,value);
	window.alert('You must reload for new configId to take effect.');
}

return {
	Config: Config
}

});

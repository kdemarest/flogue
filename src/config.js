Module.add('config',function() {

class Config {
	constructor() {
		this.id = Config.getConfigId();
	}
}

Config.configCookie = 'flogueConfigId';

Config.getConfigId = function() {
	return Cookie.get(this.configCookie);
}
Config.setConfigId = function(value) {
	Cookie.set(this.configCookie,value);
	window.alert('You must reload for new configId to take effect.');
}

return {
	Config: Config
}

});

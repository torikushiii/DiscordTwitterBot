module.exports = (async function () {
	globalThis.app = {};

	const files = [
		"classes/user",
		"classes/config",
		"classes/command",

		"singletons/got",
        
		"object/error",
		"singletons/logger",
		"singletons/cache",
		"singletons/sentinel"
	];

	for (const file of files) {
		const [type, name] = file.split("/");

		if (type === "object") {
			const component = require(`./${file}`);
			const name = component.name.replace(/^Custom/, "");

			app[name] = component;
		}
		else if (type === "singletons") {
			switch (name) {
				case "logger": {
					const Component = require("./singletons/logger.js");
					app.Logger = Component.singleton();
					break;
				}

				case "cache": {
					const Component = require("./singletons/cache.js");
					app.Cache = Component.singleton();
					break;
				}

				case "sentinel": {
					const Component = require("./singletons/sentinel");
					app.Sentinel = Component.singleton();
					break;
				}

				case "got": {
					const Component = await require("./singletons/got.js");
					app.Got = Component;
					break;
				}
			}
		}
		else if (type === "classes") {
			const component = require(`./${file}`);
            
			app[component.name] = await component.initialize();
		}
	}

	return globalThis.app;
});

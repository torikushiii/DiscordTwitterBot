module.exports = (async function () {
	globalThis.app = {};

	const files = [
		"cache",
		"sentinel"
	];

	for (const file of files) {
		switch (file) {
			case "cache":
				app.Cache = require("./cache/index.js").singleton();
				break;
			case "sentinel":
				app.Sentinel = require("./sentinel/index.js");
				break;
		}
	}

	return globalThis.app;
});

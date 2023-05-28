module.exports = (async function () {
	globalThis.app = {};

	const files = [
		"got",
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
			case "got":
				app.Got = await require("./got/index.js");
				break;
		}
	}

	return globalThis.app;
});

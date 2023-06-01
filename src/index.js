module.exports = (async function () {
	globalThis.app = {};

	const files = [
		"log",

		"got",
		"cache",
		"command",
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
			case "command":
				app.Command = require("./command/index.js");
				break;
			case "got":
				app.Got = await require("./got/index.js");
				break;
			case "log":
				app.Log = await require("./log/index.js");
				break;
		}
	}

	return globalThis.app;
});

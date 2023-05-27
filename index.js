(async () => {
	const init = require("./src/index.js");
	globalThis.app = await init();

	try {
		let Client = null;
		try {
			Client = require("./src/discord/index.js");
		}
		catch (e) {
			console.error("Failed to load Discord client:", e);
		}

		try {
			app.Discord = new Client();
		}
		catch (e) {
			console.error("Failed to initialize Discord client:", e);
		}
	}
	catch (e) {
		console.error("Failed to load Discord client:", e);
	}
})();

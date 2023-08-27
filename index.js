(async function () {
	require("./db-access.js");
	const init = require("./core/index.js");
	globalThis.app = await init();

	const commands = await require("./commands/index.js");
	await app.Command.importData(commands.definitions);

	let Controller = null;
	try {
		Controller = require("./controller/discord.js");
	}
	catch (e) {
		console.error(e);
		process.exit(1);
	}

	try {
		app.Discord = new Controller();
	}
	catch (e) {
		console.error(e);
		process.exit(1);
	}

	process.on("unhandledRejection", (reason) => {
		if (!(reason instanceof Error)) {
			return;
		}

		console.error(reason);
	});
})();

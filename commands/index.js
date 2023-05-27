module.exports = (async () => {
	const fs = require("fs/promises");
	const path = require("path");

	const commandList = await fs.readdir(__dirname, {
		withFileTypes: true
	});

	const definitions = [];
	const failed = [];

	const dirList = commandList.filter(i => i.isDirectory());
	for (const dir of dirList) {
		let def;
		const defPath = path.join(__dirname, dir.name, "index.js");
		try {
			def = await require(defPath);
		}
		catch {
			failed.push(dir.name);
		}

		if (def) {
			definitions.push(def);
		}
	}

	return {
		definitions,
		failed
	};
})();

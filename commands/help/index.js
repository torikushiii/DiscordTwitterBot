module.exports = {
	name: "help",
	aliases: ["h"],
	params: [],
	description: "Show this help message or get help for a specific command.",
	code: (async function help (context, identifier) {
		if (!identifier) {
			const commands = app.Command.getAll();
			const commandNames = commands
				.filter(i => i.usage !== null)
				.map(i => i.name);
            
			return {
				success: true,
				reply: `Available commands: ${commandNames.join(", ")}`
			};
		}

		const command = app.Command.get(identifier);
		if (!command) {
			return {
				success: false,
				reply: "Command not found."
			};
		}

		if (command.usage === null) {
			return {
				success: true,
				reply: `No usage information available for ${command.name}.`
			};
		}

		await app.Discord.send(null, context.channel, { embed: command.usage });
		return {
			success: true,
			reply: "embed"
		};
	}),
	usage: null
};

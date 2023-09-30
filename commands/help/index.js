module.exports = {
	name: "help",
	aliases: null,
	params: [],
	description: "Show this help message or get help for a specific command.",
	code: (async function help (context, identifier) {
		if (!identifier) {
			const commands = app.Command.data;
			const commandList = commands.map(i => i.name).join(", ");

			return {
				success: true,
				discord: {
					embeds: [
						{
							title: "Help",
							description: `Currently available commands: ${commandList}`
						}
					]
				}
			};
		}

		const command = app.Command.get(identifier);
		if (!command) {
			return {
				success: false,
				reply: "Command not found."
			};
		}

		if (!command?.usage) {
			return {
				success: true,
				reply: `No usage information available for ${command.name}.`
			};
		}

		return {
			success: true,
			discord: {
				embeds: command.usage
			}
		};
	})
};

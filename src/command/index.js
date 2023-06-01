const { parseParametersFromArguments } = require("./parameter-parser.js");

class Command {
	static data = [];

	constructor () {
		this.loadCommands();
	}
    
	async execute (identifier, args, channelData, userData, options = {}) {
		if (!identifier) {
			return {
				success: false,
				message: "No command provided"
			};
		}

		if (!Array.isArray(args)) {
			throw new Error("Args must be an array");
		}

		const command = this.get(identifier);
		if (!command) {
			return {
				success: false,
				message: "Command not found"
			};
		}

		const appendOptions = { ...options };
		const contextOptions = {
			invocation: identifier,
			user: userData,
			channel: channelData,
			command,
			append: appendOptions,
			params: {}
		};

		if (command.params.length > 0) {
			const result = parseParametersFromArguments(command.params, args);
			if (result.success === false) {
				return result;
			}

			args = result.args;
			contextOptions.params = result.parameters;
		}

		let execution;
		try {
			execution = await command.code(contextOptions, ...args);
		}
		catch (e) {
			const errorId = await app.Sentinel.generateErrorId(e, channelData.guild.id);

			const prettify = (errorId) => {
				const string = `Please report this error ID to the developer using the command \`{prefix}report ${errorId}\`.`;
				return `${string}`;
			};

			execution = {
				success: false,
				reply: `An error occurred while executing this command. - ${prettify(errorId)}`
			};

			console.error(`Error executing command "${identifier}"`, e);
		}

		if (!execution) {
			return execution;
		}

		if (typeof execution.reply !== "undefined") {
			execution.reply = String(execution.reply).trim();
			if (execution.reply.length === 0) {
				execution.reply = "(no message)";
			}
		}
		
		if (execution.reply === "embed") {
			return;
		}

		return execution;
	}

	async loadCommands () {
		const { definitions } = await require("../../commands/index.js");

		for (const def of definitions) {
			Command.data.push(def);
		}

		Command.definitions = definitions;
	}

	get (command) {
		if (typeof command !== "string") {
			throw new Error("Command must be a string");
		}

		return Command.data.find(i => i.name === command || i.aliases.includes(command));
	}

	getAll () {
		return Command.data;
	}

	is (string, channelData) {
		const prefix = channelData.prefix ?? Command.getPrefix();
		if (prefix === null) {
			return false;
		}

		return (string.startsWith(prefix) && string.trim().length > prefix.length);
	}

	get prefix () {
		return Command.getPrefix();
	}

	static getPrefix () {
		return process.env.PREFIX ?? null;
	}
}

module.exports = new Command();

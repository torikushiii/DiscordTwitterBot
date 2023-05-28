class Command {
	static data = [];

	static parseParameter (value, type, explicit) {
		if (type === "string" && explicit === false && value === "") {
			return null;
		}
		else if (type !== "string" && value === "") {
			return null;
		}

		if (type === "string") {
			return String(value);
		}
		else if (type === "number") {
			const output = Number(value);
			if (!Number.isFinite(output)) {
				return null;
			}

			return output;
		}
		else if (type === "boolean") {
			if (value === "true") {
				return true;
			}
			else if (value === "false") {
				return false;
			}
		}
		else if (type === "date") {
			const date = new Date(value);
			if (Number.isNaN(date.valueOf())) {
				return null;
			}

			return date;
		}
		else if (type === "object") {
			const [key, outputValue] = value.split("=");
			return { key, value: outputValue };
		}

		return null;
	}

	static #parseAndAppendParameter (value, parameterDefinition, explicit, existingParameters) {
		const parameters = { ...existingParameters };
		const parsedValue = Command.parseParameter(value, parameterDefinition.type, explicit);
		if (parsedValue === null) {
			return {
				success: false,
				reply: `Could not parse parameter "${parameterDefinition.name}"!`
			};
		}
		else if (parameterDefinition.type === "object") {
			if (typeof parameters[parameterDefinition.name] === "undefined") {
				parameters[parameterDefinition.name] = {};
			}

			if (typeof parameters[parameterDefinition.name][parsedValue.key] !== "undefined") {
				return {
					success: false,
					reply: `Cannot use multiple values for parameter "${parameterDefinition.name}", key ${parsedValue.key}!`
				};
			}

			parameters[parameterDefinition.name][parsedValue.key] = parsedValue.value;
		}
		else {
			parameters[parameterDefinition.name] = parsedValue;
		}

		return { success: true, newParameters: parameters };
	}

	static parseParametersFromArguments (paramsDefinition, argsArray) {
		const argsStr = argsArray.join(" ");
		const outputArguments = [];
		let parameters = {};

		let buffer = "";
		/** @type {typeof paramsDefinition[0] | null} */
		let currentParam = null;
		let insideParam = false;
		let quotedParam = false;

		for (let i = 0; i < argsStr.length; i++) {
			const char = argsStr[i];
			buffer += char;

			if (!insideParam) {
				if (buffer.slice(0, -1) === Command.ignoreParametersDelimiter && char === " ") {
					outputArguments.push(...argsStr.slice(i + 1).split(" "));
					return {
						success: true,
						parameters,
						args: outputArguments
					};
				}

				if (char === ":") {
					currentParam = paramsDefinition.find(i => i.name === buffer.slice(0,-1)) ?? null;
					if (currentParam) {
						insideParam = true;
						buffer = "";
						if (argsStr[i + 1] === "\"") {
							i++;
							quotedParam = true;
						}
					}
				}
				else if (char === " ") {
					const sliced = buffer.slice(0, -1);
					if (sliced.length > 0) {
						outputArguments.push(sliced);
					}
					buffer = "";
				}
			}

			if (insideParam) {
				if (!quotedParam && char === " ") {
					const value = Command.#parseAndAppendParameter(buffer.slice(0, -1), currentParam, quotedParam, parameters);
					if (!value.success) {
						return value;
					}
					buffer = "";
					parameters = value.newParameters;
					insideParam = false;
					quotedParam = false;
					currentParam = null;
				}

				if (quotedParam && char === "\"") {
					if (buffer.at(-2) === "\\") {
						buffer = `${buffer.slice(0, -2)}"`;
					}
					else {
						const value = Command.#parseAndAppendParameter(buffer.slice(0, -1), currentParam, quotedParam, parameters);
						if (!value.success) {
							return value;
						}
						buffer = "";
						parameters = value.newParameters;
						insideParam = false;
						quotedParam = false;
						currentParam = null;
					}
				}
			}
		}

		if (insideParam) {
			if (quotedParam) {
				return {
					success: false,
					reply: `Unclosed quoted parameter "${currentParam.name}"!`
				};
			}
			else {
				const value = Command.#parseAndAppendParameter(buffer, currentParam, quotedParam, parameters);
				if (!value.success) {
					return value;
				}
				parameters = value.newParameters;
			}
		}
		else if (buffer !== "" && buffer !== Command.ignoreParametersDelimiter) {
			outputArguments.push(buffer);
		}

		return {
			success: true,
			parameters,
			args: outputArguments
		};
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
			const result = Command.parseParametersFromArguments(command.params, args);
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
			execution = {
				success: false,
				reply: e.message
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
}

module.exports = new Command();

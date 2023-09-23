// eslint-disable-next-line no-unused-vars
const { GuildChannel, PermissionFlagsBits } = require("discord.js");

module.exports = class Command extends require("./template.js") {
	name;
	description = null;
	params = [];
	code;

	data = {};

	static delimiter = "--";

	constructor (data) {
		super();

		this.name = data.name;
		if (typeof this.name !== "string" || this.name.length === 0) {
			console.error("Command name must be a string and not empty", this.name);
			this.name = "";
		}

		this.description = data.description;

		if (typeof data.code === "function") {
			this.code = data.code;
		}
		else {
			try {
				this.code = eval(data.code);
			}
			catch (e) {
				console.error(`Failed to compile code for ${this.name}`, e);
				this.code = () => ({
					success: false,
					reply: "Failed to compile code"
				});
			}
		}

		if (data.params !== null) {
			let params = data.params;
			if (typeof params === "string") {
				try {
					params = JSON.parse(params);
				}
				catch (e) {
					this.params = null;
					console.warn(`Command has invalid JSON params definition`, {
						commandName: this.Name,
						error: e
					});
				}
			}

			this.params = params;
		}

		if (data?.usage?.length !== 0) {
			this.usage = data.usage;
		}
	}

	destroy () {
		this.code = null;
		this.data = null;
	}

	execute (...args) {
		return this.code(...args);
	}

	static async initialize () {
		return this;
	}

	static async importData (definitions) {
		super.importData(definitions);
		await this.validate();
	}

	static async validate () {
		if (Command.data.length === 0) {
			console.warn("No command found");
		}

		if (!app.Config) {
			console.warn("Config is not initialized");
		}
		else if (Command.prefix === null) {
			console.warn("Command prefix is not set");
		}

		const names = Command.data.flatMap(i => i.name);
		const duplicates = names.filter((i, index) => names.indexOf(i) !== index);
		if (duplicates.length > 0) {
			console.warn("Duplicate command name found", duplicates);
		}
	}

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
	
		return null;
	}
	

	static parseAndAppendParameter (value, parameterDefinition, explicit, existingParameters) {
		const parameters = { ...existingParameters };
		const parsedValue = this.parseParameter(value, parameterDefinition.type, explicit);
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
		let currentParam = null;
		let insideParam = false;
		let quotedParam = false;

		for (let i = 0; i < argsStr.length; i++) {
			const char = argsStr[i];
			buffer += char;

			if (!insideParam) {
				if (buffer.slice(0, -1) === this.delimiter && char === " ") {
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
					const value = this.parseAndAppendParameter(buffer.slice(0, -1), currentParam, quotedParam, parameters);
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
						const value = this.parseAndAppendParameter(buffer.slice(0, -1), currentParam, quotedParam, parameters);
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
				const value = this.parseAndAppendParameter(buffer, currentParam, quotedParam, parameters);
				if (!value.success) {
					return value;
				}
				parameters = value.newParameters;
			}
		}
		else if (buffer !== "" && buffer !== this.delimiter) {
			outputArguments.push(buffer);
		}

		return {
			success: true,
			parameters,
			args: outputArguments
		};
	}

	static get (name) {
		if (name instanceof Command) {
			return name;
		}
		else if (typeof name === "string") {
			return Command.data.find(i => i.name === name);
		}
		else {
			throw new app.Error({
				message: "Invalid command name",
				args: {
					type: typeof name,
					name
				}
			});
		}
	}

	static async checkAndRun (identifier, argumentArray, channelData, userData, options = {}) {
		if (!identifier) {
			return {
				success: false,
				reply: "No command name specified"
			};
		}

		if (!Array.isArray(argumentArray)) {
			throw new app.Error({ message: "Invalid argument array" });
		}

		const command = Command.get(identifier);
		if (!command) {
			return {
				success: false,
				reason: "Command not found"
			};
		}

		const isAllowed = Command.isAllowed(channelData, userData);
		if (!isAllowed) {
			return {
				success: false,
				reason: "not-allowed"
			};
		}
        
		const appendOptions = { ...options };
		const contextOptions = {
			platform: options.platform,
			invocation: identifier,
			command,
			channel: channelData,
			user: userData,
			append: appendOptions,
			params: {}
		};

		if (command.params.length > 0) {
			const result = this.parseParametersFromArguments(command.params, argumentArray);
			if (result.success === false) {
				return result;
			}

			argumentArray = result.args;
			contextOptions.params = result.parameters;
		}

		let execution;
		const context = contextOptions;

		try {
			const start = process.hrtime.bigint();
			execution = await command.code(context, ...argumentArray);
			const end = process.hrtime.bigint();

			let result = null;
			if (execution?.reply) {
				result = execution.reply.trim().slice(0, 2000);
			}

			app.Query.collection("command-execution").insertOne({
				id: userData.id,
				command: command.name,
				platform: options.platform.id,
				execution: new Date(),
				channel: channelData?.id ?? null,
				success: true,
				invocation: identifier,
				arguments: JSON.stringify(argumentArray.filter(Boolean)),
				result,
				executionTime: Number(end - start) / 1000000
			});
		}
		catch (e) {
			let origin = "Internal";
			let errorContext;
			const loggingContext = {
				user: userData.id,
				command: command.name,
				invocation: identifier,
				channel: channelData?.id ?? null,
				platform: options.platform.id,
				params: context.params ?? {},
				args: argumentArray
			};

			if (e instanceof app.Error.GenericRequest) {
				origin = "External";
				const { hostname, statusCode, statusMessage } = e.args;
				errorContext = {
					type: "Command request error",
					hostname,
					message: e.simpleMessage,
					statusCode,
					statusMessage
				};
			}

			const errorID = await app.Query.collection("error").countDocuments() + 1;
			await app.Query.collection("error").insertOne({
				id: errorID,
				origin,
				context: loggingContext,
				errorContext: errorContext ?? {
					type: "Unknown",
					message: e.message,
					stack: e.stack
				},
				command: command.name,
				platform: options.platform.id,
				invocation: identifier,
				channel: channelData?.id ?? null,
				user: userData.id,
				error: e.message,
				stack: e.stack
			});

			if (e instanceof app.Error.GenericRequest) {
				const { hostname } = errorContext;
				execution = {
					success: false,
					reason: "generic-request-error",
					reply: `Third party service ${hostname} failed! 🚨 (ID ${errorID})`
				};
			}
			else if (e instanceof app.Got.RequestError) {
				execution = {
					success: false,
					reason: "got-error",
					reply: `Third party service failed! 🚨 (ID ${errorID})`
				};
			}
			else {
				const prettify = (errorID) => {
					const error = `Error ID ${errorID} -`;
					const message = [
						"An error has occurred!",
						`Use {prefix}suggest ${errorID} and how do you use the command`,
						"to report this error!"
					].join(" ");

					return `${error} ${message}`;
				};

				execution = {
					success: false,
					reason: "error",
					reply: `An error occurred! 🚨 ${prettify(errorID)}`
				};
			}
		}

		if (!execution) {
			return execution;
		}
		else if (typeof execution === "string") {
			return execution;
		}

		execution.reply = String(execution.reply).trim();
        
		if (typeof execution.reply !== "undefined") {
			execution.reply = String(execution.reply).trim();
			if (execution.reply.length === 0) {
				execution.reply = "(no message)";
			}
		}

		return execution;
	}

	/**
     * @param {GuildChannel} channel
     * @param {string} author
     * @returns {boolean}
     */
	static isAllowed (channel, author) {
		if (!channel || !author) {
			return false;
		}

		const userPermissions = channel.permissionsFor?.(author);
		const permissionsToCheck = [
			PermissionFlagsBits.Administrator,
			PermissionFlagsBits.ManageGuild,
			PermissionFlagsBits.ManageChannels,
			PermissionFlagsBits.ManageMessages
		];
    
		for (const permissions of permissionsToCheck) {
			if (userPermissions && userPermissions.has(permissions)) {
				return true;
			}
		}
    
		return false;
	}

	static is (string, channelData) {
		const prefix = channelData.prefix ?? Command.getPrefix();
		if (prefix === null) {
			return false;
		}

		return (string.startsWith(prefix) && string.trim().length > prefix.length);
	}

	static get prefix () {
		return Command.getPrefix();
	}

	static getPrefix () {
		return "-" ?? null;
	}
};

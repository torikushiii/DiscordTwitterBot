const {
	ActivityType,
	ChannelType,
	Client,
	DiscordAPIError,
	GatewayIntentBits,
	Partials,
	PermissionFlagsBits
} = require("discord.js");

module.exports = class DiscordController {
	constructor () {
		if (!process.env.SELF_ID) {
			throw new Error("Discord user ID not set");
		}
		else if (!process.env.DISCORD_TOKEN) {
			throw new Error("Discord token has not been configured");
		}
		else if (!process.env.PREFIX) {
			throw new Error("Discord prefix has not been configured");
		}

		this.prefix = process.env.PREFIX;
		this.selfId = process.env.SELF_ID;

		this.#init();
	}

	#init () {
		this.client = new Client({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent
			],
			partials: [
				Partials.Channel
			]
		});

		this.initListeners();

		const token = process.env.DISCORD_TOKEN;
		this.client.login(token);
	}

	initListeners () {
		const client = this.client;

		client.on("ready", () => {
			console.log(`Logged in as ${client.user.tag}!`);
			this.initGuilds();

			client.user.setPresence({
				status: "online",
				activities: [
					{
						name: "TwitterBot v2.0.0",
						type: ActivityType.Playing
					}
				]
			});
		});

		client.on("messageCreate", async (message) => {
			const {
				commandArguments,
				chan,
				userId,
				guild,
				msg,
				privateChannel,
				user
			} = this.parseMessage(message);

			if (privateChannel) {
				return;
			}

			const permissions = message.channel.permissionsFor(this.selfId);
			if (permissions && !permissions.has(PermissionFlagsBits.SendMessages)) {
				return;
			}

			if (this.is(msg)) {
				const commandPrefix = this.prefix;
				const command = msg.replace(commandPrefix, "").split(" ").find(Boolean);
				const args = (commandArguments[0] === commandPrefix)
					? commandArguments.slice(2)
					: commandArguments.slice(1);

				if (message.reference) {
					const { channelId, messageId } = message.reference;
					const referencedChannel = await this.client.channels.fetch(channelId);
					const referencedMessage = await referencedChannel.messages.fetch(messageId);
					const { msg } = this.parseMessage(referencedMessage);

					args.push(...msg.split(" ").filter(Boolean));
				}

				const channelData = {
					id: chan,
					name: message.channel.name,
					guild
				};

				const userData = {
					id: userId,
					name: user
				};

				await this.handleCommand(
					command,
					args.map(i => DiscordController.removeEmoteTags(i)),
					channelData,
					userData,
					{
						guild,
						member: message.member
					}
				);
			}
		});

		client.on("guildCreate", async (guild) => await this.initGuild(guild));
		client.on("guildDelete", async (guild) => await this.removeGuild(guild));
	}

	async send (message, channel, options = {}) {
		const channelData = await this.client.channels.fetch(channel.id);
		if (!channelData) {
			return;
		}

		const messageData = {
			embeds: []
		};

		if (Array.isArray(options.embed) && options.embed.length !== 0) {
			messageData.embeds = options.embed;
		}
		if (typeof message === "string") {
			message = message.replace(/\\g/, "\\\\");
			messageData.content = message;
		}

		try {
			await channelData.send(messageData);
		}
		catch (e) {
			if (e instanceof DiscordAPIError) {
				console.error({
					cause: "DiscordAPIError",
					message: e.message,
					code: e.code,
					error: e
				});
			}
			else if (e.message.includes("connection timeout")) {
				console.warn("Discord connection timeout");
				await this.send(message, channel, options);
			}
			else {
				console.error({
					cause: "UnknownError",
					message: e.message,
					error: e
				});
			}
		}
	}

	async handleCommand (command, args, channelData, userData, options = {}) {
		const execution = await app.Command.execute(command, args, channelData, userData, options);
		if (!execution) {
			return;
		}

		const { reply } = execution;
		if (!reply) {
			return;
		}

		await this.send(reply, channelData);
	}

	destroy () {
		this.client && this.client.destroy();
		this.client = null;
	}

	parseMessage (messageData) {
		const content = messageData.content.replace(/<(https?:\/\/.+?)>/g, "$1");
		const args = [
			...content.split(" ")
		];

		const targetMessage = messageData.cleanContent.replace(/\n/g, " ");

		return {
			msg: DiscordController.removeEmoteTags(targetMessage.replace(/\s+/g, " ")),
			user: messageData.author.username.toLowerCase().replace(/\s+/g, "_"),
			chan: messageData.channel.id,
			channelType: messageData.channel.type,
			userId: String(messageData.author.id),
			author: messageData.author,
			guild: messageData?.channel?.guild ?? null,
			privateChannel: messageData.channel.type === ChannelType.DM,
			commandArguments: args
		};
	}

	static removeEmoteTags (message) {
		return message.replace(/<a?:(.*?):(\d*)>/g, (total, emote) => `${emote} `).trim();
	}

	async initGuild (guild) {
		const { id, name } = guild;
		const cachedGuild = await app.Cache.getByPrefix(`discord-guilds-${id}`);
		if (!cachedGuild) {
			const guildObject = {
				id,
				name,
				channels: []
			};

			await app.Cache.setByPrefix(`discord-guilds-${id}`, guildObject, { expiry: 0 });
		}
	}

	async initGuilds () {
		const guilds = await this.client.guilds.fetch();
		const cachedGuilds = await app.Cache.getKeysByPrefix("discord-guilds-*");
		if (cachedGuilds.length === 0) {
			for (const guild of guilds.values()) {
				const { id, name } = guild;
				const guildObject = {
					id,
					name,
					channels: []
				};

				await app.Cache.setByPrefix(`discord-guilds-${id}`, guildObject, { expiry: 0 });
			}

			return;
		}

		for (const guild of guilds.values()) {
			const { id, name } = guild;
			const cachedGuild = await app.Cache.getByPrefix(`discord-guilds-${id}`);
			if (!cachedGuild) {
				const guildObject = {
					id,
					name,
					channels: []
				};

				await app.Cache.setByPrefix(`discord-guilds-${id}`, guildObject, { expiry: 0 });
			}
		}
	}

	async removeGuild (guild) {
		const { id } = guild;
		await app.Cache.delete(`discord-guilds-${id}`);
	}

	is (string) {
		const prefix = process.env.PREFIX;
		if (prefix === undefined || prefix === null) {
			return false;
		}

		return (string.startsWith(prefix) && string.trim().length > prefix.length);
	}

	prefix () {
		return DiscordController.getPrefix();
	}

	static getPrefix () {
		return process.env.PREFIX ?? null;
	}
};

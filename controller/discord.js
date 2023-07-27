const {
	ActivityType,
	ChannelType,
	Client,
	DiscordAPIError,
	GatewayIntentBits,
	Partials,
	PermissionFlagsBits
} = require("discord.js");

const ignoredChannelTypes = [
	ChannelType.GuildAnnouncement,
	ChannelType.GuildCategory,
	ChannelType.GuildNews,
	ChannelType.GuildNewsThread,
	ChannelType.GuildPrivateThread,
	ChannelType.GuildPublicThread,
	ChannelType.PrivateThread,
	ChannelType.PublicThread
];

module.exports = class DiscordController extends require("./template.js") {
	constructor () {
		super();

		if (!app.Config.has("BOT_ID")) {
			throw new Error("BOT_ID not set");
		}
		else if (!app.Config.has("DISCORD_TOKEN")) {
			throw new Error("DISCORD_TOKEN not set");
		}

		this.#init();

		this.data.permissions = PermissionFlagsBits;
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

		const token = app.Config.get("DISCORD_TOKEN");
		this.client.login(token);
	}

	initListeners () {
		const client = this.client;

		client.on("ready", async () => {
			app.Logger.info(`Logged in as ${client.user.tag}!`);
			this.initGuilds();

			const channelList = await app.Cache.get("twitter-channels");

			const options = [
				{
					name: `TwitterBot | ${app.Command.prefix}help`,
					type: ActivityType.Playing
				},
				{
					name: `${channelList.length} channels`,
					type: ActivityType.Watching
				},
				{
					name: `TwitterBot | ${this.client.guilds.cache.size} servers`,
					type: ActivityType.Playing
				}
			];

			setInterval(() => {
				const randomOption = options[Math.floor(Math.random() * options.length)];
				this.client.user.setPresence({
					status: "online",
					activities: [
						{
							...randomOption
						}
					]
				});
			// every 5 minutes
			}, 300000);
		});

		client.on("messageCreate", async (messageObject) => {
			const {
				author,
				channel,
				channelType,
				commandArgs,
				guild,
				message,
				privateMessage
			} = this.parseMessage(messageObject);

			if (privateMessage) {
				return;
			}

			if (ignoredChannelTypes.includes(channelType)) {
				return;
			}

			const botPermissions = messageObject.channel.permissionsFor?.(app.Config.get("BOT_ID"));
			if (botPermissions && !botPermissions.has(PermissionFlagsBits.SendMessages)) {
				app.Logger.warn(`Bot does not have permission to send messages in guild ${guild.name} (${guild.id})`);
				return;
			}

			const serverData = await app.Cache.get(`discord-guilds-${guild.id}`);
			if (app.Command.is(message, serverData)) {
				const prefix = serverData.prefix ?? app.Command.prefix;
				const command = message.replace(prefix, "").split(" ").find(Boolean);
				const args = (commandArgs[0] === prefix)
					? commandArgs.slice(2)
					: commandArgs.slice(1);

				const userData = author;
				const channelData = this.client.channels.cache.get(channel);
				await this.handleCommand(
					command,
					args,
					channelData,
					userData,
					{
						guild,
						member: messageObject.member
					}
				);
			}
		});

		client.on("guildCreate", async (guild) => this.initGuild(guild));

		client.on("guildDelete", async (guild) => this.removeGuild(guild));

		client.on("error", async (error) => {
			if (error.toString().includes("TextChannel.send")) {
				return;
			}

			app.Logger.error(error);
			this.restart();
		});
	}

	destroy () {
		this.client && this.client.destroy();
		this.client = null;
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
					prefix: app.Command.prefix,
					channels: []
				};

				await app.Cache.setByPrefix(
					`discord-guilds-${id}`,
					guildObject,
					{ expiry: 0 }
				);
			}

			return;
		}

		for (const cachedGuild of cachedGuilds) {
			const guildId = cachedGuild.replace("discord-guilds-", "");
			const guild = guilds.get(guildId);
			if (!guild) {
				await app.Cache.delete(cachedGuild);
				app.Logger.info(`Left guild (${guildId}) ${cachedGuild.name}`);

				continue;
			}
		}

		for (const guild of guilds.values()) {
			const { id, name } = guild;
			const cachedGuild = await app.Cache.getByPrefix(`discord-guilds-${id}`);
			if (!cachedGuild) {
				const guildObject = {
					id,
					name,
					prefix: app.Command.prefix,
					channels: []
				};

				await app.Cache.setByPrefix(
					`discord-guilds-${id}`,
					guildObject,
					{ expiry: 0 }
				);
			}
		}
	}

	async initGuild (guild) {
		const { id, name } = guild;
		const cachedGuild = await app.Cache.getByPrefix(`discord-guilds-${id}`);
		if (!cachedGuild) {
			const guildObject = {
				id,
				name,
				prefix: app.Command.prefix,
				channels: []
			};

			app.Logger.info(`Joined guild (${id}) ${name}`);

			await app.Cache.setByPrefix(
				`discord-guilds-${id}`,
				guildObject,
				{ expiry: 0 }
			);
		}
	}

	async removeGuild (guild) {
		const { id } = guild;
		await app.Cache.delete(`discord-guilds-${id}`);

		app.Logger.info(`Left guild (${id}) ${guild.name}`);
	}
	
	async send (message, channel, options = {}) {
		const channelObject = await this.client.channels.fetch(channel.id);
		if (!channelObject) {
			return;
		}

		const sendTarget = {
			embeds: []
		};

		if (Array.isArray(options.embeds) && options.embeds.length !== 0) {
			sendTarget.embeds = options.embeds;
		}
		if (typeof message === "string") {
			message = message.replace(/\\g/, "\\\\");
			sendTarget.content = message;
		}

		try {
			await channelObject.send(sendTarget);
		}
		catch (e) {
			if (e instanceof DiscordAPIError) {
				throw new app.Error({
					message: "Discord API error",
					args: {
						message: sendTarget,
						channelId: channelObject.id,
						channelName: channelObject.name,
						guildId: channelObject.guild.id,
						guildName: channelObject.guild.name
					}
				});
			}
			else {
				throw new app.Error({
					message: "Unknown error",
					args: {
						message: sendTarget,
						channelId: channelObject.id,
						channelName: channelObject.name,
						guildId: channelObject.guild.id,
						guildName: channelObject.guild.name
					},
					cause: e
				});
			}
		}
	}
	
	async handleCommand (command, args, channel, user, options = {}) {
		const execution = await app.Command.checkAndRun(command, args, channel, user, {
			platform: {
				id: 0,
				name: "discord"
			},
			...options
		});

		if (!execution) {
			return;
		}

		const { reply } = execution;
		const embeds = execution?.discord?.embeds ?? [];
		if (!reply && embeds.length === 0) {
			return;
		}

		if (embeds.length !== 0) {
			await this.send(null, channel, { embeds });
		}
		else {
			await this.send(reply, channel);
		}
	}

	parseMessage (messageObject) {
		const content = messageObject.content.replace(/<(https?:\/\/.+?)>/g, "$1");
		const args = content.split(" ");

		return {
			message: messageObject.cleanContent.replace(/\s+/g, " "),
			channel: messageObject.channel.id,
			channelType: messageObject.channel.type,
			author: messageObject.author,
			guild: messageObject?.channel?.guild ?? null,
			privateMessage: (messageObject.channel.type === ChannelType.DM),
			commandArgs: args
		};
	}

	restart () {
		if (this.client) {
			for (const [event, listener] of Object.entries(this.client._events)) {
				this.client.off(event, listener);
			}

			this.client.destroy();
		}

		this.#init();
	}
};

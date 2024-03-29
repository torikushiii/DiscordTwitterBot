module.exports = {
	name: "set",
	aliases: ["unset"],
	params: [],
	description: "Set/Unset a variable.",
	staticData: (() => ({
		variables: [
			{
				name: "prefix",
				aliases: [],
				parameter: "arguments",
				description: "Set the prefix for the bot for this server.",
				set: async (context, target) => {
					const guildData = await app.Cache.getByPrefix(`discord-guilds-${context.channel.guild.id}`);
					const { prefix } = guildData;

					if (!target) {
						return {
							success: true,
							reply: `The current prefix is \`${prefix}\`.`
						};
					}

					if (target.length > 2) {
						return {
							success: false,
							reply: "The prefix must be 2 characters or less."
						};
					}

					guildData.prefix = target;
					await app.Cache.setByPrefix(`discord-guilds-${context.channel.guild.id}`, guildData, { expiry: 0 });

					return {
						reply: `The prefix has been changed to \`${target}\`.`
					};
				},
				unset: async (context) => {
					const guildData = await app.Cache.getByPrefix(`discord-guilds-${context.channel.guild.id}`);

					guildData.prefix = "-";
					await app.Cache.setByPrefix(`discord-guilds-${context.channel.guild.id}`, guildData, { expiry: 0 });

					return {
						reply: `The prefix has been reset to "-".`
					};
				}
			},
			{
				name: "message",
				aliases: [],
				parameter: "arguments",
				description: "Set custom message when new Tweets are posted.",
				set: async (context, ...text) => {
					const message = text.join(" ");
					if (!message) {
						return {
							success: false,
							reply: "No custom message specified."
						};
					}
					
					const guildData = await app.Cache.getByPrefix(`discord-guilds-${context.channel.guild.id}`);
					guildData.customMessage = message;
					
					await app.Cache.setByPrefix(`discord-guilds-${context.channel.guild.id}`, guildData, { expiry: 0 });

					return {
						reply: `The custom message has been changed successfully for new Tweets.`
					};
				},
				unset: async (context) => {
					const guildData = await app.Cache.getByPrefix(`discord-guilds-${context.channel.guild.id}`);
					guildData.customMessage = null;
					
					await app.Cache.setByPrefix(`discord-guilds-${context.channel.guild.id}`, guildData, { expiry: 0 });

					return {
						reply: `The custom message has been reset successfully for new Tweets.`
					};
				}
			},
			{
				name: "suggestion",
				aliases: ["suggest", "suggestions"],
				parameter: "ID",
				description: "Dismiss your suggestion.",
				set: () => ({
					success: false,
					reply: "You cannot set a suggestion using this command."
				}),
				unset: async (context, ID) => {
					const id = parseInt(ID);
					if (isNaN(id)) {
						return {
							success: false,
							reply: "Invalid suggestion ID."
						};
					}

					const suggestion = await app.Query.collection("suggestions").findOne({ id });
					if (!suggestion) {
						return {
							success: false,
							reply: "Suggestion not found."
						};
					}

					if (suggestion.user.id !== context.user.id) {
						return {
							success: false,
							reply: "You can only unset your own suggestions."
						};
					}

					await app.Query.collection("suggestions").updateOne({ id }, { $set: { status: "unset" } });

					const reply = `Suggestion ID ${id} has been dismissed.`;
					return {
						success: true,
						reply
					};
				}
			}
		]
	})),
	code: (async function set (context, type, ...args) {
		if (!type) {
			return {
				success: false,
				reply: "No type specified."
			};
		}

		const { invocation } = context;
		type = type.toLowerCase();

		const target = this.staticData.variables.find(i => i.name === type || i.aliases.includes(type));
		if (!target) {
			return {
				success: false,
				reply: "Invalid type specified."
			};
		}

		if (target.parameter === "arguments") {
			return await target[invocation](context, ...args);
		}
	}),
	usage: [
		{
			color: 0x00FF00,
			title: "Set",
			description: "Set a variable."
			+ "\n\nUsage: `set <type> <arguments>`"
			+ "\n{prefix}set prefix !"
			+ "\n{prefix}unset prefix (reset to default)"
			+ "\n\n{prefix}set message <your custom message> (set custom message when for new Tweets posted)"
			+ "\n{prefix}set message check out this tweet @customrole"
			+ "\n{prefix}unset message (reset to default)",
			timestamp: new Date()
		}
	]
};

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
			+ "\n{prefix}unset prefix (reset to default)",
			timestamp: new Date()
		}
	]
};

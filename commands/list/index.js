module.exports = {
	name: "list",
	aliases: null,
	params: [],
	description: "List all currently active subscriptions for this server.",
	code: (async function list (context) {
		const guildData = await app.Cache.getByPrefix(`discord-guilds-${context.channel.guild.id}`);
		const { channels } = guildData;

		if (channels.length === 0) {
			return {
				success: false,
				reply: "No users are currently subscribed."
			};
		}

		const userList = channels.map(i => i.username).join(", ");

		return {
			success: true,
			reply: `Currently subscribed to ${channels.length} user(s): ${userList}`
		};
	})
};

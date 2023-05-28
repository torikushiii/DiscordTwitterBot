module.exports = {
	name: "remove",
	aliases: [],
	params: [],
	description: "Remove a user from the timeline fetcher.",
	code: (async function remove (context, ...args) {
		if (args.length === 0) {
			return {
				success: false,
				reply: "No user specified."
			};
		}

		const guildData = await app.Cache.getByPrefix(`discord-guilds-${context.channel.guild.id}`);
		const { channels } = guildData;

		const removed = [];
		const skipped = [];

		for (const user of args) {
			const exists = channels.find(i => i.username === user);
			if (exists) {
				removed.push(user);
				channels.splice(channels.indexOf(exists), 1);
			}
			else {
				skipped.push(user);
			}
		}

		await app.Cache.setByPrefix(`discord-guilds-${context.channel.guild.id}`, guildData, { expiry: 0 });

		if (removed.length === 0 && skipped.length === 0) {
			return {
				success: false,
				reply: "No user(s) were removed."
			};
		}

		if (skipped.length > 0 && removed.length === 0) {
			return {
				success: false,
				reply: `No user(s) were removed. ${skipped.length} user(s) were skipped: ${skipped.join(", ")}.`
			};
		}

		return {
			success: true,
			reply: `Removed ${removed.length} user(s) from the timeline fetcher.`
		};
	})
};

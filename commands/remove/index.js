module.exports = {
	name: "remove",
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

		await app.Cache.setByPrefix(
			`discord-guilds-${context.channel.guild.id}`,
			guildData,
			{ expiry: 0 }
		);

		return {
			success: true,
			reply: `Removed ${removed.length} user(s) from the timeline fetcher.`
		};
	}),
	usage: [
		{
			color: 0x00FF00,
			title: "Remove",
			description: "Unsubscribe from a user's timeline and stop receiving tweets from them."
			+ "\n\n**Usage:**"
			+ "\n`remove <username>`"
			+ "\n`remove <username> <username> <username>`",
			timestamp: new Date(),
			footer: {
				text: "Twitter Timeline Fetcher"
			}
		}
	]
};

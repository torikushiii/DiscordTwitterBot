module.exports = {
	name: "remove-inactive-channels",
	expression: "* * * * *",
	description: "Removes inactive channels from the subscription list.",
	code: (async function removeInactiveChannels () {
		const cachedChannels = await app.Sentinel.getUsers({ usernameOnly: true });
		const guilds = await app.Cache.getKeysByPrefix("discord-guilds-*");
		if (guilds.length === 0) {
			return;
		}

		const allChannels = [];
		for (const guild of guilds) {
			const guildData = await app.Cache.getByPrefix(guild);
			const { channels } = guildData;
			if (channels.length === 0) {
				continue;
			}

			allChannels.push(channels.map(i => i.username));
		}

		const channels = allChannels.flat();
		const inactiveChannels = cachedChannels.filter(i => !channels.includes(i));

		if (inactiveChannels.length === 0) {
			return;
		}

		const cleanedChannels = cachedChannels.filter(i => !inactiveChannels.includes(i));
		await app.Cache.setByPrefix(
			"twitter-channels",
			cleanedChannels,
			{ expireAt: 0 }
		);

		await app.Sentinel.purgeUsers(inactiveChannels);
		app.Logger.info("InactiveChannels", `Removed ${inactiveChannels.length} inactive channels.`);
	})
};

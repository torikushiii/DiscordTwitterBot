const ignoreList = [];

module.exports = {
	name: "check-for-missing-channels",
	expression: "*/5 * * * *",
	description: "Checks for missing channels and adds them to the subscription list.",
	code: (async function checkForMissingChannels () {
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
		const missingChannels = channels.filter(i => !cachedChannels.includes(i));

		if (missingChannels.length === 0) {
			return;
		}

		const data = [];
		for (const channel of missingChannels) {
			if (ignoreList.includes(channel.toLowerCase())) {
				continue;
			}

			let userData = await app.User.get(channel);
			if (!userData) {
				userData = await app.Sentinel.fetchUser(channel);
				if (userData.success === false && userData?.error?.code === "NO_USER_FOUND") {
					ignoreList.push(channel.toLowerCase());
					continue;
				}
			}

			if (userData?.success === false) {
				ignoreList.push(channel.toLowerCase());
				continue;
			}

			data.push(userData.username.toLowerCase());
		}

		if (data.length === 0) {
			return;
		}

		await app.Cache.setByPrefix(
			"twitter-channels",
			[...cachedChannels, ...data],
			{ expireAt: 0 }
		);

		app.Logger.info("MissingChannels", `Added ${data.length} missing channels.`);
	})
};

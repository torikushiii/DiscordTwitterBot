module.exports = {
	name: "add",
	params: [
		{ name: "channel", type: "string" }
	],
	description: "Add a user to the timeline fetcher.",
	code: (async function add (context, ...args) {
		if (args.length === 0) {
			return {
				success: false,
				reply: "No user(s) specified."
			};
		}

		let announceChannel;
		if (context.params.channel) {
			// do checks if channels is text and I have permissions
			announceChannel = context.channel.guild.channels.cache.find(i => i.id === context.params.channel);
			if (!announceChannel) {
				return {
					success: false,
					reply: "Invalid channel specified."
				};
			}
		}
		else {
			announceChannel = context.channel.guild.channels.cache.find(i => i.name === context.channel.name);
		}
        
		const users = args.map(i => i.replace("@", "")).map(i => i.toLowerCase());
		const guildData = await app.Cache.getByPrefix(`discord-guilds-${context.channel.guild.id}`);
		const { channels } = guildData;

		const added = [];
		const errors = [];
		const skipped = [];
		const privateUser = [];

		for (const user of users) {
			const exists = channels.find(i => i.username === user);
			if (exists) {
				skipped.push(user);
			}
			else {
				const data = await app.Sentinel.fetchUser(user);
				if (!data?.success && data?.error?.code === "NO_USER_FOUND") {
					errors.push(user);
					continue;
				}
				else if (data.private) {
					privateUser.push(user);
					continue;
				}

				added.push(user.toLowerCase());
				channels.push({
					userId: data.id,
					username: data.username.toLowerCase(),
					channelId: announceChannel.id
				});
			}
		}

		if (added.length !== 0) {
			const guildObject = {
				id: context.channel.guild.id,
				name: context.channel.guild.name,
				prefix: guildData.prefix,
				channels
			};

			await app.Sentinel.addNewChannels(added);
			await app.Cache.setByPrefix(
				`discord-guilds-${context.channel.guild.id}`,
				guildObject,
				{ expiry: 0 }
			);
		}

		if (added.length === 0 && skipped.length === 0 && errors.length === 0 && privateUser.length === 0) {
			return {
				success: false,
				reply: "No users were added."
			};
		}

		let reply = "";
		if (added.length !== 0) {
			reply += `Added users to <#${announceChannel.id}>\n`;
			reply += `Added ${added.length} user(s) to the timeline fetcher: ${added.join(", ")}\n`;
		}

		if (skipped.length !== 0) {
			reply += `Skipped ${skipped.length} user(s) because you are already subscribed to them: ${skipped.join(", ")}\n`;
		}

		if (errors.length !== 0) {
			reply += `Skipped ${errors.length} user(s) because they do not exist: ${errors.join(", ")}\n`;
		}

		if (privateUser.length !== 0) {
			reply += `Skipped ${privateUser.length} user(s) because their account is private: ${privateUser.join(", ")}\n`;
		}

		return {
			success: true,
			reply
		};
	})
};

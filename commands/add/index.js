module.exports = {
	name: "add",
	aliases: [],
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

		const FetchUser = require("../../src/twitter/user.js");
		
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
		const skipped = [];
		for (const user of users) {
			const exists = channels.find(i => i.name === user);
			if (exists) {
				skipped.push(user);
			}
			else {
				const data = await FetchUser(user);
				if (!data?.success && data?.error?.code === "NO_USER_FOUND") {
					skipped.push(user);
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
				channels
			};

			await app.Cache.setByPrefix(`discord-guilds-${context.channel.guild.id}`, guildObject, { expiry: 0 });
			await app.Sentinel.addNewChannels(added);
		}

		return {
			success: true,
			reply: `Added ${added.length} user(s) to the timeline fetcher and skipped ${skipped.length} user(s).`
		};
	})
};

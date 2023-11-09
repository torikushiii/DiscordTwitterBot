const parser = require("./tweet-processor");
const { EventEmitter } = require("events");

class EventManager extends EventEmitter {}
const events = new EventManager();
module.exports = events;

events.on("new-tweet", async (tweetData) => {
	const guilds = await app.Cache.getKeysByPrefix("discord-guilds-*");
	if (guilds.length === 0) {
		return;
	}

	const userId = tweetData.user.id_str;
	for (const guild of guilds) {
		const guildData = await app.Cache.getByPrefix(guild);
		const { channels, customMessage } = guildData;
		if (channels.length === 0) {
			continue;
		}

		for (const channel of channels) {
			if (channel.userId !== userId) {
				continue;
			}

			const userData = await app.User.get(channel.username);
			if (!userData) {
				app.Logger.warn("EventManager", `User ${channel.username} not found (?)`);
				continue;
			}

			const parsedTweet = await parser(tweetData);
			if (Date.parse(parsedTweet.createdAt) < Date.now() - 300000) {
				continue;
			}

			const { username, name, avatar } = userData;
			let text = `New tweet from ${username}: https://twitter.com/${username}/status/${parsedTweet.id}`;

			if (customMessage && customMessage !== null) {
				text = `${customMessage}: https://twitter.com/${username}/status/${parsedTweet.id}`;
			}

			const description = (parsedTweet?.media?.[0]?.type === "video")
				? `${parsedTweet.text}\n${parsedTweet.media.map(({ media }, i) => `⏵ [[${i + 1}]](${media})`).join("\n")}`
				: parsedTweet.text;

			const embeds = [
				{
					color: 0x0099FF,
					author: {
						name: `${name} (@${username})`,
						icon_url: avatar
					},
					url: "https://twitter.com/",
					description,
					timestamp: new Date(parsedTweet.createdAt),
					footer: {
						text: "Twitter",
						icon_url: "https://i.imgur.com/pl2r3ng.png"
					}
				}
			];

			const media = parsedTweet.media;
			if (media) {
				if (media.length === 1) {
					embeds[0].image = { url: media[0].url };
				}
				else {
					embeds.push(...media.map(({ type, url }) => ({
						url: "https://twitter.com/",
						image: { url }
					})));
				}
			}
				
			await app.Discord.send(text, { id: channel.channelId }, { embeds });
		}
	}
});

const parser = require("./tweet-processor");
const { EventEmitter } = require("events");

// eslint-disable-next-line no-useless-constructor, max-statements-per-line
class EventManager extends EventEmitter { constructor () { super(); } }
const events = new EventManager();
module.exports = events;

events.on("new-tweet", async (tweetData) => {
	const guilds = await app.Cache.getKeysByPrefix("discord-guilds-*");
	if (guilds.length === 0) {
		return;
	}

	const userId = tweetData.core.user_result.result.rest_id;
	for (const guild of guilds) {
		const guildData = await app.Cache.getByPrefix(guild);

		const { channels } = guildData;
		if (channels.length === 0) {
			continue;
		}

		for (const channel of channels) {
			if (channel.userId === userId) {
				const userData = await app.User.get(channel.username);
				if (!userData) {
					app.Logger.warn(`User ${channel.username} not found (?)`);
					continue;
				}

				const parsedTweet = await parser(tweetData);
				if (parsedTweet.createdAt < Date.now() - 300000) {
					continue;
				}

				const text = `New tweet from ${userData.username}: https://twitter.com/${userData.username}/status/${parsedTweet.id}`;
				const embeds = [
					{
						color: 0x0099FF,
						author: {
							name: `${userData.name} (@${userData.username})`,
							icon_url: userData.avatar
						},
						url: "https://twitter.com/",
						description: parsedTweet.text,
						timestamp: new Date(parsedTweet.createdAt),
						footer: {
							text: "Twitter",
							icon_url: "https://i.imgur.com/pl2r3ng.png"
						}
					}
				];

				const medias = [];
				if (parsedTweet?.media?.length > 0) {
					for (const media of parsedTweet.media) {
						medias.push({
							url: "https://twitter.com/",
							image: {
								url: media.url
							}
						});
					}
				}

				if (medias.length === 1) {
					embeds[0].image = medias[0].image;
				}
				else if (medias.length > 1) {
					embeds.push(...medias);
				}

				await app.Discord.send(text, { id: channel.channelId }, { embeds });
			}
		}
	}
});

const user = require("../twitter/user.js");
const tweet = require("../twitter/tweet.js");
const { EventEmitter } = require("events");

// eslint-disable-next-line no-useless-constructor, max-statements-per-line
class EventsManager extends EventEmitter { constructor () { super(); } }
const events = new EventsManager();
module.exports = events;

events.on("new-tweet", async (tweetData) => {
	const guilds = await app.Cache.getKeysByPrefix("discord-guilds-*");
	if (guilds.length === 0) {
		return;
	}
	
	for (const guild of guilds) {
		const guildData = await app.Cache.getByPrefix(guild);
		
		const { channels } = guildData;
		if (channels.length === 0) {
			continue;
		}

		for (const channel of channels) {
			if (channel.userId === tweetData.user.id_str) {
				const userPomise = user(channel.username);
				const parsedTweetPromise = tweet(tweetData.id_str, { tweet: tweetData });

				const [userData, parsedTweet] = await Promise.all([userPomise, parsedTweetPromise]);
				if (userData?.success === false) {
					console.error(userData.error);
					continue;
				}

				if (!parsedTweet?.success || parsedTweet === null) {
					console.error(parsedTweet.error);
					continue;
				}

				const text = `New tweet from ${userData.username}: https://twitter.com/${userData.username}/status/${parsedTweet.data.id}`;
				const embed = [
					{
						color: 0x0099FF,
						author: {
							name: `${userData.name} (@${userData.username})`,
							icon_url: userData.avatar
						},
						url: "https://twitter.com/",
						description: parsedTweet.data.text,
						timestamp: new Date(parsedTweet.data.createdAt),
						footer: {
							text: "Twitter",
							icon_url: "https://i.imgur.com/pl2r3ng.png"
						}
					}
				];

				const medias = [];
				if (parsedTweet.data?.media?.length > 0) {
					for (const media of parsedTweet.data.media) {
						medias.push({
							url: "https://twitter.com/",
							image: {
								url: media.url
							}
						});
					}
				}

				if (medias.length === 1) {
					embed[0].image = medias[0].image;
				}
				else if (medias.length > 1) {
					embed.push(...medias);
				}
				
				await app.Discord.send(text, { id: channel.channelId }, { embed });
			}
		}
	}
});

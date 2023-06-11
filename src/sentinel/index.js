const { CronJob } = require("cron");
const events = require("./events.js");
const user = require("../twitter/user.js");
const api = require("../twitter/index.js");
const channelLists = require("../../channels.json");
const timelineFetcher = require("./timeline-fetcher.js");

class Sentinel {
	static firstRun = true;
	static #ignoreList = [];

	constructor () {
		this.start();
	}

	async fetchTimeline () {
		const userLists = await Sentinel.#getUsers();
		if (userLists.length === 0) {
			app.Log.warn("No users to fetch.");
			return;
		}

		const tweets = await timelineFetcher(userLists);
		if (!tweets.success) {
			console.error(tweets.error);
			return;
		}

		const isRateLimited = tweets.value.every(i => i.length === 0);
		if (isRateLimited) {
			// app.Log.warn("All tweets were returned empty, rate limited?");
			app.Log.warn("All tweets returned empty, fetching guest token...");
			await Sentinel.invalidateGuestToken();

			return await Sentinel.fetchGuestToken();
		}

		await Sentinel.processTweets(tweets.value);
	}

	static async processTweets (tweetsData) {
		for (const item of tweetsData) {
			const userId = item?.[0]?.user_id_str;
			if (!userId) {
				continue;
			}

			const userCachedTweets = await app.Cache.getByPrefix(`twitter-timeline-${userId}`);
			if (!userCachedTweets) {
				await app.Cache.setByPrefix(
					`twitter-timeline-${userId}`,
					item.map(i => i.id_str),
					{ expireAt: 0 }
				);
				
				continue;
			}

			const newTweets = item.filter(i => !userCachedTweets.includes(i.id_str));
			if (newTweets.length === 0) {
				continue;
			}

			await app.Cache.setByPrefix(
				`twitter-timeline-${userId}`,
				[...userCachedTweets, ...newTweets.map(i => i.id_str)],
				{ expireAt: 0 }
			);

			if (!this.firstRun) {
				for (const tweet of newTweets) {
					events.emit("new-tweet", tweet);
				}
			}
		}

		if (this.firstRun) {
			app.Log.info(`Sentinel is now watching ${tweetsData.length} channels.`);
		}

		this.firstRun = false;
	}

	async addNewChannels (channels) {
		if (!Array.isArray(channels)) {
			throw new Error("Channels must be an array.");
		}

		const cachedChannels = await Sentinel.#getUsers({ usernameOnly: true });
		const newChannels = channels.filter(i => !cachedChannels.includes(i));
		if (newChannels.length === 0) {
			return;
		}

		app.Log.info(`Adding ${newChannels.length} new channels.`);

		await app.Cache.setByPrefix(
			"twitter-channels",
			[...cachedChannels, ...newChannels],
			{ expireAt: 0 }
		);
	}

	async purgeUsers (users) {
		if (!Array.isArray(users)) {
			throw new Error("Users must be an array.");
		}

		const cachedChannels = await Sentinel.#getUsers({ usernameOnly: true });
		const channels = cachedChannels.filter(i => !users.includes(i));
		if (channels.length === 0) {
			return;
		}

		app.Log.info(`Purging ${users.length} channels.`);

		for (const user of users) {
			const userData = await app.Cache.get(`gql-twitter-userdata-${user}`);
			if (userData) {
				const userId = userData.id;

				await Promise.all([
					app.Cache.delete(`gql-twitter-userdata-${user}`),
					app.Cache.delete(`twitter-timeline-${userId}`)
				]);
			}
		}

		await app.Cache.setByPrefix(
			"twitter-channels",
			channels,
			{ expireAt: 0 }
		);
	}

	static async #getUsers (options = {}) {
		let channels = await app.Cache.get("twitter-channels");
		if (!channels) {
			app.Log.warn("No channels found in redis, checking channels.json.");
			if (channelLists.length === 0) {
				app.Log.error("No channels found in channels.json");
				return [];
			}

			await app.Cache.setByPrefix(
				"twitter-channels",
				channelLists,
				{ expireAt: 0 }
			);

			channels = channelLists;
		}

		channels = channels.filter(i => !this.#ignoreList.includes(i.toLowerCase()));

		const users = [];
		for (const channel of channels) {
			const userData = await user(channel);
			if (userData?.success === false) {
				if (userData.error.code === "NO_USER_FOUND") {
					this.#ignoreList.push(channel);
					app.Log.warn(`User ${channel} not found, ignoring.`);
				}

				continue;
			}

			users.push(userData);
		}

		if (options.usernameOnly) {
			return users.map(i => i.username.toLowerCase());
		}

		return users;
	}

	async removeInactiveChannels () {
		const cachedChannels = await Sentinel.#getUsers({ usernameOnly: true });
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

		await app.Cache.setByPrefix(
			"twitter-channels",
			cachedChannels.filter(i => !inactiveChannels.includes(i)),
			{ expireAt: 0 }
		);

		app.Log.info(`Removed ${inactiveChannels.length} inactive channels.`);
	}

	static async fetchGuestToken () {
		const { bearerToken } = api.defaults;
		const guestTokenResult = await api.fetchGuestToken(bearerToken);
		if (!guestTokenResult.success) {
			return app.Log.json(guestTokenResult);
		}

		await app.Cache.setByPrefix(
			"gql-twitter-guest-token",
			guestTokenResult.token,
			{ expireAt: 300_000 }
		);

		return true;
	}

	static async invalidateGuestToken () {
		await app.Cache.delete("gql-twitter-guest-token");

		return true;
	}

	async generateErrorId (e, guildId) {
		const id = await app.Cache.get("error-id");
		if (!id) {
			await app.Cache.set({
				key: "error-id",
				value: [
					{
						id: 1,
						source: guildId,
						message: e.message,
						stack: e.stack
					}
				],
				expiry: 0
			});

			return 1;
		}

		const newId = id.length + 1;
		await app.Cache.set({
			key: "error-id",
			value: [
				...id,
				{
					id: newId,
					source: guildId,
					message: e.message,
					stack: e.stack
				}
			],
			expiry: 0
		});

		return newId;
	}

	async start () {
		// Clear the guest token cache to avoid any issues.
		await app.Cache.delete("gql-twitter-guest-token");
		// You can change the cron job to whatever you want.
		// https://crontab.guru/ is a good website to help you with that.
		/* eslint-disable no-new */
		new CronJob("*/5 * * * * *", this.fetchTimeline.bind(this), null, true);
		new CronJob("* * * * *", this.removeInactiveChannels.bind(this), null, true);
		/* eslint-enable no-new */
	}
}

const sentinel = new Sentinel();
module.exports = sentinel;

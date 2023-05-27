const { CronJob } = require("cron");
const events = require("./events.js");
const api = require("../twitter/index.js");
const user = require("../twitter/user.js");
const channelLists = require("../../channels.json");
const timelineFetcher = require("./timeline-fetcher.js");

class Sentinel {
	firstRun = true;
	#ignoreList = [];

	constructor () {
		this.start();
	}

	async fetchTimeline () {
		const userLists = await this.#getUsers();
		if (userLists.length === 0) {
			console.warn("No users to fetch.");
			return;
		}

		// maybe create a batch of guest tokens to use instead of hammering the API with requests
		const guestToken = await this.fetchGuestToken();
		if (guestToken.success === false) {
			console.error(guestToken.error);
			return;
		}

		const tweets = await timelineFetcher(userLists, { fetch: true, guestToken: guestToken.value });
		if (!tweets.success) {
			console.error(tweets.error);
			return;
		}

		const isRateLimited = tweets.value.every(i => i.length === 0);
		if (isRateLimited) {
			console.warn("All tweets were returned empty, rate limited?");
			return;
		}

		await this.processTweets(tweets.value);
	}

	async processTweets (tweetsData) {
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
			console.log(`Sentinel is now watching ${tweetsData.length} channels.`);
		}

		this.firstRun = false;
	}

	async addNewChannels (channels) {
		if (!Array.isArray(channels)) {
			throw new Error("Channels must be an array.");
		}

		const cachedChannels = await this.#getUsers({ usernameOnly: true });
		const newChannels = channels.filter(i => !cachedChannels.includes(i));
		if (newChannels.length === 0) {
			return;
		}

		await app.Cache.setByPrefix(
			"twitter-channels",
			[...cachedChannels, ...newChannels],
			{ expireAt: 0 }
		);
	}

	async #getUsers (options = {}) {
		let channels = await app.Cache.get("twitter-channels");
		if (!channels) {
			console.log("No channels found in cache, defaulting to channels.json.");
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
					console.warn(`User ${channel} not found, ignoring.`);
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

	async fetchGuestToken () {
		const { bearerToken } = api.defaults;
		const guestTokenResult = await api.fetchGuestToken(bearerToken);
		if (!guestTokenResult.success) {
			return {
				success: false,
				error: {
					code: guestTokenResult.error.code,
					message: guestTokenResult.error.message
				}
			};
		}

		return {
			success: true,
			value: guestTokenResult.token
		};
	}

	async start () {
		// You can change the cron job to whatever you want.
		// https://crontab.guru/ is a good website to help you with that.
		const job = new CronJob("*/5 * * * * *", async () => {
			await this.fetchTimeline();
		});

		job.start();
	}
}

const sentinel = new Sentinel();
module.exports = sentinel;

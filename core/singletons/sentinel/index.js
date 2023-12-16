const User = require("./user.js");
const Events = require("./events.js");
const Template = require("../template.js");

const { CronJob } = require("cron");
const channelList = require("../../../channels.json");

module.exports = class SentinelSingleton extends Template {
	firstRun = true;
	#ignoreList = [];
	restartRequested = false;

	ignoreListExpiration = 3_600_000;
	// eslint-disable-next-line no-return-assign
	ignoredListExpirationInterval = setInterval(() => this.#ignoreList = [], this.ignoreListExpiration);
	
	/**
     * @returns {SentinelSingleton}
     */
	static singleton () {
		if (!SentinelSingleton.module) {
			SentinelSingleton.module = new SentinelSingleton();
		}

		return SentinelSingleton.module;
	}

	constructor () {
		super();

		this.cron = new CronJob("* * * * *", () => this.restart());
		this.cron.start();
	}

	async processTweets (tweetData) {
		for (const item of tweetData) {
			const userId = item?.[0]?.user.id_str;
			if (!userId) {
				continue;
			}

			const cachedUserTweets = await app.Cache.getByPrefix(`twitter-timeline-${userId}`);
			if (!cachedUserTweets) {
				await app.Cache.setByPrefix(
					`twitter-timeline-${userId}`,
					item.map(i => i.id_str),
					{ expireAt: 0 }
				);

				continue;
			}

			const cachedTweetsHash = {};
			for (const tweet of cachedUserTweets) {
				cachedTweetsHash[tweet] = true;
			}

			const newTweets = item.filter(i => !cachedTweetsHash[i.id_str]);
			if (newTweets.length === 0) {
				continue;
			}

			await app.Cache.setByPrefix(
				`twitter-timeline-${userId}`,
				[...cachedUserTweets, ...newTweets.map(i => i.id_str)],
				{ expireAt: 0 }
			);

			if (!this.firstRun) {
				for (const tweet of newTweets) {
					Events.emit("new-tweet", tweet);
				}
			}
		}

		if (this.firstRun) {
			this.firstRun = false;
			app.Logger.info("SentinelModule", `Sentinel is now watching ${tweetData.length} users`);
		}
	}

	async fetchUser (username) {
		const user = new User(username);
		const userData = await user.getUserData();
		if (userData.success === false) {
			return {
				success: false,
				error: userData.error
			};
		}

		return userData.data;
	}

	async addNewChannels (channels) {
		if (!Array.isArray(channels)) {
			throw new Error("Channels must be an array.");
		}

		const cachedChannels = await this.getUsers({ usernameOnly: true });
		const newChannels = channels.filter(i => !cachedChannels.includes(i));
		if (newChannels.length === 0) {
			return;
		}

		app.Logger.info("SentinelModule", `Adding ${newChannels.length} new channels.`);
		this.restartRequested = true;

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

		const cachedChannels = await this.getUsers({ usernameOnly: true });
		const channels = cachedChannels.filter(i => !users.includes(i));
		if (channels.length === 0) {
			return;
		}

		app.Logger.info("SentinelModule", `Purging ${users.length} channels.`);

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

	async getUsers (options = {}) {
		let channels = await app.Cache.get("twitter-channels");
		if (!channels) {
			app.Logger.warn("SentinelModule", "No channels found in Redis, checking channels.json");
			if (channelList.length === 0) {
				throw new app.Error({ message: "No channels found in channels.json" });
			}

			await app.Cache.setByPrefix(
				"twitter-channels",
				channelList,
				{ expireAt: 0 }
			);

			channels = channelList;
		}

		channels = channels.filter(i => !this.#ignoreList.includes(i.toLowerCase()));

		const users = [];
		for (const channel of channels) {
			let userData = await app.Cache.get(`gql-twitter-userdata-${channel}`);
			if (!userData) {
				const user = new User(channel);
				userData = await user.getUserData();
				if (userData.success === false && userData.error.code === "NO_USER_FOUND") {
					app.Logger.warn("SentinelModule", `User ${channel} not found, ignoring`);
					this.#ignoreList.push(channel.toLowerCase());
					continue;
				}

				if (userData.success === false && userData.error.code === "USER_SUSPENDED") {
					app.Logger.warn("SentinelModule", `${channel} ${userData.error.message}`);
					this.#ignoreList.push(channel.toLowerCase());
					continue;
				}
				else if (userData.success === false && userData.error.code === "UNKNOWN_ERROR") {
					app.Logger.warn("SentinelModule", `${channel} ${userData.error.message}`);
					this.#ignoreList.push(channel.toLowerCase());
					continue;
				}
					
				await app.Cache.setByPrefix(
					`gql-twitter-userdata-${channel}`,
					userData.data,
					{ expiry: 3 * 864e5 }
				);

				userData = userData.data;
			}

			users.push(userData);
		}

		if (options.usernameOnly) {
			return users.map(i => i.username.toLowerCase());
		}

		return users;
	}
	
	async restart () {
		if (!this.restartRequested) {
			return;
		}

		const { promisify } = require("util");
		const shell = promisify(require("child_process").exec);

		const pm2 = app.Config.get("PM2_NAME");
		await shell(`pm2 restart ${pm2}`);
	}

	get modulePath () { return "sentinel"; }
};

const User = require("./user.js");
const Events = require("./events.js");
const Authenticator = require("./authenticator.js");
const TimelineFetcher = require("./timeline-fetcher.js");
const Template = require("../template.js");

const { CronJob } = require("cron");
const channelList = require("../../../channels.json");

module.exports = class SentinelSingleton extends Template {
	#firstRun = true;
	#setup = true;
	#ignoreList = [];
	
	#config = {};
	#rateLimit;
	
	locked = false;

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

		this.crons = [
			{
				time: "*/5 * * * * *",
				fn: this.fetchTimeline.bind(this)
			},
			{
				time: "* * * * *",
				fn: this.removeInactiveChannels.bind(this)
			},
			{
				time: "*/10 * * * *",
				fn: this.updateAuth.bind(this)
			}
		];

		this.init();
	}

	async init () {
		const auth = await Authenticator.fetchGuestToken();
		if (!auth.success) {
			throw new app.Error({
				message: "Failed to fetch guest token",
				args: auth
			});
		}

		this.#setup = false;
		this.#rateLimit = auth.rateLimit;

		this.#config = {
			guestToken: auth.token,
			bearerToken: auth.bearerToken,
			cookies: auth.cookies
		};

		for (const cron of this.crons) {
			const job = new CronJob(cron.time, cron.fn);
			job.start();
		}
	}

	async fetchTimeline () {
		if (this.#setup) {
			return;
		}

		const userList = await this.getUsers();
		if (userList.length === 0) {
			throw new app.Error({ message: "No users found" });
		}

		const tf = new TimelineFetcher(userList);
		const timeline = await tf.fetch();

		const isRateLimited = timeline.every(i => i.length === 0);
		if (isRateLimited) {
			app.Logger.warn("All tweets returned empty, rate limited (?)");
			return;
		}

		await this.processTweets(timeline);
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

			const newTweets = item.filter(i => !cachedUserTweets.includes(i.id_str));
			if (newTweets.length === 0) {
				continue;
			}

			await app.Cache.setByPrefix(
				`twitter-timeline-${userId}`,
				[...cachedUserTweets, ...newTweets.map(i => i.id_str)],
				{ expireAt: 0 }
			);

			if (!this.#firstRun) {
				for (const tweet of newTweets) {
					Events.emit("new-tweet", tweet);
				}
			}
		}

		if (this.#firstRun) {
			this.#firstRun = false;
			app.Logger.info(`Sentinel is now watching ${tweetData.length} users`);
		}
	}

	async fetchUser (username) {
		const user = new User(username, this.#config);
		const userData = await user.getUserData();
		if (userData.success === false) {
			if (userData.error.code === "RATE_LIMITED") {
				const data = await this.invalidateGuestToken();
			
				this.#config = {
					guestToken: data.token,
					bearerToken: data.bearerToken,
					cookies: data.cookies
				};

				this.#rateLimit = data.rateLimit;
				this.locked = false;
			}

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

		app.Logger.info(`Adding ${newChannels.length} new channels.`);

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

		app.Logger.info(`Purging ${users.length} channels.`);

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
			app.Logger.warn("No channels found in Redis, checking channels.json");
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
				const user = new User(channel, this.#config);
				userData = await user.getUserData();
				if (userData.success === false && userData.error.code === "NO_USER_FOUND") {
					app.Logger.warn(`User ${channel} not found, ignoring`);
					this.#ignoreList.push(channel.toLowerCase());
					continue;
				}

				if (userData.success === false && userData.error.code === "USER_UNAVAILABLE") {
					app.Logger.warn(`${channel} ${userData.error.message}`);
					this.#ignoreList.push(channel.toLowerCase());
					continue;
				}

				if (!userData.data) {
					if (userData.error.code === "RATE_LIMITED") {
						continue;
					}
					
					app.Logger.warn(`No data returned for ${channel}, ignoring`, userData);
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

	async removeInactiveChannels () {
		const cachedChannels = await this.getUsers({ usernameOnly: true });
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

		await this.purgeUsers(inactiveChannels);
		app.Logger.info(`Removed ${inactiveChannels.length} inactive channels.`);
	}

	async invalidateGuestToken () {
		const token = await Authenticator.fetchGuestToken();
		if (!token.success) {
			throw new app.Error({
				message: "Failed to invalidate guest token",
				args: token
			});
		}

		return token;
	}

	async updateAuth () {
		const auth = await Authenticator.fetchGuestToken();
		if (!auth.success) {
			throw new app.Error({
				message: "Failed to update bearer token",
				args: auth
			});
		}

		this.#rateLimit = auth.rateLimit;
		this.#config = {
			guestToken: auth.token,
			bearerToken: auth.bearerToken,
			cookies: auth.cookies
		};
	}

	async updateRateLimit () {
		this.#rateLimit--;

		if (this.#rateLimit === 0 || this.#rateLimit < 0) {
			this.locked = true;
		}
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

	get modulePath () { return "sentinel"; }
};

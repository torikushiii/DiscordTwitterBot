const Auth = require("./auth.js");

module.exports = class TimelineFetcher {
	#userList = [];

	constructor (userList) {
		this.#userList = userList;
		if (this.#userList.length === 0) {
			throw new app.Error({ message: "No users were provided" });
		}
	}

	async fetch (options = {}) {
		if (this.#userList.length === 0) {
			throw new app.Error({ message: "No users found" });
		}
		else if (!Array.isArray(this.#userList)) {
			throw new app.Error({ message: "User list must be an array" });
		}

		if (!options.firstRun) {
			await this.getUserPriority();
		}

		const batchSize = Math.ceil(this.#userList.length / 20);
		const request = [];
		const userArray = [...this.#userList];
		const timelineEntriesMap = new Map();

		while (userArray.length) {
			const batch = userArray.splice(0, batchSize);
			const batchRequest = batch.map(i => this.fetchTimeline(i.username));
			request.push(Promise.allSettled(batchRequest));
		}

		const response = await Promise.all(request);
		for (const batchResponse of response) {
			for (const userResponse of batchResponse) {
				if (userResponse.status === "fulfilled" && userResponse.value.success) {
					const entries = userResponse.value.entries;
					for (const entry of entries) {
						const userId = entry.user.id_str;
						const userEntries = timelineEntriesMap.get(userId) || [];
						userEntries.push(entry);
						timelineEntriesMap.set(userId, userEntries);
					}
				}
			}
		}

		const userTimelines = this.#userList.map(i => timelineEntriesMap.get(i.id) || []);
		return userTimelines;
	}

	async getUserPriority () {
		if (this.#userList.length === 0) {
			throw new app.Error({ message: "No users found" });
		}

		const fetchTimelineData = async (user) => {
			const timelineData = await app.Cache.get(`twitter-timeline-${user.id}`);
			return timelineData
				? {
					id: user.id,
					username: user.username,
					count: timelineData.length
				}
				: null;
		};

		const timelineDataPromises = this.#userList.map(fetchTimelineData);
		const priority = (await Promise.all(timelineDataPromises)).filter(Boolean);

		priority.sort((a, b) => b.count - a.count);
		this.#userList = priority;
	}

	async fetchTimeline (username) {
		const { cookie } = await Auth.cookie();
		const res = await app.Got({
			url: `https://syndication.twitter.com/srv/timeline-profile/screen-name/${username}`,
			responseType: "text",
			throwHttpErrors: false,
			headers: {
				"X-Twitter-Active-User": "yes",
				Referer: `https://twitter.com/`,
				Cookie: cookie
			}
		});

		if (res.statusCode !== 200) {
			return { success: false };
		}

		const nextRegex = /<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/g;
		const nextData = nextRegex.exec(res.body);
		if (!nextData) {
			return { success: false };
		}

		const data = JSON.parse(nextData[1]);
		const timeline = data?.props?.pageProps?.timeline?.entries;
		if (!timeline) {
			app.Logger.error("SentinelTimelineFetcher", `Timeline not found ${username} res: ${res.body}`);
			return { success: false };
		}

		const entries = timeline
			.map(i => i?.content?.tweet)
			.filter(Boolean)
			.filter(i => !i.quotedTweetTombstoneInfo);

		return {
			success: true,
			entries
		};
	}
};

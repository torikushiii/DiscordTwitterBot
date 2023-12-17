const Auth = require("./auth.js");

module.exports = class TimelineFetcher {
	#userList = [];

	constructor (userList) {
		if (!Array.isArray(userList) || userList.length === 0) {
			throw new app.Error({ message: "User list must be an array and not empty" });
		}
		this.#userList = userList;
	}

	async fetch (options = {}) {
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
		const priority = (await Promise.all(timelineDataPromises)).reduce((acc, cur) => {
			if (cur) {
				acc.push(cur);
			}
			return acc;
		}, []);

		priority.sort((a, b) => b.count - a.count);
		this.#userList = priority;
	}

	async fetchTimeline (username) {
		const headers = await Auth.get("timeline");
		const res = await app.Got({
			url: `https://syndication.twitter.com/srv/timeline-profile/screen-name/${username}`,
			responseType: "text",
			throwHttpErrors: false,
			headers
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

		const entries = timeline.reduce((acc, cur) => {
			const tweet = cur?.content?.tweet;
			if (tweet && !tweet.quotedTweetTombstoneInfo) {
				acc.push(tweet);
			}
			return acc;
		}, []);

		return {
			success: true,
			entries
		};
	}
};

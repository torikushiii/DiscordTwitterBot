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

		const batchSize = Math.ceil(this.#userList.length / 10);
		const request = [];
		const userArray = [...this.#userList];
		while (userArray.length) {
			const batch = userArray.splice(0, batchSize);
			const batchRequest = batch.map(i => this.fetchTimeline(i.username));
			request.push(Promise.all(batchRequest));
		}

		const response = await Promise.all(request);
		const timelineEntries = response
			.flat()
			.filter(i => i.success)
			.flatMap(i => i.entries);

		const userTimelines = this.#userList.map(i => {
			const userTimeline = timelineEntries.filter(entry => entry.user.id_str === i.id);
			return userTimeline;
		});

		return userTimelines;
	}

	async getUserPriority () {
		if (this.#userList.length === 0) {
			throw new app.Error({ message: "No users found" });
		}

		const priority = [];
		for (const user of this.#userList) {
			const timelineData = await app.Cache.get(`twitter-timeline-${user.id}`);
			if (timelineData) {
				priority.push({
					id: user.id,
					username: user.username,
					count: timelineData.length
				});
			}
		}

		priority.sort((a, b) => b.count - a.count);
		this.#userList = priority;
	}

	async fetchTimeline (username) {
		const res = await app.Got({
			url: `https://syndication.twitter.com/srv/timeline-profile/screen-name/${username}`,
			responseType: "text",
			throwHttpErrors: false,
			headers: {
				"X-Twitter-Active-User": "yes",
				Referer: `https://twitter.com/`
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

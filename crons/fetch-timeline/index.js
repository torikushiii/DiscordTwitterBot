const TimelineFetcher = require("../../core/singletons/sentinel/timeline-fetcher.js");

module.exports = {
	name: "fetch-timeline",
	expression: "*/5 * * * * *",
	description: "Fetches the timeline of all subscribed users.",
	code: (async function fetchTimeline () {
		const userList = await app.Sentinel.getUsers();
		if (userList.length === 0) {
			throw new app.Error({ message: "No users found in the database." });
		}

		const tf = new TimelineFetcher(userList);
		const timeline = await tf.fetch({ firstRun: app.Sentinel.firstRun });

		const isRateLimited = timeline.every(i => i.length === 0);
		if (isRateLimited) {
			app.Logger.warn("TimelineFetcher", "All tweets returned empty, rate limited (?)");
			return;
		}

		await app.Sentinel.processTweets(timeline);
	})
};

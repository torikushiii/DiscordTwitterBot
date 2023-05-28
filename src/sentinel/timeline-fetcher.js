const timeline = require("../twitter/timeline.js");

const fetchTimeline = async (userLists) => {
	if (userLists.length === 0) {
		return {
			success: false,
			error: "No user(s) specified."
		};
	}
	else if (!Array.isArray(userLists)) {
		return {
			success: false,
			error: "List of users must be an array."
		};
	}

	const batchSize = Math.ceil(userLists.length / 10);
	const requests = [];
	const userArray = [...userLists];
	while (userArray.length) {
		const batch = userArray.splice(0, batchSize);
		const batchRequests = batch.map((user) => timeline(user.id));
		requests.push(Promise.all(batchRequests));
	}

	const results = await Promise.all(requests);

	const timelineEntries = [];
	for (const result of results) {
		for (const value of result) {
			if (value.success === false) {
				continue;
			}
			timelineEntries.push(...value);
		}
	}

	const userTimelines = [];
	for (const user of userLists) {
		userTimelines.push(timelineEntries.filter((i) => i.user_id_str === user.id));
	}

	return {
		success: true,
		value: userTimelines
	};
};

module.exports = fetchTimeline;

const timeline = require("../twitter/timeline.js");

const fetchTimeline = async (userLists, options = {}) => {
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

	const batchSize = 10; // Number of requests to make simultaneously
	const requests = [];
	const userArray = [...userLists];
	while (userArray.length) {
		const batch = userArray.splice(0, batchSize);
		const batchRequests = batch.map((user) => timeline(user.id, options));
		requests.push(Promise.all(batchRequests));
	}

	const results = await Promise.all(requests);

	const entries = [];
	for (const result of results) {
		for (const value of result) {
			if (value.success === false) {
				continue;
			}
			entries.push(...value);
		}
	}

	const tweets = [];
	for (const user of userLists) {
		tweets.push(entries.filter((i) => i.user_id_str === user.id));
	}

	return {
		success: true,
		value: tweets
	};
};

module.exports = fetchTimeline;

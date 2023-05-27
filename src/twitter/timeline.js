const got = require("got");
const api = require("./index.js");

const cacheKeys = {
	entryPage: "gql-twitter-entry-page",
	mainFile: "gql-twitter-main-page",
	bearerToken: "gql-twitter-bearer-token",
	guestToken: "gql-twitter-guest-token",
	slugs: "gql-twitter-api-slugs"
};

const timeline = async (userId) => {
	const { bearerToken } = api.defaults;
	let guestToken = await app.Cache.getByPrefix(cacheKeys.guestToken);
	if (!guestToken) {
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

		guestToken = guestTokenResult.token;
		await app.Cache.setByPrefix(cacheKeys.guestToken, guestToken, { expiry: 300_000 });
	}

	const timelineResult = await fetchTimeline({
		bearerToken,
		guestToken,
		userId
	});

	if (!timelineResult.success) {
		return {
			success: false,
			error: {
				code: timelineResult.error.code,
				message: timelineResult.error.message
			}
		};
	}

	return timelineResult.entries;
};

const fetchTimeline = async (data) => {
	const { defaults } = api;
	const { bearerToken, guestToken, userId } = data;
	const slug = defaults.slugs.timeline;
	const variables = {
		...defaults.timeline.regular.variables,
		userId,
		count: 50
	};

	const features = {
		...defaults.timeline.regular.features
	};

	const varString = encodeURIComponent(JSON.stringify(variables));
	const featureString = encodeURIComponent(JSON.stringify(features));

	const endpoint = "UserTweets";
	const response = await got({
		url: `https://api.twitter.com/graphql/${slug}/${endpoint}?variables=${varString}&features=${featureString}`,
		responseType: "json",
		throwHttpErrors: false,
		headers: {
			Authorization: `Bearer ${bearerToken}`,
			"X-Guest-Token": guestToken,
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
		}
	});

	if (response.statusCode !== 200) {
		return {
			success: false,
			error: {
				message: "Failed to fetch timeline",
				code: "TIMELINE_FETCH_FAILED",
				body: response.body,
				status: response.statusCode
			}
		};
	}

	const timeline = response.body?.data?.user?.result?.timeline_v2?.timeline?.instructions?.[1].entries;
	if (!timeline || !Array.isArray(timeline)) {
		return {
			success: false,
			error: {
				message: "No timeline found",
				code: "TIMELINE_PARSE_FAILED",
				body: response.body,
				status: response.statusCode
			}
		};
	}

	const entries = timeline
		.map(i => i.content.itemContent)
		.filter(Boolean)
		.map(i => i?.tweet_results?.result?.legacy)
		.filter(Boolean);

	return {
		success: true,
		entries
	};
};

module.exports = timeline;

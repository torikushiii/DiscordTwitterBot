const got = require("got");
const api = require("./index.js");

const cacheKeys = {
	entryPage: "gql-twitter-entry-page",
	mainFile: "gql-twitter-main-page",
	bearerToken: "gql-twitter-bearer-token",
	guestToken: "gql-twitter-guest-token",
	slugs: "gql-twitter-api-slugs"
};

const getTweet = async (tweetId, options = {}) => {
	if (!options.fetch) {
		if (!options.tweet) {
			return {
				success: false,
				error: {
					code: "NO_TWEET_PROVIDED",
					message: "No tweet provided"
				}
			};
		}
		
		const tweetData = await parseTweet(options.tweet);
		if (tweetData) {
			return {
				success: true,
				data: tweetData
			};
		}

		return {
			success: false,
			error: {
				code: "TWEET_PARSE_FAILED",
				message: `Failed to parse tweet ${tweetId}`
			}
		};
	}
	else {
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

		const tweetResult = await fetchTweet({
			bearerToken,
			guestToken,
			focalTweetId: tweetId
		});

		if (!tweetResult.success) {
			return {
				success: false,
				error: {
					code: tweetResult.error.code,
					message: tweetResult.error.message
				}
			};
		}

		const parsedTweet = await parseTweet(tweetResult.tweet);
		if (!parsedTweet) {
			return {
				success: false,
				error: {
					code: "TWEET_PARSE_FAILED",
					message: "Failed to parse tweet"
				}
			};
		}

		return {
			success: true,
			data: parsedTweet
		};
	}
};

const fetchTweet = async (data) => {
	const { defaults } = api;
	const { bearerToken, guestToken, focalTweetId } = data;
	const slug = defaults.slugs.tweet;
	const variables = {
		focalTweetId,
		...defaults.tweet.variables
	};

	const features = {
		...defaults.tweet.features
	};

	const varString = encodeURIComponent(JSON.stringify(variables));
	const featureString = encodeURIComponent(JSON.stringify(features));

	const response = await got({
		url: `https://api.twitter.com/graphql/${slug}/TweetDetail?variables=${varString}&features=${featureString}`,
		responseType: "json",
		headers: {
			Authorization: `Bearer ${bearerToken}`,
			"X-guest-token": guestToken,
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
		}
	});

	if (response.statusCode !== 200) {
		return {
			success: false,
			error: {
				message: "Failed to fetch tweet",
				code: "TWEET_FETCH_FAILED",
				body: response.body,
				statusCode: response.statusCode
			}
		};
	}

	const { data: { threaded_conversation_with_injections_v2: { instructions } } } = response.body;
	const { entries } = instructions[0];
	const tweet = entries.find((entry) => entry.entryId === `tweet-${focalTweetId}`);
	if (!tweet) {
		return {
			success: false,
			error: {
				message: "Tweet not found",
				code: "TWEET_NOT_FOUND"
			}
		};
	}

	return {
		success: true,
		// surely the object is always there :Clueless:
		tweet: tweet.content.itemContent.tweet_results.result
	};
};

const parseTweet = async (tweet) => {
	// create a separate function to handle blocked tweets or other tombstones errors
	// by providing cookie auth first
	// if the tweet is still blocked, then return null
	if (tweet?.tombstone) {
		return null;
	}

	const tweetData = {
		type: "tweet"
	};

	const tweetObject = tweet.legacy ?? tweet;
	const { id_str: id, user_id_str: userId, full_text: text, created_at: createdAt } = tweetObject;

	tweetData.id = id;
	tweetData.userId = userId;
	tweetData.text = text;
	tweetData.createdAt = createdAt;

	// Non-fetched quoted tweet doesn't have a `quoted_status_result` property
	// so we need to do a request to fetch it
	if (tweetObject.is_quote_status && !tweet.quoted_status_result) {
		const data = await getTweet(tweetData.id, { fetch: true });
		if (!data.success) {
			return null;
		}

		if (!data || data === null) {
			return null;
		}

		const tweetResult = data.data;
		return tweetResult;
	}

	if (tweetObject.retweeted_status_result) {
		const { legacy: retweetLegacy } = tweetObject.retweeted_status_result.result;
		const { extended_entities: extendedEntities } = retweetLegacy;
		if (extendedEntities) {
			const { media } = extendedEntities;
			if (media) {
				const mediaData = media.map((mediaItem) => {
					const { type, media_url_https: url } = mediaItem;
					return {
						type,
						url
					};
				});

				tweetData.media = mediaData;
			}
		}

		tweetData.type = "retweet";

		return tweetData;
	}
	else if (tweetObject.is_quote_status && tweet.quoted_status_result) {
		const { legacy: quoteLegacy } = tweet.quoted_status_result.result;
		const { extended_entities: extendedEntities } = quoteLegacy;
		if (extendedEntities) {
			const { media } = extendedEntities;
			if (media) {
				const mediaData = media.map((mediaItem) => {
					const { type, media_url_https: url } = mediaItem;
					return {
						type,
						url
					};
				});

				tweetData.media = mediaData;
			}
		}

		const userData = tweet.quoted_status_result.result.core.user_results.result.legacy;
		const { screen_name } = userData;

		tweetData.text = `Quote @${screen_name}: ${text}`;

		tweetData.type = "quote";

		return tweetData;
	}

	const { extended_entities: extendedEntities } = tweetObject;
	if (extendedEntities) {
		const { media } = extendedEntities;
		if (media) {
			const mediaData = media.map((mediaItem) => {
				const { type, media_url_https: url } = mediaItem;
				return {
					type,
					url
				};
			});

			tweetData.media = mediaData;
		}
	}

	return tweetData;
};

module.exports = getTweet;

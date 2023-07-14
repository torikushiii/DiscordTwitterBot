const parseTweet = async (tweet) => {
	const tweetData = {
		type: "tweet"
	};

	const tweetObject = tweet.legacy ?? tweet;
	const { conversation_id_str: id, user_id_str: userId, full_text: text, created_at: createdAt } = tweetObject;

	tweetData.id = id;
	tweetData.userId = userId;
	tweetData.text = text;
	tweetData.createdAt = createdAt;

	console.log(tweet);
	// Non-fetched quoted tweet doesn't have a `quoted_status_result` property
	// so we need to do a request to fetch it
	// if (tweetObject.is_quote_status && !tweet.quoted_status_result) {
	// 	const data = await getTweet(tweetData.id, { fetch: true });
	// 	if (!data.success) {
	// 		return null;
	// 	}

	// 	if (!data || data === null) {
	// 		return null;
	// 	}

	// 	const tweetResult = data.data;
	// 	return tweetResult;
	// }

	if (tweetObject.retweeted_status_result) {
		const { screen_name } = tweetObject.entities.user_mentions[0];
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

		tweetData.text = `RT @${screen_name}: ${retweetLegacy.full_text}`;
		tweetData.type = "retweet";

		return tweetData;
	}
	else if (tweetObject.is_quote_status && tweet.quoted_status_result) {
		const { legacy: quoteLegacy } = tweet.quoted_status_result.result;
		if (quoteLegacy?.extended_entities) {
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

module.exports = parseTweet;

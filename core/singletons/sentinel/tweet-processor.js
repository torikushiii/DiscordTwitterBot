const parseTweet = async (tweet) => {
	const tweetData = {
		type: "tweet"
	};

	const tweetObject = tweet.legacy ?? tweet;
	const { id_str: id, full_text: text, created_at: createdAt } = tweetObject;

	tweetData.id = id;
	tweetData.userId = tweetObject.user.id_str;
	tweetData.text = text;
	tweetData.createdAt = createdAt;

	if (tweetObject.retweeted_status) {
		const { screen_name } = tweetObject.entities.user_mentions[0];
		const retweetData = tweetObject.retweeted_status;
		const { extended_entities: extendedEntities } = retweetData;
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

		tweetData.text = `RT @${screen_name}: ${retweetData.full_text}`;
		tweetData.type = "retweet";

		return tweetData;
	}
	else if (tweetObject.is_quote_status && tweet.quoted_status) {
		const { quoted_status: quotedStatus } = tweetObject;
		if (quotedStatus?.extended_entities) {
			const { extended_entities: extendedEntities } = quotedStatus;
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

		const { screen_name } = tweetObject.user;

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

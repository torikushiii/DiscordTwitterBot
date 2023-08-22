const parseTweet = async (tweet) => {
	const tweetObject = tweet.legacy ?? tweet;
	const { id_str: id, full_text: text, created_at: createdAt } = tweetObject;

	const tweetData = {
		id,
		userId: tweetObject.user.id_str,
		text,
		createdAt,
		type: "tweet"
	};

	const retweetData = tweetObject.retweeted_status;
	if (retweetData) {
		const { screen_name } = tweetObject.entities.user_mentions?.[0] ?? {};
		const { extended_entities: extendedEntities } = retweetData;
		const media = extendedEntities?.media;
		if (media) {
			const mediaData = media.map(({ type, media_url_https: url }) => ({ type, url }));
			tweetData.media = mediaData;
		}
		tweetData.text = `RT @${screen_name}: ${retweetData.full_text}`;
		tweetData.type = "retweet";
	}
	else if (tweetObject.is_quote_status && tweet.quoted_status) {
		const { extended_entities: extendedEntities } = tweetObject.quoted_status;
		const media = extendedEntities?.media;
		if (media) {
			const mediaData = media.map(({ type, media_url_https: url }) => ({ type, url }));
			tweetData.media = mediaData;
		}

		const username = tweetObject.quoted_status.user.screen_name;
		tweetData.text = `Quote @${username}: ${tweetObject.text}`;
		tweetData.type = "quote";
	}

	if (!tweetData.media) {
		const { extended_entities: extendedEntities } = tweetObject;
		const media = extendedEntities?.media;
		if (media) {
			const mediaData = media.map(({ type, media_url_https: url }) => ({ type, url }));
			tweetData.media = mediaData;
		}
	}

	return tweetData;
};

module.exports = parseTweet;

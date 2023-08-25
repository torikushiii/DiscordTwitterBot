const parseTweet = async (tweet) => {
	const tweetObject = tweet.legacy ?? tweet;
	const { id_str: id, full_text: text, created_at: createdAt } = tweetObject;

	const tweetData = {
		id,
		userId: tweetObject.user.id_str,
		text: text.replace(/https:\/\/t.co\/[a-zA-Z0-9]+/g, ""),
		createdAt,
		type: "tweet"
	};

	const retweetData = tweetObject.retweeted_status;
	if (retweetData) {
		const { screen_name } = tweetObject.entities.user_mentions?.[0] ?? {};
		const { extended_entities: extendedEntities } = retweetData;
		const media = extendedEntities?.media;
		if (media) {
			const mediaData = media.map(({ type, media_url_https: url }) => {
				if (type === "photo") {
					const originalUrl = url.replace(/\.jpg$/, "");
					return { type, url: `${originalUrl}?format=jpg&name=orig` };
				}

				return { type, url };
			});

			tweetData.media = mediaData;
		}

		const text = retweetData.full_text.replace(/https:\/\/t.co\/[a-zA-Z0-9]+/g, "");
		tweetData.text = `RT @${screen_name}: ${text}`;
		tweetData.type = "retweet";
	}
	else if (tweetObject.is_quote_status && tweet.quoted_status) {
		const { extended_entities: extendedEntities } = tweetObject.quoted_status;
		const media = extendedEntities?.media;
		if (media) {
			const mediaData = media.map(({ type, media_url_https: url }) => {
				if (type === "photo") {
					const originalUrl = url.replace(/\.jpg$/, "");
					return { type, url: `${originalUrl}?format=jpg&name=orig` };
				}

				return { type, url };
			});
			
			tweetData.media = mediaData;
		}

		const username = tweetObject.quoted_status.user.screen_name;
		const text = tweetObject.text.full_text.replace(/https:\/\/t.co\/[a-zA-Z0-9]+/g, "");
		
		tweetData.text = `Quote @${username}: ${text}`;
		tweetData.type = "quote";
	}

	if (!tweetData.media) {
		const { extended_entities: extendedEntities } = tweetObject;
		const media = extendedEntities?.media;
		if (media) {
			const mediaData = media.map(({ type, media_url_https: url }) => {
				if (type === "photo") {
					const originalUrl = url.replace(/\.jpg$/, "");
					return { type, url: `${originalUrl}?format=jpg&name=orig` };
				}

				return { type, url };
			});

			tweetData.media = mediaData;
		}
	}

	return tweetData;
};

module.exports = parseTweet;

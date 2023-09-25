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
			const mediaData = media.map(({ type, media_url_https: url, video_info }) => {
				if (type === "photo") {
					const isJpg = url.endsWith(".jpg");
					const originalUrl = url.replace(/\.(jpg|png)$/, "");
					return { type, url: `${originalUrl}?format=${isJpg ? "jpg" : "png"}&name=orig` };
				}
				else if (type === "video") {
					const { variants } = video_info;
					if (variants.length === 0) {
						return { type, url };
					}

					const variant = variants.find(({ content_type }) => content_type === "video/mp4");
					if (!variant) {
						return { type, url };
					}
					
					return { type, url, media: variant.url };
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
		const { extended_entities: extendedEntities } = tweetObject;
		const media = extendedEntities?.media;
		if (media) {
			const mediaData = media.map(({ type, media_url_https: url, video_info }) => {
				if (type === "photo") {
					const isJpg = url.endsWith(".jpg");
					const originalUrl = url.replace(/\.(jpg|png)$/, "");
					return { type, url: `${originalUrl}?format=${isJpg ? "jpg" : "png"}&name=orig` };
				}
				else if (type === "video") {
					const { variants } = video_info;
					if (variants.length === 0) {
						return { type, url };
					}

					const variant = variants.find(({ content_type }) => content_type === "video/mp4");
					if (!variant) {
						return { type, url };
					}
					
					return { type, url, media: variant.url };
				}

				return { type, url };
			});

			tweetData.media = mediaData;
		}

		const username = tweetObject.quoted_status.user.screen_name;
		const text = tweetObject?.text?.full_text?.replace?.(/https:\/\/t.co\/[a-zA-Z0-9]+/g, "") ?? tweetObject.text;
		
		tweetData.text = `Quote @${username}: ${text}`;
		tweetData.type = "quote";
	}

	if (!tweetData.media) {
		const { extended_entities: extendedEntities } = tweetObject;
		const media = extendedEntities?.media;
		if (media) {
			const mediaData = media.map(({ type, media_url_https: url, video_info }) => {
				if (type === "photo") {
					const isJpg = url.endsWith(".jpg");
					const originalUrl = url.replace(/\.(jpg|png)$/, "");
					return { type, url: `${originalUrl}?format=${isJpg ? "jpg" : "png"}&name=orig` };
				}
				else if (type === "video") {
					const { variants } = video_info;
					if (variants.length === 0) {
						return { type, url };
					}

					const variant = variants
						.filter(({ content_type }) => content_type === "video/mp4")
						.sort((a, b) => b.bitrate - a.bitrate)[0];
					
					return { type, url, media: variant.url };
				}

				return { type, url };
			});
			
			tweetData.media = mediaData;
		}
	}

	return tweetData;
};

module.exports = parseTweet;

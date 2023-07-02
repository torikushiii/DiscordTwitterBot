const user = async (username) => {
	const userCacheKey = `gql-twitter-userdata-${username}`;
	let userData = await app.Cache.getByPrefix(userCacheKey);
	if (!userData) {
		const userIdResult = await fetchUserData(username);

		if (!userIdResult.success) {
			return {
				success: false,
				error: {
					code: userIdResult.error.code,
					message: userIdResult.error.message
				}
			};
		}

		userData = userIdResult.data;
		await app.Cache.setByPrefix(userCacheKey, userIdResult.data, { expiry: 3 * 864e5 });
	}

	return userData;
};

const fetchUserData = async (user) => {
	const response = await app.Got({
		url: `https://syndication.twitter.com/srv/timeline-profile/screen-name/${user}`,
		responseType: "text"
	});

	const html = response.body;

	const regex = /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/;
	const timelineData = JSON.parse(html.match(regex)[1]);
	const timeline = timelineData.props.pageProps.timeline.entries;

	if (response.statusCode !== 200) {
		return {
			success: false,
			error: {
				message: "Failed to fetch user id",
				code: "FETCH_USER_FAILED",
				body: response.body,
				status: response.statusCode
			}
		};
	}

	const id = timeline?.[0]?.content?.tweet?.user?.id_str;
	if (!id) {
		return {
			success: false,
			error: {
				message: "No user found with that username",
				code: "NO_USER_FOUND",
				body: response.body
			}
		};
	}

	const { name, screen_name, profile_image_url_https, protected: isPrivate } = timeline[0].content.tweet.user;
	return {
		success: true,
		data: {
			id: String(id),
			name,
			username: screen_name,
			avatar: profile_image_url_https,
			private: isPrivate
		}
	};
};

module.exports = user;

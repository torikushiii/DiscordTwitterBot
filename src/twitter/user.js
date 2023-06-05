const { defaults, fetchGuestToken, cacheKeys } = require("./index.js");

const user = async (username) => {
	const { bearerToken } = defaults;
	let guestToken = await app.Cache.getByPrefix(cacheKeys.guestToken);
	if (!guestToken) {
		const guestTokenResult = await fetchGuestToken(bearerToken);
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
		await app.Cache.setByPrefix(cacheKeys.guestToken, guestToken, { expiry: 120_000 });
	}

	const { slugs } = defaults;
	const userCacheKey = `gql-twitter-userdata-${username}`;
	let userData = await app.Cache.getByPrefix(userCacheKey);
	if (!userData) {
		const userIdResult = await fetchUserData({
			bearerToken,
			guestToken,
			username,
			slug: slugs.user
		});

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

const fetchUserData = async (data) => {
	const { defaults } = api;
	const { bearerToken, guestToken, slug, username } = data;
	const variables = {
		screen_name: username,
		...defaults.user.variables
	};

	const features = {
		...defaults.user.features
	};

	const varString = encodeURIComponent(JSON.stringify(variables));
	const featureString = encodeURIComponent(JSON.stringify(features));

	const response = await app.Got({
		url: `https://api.twitter.com/graphql/${slug}/UserByScreenName?variables=${varString}&features=${featureString}`,
		responseType: "json",
		headers: {
			Authorization: `Bearer ${bearerToken}`,
			"x-guest-token": guestToken,
			"x-csrf-token": defaults.csrfToken,
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
		}
	});

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

	const id = response.body.data?.user?.result?.rest_id;
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

	const { name, screen_name, profile_image_url_https, protected: isPrivate } = response.body.data.user.result.legacy;
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

const Auth = require("./auth.js");

module.exports = class User {
	#user;

	static gqlFeatures = {
		hidden_profile_likes_enabled: true,
		hidden_profile_subscriptions_enabled: true,
		responsive_web_graphql_exclude_directive_enabled: true,
		verified_phone_label_enabled: false,
		subscriptions_verification_info_is_identity_verified_enabled: true,
		subscriptions_verification_info_verified_since_enabled: true,
		highlights_tweets_tab_ui_enabled: true,
		creator_subscriptions_tweet_preview_api_enabled: true,
		responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
		responsive_web_graphql_timeline_navigation_enabled: true
	};

	constructor (user) {
		this.#user = user;
		if (!this.#user) {
			throw new app.Error({ message: "User is required to fetch data" });
		}
	}

	async getUserData () {
		const { cookie, authorization, csrf } = await Auth.cookie();

		const variables = encodeURIComponent(JSON.stringify({ screen_name: this.#user }));
		const features = encodeURIComponent(JSON.stringify(User.gqlFeatures));

		const res = await app.Got({
			url: `https://twitter.com/i/api/graphql/G3KGOASz96M-Qu0nwmGXNg/UserByScreenName?variables=${variables}&features=${features}`,
			responseType: "json",
			throwHttpErrors: false,
			headers: {
				Authorization: authorization,
				"X-Twitter-Active-User": "yes",
				Referer: `https://twitter.com/`,
				"X-Csrf-Token": csrf,
				Cookie: cookie
			}
		});

		if (res.statusCode !== 200) {
			console.error(res.body);
			return { success: false };
		}

		const data = res?.body?.data?.user?.result;
		if (!data) {
			return {
				success: false,
				error: {
					code: "NO_USER_FOUND"
				}
			};
		}

		if (data?.reason) {
			if (data.reason.toLowerCase() === "suspended") {
				return {
					success: false,
					error: {
						code: "USER_SUSPENDED",
						message: data.message
					}
				};
			}
			else {
				return {
					success: false,
					error: {
						code: "UNKNOWN_ERROR",
						message: data.reason
					}
				};
			}
		}

		const userData = data.legacy;
		return {
			success: true,
			data: {
				id: String(data.rest_id),
				name: userData.name,
				username: userData.screen_name,
				avatar: userData.profile_image_url_https,
				private: userData.protected
			}
		};
	}
};

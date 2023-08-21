module.exports = class User {
	#user;
	#bearer;
	#guestToken;
	#cookies;

	// static gqlFeatures = {
	// 	android_graphql_skip_api_media_color_palette: false,
	// 	blue_business_profile_image_shape_enabled: false,
	// 	creator_subscriptions_subscription_count_enabled: false,
	// 	creator_subscriptions_tweet_preview_api_enabled: true,
	// 	freedom_of_speech_not_reach_fetch_enabled: false,
	// 	graphql_is_translatable_rweb_tweet_is_translatable_enabled: false,
	// 	hidden_profile_likes_enabled: false,
	// 	highlights_tweets_tab_ui_enabled: false,
	// 	interactive_text_enabled: false,
	// 	longform_notetweets_consumption_enabled: true,
	// 	longform_notetweets_inline_media_enabled: false,
	// 	longform_notetweets_richtext_consumption_enabled: true,
	// 	longform_notetweets_rich_text_read_enabled: false,
	// 	responsive_web_edit_tweet_api_enabled: false,
	// 	responsive_web_enhance_cards_enabled: false,
	// 	responsive_web_graphql_exclude_directive_enabled: true,
	// 	responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
	// 	responsive_web_graphql_timeline_navigation_enabled: false,
	// 	responsive_web_media_download_video_enabled: false,
	// 	responsive_web_text_conversations_enabled: false,
	// 	responsive_web_twitter_article_tweet_consumption_enabled: false,
	// 	responsive_web_twitter_blue_verified_badge_is_enabled: true,
	// 	rweb_lists_timeline_redesign_enabled: true,
	// 	spaces_2022_h2_clipping: true,
	// 	spaces_2022_h2_spaces_communities: true,
	// 	standardized_nudges_misinfo: false,
	// 	subscriptions_verification_info_enabled: true,
	// 	subscriptions_verification_info_reason_enabled: true,
	// 	subscriptions_verification_info_verified_since_enabled: true,
	// 	super_follow_badge_privacy_enabled: false,
	// 	super_follow_exclusive_tweet_notifications_enabled: false,
	// 	super_follow_tweet_api_enabled: false,
	// 	super_follow_user_api_enabled: false,
	// 	tweet_awards_web_tipping_enabled: false,
	// 	tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
	// 	tweetypie_unmention_optimization_enabled: false,
	// 	unified_cards_ad_metadata_container_dynamic_card_content_query_enabled: false,
	// 	verified_phone_label_enabled: false,
	// 	vibe_api_enabled: false,
	// 	view_counts_everywhere_api_enabled: false
	// };

	constructor (user, config) {
		this.#user = user;
		if (!this.#user) {
			throw new app.Error({ message: "User is required to fetch data" });
		}

		// this.#guestToken = config.guestToken;
		// if (!this.#guestToken) {
		// 	throw new app.Error({ message: "Guest token is required to get user data" });
		// }

		// this.#bearer = config.bearerToken;
		// if (!this.#bearer) {
		// 	throw new app.Error({ message: "Bearer token is required to get user data" });
		// }

		// this.#cookies = config.cookies;
		// if (!this.#cookies) {
		// 	throw new app.Error({ message: "Cookies are required to get user data" });
		// }
	}

	async getUserData () {
		const res = await app.Got({
			url: `https://syndication.twitter.com/srv/timeline-profile/screen-name/${this.#user}`,
			responseType: "text",
			headers: {
				Referer: `https://twitter.com/`,
				Cookie: app.Config.get("COOKIE")
			}
		});

		if (res.statusCode !== 200) {
			return { success: false };
		}

		const nextRegex = /<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/g;
		const nextData = nextRegex.exec(res.body);

		const data = JSON.parse(nextData[1]);
		const timeline = data?.props?.pageProps?.timeline?.entries.find(i => i?.type === "tweet");
		if (!timeline) {
			return {
				success: false,
				error: {
					code: "NO_USER_FOUND"
				}
			};
		}

		const userData = timeline?.content?.tweet?.user;
		if (!userData) {
			return {
				success: false,
				error: {
					code: "NO_USER_FOUND"
				}
			};
		}

		return {
			success: true,
			data: {
				id: String(userData.id_str),
				name: userData.name,
				username: userData.screen_name,
				avatar: userData.profile_image_url_https,
				private: userData.protected
			}
		};
	}
};

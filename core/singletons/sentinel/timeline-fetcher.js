module.exports = class TimelineFetcher {
	#userList = [];
	#bearer;
	#guestToken;

	static gqlFeatures = {
		android_graphql_skip_api_media_color_palette: false,
		blue_business_profile_image_shape_enabled: false,
		creator_subscriptions_subscription_count_enabled: false,
		creator_subscriptions_tweet_preview_api_enabled: true,
		freedom_of_speech_not_reach_fetch_enabled: false,
		graphql_is_translatable_rweb_tweet_is_translatable_enabled: false,
		hidden_profile_likes_enabled: false,
		highlights_tweets_tab_ui_enabled: false,
		interactive_text_enabled: false,
		longform_notetweets_consumption_enabled: true,
		longform_notetweets_inline_media_enabled: false,
		longform_notetweets_richtext_consumption_enabled: true,
		longform_notetweets_rich_text_read_enabled: false,
		responsive_web_edit_tweet_api_enabled: false,
		responsive_web_enhance_cards_enabled: false,
		responsive_web_graphql_exclude_directive_enabled: true,
		responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
		responsive_web_graphql_timeline_navigation_enabled: false,
		responsive_web_media_download_video_enabled: false,
		responsive_web_text_conversations_enabled: false,
		responsive_web_twitter_article_tweet_consumption_enabled: false,
		responsive_web_twitter_blue_verified_badge_is_enabled: true,
		rweb_lists_timeline_redesign_enabled: true,
		spaces_2022_h2_clipping: true,
		spaces_2022_h2_spaces_communities: true,
		standardized_nudges_misinfo: false,
		subscriptions_verification_info_enabled: true,
		subscriptions_verification_info_reason_enabled: true,
		subscriptions_verification_info_verified_since_enabled: true,
		super_follow_badge_privacy_enabled: false,
		super_follow_exclusive_tweet_notifications_enabled: false,
		super_follow_tweet_api_enabled: false,
		super_follow_user_api_enabled: false,
		tweet_awards_web_tipping_enabled: false,
		tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
		tweetypie_unmention_optimization_enabled: false,
		unified_cards_ad_metadata_container_dynamic_card_content_query_enabled: false,
		verified_phone_label_enabled: false,
		vibe_api_enabled: false,
		view_counts_everywhere_api_enabled: false
	};

	constructor (userList, config) {
		this.#userList = userList;
		this.#guestToken = config.guestToken;
		this.#bearer = config.bearerToken;
	}

	async fetch () {
		if (this.#userList.length === 0) {
			throw new app.Error({ message: "No users found" });
		}
		else if (!Array.isArray(this.#userList)) {
			throw new app.Error({ message: "User list must be an array" });
		}

		const batchSize = Math.ceil(this.#userList.length / 10);
		const request = [];
		const userArray = [...this.#userList];
		while (userArray.length) {
			const batch = userArray.splice(0, batchSize);
			const batchRequest = batch.map(i => this.fetchTimeline(i.id));
			request.push(Promise.all(batchRequest));
		}

		const response = await Promise.all(request);

		const timelineEntries = [];
		for (const result of response) {
			for (const entry of result) {
				if (entry.success) {
					timelineEntries.push(...entry.entries);
				}
			}
		}

		const userTimelines = [];
		for (const user of this.#userList) {
			const userTimeline = timelineEntries.filter(i => i.core.user_result.result.rest_id === user.id);
			userTimelines.push(userTimeline);
		}

		return userTimelines;
	}

	async fetchTimeline (userId) {
		const features = encodeURIComponent(JSON.stringify(TimelineFetcher.gqlFeatures));
		const variables = encodeURIComponent(JSON.stringify({ rest_id: userId }));

		const res = await app.Got({
			url: `https://api.twitter.com/graphql/8IS8MaO-2EN6GZZZb8jF0g/UserWithProfileTweetsAndRepliesQueryV2?variables=${variables}&features=${features}`,
			responseType: "json",
			throwHttpErrors: false,
			headers: {
				Authorization: `Bearer ${this.#bearer}`,
				"X-Guest-Token": this.#guestToken,
				"X-Twitter-Active-User": "yes",
				Referer: `https://twitter.com/`
			}
		});

		if (res.statusCode !== 200) {
			return { success: false };
		}

		await app.Sentinel.updateRateLimit();
		if (app.Sentinel.locked) {
			return { success: false };
		}

		const timelineInstruction = res.body.data.user_result.result.timeline_response.timeline.instructions.find(i => i.__typename === "TimelineAddEntries");
		if (!timelineInstruction) {
			return { success: false };
		}

		const tweets = timelineInstruction.entries
			.map(i => i.content.content)
			.filter(Boolean)
			.map(i => i?.tweetResult?.result)
			.filter(Boolean);

		return {
			success: true,
			entries: tweets
		};
	}
};

const defaults = {
	csrfToken: "2a5b3ceebc9bac4b4abafe716185b2ef",
	bearerToken: "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
	slugs: {
		timeline: "oPHs3ydu7ZOOy2f02soaPA",
		timelineReplies: "nrdle2catTyGnTyj1Qa7wA",
		user: "hVhfo_TquFTmgL7gYwf91Q",
		tweet: "lXI2kaM2hgmbf7h42kpxuA"
	},
	user: {
		variables: {
			withSafetyModeUserFields: true,
			withSuperFollowsUserFields: true
		},
		features: {
			responsive_web_twitter_blue_verified_badge_is_enabled: true,
			verified_phone_label_enabled: false,
			responsive_web_graphql_timeline_navigation_enabled: true
		}
	},
	timeline: {
		regular: {
			variables: {
				count: 100,
				includePromotedContent: true,
				withQuickPromoteEligibilityTweetFields: true,
				withSuperFollowsUserFields: true,
				withDownvotePerspective: false,
				withReactionsMetadata: false,
				withReactionsPerspective: false,
				withSuperFollowsTweetFields: true,
				withVoice: true,
				withV2Timeline: true
			},
			features: {
				responsive_web_twitter_blue_verified_badge_is_enabled: true,
				verified_phone_label_enabled: false,
				responsive_web_graphql_timeline_navigation_enabled: true,
				longform_notetweets_consumption_enabled: true,
				tweetypie_unmention_optimization_enabled: true,
				vibe_api_enabled: true,
				responsive_web_edit_tweet_api_enabled: true,
				graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
				freedom_of_speech_not_reach_appeal_label_enabled: false,
				view_counts_everywhere_api_enabled: true,
				standardized_nudges_misinfo: true,
				tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
				interactive_text_enabled: true,
				responsive_web_text_conversations_enabled: false,
				responsive_web_enhance_cards_enabled: false
			}
		},
		replies: {
			variables: {
				count: 100,
				includePromotedContent: true,
				withCommunity: true,
				withSuperFollowsUserFields: true,
				withDownvotePerspective: false,
				withReactionsMetadata: false,
				withReactionsPerspective: false,
				withSuperFollowsTweetFields: true,
				withVoice: true,
				withV2Timeline: true
			},
			features: {
				responsive_web_twitter_blue_verified_badge_is_enabled: true,
				responsive_web_graphql_exclude_directive_enabled: false,
				verified_phone_label_enabled: false,
				responsive_web_graphql_timeline_navigation_enabled: true,
				responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
				tweetypie_unmention_optimization_enabled: true,
				vibe_api_enabled: true,
				responsive_web_edit_tweet_api_enabled: true,
				graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
				view_counts_everywhere_api_enabled: true,
				longform_notetweets_consumption_enabled: true,
				tweet_awards_web_tipping_enabled: false,
				freedom_of_speech_not_reach_fetch_enabled: false,
				freedom_of_speech_not_reach_appeal_label_enabled: false,
				standardized_nudges_misinfo: true,
				tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
				interactive_text_enabled: true,
				responsive_web_text_conversations_enabled: false,
				responsive_web_enhance_cards_enabled: false
			}
		}
	},
	tweet: {
		variables: {
			referrer: "profile",
			with_rux_injections: false,
			includePromotedContent: true,
			withCommunity: true,
			withQuickPromoteEligibilityTweetFields: true,
			withBirdwatchNotes: true,
			withSuperFollowsUserFields: true,
			withDownvotePerspective: false,
			withReactionsMetadata: false,
			withReactionsPerspective: false,
			withSuperFollowsTweetFields: true,
			withVoice: true,
			withV2Timeline: true
		},
		features: {
			responsive_web_twitter_blue_verified_badge_is_enabled: true,
			verified_phone_label_enabled: true,
			responsive_web_graphql_timeline_navigation_enabled: true,
			view_counts_public_visibility_enabled: true,
			longform_notetweets_consumption_enabled: false,
			tweetypie_unmention_optimization_enabled: true,
			responsive_web_uc_gql_enabled: true,
			vibe_api_enabled: true,
			responsive_web_edit_tweet_api_enabled: true,
			graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
			view_counts_everywhere_api_enabled: true,
			standardized_nudges_misinfo: true,
			tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
			interactive_text_enabled: true,
			responsive_web_text_conversations_enabled: false,
			responsive_web_enhance_cards_enabled: false
		}
	}
};

const fetchGuestToken = async (bearerToken) => {
	const response = await app.Got({
		url: "https://api.twitter.com/1.1/guest/activate.json",
		method: "POST",
		responseType: "json",
		headers: {
			Authorization: `Bearer ${bearerToken}`
		}
	});

	if (response.statusCode !== 200) {
		return {
			success: false,
			error: {
				message: "Failed to fetch guest token",
				code: "GUEST_TOKEN_FETCH_FAILED",
				body: response.body,
				status: response.statusCode
			}
		};
	}

	const token = response.body.guest_token;
	if (!token) {
		return {
			success: false,
			error: {
				message: "No guest token found",
				code: "NO_TOKEN_FOUND",
				body: response.body,
				status: response.statusCode
			}
		};
	}

	return {
		success: true,
		token
	};
};

module.exports = {
	defaults,
	fetchGuestToken
};

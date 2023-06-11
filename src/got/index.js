module.exports = (async () => {
	const gotModule = await import("got");

	const got = gotModule.default.extend({
		responseType: "json",
		retry: {
			limit: 2
		},
		timeout: {
			request: 30000
		},
		mutableDefaults: true,
		throwHttpErrors: false,
		headers: {
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
		},
		hooks: {
			beforeError: [
				err => {
					if (!err || err.code !== "ETIMEDOUT") {
						return err;
					}

					console.error({
						context: {
							code: err.code,
							responseType: err?.options?.responseType ?? null,
							timeout: err?.options?.timeout ?? null,
							url: err?.options?.url.toString() ?? null
						}
					});

					return err;
				}
			]
			// afterResponse: [
			// 	async (response, retryWithMergedOptions) => {
			// 		if (response.statusCode === 429) {
			// 			const { bearerToken } = api.defaults;
			// 			const guestTokenResult = await api.fetchGuestToken(bearerToken);
			// 			if (!guestTokenResult.success) {
			// 				return {
			// 					success: false,
			// 					error: {
			// 						code: guestTokenResult.error.code,
			// 						message: guestTokenResult.error.message
			// 					}
			// 				};
			// 			}

			// 			const updatedOptions = {
			// 				headers: {
			// 					"X-Guest-Token": guestTokenResult.token
			// 				}
			// 			};

			// 			await app.Cache.delete("gql-twitter-guest-token");
			// 			await app.Cache.setByPrefix("gql-twitter-guest-token", guestTokenResult.token, { expiry: 300_000 });

			// 			got.defaults.options.merge(updatedOptions);

			// 			return retryWithMergedOptions(updatedOptions);
			// 		}

			// 		return response;
			// 	}
			// ]
		}
	});

	return got;
})();

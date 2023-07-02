module.exports = (async () => {
	const gotModule = await import("got");

	const got = gotModule.default.extend({
		responseType: "json",
		http2: true,
		retry: {
			limit: 2
		},
		timeout: {
			request: 30000
		},
		mutableDefaults: true,
		throwHttpErrors: false,
		headers: {
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0"
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
		}
	});

	return got;
})();

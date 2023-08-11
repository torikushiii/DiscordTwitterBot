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
		throwHttpErrors: true,
		headers: {
			"User-Agent": "TwitterAndroid/9.95.0-release.0 (29950000-r-0) ONEPLUS+A3010/9 (OnePlus;ONEPLUS+A3010;OnePlus;OnePlus3;0;;1;2016)",
			"X-Twitter-API-Version": 5,
			"X-Twitter-Client": "TwitterAndroid",
			"X-Twitter-Client-Version": "9.95.0-release.0",
			"OS-Version": "28",
			"System-User-Agent": "Dalvik/2.1.0 (Linux; U; Android 9; ONEPLUS A3010 Build/PKQ1.181203.001)",
			"X-Twitter-Active-User": "yes"
		},
		hooks: {
			beforeError: [
				(e) => new app.Error.GenericRequest({
					body: e.response?.body ?? null,
					statusCode: e.response?.statusCode ?? null,
					statusMessage: e.response?.statusMessage ?? null,
					hostname: e.options?.url.hostname ?? null,
					message: e.message,
					stack: e.stack
				})
			]
		}
	});

	return got;
})();

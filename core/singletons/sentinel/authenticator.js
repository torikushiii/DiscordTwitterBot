module.exports = class Authenticator {
	static bearerToken = "AAAAAAAAAAAAAAAAAAAAAFQODgEAAAAAVHTp76lzh3rFzcHbmHVvQxYYpTw%3DckAlMINMjmCwxUcaXbAN4XqJVdgMJaHqNOFgPMK0zN1qLqLQCF";
	
	static response = {
		success: false,
		token: null,
		bearerToken: this.bearerToken,
		code: -1,
		cookies: {},
		rateLimit: 495
	};

	static async fetchGuestToken () {
		const res = await app.Got({
			url: "https://api.twitter.com/1.1/guest/activate.json",
			method: "POST",
			responseType: "json",
			throwHttpErrors: false,
			headers: {
				Authorization: `Bearer ${this.bearerToken}`
			}
		});

		if (res.statusCode !== 200) {
			this.response.token = res.body;

			return this.response;
		}

		this.response.code = 200;
		this.response.success = true;
		this.response.token = res.body.guest_token;
        
		const parseCookies = (headers) => {
			const cookies = (headers instanceof Map)
				? [...headers].filter((header) => header[0] === "set-cookie").map((header) => header[1]) ?? []
				: headers?.["set-cookie"] ?? [];

			return cookies.map((cookie) => cookie.split(";")[0]);
		};

		this.response.cookies = parseCookies(res.headers);

		return this.response;
	}
};

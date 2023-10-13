module.exports = class User {
	#user;

	constructor (user) {
		this.#user = user;
		if (!this.#user) {
			throw new app.Error({ message: "User is required to fetch data" });
		}
	}

	async getUserData () {
		const res = await app.Got({
			url: `https://syndication.twitter.com/srv/timeline-profile/screen-name/${this.#user}`,
			responseType: "text",
			throwHttpErrors: false,
			headers: {
				Referer: `https://twitter.com/`
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

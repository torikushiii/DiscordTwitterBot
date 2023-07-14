module.exports = class User extends require("./template.js") {
	static data = new Map();

	constructor (data) {
		super();

		this.id = data.id;

		this.name = data.name;

		this.username = data.username;

		this.avatar = data.avatar;

		this.private = data.private;
	}

	static async initialize () {
		User.data = new Map();
		await this.loadData();
		return User;
	}

	static async loadData () {
		User.data = User.data || new Map();
	}

	static async get (user) {
		if (user instanceof User) {
			return user;
		}
		else if (typeof user === "string") {
			const mapCache = User.data.get(user);
			if (mapCache) {
				return mapCache;
			}

			if (app.Cache && app.Cache.active) {
				const cache = await app.Cache.get(`gql-twitter-userdata-${user}`);
				if (cache) {
					if (!User.data.has(user)) {
						User.data.set(user, cache);
					}

					return cache;
				}
			}

			return null;
		}
		else {
			throw new app.Error({
				message: "Invalid user type",
				args: {
					user,
					type: typeof user
				}
			});
		}
	}

	static async set (user, data) {
		if (User.data.has(user)) {
			return;
		}

		User.data.set(user, data);
		if (app.Cache && app.Cache.active) {
			await app.Cache.setByPrefix(
				`gql-twitter-userdata-${user}`,
				data,
				{ expiry: 3 * 864e5 }
			);
		}
	}
};

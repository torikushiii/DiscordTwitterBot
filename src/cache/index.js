const Redis = require("ioredis");

const GROUP_DELIMITER = String.fromCharCode(7);
const ITEM_DELIMITER = String.fromCharCode(8);

module.exports = class CacheSingleton extends require("./template.js") {
	/** @type {Redis} */
	#server = null;
	#active = false;
	#version = null;

	/**
	 * @returns {CacheSingleton}
	 */
	static singleton () {
		if (!CacheSingleton.module) {
			CacheSingleton.module = new CacheSingleton();
		}

		return CacheSingleton.module;
	}

	/**
	 * @hideconstructor
	 */
	constructor () {
		super();

		if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
			throw new Error("Redis is not configured");
		}

		const redisDb = process.env.REDIS_DB ?? 0;
		if (redisDb && !this.isValidInteger(Number(redisDb))) {
			throw new Error("If provided, Redis DB must be a valid positive integer");
		}

		const configuration = {
			host: process.env.REDIS_HOST,
			port: process.env.REDIS_PORT,
			db: redisDb
		};

		this.connect(configuration);
	}

	connect (configuration) {
		if (this.#active) {
			throw new Error("Redis is already connected");
		}
		else if (this.#server) {
			this.#server.connect();
			this.#active = true;
		}
		else if (!configuration) {
			throw new Error("Connection configuration not provided");
		}
		else if (typeof configuration !== "object" && typeof configuration !== "string") {
			throw new Error("When provided, Redis connection configuration must be an object or string");
		}

		this.#server = new Redis(configuration);
		this.#active = true;

		app.Log.info("Connected to Redis.");

		this.#server.info().then(data => {
			const versionData = data.split("\n").find(i => i.startsWith("redis_version"));
			if (versionData) {
				this.#version = versionData.split(":")[1].split(".").map(Number);
			}
			else {
				console.warn("Could not find Redis version!", { info: data });
			}
		});
	}

	disconnect () {
		if (!this.#active) {
			throw new Error("Redis is already disconnected");
		}
		else if (!this.#server) {
			throw new Error("Redis instance has not been created yet");
		}

		this.#server.disconnect();
		this.#active = false;
	}

	async set (data = {}) {
		if (!this.#active) {
			throw new Error("Redis server is not connected");
		}
		else if (typeof data.value === "undefined") {
			throw new Error("Provided value must not be undefined");
		}

		const args = [
			CacheSingleton.resolveKey(data.key),
			JSON.stringify(data.value)
		];

		if (typeof data.specificKey === "string") {
			args[0] += `-${data.specificKey}`;
		}

		if (data.expiry && data.expiresAt) {
			throw new Error("Cannot combine expiry and expiry parameters");
		}
		else if ((data.expiry || data.expiresAt) && data.keepTTL) {
			throw new Error("Cannot combine expiry/expiresAt params with keepTTL");
		}

		if (data.expiry) {
			if (!this.isValidInteger(data.expiry)) {
				throw new Error("If provided, expiry must be a valid positive integer");
			}

			args.push("PX", data.expiry);
		}

		if (data.expiresAt) {
			data.expiresAt = data.expiresAt.valueOf();

			if (!this.isValidInteger(data.expiresAt)) {
				throw new Error("If provided, expiresAt must be a valid positive integer");
			}

			const now = Date.now();
			if (now > data.expiresAt) {
				throw new Error("expiresAt must not be in the past");
			}

			args.push("PX", (data.expiresAt - now));
		}

		if (data.keepTTL) {
			if (!this.#version || this.#version[0] < 6) {
				const existingTTL = await this.#server.pttl(args[0]);
				if (existingTTL >= 0) {
					args.push("PX", existingTTL);
				}
			}
			else {
				args.push("KEEPTTL");
			}

			args.push("XX");
		}

		return await this.#server.set(...args);
	}

	async get (keyIdentifier) {
		if (!this.#active) {
			throw new Error("Redis server is not connected");
		}

		const key = CacheSingleton.resolveKey(keyIdentifier);
		return JSON.parse(await this.#server.get(key));
	}

	async delete (keyIdentifier) {
		if (!this.#active) {
			throw new Error("Redis server is not connected");
		}

		const key = CacheSingleton.resolveKey(keyIdentifier);

		return await this.#server.del(key);
	}

	async setByPrefix (prefix, value, options = {}) {
		if (typeof prefix === "undefined") {
			throw new Error("No key provided");
		}

		if (typeof value === "undefined") {
			throw new Error("No value provided");
		}

		const optionsMap = new Map(Object.entries(options));
		const keys = optionsMap.get("keys") ?? {};
		optionsMap.delete("keys");

		const rest = Object.fromEntries(optionsMap);
		return await this.set({
			key: CacheSingleton.resolvePrefix(prefix, keys),
			value,
			...rest
		});
	}

	async getByPrefix (prefix, options = {}) {
		const extraKeys = options.keys ?? {};
		const key = CacheSingleton.resolvePrefix(prefix, extraKeys);

		return await this.get(key);
	}

	async getKeysByPrefix (prefix, options = {}) {
		const prefixKey = [prefix];
		const extraKeys = options.keys ?? {};

		for (const [key, value] of Object.entries(extraKeys)) {
			if (value === null || value === undefined) {
				prefixKey.push(key, ITEM_DELIMITER, "*");
			}
			else {
				prefixKey.push(key, ITEM_DELIMITER, String(value));
			}
		}

		const searchKey = prefixKey.join(GROUP_DELIMITER);
		const scan = await this.#server.scan("0", "MATCH", searchKey, "COUNT", options.count ?? "5000");
		const results = [...scan[1]];

		let i = scan[0];
		while (i !== "0") {
			const result = await this.#server.scan(i, "MATCH", searchKey, "COUNT", options.count ?? "5000");

			i = result[0];
			results.push(...result[1]);
		}

		return results;
	}

	destroy () {
		if (this.#server) {
			if (this.#active) {
				this.#server.disconnect();
				this.#active = false;
			}

			this.#server.end();
		}

		this.#server = null;
	}

	static resolveKey (value) {
		if (value === null || typeof value === "undefined") {
			throw new Error("Cannot use null or undefined as key");
		}

		if (typeof value?.getCacheKey === "function") {
			return value.getCacheKey();
		}
		else if (typeof value !== "object") {
			return String(value);
		}
		else {
			throw new Error("Cannot stringify a non-primitive value");
		}
	}

	static resolvePrefix (mainKey, keys) {
		keys = Object.entries(keys);
		if (keys.length === 0) {
			return mainKey;
		}

		const rest = [];
		for (const [key, rawValue] of keys) {
			const value = String(rawValue);
			if (key.includes(GROUP_DELIMITER) || key.includes(ITEM_DELIMITER)) {
				throw new Error("Cache prefix keys cannot contain reserved characters");
			}
			else if (value.includes(GROUP_DELIMITER) || value.includes(ITEM_DELIMITER)) {
				throw new Error("Cache prefix values cannot contain reserved characters");
			}

			rest.push(`${key}${ITEM_DELIMITER}${value}`);
		}

		return [mainKey, ...rest.sort()].join(GROUP_DELIMITER);
	}

	isValidInteger (input, minLimit = 0) {
		if (typeof input !== "number") {
			return false;
		}

		return Boolean(Number.isFinite(input) && Math.trunc(input) === input && input >= minLimit);
	}

	get active () { return this.#active; }

	get version () { return this.#version; }

	get server () { return this.#server; }

	get modulePath () { return "cache"; }
};

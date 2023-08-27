const { MongoClient } = require("mongodb");
const url = `mongodb://${process.env.MONGO_IP}:${process.env.MONGO_PORT}`;
const DB_NAME = process.env.MONGO_DB_NAME;

module.exports = class QuerySingleton extends require("./template") {
	/** @type {MongoClient} */
	#pool = null;

	/**
     * @inheritdoc
     * @returns {QuerySingleton}
     */
	static singleton () {
		if (!QuerySingleton.module) {
			QuerySingleton.module = new QuerySingleton();
		}

		return QuerySingleton.module;
	}

	constructor () {
		super();

		if (!process.env.MONGO_IP || !process.env.MONGO_PORT) {
			throw new app.Error({ message: "No mongo IP or Port is defined." });
		}
		else {
			this.#pool = new MongoClient(url, {
				useUnifiedTopology: true,
				useNewUrlParser: true
			});
		}

		this.connect();
	}

	async connect () {
		await this.#pool.connect()
			.then(() => app.Logger.info("DatabaseManager", "Connected to MongoDB"))
			.catch(e => console.error(e));

		this.initListeners();
	}

	initListeners () {
		const pool = this.#pool;

		pool.on("serverHeartbeatFailed", () => {
			app.Logger.error("DatabaseManager", "MongoDB server heartbeat failed.");
		});

		pool.on("topologyOpening", () => {
			app.Logger.info("DatabaseManager", "MongoDB topology opening.");
		});

		pool.on("topologyClosed", () => {
			app.Logger.info("DatabaseManager", "MongoDB topology closed.");
		});
	}

	destroy () {
		this.#pool.close();
		this.#pool.removeAllListeners();

		this.#pool = null;
	}

	client () { return this.#pool.db(DB_NAME); }

	get modulePath () { return "query"; }
};

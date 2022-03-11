const { MongoClient } = require("mongodb");
const url = `mongodb://${process.env.MONGO_IP}:${process.env.MONGO_PORT}`;

module.exports = class Query {
    /** @type {MongoClient} */
    #pool = null;

    /**
     * @inheritdoc
     * @returns {Query}
     */
    static query () {
        if (!Query.module) {
            Query.module = new Query();
        }

        return Query.module;
    }

    constructor () {
        if (!process.env.MONGO_IP || !process.env.MONGO_PORT) {
            throw new Error("Mongo IP and port has not been defined in the environment variables.");
        }
        else {
            this.#pool = new MongoClient(url, {
                useUnifiedTopology: true,
                useNewUrlParser: true,
                keepAlive: true,
                keepAliveInitialDelay: 300000,
                socketTimeoutMS: 300000,
                connectTimeoutMS: 300000
            })
        }

        this.connect();
    }

    async connect () {
        await this.#pool.connect()
        .catch(err => console.error("An error occurred while connecting to the database:", { reason: err }));
    }

    async find (dbname, collection, query = {}) {
        if (!dbname || !collection) {
            return "No database or collection name has been defined.";
        }

        return await this.#pool.db(dbname).collection(collection).find(query).toArray();
    }

    async findOne (dbname, collection, query = {}) {
        if (!dbname || !collection) {
            return "No database or collection name has been defined.";
        }

        return await this.#pool.db(dbname).collection(collection).findOne(query);
    }

    
    async insertOne (dbname, collection, document) {
        if (!dbname || !collection) {
            return "No database or collection name has been defined.";
        }
        
        return await this.#pool.db(dbname).collection(collection).insertOne(document);
    }
    
    replaceOne (dbname, collection, query, update) {
        if (!dbname || !collection) {
            return "No database or collection name has been defined.";
        }
    
        this.#pool.db(dbname).collection(collection).replaceOne(query, update);
    }

    async deleteOne (dbname, collection, query) {
        if (!dbname || !collection) {
            return "No database or collection name has been defined.";
        }

        return await this.#pool.db(dbname).collection(collection).deleteOne(query);
    }
}
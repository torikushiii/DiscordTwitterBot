const Twitter = require("twit");

module.exports = class Stream {
    /** @type {Twitter} */
    #server = null;
    #active = false;
    #stream = null;
    #data = null;

    #type = {
        0: "https://twitter.com",
        1: "https://fxtwitter.com",
        2: "https://nitter.eu"
    }

    /**
     * @returns {Stream}
     */
    static stream () {
        if (!Stream.module) {
            Stream.module = new Stream();
        }

        return Stream.module;
    }

    constructor () {
        if (!process.env.CONSUMER_KEY || !process.env.CONSUMER_SECRET) {
            throw new Error("Consumer key and secret has not been set.");
        }
        else if (!process.env.ACCESS_TOKEN || !process.env.ACCESS_TOKEN_SECRET) {
            throw new Error("Access token and secret has not been set.");
        }
        else if (!process.env.BEARER) {
            throw new Error("Bearer has not been set.");
        }

        this.connect();
    }

    async connect () {
        if (this.#active) {
            return client.logger.log("Stream is already active.", "warn");
        }
        else if (this.#server) {
            this.#active = true;
            this.stream(await this.loadData());
        }
        
        this.#server = new Twitter({
            consumer_key: process.env.CONSUMER_KEY,
            consumer_secret: process.env.CONSUMER_SECRET,
            access_token: process.env.ACCESS_TOKEN,
            access_token_secret: process.env.ACCESS_TOKEN_SECRET
        });

        this.#active = true;
        this.stream(await this.loadData());
    }

    disconnect () {
        if (!this.#active) {
            return client.logger.log("Stream is not active.", "warn");
        }
        else if (!this.#server) {
            return client.logger.log("Stream is not connected.", "warn");
        }

        this.#stream.stop();
        this.#server = null;
        this.#stream = null;
        this.#active = false;
        this.#data = null;
    }

    stream (data) {
        this.#stream = this.#server.stream("statuses/filter", { follow: data.track });
        this.#stream.on("connected", () => client.logger.log("Connected to Twitter.", "info"));
        this.#stream.on("reconnect", () => client.logger.log("Reconnected to Twitter.", "info"));
        this.#stream.on("disconnect", () => this.disconnected());
        this.#stream.on("tweet", tweet => this.processTweet(data, tweet));
    }

    async processTweet (data, tweet) {
        const guilds = data.guilds;
        for (const guild of Object.keys(guilds)) {
            for (const channel of guilds[guild].channels) {
                if (channel.tid === tweet.user.id_str) {
                    client.logger.log(`Processing ${tweet.id_str} for ${guilds[guild].id} [${guilds[guild].name}]`, "info");
                    try {
                        const { embed, text } = this.buildEmbed(tweet, guilds[guild]);
                        const sendObject = {
                            content: "",
                        };

                        if (guilds[guild].showurl) {
                            sendObject.content = text
                        }

                        if (guilds[guild].type === 0) {
                            sendObject.embeds = embed
                        }

                        try {
                            client.logger.log(`Sending to ${guilds[guild].id} [${guilds[guild].name}]`, "info");
                            client.channels.cache.get(channel.id).send(sendObject);
                            client.logger.log(`Sended to ${guilds[guild].id} [${guilds[guild].name}]`, "info");
                        }
                        catch (e) {
                            client.logger.log(`Failed to send to ${guilds[guild].id} [${guilds[guild].name}]`, "error");
                            console.error(e, {
                                origin: "stream.js",
                                context: {
                                    cause: "Failed to send tweet to channel",
                                    id: guilds[guild].id,
                                    name: guilds[guild].name,
                                    tweet: tweet.id_str,
                                    channel: channel.id
                                }
                            })
                        }
                    }
                    catch (e) {
                        client.logger.log(`Failed to process ${tweet.id_str} for ${guilds[guild].id}`, "error");
                        console.error(e, {
                            origin: "stream.js",
                            context: {
                                cause: "Failed to process tweet/send message to channel",
                                id: guilds[guild].id,
                                name: guilds[guild].name,
                                tweet: tweet.id_str,
                                channel: channel.id,
                            }
                        })
                    }
                }
            }
        }
    }

    buildEmbed (tweet, guild) {
        let embed;
        let extended = false;
        let msg = tweet.text;
        if (tweet.is_quote_status && tweet?.extended_tweet?.full_text) {
            msg = `Quote @${tweet.quoted_status.user.screen_name}: ${tweet.extended_tweet.full_text}`;
        }
        else if (tweet?.extended_tweet?.full_text) {
            msg = tweet.extended_tweet.full_text;
            extended = true;
        }
        else if (tweet.retweeted_status?.extended_tweet?.full_text) {
            msg = `RT @${tweet.retweeted_status.user.screen_name} ${tweet.retweeted_status.extended_tweet.full_text}`;
        }

        embed = [
            {
                color: 0x0099FF,
                author: {
                    name: `${tweet.user.name} (@${tweet.user.screen_name})`,
                    icon_url: tweet.user.profile_image_url_https
                },
                description: msg,
                timestamp: new Date(tweet.created_at),
                footer: {
                    text: "Twitter",
                    icon_url: "https://i.imgur.com/pl2r3ng.png"
                }
            }
        ];

        if (extended) {
            if (tweet?.extended_tweet?.entities?.media?.length && tweet?.extended_tweet?.extended_entities?.media?.length === 1) {
                embed[0].image = {
                    url: tweet.extended_tweet.entities.media[0].media_url_https
                }
            }
            else if (tweet?.extended_tweet?.extended_entities?.media?.length > 1) {
                const urls = [];
                for (const media of tweet.extended_tweet.extended_entities.media) {
                    urls.push({
                        url: "https://twitter.com",
                        image: {
                            url: media.media_url_https
                        }
                    });

                }

                embed = [
                    {
                        color: 0x0099FF,
                        author: {
                            name: `${tweet.user.name} (@${tweet.user.screen_name})`,
                            icon_url: tweet.user.profile_image_url_https
                        },
                        url: "https://twitter.com",
                        description: msg,
                        timestamp: new Date(tweet.created_at),
                        footer: {
                            text: "Twitter",
                            icon_url: "https://i.imgur.com/pl2r3ng.png"
                        }
                    },
                    ...urls
                ]
            }
        }
        else {
            if (tweet?.entities?.media?.length && tweet?.extended_entities?.media.length === 1) {
                embed[0].image = {
                    url: tweet.entities.media[0].media_url_https
                }
            }
            else if (tweet?.extended_entities?.media && tweet?.extended_entities?.media?.length > 1) {
                const urls = [];
                for (const media of tweet.extended_entities.media) {
                    urls.push({
                        url: "https://twitter.com",
                        image: {
                            url: media.media_url_https
                        }
                    });
    
                }
    
                embed = [
                    {
                        color: 0x0099FF,
                        author: {
                            name: `${tweet.user.name} (@${tweet.user.screen_name})`,
                            icon_url: tweet.user.profile_image_url_https
                        },
                        url: "https://twitter.com",
                        description: msg,
                        timestamp: new Date(tweet.created_at),
                        footer: {
                            text: "Twitter",
                            icon_url: "https://i.imgur.com/pl2r3ng.png"
                        }
                    },
                    ...urls
                ]
            }
        }

        const text = `New tweet from ${tweet.user.screen_name}: ${this.#type[guild.type]}/${tweet.user.screen_name}/status/${tweet.id_str}`;
        return {
            embed,
            text
        }
    }

    restart () {
        client.logger.log("Restarting stream...", "info");
        
        this.#stream.stop();
        this.#stream = null;
        this.#server = null;
        this.#active = false;
        this.#data = null;

        this.connect();
    }

    disconnected () {
        client.logger.log("Disconnected from Twitter.", "info");
        client.logger.log("Reconnecting...", "info");

        this.#stream.stop();
        this.#server = null;
        this.#active = false;
        this.#data = null;

        this.connect();
    }

    async loadData () {
        if (!this.#active) {
            return client.logger.log("Stream is not active.", "warn");
        }
        else if (!this.#server) {
            return client.logger.log("Server is not active.", "warn");
        }

        const guilds = await client.query.find("twitter", "guilds");
        const ids = [];
        for (const guild of Object.keys(guilds)) {
            for (const channel of guilds[guild].channels) {
                ids.push(channel.tid);
            }
        }

        this.#data = {
            guilds,
            track: [...new Set(ids)]
        }

        return this.#data;
    }

    getData () {
        return this.#data.guilds;
    }

    getUsers () {
        return this.#data.track;
    }
}
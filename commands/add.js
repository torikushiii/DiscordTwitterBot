exports.description = "Add an Twitter account to track to your server.";
exports.perms = "ADMINISTRATOR";
exports.usage = "<twitter_username> <channel_id>/<channel_tag>";
exports.example = `${process.env.PREFIX}add @username (85984654635498465|#channel)`;

exports.run = async message => {
    if (message.args.length === 0) {
        return message.reply(`Usage: ${this.usage}`);
    }

    let res;
    let username = message.args[0];
    if (username.startsWith("@")) {
        if (client.cache.get((username.substring(1)).toLowerCase())) {
            res = {
                statusCode: 200,
                body: client.cache.get((username.substring(1)).toLowerCase())
            }
        }
        else {
            res = await client.twitter.getAccount(username.substring(1));
        }

        if (res.statusCode === 200 && res.body) {
            const guild = await client.query.findOne("twitter", "guilds", { id: message.guild.id });
            if (guild) {
                for (const channel of guild.channels) {
                    if (channel.tid === res.body.id) {
                        return message.reply("This account is already on the list.");
                    }
                }

                const chid = message.args[1]?.startsWith("<") ? message.args[1].replace(/[<#>]/g, "") : message.args[1];
                const channel = message.guild.channels.cache.get(chid);
                if (!channel) {
                    return message.reply("The channel ID is invalid.");
                }

                guild.channels.push({
                    id: channel.id,
                    tid: res.body.id,
                    name: res.body.username
                });

                client.cache.set((res.body.username).toLowerCase(), res.body);
                client.query.replaceOne("twitter", "guilds", { id: message.guild.id }, guild);
                client.stream.restart();
                return message.reply(`Successfully added **${res.body.username}** to the list.`);
            }
            else {
                const chid = message.args[1]?.startsWith("<") ? message.args[1].replace(/[<#>]/g, "") : message.args[1];
                const channel = message.guild.channels.cache.get(chid);
                if (!channel) {
                    return message.reply("The channel ID is invalid.");
                }

                const template = {
                    type: 0,
                    showurl: true,
                    id: message.guild.id,
                    name: message.guild.name,
                    channels: [
                        {
                            id: channel.id,
                            tid: res.body.id,
                            name: res.body.username
                        }
                    ]
                }

                client.cache.set((res.body.username).toLowerCase(), res.body);
                client.query.insertOne("twitter", "guilds", template);
                client.stream.restart();
                return message.reply(`Successfully added **${res.body.username}** to the tracking list.`);
            }
        }
        else {
            return message.reply("Invalid username.");
        }
    }
    else {
        return message.reply("The username must start with @.");
    }
}
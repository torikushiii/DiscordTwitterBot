exports.description = "Add an Twitter account to track to your server.";
exports.perms = "ADMINISTRATOR";
exports.usage = "<twitter_username> <channel_id>/<channel_tag> <type> (0: Twitter, 1: FxTwitter, 2: Nitter) (default: 0 if not specified)";
exports.example = `${process.env.PREFIX}add @username (85984654635498465|#channel)`
+`\n${process.env.PREFIX}add @username (85984654635498465|#channel) type:0`;

exports.run = async message => {
    const fs = require("fs");
    if (message.args.length === 0) {
        return message.reply(`Usage: ${this.usage}`);
    }

    let username = message.args[0];
    const type = message.args[2] ? Number(message.args[2].split(":")[1]) : 0;
    if (username.startsWith("@")) {
        const res = await client.twitter.getAccount(username.substring(1), false);
        if (res.statusCode === 200 && res.body) {
            const data = client.stream.getData();
            const guild = data[message.guild.id];
            if (guild) {
                for (const channel of guild.channels) {
                    if (channel.tid === res.body.id_str) {
                        return message.reply("This account is already on the list.");
                    }
                }

                const chid = message.args[1].startsWith("<") ? message.args[1].replace(/[<#>]/g, "") : message.args[1];
                const channel = message.guild.channels.cache.get(chid);
                if (!channel) {
                    return message.reply("The channel ID is invalid.");
                }

                guild.channels.push({
                    id: channel.id,
                    tid: res.body.id,
                    name: res.body.username
                });

                fs.writeFileSync("./src/json/twitter.json", JSON.stringify(data, null, 4), "utf8");
                client.stream.restart();
                return message.reply(`Successfully added **${res.body.username}** to the list.`);
            }
            else {
                const chid = message.args[1].startsWith("<") ? message.args[1].replace(/[<#>]/g, "") : message.args[1];
                const channel = message.guild.channels.cache.get(chid);
                if (!channel) {
                    return message.reply("The channel ID is invalid.");
                }

                const template = {
                    type,
                    showurl: true,
                    name: message.guild.name,
                    channels: [
                        {
                            id: channel.id,
                            tid: res.body.id,
                            name: res.body.username
                        }
                    ]
                }

                data[message.guild.id] = template;
                fs.writeFileSync("./src/json/twitter.json", JSON.stringify(data, null, 4), "utf8");
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
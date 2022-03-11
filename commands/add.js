exports.description = "Add an Twitter account to track to your server.";
exports.perms = "ADMINISTRATOR";
exports.usage = "<twitter_username> <channel_id>/<channel_tag>"
+"\n<batch> <@username> <channel_id>/<channel_tag>";
exports.example = `${process.env.PREFIX}add @username (85984654635498465|#channel)`;

exports.run = async message => {
    if (message.args.length === 0) {
        return message.reply(`Usage: ${this.usage}`);
    }

    const guild = await client.query.findOne("twitter", "guilds", { id: message.guild.id });
    if (message.args[0] === "batch") {
        const channel = message.mentions.channels.first();
        if (channel) {
            message.content = message.content.replace(/<#[0-9]+>/g, "");
            message.args.pop(channel);
        }
        else if (!channel) {
            return message.reply("No channel was provided.");
        }
        else if (!channel.permissionsFor(message.guild.me).has("VIEW_CHANNEL")) {
            return message.reply("I do not have permission to view that channel.");
        }

        let res;
        const list = [];
        const failed = [];
        const userList = message.args.filter(user => user.startsWith("@"));
        const users = [...new Set(userList)];
        if (users.length > 10) {
            return message.reply("You can only add up to 10 users at a time.");
        }
        
        for (const user of users) {
            const account = user.replace("@", "");
            if (client.cache.get((account).toLowerCase())) {
                res = {
                    statusCode: 200,
                    body: client.cache.get((account).toLowerCase())
                }
            }
            else {
                res = await client.twitter.getAccount(account);
            }

            if (res.statusCode === 200 && res.body) {
                client.cache.set((res.body.username).toLowerCase(), res.body);
                list.push({
                    id: channel.id,
                    tid: res.body.id,
                    name: res.body.username
                });
            }
            else {
                failed.push(account);
            }
        }

        if (guild) {
            for (const channel of guild.channels) {
                const dup = list.find(i => i.tid === channel.tid);
                if (dup) {
                    list.splice(list.indexOf(dup), 1);
                    failed.push(dup.name);
                }
            }

            if (list.length > 0) {
                guild.channels.push(...list);
                client.query.replaceOne("twitter", "guilds", { id: message.guild.id }, guild);
                client.stream.restart();

                const embed = {
                    color: 0x0099FF,
                    author: {
                        name: client.user.tag,
                        icon_url: client.user.avatarURL({ format: "png", dynamic: true, size: 4096 })
                    },
                    description: `Added ${list.length} accounts to the server.`,
                    fields: [
                        {
                            name: "Added",
                            value: list.map(i => `${i.name}`).join(" | "),
                            inline: false
                        },
                        {
                            name: "Failed",
                            value: failed.join(" | "),
                            inline: false
                        }
                    ],
                    timestamp: new Date(),
                    footer: {
                        text: message.author.tag,
                        icon_url: message.author.avatarURL({ format: "png", dynamic: true, size: 4096 })
                    }
                }

                return message.reply({ embeds: [embed] });
            }
            else {
                return message.reply(`No accounts were added because either accounts does not exists or you input an invalid account. (Failed: ${failed.join(" | ")})`);
            }
        }

        const template = {
            type: 0,
            showurl: true,
            customprefix: null,
            id: message.guild.id,
            name: message.guild.name,
            channels: list
        }

        if (list.length > 0) {
            client.query.insertOne("twitter", "guilds", template);
            client.stream.restart();

            const embed = {
                color: 0x0099FF,
                author: {
                    name: client.user.tag,
                    icon_url: client.user.avatarURL({ format: "png", dynamic: true, size: 4096 })
                },
                description: `Added ${list.length} accounts to the server.`,
                fields: [
                    {
                        name: "Added",
                        value: list.map(i => `${i.name}`).join(" | "),
                        inline: false
                    },
                    {
                        name: "Failed",
                        value: failed.join(" | "),
                        inline: false
                    }
                ],
                timestamp: new Date(),
                footer: {
                    text: message.author.tag,
                    icon_url: message.author.avatarURL({ format: "png", dynamic: true, size: 4096 })
                }
            }
            
            return message.reply({ embeds: [embed] });
        }
        else {
            return message.reply(`No accounts were added because either accounts does not exists or you input an invalid account. (Failed: ${failed.join(" | ")})`);
        }
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
            client.cache.set((res.body.username).toLowerCase(), res.body);
            if (guild) {
                for (const channel of guild.channels) {
                    if (channel.tid === res.body.id) {
                        return message.reply("This account is already on the list.");
                    }
                }

                const chid = message.args[1]?.startsWith("<") ? message.args[1].replace(/[<#>]/g, "") : message.args[1];
                const channel = message.guild.channels.cache.get(chid);
                if (!channel.permissionsFor(message.guild.me).has("VIEW_CHANNEL")) {
                    return message.reply("I don't have permission to view that channel.");
                }

                if (!channel) {
                    return message.reply("The channel ID is invalid.");
                }

                guild.channels.push({
                    id: channel.id,
                    tid: res.body.id,
                    name: res.body.username
                });

                client.query.replaceOne("twitter", "guilds", { id: message.guild.id }, guild);
                client.stream.restart();
                return message.reply(`Successfully added **${res.body.username}** to the list.`);
            }
            else {
                const chid = message.args[1]?.startsWith("<") ? message.args[1].replace(/[<#>]/g, "") : message.args[1];
                const channel = message.guild.channels.cache.get(chid);
                if (!channel.permissionsFor(message.guild.me).has("VIEW_CHANNEL")) {
                    return message.reply("I don't have permission to view that channel.");
                }

                if (!channel) {
                    return message.reply("The channel ID is invalid.");
                }

                const template = {
                    type: 0,
                    showurl: true,
                    customprefix: null,
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
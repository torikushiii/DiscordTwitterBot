exports.description = "Change the current various server settings.";
exports.perms = "ADMINISTRATOR";
exports.usage = "<setting> <value> (type <0: Twitter, 1: fxtwitter, 2: nitter>)";
+`\nshowurl <true/false>`
+`\nprefix <prefix>`;
exports.example = `${process.env.PREFIX}set type:1`
+`\n${process.env.PREFIX}set type:2 showurl:false`
+`\n${process.env.PREFIX}set prefix <new prefix>`;

exports.run = async message => {
    if (message.args.length === 0) {
        return message.reply(`Usage: ${this.usage}`);
    }

    if (message.args[0] === "prefix") {
        const prefix = message.args[1];
        if (!prefix) {
            return message.reply("You must specify a prefix. (Example: $set prefix !)");
        }

        if (prefix.length > 5) {
            return message.reply("The prefix must be less than 5 characters.");
        }

        const config = await client.query.findOne("twitter", "guilds", { id: message.guild.id });
        if (config.customprefix === prefix) {
            return message.reply("This prefix is already set.");
        }

        config.customprefix = prefix.toLowerCase();
        if (prefix === "$") {
            config.customprefix = null;
        }

        client.query.replaceOne("twitter", "guilds", { id: message.guild.id }, config);
        client.guildConfig[message.guild.id].config = config;
        return message.reply(config.customprefix ? `The custom prefix has been set to \`${config.customprefix}\`.` : "The custom prefix has been removed.");
    }

    let type = null;
    for (let i = 0; i < message.args.length; i++) {
        const token = message.args[i];
        if (/^type:[0-2]$/gm.test(token)) {
            type = token.split(":")[1];
            message.args.splice(i, 1);
            break;
        }
    }

    let showurl = null;
    for (let i = 0; i < message.args.length; i++) {
        const token = message.args[i];
        if (/^showurl:(true|false)$/gm.test(token)) {
            showurl = token.split(":")[1] === "true";
            message.args.splice(i, 1);
            break;
        }
    }
    
    if (!type && showurl === null) {
        return message.reply(`Usage: ${this.usage}`);
    }

    const guild = await client.query.findOne("twitter", "guilds", { id: message.guild.id });
    if (!guild) {
        return message.reply("This server has not been added to the list.");
    }

    if (guild.type !== 0 && showurl === false) {
        return message.reply("You can't set `showurl` to false if type is not 0 (Twitter).");
    }

    if (guild.type === type || guild.showurl === showurl) {
        return message.reply("Nothing changed.");
    }

    if (type) {
        guild.type = Number(type);
    }
    
    if (showurl) {
        guild.showurl = true;
    }
    else if (showurl === false) {
        guild.showurl = false;
    }

    client.query.replaceOne("twitter", "guilds", { id: message.guild.id }, guild);
    client.stream.restart();
    return message.reply("Successfully changed the settings.");
}
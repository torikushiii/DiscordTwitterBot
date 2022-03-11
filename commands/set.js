exports.description = "Change the current various server settings.";
exports.perms = "ADMINISTRATOR";
exports.usage = "<setting> <value> (type <0: Twitter, 1: fxtwitter, 2: nitter>, showurl <true/false>)";
exports.example = `${process.env.PREFIX}set type:1`
+`\n${process.env.PREFIX}set type:2 showurl:false`;

exports.run = async message => {
    if (message.args.length === 0) {
        return message.reply(`Usage: ${this.usage}`);
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
exports.description = "Removes an user Twitter account from the list of accounts to monitor.";
exports.perms = "ADMINISTRATOR";
exports.usage = "<twitter_username>";
exports.example = `${process.env.PREFIX}remove @username|all (to remove all accounts)`;

exports.run = async message => {
    if (message.args.length === 0) {
        return message.reply(`Usage: ${this.example}`);
    }
    
    const data = await client.query.findOne("twitter", "guilds", { id: message.guild.id });
    if (!data) {
        return message.reply("You don't have any accounts added yet.");
    }

    const username = message.args[0];
    if (!username) {
        return message.reply("You must specify a username.");
    }
    else if (!username.includes("@") && username !== "all") {
        return message.reply("The username must be starts with @. Example: @username");
    }

    if (username === "all") {
        client.query.deleteOne("twitter", "guilds", { id: message.guild.id });
        client.stream.restart();
        return message.reply("Successfully removed all accounts.");
    }

    for (const channel of data.channels) {
        if (channel.name.toLowerCase() === username.substring(1).toLowerCase()) {
            data.channels.pop(channel);
            client.query.replaceOne("twitter", "guilds", { id: message.guild.id }, data);
            client.stream.restart();
            
            return message.reply(`Successfully removed **${channel.name}** from the list.`);
        }
    }

    return message.reply("That username doesn't exist.");
}
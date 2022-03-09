exports.description = "Removes an user Twitter account from the list of accounts to monitor.";
exports.perms = "ADMINISTRATOR";
exports.usage = "<twitter_username>";
exports.example = `${process.env.PREFIX}remove @username|all (to remove all accounts)`;

exports.run = async message => {
    const fs = require("fs");
    const data = JSON.parse(fs.readFileSync("./src/json/twitter.json", "utf8"));

    if (message.args.length === 0) {
        return message.reply(`Usage: ${this.example}`);
    }

    if (!data[message.guild.id]) {
        return message.reply("You don't have any accounts added yet.");
    }

    const username = message.args[0];
    if (!username) {
        return message.reply("You must specify a username.");
    }

    if (username === "all") {
        delete data[message.guild.id];
        fs.writeFileSync("./src/json/twitter.json", JSON.stringify(data, null, 4), "utf8");
        client.stream.restart();
        return message.reply("All accounts removed.");
    }

    const guild = data[message.guild.id];
    for (const channel of guild.channels) {
        if (channel.name.toLowerCase() === username.toLowerCase()) {
            guild.channels.pop(channel);
            
            data[message.guild.id] = guild;
            fs.writeFileSync("./src/json/twitter.json", JSON.stringify(data, null, 4), "utf8");
            client.stream.restart();
            return message.reply(`Successfully removed **${channel.name}** from the the list.`);
        }
    }

    return message.reply("That username doesn't exist.");
}
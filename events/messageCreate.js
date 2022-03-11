module.exports = async message => {
    if (message.author.bot) {
        return;
    }

    try {
        if (!message.prefix) {
            message.prefix = process.env.PREFIX ?? "$";
        }

        if (message.content.toLowerCase().startsWith(message.prefix)) {
            message.args = message.content.slice(message.prefix.length).trim().split(/\s+/gm);
            if (!message.args.length) {
                return;
            }

            const commandName = message.args.shift().toLowerCase();
            const cmd = client.commands.get(commandName);
            if (!cmd) {
                return;
            }

            if (cmd.perms && !message.channel.permissionsFor(message.author).has(cmd.perms)) {
                return message.reply(`You don't have the required permissions to use this command.`);
            }

            try {
                cmd.run(message);
            }
            catch (e) {
                console.error(`Error while executing command ${cmd.name}: ${e}`, {
                    origin: "messageCreate",
                    context: {
                        cause: "command"
                    }
                });
            }
        }
    }
    catch (e) {
        console.log("Message Event Error:");
        console.trace(e);
    }
}
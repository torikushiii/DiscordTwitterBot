exports.description = "Shows the help menu.";
exports.perms = "";
exports.usage = "[command]";
exports.example = `${process.env.PREFIX}help`;

exports.run = async message => {
    let cmd;
    const command = message.args[0];
    if (command) {
        cmd = client.commands.get(command.toLowerCase());
    }

    if (message.args.length === 0 || !cmd) {
        const embed = {
            color: 0x0099FF,
            author: {
                name: client.user.tag,
                icon_url: client.user.avatarURL({ format: "png", dynamic: true, size: 4096 })
            },
            description: this.description.replace(/${PREFIX}/, message.prefix),
            fields: [
                {
                    name: "User Commands",
                    value: Array.from(client.commands.keys()).map((object, key, map) => `\`${object}\``).join(" | "),
                    inline: true
                }
            ]
        }

        return message.reply({ embeds: [embed] });
    }
    else {
        const embed = {
            color: 0x0099FF,
            author: {
                name: `${cmd.name}`,
                icon_url: client.user.avatarURL({ format: "png", dynamic: true, size: 4096 })
            },
            description: cmd.description.replace(/${PREFIX}/, message.prefix),
            fields: [
                {
                    name: "**Usage**",
                    value: cmd.usage.split("\n").map(i => `${message.prefix}${cmd.name} ${i}\n${cmd.example}`).join("\n"),
                }
            ]
        }

        return message.reply({ embeds: [embed] });
    }
}
exports.description = "Ping the bot.";
exports.perms = "";
exports.usage = "";
exports.example = "";

exports.run = async message => {
    let upMsg = "";
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    if (days > 0) {
        upMsg += `${days} day${days > 1 ? "s" : ""}`;
    }
    const hours = Math.floor(uptime / 3600);
    if (hours > 0) {
        upMsg += `${upMsg ? ", " : ""}${hours} hour${hours > 1 ? "s" : ""}`;
    }

    const minutes = Math.floor(uptime / 60);
    if (minutes > 0) {
        upMsg += `${upMsg ? ", " : ""}${minutes} minute${minutes > 1 ? "s" : ""}`;
    }

    const seconds = Math.floor(uptime % 60);
    if (seconds > 0) {
        upMsg += `${upMsg ? ", " : ""}${seconds} second${seconds > 1 ? "s" : ""}`;
    }

    const msg = await message.reply("Pinging...");
    const embed = {
        color: 0x0099FF,
        fields: [
            {
                name: "Ping",
                value: `Latency: **${msg.createdTimestamp - message.createdTimestamp}ms**\nAPI Latency: **${Math.round(client.ws.ping)}ms**`,
                inline: false
            },
            {
                name: "Uptime",
                value: upMsg,
                inline: false
            },
            {
                name: "Cached Users",
                value: `${client.cache.size === 0 ? "None" : `${client.cache.size} user${client.cache.size > 1 ? "s" : ""}`}`,
                inline: false
            }
        ],
        timestamp: new Date(),
        footer: {
            text: message.author.tag,
            icon_url: message.author.avatarURL({ format: "png", dynamic: true, size: 4096 })
        }
    }

    await msg.delete();
    return message.reply({ embeds: [embed] });
}
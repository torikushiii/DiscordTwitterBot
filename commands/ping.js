exports.description = "Ping the bot.";
exports.perms = "";
exports.usage = "";
exports.example = "";

exports.run = async message => {
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
                value: `**${this.staticData.getUptime(client.uptime, 3)}**`,
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

exports.staticData = {
    getUptime: (n, ln) => {
        n = parseInt(n);

        const str = [];
        if (n >= 1000 * 60 * 60 * 24 * 365) cut(1000 * 60 * 60 * 24 * 365, "y");
        if (n >= 1000 * 60 * 60 * 24) cut(1000 * 60 * 60 * 24, "d");
        if (n >= 1000 * 60 * 60) cut(1000 * 60 * 60, "h");
        if (n >= 1000 * 60) cut(1000 * 60, "m");
        if (n >= 1000) cut(1000, "s");
        if (!str.length && n < 1000) {
            cut(1, "ms");
        }

        function cut (v, c) {
            str.push(Math.floor(n / v) + c);
            n = n % v;
        }

        return str.slice(0, ln || 420).join(" ");
    }
}
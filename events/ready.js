module.exports = () => {
    client.logger.log(`Bot connected to ${client.guilds.cache.size} guilds with ${client.users.cache.size} users.`, "info");
    client.user.setPresence({
        status: "online",
        activities: [
            {
                name: "Twitter",
                type: "WATCHING"
            }
        ]
    });
}
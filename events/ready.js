module.exports = () => {
    console.log(`[INFO] Bot connected to ${client.guilds.cache.size} guilds with ${client.users.cache.size} users.`);
    client.user.setPresence({
        status: "online",
        activities: [
            {
                name: "Twitter",
                type: "WATCHING"
            }
        ]
    });

    // TODO: !!! MOVE THIS !!!
    const Component = require("../src/stream");
    client.stream = Component.twitter();
}
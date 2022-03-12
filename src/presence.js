module.exports = () => {
    client.user.setPresence({
        status: "online",
        activities: [
            {
                name: `${client.stream.getUsers().length} twitter users | ${process.env.PREFIX}help`,
                type: "WATCHING"
            }
        ]
    });
}
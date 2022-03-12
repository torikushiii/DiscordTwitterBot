module.exports = () => {
    client.logger.log(`Bot connected to ${client.guilds.cache.size} guilds with ${client.users.cache.size} users.`, "info");
    client.logger.log(`Loaded ${client.stream.getUsers().length} twitter users.`, "info");
    require("../src/presence")();
}
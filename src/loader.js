const fs = require('fs');

module.exports = class Loader {
    static commands () {
        const commands = new Map();
        fs.readdir("./commands", (err, files) => {
            if (err) {
                console.error(`Error loading commands: ${err}`, {
                    origin: "Loader.commands",
                    context: {
                        cause: "Error loading commands",
                    }
                });

                process.exit(1);
            }

            files.forEach(file => {
                if (!file.endsWith(".js")) {
                    console.warn(`Skipping file ${file}`);
                }

                const props = require(`../commands/${file}`);
                const name = file.split(".")[0];
                props.name = name;
                commands.set(name, props);
            })
        })

        return commands;
    }

    static getCommand (name) {
        const command = client.commands.get(name);
        if (command) {
            return command;
        }

        return null;
    }

    static async getGuildConfig (guild) {
        if (!guild.available) {
            return console.error(`Guild ${guild.id} is not available`, {
                origin: "Loader.getGuildConfig",
                context: {
                    cause: "Guild is not available",
                }
            })
        }

        if (client.guildConfig[guild.id]) {
            return client.guildConfig[guild.id];
        }

        client.guildConfig[guild.id] = new Object;
        let config = await client.query.findOne("twitter", "guilds", { id: guild.id });
        if (!config) {
            const template = {
                type: 0,
                showurl: true,
                id: guild.id,
                name: guild.name,
                customprefix: null,
                channels: []
            }

            await client.query.insertOne("twitter", "guilds", template);
            config = template;
        }

        client.guildConfig[guild.id].config = config;
    }

    static events () {
        fs.readdir("./events", (err, files) => {
            if (err) {
                console.error(`Error loading events: ${err}`, {
                    origin: "Loader.events",
                    context: {
                        cause: "Error loading events",
                    }
                });

                process.exit(1);
            }

            files.forEach(file => {
                if (!file.endsWith(".js")) {
                    console.warn(`Skipping file ${file}`);
                }

                const event = require(`../events/${file}`);
                const eventName = file.split(".")[0];
                client.on(eventName, event);
                delete require.cache[require.resolve(`../events/${file}`)];
            })
        })
    }
}
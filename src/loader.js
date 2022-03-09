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
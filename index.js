(async function () {
    const Discord = require("discord.js");
    globalThis.client = new Discord.Client({
        intents: [
            "GUILDS",
            "GUILD_MEMBERS",
            "GUILD_MESSAGES",
            "GUILD_PRESENCES",
        ]
    });

    require("./config");
    await require("./src/components")();
    try {
        require("./src/loader").events();
        client.loader = require("./src/loader");
        client.commands = require("./src/loader").commands();
        client.twitter = require("./src/twitter");
        client.cache = new Map();
        client.guildConfig = new Object;
        await client.login(process.env.DISCORD_TOKEN).catch(err => {
            console.error("[ERROR] An error occured while logging in to Discord:", err, {
                origin: "index.js",
                context: {
                    cause: "client.login()"
                }
            });
        });
    }
    catch (e) {
        console.error("[ERROR] An error occured while loading the bot:", e, {
            origin: "index.js",
            context: {
                cause: "loading the bot"
            }
        });
    }

    process.on("unhandledRejection", (reason) => {
        if (!(reason instanceof Error)) {
            return;
        }
        
        console.error("[ERROR] Unhandled Rejection:", reason, {
            origin: "index.js",
            context: {
                cause: "unhandledRejection"
            }
        });
    })
})();
const chalk = require("chalk");

exports.log = (message, type) => {
    switch (type) {
        case "info": {
            console.log(`${chalk.blueBright(`[${new Date().toLocaleString()}]`)} ${chalk.blue("[INFO]")} ${message}`);
            break;
        }

        case "warn": {
            console.log(`${chalk.yellowBright(`[${new Date().toLocaleString()}]`)} ${chalk.yellow("[WARN]")} ${message}`);
            break;
        }

        case "error": {
            console.log(`${chalk.redBright(`[${new Date().toLocaleString()}]`)} ${chalk.red("[ERROR]")} ${message}`);
            break;
        }

        default: {
            console.log(message);
        }
    }
}
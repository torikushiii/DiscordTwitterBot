module.exports = (async function () {
    const files = [
        "query",
        "stream",
        "log",
    ]

    for (const file of files) {
        switch (file) {
            case "query": {
                const Component = require(`./${file}`);
                client.query = Component.query();
                break;
            }
                
            case "stream": {
                const Component = require(`./${file}`);
                client.stream = Component.stream();
                break;
            }

            case "log": {
                client.logger = require(`./${file}`);
                break;
            }
        }
    }
});

setInterval(() => {
    require("../presence")();
}, 900000);
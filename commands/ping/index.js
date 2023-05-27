module.exports = {
	name: "ping",
	aliases: ["p"],
	description: "Ping!",
	code: (async function ping () {
		return {
			success: true,
			reply: "Pong!"
		};
	})
};

module.exports = {
	name: "ping",
	aliases: ["p"],
	params: [],
	description: "Ping!",
	code: (async function ping () {
		return {
			success: true,
			reply: "Pong!"
		};
	}),
	usage: null
};

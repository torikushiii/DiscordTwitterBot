module.exports = {
	name: "ping",
	aliases: null,
	params: [],
	description: "Ping!",
	code: (async function ping () {
		return {
			success: true,
			reply: "Pong!"
		};
	})
};

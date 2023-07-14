module.exports = {
	name: "ping",
	params: [],
	description: "Ping!",
	code: (async function ping () {
		return {
			success: true,
			reply: "Pong!"
		};
	})
};

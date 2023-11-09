module.exports = {
	name: "suggest",
	aliases: null,
	params: [],
	description: "Suggest a feature for the bot or report a bug. If you're suggesting a feature, you will be notified when it's implemented. To unset a suggestion, use `unset suggestion <id>`",
	code: (async function suggest (context, ...args) {
		if (args.length === 0) {
			return {
				success: false,
				reply: "No suggestion specified."
			};
		}

		const text = args.join(" ");
		const id = await app.Query.collection("suggestions").countDocuments() + 1;
		await app.Query.collection("suggestions").insertOne({
			id,
			text,
			status: "pending",
			fired: false,
			authorNote: null,
			user: {
				id: context.user.id,
				username: context.user.username
			}
		});

		const reply = `Suggestion saved and eventually will be processed (ID: ${id}).`;
		return {
			success: true,
			reply
		};
	}),
	usage: [
		{
			color: 0x00FF00,
			title: "Suggest",
			description: "Suggest a feature for the bot or report a bug."
				+ "\n\n**Usage:**"
				+ "\n`suggest <text>`",
			timestamp: new Date()
		}
	]
};

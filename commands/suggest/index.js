module.exports = {
	name: "suggest",
	params: [],
	description: "Suggest a feature for the bot or report a bug.",
	code: (async function suggest (context, ...args) {
		if (args[0] === "unset") {
			const id = parseInt(args[1]);
			if (isNaN(id)) {
				return {
					success: false,
					reply: "Invalid suggestion ID."
				};
			}

			const suggestion = await app.Query.collection("suggestions").findOne({ id });
			if (!suggestion) {
				return {
					success: false,
					reply: "Suggestion not found."
				};
			}

			if (suggestion.user.id !== context.user.id) {
				return {
					success: false,
					reply: "You can only unset your own suggestions."
				};
			}

			await app.Query.collection("suggestions").updateOne({ id }, { $set: { status: "unset" } });

			const reply = `Suggestion unset (ID: ${id}).`;
			return {
				success: true,
				reply
			};
		}

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
			user: {
				id: context.user.id,
				username: context.user.username
			}
		});

		const reply = `Suggestion saved and will be processed (ID: ${id}).`;
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
				+ "\n`suggest <text>`"
				+ "\n`suggest unset <id>`",
			timestamp: new Date()
		}
	]
};

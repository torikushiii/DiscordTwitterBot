module.exports = {
	name: "suggestion-notification",
	expression: "*/30 * * * * *",
	description: "Sends a notification to the suggestion channel.",
	code: (async function suggestionNotification () {
		const subscriptions = await app.Query.collection("suggestions")
			.find({ status: "completed", fired: false })
			.toArray();

		if (subscriptions.length === 0) {
			return;
		}

		for (const subscription of subscriptions) {
			const { user, authorNote } = subscription;
			const userId = user.id;

			const baseText = "Your suggestion has been completed";
			const note = (authorNote) ? `${baseText}.\n\n${authorNote}` : `${baseText}.`;

			const embeds = [
				{
					title: "Suggestion Completed",
					description: note,
					color: 0x00FF00
				}
			];

			await app.Query.collection("suggestions").updateOne({ _id: subscription._id }, { $set: { fired: true } });

			app.Logger.info("SentinelModule", `Sending suggestion notification to ${userId}`);
			const userData = await app.Discord.client.users.fetch(userId);
			await userData.send({ embeds });
		}
	})
};

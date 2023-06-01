module.exports = {
	name: "report",
	aliases: [],
	params: [],
	description: "Report a bug or issue with the bot.",
	code: (async function report (context, errorId) {
		if (!errorId) {
			return {
				success: false,
				reply: "Please provide an error ID to report."
			};
		}

		if (Number.isNaN(Number(errorId))) {
			return {
				success: false,
				reply: "Error ID must be a number."
			};
		}

		errorId = Number(errorId);
        
		const errorData = await app.Cache.get("error-id");
		const error = errorData.find(i => i.id === errorId && i.source === context.channel.guild.id);

		if (!error) {
			return {
				success: false,
				reply: "No error found with that ID in this server."
			};
		}

		const channelReport = process.env.CHANNEL_REPORT;
		const channel = await app.Discord.client.channels.fetch(channelReport);
        
		const string = `Received error ID ${errorId} from ${context.channel.guild.name} (${context.channel.guild.id})`;
		await app.Discord.send(string, channel, {
			embed: [
				{
					color: 0xFF0000,
					title: "Error Report",
					description: `**Error ID:** ${errorId}`
				}
			]
		});

		return {
			success: true,
			reply: "Error reported."
		};
	}),
	usage: null
};

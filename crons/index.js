const { CronJob } = require("cron");

const CheckMissingChannels = require("./check-for-missing-channels");
const FetchTimeline = require("./fetch-timeline");
const RemoveInvalidChannels = require("./remove-inactive-channels");
const SuggestionNotification = require("./suggestion-notification");

const definitions = [
	CheckMissingChannels,
	FetchTimeline,
	RemoveInvalidChannels,
	SuggestionNotification
];

exports.initialize = () => {
	const crons = [];
	for (const definition of definitions) {
		const cron = {
			name: definition.name,
			description: definition.description,
			code: definition.code
		};

		const job = new CronJob(definition.expression, () => cron.code(cron));
		job.start();

		cron.job = job;
		crons.push(cron);
	}

	return crons;
};

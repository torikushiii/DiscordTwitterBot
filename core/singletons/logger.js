const { createLogger, format, transports, addColors } = require("winston");
const { combine, colorize, timestamp, printf } = format;
const chalk = require("chalk");

const levels = {
	colors: {
		info: "green",
		error: "underline bold red",
		debug: "bold magenta",
		warn: "yellow"
	}
};

const logFormat = printf(({ level, message, timestamp }) => {
	const sendTarget = `<${level}:${chalk.gray(message.type)}> ${message.text}`;
	return `${chalk.magenta(timestamp)} ${sendTarget}`;
});

const winston = createLogger({
	format: combine(
		format((info) => {
			info.level = info.level.toUpperCase();
			return info;
		})(),
		timestamp({
			format: "HH:mm:ss"
		}),
		colorize(),
		logFormat
	),
	transports: [new transports.Console({
		stderrLevels: ["error"],
		colorize: true
	})]
});

addColors(levels.colors);

if (process.env.loglevel) {
	winston.transports[0].level = process.env.loglevel;
	winston.info(`Log level set to ${winston.transports[0].level}`);
}
else {
	winston.transports[0].level = "info";
	winston.info({ type: "LogClient", text: "Log level set to info" });
}

const logObject = {};
const info = (type, message) => {
	if (!type) {
		type = "info";
	}

	logObject.type = type;
	logObject.text = message;

	winston.info(logObject);
};

const error = (type, message) => {
	if (!type) {
		type = "error";
	}

	logObject.type = type;
	logObject.text = message;

	winston.error(logObject);
};

const debug = (type, message) => {
	if (!type) {
		type = "debug";
	}

	logObject.type = type;
	logObject.text = message;

	winston.debug(logObject);
};

const warn = (type, message) => {
	if (!type) {
		type = "warn";
	}

	logObject.type = type;
	logObject.text = message;

	winston.warn(logObject);
};

module.exports = {
	info,
	error,
	debug,
	warn
};

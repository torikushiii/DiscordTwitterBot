const delimiter = "--";

const parseParameter = (value, type, explicit) => {
	if (type === "string" && explicit === false && value === "") {
		return null;
	}
	else if (type !== "string" && value === "") {
		return null;
	}

	if (type === "string") {
		return String(value);
	}
	else if (type === "number") {
		const output = Number(value);
		if (!Number.isFinite(output)) {
			return null;
		}

		return output;
	}
	else if (type === "boolean") {
		if (value === "true") {
			return true;
		}
		else if (value === "false") {
			return false;
		}
	}

	return null;
};

const parseAndAppendParameter = (value, parameterDefinition, explicit, existingParameters) => {
	const parameters = { ...existingParameters };
	const parsedValue = parseParameter(value, parameterDefinition.type, explicit);
	if (parsedValue === null) {
		return {
			success: false,
			reply: `Could not parse parameter "${parameterDefinition.name}"!`
		};
	}
	else if (parameterDefinition.type === "object") {
		if (typeof parameters[parameterDefinition.name] === "undefined") {
			parameters[parameterDefinition.name] = {};
		}

		if (typeof parameters[parameterDefinition.name][parsedValue.key] !== "undefined") {
			return {
				success: false,
				reply: `Cannot use multiple values for parameter "${parameterDefinition.name}", key ${parsedValue.key}!`
			};
		}

		parameters[parameterDefinition.name][parsedValue.key] = parsedValue.value;
	}
	else {
		parameters[parameterDefinition.name] = parsedValue;
	}

	return { success: true, newParameters: parameters };
};

const parseParametersFromArguments = (paramsDefinition, argsArray) => {
	const argsStr = argsArray.join(" ");
	const outputArguments = [];
	let parameters = {};

	let buffer = "";
	let currentParam = null;
	let insideParam = false;
	let quotedParam = false;

	for (let i = 0; i < argsStr.length; i++) {
		const char = argsStr[i];
		buffer += char;

		if (!insideParam) {
			if (buffer.slice(0, -1) === delimiter && char === " ") {
				outputArguments.push(...argsStr.slice(i + 1).split(" "));
				return {
					success: true,
					parameters,
					args: outputArguments
				};
			}

			if (char === ":") {
				currentParam = paramsDefinition.find(i => i.name === buffer.slice(0,-1)) ?? null;
				if (currentParam) {
					insideParam = true;
					buffer = "";
					if (argsStr[i + 1] === "\"") {
						i++;
						quotedParam = true;
					}
				}
			}
			else if (char === " ") {
				const sliced = buffer.slice(0, -1);
				if (sliced.length > 0) {
					outputArguments.push(sliced);
				}
				buffer = "";
			}
		}

		if (insideParam) {
			if (!quotedParam && char === " ") {
				const value = parseAndAppendParameter(buffer.slice(0, -1), currentParam, quotedParam, parameters);
				if (!value.success) {
					return value;
				}
				buffer = "";
				parameters = value.newParameters;
				insideParam = false;
				quotedParam = false;
				currentParam = null;
			}

			if (quotedParam && char === "\"") {
				if (buffer.at(-2) === "\\") {
					buffer = `${buffer.slice(0, -2)}"`;
				}
				else {
					const value = parseAndAppendParameter(buffer.slice(0, -1), currentParam, quotedParam, parameters);
					if (!value.success) {
						return value;
					}
					buffer = "";
					parameters = value.newParameters;
					insideParam = false;
					quotedParam = false;
					currentParam = null;
				}
			}
		}
	}

	if (insideParam) {
		if (quotedParam) {
			return {
				success: false,
				reply: `Unclosed quoted parameter "${currentParam.name}"!`
			};
		}
		else {
			const value = parseAndAppendParameter(buffer, currentParam, quotedParam, parameters);
			if (!value.success) {
				return value;
			}
			parameters = value.newParameters;
		}
	}
	else if (buffer !== "" && buffer !== delimiter) {
		outputArguments.push(buffer);
	}

	return {
		success: true,
		parameters,
		args: outputArguments
	};
};

module.exports = {
	parseParametersFromArguments
};

const { GuildChannel, PermissionFlagsBits } = require("discord.js");

/**
 * Checks whether a given member has a set of permissions
 * @param {GuildChannel} channel The channel to check permissions for
 * @param {string} author The author id to check permissions for
 * @returns {boolean}
 */
const isAllowed = (channel, author) => {
	if (!channel || !author) {
		return false;
	}

	const userPermissions = channel.permissionsFor(author);
	const permissionsToCheck = [
		PermissionFlagsBits.Administrator,
		PermissionFlagsBits.ManageGuild,
		PermissionFlagsBits.ManageChannels,
		PermissionFlagsBits.ManageMessages
	];

	for (const permissions of permissionsToCheck) {
		if (userPermissions && userPermissions.has(permissions)) {
			return true;
		}
	}

	return false;
};

module.exports = {
	isAllowed
};

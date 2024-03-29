<h1 align="center">
    DiscordTwitterBot
</h1>

<p align="center">
   <img src="https://img.shields.io/badge/NodeJS-20.2.0-green">
   <img src="https://img.shields.io/github/license/torikushiii/DiscordTwitterBot">
   <img src="https://img.shields.io/github/stars/torikushiii/DiscordTwitterBot">
   <a href="https://app.codacy.com/gh/torikushiii/DiscordTwitterBot/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade"><img src="https://app.codacy.com/project/badge/Grade/8bf05ddfba214bd2b7dbdcd28600e2c9"/></a>
</p>

![Alt](https://repobeats.axiom.co/api/embed/bd8c7ac61399a1cfc8b4b774efdf22a74e3d0725.svg "Repobeats analytics image")

# DiscordTwitterBot

# Twitter/X has implemented a stricter rate limit on their API, I'll try to find a workaround but looking at the current situation, there will be no guarantee for it.

This is a working prototype of fetching "real-time" tweets since the new Twitter API is now a paid service. Expect to see some bugs, errors, and a lot of code that needs to be refactored.

# Invite
Bot does not work and have not TBD, if you invited the bot using the invite link or if it's already in your server, it will automatically leave the server.

# Features
- Fetching almost real-time tweets from a user (approx. 5 seconds delay from the time the tweet was posted)
- Fetching user RTs
- Fetching quoted tweets

# Permissions
User needs at least one of the following roles to use the bot:
- User
    - Administrator
    - Manage Server
    - Manage Channels
    - Manage Messages

Required permissions for the bot to work:
- Bot
    - Send Messages
    - Embed Links

# Development
- Preqrequisites
    - Have [node](https://nodejs.org/en/) installed.
    - Have [redis](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-ubuntu-18-04) installed.
    - Setup some channels first in `channels.json` first.
        - rename `example.channels.json` to `channels.json` or create a new one.

# Installation
```
# Install dependencies and create your .env copy
$ npm i
$ cp .env.example .env
# Make sure to fill in the .env file with your own values before continuing

# If all things went well, you can start the bot
$ npm start / node index.js
```

# Usage
*If new users are added to the streaming list, it will take a while for the bot to start sending new tweets.*

Default prefix is "`-`".
- `{prefix}add <username>` - Adds a user to the streaming list
    - `${prefix}add <username#1> <username#2>` - Adds multiple users to the streaming list
    - `${prefix}add <username> channel:<channel_id>` - Adds a user to the streaming list and sends the tweets to the specified channel, if no channel is specified, it will send the tweets to the channel where the command was executed.
- `{prefix}remove <username>` - Removes a user from the streaming list
    - `${prefix}remove <username#1> <username#2>` - Removes multiple users from the streaming list
- `{prefix}suggest <text>` - Suggests a feature or report a bug/error
    - `{prefix}suggest unset <id>` - Unsets a suggestion
- `{prefix}list` - Lists all users that are currently being streamed on the server
- `{prefix}set` - Set server various variables
    - `${prefix}set prefix <prefix>` - Sets the server prefix
    - `${prefix}unset prefix` - Resets the server prefix to the default prefix
    - `{prefix}set message <message>` - Sets a custom message for when new tweets are posted
    - `{prefix}unset message` - Resets the custom message to the default message

# Limitations
None for now.

~~Since this bot is using guest authentication, There are some limitations:~~
- ~~R18 tweets will sometimes not fetched due how guest authentication works.~~
- ~~I don't know how will this bot handle fetching tweets from 100+ users.~~
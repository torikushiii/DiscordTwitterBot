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

This is a working prototype of fetching "real-time" tweets since the new Twitter API is now a paid service. Expect to see some bugs, errors, and a lot of code that needs to be refactored.

# Invite
<a href="https://discord.com/oauth2/authorize?client_id=951471857943597086&scope=bot&permissions=19456"><img src="https://img.shields.io/static/v1?label=Invite%20Me&message=Twitter Bot%239462&plastic&color=5865F2&logo=discord"></a>

If you want to try it out, you can add the bot to your server by clicking the badge or [here](https://discord.com/oauth2/authorize?client_id=951471857943597086&scope=bot&permissions=19456).

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
Default prefix is "`-`".
- `{prefix}add <username>` - Adds a user to the streaming list
    - `${prefix}add <username#1> <username#2>` - Adds multiple users to the streaming list
    - `${prefix}add <username> channel:<channel_id>` - Adds a user to the streaming list and sends the tweets to the specified channel, if no channel is specified, it will send the tweets to the channel where the command was executed.
- `{prefix}remove <username>` - Removes a user from the streaming list
    - `${prefix}remove <username#1> <username#2>` - Removes multiple users from the streaming list
- `{prefix}suggest <text>` - Suggests a feature or report a bug/error
    - `{prefix}suggest unset <id>` - Unsets a suggestion
- `{prefix}list` - Lists all users that are currently being streamed on the server
- `{prefix}prefix` - Shows the current prefix
    - `${prefix}prefix <new_prefix>` - Changes the prefix

# Limitations
Since this bot is using guest authentication, There are some limitations:
- R18 tweets will sometimes not fetched due how guest authentication works.
- ~~I don't know how will this bot handle fetching tweets from 100+ users.~~
## Twitter/X broke the bot, I'll try to fix it when I found a way to do it.

# DiscordTwitterBot

This is a working prototype of fetching "real-time" tweets since the new Twitter Streaming API is now a paid service. Expect to see some bugs, errors, and a lot of code that needs to be refactored.

# Invite
If you want to try it out, you can add the bot to your server by clicking [here](https://discord.com/oauth2/authorize?client_id=951471857943597086&scope=bot&permissions=19456).

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
- `{prefix}list` - Lists all users that are currently being streamed on the 
- `{prefix}prefix` - Shows the current prefix
    - `${prefix}prefix <new_prefix>` - Changes the prefix

# Limitations
Since this bot is using guest authentication, There are some limitations:
- R18 tweets will sometimes not fetched due how guest authentication works.
- I don't know how will this bot handle fetching tweets from 100+ users.
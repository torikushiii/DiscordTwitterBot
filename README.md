# DiscordTwitterBot

This is a working prototype of fetching "real-time" tweets since the new Twitter Streaming API is now a paid service. Expect to see some bugs, errors, and a lot of code that needs to be refactored.

If you want to try it out, you can add the bot to your server by clicking [here](https://discord.com/oauth2/authorize?client_id=951471857943597086&scope=bot&permissions=19456).

The only features that are working right now are:
- Getting new tweets from a user (like Twitter streaming API)
- Getting user RTs

Please note that this bot is still in development and may not be online 24/7.

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

# Usage
Default prefix is "`-`".
- `{prefix}add <username>` - Adds a user to the streaming list
    - `${prefix}add <username> <username>` - Adds multiple users to the streaming list
    - `${prefix}add <username> channel:<channel_id>` - Adds a user to the streaming list and sends the tweets to the specified channel, if no channel is specified, it will send the tweets to the channel where the command was executed.
- `{prefix}remove <username>` - Removes a user from the streaming list
    - `${prefix}remove <username> <username>` - Removes multiple users from the streaming list
- `{prefix}list` - Lists all users that are currently being streamed on the 
- `{prefix}prefix` - Shows the current prefix
    - `${prefix}prefix <new_prefix>` - Changes the prefix
- `{prefix}report <id>` - Reports an issue to the developer with the specified ID

# Limitations
Since this bot is using guest authentication, There are some limitations:
- R18 tweets will sometimes not fetched due how guest authentication works.
- I don't know how will this bot handle fetching tweets from 100+ users.
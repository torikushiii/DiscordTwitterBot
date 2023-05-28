# DiscordTwitterBot

This is a working prototype of fetching "real-time" tweets since the new Twitter Streaming API is now a paid service. Expect to see some bugs, errors, and a lot of code that needs to be refactored.

# Bot

If you want to try it out, you can add the bot to your server by clicking [here](https://discord.com/oauth2/authorize?client_id=951471857943597086&scope=bot&permissions=19456).

Please note that this bot is still in development and may not be online 24/7.

# Limitations
Since this bot is using guest authentication, There are some limitations:
- NSFW tweets will not be fetched since guest authentication does not allow you to view NSFW tweets. (But sometimes the Tweet will be fetched after some time, not sure why)
- I don't know how will this bot handle fetching tweets from 100+ users.
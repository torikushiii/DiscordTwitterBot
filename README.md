# DiscordTwitterBot

I'm a Discord bot that post tweet to your specified channel
This bot will fetch Twitter posts or retweets in real time and link it the to Discord.

This bot will build the embed itself to prevent Discord from not auto-generating the embed themself sometimes.

# Features

- Get the latest tweet from any Twitter user.
- Auto build Tweet embed.
- Supports third-party Twitter sites:
  - [fxtwitter](https://github.com/robinuniverse/TwitFix)
  - [nitter](https://github.com/zedeus/nitter)

# Documentation, commands

If you wanna add Twitter Bot to your Discord server, you can just click [this link](https://discord.com/oauth2/authorize?client_id=951471857943597086&scope=bot&permissions=19456)

> Default Prefix: $ (You can change this in config.js. Customizable prefix soon!)
- {PREFIX}add `This will add a Twitter user account to your guild`
    - $add @username #channel-tag E.g: #twitter-feed
    - $add @username [channel-id] E.g: 267661563748951744
    - $add batch @username @username1 @username2 [channel-id]

- {PREFIX}help `This will list a list of all commands and show the help message`
    - $help
    - $help [command]

- {PREFIX}remove `This will remove specified Twitter user account from your guild list`
    - $remove @username
    - $remove all (This will remove all Twitter accounts in your guild and stop receiving tweets from them)

- {PREFIX}set `Set a various config for your guild`
    - $set type:1 (This will set the link that send to channel into fxtwitter)
    - $set type 0 - 2:
        - 0: Twitter
        - 1: fxtwitter
        - 2: Nitter

    - $set showurl true or false
    - $set showurl:false (This will not send original Twitter link to the channel. Only for Twitter  links!)

# Hosting Your Own Instance

### Installation

- Using git
    ```
    git clone https://github.com/torikushiii/DiscordTwitterBot.git
    ```

### Install all required dependencies

- Using npm
    ```
    npm install
    ```
- Using yarn
    ```
    yarn install
    ```

### Copy and create the config

- Linux
    ```
    cp example.config.js config.js
    ```

- Windows
    ```
    copy example.config.js config.js
    ```

### Fill the required config in config.js

```
process.env.CONSUMER_KEY = "";
process.env.CONSUMER_SECRET="";
process.env.ACCESS_TOKEN= "";
process.env.ACCESS_TOKEN_SECRET = "";
process.env.BEARER = "";

process.env.MONGO_IP = "0.0.0.0";
process.env.MONGO_PORT = "27017"; // Default MongoDB port

process.env.DISCORD_TOKEN = "";

process.env.PREFIX = "$";
```

### Run the bot

```
node index.js
```
# discord-safebot
Auto delete bad discord messages after a certain amount of time
# installation
run `npm i discord.js bad-words`

go into the discord.js src/client folder and open `Client.js`

on line 35, remove the `bot` from `_tokenType`

go into the discord.js src/util folder and replace the current `Constants.js` with the one in this repo

fill out the `config.json` with your discord token and time until the message should delete itself (in seconds)

run `npm start`

const TelegramBot = require('node-telegram-bot-api')
const token = process.env['TG_TOKEN']

console.log('---', 'new bot')
module.exports = new TelegramBot(token, { polling: true })

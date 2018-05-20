const users = require('../db/users')
const ru = require('./locale/ru.json')
const en = require('./locale/en.json')

module.exports = chatId => {
    return users[chatId].lang === 'en' ? en : ru
}

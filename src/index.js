const TelegramBot = require('node-telegram-bot-api')
const { arrToObject } = require('./helpers')
const data = require('../db/data')
const shuffle = require('lodash.shuffle')

const users = {}

const questions = arrToObject(data)

const token = process.env['TG_TOKEN']

const bot = new TelegramBot(token, { polling: true })

const keyboards = {
    home: [['▶ Start']],
    show_answer: [['❔ Show answer']],
    rate: [['✅ Correct'], ['❎ Wrong']],
}

bot.onText(/\/start/, (msg, match) => {
    const chatId = msg.chat.id

    users[chatId] = {
        firstAccess: new Date(),
        answers: shuffle(Object.keys(questions)),
    }

    bot.sendMessage(chatId, 'Welcome to the Russian-Chinese Practice!', {
        reply_markup: {
            keyboard: keyboards.home,
        },
    })
})

bot.onText(/▶ Start/, (msg, match) => {
    const chatId = msg.chat.id

    sendNextQuestion(chatId)
})

bot.onText(/❔ Show answer/, (msg, match) => {
    const chatId = msg.chat.id

    const questionId = users[chatId].activeQuestion

    const answer = questions[questionId].chinese

    bot.sendMessage(chatId, answer, {
        reply_markup: {
            keyboard: keyboards.rate,
        },
    })
})

bot.onText(/✅ Correct/, (msg, match) => {
    const chatId = msg.chat.id

    sendNextQuestion(chatId)
})

bot.onText(/❎ Wrong/, (msg, match) => {
    const chatId = msg.chat.id

    users[chatId].answers.unshift(users[chatId].activeQuestion)

    sendNextQuestion(chatId)
})

// bot.on('message', msg => {
//     const chatId = msg.chat.id
// })

function sendNextQuestion(chatId) {
    if (users[chatId].answers.length === 0) {
        bot.sendMessage(chatId, 'No more questions')
        return
    }

    const questionId = users[chatId].answers.pop()
    users[chatId].activeQuestion = questionId

    const question = questions[questionId].russian

    bot.sendMessage(chatId, question, {
        reply_markup: {
            keyboard: keyboards.show_answer,
            // resize_keyboard: true,
        },
    })
}

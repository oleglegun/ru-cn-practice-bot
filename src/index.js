const TelegramBot = require('node-telegram-bot-api')
const { arrToObject } = require('./helpers')
const data = require('../db/data')
const shuffle = require('lodash.shuffle')

/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} ru
 * @property {string} pinyin
 * @property {string} chars
 */

/**
 * @typedef {Object} User
 * @property {string} lastAccess
 * @property {number} todayProgress
 * @property {string} activeQuestionId
 * @property {Array<string>} questions Ids of remaining questions.
 * @property {Array<string>} wrongAnswers
 * @property {number} hintsUsed
 * @property {number} hintsUsedTotal
 * @property {string} answerMode `pinyin`/`chars`
 */

/** @type {Object<string,User>} */
const users = {}

/** @type {Object<string,Question>} */
const questions = arrToObject(data)

const token = process.env['TG_TOKEN']

const bot = new TelegramBot(token, { polling: true })

const keyboards = {
    home: [['▶️ Start'], ['ℹ Statistics'], ['🔠 Settings']],
    show_answer: [['❓ Show Hint', '🆘 Show answer'], ['↩️ Home']],
    rate: [['✅ Correct', '❌ Wrong'], ['↩️ Home']],
    settings: {
        pinyin: [['🔄 Mode: Pinyin'], ['⚠️ Reset', '📛 Debug'], ['↩️ Home']],
        chars: [['🔄 Mode: 汉字'], ['⚠️ Reset', '📛 Debug'], ['↩️ Home']],
    },
}

bot.onText(/\/start/, (msg, match) => {
    const chatId = msg.chat.id

    users[chatId] = {
        lastAccess: Date(),
        todayProgress: 0,
        questions: shuffle(Object.keys(questions)),
        wrongAnswers: [],
        answerMode: 'pinyin',
        activeQuestionId: '',
        hintsUsed: 0,
        hintsUsedTotal: 0,
    }

    bot.sendMessage(chatId, 'Welcome to the Russian-Chinese Practice!', {
        reply_markup: { keyboard: keyboards.home },
    })
})

bot.onText(/▶️ Start/, (msg, match) => {
    const chatId = msg.chat.id

    const user = users[chatId]

    if (user.activeQuestionId) {
        if (user.questions.length === 0 && user.wrongAnswers.length === 0) {
            // no more question
            bot.sendMessage(chatId, 'No more questions.', {
                reply_markup: { keyboard: keyboards.home },
            })
        } else {
            // send active question
            const question = questions[user.activeQuestionId].ru
            bot.sendMessage(chatId, question, {
                reply_markup: { keyboard: keyboards.show_answer },
            })
        }
    } else {
        sendNextQuestion(chatId)
    }
})

bot.onText(/ℹ Statistics/, (msg, match) => {
    const chatId = msg.chat.id

    const stats = renderStatistics(chatId)
    bot.sendMessage(chatId, stats, { reply_markup: { keyboard: keyboards.home } })
})

bot.onText(/🆘 Show answer/, (msg, match) => {
    const chatId = msg.chat.id

    const user = users[chatId]

    if (
        user.answerMode === 'chars' &&
        isCharsAnswerComplete(questions[user.activeQuestionId].chars)
    ) {
        sendAnswer(chatId, 'chars')
    } else {
        sendAnswer(chatId, 'pinyin')
    }
})

bot.onText(/❓ Show Hint/, (msg, match) => {
    const chatId = msg.chat.id

    const user = users[chatId]

    bot.sendMessage(chatId, getHint(chatId), { reply_markup: { keyboard: keyboards.show_answer } })
})

bot.onText(/✅ Correct/, (msg, match) => {
    const chatId = msg.chat.id

    updateLastAccess(chatId)

    incrementTodayProgress(chatId)

    sendNextQuestion(chatId)
})

bot.onText(/❌ Wrong/, (msg, match) => {
    const chatId = msg.chat.id

    updateLastAccess(chatId)

    incrementTodayProgress(chatId)

    users[chatId].wrongAnswers.push(users[chatId].activeQuestionId)

    sendNextQuestion(chatId)
})

bot.onText(/🔄 Mode:/, (msg, match) => {
    const chatId = msg.chat.id

    if (users[chatId].answerMode === 'pinyin') {
        users[chatId].answerMode = 'chars'
    } else {
        users[chatId].answerMode = 'pinyin'
    }

    bot.sendMessage(chatId, 'Answer mode changed.', {
        reply_markup: { keyboard: renderSettings(chatId) },
    })
})

bot.onText(/↩️ Home/, (msg, match) => {
    const chatId = msg.chat.id

    bot.sendMessage(chatId, 'Home', {
        reply_markup: { keyboard: keyboards.home },
    })
})
bot.onText(/🔠 Settings/, (msg, match) => {
    const chatId = msg.chat.id

    bot.sendMessage(chatId, 'Settings', {
        reply_markup: { keyboard: renderSettings(chatId) },
    })
})

bot.onText(/📛 Debug/, (msg, match) => {
    const chatId = msg.chat.id

    bot.sendMessage(chatId, JSON.stringify(users[chatId], null, 2), {
        reply_markup: { keyboard: renderSettings(chatId) },
    })
})

bot.onText(/⚠️ Reset/, (msg, match) => {
    const chatId = msg.chat.id

    const user = users[chatId]

    users[chatId] = {
        ...user,
        todayProgress: 0,
        questions: shuffle(Object.keys(questions)),
        wrongAnswers: [],
        activeQuestionId: '',
        hintsUsed: 0,
    }

    bot.sendMessage(chatId, 'Progress reset successful.', {
        reply_markup: { keyboard: renderSettings(chatId) },
    })
})

// bot.on('message', msg => {
//     const chatId = msg.chat.id
// })

function sendNextQuestion(chatId) {
    const user = users[chatId]
    let question

    if (user.questions.length !== 0) {
        const questionId = user.questions.pop()
        user.activeQuestionId = questionId
        question = questions[questionId].ru
    } else if (user.wrongAnswers.length !== 0) {
        const questionId = user.wrongAnswers.pop()
        user.activeQuestionId = questionId
        question = questions[questionId].ru
    } else {
        bot.sendMessage(chatId, 'No more questions.', {
            reply_markup: { keyboard: keyboards.home },
        })
        return
    }

    // save user
    users[chatId] = user

    bot.sendMessage(chatId, question, {
        reply_markup: { keyboard: keyboards.show_answer },
    })
}

function renderSettings(chatId) {
    if (users[chatId].answerMode === 'pinyin') {
        return keyboards.settings.pinyin
    } else {
        return keyboards.settings.chars
    }
}

/**
 *
 * @param {string} chatId
 * @param {string} mode `pinyin`/`chars`
 */
function sendAnswer(chatId, mode) {
    let answer
    switch (mode) {
        case 'pinyin':
            answer = questions[users[chatId].activeQuestionId].pinyin

            break
        case 'chars':
            answer = questions[users[chatId].activeQuestionId].chars
            break
    }

    // reset hint counter
    users[chatId].hintsUsed = 0

    bot.sendMessage(chatId, answer, { reply_markup: { keyboard: keyboards.rate } })
}

function renderStatistics(chatId) {
    const data = users[chatId]

    const totalQuestions = Object.keys(questions).length
    const wrongAnswers = data.wrongAnswers.length
    const totalProgress = totalQuestions - data.questions.length - wrongAnswers
    const wrongPercent = parseInt(wrongAnswers / totalQuestions * 100)
    const correctPercent = parseInt(totalProgress / totalQuestions * 100)
    const correctWrongPercent =
        wrongAnswers === 0 ? 100 : parseInt(100 - totalProgress / wrongAnswers)

    return `Today's progress: ${todayProgress(chatId)} questions
Total progress: ${totalProgress}/${totalQuestions} (${correctPercent}%)
Wrong answers: ${wrongAnswers}/${totalQuestions} (${wrongPercent}%)
Correct/Wrong rate: ${correctWrongPercent}%
Hints used: ${data.hintsUsed}`
}

function getHint(chatId) {
    const user = users[chatId]
    let hint

    const question = questions[user.activeQuestionId]

    if (user.answerMode === 'chars' && isCharsAnswerComplete(question.chars)) {
        // 'chars' mode
        hint = renderNextHint(question.chars, user.hintsUsed + 1)
    } else {
        // 'pinyin' mode
        hint = renderNextHint(question.pinyin, user.hintsUsed + 1)
    }

    users[chatId].hintsUsed++
    users[chatId].hintsUsedTotal++

    return hint
}

/**
 * Checks if the string with chinese characters is complete and ready to use.
 * @param {string} chars
 */
function isCharsAnswerComplete(chars) {
    return chars.indexOf('_') === -1
}

/**
 *
 * @param {string} answer
 * @param {number} hintNumber
 */
function renderNextHint(answer, hintNumber) {
    const parts = answer.split(' ')

    if (hintNumber < parts.length) {
        return parts.slice(0, hintNumber).join(' ')
    } else {
        return answer
    }
}

function incrementTodayProgress(chatId) {
    const today = new Date()
    const lastAccess = users[chatId].lastAccess

    if (today.getDate === new Date(lastAccess).getDate) {
        users[chatId].todayProgress++
    } else {
        // no progress today
        users[chatId].todayProgress = 0
    }
}

function todayProgress(chatId) {
    const today = new Date()
    const lastAccess = users[chatId].lastAccess

    if (today.getDate === new Date(lastAccess).getDate) {
        return users[chatId].todayProgress
    } else {
        return 0
    }
}

function incrementTodayProgress(chatId) {
    const today = new Date()
    const lastAccess = users[chatId].lastAccess

    if (today.getDate === new Date(lastAccess).getDate) {
        users[chatId].todayProgress++
    } else {
        // no progress today
        users[chatId].todayProgress = 0
    }
}

function todayProgress(chatId) {
    const today = new Date()
    const lastAccess = users[chatId].lastAccess

    if (today.getDate === new Date(lastAccess).getDate) {
        return users[chatId].todayProgress
    } else {
        return 0
    }
}

function updateLastAccess(chatId) {
    users[chatId].lastAccess = Date()
}

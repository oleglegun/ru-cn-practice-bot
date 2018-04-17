const TelegramBot = require('node-telegram-bot-api')
const { arrToObject } = require('./helpers')
const questions = require('../db/data')
const shuffle = require('lodash.shuffle')

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
 * @property {string} direction `ru-cn`/`cn-ru`
 */

/** @type {Object<string,User>} */
const users = {}

const token = process.env['TG_TOKEN']

const bot = new TelegramBot(token, { polling: true })

const kb = {
    home: [['▶️ Start'], ['🀄 Games', 'ℹ Statistics'], ['⚙️ Settings']],
    showAnswerCn: [['❓ Show Hint', '🆘 Show answer'], ['↩️ Home']],
    showAnswerRu: [['🆘 Show answer'], ['↩️ Home']],
    rate: [['✅ Correct', '❌ Wrong'], ['↩️ Home']],
    goBack: '↩️ Home',
    settings: {
        answerMode: {
            pinyin: '🔄 Mode: Pinyin',
            chars: '🔄 Mode: 汉字',
            both: '🔄 Mode: Pinyin + 汉字',
        },
        direction: {
            'ru-cn': '↔️ Direction: Ru-Cn',
            'cn-ru': '↔️ Direction: Cn-Ru',
        },
        resetProgress: ['⚠️ Reset', '📛 Debug'],
        goBack: ['↩️ Home'],
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
        direction: 'ru-cn',
        activeQuestionId: '',
        hintsUsed: 0,
        hintsUsedTotal: 0,
    }

    sendMessage(chatId, 'Welcome to the Russian-Chinese Practice!', kb.home)
})

bot.onText(/▶️ Start/, (msg, match) => {
    const chatId = msg.chat.id

    const user = users[chatId]

    if (user.activeQuestionId) {
        if (user.questions.length === 0 && user.wrongAnswers.length === 0) {
            // no more questions
            sendMessage(chatId, 'No more questions.', kb.home)
        } else {
            // send active question
            let question
            switch (user.direction) {
                case 'ru-cn':
                    question = questions[user.activeQuestionId].ru
                    sendMessage(chatId, question, kb.showAnswerCn)
                    break
                case 'cn-ru':
                    question = questions[user.activeQuestionId].cn
                    sendMessage(chatId, renderAnswer(question, user.answerMode), kb.showAnswerRu)
            }
        }
    } else {
        sendNextQuestion(chatId)
    }
})

bot.onText(/ℹ Statistics/, (msg, match) => {
    const chatId = msg.chat.id

    const stats = renderStatistics(chatId)
    sendMessage(chatId, stats, kb.home)
})

bot.onText(/🆘 Show answer/, (msg, match) => {
    const chatId = msg.chat.id

    const user = users[chatId]

    let question

    switch (user.direction) {
        case 'ru-cn':
            answer = renderAnswer(questions[user.activeQuestionId].cn, user.answerMode)
            break
        case 'cn-ru':
            answer = questions[user.activeQuestionId].ru
    }

    sendAnswer(chatId, answer)
})

bot.onText(/❓ Show Hint/, (msg, match) => {
    const chatId = msg.chat.id

    const user = users[chatId]

    sendMessage(chatId, getHint(chatId), kb.showAnswerCn)
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

    const modes = ['pinyin', 'chars', 'both']

    const currentModeIdx = modes.indexOf(users[chatId].answerMode)

    users[chatId].answerMode =
        currentModeIdx === modes.length - 1 ? modes[0] : modes[currentModeIdx + 1]

    sendMessage(chatId, 'Answer mode changed.', renderSettings(chatId))
})

bot.onText(/↔️ Direction:/, (msg, match) => {
    const chatId = msg.chat.id

    if (users[chatId].direction === 'ru-cn') {
        users[chatId].direction = 'cn-ru'
    } else {
        users[chatId].direction = 'ru-cn'
    }

    sendMessage(chatId, 'Direction changed.', renderSettings(chatId))
})

bot.onText(/↩️ Home/, (msg, match) => {
    const chatId = msg.chat.id

    sendMessage(chatId, 'Home', kb.home)
})
bot.onText(/⚙️ Settings/, (msg, match) => {
    const chatId = msg.chat.id

    sendMessage(chatId, 'Settings', renderSettings(chatId))
})

bot.onText(/📛 Debug/, (msg, match) => {
    const chatId = msg.chat.id

    sendMessage(chatId, JSON.stringify(users[chatId], null, 2), renderSettings(chatId))
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

    sendMessage(chatId, 'All your progress has been reset.', renderSettings(chatId))
})

/**
 *
 * @param {string} chatId
 * @param {string} answer
 */
function sendAnswer(chatId, answer) {
    // reset hint counter
    users[chatId].hintsUsed = 0

    sendMessage(chatId, answer, kb.rate)
}

// bot.on('message', msg => {
//     const chatId = msg.chat.id
// })

function sendNextQuestion(chatId) {
    const user = users[chatId]
    let question

    if (user.questions.length !== 0) {
        // 1+ questions available
        const questionId = user.questions.pop()
        user.activeQuestionId = questionId

        question = questions[questionId]
    } else if (user.wrongAnswers.length !== 0) {
        // 1+ wrong questions available to re-ask
        const questionId = user.wrongAnswers.pop()
        user.activeQuestionId = questionId
        question = questions[questionId]
    } else {
        sendMessage(chatId, 'No more questions.', kb.home)
        return
    }

    // save user
    users[chatId] = user

    switch (user.direction) {
        case 'ru-cn':
            sendMessage(chatId, question.ru, kb.showAnswerCn)
            break
        case 'cn-ru':
            sendMessage(chatId, renderAnswer(question.cn, user.answerMode), kb.showAnswerRu)
    }
}

/*-----------------------------------------------------------------------------
 *  Render functions
 *----------------------------------------------------------------------------*/

function renderSettings(chatId) {
    return [
        [
            kb.settings.answerMode[users[chatId].answerMode],
            kb.settings.direction[users[chatId].direction],
        ],
        kb.settings.resetProgress,
        kb.settings.goBack,
    ]
}

/**
 *
 * @param {Array<Array<string>>} answer
 * @param {string} answerMode
 * @param {number} [length]
 */
function renderAnswer(answer, answerMode, length) {
    if (!length) {
        length = answer.length + 1
    }

    result = ''

    switch (answerMode) {
        case 'pinyin':
            answer.slice(0, length).forEach(part => {
                result += `${part[0]} `
            })
            break
        case 'chars':
            answer.slice(0, length).forEach(part => {
                // no char available - replace with pinyin
                result += part[1] === '' ? `${part[0]} ` : `${part[1]} `
            })
            break
        case 'both':
            answer.slice(0, length).forEach(part => {
                // no char available - only pinyin
                result += part[1] === '' ? `${part[0]} ` : `${part[0]} (${part[1]}) `
            })
            break
    }

    return result
}

function renderStatistics(chatId) {
    const data = users[chatId]

    const questionsCount = Object.keys(questions).length

    const totalQuestions = data.activeQuestionId === '' ? questionsCount : questionsCount - 1
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

    const question = questions[user.activeQuestionId]
    const hint = renderNextHint(question.cn, user.hintsUsed + 1, user.answerMode)

    users[chatId].hintsUsed++
    users[chatId].hintsUsedTotal++

    return hint
}

/**
 *
 * @param {Array<Array<string>>} answer
 * @param {number} hintNumber
 * @param {string} answerMode
 */
function renderNextHint(answer, hintNumber, answerMode) {
    if (hintNumber >= answer.length) {
        return renderAnswer(answer, answerMode, answer.length + 1)
    }

    return renderAnswer(answer, answerMode, hintNumber)
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

function sendMessage(chatId, message, keyboard) {
    bot.sendMessage(chatId, message, { reply_markup: { keyboard } })
}

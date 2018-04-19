const bot = require('./bot')
const users = require('../db/users')
const questions = require('../db/questions')
const kb = require('./keyboard')
const render = require('./render')

/**
 *
 * @param {string} chatId
 * @param {string} answer
 */
exports.sendAnswer = (chatId, answer) => {
    // reset hint counter
    users[chatId].hintsUsed = 0

    sendMessage(chatId, answer, kb.rate)
}

exports.sendNextQuestion = chatId => {
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
            sendMessage(chatId, render.Answer(question.cn, user.answerMode), kb.showAnswerRu)
    }
}

exports.getHint = chatId => {
    const user = users[chatId]

    const question = questions[user.activeQuestionId]
    const hint = render.NextHint(question.cn, user.hintsUsed + 1, user.answerMode)

    users[chatId].hintsUsed++
    users[chatId].hintsUsedTotal++

    return hint
}

exports.incrementTodayProgress = chatId => {
    const today = new Date()
    const lastAccess = users[chatId].lastAccess

    if (today.getDate === new Date(lastAccess).getDate) {
        users[chatId].todayProgress++
    } else {
        // no progress today
        users[chatId].todayProgress = 0
    }
}

exports.updateLastAccess = chatId => {
    users[chatId].lastAccess = Date()
}

function sendMessage(chatId, message, keyboard) {
    bot.sendMessage(chatId, message, { reply_markup: { keyboard } })
}

exports.sendMessage = sendMessage

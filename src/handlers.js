const kb = require('./keyboard')
const users = require('../db/users')
const questions = require('../db/questions')
const shuffle = require('lodash.shuffle')
const render = require('./render')
const {
    sendMessage,
    sendNextQuestion,
    sendAnswer,
    updateLastAccess,
    incrementTodayProgress,
    getHint,
} = require('./helpers')

module.exports = {
    StartBotIntent: function(msg) {
        {
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
        }
    },

    Start: function(msg) {
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
                        sendMessage(
                            chatId,
                            render.Answer(question, user.answerMode),
                            kb.showAnswerRu
                        )
                }
            }
        } else {
            sendNextQuestion(chatId)
        }
    },
    Statistics: function(msg) {
        const chatId = msg.chat.id
        const user = users[chatId]

        const stats = render.Statistics(user)
        sendMessage(chatId, stats, kb.home)
    },
    ShowAnswer: function(msg) {
        const chatId = msg.chat.id

        const user = users[chatId]

        let answer

        switch (user.direction) {
            case 'ru-cn':
                answer = render.Answer(questions[user.activeQuestionId].cn, user.answerMode)
                break
            case 'cn-ru':
                answer = questions[user.activeQuestionId].ru
        }

        sendAnswer(chatId, answer)
    },
    ShowHint: function(msg) {
        const chatId = msg.chat.id

        sendMessage(chatId, getHint(chatId), kb.showAnswerCn)
    },
    RateCorrect: function(msg) {
        const chatId = msg.chat.id

        updateLastAccess(chatId)

        incrementTodayProgress(chatId)

        sendNextQuestion(chatId)
    },

    RateWrong: function(msg) {
        const chatId = msg.chat.id

        updateLastAccess(chatId)

        incrementTodayProgress(chatId)

        users[chatId].wrongAnswers.push(users[chatId].activeQuestionId)

        sendNextQuestion(chatId)
    },
    SwitchAnswerMode: function(msg) {
        const chatId = msg.chat.id

        const modes = ['pinyin', 'chars', 'both']

        const currentModeIdx = modes.indexOf(users[chatId].answerMode)

        users[chatId].answerMode =
            currentModeIdx === modes.length - 1 ? modes[0] : modes[currentModeIdx + 1]

        sendMessage(chatId, 'Answer mode changed.', render.Settings(chatId))
    },
    SwitchDirection: function(msg) {
        const chatId = msg.chat.id

        switch (users[chatId].direction) {
            case 'ru-cn':
                users[chatId].direction = 'cn-ru'
                break
            case 'cn-ru':
                users[chatId].direction = 'ru-cn'
        }

        sendMessage(chatId, 'Direction changed.', render.Settings(chatId))
    },
    GoHome: function(msg) {
        const chatId = msg.chat.id

        sendMessage(chatId, 'Home', kb.home)
    },
    OpenSettings: function(msg) {
        const chatId = msg.chat.id

        sendMessage(chatId, 'Settings', render.Settings(chatId))
    },
    OpenDebug: function(msg) {
        const chatId = msg.chat.id

        sendMessage(chatId, JSON.stringify(users[chatId], null, 2), render.Settings(chatId))
    },
    ResetProgress: function(msg) {
        const chatId = msg.chat.id

        const user = users[chatId]

        users[chatId] = Object.assign({}, user, {
            todayProgress: 0,
            questions: shuffle(Object.keys(questions)),
            wrongAnswers: [],
            activeQuestionId: '',
            hintsUsed: 0,
        })

        sendMessage(chatId, 'All your progress has been reset.', render.Settings(chatId))
    },
}

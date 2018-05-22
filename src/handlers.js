const kb = require('./keyboard')
const users = require('../db/users')
const questions = require('../db/questions')
const shuffle = require('lodash.shuffle')
const render = require('./render')
const i18n = require('./i18n')
const {
    sendMessage,
    sendNextQuestion,
    sendAnswer,
    updateLastAccess,
    incrementTodayProgress,
    getHint,
} = require('./helpers')

module.exports = {
    StartBotIntent: (msg) => {
        {
            const chatId = msg.chat.id

            users[chatId] = {
                lastAccess: Date(),
                lang: 'en',
                todayProgress: 0,
                questions: shuffle(Object.keys(questions)),
                wrongAnswers: [],
                answerMode: 'pinyin',
                direction: 'ru-cn',
                activeQuestionId: '',
                hintsUsed: 0,
                hintsUsedTotal: 0,
                quizGame: {
                    mode: 'hanziPinyin',
                    highScores: {
                        hanziPinyin: 0,
                        pinyinHanzi: 0,
                        ruHanzi: 0,
                        ruPinyin: 0,
                    },
                },
            }

            sendMessage(chatId, i18n(chatId).welcome, kb(chatId).home)
        }
    },

    Start: function(msg) {
        const chatId = msg.chat.id

        const user = users[chatId]

        if (user.activeQuestionId) {
            if (user.questions.length === 0 && user.wrongAnswers.length === 0) {
                // no more questions
                sendMessage(chatId, i18n(chatId).noQuestions, kb(chatId).home)
            } else {
                // send active question
                let question
                switch (user.direction) {
                    case 'ru-cn':
                        question = questions[user.activeQuestionId].ru
                        sendMessage(chatId, question, kb(chatId).showAnswerCn)
                        break
                    case 'cn-ru':
                        question = questions[user.activeQuestionId].cn
                        sendMessage(
                            chatId,
                            render.Answer(question, user.answerMode),
                            kb(chatId).showAnswerRu
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
        sendMessage(chatId, stats, kb(chatId).home)
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

        sendMessage(chatId, getHint(chatId), kb(chatId).showAnswerCn)
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

        sendMessage(chatId, i18n(chatId).modeChanged, render.SettingsKeyboard(chatId))
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

        sendMessage(chatId, i18n(chatId).directionChanged, render.SettingsKeyboard(chatId))
    },

    SwitchLang: function(msg) {
        const chatId = msg.chat.id

        switch (users[chatId].lang) {
            case 'ru':
                users[chatId].lang = 'en'
                break
            case 'en':
                users[chatId].lang = 'ru'
        }

        sendMessage(chatId, i18n(chatId).settingsHelpMessage, render.SettingsKeyboard(chatId))
    },

    GoHome: function(msg) {
        const chatId = msg.chat.id

        sendMessage(chatId, i18n(chatId).mainMenu, kb(chatId).home)
    },

    OpenSettings: function(msg) {
        const chatId = msg.chat.id

        sendMessage(chatId, i18n(chatId).settingsHelpMessage, render.SettingsKeyboard(chatId))
    },

    OpenDebug: function(msg) {
        const chatId = msg.chat.id

        const user = users[chatId]

        const debugInfo = Object.assign({}, user, { questions: user.questions.length })

        sendMessage(chatId, JSON.stringify(debugInfo, null, 2), render.SettingsKeyboard(chatId))
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
            quizGame: {
                mode: 'hanziPinyin',
                highScores: {
                    hanziPinyin: 0,
                    pinyinHanzi: 0,
                    ruHanzi: 0,
                    ruPinyin: 0,
                },
            },
        })

        sendMessage(chatId, i18n(chatId).progressReset, render.SettingsKeyboard(chatId))
    },

    OpenGameMenu: function(msg) {
        sendMessage(msg.chat.id, i18n(msg.chat.id).quizGameMenu, render.GameMenuKeyboard(msg.chat.id))
    },

    SwitchGameMode: msg => {
        const chatId = msg.chat.id

        const modes = ['hanziPinyin', 'pinyinHanzi', 'ruHanzi', 'ruPinyin']

        const currentModeIdx = modes.indexOf(users[chatId].quizGame.mode)

        users[chatId].quizGame.mode =
            currentModeIdx === modes.length - 1 ? modes[0] : modes[currentModeIdx + 1]

        sendMessage(chatId, i18n(chatId).gameModeChanged, render.GameMenuKeyboard(chatId))
    },
}

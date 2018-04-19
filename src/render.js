const kb = require('./keyboard')
const questions = require('../db/questions')
const users = require('../db/users')

const render = {
    Settings: chatId => {
        return [
            [
                kb.settings.answerMode[users[chatId].answerMode],
                kb.settings.direction[users[chatId].direction],
            ],
            kb.settings.resetProgress,
            kb.settings.goBack,
        ]
    },

    /**
     *
     * @param {Array<Array<string>>} answer
     * @param {string} answerMode
     * @param {number} [length]
     */
    Answer: (answer, answerMode, length) => {
        if (!length) {
            length = answer.length + 1
        }

        let result = ''

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
    },

    Statistics: function(user) {
        const questionsCount = Object.keys(questions).length

        const totalQuestions = user.activeQuestionId === '' ? questionsCount : questionsCount - 1
        const wrongAnswers = user.wrongAnswers.length
        const correctAnswers = totalQuestions - user.questions.length - wrongAnswers
        const wrongPercent = parseInt(wrongAnswers / totalQuestions * 100)
        const correctPercent = parseInt(correctAnswers / totalQuestions * 100)
        const correctWrongPercent =
            wrongAnswers === 0
                ? 100
                : parseInt(correctAnswers / (correctAnswers + wrongAnswers) * 100)

        return `Today's progress: ${this.TodayProgress(user)} questions
Correct answers: ${correctAnswers}/${totalQuestions} (${correctPercent}%)
Wrong answers: ${wrongAnswers}/${totalQuestions} (${wrongPercent}%)
Correct/Wrong rate: ${correctWrongPercent}%
Hints used: ${user.hintsUsed}`
    },

    /**
     *
     * @param {Array<Array<string>>} answer
     * @param {number} hintNumber
     * @param {string} answerMode
     */
    NextHint: function(answer, hintNumber, answerMode) {
        if (hintNumber >= answer.length) {
            return this.Answer(answer, answerMode, answer.length + 1)
        }

        return this.Answer(answer, answerMode, hintNumber)
    },

    TodayProgress: function(user) {
        const today = new Date()
        const lastAccess = user.lastAccess

        if (today.getDate === new Date(lastAccess).getDate) {
            return user.todayProgress
        } else {
            return 0
        }
    },
}

module.exports = render

const users = require('../db/users')

/**
 * @typedef {Object} Keyboard
 * @property {Array<Array<string>>} home
 * @property {Array<Array<string>>} showAnswerCn
 * @property {Array<Array<string>>} showAnswerRu
 * @property {Array<Array<string>>} rate
 * @property {String} goHome
 * @property {Settings} settings
 * @property {QuizGame} quizGame
 */

/**
 * @typedef {Object} Settings
 * @property {Object} lang
 * @property {Object} answerMode
 * @property {Object} direction
 * @property {Object} resetProgress
 * @property {Array<string>} goBack
 * @property {Array<string>} about
 */

/**
 * @typedef {Object} QuizGame
 * @property {Object} QuizGame.play
 * @property {Object} QuizGame.gameMode
 */

/**
 *
 * @param {string} chatId
 * @returns {Keyboard}
 */
module.exports = function(chatId) {
    return keyboards[users[chatId].lang]
}

const langButton = {
    en: '🔤 English',
    ru: '🔤 Русский',
}

const keyboards = {
    en: {
        home: [['▶️ Start'], ['🀄 Quiz Game', 'ℹ️ Statistics'], ['⚙️ Settings']],
        showAnswerCn: [['💡 Show Hint', '❓ Show answer'], ['↩️ Home']],
        showAnswerRu: [['❓ Show answer'], ['↩️ Home']],
        rate: [['✅ Correct', '❌ Wrong'], ['↩️ Home']],
        goHome: '↩️ Home',
        settings: {
            lang: langButton,

            answerMode: {
                pinyin: '🔄 Pinyin',
                chars: '🔄 汉字',
                both: '🔄 Pinyin + 汉字',
            },
            direction: {
                'ru-cn': '↔️ Ru→Cn',
                'cn-ru': '↔️ Cn→Ru',
            },
            resetProgress: ['⚠️ Reset', '📛 Debug'],
            goBack: ['↩️ Home'],
            about: ['©️ About'],
        },

        quizGame: {
            play: '▶️ Play',
            gameMode: {
                hanziPinyin: '🔢 1: 汉字 → Pinyin',
                pinyinHanzi: '🔢 2: Pinyin → 汉字',
                ruHanzi: '🔢 3: Ru → 汉字',
                ruPinyin: '🔢 4: Ru → Pinyin',
            },
        },
    },
    ru: {
        home: [['▶️ Начать'], ['🀄 Игра', 'ℹ️ Статистика'], ['⚙️ Настройки']],
        showAnswerCn: [['💡 Подсказка', '❓ Ответ'], ['↩️ Назад']],
        showAnswerRu: [['❓ Ответ'], ['↩️ Назад']],
        rate: [['✅ Верно', '❌ Неверно'], ['↩️ Назад']],
        goHome: '↩️ Назад',
        settings: {
            lang: langButton,

            answerMode: {
                pinyin: '🔄 Пиньинь',
                chars: '🔄 汉字',
                both: '🔄 Пиньинь + 汉字',
            },
            direction: {
                'ru-cn': '↔️ Рус→Кит',
                'cn-ru': '↔️ Кит→Рус',
            },
            resetProgress: ['⚠️ Сброс', '📛 Отладка'],
            goBack: ['↩️ Назад'],
            about: ['©️ О боте'],
        },

        quizGame: {
            play: '▶️ Начать',
            gameMode: {
                hanziPinyin: '🔢 1: 汉字 → Пиньинь',
                pinyinHanzi: '🔢 2: Пиньинь → 汉字',
                ruHanzi: '🔢 3: Рус → 汉字',
                ruPinyin: '🔢 4: Рус → Пиньинь',
            },
        },
    },
}

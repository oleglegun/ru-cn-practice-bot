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
 * @property {Game} quizGame
 */

/**
 * @typedef {Object} Game
 * @property {string} mode
 * @property {GameHighScores} highScores
 */

/**
 * @typedef {Object} GameHighScores
 * @property {number} hanziPinyin
 * @property {number} pinyinHanzi
 * @property {number} ruHanzi
 * @property {number} ruPinyin
 */

/** @type {Object<string,User>} */
const users = {}

module.exports = users

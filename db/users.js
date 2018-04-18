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
console.log('---', 'new users')
module.exports = users

const { arrToObject } = require('../src/helpers')

/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} ru
 * @property {Array<Array<string>>} cn
 */

const data = require('./phrases.json')

/** @type {Object<string,Question>} */
const questions = arrToObject(data)

module.exports = questions

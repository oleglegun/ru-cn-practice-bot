const { arrToObject } = require('../src/utils')
const data = require('./phrases.json')

/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} ru
 * @property {Array<Array<string>>} cn
 */

/** @type {Object<string,Question>} */
module.exports = arrToObject(data)

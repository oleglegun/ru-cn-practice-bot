/**
 * @typedef {Object} Sentence
 * @property {string} Sentence.id
 * @property {string} Sentence.russian
 * @property {string} Sentence.chinese
 */

/**
 *
 * @param {Array<Sentence>} arr
 */
const arrToObject = function(arr) {
    const obj = {}

    arr.forEach(item => {
        obj[item.id] = item
    })

    return obj
}

module.exports = { arrToObject }

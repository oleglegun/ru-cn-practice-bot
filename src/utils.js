const chunk = require('lodash.chunk')
const pinyinConvert = require('pinyin-convert')

const arrToObject = function(arr) {
    const obj = {}

    arr.forEach(item => {
        obj[item.id] = item
    })

    return obj
}

/**
 *
 * @param {string} pinyin String in format like: `shi2`
 */
const applyCharTone = pinyin => {
    return pinyinConvert(pinyin)
}

module.exports = { arrToObject, applyCharTone }

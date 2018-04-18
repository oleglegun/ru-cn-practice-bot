#!/usr/bin/env node
const fs = require('fs')

/**
 * @typedef {Object} WordObject
 * @property {string} pinyin
 * @property {string} char
 * @property {string} translation
 */

/** @type {Object<string, Array<WordObject>>} */
const words = require('../db/words.json')

addWord(parseArgs())

fs.writeFileSync('db/words.json', JSON.stringify(words, null, 2), { encoding: 'utf-8' })

function parseArgs() {
    const args = process.argv

    if (!args[2] || !args[3] || !args[4]) {
        throw new Error('Incorrect input.')
    }

    return {
        pinyin: args[2],
        char: args[3],
        translation: args[4],
    }
}

/**
 *
 * @param {WordObject} wordObject
 */
function addWord(wordObject) {
    if (words[wordObject.pinyin]) {
        words[wordObject.pinyin].forEach(word => {
            if (word.char === wordObject.char) {
                throw new Error('The word has been already added.')
            }
        })

        words[wordObject.pinyin].push(wordObject)
    } else {
        words[wordObject.pinyin] = [Object.assign({}, wordObject)]
    }
}

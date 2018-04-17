const data = require('../db/data')
const {hashArray, printSorted} = require('./utils')

let ids = Object.keys(data)

const unprocessedChars = []

// for each sentence
ids.forEach(id => {
    // for each part
    data[id].cn.forEach(charPair => {
        // no character defined
        if (charPair[1] === '') {
            // add pinyin
            let pinyin = charPair[0].toLowerCase().replace(/[.,:-\?]/g, ' ')

            unprocessedChars.push(charPair[0].toLowerCase())
        }
    })
})

const hashMap = hashArray(unprocessedChars)
printSorted(hashMap)



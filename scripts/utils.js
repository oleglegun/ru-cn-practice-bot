/**
 *
 * @param {Array<string>} pinyinArray
 */
exports.hashArray = pinyinArray => {
    const hashMap = {}
    for (let i = 0, len = pinyinArray.length; i < len; i++) {
        if (hashMap[pinyinArray[i]]) {
            // word hashed
            hashMap[pinyinArray[i]]++
        } else {
            hashMap[pinyinArray[i]] = 1
        }
    }

    return hashMap
}

exports.printSorted = hashMap => {
    let keys = Object.keys(hashMap)
    const len = keys.length

    for (let i = 0; i < len; i++) {
        let max = 0
        let idx = 0
        let key = ''
        for (let j = 0; j < len; j++) {
            if (max < hashMap[keys[j]]) {
                // new max
                max = hashMap[keys[j]]
                idx = j
                key = keys[j]
            }
        }

        console.log(key, hashMap[key])

        // remove element
        keys.splice(idx, 1)
    }
}


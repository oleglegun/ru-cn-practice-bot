const data = require('./db/data')

const keys = Object.keys(data)

let words = ''

keys.forEach(key => {
    words += data[key].chinese
})

words = words.replace(/[.,-?]/g, ' ')

const hash = {}

const wordsSeparated = words.toLowerCase().split(' ')

const len = wordsSeparated.length

for (let i = 0; i < len; i++) {

    if (hash[wordsSeparated[i]]) {
        // word hashed
        hash[wordsSeparated[i]]++
    } else {
        hash[wordsSeparated[i]] = 1
    }
}

function print(hash) {

    let keys = Object.keys(hash)
    const len = keys.length


    for (let i = 0; i < len; i++) {
        let max = 0
        let idx = 0
        let key = ''
        for (let j = 0; j < len; j++) {
            if (max < hash[keys[j]]) {
                // new max
                max = hash[keys[j]]
                idx = j
                key = keys[j]
            }
        }

        console.log(key, hash[key])

        // remove element
        keys.splice(idx, 1)
    }
}

print(hash)

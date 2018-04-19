const t = require('tap')
const { applyCharTone } = require('../src/utils')

const testCases = [
    ['hai2', 'hái'],
    ['shi2tang2', 'shítáng'],
    ['dong4hua4pian4', 'dònghuàpiàn'],
    ['lü4', 'lǜ'],
]

testCases.forEach(test => {
    applyCharTone(test[0]).then(result => {
        t.equal(result, test[1])
    })
})

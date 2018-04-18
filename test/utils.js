const t = require('tap')
const { applyCharTone } = require('../src/utils')

const testCases = [
    ['hai2', 'hái'],
    ['shi2tang2', 'shítáng'],
    ['dong4hua4pian4', 'dònghuàpiàn'],
    ['lü4', 'lǜ'],
]

testCases.forEach(test => {
    t.equal(applyCharTone(test[0]), test[1])
})

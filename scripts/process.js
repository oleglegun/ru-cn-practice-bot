const data = require('../db/data')

const result = data.map(item => {
    const pinyinArr = item.pinyin.split(' ')
    const cn = pinyinArr.map(value => {
        return [value, '']
    })

    return {
        ...item,
        cn: cn,
    }
})

console.log(JSON.stringify(result))

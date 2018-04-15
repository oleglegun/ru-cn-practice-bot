const arrToObject = function(arr) {
    const obj = {}

    arr.forEach(item => {
        obj[item.id] = item
    })

    return obj
}

module.exports = { arrToObject }

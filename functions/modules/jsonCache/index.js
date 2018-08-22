// https://www.npmjs.com/package/memory-cache
const cache = require('memory-cache')

let isActive = false

exports.isActive = (bool) => {
    isActive = bool
}

exports.set = (key, value) => {
    if (!isActive) return null

    return cache.put(key, JSON.stringify(value))
}

exports.get = (key) => {
    if (!isActive) return null

    const jsonString = cache.get(key)
    return JSON.parse(jsonString)
}

exports.delete = (key) => {
    if (!isActive) return
    return cache.del(key)
}

exports.clear = () => {
    if (!isActive) return
    cache.clear(key)
}
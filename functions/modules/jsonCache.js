// https://www.npmjs.com/package/memory-cache
const cache = require('memory-cache')

const active = true

exports.set = (key, value) => {
    if (!active) {
        return
    }
    return cache.put(key, value)
}

exports.get = (key) => {
    if (!active) {
        return
    }
    return cache.get(key)
}

exports.delete = (key) => {
    if (!active) {
        return
    }
    return cache.del(key)
}

exports.clear = () => {
    if (!active) {
        return
    }
    cache.clear(key)
}
// https://www.npmjs.com/package/memory-cache
const cache = require('memory-cache')

const isActive = true

exports.set = (key, value, active = false) => {
    active = active ? active : isActive
    if (!active) return null
    
    return cache.put(key, JSON.stringify(value))
}

exports.get = (key, active = false) => {
    active = active ? active : isActive
    if (!active) return null

    const jsonString = cache.get(key)
    return JSON.parse(jsonString)
}

exports.delete = (key, active = false) => {
    active = active ? active : isActive
    if (!active) return
    return cache.del(key)
}

exports.clear = (active = false) => {
    active = active ? active : isActive
    if (!active) return
    cache.clear(key)
}
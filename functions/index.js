// registor modules
const modules = {
    // test: require('./events/store/test'),
    // auth: require('./events/auth'),
    // storage: require('./events/storage'),
    sessionLogin: require('./events/https/frontend'),
}

// call modules
Object.keys(modules).forEach(moduleName => {
    const targetModule = modules[moduleName]
    Object.keys(targetModule).forEach(key => {
        exports[key] = targetModule[key]
    })
})
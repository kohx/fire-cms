// registor modules
const modules = {
    // test: require('./events/store/test'),
    // auth: require('./events/auth'),
    // updateAsset: require('./events/storage/updateAsset'),
    app: require('./events/https/app'),
}

// call modules
Object.keys(modules).forEach(moduleName => {
    const targetModule = modules[moduleName]
    Object.keys(targetModule).forEach(key => {
        exports[key] = targetModule[key]
    })
})
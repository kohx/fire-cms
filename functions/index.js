// registor modules
const modules = {
    userOnCreate: require('./events/auth/userOnCreate'),
    userOnDelete: require('./events/auth/userOnDelete'),
    assetOnFinalize: require('./events/storage/assetOnFinalize'),
    assetOnDelete: require('./events/storage/assetOnDelete'),
    app: require('./events/https/app'),
}

// call modules
Object.keys(modules).forEach(moduleName => {
    const targetModule = modules[moduleName]
    Object.keys(targetModule).forEach(key => {
        exports[key] = targetModule[key]
    })
})
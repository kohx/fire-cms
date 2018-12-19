// registor modules
const modules = {
    storeUsersOnCreate: require('./events/store/usersOnCreate'),
    storeUsersOnUpdate: require('./events/store/usersOnUpdate'),
    storeUsersOnDelete: require('./events/store/usersOnDelete'),
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
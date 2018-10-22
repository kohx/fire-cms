const parent = require('../../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const url = require('url')

const debug = require('../../../../../modules/debug').debug

module.exports.checkPath = (req, res, next) => {

    const isBackend = req.vessel.get('paths.isBackend')
    if (isBackend) {
        next()
    } else {
        next('route')
    }
}

module.exports.checkThing = (req, res, next) => {

    const isExist = req.vessel.get('thing.unique')
    if (isExist) {
        next()
    } else {
        next('route')
    }
}

module.exports.getFlags = (req, res, next) => {

    // thing
    const thing = req.vessel.get('thing')

    // signin Uniques
    const signinUniques = [
        req.vessel.get('settings.frontend.signinUnique', []),
        req.vessel.get('settings.backend.signinUnique', [])
    ]

    // サインインページかチェック
    thing.isSigninPage = signinUniques.includes(thing.unique)

    // ロールが必要かどうか
    const thingRoles = req.vessel.get('thing.roles')
    // role length
    const thingRoleLength = Object.keys(thingRoles).length
    // get active role
    const activeThingRoles = Object.keys(thingRoles).filter((key) => {
        return thingRoles[key] === true
    })
    // active role length
    const activeThingRoleLength = activeThingRoles.length
    // if role length equal active role length then
    thing.isFreeRole = thingRoleLength === activeThingRoleLength ? true : false

    // ユーザのロール
    const userRole = req.vessel.get('user.role')
    thing.hasRole = thingRoles[userRole] != null ? thingRoles[userRole] : false

    next()
}

module.exports.checkSingIn = (req, res, next) => {

    // thing
    const thing = req.vessel.get('thing')

    // サインインしているかチェック
    let isSigned = req.vessel.get('sign.status')

    // thing
    const backend = req.vessel.get('settings.backend')
    
    // サインインが必要なく、サインインページでない場合
    if (thing.isFreeRole && !thing.isSigninPage) {

        debug(`@ ${thing.unique} is free page.`, __filename, __line, true)
        next()
    }

    // サインインページでなく、サインインしてない場合
    else if (!thing.isSigninPage && !isSigned) {

        const redirectPath = `/${backend.firstPath}/${backend.signinUnique}`
        debug(`@ ${thing.unique} not sigin in. redirect to ${redirectPath}`, __filename, __line, true)
        res.redirect(`${redirectPath}`)
    }

    // サインインページで、サインインしている場合
    else if (thing.isSigninPage && isSigned) {

        const refererUrl = (req.header('Referer') != null) ? req.header('Referer') : null
        let referer = (refererUrl != null) ? url.parse(refererUrl).pathname.trims('/') : ''

        if (referer === '' || referer === backendSigninUnique) {

            referer = `/${backend.firstPath}/${backend.topUnique}`
        }

        debug(`@ already sigin in. redirect to ${referer}`, __filename, __line)
        res.redirectC(referer)
    }

    // ロールが一致しない場合
    else if (!thing.hasRole) {
        debug(`@  ${thing.unique} can not access.`, __filename, __line)
        next('route')
    }
    else {
        next()
    }
}

module.exports.checkHasRole = (req, res, next) => {

    // ユーザのロール
    const userRole = req.vessel.get('user.role')
    const hasRole = thingRoles[userRole] != null ? thingRoles[userRole] : false

    if (!hasRole) {
        debug(`@  ${unique} can not access ${userRole}.`, __filename, __line)
        next('route')
    }
    else {
        next()
    }

}

module.exports.renderPage = (req, res, next) => {

    const thing = req.vessel.get('thing', {})
    const content = (thing.content != null) ? thing.content : ''
    const contentType = (thing.contentType != null) ? thing.contentType : 'html'
    delete thing.content
    delete thing.contentFile
    delete thing.contentType

    const data = {
        content: content,
        contentType: contentType,
        params: thing,
        templates: req.vessel.get('templates'),
    }

    // add params
    data.params.sign = req.vessel.get('sign')
    data.params.user = req.vessel.get('user')
    data.params.csrfToken = req.vessel.get('csrfToken')
    data.params.frontendBase = req.vessel.get('frontendBase')
    data.params.backendBase = req.vessel.get('backendBase')
    data.params.backendFirstPath = req.vessel.get('settings.backend.firstPath')

    res.wbRender(data)
}

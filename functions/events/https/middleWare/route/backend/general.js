const parent = require('../../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const url = require('url')

const debug = require('../../../../../modules/debug').debug
const util = require('../../util')

/* promise catch error message json */
const errorMessageJson = util.errorMessageJson

module.exports.checkPath = (req, res, next) => {

    const isBackend = req.vessel.get('paths.isBackend')
    if (isBackend) {
        next()
    } else {
        next('route')
    }
}

module.exports.checkThing = (req, res, next) => {

    const thing = req.vessel.get('thing')

    // console.log(`\n=============== ${thing.unique} ===============`)

    if (thing.unique) {
        next()
    } else {
        res.throwNotFound('not found!')
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
    // if role length equal active role length then
    thing.isFreeRole = thingRoleLength === 0 ? true : false

    // ユーザのロール
    const userRole = req.vessel.get('user.role')
    thing.hasRole = thingRoles[userRole] != null ? thingRoles[userRole] : false
    next()
}

module.exports.checkSingIn = (req, res, next) => {

    // thing
    const thing = req.vessel.get('thing')

    // サインインフラッグ
    let isSigned = req.vessel.get('sign.status')

    // thing
    const backend = req.vessel.get('settings.backend')

    // TODO:: X-Forwarded-Host (XFH) ヘッダー使える？
    const backendBase = req.vessel.get('backendBase')

    if (isSigned) {

        // サインインしていてサインインページの場合
        if (thing.isSigninPage) {

            const refererUrl = (req.header('Referer') != null) ? req.header('Referer') : null
            let referer = (refererUrl != null) ? url.parse(refererUrl).pathname.trims('/') : ''

            if (referer === '' || referer === backend.signinUnique) {
                referer = `${backendBase}/${backend.topUnique}`
            }

            // debug(`@ already sigin in. redirect to ${referer}`, __filename, __line)
            res.redirect(referer)
        }
        // サインインしていてフリーロールの場合
        else if (thing.isFreeRole) {

            // debug(`@ [ ${thing.unique} ] is free page.`, __filename, __line)
            next()
        }
        // サインインしていてロールが一致しない場合 401?
        else if (!thing.hasRole) {

            res.throwForbidden('Role Unauthorized.')
        }
        else {

            debug(`@ [ ${thing.unique} ]`, __filename, __line)
            next()
        }
    } else {

        // サインインしていなくてフリーページの場合
        if (thing.isFreeRole) {

            // debug(`@ [ ${thing.unique} ] is free page.`, __filename, __line)
            next()
        }
        // サインインしていない場合
        else {

            // then post
            if(req.method === 'POST') {
                errorMessageJson(res, null, 'not sigin in. sign in again.')
            }
            // redirect to signin
            else {
                const redirectPath = `${backendBase}/${backend.signinUnique}`
                // debug(`@ [ ${thing.uniqueng} ] not sigin in. redirect to ${redirectPath}`, __filename, __line)
                res.redirect(`${redirectPath}`)
            }
        }
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
    data.params.roles = req.vessel.get('settings.general.roles')

    // console.log(`=============== ${thing.unique} ===============\n`)
    res.wbRender(data)
}

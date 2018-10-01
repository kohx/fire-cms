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

module.exports.checkSingIn = (req, res, next) => {

    // サインインしているかチェック
    let isSigned = req.vessel.get('sign.status')
    // thingのユニーク
    const unique = req.vessel.get('paths.unique')
    // バックエンドのサインインページ
    const backendSigninUnique = req.vessel.get('settings.backend.signinUnique')
    // バックエンドの最初のパス
    const backendFirstPath = req.vessel.get('settings.backend.firstPath')
    // バックエンドのインデックスページ
    const backendTopUnique = req.vessel.get('settings.backend.topUnique')

    // signin Uniques
    const signinUniques = [
        req.vessel.get('settings.frontend.signinUnique', []),
        req.vessel.get('settings.backend.signinUnique', [])
    ]
    // サインインページかチェック
    const isSigninPage = signinUniques.includes(unique)

    // ロールが必要かどうか
    const thingRoles = req.vessel.get('thing.roles')
    const activeThingRoles = Object.keys(thingRoles).filter((key) => {
        return thingRoles[key] === true
    })
    const freeRole = activeThingRoles.length === 0 ? true : false

    // ユーザのロール
    const userRole = req.vessel.get('user.role')
    const hasRole = thingRoles[userRole] != null ? thingRoles[userRole] : false

    // サインインが必要ない場合
    if (freeRole) {
        next()
    }
    // サインインページでなく、サインインしてない場合
    else if (!isSigninPage && !isSigned) {
        const redirectPath = `/${backendFirstPath}/${backendSigninUnique}`
        console.log(`@ not sigin in. redirect to ${redirectPath}`)
        res.redirect(`${redirectPath}`)
    }
    // サインインページで、サインインしている場合
    else if (isSigninPage && isSigned) {

        const refererUrl = (req.header('Referer') != null) ? req.header('Referer') : null
        let referer = (refererUrl != null) ? url.parse(refererUrl).pathname.trims('/') : ''

        if (referer === '' || referer === backendSigninUnique) {
            referer = `/${backendFirstPath}/${backendTopUnique}`
        }
        console.log(`@ already sigin in. redirect to ${referer}`)
        res.redirect(referer)
    }
    // ロールが一致しない場合
    else if (!hasRole) {
        console.log(`@ can not access ${userRole}.`)
        let err = new Error('Not Found.')
        err.status = 404
        next(err)
    }
    else {
        next()
    }
}

module.exports.renderPage = (req, res, next) => {
    const thing = req.vessel.get('thing', {})
    const content = (thing.content != null) ? thing.content : ''
    delete thing.content
    const data = {
        content: content,
        params: thing,
        templates: req.vessel.get('templates'),
    }

    // add params
    data.params.sign = req.vessel.get('sign')
    data.params.csrfToken = req.vessel.get('csrfToken')
    data.params.frontendBase = req.vessel.get('frontendBase')
    data.params.backendBase = req.vessel.get('backendBase')
    data.params.backendFirstpath = req.vessel.get('settings.backend.firstPath')
    return res.wbRender(data)
}

const parent = require('../../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const url = require('url')

const debug = require('../../../../../modules/debug').debug

module.exports.checkPath = (req, res, next) => {

    const isFrontend = req.vessel.get('paths.isFrontend')
    if (isFrontend) {
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

    const unique = req.vessel.get('paths.unique')
    const frontendSigninUnique = req.vessel.get('settings.frontend.signinUnique', 'signin')

    // サインインしているかチェック
    const isSigned = req.vessel.get('sign.status', false)

    // サインインページかチェック
    const isSigninPage = unique === frontendSigninUnique

    // サインインページでサインインしている場合
    if (isSigninPage && isSigned) {

        const refererUrl = (req.header('Referer') != null) ? req.header('Referer') : null
        let referer = (refererUrl != null) ? url.parse(refererUrl).pathname.trims('/') : ''

        if (referer === '' || referer === frontendSigninUnique) {
            referer = '/'
        }
        res.redirect(referer)
    } else {
        next()
    }
}

module.exports.checkRole = (req, res, next) => {
    // TODO:: ここは各thingから取得
    // TODO:: ロール制限のある場合
    // サインインに移動？ OR Not found
    // console.log('role', req.vessel.role)
    next()
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
    data.params.frontendBase = req.vessel.get('settings.frontendBase')
    data.params.backendBase = req.vessel.get('settings.backendBase')

    // ココらへんはthingに入る
    data.params.items = [{
        name: '<h1>kohei</h1>',
        age: 40,
        gender: 'male'
    },
    {
        name: 'kohei',
        age: 40,
        gender: 'male'
    },
    {
        name: 'kohei',
        age: 40,
        gender: 'male'
    }
    ]

    res.status(200)
    res.wbRender(data)
}
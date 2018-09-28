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

    const unique = req.vessel.get('paths.unique')
    const backendSigninUnique = req.vessel.get('settings.backend.signinUnique')
    const backendFirstPath = req.vessel.get('settings.backend.firstPath')
    const backendTopUnique = req.vessel.get('settings.backend.topUnique')

    debug(system.debugSinin, __filename, __line)

    if (system.debugSinin) {
        console.error(`@ line: ${__line}`)
        isSigned = true
        req.vessel.sign = {
            "status": true,
            "message": "sign in success.",
            "user": {
                "iss": "https://session.firebase.google.com/fire-cms-86681",
                "aud": "fire-cms-86681", "auth_time": 1538110178,
                "user_id": "TFHZ4VowjVbtcxPnrvNzM1LtlNv1",
                "sub": "TFHZ4VowjVbtcxPnrvNzM1LtlNv1",
                "iat": 1538110181,
                "exp": 1538542181,
                "email": "kohei0728@gmail.com",
                "email_verified": false,
                "firebase": {
                    "identities": {
                        "email": ["kohei0728@gmail.com"]
                    },
                    "sign_in_provider": "password"
                },
                "uid": "TFHZ4VowjVbtcxPnrvNzM1LtlNv1"
            }
        }
    }
    const user = req.vessel.get('sign.user.uid')

    debug(user, __filename, __line)
    // サインインページかチェック
    // TODO:: ここは各thingから取得
    const roles = req.vessel.get('thing.roles')
    const activeRoles = Object.keys(roles).filter((key) => {
        return roles[key] === true
    })

    if (activeRoles.length === 0) {

    }




    const isSigninPage = [backendSigninUnique].includes(unique)

    // サインインしてない場合
    if (!isSigninPage && !isSigned && unique !== 'signin.js') {
        const redirectPath = `/${backendFirstPath}/${backendSigninUnique}`
        console.log(`@ not sigin in. redirect to ${redirectPath}`)

        res.redirect(`${redirectPath}`)
    } else
        if (isSigninPage && isSigned) {
            const refererUrl = (req.header('Referer') != null) ? req.header('Referer') : null
            let referer = (refererUrl != null) ? url.parse(refererUrl).pathname.trims('/') : ''

            if (referer === '' || referer === backendSigninUnique) {
                referer = `/${backendFirstPath}/${backendTopUnique}`
            }
            console.log(`@${__line}`, referer)
            console.log(`@ already sigin in. redirect to ${referer}`)
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
    data.params.frontendBase = req.vessel.get('frontendBase')
    data.params.backendBase = req.vessel.get('backendBase')
    data.params.backendFirstpath = req.vessel.get('settings.backend.firstPath')
    return res.wbRender(data)
}

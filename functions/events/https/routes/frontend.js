// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const express = require('express')
const router = express.Router()
const url = require('url')

const debug = require('../../../modules/debug').debug
const jsonCache = require('../../../modules/jsonCache')
// activata jsoncash from system
jsonCache.isActive(system.cache)

/* route */
router.get('/*',
    checkPath,
    checkThing,
    checkSingIn,
    checkRole,
    renderPage
)

/* middle wares */
function checkPath(req, res, next) {
    const isFrontend = req.vessel.get('paths.isFrontend')
    if (isFrontend) {
        next()
    } else {
        next('route')
    }
}

function checkThing(req, res, next) {
    const isExist = req.vessel.get('thing.unique')
    if (isExist) {
        next()
    } else {
        next('route')
    }
}

function checkSingIn(req, res, next) {

    const unique = req.vessel.get('paths.unique')

    // TODO:: ここは各thingから取得
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

function checkRole(req, res, next) {
    // TODO:: ここは各thingから取得
    // TODO:: ロール制限のある場合
    // サインインに移動？ OR Not found
    // console.log('role', req.vessel.role)
    next()
}

function renderPage(req, res, next) {
    const thing = req.vessel.get('thing', {})
    const content = (thing.content != null) ? thing.content : ''
    delete thing.content
    const data = {
        content: content,
        params: thing,
        templates: req.vessel.get('templates'),
    }
    data.params.sign = req.vessel.get('sign')
    data.params.csrfToken = req.vessel.get('csrfToken')

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
    console.log(`>>>>>>>>>> ${req.vessel.unique} <<<<<<<<<<`)
}

module.exports = router
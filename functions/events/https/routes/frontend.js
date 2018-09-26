// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const url = require('url')
const express = require('express')
const router = express.Router()

const debug = require('../../../modules/debug').debug
const jsonCache = require('../../../modules/jsonCache')
// activata jsoncash from system
jsonCache.isActive(system.cache)

/* route */
router.get('/*',
    checkPath,
    setLang,
    getThing,
    checkSingIn,
    checkRole,
    renderPage
)

/* middle wares */
function checkPath(req, res, next) {
    const firstPath = req.vessel.get('paths.first');
    const backendFirstPath = req.vessel.get('settings.backend.firstPath', 'backend')

    // ファーストパスがバックエンドファーストパスの場合
    if (firstPath === backendFirstPath) {
        next('route')
    } else {
        next()
    }
}

function setLang(req, res, next) {
    const lang = req.vessel.get('settings.frontend.lang')
    if (lang) {
        req.setLocale(lang)
    }
    next()
}

function getThing(req, res, next) {
    // thingを取得
    admin.firestore().collection('things').doc(req.vessel.paths.unique)
        .get()
        .then(snap => {
            if (snap.exists) {
                req.vessel.thing = snap.data()
                next()
            } else {
                next('route')
            }
        })
        .catch(err => next(err))
}

function checkSingIn(req, res, next) {

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

function checkRole(req, res, next) {
    // TODO:: ロール制限のある場合
    // サインインに移動？ OR Not found
    // console.log('role', req.vessel.role)
    next()
}

function renderPage(req, res, next) {
    const thing = req.vessel.thing
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
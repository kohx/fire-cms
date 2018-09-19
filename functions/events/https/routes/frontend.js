// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const url = require('url')
const express = require('express')
const router = express.Router()
const jsonCache = require('../../../modules/jsonCache')
// activata jsoncash from system
jsonCache.isActive(system.cache)

/* middle wares */
function setLang(req, res, next) {
    if (settings.config.lang) {
        req.setLocale(settings.config.lang)
    }
}

function checkPath(req, res, next) {
    if (req.vessel.firstPath === req.vessel.backendUnique) {
        next('route')
    } else {
        next()
    }
}

function getThing(req, res, next) {
    // thingを取得
    admin.firestore().collection('things').doc(req.vessel.unique)
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
    // サインインページかチェック
    const isSigninPage = req.vessel.unique === req.vessel.signinUnique

    // サインインしているかチェック
    const isSigned = req.vessel.sign.status

    // サインインページでサインインしている場合
    if (isSigninPage && isSigned) {
        const refererUrl = (req.header('Referer') != null) ? req.header('Referer') : null
        let referer = (refererUrl != null) ? url.parse(refererUrl).pathname.trims('/') : ''
        if (referer === '' || referer === req.vessel.signinUnique) {
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
        templates: req.vessel.templates,
    }
    data.params.csrfToken = (req.vessel.csrfToken != null) ? req.vessel.csrfToken : null
    data.params.user = req.vessel.sign.status ? req.vessel.sign.claims : {}
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
    data.params.sign = req.vessel.sign

    res.status(200)
    res.wbRender(data)
    console.log(`>>>>>>>>>> ${req.vessel.unique} <<<<<<<<<<`)
}

/* route */
router.get('/*',
    checkPath,
    getThing,
    checkSingIn,
    checkRole,
    renderPage
)

module.exports = router
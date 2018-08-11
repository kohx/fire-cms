// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const url = require('url')
const signWare = require('../middleWare/signWare')
const express = require('express')
const router = express.Router()
const jsonCache = require('../../../modules/jsonCache')
// activata jsoncash from system
jsonCache.isActive(system.cache)

/* signWare csrf */
router.use(signWare.csrf)

/* middle wares */
function checkPath(req, res, next) {
    if (req.vessel.firstPath === req.vessel.backendUnique) next('route')
    else next()
}

function getThing(req, res, next) {
    let thing = {}

    // // thingを取得
    admin.firestore().collection('things').doc(req.vessel.thingUnique)
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
    const isSignInPage = req.vessel.thingUnique === req.vessel.signinUnique
    // サインインしているかチェック
    const isSignInStatus = req.vessel.sign.status
    // サインインページでサインインしている場合
    if (isSignInPage && isSignInStatus) {
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
        parts: req.vessel.parts,
        wraps: req.vessel.wraps,
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
    console.log(`>>>>>>>>>> ${req.vessel.thingUnique} <<<<<<<<<<`)
}

/* route */
router.get('/*',
    (req, res, next) => checkPath(req, res, next),
    (req, res, next) => getThing(req, res, next),
    (req, res, next) => checkSingIn(req, res, next),
    (req, res, next) => checkRole(req, res, next),
    (req, res, next) => renderPage(req, res, next)
)

module.exports = router
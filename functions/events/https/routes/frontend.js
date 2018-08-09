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

/* signWare csrf */
router.use(signWare.csrf)

function checkPath(req, res, next) {
    if (req.vessel.firstPath === req.vessel.backendUnique) next('route')
    else next()
}

function getTemplate(req, res, next) {
    // get wraps
    const getWraps = new Promise((resolve, reject) => {
        // キャッシュを取得
        const wraps = jsonCache.get('wraps')
        // キャッシュから取得できればそれを返す
        if (wraps != null) {
            resolve(wraps)
        }
        // ラップを取得
        admin.firestore().collection('wraps').get()
            .then(docs => {
                let wraps = {}
                docs.forEach(doc => {
                    const data = doc.data()
                    wraps[doc.id] = data.content
                })
                // キャッシュに入れる 
                jsonCache.set('wraps', wraps)
                // 結果を返す
                resolve(wraps)
            })
            .catch(err => reject(err))
    })

    // get parts
    const getParts = new Promise((resolve, reject) => {
        // キャッシュを取得
        const parts = jsonCache.get('parts')
        // キャッシュから取得できればそれを返す
        if (parts != null) {
            resolve(parts)
        }
        // パーツを取得
        admin.firestore().collection('parts').get()
            .then(docs => {
                let parts = {}
                docs.forEach(doc => {
                    const data = doc.data()
                    parts[doc.id] = data.content
                })
                // キャッシュに入れる 
                jsonCache.set('parts', parts)
                // 結果を返す
                resolve(parts)
            })
            .catch(err => reject(err))
    })

    Promise.all([getWraps, getParts])
        .then(results => {
            const [wraps, parts] = results
            req.vessel.wraps = wraps
            req.vessel.parts = parts
            next()
        })
        .catch(err => next(err))
}

function getThing(req, res, next) {

    let thing = {}

    // thingを取得
    admin.firestore().collection('things').doc(req.vessel.thingUnique)
        .get()
        .then(snap => {
            if (snap.exists) {
                thing = snap.data()
                return snap.ref
            } else {
                // ない場合は404へ
                next('route')
            }
        })
        .then(ref => {
            console.log('↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓')
            ref.collection('groups').get()
                .then(snaps => {
                    snaps.forEach(snap => {

                        thing.groups = {}

                        snap.ref.collection('fields')
                            .get()
                            .then(snaps => {

                                snaps.forEach(snap => {
                                    const field = snap.data()
                                    console.log(field.path)
                                })
                            })
                            .catch(err => next(err))
                    })
                })
        })
        .then(spans => {
            req.vessel.thing = thing
            next()
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
    console.log('<-----------------------------', req.vessel.thingUnique)
}

/* route */
router.get('/*',
    (req, res, next) => checkPath(req, res, next),
    (req, res, next) => getTemplate(req, res, next),
    (req, res, next) => getThing(req, res, next),
    (req, res, next) => checkSingIn(req, res, next),
    (req, res, next) => checkRole(req, res, next),
    (req, res, next) => renderPage(req, res, next)
)

module.exports = router
// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const url = require('url')
const signWare = require('../middleWare/signWare')
const express = require('express')
const router = express.Router()

/* signWare csrf */
router.use(signWare.csrf)

/* route */
router.get('/*',
    (req, res, next) => {
        // ファーストパスがバックエンドの場合
        if (req.vessel.firstPath === req.vessel.backendUnique) next('route')
        else next()
    },
    (req, res, next) => {
        // thingを取得
        admin.firestore().collection('things').doc(req.vessel.thingUnique)
            .get()
            .then(doc => {
                if (doc.exists) {
                    req.vessel.thing = doc.data()
                    next()
                } else {
                    // ない場合は404へ
                    next('route')
                }
            })
            .catch(err => next(err))
    },
    (req, res, next) => {
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
    },
    (req, res, next) => {
        // TODO:: ロール制限のある場合
        // サインインに移動？ OR Not found
        // console.log('role', req.vessel.role)
        next()
    },
    (req, res, next) => {


        // const bucket = admin.storage().bucket()
        // const file = bucket.file('images/sample.jpg')
        console.log('==============================================')   
        // console.log(file)
        console.log('==============================================')                                                       


        // images
        admin.firestore().collection('images')
            .get()
            .then(docs => {
                let images = {}
                docs.forEach(doc => {
                    const data = doc.data()
                    images[doc.id] = data
                })
                req.vessel.thing.images = images
                next()
            })
            .catch(err => next(err))
    },
    (req, res, next) => {
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
        }]
        data.params.sign = req.vessel.sign

        res.status(200)
        res.wbRender(data)
        console.log('<-----------------------------', req.vessel.thingUnique)
    }
)

module.exports = router
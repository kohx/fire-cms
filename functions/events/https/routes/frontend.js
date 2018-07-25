// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin

const url = require('url')
const wavebar = require('../modules/wavebar')
const signWare = require('../middleWare/signWare')

const express = require('express')
const router = express.Router()

router.use(signWare.csrf)

/* signWare csrf */
router.use(signWare.csrf)

router.use(wavebar.init)

/* route */
router.get('/*',
    (req, res, next) => {
        // ファーストパスがバックエンドの場合
        if (req.vessel.firstPath === req.vessel.backendUnique) next('route')
        else next()
    },
    (req, res, next) => {
        // thingsに含まれているかチェック
        if (!req.vessel.thingUniques.includes(req.vessel.pathUnique)) next('route')
        else next()
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
        }
        next()
    },
    (req, res, next) => {
        // console.log('role', req.vessel.role)
        next()
    },
    (req, res, next) => {

        next()
    }
)

router.get('/*', (req, res) => {

    const params = {
        sign: req.vessel.sign,
        csrfToken: (req.vessel.csrfToken != null) ? req.vessel.csrfToken : null,
        user: req.vessel.sign.status ? req.vessel.sign.claims : {},
        items: [{
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
    }

    res.status(200)
        .wbRender(params)
    console.log('<----', req.vessel.thingUnique)
})

module.exports = router
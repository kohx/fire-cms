// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin

const url = require('url')
const wavebar = require('../modules/wavebar')
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

        console.log('<----------------', req.vessel.thingUnique)
        const params = {
            unique: req.vessel.thingUnique,
            sign: req.vessel.sign,
        }

        if (req.vessel.csrfToken != null) {
            params.csrfToken = req.vessel.csrfToken
        }

        const renderd = wavebar.render(req.vessel.thing, params)
        res.status(200)
            .send(renderd)
    }
)

module.exports = router
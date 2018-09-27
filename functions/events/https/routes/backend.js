// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')

const debug = require('../../../modules/debug').debug
const jsonCache = require('../../../modules/jsonCache')
// activata jsoncash from system
jsonCache.isActive(system.cache)

const updateAsset = require('../backendRoutes/updateAsset')

/* route get */
router.get('/*',
    checkPath,
    checkThing,
    checkSingIn,
    getBack
)

/* middle wares */
function checkPath(req, res, next) {
    const isBackend = req.vessel.get('paths.isBackend')
    if (isBackend) {
        next('route')
    } else {
        next()
    }
}

function checkThing(req, res, next) {
    debug('in', __filename, __line)
    const isExist = req.vessel.get('thing.unique')
    if (isExist) {
        next()
    } else {
        next('route')
    }
}

function checkSingIn(req, res, next) {

    const unique = req.vessel.get('paths.unique')
    const backendSigninUnique = req.vessel.get('settings.backend.signinUnique')
    const backendFirstPath = req.vessel.get('settings.backend.firstPath')
    const backendTopUnique = req.vessel.get('settings.backend.topUnique')

    // サインインしているかチェック
    const isSigned = req.vessel.get('sign.status')

    // サインインページかチェック
    const isSignInPage = [backendSigninUnique].includes(unique)

    // サインインしてない場合
    if (!isSignInPage && !isSigned && unique !== 'signin.js') {
        const redirectPath = `/${backendFirstPath}/${backendSigninUnique}`
        console.log(`@ not sigin in. redirect to ${redirectPath}`)

        res.redirect(`${redirectPath}`)
    } else
    if (isSignInPage && isSigned) {
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

function getBack(req, res, next) {

    debug(req.vessel.get('thing'), __filename, __line)
    const unique = req.vessel.get('paths.unique')
    const data = req.vessel.get('data')
    func = backendGetRoutes(unique, data)

    if (func) {
        func(req, res, next)
    } else {
        next('route')
    }
}

function backendGetRoutes(unique, data) {
    const routes = {
        index: (req, res, next) => {
            console.log('<----------------------------- backend index')
            res.wbRender(data)
        },
        signin: (req, res, next) => {
            console.log('<----------------------------- signin')
            res.wbRender(data)
        },
        'signin.js': (req, res, next) => {
            console.log('<----------------------------- signin.js')
            res.wbRender(data, 'js')
        },
        settings: (req, res, next) => {
            console.log('<----------------------------- settings')
            res.wbRender(data)
        },
        divisions: (req, res, next) => {
            console.log('<----------------------------- divisions')
            res.wbRender(data)
        },
        parts: (req, res, next) => {
            console.log('<----------------------------- parts')
            res.wbRender(data)
        },
        assets: (req, res, next) => {
            console.log('<----------------------------- assets')
            res.wbRender(data)
        },
    }
    const func = (routes[unique] != null) ? routes[unique] : false
    return func
}

/* route post */
router.post('/*',
    checkPath,
    checkSingIn,
    postBack
)

function postBack(req, res, next) {
    const unique = req.vessel.back.unique
    // render backend page
    const func = backendPostRoutes(unique)
    if (func) {
        func(req, res, next)
    } else {
        next('route')
    }
}

function backendPostRoutes(unique) {
    const routes = {
        updateAsset: updateAsset
    }
    const func = (routes[unique] != null) ? routes[unique] : false
    return func
}

module.exports = router
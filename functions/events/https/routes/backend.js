// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const express = require('express')
const router = express.Router()
const url = require('url')
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
    checkRole,
    renderPage
)

/* middle wares */
function checkPath(req, res, next) {

    const isBackend = req.vessel.get('paths.isBackend')
    if (isBackend) {
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
    const backendSigninUnique = req.vessel.get('settings.backend.signinUnique')
    const backendFirstPath = req.vessel.get('settings.backend.firstPath')
    const backendTopUnique = req.vessel.get('settings.backend.topUnique')

    // サインインしているかチェック
    // const isSigned = req.vessel.get('sign.status')
    const isSigned = true
    debug(isSigned, __filename, __line)

    // サインインページかチェック
    // TODO:: ここは各thingから取得

    debug(req.vessel.get('thing.roles'), __filename, __line)
    const roles = req.vessel.get('thing.roles')
    debug(Object.keys(roles), __filename, __line)
    Object.keys(roles).forEach(role => {
        debug(role, __filename, __line)
        debug(roles[role], __filename, __line)
    })


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

    // add params
    data.params.sign = req.vessel.get('sign')
    data.params.csrfToken = req.vessel.get('csrfToken')
    data.params.frontendBase = req.vessel.get('frontendBase')
    data.params.backendBase = req.vessel.get('backendBase')
    data.params.backendFirstpath = req.vessel.get('settings.backend.firstPath')
    res.wbRender(data)
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
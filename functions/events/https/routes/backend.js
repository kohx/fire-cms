// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const express = require('express')
const router = express.Router()

const debug = require('../../../modules/debug').debug
const jsonCache = require('../../../modules/jsonCache')
// activata jsoncash from system
jsonCache.isActive(system.cache)

// middleWare
const generalMethod = require('../middleWare/route/backend/general')
const updateAsset = require('../middleWare/route/backend/updateAsset')

/* route get */
router.get('/*',
    generalMethod.checkPath,
    generalMethod.checkThing,
    generalMethod.checkSingIn,
    getBack,
    generalMethod.renderPage
)

function getBack(req, res, next) {
    getBack2(req, res, next) 
}

function getBack2(req, res, next) {
    next()
}

/* route post */
router.post('/*',
    generalMethod.checkPath,
    generalMethod.checkThing,
    generalMethod.checkSingIn,
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
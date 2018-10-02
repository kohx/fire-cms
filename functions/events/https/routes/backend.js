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

// subRote
const divisions = require('../middleWare/route/backend/divisions')

/* route get */
router.get('/*',
    generalMethod.checkPath,
    generalMethod.checkThing,
    generalMethod.checkSingIn,
    subRoute,
    generalMethod.renderPage
)

/* sub route */
// ここで各バックエンドの処理を入れていく
function subRoute(req, res, next) {
    const unique = req.vessel.get('paths.unique')
    const subRoutes = {
        divisions: divisions.index,
        'division-edit': divisions.edit,
    }

    const subRoute = subRoutes[unique] != null ? subRoutes[unique] : null
    if(subRoute) {
        subRoute(req, res, next)
    } else {
        next()
    }
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
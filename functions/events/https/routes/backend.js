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
const setting = require('../middleWare/route/backend/setting')
const thing = require('../middleWare/route/backend/thing')
const template = require('../middleWare/route/backend/template')
const division = require('../middleWare/route/backend/division')

/* route get */
router.get('/*',
    generalMethod.checkPath,
    generalMethod.checkThing,
    generalMethod.checkSingIn,
    subGetRoute,
    generalMethod.renderPage
)

/* sub get route */
// ここで各バックエンドの処理を入れていく
function subGetRoute(req, res, next) {
    
    const unique = req.vessel.get('paths.unique')
    
    const subRoutes = {
        // settings
        'settings': setting.index,
        // thing
        'things': thing.index,
        'thing': thing.edit,
        'thing-content': thing.content,
        // template
        'templates': template.index,
        'template': template.edit,
        'template-content': template.content,
        // division
        division: division.index,
    }

    const callSubRoute = subRoutes[unique] != null ? subRoutes[unique] : null
    if (callSubRoute) {
        callSubRoute(req, res, next)
    } else {
        next()
    }
}

/* route post */
router.post('/*',
    generalMethod.checkPath,
    generalMethod.checkThing,
    generalMethod.checkSingIn,
    subPostRoute
)

function subPostRoute(req, res, next) {

    const unique = req.vessel.get('paths.unique')
    const subRoutes = {
        'thing-cleate': thing.cleate,
        'thing-update': thing.update,
        'thing-delete': thing.delete,
        'template-cleate': template.cleate,
        'template-update': template.update,
        'template-delete': template.delete,
    }

    const callSubRoute = subRoutes[unique] != null ? subRoutes[unique] : null
    if (callSubRoute) {
        callSubRoute(req, res, next)
    } else {
        next()
    }
}

module.exports = router
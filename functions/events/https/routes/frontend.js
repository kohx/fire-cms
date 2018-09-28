// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const express = require('express')
const router = express.Router()
const url = require('url')

const debug = require('../../../modules/debug').debug
const jsonCache = require('../../../modules/jsonCache')
// activata jsoncash from system
jsonCache.isActive(system.cache)

// middleWare
const generalMethod = require('../middleWare/route/frontend/general')

/* route */
router.get('/*',
    generalMethod.checkPath,
    generalMethod.checkThing,
    generalMethod.checkSingIn,
    generalMethod.checkRole,
    generalMethod.renderPage
)

module.exports = router
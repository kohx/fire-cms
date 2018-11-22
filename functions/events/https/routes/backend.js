// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

/**
 * translate
 */
// console.log('@@@', res.__('Hello'))
// console.log('@@@', res.__('yes'))
// console.log('@@@', req.__('Hello {{name}}', { name: 'kohei' }))
// console.log('@@@', res.__({ phrase: 'Hello {{name}}', locale: 'ja' }, { name: 'こうへい' }))
// console.log('@@@', res.__l('Hello'))
// console.log('@@@', res.__h('Hello'))
// console.log('@@@', res.__('greeting.formal'))
// console.log('@@@', res.__('greeting.informal'))

const express = require('express')
const router = express.Router()

const debug = require('../../../modules/debug').debug
const jsonCache = require('../../../modules/jsonCache')
// activata jsoncash from system
jsonCache.isActive(system.cache)

// middleWare
const generalMethod = require('../middleWare/route/backend/general')

// subRote
const sign = require('../middleWare/route/backend/sign')
const setting = require('../middleWare/route/backend/setting')
const user = require('../middleWare/route/backend/user')
const thing = require('../middleWare/route/backend/thing')
const template = require('../middleWare/route/backend/template')
const division = require('../middleWare/route/backend/division')

const asset = require('../middleWare/route/backend/asset')
const updateAsset = require('../middleWare/route/backend/updateAsset')



/*
これつかえるかな？
function innerLambda(start) {
    let count = start
    return function (add) {
      count = count + add
      return count
    }
  }
  const inner = innerLambda(3)
  function outer(...fn) {
    return fn
  }
  const test = () => outer(inner(1), inner(2), inner(3))
 */




/* route get */
router.get('/*',
    generalMethod.checkPath,
    generalMethod.checkThing,
    generalMethod.getFlags,
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
        // users
        'users': user.index,
        'user': user.edit,
        // divisions
        'divisions': division.index,
        'division': division.edit,
        // template
        'templates': template.index,
        'template': template.edit,
        // thing
        'things': thing.index,
        'thing': thing.edit,
        'thing-content': thing.content,
        'thing-assets': thing.assets,
        // assets
        'assets': asset.assets,
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
    generalMethod.getFlags,
    generalMethod.checkSingIn,
    subPostRoute
)

function subPostRoute(req, res, next) {

    const unique = req.vessel.get('paths.unique')
    const subRoutes = {
        // sign
        'sign-in': sign.in,
        'sign-out': sign.out,
        // settings
        'setting-update': setting.update,
        // users
        'user-create': user.create,
        'user-update': user.update,
        'user-delete': user.delete,
        // divisions
        'division-create': division.create,
        'division-update': division.update,
        'division-delete': division.delete,
        // template
        'template-create': template.create,
        'template-update': template.update,
        'template-delete': template.delete,
        // thing
        'thing-create': thing.create,
        'thing-update': thing.update,
        'thing-delete': thing.delete,
        // assets
    }

    const callSubRoute = subRoutes[unique] != null ? subRoutes[unique] : null
    if (callSubRoute) {
        callSubRoute(req, res, next)
    } else {
        next()
    }
}

module.exports = router
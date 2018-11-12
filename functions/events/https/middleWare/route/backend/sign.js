const parent = require('../../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const validation = require('../../../../../modules/validation')
const debug = require('../../../../../modules/debug').debug

const signWare = require('../../../middleWare/app/signWare')

module.exports.in = (req, res, next) => {

    return signWare.in(req, res, next)
}

module.exports.out = (req, res, next) => {

    return signWare.out(req, res, next)
}

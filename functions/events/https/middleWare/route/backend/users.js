const parent = require('../../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const url = require('url')

const debug = require('../../../../../modules/debug').debug

module.exports.list = (req, res, next) => {

    debug(req.vessel.get('thing'), __filename, __line)

    next()
}

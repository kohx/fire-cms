const parent = require('../../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const url = require('url')
 
const debug = require('../../../../../modules/debug').debug

module.exports.index = (req, res, next) => {

    admin.firestore().collection('divisions').get()
        .then(docs => {
            const targets = []
            docs.forEach(doc => {
                targets.push(doc.data())
            })
            req.vessel.thing.divisions = divisions
            next()
        })
        .catch(err => {
            debug(err, __filename, __line)
            next(err)
        })
}

module.exports.edit = (req, res, next) => {

    debug('divisions', __filename, __line)

    next()
}
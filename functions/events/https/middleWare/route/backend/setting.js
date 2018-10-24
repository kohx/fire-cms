const parent = require('../../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const url = require('url')

const debug = require('../../../../../modules/debug').debug

module.exports.index = (req, res, next) => {

    admin.firestore().collection('settings').get()
        .then(docs => {
            const targets = {}
            docs.forEach(doc => {
                targets[doc.id] = doc.data()
            })

            targets.lang.locales = targets.lang.locales.join(',')

            req.vessel.thing.targets = targets
            next()
        })
        .catch(err => {
            debug(err, __filename, __line)
            next(err)
        })
}

module.exports.update = (req, res, next) => {

    debug('update', __filename, __line)

    next()
}
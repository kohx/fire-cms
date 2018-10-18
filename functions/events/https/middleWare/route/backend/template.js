const parent = require('../../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const url = require('url')

const debug = require('../../../../../modules/debug').debug

module.exports.index = (req, res, next) => {
    return admin.firestore().collection('templates').get()
        .then(docs => {
            const targets = []
            docs.forEach(doc => {
                targets.push(doc.data())
            })
            req.vessel.thing.targets = targets
            next()
        })
        .catch(err => {
            next(err)
        })
}

module.exports.content = (req, res, next) => {
debug('!@!@', __filename, __line)
    const segments = req.vessel.get('paths.segments')
    const target = segments.shift()
    const thing = req.vessel.get('thing')

    if (!target) {
        next()
    } else {

        admin.firestore().collection('templates').doc(target).get()
            .then(doc => {
                const target = doc.data()

                target.content = target.content.replace(/\\n/g, '\n')

                thing.target = target
                next()
            })
            .catch(err => {
                debug(err, __filename, __line)
                next(err)
            })
    }
}

module.exports.edit = (req, res, next) => {

    const segments = req.vessel.get('paths.segments')
    const target = segments.shift()
    const thing = req.vessel.get('thing')

    if (!target) {
        next()
    } else {

        admin.firestore().collection('templates').doc(target).get()
            .then(doc => {
                const target = doc.data()

                target.content = target.content.replace(/\n/g, '\\n')

                thing.target = target
                next()
            })
            .catch(err => {
                debug(err, __filename, __line)
                next(err)
            })
    }
}

module.exports.update = (req, res, next) => {

    let content = req.body.content != null ? req.body.content : ''
    content = content.replace(/\n/g, '\\n')
    let unique = req.body.unique != null ? req.body.unique : ''

    return admin.firestore().collection('templates').doc(unique)
        .update({
            content
        })
        .then(result => {
            res.json({
                status: true,
                message: `ok.`
            })
        })
        .catch(err => {
            debug('in', __filename, __line)
            res.json({
                status: false,
                message: err.message
            })
        })
}

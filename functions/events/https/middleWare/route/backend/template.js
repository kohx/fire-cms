const parent = require('../../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const debug = require('../../../../../modules/debug').debug
const validation = require('../../../../../modules/validation')
const util = require('../util')

/* promise catch error message json */
const errorMessageJson = util.errorMessageJson

/* build json messages from validation invalid messages */
const invalidMessageJson = util.invalidMessageJson

/* validation division */
const validationBody = (body, uniqueFlag) => {

    /* set orderbalidation */
    const validate = validation.list(body)

    if (body.name != null) {
        validate.valid('name', 'isRequired')
    }

    if (body.unique != null) {
        validate.valid('unique', 'isRequired')
        validate.valid('unique', 'isAlnumunder')
        validate.valid('unique', 'isUnique', uniqueFlag)
    }

    if (body.order != null) {
        validate.valid('order', 'isRequired')
        validate.valid('order', 'isNumeric')
    }

    return validate.get()
}

/**
 * template index (division)
 */
module.exports.index = (req, res, next) => {
    return admin.firestore().collection('templates').orderBy('order', "asc").get()
        .then(docs => {
            const targets = {}
            docs.forEach(doc => {
                targets[doc.id] = doc.data()
            })
            debug(targets, __filename, __line)
            req.vessel.thing.targets = targets
            next()
        })
        .catch(err => {
            debug(err, __filename, __line)
            next(err)
        })
}

/**
 * division add
 */
module.exports.add = (req, res, next) => {
    const templateTypes = req.vessel.get('settings.general.template_types')
    req.vessel.thing.templateTypes = templateTypes
    next()
}

/**
 * division edit
 */
module.exports.edit = (req, res, next) => {

    // get unique
    const segments = req.vessel.get('paths.segments')
    const target = segments.shift()

    return admin.firestore().collection('templates')
        .where('unique', '==', target)
        .limit(1)
        .get()
        .then(docs => {
            // division is not found
            if (docs.size === 0) {
                let err = new Error('template unique Not Found!')
                err.status = 404
                next(err)
                return
            } else {
                let docData = null
                docs.forEach(doc => {
                    docData = doc.data()
                })
                req.vessel.thing.target = docData
                const templateTypes = req.vessel.get('settings.general.template_types')
                req.vessel.thing.templateTypes = templateTypes
                next()
            }
        })
        .catch(err => {
            debug(err, __filename, __line)
            next(err)
        })

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
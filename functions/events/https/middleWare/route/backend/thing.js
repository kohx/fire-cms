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

/* validation thing */
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

    // if (body.role != null) {
    //     validate.valid('role', 'isRequired')
    // }

    return validate.get()
}

/**
 * thing index (things)
 */
module.exports.index = (req, res, next) => {
    return admin.firestore().collection('things')
        .orderBy('order', "asc")
        .get()
        .then(docs => {
            const targets = {}
            docs.forEach(doc => {
                let data = doc.data()
                // date value to string
                data.dateOfIssue = data.dateOfIssue.toDate().toLocaleString()
                // data.date_of_issue = data.dateOfIssue.toDate().toLocaleDateString()
                // data.date_of_issue = data.dateOfIssue.toDate().toLocaleTimeString()
                targets[doc.id] = data
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
 * thing add
 */
module.exports.add = (req, res, next) => {
    const roles = req.vessel.get('settings.general.roles')
    req.vessel.thing.roles = roles
    next()
}

/**
 * thing edit
 */
module.exports.edit = (req, res, next) => {

    // get unique
    const segments = req.vessel.get('paths.segments')
    const target = segments.shift()

    return admin.firestore().collection('things')
        .where('unique', '==', target)
        .limit(1)
        .get()
        .then(docs => {
            // thing is not found
            if (docs.size === 0) {
                let err = new Error('thing unique Not Found!')
                err.status = 404
                next(err)
                return
            } else {
                let docData = null
                docs.forEach(doc => {
                    docData = doc.data()
                })
                docData.dateOfIssue = docData.dateOfIssue.toDate().toLocaleString()
                req.vessel.thing.substance = docData
                debug('@@@@@', __filename, __line)
                debug(req.vessel.thing, __filename, __line)
                next()
            }
        })
        .catch(err => {
            debug(err, __filename, __line)
            next(err)
        })
}
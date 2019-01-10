const parent = require('../../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const debug = require('../../../../../modules/debug').debug
const validation = require('../../../../../modules/validation')
const util = require('../../util')

/* message json */
const errorMessageJson = util.errorMessageJson
const invalidMessageJson = util.invalidMessageJson
const successMessageJson = util.successMessageJson

/* filter body */
const filterDody = util.filterDody

/**
 * template index (templates)
 */
module.exports.index = (req, res, next) => {
    return admin.firestore().collection('templates')
        .orderBy('order', 'asc')
        .get()
        .then(docs => {
            const targets = {}
            docs.forEach(doc => {
                let data = doc.data()
                targets[doc.id] = data
            })
            req.vessel.thing.targets = targets
            next()
        })
        .catch(err => {
            debug(err, __filename, __line)
            next(err)
        })
}

/**
 * template add
 */
module.exports.add = (req, res, next) => {
    const templateTypes = req.vessel.get('settings.general.template_types')
    req.vessel.thing.templateTypes = templateTypes
    next()
}

/**
 * template edit
 */
module.exports.edit = (req, res, next) => {

    // get unique
    const segments = req.vessel.get('paths.segments')
    const target = segments.shift()

    if (!target) {
        res.throwNotFound('not found!')
    }

    return admin.firestore().collection('templates')
        .doc(target)
        .get()
        .then(doc => {
            // user is not found
            if (!doc.exists) {
                res.throwNotFound('not found!')
            } else {
                let data = doc.data()
                req.vessel.thing.target = data
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

/**
 * template create(post)
 */
module.exports.create = (req, res, next) => {

    // body
    const body = req.body
    let id = null

    // get unique from body
    const unique = body.unique ? body.unique : ''

    // get unique from store
    admin.firestore().collection('templates')
        .where('unique', '==', unique)
        .limit(1)
        .get()
        .then(docs => {

            // check unique is unique
            const uniqueFlag = docs.size === 0 ? true : false

            // get validation result
            const validationResult = validationCreate(body, uniqueFlag)

            // validation invalid
            if (!validationResult.check) {
                // send invalid messages json
                return invalidMessageJson(res, validationResult)
            }
            
            const allowaKeys = [
                'name',
                'unique',
                'order',
                'type',
                'content'
            ]
            const intKeys = ['order']
            const params = filterDody(body, allowaKeys, intKeys)

            // add id
            const templateDoc = admin.firestore().collection('templates').doc()
            id = templateDoc.id
            params.id = id

            templateDoc.set(params)
                .then(_ => {
                    // send success messages json
                    successMessageJson(res, 'Successfully created new templates.', null, {
                        mode: 'create',
                        id: id
                    })
                })
                .catch(err => errorMessageJson(res, err, null, __filename, __line))
        })
        .catch(err => errorMessageJson(res, err, null, __filename, __line))
}

/* validation create template */
function validationCreate(body, uniqueFlag) {

    /* set orderbalidation */
    const validate = validation.list(body)
        // name
        .valid('name', 'isRequired')
        // unique
        .valid('unique', 'isRequired')
        .valid('unique', 'isAlnumunder')
        .valid('unique', 'isUnique', uniqueFlag)
        // order
        .valid('order', 'isRequired')
        .valid('order', 'isNumeric')
        // type
        .valid('type', 'isRequired')

    return validate.get()
}

/**
 * template update(post)
 */
module.exports.update = (req, res, next) => {

    // body
    const body = req.body

    // then update id is requred
    const id = body.id != null ? body.id : null

    // if id undefined return err
    if (!id) {
        errorMessageJson(res, null, 'id is undefined!')
    }

    // get unique from body
    const unique = body.unique ? body.unique : ''

    // get unique from store
    admin.firestore().collection('templates')
        .where('unique', '==', unique)
        .limit(1)
        .get()
        .then(docs => {

            // check unique is unique
            const uniqueFlag = docs.size === 0 ? true : false

            // get validation result
            const validationResult = validationUpdate(body, uniqueFlag)

            // validation invalid
            if (!validationResult.check) {
                // send invalid messages json
                invalidMessageJson(res, validationResult)
            } else {
                const allowaKeys = [
                    'name',
                    'unique',
                    'order',
                    'type',
                    'content'
                ]
                const intKeys = ['order']
                const params = filterDody(body, allowaKeys, intKeys)

                if (Object.keys(params).length === 0) {
                    errorMessageJson(res, null, 'There are no items that can be updated.')
                }

                admin.firestore().collection('templates')
                    .doc(id)
                    .update(params)
                    .then(_ => {
                        // send seccess message
                        successMessageJson(res, '{{key}} is updated.', body)
                    })
                    .catch(err => errorMessageJson(res, err, null, __filename, __line))
            }
        })
        .catch(err => errorMessageJson(res, err, null, __filename, __line))
}

/* validation update thing */
function validationUpdate(body, uniqueFlag) {

    /* set orderbalidation */
    const validate = validation.list(body)
    // name
    if (body.hasOwnProperty('name')) {
        validate.valid('name', 'isRequired')
    }
    // unique
    if (body.hasOwnProperty('unique')) {
        validate
            .valid('unique', 'isRequired')
            .valid('unique', 'isAlnumunder')
            .valid('unique', 'isUnique', uniqueFlag)
    }
    // order
    if (body.hasOwnProperty('order')) {
        validate
            .valid('order', 'isRequired')
            .valid('order', 'isNumeric')
    }
    // type
    if (body.hasOwnProperty('type')) {
        validate.valid('type', 'isRequired')
    }

    return validate.get()
}

/**
 * template delete (post)
 */
module.exports.delete = (req, res, next) => {

    const id = req.body.id != null ? req.body.id : null

    if (!id) {
        // if id undefined return err
        errorMessageJson(res, null, 'id is undefined!')
    } else {
        // get template by id
        admin.firestore().collection('templates')
            .doc(id)
            .get()
            .then(doc => {
                // check template exist
                if (doc.exists) {
                    // delete template
                    doc.ref.delete()
                        .then(_ => {
                            // send success message
                            successMessageJson(res, 'Successfully deleted template.', null, {
                                mode: 'delete',
                                id: id
                            })
                        })
                        .catch(err => errorMessageJson(res, err, null, __filename, __line))
                } else {
                    // not exist template
                    errorMessageJson(res, null, req.__('id is undefined!'))
                }
            })
            .catch(err => errorMessageJson(res, err, null, __filename, __line))
    }
}
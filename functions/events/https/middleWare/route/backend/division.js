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
 * division index (division)
 */
module.exports.index = (req, res, next) => {

    return admin.firestore().collection('divisions')
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
            next(err)
        })
}

/**
 * division add
 */

/**
 * division edit
 */
module.exports.edit = (req, res, next) => {

    // get unique
    const segments = req.vessel.get('paths.segments')
    const target = segments.shift()

    if (!target) {
        res.throwNotFound('not found!')
    }

    return admin.firestore().collection('divisions')
        .doc(target)
        .get()
        .then(doc => {
            // user is not found
            if (!doc.exists) {
                res.throwNotFound('not found!')
            } else {
                let data = doc.data()
                req.vessel.thing.target = data
                next()
            }
        })
        .catch(err => {
            next(err)
        })
}

/**
 * division create (post)
 */
module.exports.create = (req, res, next) => {

    // body
    const body = req.body
    let id = null

    // get unique from body
    const unique = body.unique ? body.unique : ''

    // get unique from store
    admin.firestore().collection('divisions')
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
                'description'
            ]
            const intKeys = ['order']
            const params = filterDody(body, allowaKeys, intKeys)

            // add id
            const divisionDoc = admin.firestore().collection('divisions').doc()
            id = divisionDoc.id
            params.id = id

            return divisionDoc.set(params)
                .then(_ => {
                    // send success messages json
                    return successMessageJson(res, 'Successfully created new division.', 'create', {
                        id
                    })
                })
        })
        .catch(err => errorMessageJson(res, err, null, __filename, __line))
}

/* validation create division */
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

    return validate.get()
}

/**
 * division update (post)
 */
module.exports.update = (req, res, next) => {

    // body
    const body = req.body

    // then update id is requred
    const id = body.id != null ? body.id : null

    // if id undefined return err
    if (!id) {
        return errorMessageJson(res, null, 'id is undefined!')
    }

    // get unique from body
    const unique = body.unique ? body.unique : ''

    // get unique from store
    admin.firestore().collection('divisions')
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
                return invalidMessageJson(res, validationResult)
            }

            const allowaKeys = [
                'name',
                'unique',
                'order',
                'description'
            ]
            const intKeys = ['order']
            const params = filterDody(body, allowaKeys, intKeys)

            if (Object.keys(params).length === 0) {
                return errorMessageJson(res, null, 'There are no items that can be updated.')
            }

            return admin.firestore().collection('divisions')
                .doc(id)
                .update(params)
                .then(_ => {
                    // send seccess message
                    return successMessageJson(res, '{{key}} is updated.', 'update', body)
                })
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
    return validate.get()
}

/**
 * division delete (post)
 */
module.exports.delete = (req, res, next) => {

    const id = req.body.id != null ? req.body.id : null

    if (!id) {
        // if id undefined return err
        return errorMessageJson(res, null, 'id is undefined!')
    }

    // get division by id
    admin.firestore().collection('divisions')
        .doc(id)
        .get()
        .then(doc => {

            // division is not exist
            if (!doc.exists) {
                return errorMessageJson(res, null, req.__('id is undefined!'))
            }

            // delete division
            return doc.ref.delete()
                .then(_ => {
                    // send success message
                    return successMessageJson(res, 'Successfully deleted division.', 'delete', {
                        id
                    })
                })
        })
        .catch(err => errorMessageJson(res, err, null, __filename, __line))
}
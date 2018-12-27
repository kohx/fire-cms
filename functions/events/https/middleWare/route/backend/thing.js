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

/* build success json messages */
const successMessageJson = util.successMessageJson

/* filter body */
const filterDody = util.filterDody

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
                data.issue = data.issue.toDate().toISOString()
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
                let data = null
                docs.forEach(doc => {
                    data = doc.data()
                })
                data.issue = data.issue.toDate().toLocaleString()
                req.vessel.thing.target = data
                next()
            }
        })
        .catch(err => {
            debug(err, __filename, __line)
            next(err)
        })
}

/**
 * thing create(post)
 */
module.exports.create = (req, res, next) => {

    // body
    const body = req.body

    // default set
    if (body.issue == null || body.issue == '') {
        body.issue = new Date()
    }

    if (body.parents != null) {
        if (body.parents === '') {
            body.parents = []
        } else {
            body.parents = typeof body.parents === 'string' ? [body.parents] : body.parents
        }
    }

    if (body.keywords != null) {
        if (body.keywords === '') {
            body.keywords = []
        } else {
            body.keywords = typeof body.keywords === 'string' ? [body.keywords] : body.keywords
        }
    }

    const roles = req.vessel.get('settings.general.roles')
    const fullRoles = {}
    roles.forEach(role => {
        fullRoles[role] = body.roles.includes(role)
    })
    body.roles = fullRoles

    // id
    let id = null

    // get unique from body
    const unique = body.unique ? body.unique : ''

    // get unique from store
    admin.firestore().collection('things').where('unique', '==', unique).limit(1).get()
        .then(docs => {

            // check unique is unique
            const uniqueFlag = docs.size === 0 ? true : false

            // get validation result
            const validationResult = validationCreate(body, uniqueFlag)

            // validation invalid
            if (!validationResult.check) {
                // send invalid messages json
                invalidMessageJson(res, validationResult)
            } else {

                const allowaKeys = [
                    'name',
                    'unique',
                    'order',
                    'parents',
                    'roles',
                    'issue',
                    'description',
                    'summary',
                    'keywords',
                    'content',
                ]
                const intKeys = ['order']
                const params = filterDody(body, allowaKeys, intKeys)

                // add id
                const thingDoc = admin.firestore().collection('things').doc()
                id = thingDoc.id
                params.id = id

                thingDoc.set(params)
                    .then(_ => {
                        // send success messages json
                        successMessageJson(res, 'Successfully created new thing.', 'create', {}, params.unique)
                    })
                    .catch(err => errorMessageJson(res, err, null, __filename, __line))
            }
        })
        .catch(err => errorMessageJson(res, err, null, __filename, __line))
}

/* validation create thing */
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
        // parents
        .valid('parents', 'isArray')
        .valid('parents', 'isAllString')
        // issue
        .valid('issue', 'isDate')
        // description
        // summary
        // keywords
        .valid('keywords', 'isArray')
        .valid('keywords', 'isAllString')
        // roles 
        .valid('roles', 'isMap')
        .valid('roles', 'isAllBool')

    return validate.get()
}

/**
 * thing update(post)
 */
module.exports.update = (req, res, next) => {

    // body
    const body = req.body

    // to full rolles
    const roles = req.vessel.get('settings.general.roles')
    const fullRoles = {}
    roles.forEach(role => {
        fullRoles[role] = body.roles.includes(role)
    })
    body.roles = fullRoles

    // then update id is requred
    const id = body.id != null ? body.id : null

    // if id undefined return err
    if (!id) {
        errorMessageJson(res, null, req.__('id is undefined!'))
    }

    // get unique from body
    const unique = body.unique ? body.unique : ''

    // get unique from store
    admin.firestore().collection('things').where('unique', '==', unique).limit(1).get()
        .then(docs => {
            const uniqueFlag = docs.size === 0 ? true : false

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
                    'parents',
                    'roles',
                    'issue',
                    'description',
                    'summary',
                    'keywords',
                    'content',
                ]
                const intKeys = ['order']
                const params = filterDody(body, allowaKeys, intKeys)

                admin.firestore().collection('things').doc(id)
                    .update(params)
                    .then(_ => {
                        successMessageJson(res, '{{key}} is updated.', 'update', body)
                    })
                    .catch(err => errorMessageJson(res, err, null, __filename, __line))
            }
        })
        .catch(err => errorMessageJson(res, err, null, __filename, __line))
}

/* validation create thing */
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
    // parents
    if (body.hasOwnProperty('parents')) {
        validate
            .valid('parents', 'isArray')
            .valid('parents', 'isAllString')
    }
    // issue
    if (body.hasOwnProperty('issue')) {
        validate.valid('issue', 'isDate')
    }
    // description
    // summary
    // keywords
    if (body.hasOwnProperty('keywords')) {
        validate
            .valid('keywords', 'isArray')
            .valid('keywords', 'isAllString')
    }
    // roles 
    if (body.hasOwnProperty('roles')) {
        validate
            .valid('roles', 'isMap')
            .valid('roles', 'isAllBool')
    }

    return validate.get()
}

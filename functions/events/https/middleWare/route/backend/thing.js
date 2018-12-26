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

    debug(body, __filename, __line)

    /* set orderbalidation */
    const validate = validation.list(body)

    validate.valid('name', 'isRequired')

    validate.valid('unique', 'isRequired')
    validate.valid('unique', 'isAlnumunder')
    validate.valid('unique', 'isUnique', uniqueFlag)

    validate.valid('order', 'isRequired')
    validate.valid('order', 'isNumeric')

    validate.valid('parents', 'isArray')
    validate.valid('parents', 'isAllString')

    validate.valid('issue', 'isDate')

    // description
    // summary
    // keywords

    validate.valid('keywords', 'isArray')
    validate.valid('keywords', 'isAllString')

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
            const uniqueFlag = docs.size === 0 ? true : false

            const validationResult = validationBody(body, uniqueFlag)

            // validation invalid
            if (!validationResult.check) {
                // send invalid messages json
                invalidMessageJson(res, req, validationResult)
            } else {
                const params = {}
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

                Object.keys(body).forEach(key => {
                    if (allowaKeys.includes(key)) {
                        let value = body[key]
                        if (intKeys.includes(key)) {
                            value = Number(value)
                        }
                        params[key] = value
                    }
                })

                // add id
                const thingDoc = admin.firestore().collection('things').doc()
                id = thingDoc.id
                params.id = id

                thingDoc.set(params)
                    .then(_ => {
                        res.json({
                            code: 'success',
                            mode: 'create',
                            messages: [{
                                key: null,
                                content: req.__(`Successfully created new thing.`),
                            }],
                            values: {
                                unique: params.unique
                            },
                        })
                    })
                    .catch(err => errorMessageJson(res, err, null, __filename, __line))
            }
        })
        .catch(err => errorMessageJson(res, err, null, __filename, __line))
}

/**
 * thing update(post)
 */
module.exports.update = (req, res, next) => {

    // body
    const body = req.body

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

            const validationResult = validationBody(body, uniqueFlag)

            // validation invalid
            if (!validationResult.check) {
                // send invalid messages json
                invalidMessageJson(res, req, validationResult)
            } else {
                const params = {}
                const allowaKeys = ['name', 'unique', 'order', 'type', 'content']
                const intKeys = ['order']

                Object.keys(body).forEach(key => {
                    if (allowaKeys.includes(key)) {
                        let value = body[key]
                        if (intKeys.includes(key)) {
                            value = Number(value)
                        }
                        params[key] = value
                    }
                })

                admin.firestore().collection('things').doc(id)
                    .update(params)
                    .then(_ => {
                        let messages = []
                        let values = {}

                        Object.keys(body).forEach(key => {
                            // {path: xxx.xxx, message: 'asdf asdf asdf.'}
                            // change to 
                            // {key: xxx.xxx, content: 'asdf asdf asdf.'}
                            if (key !== 'id') {
                                messages.push({
                                    key,
                                    content: req.__(`{{key}} is updated.`, {
                                        key
                                    })
                                })
                                values[key] = body[key]
                            }
                        })
                        res.json({
                            code: 'success',
                            mode: 'update',
                            messages,
                            values,
                        })
                    })
                    .catch(err => errorMessageJson(res, err, null, __filename, __line))
            }
        })
        .catch(err => errorMessageJson(res, err, null, __filename, __line))
}

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

/* validation template */
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

    if (body.type != null) {
        validate.valid('type', 'isRequired')
    }

    return validate.get()
}

/**
 * template index (templates)
 */
module.exports.index = (req, res, next) => {
    return admin.firestore().collection('templates').orderBy('order', "asc").get()
        .then(docs => {
            const targets = {}
            docs.forEach(doc => {
                targets[doc.id] = doc.data()
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

    return admin.firestore().collection('templates')
        .where('unique', '==', target)
        .limit(1)
        .get()
        .then(docs => {
            // template is not found
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
    admin.firestore().collection('templates').where('unique', '==', unique).limit(1).get()
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

                // add id
                const templateDoc = admin.firestore().collection('templates').doc()
                id = templateDoc.id
                params.id = id

                templateDoc.set(params)
                    .then(_ => {
                        res.json({
                            code: 'success',
                            mode: 'create',
                            messages: [{
                                key: null,
                                content: req.__(`Successfully created new template.`),
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
 * template update(post)
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
    admin.firestore().collection('templates').where('unique', '==', unique).limit(1).get()
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

                admin.firestore().collection('templates').doc(id)
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

/**
 * template delete (post)
 */
module.exports.delete = (req, res, next) => {

    const id = req.body.id != null ? req.body.id : null

    if (!id) {
        // if id undefined return err
        res.json({
            code: 'error',
            messages: [{
                key: null,
                content: req.__('id is undefined!'),
            }],
        })
    } else {
        // get template by id
        admin.firestore().collection('templates').doc(id).get()
            .then(doc => {
                // check template exist
                if (doc.exists) {
                    // delete template
                    doc.ref.delete()
                        .then(_ => {
                            res.json({
                                code: 'success',
                                mode: 'delete',
                                messages: [{
                                    key: null,
                                    content: req.__(`Successfully deleted template.`),
                                }],
                                values: {
                                    unique: id
                                }
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
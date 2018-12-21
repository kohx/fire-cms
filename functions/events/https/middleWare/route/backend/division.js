const parent = require('../../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const validation = require('../../../../../modules/validation')
const debug = require('../../../../../modules/debug').debug

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
        validate.valid('email', 'isUnique', uniqueFlag)
    }

    if (body.order != null) {
        validate.valid('order', 'isRequired')
        validate.valid('order', 'isNumeric')
    }

    return validate.get()
}

/**
 * division index (division)
 */
module.exports.index = (req, res, next) => {

    admin.firestore().collection('divisions').get()
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

/**
 * division edit
 */
module.exports.edit = (req, res, next) => {
    const segments = req.vessel.get('paths.segments')
    const target = segments.shift()

    admin.firestore().collection('divisions')
        .where('unique', '==', target)
        .limit(1)
        .get()
        .then(docs => {
            let docData = null
            docs.forEach(doc => {
                docData = doc.data()
            })
            debug(docData, __filename, __line)
            req.vessel.thing.target = docData
            next()
        })
        .catch(err => {
            debug(err, __filename, __line)
            next(err)
        })
}

/**
 * division create (post)
 */
module.exports.create = (req, res, next) => {

    debug(req.vessel, __filename, __line); process.exit()

    // body
    const body = req.body
    let id = null

    // get unique from body
    const unique = body.unique ? body.unique : ''

    // get unique from store
    admin.firestore().collection('divisions').where('unique', '==', '').limit(1).get()
        .then(docs => {
            const uniqueFlag = docs.size === 0 ? treu : false

            const validationResult = validationBody(body, uniqueFlag)

            // validation invalid
            if (!validationResult.check) {
                // send invalid messages json
                invalidMessageJson(res, req, validationResult)
            } else {
                
            }
        })
        .catch(err => debug(err, __filename, __line))

    //         // validation invalid
    //         if (!validationResult.check) {
    //             // send invalid messages json
    //             invalidMessageJson(res, req, validationResult)
    //         } else {
    //             const params = {}
    //             const allowaKeys = ['name', 'email', 'password', 'role', 'order', 'description']
    //             const intKeys = ['order']

    //             Object.keys(body).forEach(key => {

    //                 if (allowaKeys.includes(key)) {
    //                     let value = body[key]
    //                     if (intKeys.includes(key)) {
    //                         value = Number(value)
    //                     }
    //                     params[key] = value
    //                 }
    //             })

    //             // add id
    //             const divisionDoc = admin.firestore().collection('divisions').doc()
    //             id = divisionDoc.id
    //             params.id = id

    //             divisionDoc.set(params)
    //                 .then(_ => {
    //                     res.json({
    //                         code: 'success',
    //                         mode: 'create',
    //                         messages: [{
    //                             key: null,
    //                             content: req.__(`Successfully created new division.`),
    //                         }],
    //                         values: {
    //                             unique: id
    //                         },
    //                     })
    //                 })
    //                 .catch(err => errorMessageJson(res, err, null, __filename, __line))
    //         }
    //     })
    //     .catch(err => errorMessageJson(res, err, null, __filename, __line))
}
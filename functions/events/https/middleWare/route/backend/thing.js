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

// TODO: どこで呼び出すか？
const bucketName = admin.storage().bucket().name

/**
 * thing index (things)
 */
module.exports.index = (req, res, next) => {
    return admin.firestore().collection('things')
        .orderBy('order', 'asc')
        .get()
        .then(docs => {
            const targets = {}
            docs.forEach(doc => {
                let data = doc.data()
                // date value to string
                data.issue = data.issue.toDate().toISOString()
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

    if (!target) {
        res.throwNotFound('not found!')
    }

    return admin.firestore().collection('things')
        .doc(target)
        .get()
        .then(doc => {

            // user is not found
            if (!doc.exists) {
                res.throwNotFound('not found!')
            }

            let data = doc.data()
            const assetRefs = data.assets != null ? data.assets : {}

            if (Object.keys(assetRefs) !== 0) {
                let assetGets = []
                Object.keys(assetRefs).forEach(key => {
                    assetGet = assetRefs[key].get()
                        .then(doc => {
                            const asset = doc.data()
                            asset.key = key
                            return asset
                        })
                        .then(asset => {
                            if (asset.type != null && asset.type === 'image') {
                                // TODO:　呼び出し方法を考える
                                asset.content = `https://storage.cloud.google.com/${bucketName}/${encodeURIComponent(asset.content)}`
                            }
                            return asset
                        })
                    assetGets.push(assetGet)
                })

                return Promise.all(assetGets)
                    .then(assets => {
                        data.assets = assets
                        return data
                    })

            } else {
                return data
            }
        })
        .then(data => {

            debug(data, __filename, __line)

            // テンプレート側で変換？
            data.issue = data.issue.toDate().toLocaleString()

            // リファレンスで持つ？
            const templateTypes = req.vessel.get('settings.general.template_types')
            req.vessel.thing.templateTypes = templateTypes
            req.vessel.thing.target = data
            next()
        })
        .catch(err => {
            next(err)
        })
}

/**
 * thing assets
 */
module.exports.assets = (req, res, next) => {

    // get unique
    const segments = req.vessel.get('paths.segments')
    const target = segments.shift()
    /*  */
    if (!target) {
        res.throwNotFound('not found!')
    }

    return admin.firestore().collection('things')
        .doc(target)
        .collection(`assets`)
        .get()
        .then(docs => {
            docs.forEach(doc => {
                let data = doc.data()

                debug(data, __filename, __line)
            })
        })
        .catch(err => {
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
    admin.firestore().collection('things')
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

            return thingDoc.set(params)
                .then(_ => {
                    // send success messages json
                    return successMessageJson(res, 'Successfully created new thing.', 'create', {
                        id
                    })
                })
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
        .valid('unique', 'isUrlcharacter')
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
    if (body.hasOwnProperty('roles')) {
        const roles = req.vessel.get('settings.general.roles')
        const fullRoles = {}
        roles.forEach(role => {
            fullRoles[role] = body.roles.includes(role)
        })
        body.roles = fullRoles
    }

    // then update id is requred
    const id = body.id != null ? body.id : null

    // if id undefined return err
    if (!id) {
        errorMessageJson(res, null, 'id is undefined!')
    }

    // get unique from body
    const unique = body.unique ? body.unique : ''

    // get unique from store
    admin.firestore().collection('things')
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

            if (Object.keys(params).length === 0) {
                return errorMessageJson(res, null, 'There are no items that can be updated.')
            }

            return admin.firestore().collection('things')
                .doc(id)
                .update(params)
                .then(_ => {
                    // send seccess message
                    return successMessageJson(res, 'is updated.', 'update', body)
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
            .valid('unique', 'isUrlcharacter')
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

/**
 * thing delete (post)
 */
module.exports.delete = (req, res, next) => {

    const id = req.body.id != null ? req.body.id : null

    if (!id) {
        // if id undefined return err
        return errorMessageJson(res, null, 'id is undefined!')
    }

    // get thing by id
    admin.firestore().collection('things')
        .doc(id)
        .get()
        .then(doc => {
            // thing is not exist
            if (!doc.exists) {
                // not exist thing
                return errorMessageJson(res, null, 'id is undefined!')
            }

            // delete thing
            return doc.ref.delete()
                .then(_ => {
                    // send success message
                    return successMessageJson(res, 'Successfully deleted template.', 'delete', {
                        id
                    })
                })
        })
        .catch(err => errorMessageJson(res, err, null, __filename, __line))
}
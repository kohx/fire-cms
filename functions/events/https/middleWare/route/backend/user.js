const parent = require('../../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const url = require('url')

const validation = require('../../../../../modules/validation')
const debug = require('../../../../../modules/debug').debug

// TODO:: カスタムのメール アクション ハンドラの作成
// https://firebase.google.com/docs/auth/custom-email-handler?hl=ja

/* check unique at user */
const checkUnique = (key, value, uid = null) => {
    return new Promise((resolve, reject) => {
        admin.firestore().collection('users')
            .where(key, '==', value).get()
            .then(users => {
                let flag = true
                users.forEach(user => {
                    const userData = user.data()
                    if (uid != null) {
                        if (userData.uid !== uid) {
                            flag = false
                        }
                    } else {
                        flag = false
                    }
                })
                resolve(flag)
            })
            .catch(err => reject(err))
    })
}

/* validation user */
const validationBody = (body, nameUniqueFlag, emailUniqueFlag) => {

    /* set orderbalidation */
    const validate = validation.list(body)

    if (body.name != null) {
        // ユーザー名には、[a-z]、[0-9]、-、_、'、.を使用できます。
        // ユーザー名には、&、=、<、>、+、,を使用できません。
        // また、連続した複数のピリオド（.）を含めることはできません。
        validate.valid('name', 'isRequired')
        validate.valid('name', 'isAlnumunspace')
        validate.valid('name', 'isUnique', nameUniqueFlag)
    }

    if (body.email != null) {
        validate.valid('email', 'isRequired')
        validate.valid('email', 'isEmail')
        validate.valid('email', 'isUnique', emailUniqueFlag)
    }

    if (body.password != null) {
        // パスワードには任意の組み合わせの印刷可能な ASCII 文字を使用できます。
        // また、8 文字以上にする必要があります。
        validate.valid('password', 'isRequired')
        validate.valid('password', 'isLength', 8, 20)
        validate.valid('password', 'containsSymbol')
        validate.valid('password', 'containsUppercase')
        validate.valid('password', 'containsNumric')
        validate.valid('password', 'canNotUsedBlank')

        validate.valid('confirm', 'isRequired')
        validate.valid('confirm', 'isConfirm', 'password')
    }

    if (body.description != null) {
        validate.valid('description', 'isLength', 0, 200)
    }

    if (body.role != null) {
        validate.valid('role', 'isRequired')
    }

    return validate.get()
}

/**
 * user index (users)
 */
module.exports.index = (req, res, next) => {

    admin.firestore().collection('users').orderBy('order', "asc").get()
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
 * user add
 */

/**
 * user edit
 */
module.exports.edit = (req, res, next) => {
    const segments = req.vessel.get('paths.segments')
    const target = segments.shift()

    admin.firestore().collection('users').doc(target).get()
        .then(doc => {
            req.vessel.thing.target = doc.data()
            next()
        })
        .catch(err => {
            debug(err, __filename, __line)
            next(err)
        })
}

/**
 * user create (post)
 */
module.exports.create = (req, res, next) => {

    // body
    const body = req.body
    let uid = null

    // promise all function 
    let funs = [checkUnique('name', body.name), checkUnique('email', body.email)]

    Promise.all(funs)
        .then(results => {

            const nameUniqueFlag = results[0] != null ? results[0] : null
            const emailUniqueFlag = results[1] != null ? results[1] : null

            /* validation */
            const validationResult = validationBody(body, nameUniqueFlag, emailUniqueFlag)

            // validation invalid
            if (!validationResult.check) {

                // translate validation message and rebuild messages
                let messages = []
                Object.keys(validationResult.errors).forEach(key => {
                    validationResult.errors[key].forEach(error => {
                        // {path: xxx.xxx, message: 'asdf asdf asdf.'}
                        // change to 
                        // {key: xxx.xxx, content: 'asdf asdf asdf.'}
                        messages.push({
                            key: error.path,
                            content: req.__(error.message, error.params)
                        })
                    })
                })

                // return invalid
                res.json({
                    code: validationResult.status,
                    messages,
                })
            } else {
                const params = {}
                const allowaKeys = ['name', 'email', 'role', 'description', 'order', 'check']

                Object.keys(body).forEach(key => {

                    if (allowaKeys.includes(key)) {
                        params[key] = body[key]
                    }
                })

                // add uid
                const userDoc = admin.firestore().collection('users').doc()
                uid = userDoc.id
                params.uid = uid
                return userDoc.set(params)
                    .then(_ => {
                        res.json({
                            code: 'success',
                            messages: [{
                                key: null,
                                content: req.__(`Successfully created new user.`),
                            }],
                            values: {
                                unique: uid
                            },
                        })
                    })
                    .catch(err => {
                        debug(err, __filename, __line)
                        res.json({
                            code: 'error',
                            messages: [{
                                key: null,
                                content: err.message,
                            }]
                        })
                    })
            }
        })
        .catch(err => {
            debug(err, __filename, __line)
            res.json({
                code: 'error',
                messages: [{
                    key: null,
                    content: err.message,
                }]
            })
        })
}

/**
 * user update (post)
 */
module.exports.update = (req, res, next) => {

    // body
    const body = req.body

    // then update uid is requred
    const uid = body.uid != null ? body.uid : null

    // args
    const name = body.name != null ? body.name : null
    const email = body.email != null ? body.email : null

    // if uid undefined return err
    if (!uid) {
        res.json({
            code: 'error',
            messages: [{
                key: null,
                content: req.__('uid is undefined!'),
            }],
        })
    }

    // promise all function 
    let funs = []

    // get name for unique check
    if (name != null) {
        funs.push(checkUnique('name', name, uid))
    }

    // get emai for unique check
    if (email != null) {
        funs.push(checkUnique('email', email, uid))
    }

    Promise.all(funs)
        .then(results => {
            const nameUniqueFlag = results[0] != null ? results[0] : null
            const emailUniqueFlag = results[1] != null ? results[1] : null

            // validation 
            const validationResult = validationBody(body, nameUniqueFlag, emailUniqueFlag)

            // validation invalid
            if (!validationResult.check) {

                // translate validation message and rebuild messages
                let messages = []
                Object.keys(validationResult.errors).forEach(key => {
                    validationResult.errors[key].forEach(error => {
                        // {path: xxx.xxx, message: 'asdf asdf asdf.'}
                        // change to 
                        // {key: xxx.xxx, content: 'asdf asdf asdf.'}
                        messages.push({
                            key: error.path,
                            content: req.__(error.message, error.params)
                        })
                    })
                })

                // return invalid
                res.json({
                    code: validationResult.status,
                    messages,
                })
            } else {

                const params = {}
                const allowaKeys = ['name', 'email', 'password', 'role', 'order', 'description']
                Object.keys(body).forEach(key => {
                    if (allowaKeys.includes(key)) {
                        params[key] = body[key]
                    }
                })

                return admin.firestore().collection('users').doc(uid)
                    .update(params)
                    .then(_ => {
                        let messages = []
                        let values = {}
                        Object.keys(body).forEach(key => {
                            // {path: xxx.xxx, message: 'asdf asdf asdf.'}
                            // change to 
                            // {key: xxx.xxx, content: 'asdf asdf asdf.'}
                            if (key !== 'uid') {
                                messages.push({
                                    key,
                                    content: req.__(`{{key}} is updated.`, {key})
                                })
                                values[key] = body[key]
                            }
                        })
                        res.json({
                            code: 'success',
                            messages,
                            values,
                        })
                    })
                    .catch(err => {
                        debug(err, __filename, __line);
                        res.json({
                            code: 'error',
                            messages: [{
                                key: null,
                                content: err.message,
                            }]
                        })
                    })
            }
        })
        .catch(err => {
            debug(err, __filename, __line);
            res.json({
                code: 'error',
                messages: [{
                    key: null,
                    content: err.message,
                }]
            })
        })
}

/**
 * user delete (post)
 */
module.exports.delete = (req, res, next) => {

    const uid = req.body.uid != null ? req.body.uid : null

    // if uid undefined return err
    if (!uid) {
        res.json({
            code: 'error',
            messages: [{
                key: null,
                content: req.__('uid is undefined!'),
            }],
        })
    }

    admin.firestore().collection('users').doc(uid).get()
        .then(doc => {
            debug(doc, __filename, __line)
            if (doc.exists) {
                return doc.ref.delete()
            } else {
                res.json({
                    code: 'error',
                    messages: [{
                        key: null,
                        content: req.__('uid is undefined!'),
                    }],
                })
            }
        })
        .then(user => {
            debug(user, __filename, __line)
            res.json({
                code: 'success',
                messages: [{
                    key: null,
                    content: req.__(`Successfully deleted user.`),
                    values: {
                        uid
                    }
                }]
            })
        })
        .catch(err => {
            debug(err, __filename, __line)
            res.json({
                code: 'error',
                messages: [{
                    key: null,
                    content: err.message,
                }]
            })
        });
}
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
const signoutMessageJson = util.signoutMessageJson

/* filter body */
const filterDody = util.filterDody

// TODO:: カスタムのメール アクション ハンドラの作成
// https://firebase.google.com/docs/auth/custom-email-handler?hl=ja

/* check unique at user */
// TODO:: メソッド化しない？
const checkUnique = (key, value, id = null) => {
    if (value === null) {
        Promise.resolve(true)
    }
    return new Promise((resolve, reject) => {
        admin.firestore().collection('users')
            .where(key, '==', value).get()
            .then(users => {
                let flag = true
                users.forEach(user => {
                    const userData = user.data()
                    if (id != null) {
                        if (userData.id !== id) {
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

/**
 * user index (users)
 */
module.exports.index = (req, res, next) => {

    return admin.firestore().collection('users')
        .orderBy('order', "asc")
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
 * user add
 */

/**
 * user edit
 */
module.exports.edit = (req, res, next) => {
    const segments = req.vessel.get('paths.segments')
    const target = segments.shift()

    if (!target) {
        res.notFound('not found!')
    }

    return admin.firestore().collection('users')
        .doc(target)
        .get()
        .then(doc => {
            // user is not found
            if (!doc.exists) {
                res.notFound('not found!')
            } else {
                let data = doc.data()
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
 * user create (post)
 */
module.exports.create = (req, res, next) => {

    // body
    const body = req.body
    let id = null

    // promise all function 
    let funs = [checkUnique('name', body.name), checkUnique('email', body.email)]

    Promise.all(funs)
        .then(results => {

            const nameUniqueFlag = results[0] != null ? results[0] : null
            const emailUniqueFlag = results[1] != null ? results[1] : null

            /* validation */
            const validationResult = validationCreate(body, nameUniqueFlag, emailUniqueFlag)

            // validation invalid
            if (!validationResult.check) {
                // send invalid messages json
                return invalidMessageJson(res, validationResult)
            }

            const allowaKeys = [
                'name',
                'email',
                'password',
                'role',
                'order',
                'description'
            ]
            const intKeys = ['order']
            const params = filterDody(body, allowaKeys, intKeys)

            // add id
            const userDoc = admin.firestore().collection('users').doc()
            id = userDoc.id
            params.id = id

            userDoc.set(params)
                .then(_ => {
                    // send success messages json
                    successMessageJson(res, 'Successfully created new user.', null, {
                        mode: 'create',
                        id: id
                    })
                })
                .catch(err => errorMessageJson(res, err, null, __filename, __line))
        })
        .catch(err => errorMessageJson(res, err, null, __filename, __line))
}

/* validation create user */
function validationCreate(body, nameUniqueFlag, emailUniqueFlag) {

    /* set orderbalidation */
    const validate = validation.list(body)
        // ユーザー名には、[a-z]、[0-9]、-、_、'、.を使用できます。
        // ユーザー名には、&、=、<、>、+、,を使用できません。
        // また、連続した複数のピリオド（.）を含めることはできません。
        // name
        .valid('name', 'isRequired')
        .valid('name', 'isAlnumunspace')
        .valid('name', 'isUnique', nameUniqueFlag)
        // email
        .valid('email', 'isRequired')
        .valid('email', 'isEmail')
        .valid('email', 'isUnique', emailUniqueFlag)
        // パスワードには任意の組み合わせの印刷可能な ASCII 文字を使用できます。
        // また、8 文字以上にする必要があります。
        // password
        .valid('password', 'isRequired')
        .valid('password', 'isLength', 8, 20)
        .valid('password', 'containsSymbol')
        .valid('password', 'containsUppercase')
        .valid('password', 'containsNumric')
        .valid('password', 'canNotUsedBlank')
        // // confirm
        // .valid('confirm', 'isRequired')
        // .valid('confirm', 'isConfirm', 'password')
        // description
        .valid('description', 'isLength', 0, 200)
        // role
        .valid('role', 'isRequired')
        // order
        .valid('order', 'isNumeric')
        .valid('order', 'isRequired')

    return validate.get()
}

/**
 * user update (post)
 */
module.exports.update = (req, res, next) => {

    // body
    const body = req.body

    // update requires id
    const id = body.id != null ? body.id : null

    // if id undefined return err
    if (!id) {
        return errorMessageJson(res, null, 'id is undefined!')
    }

    // promise all function 
    const name = body.name != null ? body.name : null
    const email = body.email != null ? body.email : null
    let funs = [checkUnique('name', name, id), checkUnique('email', email, id)]

    Promise.all(funs)
        .then(results => {
            const nameUniqueFlag = results[0] != null ? results[0] : null
            const emailUniqueFlag = results[1] != null ? results[1] : null

            // validation 
            const validationResult = validationUpdate(body, nameUniqueFlag, emailUniqueFlag)

            // validation invalid
            if (!validationResult.check) {
                // send invalid messages json
                return invalidMessageJson(res, validationResult)
            }

            const allowaKeys = [
                'name',
                'email',
                'password',
                'role',
                'order',
                'description'
            ]
            const intKeys = ['order']
            const params = filterDody(body, allowaKeys, intKeys)

            // there is not allow params
            if (Object.keys(params).length === 0) {
                errorMessageJson(res, null, 'There are no items that can be updated.')
            }

            admin.firestore().collection('users')
                .doc(id)
                .update(params)
                .then(_ => {
                    // if self user and change password or email then signout
                    if (req.vessel.get('user.id') === id && Object.keys(body).includes('email', 'password')) {
                        // signout
                        signoutMessageJson(req, res, 'Successfully update user.', {
                            mode: 'signout',
                            id: id
                        })
                    } else {
                        // send seccess message
                        successMessageJson(res, '{{key}} is updated.', body)
                    }
                })
                .catch(err => errorMessageJson(res, err, null, __filename, __line))
        })
        .catch(err => errorMessageJson(res, err, null, __filename, __line))
}

/* validation update user */
function validationUpdate(body, nameUniqueFlag, emailUniqueFlag) {

    // // passwordがある場合はconfirmも強制的に送る
    // if(body.hasOwnProperty('password') && !body.hasOwnProperty('confirm')){
    //     body.confirm = ''
    // }

    /* set orderbalidation */
    const validate = validation.list(body)

    // ユーザー名には、[a-z]、[0-9]、-、_、'、.を使用できます。
    // ユーザー名には、&、=、<、>、+、,を使用できません。
    // また、連続した複数のピリオド（.）を含めることはできません。
    // name
    if (body.hasOwnProperty('name')) {
        validate
            .valid('name', 'isRequired')
            .valid('name', 'isAlnumunspace')
            .valid('name', 'isUnique', nameUniqueFlag)
    }
    // email
    if (body.hasOwnProperty('email')) {
        validate
            .valid('email', 'isRequired')
            .valid('email', 'isEmail')
            .valid('email', 'isUnique', emailUniqueFlag)
    }
    // パスワードには任意の組み合わせの印刷可能な ASCII 文字を使用できます。
    // また、8 文字以上にする必要があります。
    // password
    if (body.hasOwnProperty('password')) {
        validate
            .valid('password', 'isRequired')
            .valid('password', 'isLength', 8, 20)
            .valid('password', 'containsSymbol')
            .valid('password', 'containsUppercase')
            .valid('password', 'containsNumric')
            .valid('password', 'canNotUsedBlank')
    }
    // // confirm
    // if (body.hasOwnProperty('confirm')) {
    //     validate
    //         .valid('confirm', 'isRequired')
    //         .valid('confirm', 'isConfirm', 'password')
    // }
    // description
    if (body.hasOwnProperty('description')) {
        validate.valid('description', 'isLength', 0, 200)
    }
    // role
    if (body.hasOwnProperty('role')) {
        validate.valid('role', 'isRequired')
    }
    // order
    if (body.hasOwnProperty('order')) {
        validate.valid('order', 'isNumeric')
            .valid('order', 'isRequired')
    }

    return validate.get()
}

/**
 * user delete (post)
 */
module.exports.delete = (req, res, next) => {

    // body
    const body = req.body

    // delete requires id
    const id = body.id != null ? body.id : null

    if (!id) {
        // if id undefined return err
        return errorMessageJson(res, null, 'id is undefined!')
    }

    // get user by id
    admin.firestore().collection('users')
        .doc(id)
        .get()
        .then(doc => {
            // check user exist
            if (doc.exists) {
                // delete user
                doc.ref.delete()
                    .then(_ => {
                        // if self user and change password or email then signout
                        if (req.vessel.get('user.id') === id) {
                            // signout
                            signoutMessageJson(req, res, 'Successfully deleted user.', {
                                mode: 'signout',
                                id: id
                            })
                        } else {
                            // send seccess message
                            successMessageJson(res, 'Successfully deleted user.', body, {
                                mode: 'delete',
                                id: id
                            })
                        }
                    })
                    .catch(err => errorMessageJson(res, err, null, __filename, __line))
            } else {
                // not exist user
                errorMessageJson(res, null, 'user is undefined!')
            }
        })
        .catch(err => errorMessageJson(res, err, null, __filename, __line))
}
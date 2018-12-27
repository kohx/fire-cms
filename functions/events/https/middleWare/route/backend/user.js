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

    return admin.firestore().collection('users')
        .doc(target)
        .get()
        .then(doc => {
            // user is not found
            if (!doc.exists) {
                let err = new Error('user Not Found!')
                err.status = 404
                next(err)
                return
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
                invalidMessageJson(res, validationResult)
            } else {
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
                        successMessageJson(res, 'Successfully created new thing.', 'create', {}, id)
                    })
                    .catch(err => errorMessageJson(res, err, null, __filename, __line))
            }
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
        // confirm
        .valid('confirm', 'isRequired')
        .valid('confirm', 'isConfirm', 'password')
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

    // TODO:: 自分自身は変更できなくする、またはサインアウトする

    // body
    const body = req.body

    // then update id is requred
    const id = body.id != null ? body.id : null

    // if id undefined return err
    if (!id) {
        errorMessageJson(res, null, 'id is undefined!')
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
                invalidMessageJson(res, validationResult)
            } else {
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

                admin.firestore().collection('users').doc(id)
                    .update(params)
                    .then(_ => {
                        signout(req, res)
                        // send seccess message
                        successMessageJson(res, '{{key}} is updated.', 'update', body)
                    })
                    .catch(err => errorMessageJson(res, err, null, __filename, __line))
            }
        })
        .catch(err => errorMessageJson(res, err, null, __filename, __line))
}

/* validation update user */
function validationUpdate(body, nameUniqueFlag, emailUniqueFlag) {

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
    // confirm
    if (body.hasOwnProperty('confirm')) {
        validate
            .valid('confirm', 'isRequired')
            .valid('confirm', 'isConfirm', 'password')
    }
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

function signout(req, res) {
    // セッション Cookie を取得
    const session = (req.cookies.__session != null) ? JSON.parse(req.cookies.__session) : []
    debug(session, __filename, __line)
    const sessionCookie = (session['sessionCookie'] != null) ? session['sessionCookie'] : false
    debug(sessionCookie, __filename, __line)

    if (!sessionCookie) {
        res.json({
            code: 'error',
            message: `there is not sessionCookie.`
        })
        return
    }

    // セッションをクリア
    res.clearCookie('__session')

    return admin.auth().verifySessionCookie(sessionCookie)
        .then(decodedClaims => {
            debug(decodedClaims, __filename, __line)
            return admin.auth().revokeRefreshTokens(decodedClaims.sub)
                .then(_ => {
                    debug('in success', __filename, __line)
                    res.json({
                        code: 'success',
                        message: `sign out.`
                    })
                })
                .catch(err => {
                    debug(err, __filename, __line)
                    res.json({
                        code: 'error',
                        message: `sign out failed.`
                    })
                })
        })
        .catch(err => {
            debug(err, __filename, __line)
            res.json({
                code: 'error',
                message: `there is not claims.`
            })
        })
}

/**
 * user delete (post)
 */
module.exports.delete = (req, res, next) => {

    // TODO:: 自分自身は削除できなくする、またはサインアウトする

    const id = req.body.id != null ? req.body.id : null

    if (!id) {
        // if id undefined return err
        errorMessageJson(res, null, 'id is undefined!')
    } else {
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
                            // send success message
                            successMessageJson(res, 'Successfully deleted thing.', 'delete', {}, id)
                        })
                        .catch(err => errorMessageJson(res, err, null, __filename, __line))
                } else {
                    // not exist user
                    errorMessageJson(res, null, 'id is undefined!')
                }
            })
            .catch(err => errorMessageJson(res, err, null, __filename, __line))
    }
}
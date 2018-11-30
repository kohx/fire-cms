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

    // ユーザー名には、[a-z]、[0-9]、-、_、'、.を使用できます。
    // ユーザー名には、&、=、<、>、+、,を使用できません。
    // また、連続した複数のピリオド（.）を含めることはできません。
    validate.test('name', 'isRequired')
    validate.test('name', 'isAlnumunder')
    validate.test('name', 'isUnique', nameUniqueFlag)

    validate.test('email', 'isRequired')
    validate.test('email', 'isEmail')
    validate.test('email', 'isUnique', emailUniqueFlag)

    // パスワードには任意の組み合わせの印刷可能な ASCII 文字を使用できます。
    // また、8 文字以上にする必要があります。
    validate.test('password', 'isRequired')
    validate.test('password', 'isLength', 8, 20)
    validate.test('password', 'containsSymbol')
    validate.test('password', 'containsUppercase')
    validate.test('password', 'containsNumric')
    validate.test('password', 'canNotUsedBlank')

    validate.test('confirm', 'isRequired')
    validate.test('confirm', 'isConfirm', 'password')

    validate.test('role', 'isRequired')

    return validate.check()
}

/* create user Auth */
const createAuth = (name, email, password) => {

    return admin.auth().createUser({
        displayName: name,
        email: email,
        password: password,
        emailVerified: false,
        disabled: false
    })
}

/* set user */
const setUser = (uid, name, email, role) => {
    return admin.firestore().collection('users')
        .doc(uid)
        .set({ name, email, role })
}

module.exports.index = (req, res, next) => {

    admin.firestore().collection('users').get()
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

module.exports.create = (req, res, next) => {

    const name = req.body.name
    const email = req.body.email
    const password = req.body.password
    const role = req.body.role

    Promise.all([
        checkUnique('name', name),
        checkUnique('email', email),
    ])
        .then(results => {

            const [nameUniqueFlag, emailUniqueFlag] = results

            /* validation */
            valid = validationBody(req.body, nameUniqueFlag, emailUniqueFlag)

            /* validation not passed */
            if (!valid.status) {

                // translate validation message and rebuild messages
                let messages = []
                Object.keys(valid.errors).forEach(key => {
                    valid.errors[key].forEach(error => {
                        // {path: xxx.xxx, message: 'asdf asdf asdf.'}
                        // change to 
                        // {key: xxx.xxx, content: 'asdf asdf asdf.'}
                        messages.push({
                            key: error.path,
                            content: req.__(error.message, error.params)
                        })
                    })
                })

                res.json({
                    code: 'warning',
                    messages: messages,
                    values: valid.values
                })
            } else {

                /* create user */
                Promise.resolve()
                    .then(_ => {
                        return createAuth(name, email, password)
                    })
                    .then(user => {
                        return setUser(user.uid, name, email, role)
                    })
                    .then(result => {
                        debug(result, __filename, __line)
                        res.json({
                            code: 'success',
                            messages: [`Successfully created new user:`],
                            values: valid.values,
                        })
                    })
                    .catch(err => {
                        res.json({
                            code: 'error',
                            messages: [{
                                key: 'error',
                                content: err.message,
                            }],
                            values: valid.values,
                        })
                    })
            }
        })
        .catch(err => {
            res.json({
                code: 'error',
                messages: [{
                    key: 'error',
                    content: err.message,
                }],
                values: valid.values,
            })
        })
}

module.exports.update = (req, res, next) => {

    debug('update', __filename, __line)

    // admin.auth().updateUser(uid, {
    //     email: "modifiedUser@example.com",
    //     phoneNumber: "+11234567890",
    //     emailVerified: true,
    //     password: "newPassword",
    //     displayName: "Jane Doe",
    //     photoURL: "http://www.example.com/12345678/photo.png",
    //     disabled: true
    // })
    //     .then(function (userRecord) {
    //         // See the UserRecord reference doc for the contents of userRecord.
    //         console.log("Successfully updated user", userRecord.toJSON());
    //     })
    //     .catch(function (error) {
    //         console.log("Error updating user:", error);
    //     });


}

module.exports.delete = (req, res, next) => {

    debug('update', __filename, __line)

    admin.auth().deleteUser(uid)
        .then(function () {
            console.log("Successfully deleted user");
        })
        .catch(function (error) {
            console.log("Error deleting user:", error);
        });

    next()
}
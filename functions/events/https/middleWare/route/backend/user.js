const parent = require('../../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const url = require('url')

const validation = require('../../../../../modules/validation')
const debug = require('../../../../../modules/debug').debug

// TODO:: カスタムのメール アクション ハンドラの作成
// https://firebase.google.com/docs/auth/custom-email-handler?hl=ja

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

    const getName = admin.firestore().collection('users')
        .where('name', '==', req.body.name)
        .get()

    const getEmail = admin.firestore().collection('users')
        .where('email', '==', req.body.email)
        .get()

    Promise.all([getName, getEmail])
        .then(results => {
            const [name, email] = results

            /* set orderbalidation */
            const validate = validation.list(req.body)

            validate.test('name', 'isRequired')
            validate.test('name', 'isAlnumunder')
            validate.test('name', 'notUse', name.size)

            validate.test('email', 'isRequired')
            validate.test('email', 'isEmail')
            validate.test('email', 'notUse', email.size)

            validate.test('password', 'isRequired')
            validate.test('password', 'isLength', 6, 20)
            validate.test('password', 'containsSymbol')
            validate.test('password', 'containsUppercase')
            validate.test('password', 'containsNumric')
            validate.test('password', 'canNotUsedBlank')

            validate.test('confirm', 'isRequired')
            validate.test('confirm', 'isConfirm', 'password')
            
            validate.test('role', 'isRequired')

            valid = validate.check()

            /* validation not passed */
            let messages = []

            /* validation not passed */
            if (!valid.status) {

                // translate validation message and rebuild messages
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
                admin.auth().createUser({
                    email: valid.values.email,
                    emailVerified: false,
                    password: valid.values.password,
                    displayName: valid.values.name,
                    disabled: false
                })
                    .then(userRecord => {
                        // See the UserRecord reference doc for the contents of userRecord.
                        res.json({
                            code: 'success',
                            messages: [`Successfully created new user: ${userRecord.uid}`],
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
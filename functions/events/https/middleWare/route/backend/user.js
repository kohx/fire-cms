const parent = require('../../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const url = require('url')

const debug = require('../../../../../modules/debug').debug

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
    
    console.log(req.body)
    // get post from req body
    const user = req.body
    const name = user.name != null ? user.name : ''
    const email = user.email != null ? user.email : ''
    const description = user.description != null ? user.description : ''
    const order = user.order != null ? user.order : ''

    /* set orderbalidation */
    const validate = validation.list(req.body)

        validate.test('name', 'isRequired')
        validate.test('name', 'isAlnumunder')
        validate.sanitize('asset.landscapePrefix', 'trim')

    
    // admin.auth().createUser({
    //     email: "user@example.com",
    //     emailVerified: false,
    //     phoneNumber: "+11234567890",
    //     password: "secretPassword",
    //     displayName: "John Doe",
    //     photoURL: "http://www.example.com/12345678/photo.png",
    //     disabled: false
    // })
    //     .then(function (userRecord) {
    //         // See the UserRecord reference doc for the contents of userRecord.
    //         console.log("Successfully created new user:", userRecord.uid);
    //     })
    //     .catch(function (error) {
    //         console.log("Error creating new user:", error);
    //     });

    res.json({
        code: 'success',
        messages: 'test',
        values: ''
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
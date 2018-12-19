// firebase
const parent = require('../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const debug = require('../../modules/debug').debug

exports.usersOnCreate = functions.firestore
    .document('users/{uid}')
    .onCreate((doc, context) => {

        debug(doc, __filename, __line)
        // const id = doc.id
        // const data = doc.data()

        // return admin.auth().createUser({
        //     uid: id, // set store user id to auth uid
        //     displayName: data.name,
        //     email: data.email,
        //     password: data.password,
        //     emailVerified: false,
        //     disabled: false
        // })
    })
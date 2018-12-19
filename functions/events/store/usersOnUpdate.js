// firebase
const parent = require('../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const debug = require('../../modules/debug').debug

exports.usersOnUpdate = functions.firestore
    .document('users/{uid}')
    .onUpdate((change, context) => {

        const afterID = change.after.id
        const afterData = change.after.data()
        debug(afterID, __filename, __line)
        debug(afterData, __filename, __line)

        // // ...or the previous value before this update
        // const previousValue = change.before.data()
        // debug(previousValue, __filename, __line)


        // const name = body.name != null ? body.name : null
        // const email = body.email != null ? body.email : null
        // const password = body.password != null ? body.password : null

        // return admin.auth().updateUser(data.uid, params)
    })
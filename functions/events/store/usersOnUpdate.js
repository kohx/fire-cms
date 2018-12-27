// firebase
const parent = require('../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const debug = require('../../modules/debug').debug

exports.usersOnUpdate = functions.firestore
    .document('users/{id}')
    .onUpdate((change, context) => {

        const id = change.after.id
        const beforeData = change.before.data()
        const afterData = change.after.data()

        const params = {}
        if (beforeData.name !== afterData.name) {
            params.name = afterData.name
        }
        if (beforeData.email !== afterData.email) {
            params.email = afterData.email
        }
        if (beforeData.password !== afterData.password) {
            params.password = afterData.password
        }

        if(Object.keys(params) !== 0) {
            return admin.auth().updateUser(id, params)
        }

        return true
    })
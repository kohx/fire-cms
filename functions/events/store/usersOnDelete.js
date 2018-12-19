// firebase
const parent = require('../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const debug = require('../../modules/debug').debug

exports.usersOnDelete = functions.firestore
    .document('users/{uid}')
    .onDelete((doc, context) => {

        const data = doc.data()
        return admin.auth().deleteUser(data.uid)
    })
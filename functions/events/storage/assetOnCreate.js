// firebase
const parent = require('../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const spawn = require('child-process-promise').spawn
const path = require('path')
const os = require('os')
const fs = require('fs')

exports.assetOnCreate = exports.createUser = functions.firestore
    .document('things/{id}')
    .onCreate((doc, context) => {
        const id = doc.id
        const data = doc.data()

        firebase.firestore().collection('asset')
        .doc(id)
        .set({
            
        })


        // perform desired operations ...
    })
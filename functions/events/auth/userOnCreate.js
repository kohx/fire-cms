const parent = require('../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const debug = require('../../modules/debug').debug

exports.userOnCreate = functions.auth.user()
  .onCreate((user, context) => {
    console.log('---> authCreated')
    // debug(user, __filename, __line)
    // debug(user.uid, __filename, __line)
    // debug(user.email, __filename, __line)
    // debug(user.displayName, __filename, __line)

    // const creationTime = user.metadata.creationTime;
    // console.log('creationTime', creationTime)
    // const lastSignInTime = user.metadata.lastSignInTime;
    // console.log('lastSignInTime', lastSignInTime)

    // return admin.firestore()
    //   .collection('users')
    //   .doc(user.uid)
    //   .set({
    //     name: user.uid,
    //     email: user.email,
    //     email: user.email,
    //   })
    //   .then(result => {
    //     console.log('seuccess')
    //   })
  })
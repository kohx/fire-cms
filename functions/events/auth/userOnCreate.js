const parent = require('../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

exports.userOnCreate = functions.auth.user()
  .onCreate((user, context) => {
    console.log('---> authCreated')
    console.log(user)
    console.log('uid', user.uid)
    console.log('email', user.email)

    const creationTime = user.metadata.creationTime;
    console.log('creationTime', creationTime)
    const lastSignInTime = user.metadata.lastSignInTime;
    console.log('lastSignInTime', lastSignInTime)

    return admin.firestore()
      .collection('users')
      .doc(user.uid)
      .set({
        id: user.uid,
        email: user.email,
      })
      .then(result => {
        console.log('seuccess')
      })
  })
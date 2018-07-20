const parent = require('../parent')
const functions = parent.functions
const admin = parent.admin

// https://us-central1-newfunctions-8c03c.cloudfunctions.net/hello
exports.addTest = functions.https.onRequest((request, response) => {

    const testCollection = admin.firestore().collection('/test')
        .add({ name: 'kohei from functions!' })
        .then((snapshot) => {
            // console.log(snapshot.ref.id)
            // console.log(snapshot.ref.segments)
        });

    if (request.query.name !== undefined) {
        let param = request.query.name
        console.log(param)
        response.status(200).send(`Hello ${param} !!!`)
    } else {
        response.status(200).send("Hello! World!")
    }
})
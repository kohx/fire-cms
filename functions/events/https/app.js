/* firebase */
const parent = require('../parent')
const functions = parent.functions
const admin = parent.admin

/* express */
const express = require('express')
const url = require('url')
const path = require('path')
const fs = require('fs')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cors = require('cors')({ origin: true })
const favicon = require('serve-favicon')

/* module */
const cipher = require('../../modules/cipher')
const wavebar = require('./modules/wavebar')

/* middleware */
const serverSign = require('./middleWare/serverSign')
const allRoute = require('./middleWare/allRoute')

/* routes */
var backendRouter = require('./routes/backend')
var frontendRouter = require('./routes/frontend')

// app
const app = express()
app.use(cors)
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


/* app modules */

/*  */
// admin.firestore().collection('configs')
//     .get()
//     .then(docs => {
//         let configs = {}
//         docs.forEach((doc, key) => {
//             configs[doc.id] = doc.data()
//         })
//     })

/* app middleware */
app.use(allRoute.getInfo)

/* route */
app.use('/static', express.static(path.join(__dirname, 'public')))
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')))
app.use(`/*`, frontendRouter)
app.use(`/backend`, backendRouter)

// app.get('/signin', (req, res, next) => {
//     const csrfToken = serverSign.csrf(res)
//     wavebar.render('signin', { csrfToken })
//         .then(renderd => {
//             res.set({
//                 'Cache-Control': 'private',
//             })
//                 .status(200)
//                 .send(renderd)
//         })
//         .catch(err => {
//             next(err)
//         })
// })

// // endpoint
// app.post('/serverSignIn', (req, res) => {

//     serverSign.in(res, req)
//         .then(result => {
//             res.json(result)
//         })
//         .catch(err => {
//             res.json(err)
//         })
// })

// // endpoint
// app.post('/serverSignOut', (req, res) => {

//     serverSign.out(req, res)
//         .then(result => {
//             res.json(result)
//         })
//         .catch(err => {
//             res.json(err)
//         })
// })

// 404
app.use((req, res, next) => {
    let err = new Error('Not Found!')
    err.status = 404
    next(err)
})

// error
app.use(
    (err, req, res, next) => {

        console.log('last: ', err)

        const status = err.status || 500
        res.status(status)
        admin.firestore().collection('things').doc(String(status)).get()
            .then(doc => {
                const thing = doc.data()
                if (thing.content) {
                    const renderd = wavebar.render(thing, {
                        errStatus: err.status,
                        errMessage: err.message,
                    })
                    res.send(renderd)
                } else {
                    res.send(`<!doctype html>
                                <head>
                                <title>${err.status || 500} from err!</title>
                                </head>
                                <body>
                                <h1>${err.status || 500}</h1>
                                <p>${err.message}</p>
                                </body>
                            </html>`)
                }
            })
            .catch(err => {
                res.send(`<!doctype html>
                                <head>
                                <title>500 from catch err!!</title>
                                </head>
                                <body>
                                <h1>500</h1>
                                <p>${err.message}</p>
                                </body>
                            </html>`)
            })
    })

/* export function */
exports.app = functions.https.onRequest(app)
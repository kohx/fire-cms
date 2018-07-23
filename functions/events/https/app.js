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
const cors = require('cors')({
    origin: true
})

/* module */
const cipher = require('../../modules/cipher')
const serverSign = require('./modules/serverSign')

/* middleware */
const getWare = require('./middleWare/getWare')
const errWare = require('./middleWare/errWare')
const signWare = require('./middleWare/signWare')

/* routes */
var backendRouter = require('./routes/backend')
var frontendRouter = require('./routes/frontend')

// app
const app = express()
app.use(cors)
app.use(cookieParser())
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(bodyParser.json())

/* getWare getInfo */
app.use(getWare.getInfo)

/* signWare check */
app.use(signWare.check)

/* route */
app.use(`/*`, frontendRouter)
app.use(`/*`, backendRouter)

// endpoint
app.post('/serverSignIn', (req, res) => {

    serverSign.in(res, req)
        .then(result => {
            res.json(result)
        })
        .catch(err => {
            res.json(err)
        })
})

// endpoint
app.post('/serverSignOut', (req, res) => {

    serverSign.out(req, res)
        .then(result => {
            res.json(result)
        })
        .catch(err => {
            res.json(err)
        })
})

/* errWare notFound */
app.use(errWare.notFound)

/* errWare internalServerError */
app.use(errWare.internalServerError)

/* export function */
exports.app = functions.https.onRequest(app)
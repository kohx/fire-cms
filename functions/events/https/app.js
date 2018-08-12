/* firebase */
const parent = require('../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

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
const wavebar = require('../../modules/wavebar')

/* middleware */
const initWare = require('./middleWare/initWare')
const errWare = require('./middleWare/errWare')
const signWare = require('./middleWare/signWare')

/* routes */
var backendRouter = require('./routes/backend')
var frontendRouter = require('./routes/frontend')
var signEndPointRouter = require('./routes/signEndPoint')

// app
console.log('\n\n\n<<<<<<<<<< app start >>>>>>>>>>\n\n')
const app = express()
app.use(cors)
app.use(cookieParser())
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(bodyParser.json())

/* initWare getInfo */
app.use(initWare.getInfo)
app.use(initWare.getPath)

/* signWare check */
app.use(signWare.check)

/* wavebar */
app.use(wavebar.init)

/* route */
app.use(`/*`, frontendRouter)
app.use(`/*`, backendRouter)
app.use('/signEndPoint', signEndPointRouter)

// TODO:: メールはnodeでしかできないで作成
// app.use('/mailEndPoint', signEndPointRouter)

/* errWare notFound */
app.use(errWare.notFound)

/* errWare internalServerError */
app.use(errWare.internalServerError)

/* export function */
exports.app = functions.https.onRequest(app)
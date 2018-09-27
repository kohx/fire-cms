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
var i18n = require('i18n')

/* module */
const debug = require('../../modules/debug').debug
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
// Parse cookie
app.use(cookieParser())
// Parse json data
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

i18n.configure({
    locales: system.lang.locales,
    defaultLocale: system.lang.default,
    directory: path.join(__dirname, system.lang.dirname),
    // オブジェクトを利用したい場合はtrue
    objectNotation: true
});
app.use(i18n.init)

/* initWare getInfo */
app.use(initWare.getInfo)
/* initWare getPath */
app.use(initWare.getPath)
app.use(initWare.setLang)
app.use(initWare.getThing)

/* wavebar */
app.use(wavebar.init)

/* signWare check */
app.use(signWare.check)
/* signWare csrf */
app.use(signWare.csrf)

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
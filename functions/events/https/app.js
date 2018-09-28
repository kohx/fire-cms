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

/* routes */
var backendRouter = require('./routes/backend')
var frontendRouter = require('./routes/frontend')
var signEndPointRouter = require('./routes/signEndPoint')

/* middleware */
const initWare = require('./middleWare/app/initWare')
const signWare = require('./middleWare/app/signWare')
const errWare = require('./middleWare/app/errWare')

// app
console.log('\n\n\n<<<<<<<<<< app start >>>>>>>>>>\n\n')
const app = express()

app.use(cors)
// Parse cookie
app.use(cookieParser())
// Parse json data
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

/* initWare getInfo */
app.use(initWare.getInfo)
/* set language */
app.use((req, res, next) => {
    i18n.configure({
        locales: req.vessel.get('settings.lang.locales', ['en', 'ja']),
        defaultLocale: req.vessel.get('settings.lang.default', 'en'),
        directory: path.join(__dirname, req.vessel.get('settings.lang.dirname', 'locales')),
        // オブジェクトを利用したい場合はtrue
        objectNotation: true
    })
    next()
})
app.use(i18n.init)
/* initWare getPath */
app.use(initWare.getPath)
/* initWare setLang */
app.use(initWare.setLang)
/* initWare getThing */
app.use(initWare.getThing)

/* signWare check */
app.use(signWare.check)
/* signWare getUser */
app.use(signWare.user)
/* signWare csrf */
app.use(signWare.csrf)

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
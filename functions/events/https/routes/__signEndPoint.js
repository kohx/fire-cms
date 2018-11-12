// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const signWare = require('../middleWare/app/signWare')
const express = require('express')
const router = express.Router()


router.post('/in', signWare.in)

router.post('/out', signWare.out)

module.exports = router
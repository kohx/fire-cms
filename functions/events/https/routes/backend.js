// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin

const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  res.send('backend♪')
})

router.get('/kohei', (req, res) => {
  res.send('kohei🎵')
})

module.exports = router
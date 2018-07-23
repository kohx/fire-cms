// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin

const express = require('express')
const router = express.Router()

router.post('/in', (req, res) => {

    serverSign.in(res, req)
        .then(result => {
            res.json(result)
        })
        .catch(err => {
            res.json(err)
        })
})

router.post('/out', (req, res) => {

    serverSign.out(req, res)
        .then(result => {
            res.json(result)
        })
        .catch(err => {
            res.json(err)
        })
})

module.exports = router
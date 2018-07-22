// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin

const express = require('express')
const router = express.Router()

router.get('/*',
    (req, res, next) => {

        // ファーストパスがバックエンドユニークでない場合
        if (req.vessel.firstPath !== req.vessel.backendUnique) next('route')
        else next()
    },
    (req, res, next) => {

        // バックエンドユニークを削除
        req.vessel.paths.shift()
        const backendRoute = req.vessel.paths.shift() || 'root'
        const func = backendRoutes[backendRoute] || false

        if (func) {
            func(req, res)
        } else {
            next('route')
        }
    })

const backendRoutes = {
    root: (req, res) => {
        res.send('root!')
    },
    configs: (req, res) => {
        res.send('configs!')
    },
    divisions: (req, res) => {
        res.send('divisions!')
    },
    parts: (req, res) => {
        res.send('parts!')
    },
    images: (req, res) => {
        res.send('images!')
    },
}

module.exports = router
// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const cache = require('memory-cache')

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
        console.log('<----------------------------- root')
        res.send('root!')
    },
    configs: (req, res) => {
        console.log('<----------------------------- configs')
        res.send('configs!')
    },
    divisions: (req, res) => {
        console.log('<----------------------------- divisions')
        res.send('divisions!')
    },
    parts: (req, res) => {
        console.log('<----------------------------- parts')
        res.send('parts!')
    },
    images: (req, res) => {
        console.log('<----------------------------- images')
        res.send('images!')
    },
}

module.exports = router
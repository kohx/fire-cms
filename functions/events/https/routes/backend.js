// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const cache = require('memory-cache')
var fs = require('fs')
const path = require('path')

const express = require('express')
const router = express.Router()

router.get('/*',
    (req, res, next) => {
        // console.log(req.vessel)
        // if (req.vessel.sign.status === false) res.redirect(`/${req.vessel.signinUnique}`)
        // else next()
        next()
    },
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
        const data = {
            content: fs.readFileSync(path.join(__dirname, '../', 'templates/index.html'), 'utf8'),
            parts: {
                header: fs.readFileSync(path.join(__dirname, '../', 'templates/parts/header.html'), 'utf8'),
                footer: fs.readFileSync(path.join(__dirname, '../', 'templates/parts/footer.html'), 'utf8'),
            },
            wraps: {
                html: fs.readFileSync(path.join(__dirname, '../', 'templates/wraps/html.html'), 'utf8'),
            },
        }
        console.log('<----------------------------- root')
        res.wbRender(data)
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
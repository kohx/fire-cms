// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

var fs = require('fs')
const path = require('path')

const express = require('express')
const router = express.Router()
const jsonCache = require('../../../modules/jsonCache')

router.get('/*',
    (req, res, next) => {
        console.log(req.vessel)
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
        const backendRoute = req.vessel.paths.shift() || 'index'

        // キャッシュを取得
        let wraps = jsonCache.get('wraps')
        // キャッシュが空のとき
        if (wraps === null) {
            wraps = {
                html: fs.readFileSync(path.join(__dirname, '../', 'templates/wraps/html.html'), 'utf8'),
            }
            // キャッシュに入れる 
            jsonCache.set('wraps', wraps)
        }

        // キャッシュを取得
        let parts = jsonCache.get('parts')
        // キャッシュが空のとき
        if (parts === null) {
            parts = {
                header: fs.readFileSync(path.join(__dirname, '../', 'templates/parts/header.html'), 'utf8'),
                footer: fs.readFileSync(path.join(__dirname, '../', 'templates/parts/footer.html'), 'utf8'),
            }
            // キャッシュに入れる 
            jsonCache.set('parts', parts)
        }

        // キャッシュを取得
        let thing = jsonCache.get(`thing_${backendRoute}`)
        // キャッシュが空のとき
        if (thing === null) {
            thing = {
                content: fs.readFileSync(path.join(__dirname, '../', `templates/${backendRoute}.html`), 'utf8'),
            }
            // キャッシュに入れる 
            jsonCache.set(`thing_${backendRoute}`, thing)
        }

        req.vessel.wraps = wraps
        req.vessel.parts = parts
        req.vessel.thing = thing

        const func = backendRoutes[backendRoute] || false
        if (func) {
            func(req, res)
        } else {
            next('route')
        }
    })

function br(backendRoute, data) {
    return backendRoutes
}

const backendRoutes = {
    index: (req, res) => {
        const thing = req.vessel.thing
        const content = (thing.content != null) ? thing.content : ''
        const data = {
            content: content,
            parts: req.vessel.parts,
            wraps: req.vessel.wraps,
        }
        data.params = {}
        data.params.user = req.vessel.sign.status ? req.vessel.sign.claims : {}
        data.params.sign = req.vessel.sign
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
    assets: (req, res) => {
        const data = {
            content: fs.readFileSync(path.join(__dirname, '../', 'templates/assets.html'), 'utf8'),
            parts: {
                header: fs.readFileSync(path.join(__dirname, '../', 'templates/parts/header.html'), 'utf8'),
                footer: fs.readFileSync(path.join(__dirname, '../', 'templates/parts/footer.html'), 'utf8'),
            },
            wraps: {
                html: fs.readFileSync(path.join(__dirname, '../', 'templates/wraps/html.html'), 'utf8'),
            },
        }
        console.log('<----------------------------- assets')
        res.wbRender(data)
    },
}

module.exports = router
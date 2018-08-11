// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const jsonCache = require('../../../modules/jsonCache')
// activata jsoncash from system
jsonCache.isActive(system.cache)

router.get('/*',
    (req, res, next) => {
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
        const backendTemplatesPath = path.join(__dirname, '../', 'templates')

        // バックエンドユニークを削除
        req.vessel.paths.shift()
        const backendRoute = req.vessel.paths.shift() || 'index'

        // キャッシュを取得
        let wraps = jsonCache.get('wraps')
        // キャッシュが空のとき
        if (wraps === null) {
            wraps = {
                html: fs.readFileSync(path.join(backendTemplatesPath, 'wraps/html.html'), 'utf8'),
            }
            // キャッシュに入れる 
            jsonCache.set('wraps', wraps)
        }

        // キャッシュを取得
        let parts = jsonCache.get('parts')
        // キャッシュが空のとき
        if (parts === null) {
            parts = {
                header: fs.readFileSync(path.join(backendTemplatesPath, 'parts/header.html'), 'utf8'),
                footer: fs.readFileSync(path.join(backendTemplatesPath, 'parts/footer.html'), 'utf8'),
            }
            // キャッシュに入れる 
            jsonCache.set('parts', parts)
        }

        // キャッシュを取得
        let content = jsonCache.get(`content_${backendRoute}`)
        // キャッシュが空のとき
        if (content === null) {
            try {
                content = fs.readFileSync(path.join(backendTemplatesPath, `${backendRoute}.html`), 'utf8')
            } catch (err) {
                // ない場合
                content = false
            }
            // キャッシュに入れる 
            jsonCache.set(`content_${backendRoute}`, content)
        }

        const data = {
            content,
            parts,
            wraps,
            params: {
                backendName: req.vessel.backendUnique,
                user: req.vessel.sign.status ? req.vessel.sign.claims : {},
                sign: req.vessel.sign,
            }
        }

        const func = backendRoutes(backendRoute, data)
        if (func) {
            func(req, res, next)
        } else {
            console.log('>>>>in')
            next('route')
        }
    })

function backendRoutes(root, data) {
    const routes = {
    index: (req, res, next) => {
            console.log('<----------------------------- backend index')
        res.wbRender(data)
    },
    configs: (req, res, next) => {
        console.log('<----------------------------- configs')
            res.wbRender(data)
    },
    divisions: (req, res, next) => {
        console.log('<----------------------------- divisions')
            res.wbRender(data)
    },
    parts: (req, res, next) => {
        console.log('<----------------------------- parts')
        res.send('parts!')
    },
    assets: (req, res, next) => {
        console.log('<----------------------------- assets')
        res.wbRender(data)
    },
}
    const func = (routes[root] != null) ? routes[root] : false
    return func
}


module.exports = router
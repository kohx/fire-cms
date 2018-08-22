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

const updateAsset = require('../backendRoutes/updateAsset')

// activata jsoncash from system
jsonCache.isActive(system.cache)

/* middle wares */
function checkPath(req, res, next) {
    // ファーストパスがバックエンドユニークでない場合
    if (req.vessel.firstPath !== req.vessel.backendUnique) next('route')
    else next()
}

function checkSingIn(req, res, next) {

    // バックエンドユニークを削除
    req.vessel.paths.shift()
    const unique = req.vessel.paths.shift() || 'index'
    req.vessel.back.unique = unique

    // サインインしているかチェック
    const isSigned = req.vessel.sign.status

    // サインインしてない場合
    if (!isSigned) {
        const backendSigninPagePath = `/${req.vessel.backendUnique}/${req.vessel.back.signinUnique}`
        console.log(`@ not sigin in. redirect to ${backendSigninPagePath}`)
        // res.redirect(`/${req.vessel.backendUnique}/${req.vessel.back.signinUnique}`)
        next()
    } else {
        next()
    }
}

function checkSigninPage(req, res, next) {
    // バックエンドのサインインページかチェック
    const isSignInPage = req.vessel.back.unique === req.vessel.back.signinUnique

    // サインインしているかチェック
    const isSigned = req.vessel.sign.status

    // サインインページでサインインしている場合
    if (isSignInPage && isSigned) {
        const refererUrl = (req.header('Referer') != null) ? req.header('Referer') : null
        let referer = (refererUrl != null) ? url.parse(refererUrl).pathname.trims('/') : ''
        if (referer === '' || referer === req.vessel.signinUnique) {
            referer = '/'
        }
        res.redirect(referer)
    } else {
        next()
    }
}

function getTemplate(req, res, next) {
    const unique = req.vessel.back.unique

    // build backend template path
    const templatesPath = path.join(__dirname, '../', 'templates')

    // キャッシュを取得
    let wraps = jsonCache.get('wraps')
    // キャッシュが空のとき
    if (wraps === null) {
        wraps = {
            html: fs.readFileSync(path.join(templatesPath, 'wraps/html.html'), 'utf8'),
        }
        // キャッシュに入れる 
        jsonCache.set('wraps', wraps)
    }

    // キャッシュを取得
    let parts = jsonCache.get('parts')
    // キャッシュが空のとき
    if (parts === null) {
        parts = {
            header: fs.readFileSync(path.join(templatesPath, 'parts/header.html'), 'utf8'),
            footer: fs.readFileSync(path.join(templatesPath, 'parts/footer.html'), 'utf8'),
        }
        // キャッシュに入れる 
        jsonCache.set('parts', parts)
    }

    

    // キャッシュを取得
    let content = jsonCache.get(`content_${unique}`)
    // キャッシュが空のとき
    if (content === null) {
        try {
            content = fs.readFileSync(path.join(templatesPath, `${unique}.html`), 'utf8')
        } catch (err) {
            // ない場合
            content = false
        }
        // キャッシュに入れる 
        jsonCache.set(`content_${unique}`, content)
    }

    // build data
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

    req.vessel.back.data = data
    next()
}

function getBack(req, res, next) {

    const unique = req.vessel.back.unique
    const data = req.vessel.back.data
    func = backendGetRoutes(unique, data)

    if (func) {
        func(req, res, next)
    } else {
        next('route')
    }
}

/* route get */
router.get('/*',
    checkPath,
    checkSingIn,
    checkSigninPage,
    getTemplate,
    getBack
)

function backendGetRoutes(unique, data) {
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
            res.wbRender(data)
        },
        assets: (req, res, next) => {
            console.log('<----------------------------- assets')
            res.wbRender(data)
        },
    }
    const func = (routes[unique] != null) ? routes[unique] : false
    return func
}

/* route post */
router.post('/*',
    checkPath,
    checkSingIn,
    postBack
)

function postBack(req, res, next) {
    const unique = req.vessel.back.unique
    // render backend page
    const func = backendPostRoutes(unique)
    if (func) {
        func(req, res, next)
    } else {
        next('route')
    }
}

function backendPostRoutes(unique) {
    const routes = {
        updateAsset: updateAsset
    }
    const func = (routes[unique] != null) ? routes[unique] : false
    return func
}

module.exports = router
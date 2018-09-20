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

    const first = req.vessel.get('paths.first');
    const backendFirst = req.vessel.get('settings.backend.first', 'backend')

    // ファーストパスがバックエンドユニークでない場合
    if (first !== backendFirst) {
        next('route')
    }
    else {
        next()
    }
}

function checkSingIn(req, res, next) {
    // バックエンドユニークを削除
    let segments = req.vessel.copy('paths.segments')
    const backendFirst = segments.shift()
    
    const unique = segments.unshift() || 'index'
    req.vessel.paths.unique = unique

    // サインインしているかチェック
    const isSigned = req.vessel.get('sign.status')

    // サインインしてない場合
    if (!isSigned) {
        const backendSigninPagePath = `/${backendFirst}/${req.vessel.set.signinUnique}`
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
    const templatesPath = path.join(__dirname, '../', 'backendTemplates')

    // キャッシュを取得
    let templates = jsonCache.get('templates')
    // キャッシュが空のとき
    if (templates === null) {
        templates = {
            header: fs.readFileSync(path.join(templatesPath, 'templates/header.html'), 'utf8'),
            footer: fs.readFileSync(path.join(templatesPath, 'templates/footer.html'), 'utf8'),
            wrapper: fs.readFileSync(path.join(templatesPath, 'templates/wrapper.html'), 'utf8'),
        }
        // キャッシュに入れる 
        jsonCache.set('templates', templates)
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
        templates,
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
        signin: (req, res, next) => {
            console.log(data)
            console.log('<----------------------------- signin')
            res.wbRender(data)
        },
        settings: (req, res, next) => {
            console.log(data)
            console.log('<----------------------------- settings')
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
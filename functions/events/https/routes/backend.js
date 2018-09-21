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

    const firstPath = req.vessel.get('paths.first');
    const backendFirstPath = req.vessel.get('settings.backend.firstPath', 'backend')

    // ファーストパスがバックエンドファーストパスでない場合
    if (firstPath !== backendFirstPath) {
        next('route')
    } else {
        next()
    }
}

function checkSingIn(req, res, next) {

    // サインインしているかチェック
    const isSigned = req.vessel.get('sign.status')

    const backendFirstPath = req.vessel.get('settings.backend.firstPath')
    const backendSigninUnique = req.vessel.get('settings.backend.signinUnique')

    // サインインしてない場合
    if (!isSigned) {
        const redirectPath = `/${backendFirstPath}/${backendSigninUnique}`
        console.log(`@ not sigin in. redirect to ${redirectPath}`)
        // res.redirect(`${redirectPath}`)
        next()
    } else {
        next()
    }
}

function checkSigninPage(req, res, next) {

    const isSigned = req.vessel.get('sign.status')

    const backendFirstPath = req.vessel.get('settings.backend.firstPath')
    const backendSigninUnique = req.vessel.get('settings.backend.signinUnique')
    const isSignInPage = backendFirstPath == backendSigninUnique

    // サインインページでサインインしている場合
    if (isSignInPage && isSigned) {
        const refererUrl = (req.header('Referer') != null) ? req.header('Referer') : null
        let referer = (refererUrl != null) ? url.parse(refererUrl).pathname.trims('/') : ''

        if (referer === '' || referer === backendSigninUnique) {
            referer = '/'
        }
        res.redirect(referer)
    } else {
        next()
    }
}

function getTemplate(req, res, next) {

    //get unique
    const unique = req.vessel.get('paths.unique')
    console.log('=>', unique)

    // build backend template path
    const backendTemplatesPath = path.join(__dirname, '../', 'backendTemplates')
    const templatesPath = path.join(backendTemplatesPath, 'templates')

    // キャッシュを取得
    let templates = jsonCache.get('templates')

    // キャッシュが空のとき
    if (templates === null) {
        templates = {}
        const files = fs.readdirSync(templatesPath)
        // DOTO:: try catch
        files.forEach(file => {
            const name = path.parse(file).name
            templates[name] = fs.readFileSync(path.join(templatesPath, file), 'utf8')
        })

        // キャッシュに入れる 
        jsonCache.set('templates', templates)
    }

    // キャッシュを取得
    let content = jsonCache.get(`content_${unique}`)

    // キャッシュが空のとき
    if (content === null) {
        try {
            content = fs.readFileSync(path.join(backendTemplatesPath, `${unique}.html`), 'utf8')
        } catch (err) {
            // ない場合
            content = ''
        }
        // キャッシュに入れる 
        jsonCache.set(`content_${unique}`, content)
    }

    // build data
    req.vessel.data = {
        content,
        templates,
        params: {
            backendName: req.vessel.get('settings.backend.firstPath'),
            user: req.vessel.get('sign.claims'),
            sign: req.vessel.sign,
        }
    }

    next()
}

function getBack(req, res, next) {

    const unique = req.vessel.get('paths.unique')
    const data = req.vessel.get('data')
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
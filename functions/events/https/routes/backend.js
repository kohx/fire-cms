// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')

const debug = require('../../../modules/debug').debug
const jsonCache = require('../../../modules/jsonCache')
// activata jsoncash from system
jsonCache.isActive(system.cache)

const updateAsset = require('../backendRoutes/updateAsset')

/* route get */
router.get('/*',
    checkPath,
    checkSingIn,
    getTemplate,
    getBack
)

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

    const unique = req.vessel.get('paths.unique')
    const backendSigninUnique = req.vessel.get('settings.backend.signinUnique')
    const backendFirstPath = req.vessel.get('settings.backend.firstPath')
    const backendTopUnique = req.vessel.get('settings.backend.topUnique')

    // サインインしているかチェック
    const isSigned = req.vessel.get('sign.status')

    // サインインページかチェック
    const isSignInPage = unique == backendSigninUnique

    // サインインしてない場合
    if (!isSignInPage && !isSigned) {
        const redirectPath = `/${backendFirstPath}/${backendSigninUnique}`
        console.log(`@ not sigin in. redirect to ${redirectPath}`)

        // res.redirect(`${redirectPath}`)  // product
        // or
        next(); // TODO::                   // for test
    } else
    if (isSignInPage && isSigned) {
        const refererUrl = (req.header('Referer') != null) ? req.header('Referer') : null
        let referer = (refererUrl != null) ? url.parse(refererUrl).pathname.trims('/') : ''

        if (referer === '' || referer === backendSigninUnique) {
            referer = `/${backendFirstPath}/${backendTopUnique}`
        }
        debug(referer, __filename, __line)
        res.redirect(referer)
    } else {
        next()
    }
}

function getTemplate(req, res, next) {

    //get unique
    const unique = req.vessel.get('paths.unique')
    debug(unique, __filename, __line)

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
            // 「.」があればそのまま、なければ「.html」
            const filename = unique.indexOf('.') === -1 ? `${unique}.html` : unique
            content = fs.readFileSync(path.join(backendTemplatesPath, filename), 'utf8')
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
            sign: req.vessel.get('sign.status'),
            csrfToken: req.vessel.get('csrfToken'),
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

function backendGetRoutes(unique, data) {
    const routes = {
        index: (req, res, next) => {
            console.log('<----------------------------- backend index')
            res.wbRender(data)
        },
        signin: (req, res, next) => {
            console.log('<----------------------------- signin')
            res.wbRender(data)
        },
        'signin.js': (req, res, next) => {
            console.log('<----------------------------- signin')
            res.wbRender(data)
        },
        'signinJs': (req, res, next) => {
            console.log('<----------------------------- signinJs')
            res.wbRender(data, 'js')
        },
        settings: (req, res, next) => {
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
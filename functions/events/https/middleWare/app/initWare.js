// firebase
const parent = require('../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

var i18n = require('i18n')
const path = require('path')
const fs = require('fs')

const debug = require('../../../../modules/debug').debug
const jsonCache = require('../../../../modules/jsonCache')
// activata jsoncash from system
jsonCache.isActive(system.cache)

const backendThings = require('../../backendDir/backendThings')

module.exports.getInfo = (req, res, next) => {
    console.log('\n\n\n<<<<<<<<<< app start >>>>>>>>>>\n\n')
    console.time('[time] init app')

    // const parse = {
    //   'headers.hosts': [
    //     req.headers['host'],              // us-central1-newfunctions-a8a25.cloudfunctions.net
    //     req.headers['x-forwarded-host'],  // newfunctions-a8a25.firebaseapp.com
    //     req.headers['x-forwarded-proto'], // https
    //     req.headers['x-original-url'],    // /profile/5
    //   ],
    //   url: req.url,
    //   params: req.params.id,
    //   path: req.path,
    //   url_basename: path.basename(req.url),
    //   path_basename: path.basename(req.path),
    //   protocol: req.protocol,
    //   host: req.get('host'),
    //   originalUrl: req.originalUrl,
    //   fullUrl: url.format({ protocol: req.protocol, host: req.get('host'), pathname: req.originalUrl })
    // }
    // console.log('@parse', parse)

    req.vessel = {
        // get info
        frontendBase: '',
        backendBase: '',
        settings: {},
        templates: {},
        // get path
        paths: {},
        // route
        thing: {},
        sign: {},
        csrfToken: '',
        date: '',
        get: (path = '', sub = null) => {

            if (path == '') {
                return req.vessel
            }

            const paths = path.split('.')
            let result = req.vessel
            paths.forEach(path => {
                result = result[path]
            })
            return result != null ? result : sub
        }
    }

    // キャッシュを取得
    const settings = jsonCache.get('settings')
    // キャッシュから取得できればそれを返す
    if (settings != null) {
        req.vessel.settings = settings
        next()
    } else {
        admin.firestore().collection('settings')
            .get()
            .then(docs => {
                let settings = {}
                docs.forEach((doc, key) => {
                    settings[doc.id] = doc.data()
                })
                // キャッシュに入れる 
                jsonCache.set('settings', settings)
                // set value
                req.vessel.frontendBase = `${req.protocol}/${req.headers['x-forwarded-host']}/` || null
                req.vessel.backendBase = `${req.protocol}/${req.headers['x-forwarded-host']}/${settings.backend.firstPath}/` || null
                req.vessel.settings = settings

                next()
            })
            .catch(err => {
                next(err)
            })
    }
}

module.exports.getPath = (req, res, next) => {
    // Toppage unique get from settings
    const backendFirstPath = req.vessel.get('settings.backend.firstPath')

    if (backendFirstPath == null) {
        throw new Error('settings backend firstPath not setting.')
    }

    // Disassemble path
    const pathString = req.path.trims('/')
    const pathArr = (pathString != '') ? pathString.split('/') : []

    // copy segments object
    const segments = pathArr.slice(0)
    let first = pathArr.shift()
    first = (first != null) ? first : ''
    let last = pathArr.pop()
    last = (last != null) ? last : first

    // get front back flag
    if (first !== backendFirstPath) {
        req.vessel.paths.isFrontend = true
        req.vessel.paths.isBackend = false
    } else {
        req.vessel.paths.isFrontend = false
        req.vessel.paths.isBackend = true
    }

    // check last is number
    const numberReg = /^\d+$/
    let number = ''
    if (numberReg.test(last)) {
        number = last
        last = pathArr.pop()
    }

    // Assemble path
    req.vessel.paths.segments = segments
    req.vessel.paths.first = first
    req.vessel.paths.last = last
    req.vessel.paths.number = number

    next()
}

module.exports.setLang = (req, res, next) => {

    let lang = null
    if (req.vessel.get('paths.isFrontend')) {
        lang = req.vessel.get('settings.frontend.lang')
    }

    if (req.vessel.get('paths.isBackend')) {
        lang = req.vessel.get('settings.backend.lang')
    }
    if (lang) {
        req.setLocale(lang)
    }
    next()
}

module.exports.getThing = (req, res, next) => {

    /* if frontend */
    if (req.vessel.get('paths.isFrontend')) {
        const frontTemplate = getFrontTemplate(req, res, next)
        const frontThing = getFrontThing(req, res, next)
        Promise.all([frontTemplate, frontThing])
            .then(results => {
                const [templates, thing] = results
                req.vessel.thing = thing
                req.vessel.templates = templates
                next()
            })
            .catch(err => {
                next(err)
            })
    }
    /* else backend */
    else {
        const backendTemplate = getBackendTemplate(req, res, next)
        const backendThing = getBackendThing(req, res, next)
        req.vessel.templates = backendTemplate
        req.vessel.thing = backendThing
        next()
    }

    function getFrontTemplate(req, res, next) {

        return new Promise((resolve, reject) => {
            // キャッシュを取得
            let templates = jsonCache.get('templates')
            // キャッシュから取得できればそれを返す
            if (templates != null) {
                resolve(templates)
            }
            // パーツを取得
            admin.firestore().collection('templates').get()
                .then(docs => {
                    templates = {}
                    docs.forEach(doc => {
                        const data = doc.data()
                        templates[doc.id] = data.content
                    })
                    // キャッシュに入れる 
                    jsonCache.set('templates', templates)
                    // 結果を返す
                    resolve(templates)
                })
                .catch(err => reject(err))
        })
    }

    function getFrontThing(req, res, next) {

        // front end top unique
        const frontendTopUnique = req.vessel.get('settings.frontend.topUnique', 'home')

        // get paths from req
        const paths = req.vessel.get('paths')
        let unique = paths.last !== '' ? paths.last : frontendTopUnique
        unique = paths.number !== '' ? `${unique}/${number}` : unique

        return new Promise((resolve, reject) => {
            admin.firestore().collection('things').doc(unique)
                .get()
                .then(snap => {
                    if (snap.exists) {
                        resolve(snap.data())
                    } else {
                        resolve({})
                    }
                })
                .catch(err => reject(err))
        })
    }

    function getBackendTemplate(req, res, next) {

        // build backend template path
        const templatesPath = path.join(system.backendDir, 'templates')

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

        return templates
    }

    function getBackendThing(req, res, next) {

        // back end top unique
        const backendTopUnique = req.vessel.get('settings.backend.topUnique', 'index')

        // get paths from vessel
        const paths = req.vessel.get('paths')

        // cat first path becouse "backendpath"
        paths.segments = paths.segments.slice(1)

        // get segments top path
        let unique = paths.segments.shift()

        // if unique is null or undefined then set backend top unique
        unique = unique != null ? unique : backendTopUnique

        // set unique to paths
        paths.unique = unique

        // get thing from thing json
        const thing = backendThings.get(unique)

        if (!thing) {
            return {}
        }

        // if has content file\
        let content = ''
        if (thing.contentFile) {
            // file path
            const filePath = path.join(system.backendDir, 'contents', thing.contentFile)

            // キャッシュを取得
            content = jsonCache.get(`content_${unique}`)

            // キャッシュが空のとき
            if (content === null) {
                try {
                    content = fs.readFileSync(filePath, 'utf8')
                } catch (err) {
                    // ない場合
                    content = ''
                }
                // キャッシュに入れる
                jsonCache.set(`content_${unique}`, content)
            }
        }

        // set thing content
        thing.content = content
        console.timeEnd('[time] init app')
        return thing
    }
}
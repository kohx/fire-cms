// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const url = require('url')
const path = require('path')
const jsonCache = require('../../../modules/jsonCache')
// activata jsoncash from system
jsonCache.isActive(system.cache)

module.exports.getInfo = (req, res, next) => {
    
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
        frontendBase: null,
        backendBase: null,
        settings: null,
        templates: null,
        // get path
        paths: null,
        // route
        thing: null,
    }

    // setting 関係
    const getSettings = new Promise((resolve, reject) => {
        // キャッシュを取得
        const settings = jsonCache.get('settings')
        // キャッシュから取得できればそれを返す
        if (settings != null) {
            resolve(settings)
        }

        admin.firestore().collection('settings')
            .get()
            .then(docs => {
                let settings = {}
                docs.forEach((doc, key) => {
                    settings[doc.id] = doc.data()
                })
                // キャッシュに入れる 
                jsonCache.set('settings', settings)
                // 結果を返す
                resolve(settings)
            })
            .catch(err => reject(err))
    })

    // get templates
    const getTemplates = new Promise((resolve, reject) => {
        // キャッシュを取得
        const templates = jsonCache.get('templates')
        // キャッシュから取得できればそれを返す
        if (templates != null) {
            resolve(templates)
        }
        // パーツを取得
        admin.firestore().collection('templates').get()
            .then(docs => {
                let templates = {}
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

    var start_ms = new Date().getTime()

    Promise.all([getSettings, getTemplates])
        .then(results => {
            const [settings, templates] = results
            req.vessel.frontendBase = `${req.protocol}/${req.headers['x-forwarded-host']}/` || null
            req.vessel.backendBase = `${req.protocol}/${req.headers['x-forwarded-host']}/${settings.backend.firstUnique}/` || null
            req.vessel.settings = settings
            req.vessel.templates = templates

            var elapsed_ms = new Date().getTime() - start_ms
            console.log('time -> ', elapsed_ms)
    console.log('@@@', req.vessel)

            next()
        })
        .catch(err => {
            console.log(err)
            next(err)
        })
}

module.exports.getPath = (req, res, next) => {

    // パスを分解
    const pathString = req.path.trims('/')
    const segments = pathString.split('/')
    
    // pathsをコピーして退避
    let paths = segments.slice(0)

    // firstpathをチェック
    req.vessel.firstPath = paths[0]

    // 最後を取得
    let pathUnique = paths.pop() || req.vessel.frontendUnique

    // IDをチェッしてあれば取得
    const numberReg = /^\d*$/
    let pathNumber = ''

    // 最後のパスが数字の場合
    if (numberReg.test(pathUnique)) {
        pathNumber = pathUnique
        pathUnique = paths.pop() || frontendUnique
    }

    req.vessel.pathUnique = pathUnique
    req.vessel.pathNumber = pathNumber

    // パスの組み立て
    req.vessel.unique = pathNumber ? `${pathUnique}/${pathNumber}` : pathUnique

    req.vessel.paths.segments = segments
    next()
}
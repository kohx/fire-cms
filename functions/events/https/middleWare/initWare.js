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

    const vessel = {
        // get info
        frontendBase: null,
        backendBase: null,
        frontendUnique: null,
        backendUnique: null,
        signinUnique: null,
        wraps: null,
        parts: null,
        firstPath: null,
        // get path
        paths: null,
        firstPath: null,
        pathUnique: null,
        pathNumber: null,
        unique: null,
        // route
        thing: {},
        back: {
            signinUnique: null,
            unique: null,
            data: null,
        },
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

    // get wraps
    const getWraps = new Promise((resolve, reject) => {
        // キャッシュを取得
        const wraps = jsonCache.get('wraps')
        // キャッシュから取得できればそれを返す
        if (wraps != null) {
            resolve(wraps)
        }
        // ラップを取得
        admin.firestore().collection('wraps').get()
            .then(docs => {
                let wraps = {}
                docs.forEach(doc => {
                    const data = doc.data()
                    wraps[doc.id] = data.content
                })
                // キャッシュに入れる 
                jsonCache.set('wraps', wraps)
                // 結果を返す
                resolve(wraps)
            })
            .catch(err => reject(err))
    })

    // get parts
    const getParts = new Promise((resolve, reject) => {
        // キャッシュを取得
        const parts = jsonCache.get('parts')
        // キャッシュから取得できればそれを返す
        if (parts != null) {
            resolve(parts)
        }
        // パーツを取得
        admin.firestore().collection('parts').get()
            .then(docs => {
                let parts = {}
                docs.forEach(doc => {
                    const data = doc.data()
                    parts[doc.id] = data.content
                })
                // キャッシュに入れる 
                jsonCache.set('parts', parts)
                // 結果を返す
                resolve(parts)
            })
            .catch(err => reject(err))
    })

    var start_ms = new Date().getTime()

    Promise.all([getSettings, getWraps, getParts])
        .then(results => {
            const [settings, wraps, parts] = results
            vessel.frontendBase = `${req.protocol}/${req.headers['x-forwarded-host']}/` || null
            vessel.backendBase = `${req.protocol}/${req.headers['x-forwarded-host']}/${settings.config.backendUnique}/` || null
            vessel.frontendUnique = settings.config.frontendUnique
            vessel.backendUnique = settings.config.backendUnique
            vessel.signinUnique = settings.config.signinUnique
            vessel.lang = settings.config.lang
            vessel.wraps = wraps
            vessel.parts = parts
            vessel.back.signinUnique = settings.config.backendSigninUnique
            req.vessel = vessel

            // set lang
            if (settings.config.lang) {
                req.setLocale(settings.config.lang)
            }

            var elapsed_ms = new Date().getTime() - start_ms
            console.log('time -> ', elapsed_ms)
            next()
        })
        .catch(err => next(err))
}

module.exports.getPath = (req, res, next) => {

    // パスを分解
    const pathString = req.path.trims('/')
    req.vessel.paths = pathString.split('/')

    // pathsをコピーして退避
    let paths = req.vessel.paths.slice(0)

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

    next()
}
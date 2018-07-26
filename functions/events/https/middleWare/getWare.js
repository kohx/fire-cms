// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const url = require('url')
const path = require('path')
const cache = require('memory-cache')

module.exports.getInfo =
  (req, res, next) => {

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

    // config 関係
    const getConfigs = new Promise((resolve, reject) => {

      admin.firestore().collection('configs')
        .get()
        .then(docs => {
          let configs = {}
          docs.forEach((doc, key) => {
            configs[doc.id] = doc.data()
          })
          resolve(configs)
        })
        .catch(err => reject(err))
    })

    // get parts
    const getParts = new Promise((resolve, reject) => {

      // キャッシュを取得
      let parts = cache.get('parts')
      parts = (parts != null) ? JSON.parse(parts) : null

      if (parts != null) {
        
        parts.cache = true
        console.log('cached parts', parts)
        resolve(parts)
      }

      admin.firestore().collection('parts').get()
        .then(docs => {
          let parts = {}
          docs.forEach(doc => {
            const data = doc.data()
            parts[doc.id] = data.content
          })
          // キャッシュに入れる 
          cache.put('parts', JSON.stringify(parts))
          resolve(parts)
        })
        .catch(err => reject(err))
    })

    // get wraps
    const getWraps = new Promise((resolve, reject) => {
      admin.firestore().collection('wraps').get()
        .then(docs => {
          let wraps = {}
          docs.forEach(doc => {
            const data = doc.data()
            wraps[doc.id] = data.content
          })
          resolve(wraps)
        })
        .catch(err => reject(err))
    })

    var start_ms = new Date().getTime()
    Promise.all([getConfigs, getParts])
      .then(function (results) {
        const [configs, parts, wraps] = results
        // console.log('parts', parts)
        let vessel = {
          frontBaseUrl: req.headers['x-forwarded-host'] || null,
          frontendUnique: configs.settings.frontendUnique,
          backendUnique: configs.settings.backendUnique,
          signinUnique: configs.settings.signinUnique,
          parts: parts,
          wraps: wraps,
        }
        req.vessel = vessel
        var elapsed_ms = new Date().getTime() - start_ms
        console.log('time -> ', elapsed_ms)
        next()
      })
      .catch(err => next(err))
  }

function getCache(value) {
  if (!parent.system.cache) {
    return null
  }
  return cache.get(value)
}

function setCache(key, value) {
  if (!parent.system.cache) {
    return null
  }
  return cache.put(key, value)
}
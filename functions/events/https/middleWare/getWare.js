// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin

const url = require('url')
const path = require('path')

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

    const getThings = new Promise((resolve, reject) => {
      admin.firestore().collection('things')
        .get()
        .then(docs => {
          let things = {}
          docs.forEach((doc, key) => {
            things[doc.id] = doc.data()
          })
          resolve(things)
        })
        .catch(err => reject(err))
    })

    Promise.all([getConfigs, getThings])
      .then(function (results) {
        const [configs, things] = results

        let vessel = {
          frontBaseUrl: req.headers['x-forwarded-host'] || null,
          frontendUnique: configs.settings.frontendUnique,
          backendUnique: configs.settings.backendUnique,
          signinUnique: configs.settings.signinUnique,
          things: things,
          thingUniques: Object.keys(things)
        }
        req.vessel = vessel
        next()
      })
      .catch(err => next(err))
  }
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const wavebar = require('../modules/wavebar')

module.exports.notFound = (req, res, next) => {
  let err = new Error('Not Found.')
  err.status = 404
  next(err)
}

module.exports.internalServerError = (err, req, res, next) => {

  console.log('last: ', err)

  const status = err.status || 500
  res.status(status)
  admin.firestore().collection('things').doc(String(status)).get()
    .then(doc => {
      const thing = doc.data()
      if (doc.exists && thing.content) {
        req.vessel.thing = thing
        const params = {
          errStatus: err.status,
          errMessage: err.message,
          errStack: err.stack,
        }
        res.wbRender(params)
      } else {
        res.send(`<!doctype html>
                              <head>
                              <title>${err.status || 500}</title>
                              </head>
                              <body>
                              <h1>${err.status || 500} not from template!</h1>
                              <p>${err.message}</p>
                              <p>${err.stack}</p>
                              </body>
                          </html>`)
      }
    })
    .catch(err => {
      res.send(`<!doctype html>
                              <head>
                              <title>500</title>
                              </head>
                              <body>
                              <h1>500 from error!</h1>
                              <p>${err.message}</p>
                              <p>${err.stack}</p>
                              </body>
                          </html>`)
    })
}
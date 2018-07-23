const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin

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
      if (thing.content) {
        const renderd = wavebar.render(thing, {
          errStatus: err.status,
          errMessage: err.message,
        })
        res.send(renderd)
      } else {
        res.send(`<!doctype html>
                              <head>
                              <title>${err.status || 500}</title>
                              </head>
                              <body>
                              <h1>${err.status || 500}</h1>
                              <p>${err.message}</p>
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
                              <h1>500</h1>
                              <p>${err.message}</p>
                              </body>
                          </html>`)
    })
}
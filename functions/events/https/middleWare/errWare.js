const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

module.exports.notFound = (req, res, next) => {
    let err = new Error('Not Found.')
    err.status = 404
    next(err)
}

module.exports.internalServerError = (err, req, res, next) => {
    const status = err.status || 500
    res.status(status)
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
    console.log('<-----------------------------', 'error from err!')
}
const parent = require('../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

/* module */
const debug = require('../../../../modules/debug').debug

module.exports.notFound = (req, res, next) => {
    let err = new Error('Not Found.')
    err.status = 404
    next(err)
}

module.exports.internalServerError = (err, req, res, next) => {
    const status = err.status || 500
    debug(err, __filename, __line, true)
    res.status(status)
    res.send(`<!doctype html>
                              <head>
                              <title>${err.status || 500}</title>
                              </head>
                              <body>
                              <h1>${err.status || 500} not from template!</h1>
                              <p>${err.message}</p>
                              ${err.stack}
                              </body>
                          </html>`)
    console.log('\n\n\n<<<<<<<<<< app end error >>>>>>>>>>\n\n')
}
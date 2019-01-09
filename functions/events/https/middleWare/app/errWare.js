const parent = require('../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

/* module */
const debug = require('../../../../modules/debug').debug

// init
// サブルートで404に飛ばす場合これを使う
module.exports.setNotFound = (req, res, next) => {

    res.notFound = (message) => {
        let err = new Error(message)
        err.status = 404
        next(err)
    }

    next()
}

// 処理が存在しない場合
// 今回は入らない
module.exports.notFound = (req, res, next) => {
    let err = new Error(`Not Found.`)
    err.status = 404
    next(err)
}

// エラー表示の場合はここにすべて入る
module.exports.internalServerError = (err, req, res, next) => {
    const status = err.status || 500
    debug(`Error: ${status} -> ${err.message} \n\n ${err.stack}`, __filename, __line)
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
}
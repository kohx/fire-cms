const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const debug = require('../../../modules/debug').debug

/**
 * Error Message Json
 * 
 * @param {object} res 
 * @param {object} [err = null] 
 * @param {String|null} [message = null] 
 * @param {String|null} [filename = null] 
 * @param {String|null} [line = null] 
 */
function errorMessageJson(res, err = null, message = null, filename = null, line = null) {

    let selectedMessage = 'error !'
    // if has err object
    if (err) {
        // set error message
        selectedMessage = err.message
        // show debug log
        debug(err, filename, line)
    }

    // if there is not message set default message 
    selectedMessage = message != null ? message : 'error !'

    res.json({
        code: 'error',
        messages: [{
            key: null,
            content: res.__(selectedMessage),
        }]
    })

    return
}

/**
 * Invalid Message Json
 * 
 * @param {object} res 
 * @param {object} validationResult 
 */
function invalidMessageJson(res, validationResult) {
    // translate validation message and rebuild messages
    let messages = []
    Object.keys(validationResult.errors).forEach(key => {
        validationResult.errors[key].forEach(error => {
            // {key: xxx.xxx, content: 'asdf asdf asdf.'}
            messages.push({
                key: key,
                content: res.__(error.message, error.params)
            })
        })
    })

    // send json
    res.json({
        code: validationResult.status,
        messages,
    })

    return
}

/**
 * Success Message Json
 * 
 * @example
 * successMessageJson(res, 'Successfully created new thing.', 'create', {id})
 * successMessageJson(res, 'is updated.', 'update', body)
 * successMessageJson(res, 'Successfully deleted.', 'delete', {id})
 * successMessageJson(res, 'Successfully created new thing.', 'create', {id})
 * successMessageJson(res, 'Successfully created new thing.', 'create', {id})
 * 
 * @param {object} res 
 * @param {string} message 
 * @param {any} mode create update delete signin signout
 * @param {object} [data = {}]
 */
function successMessageJson(res, message, mode, data = {}) {

    let messages = []
    let updateData = {}

    if (typeof mode === 'string') {
        mode = [mode]
    }

    if (mode.includes('update')) {
        Object.keys(data).forEach(key => {
            // {key: xxx.xxx, content: 'asdf asdf asdf.'}
            if (key !== 'id') {
                messages.push({
                    key,
                    content: res.__(`{{key}} ${message}`, {
                        key
                    })
                })
                updateData[key] = data[key]
            }
        })
    } else {
        updateData = data

        messages.push({
            key: null,
            content: res.__(message),
        })
    }

    res.json({
        code: 'success',
        messages,
        data: updateData,
    })

    return
}

/**
 * Signout and Success Message Json
 * 
 * @param {object} req 
 * @param {object} res 
 * @param {string} message 
 * @param {object} effect 
 */
function signoutMessageJson(req, res, message, effect = null) {

    let messages = [{
        key: null,
        content: res.__(message),
    }]
    let values = {}

    // セッション Cookie を取得
    const session = (req.cookies.__session != null) ? JSON.parse(req.cookies.__session) : []
    const sessionCookie = (session['sessionCookie'] != null) ? session['sessionCookie'] : false

    if (!sessionCookie) {
        return errorMessageJson(res, null, 'there is not sessionCookie.')
    }
    // セッションをクリア
    res.clearCookie('__session')

    return admin.auth().verifySessionCookie(sessionCookie)
        .then(decodedClaims => {
            return admin.auth().revokeRefreshTokens(decodedClaims.sub)
        })
        .then(_ => {
            res.json({
                code: 'success',
                messages,
                values,
                effect,
            })
        })
        .catch(err => errorMessageJson(res, err, null, __filename, __line))
}

/**
 * Filter Dody
 * 
 * @param {object} body 
 * @param {array} allowaKeys 
 * @param {array} [intKeys = []] 
 */

function filterDody(body, allowaKeys, intKeys = []) {
    const params = {}

    Object.keys(body).forEach(key => {
        if (allowaKeys.includes(key)) {
            let value = body[key]
            if (intKeys.length !== 0 && intKeys.includes(key)) {
                value = Number(value)
            }
            params[key] = value
        }
    })
    return params
}

// exports
exports.errorMessageJson = errorMessageJson
exports.invalidMessageJson = invalidMessageJson
exports.successMessageJson = successMessageJson
exports.signoutMessageJson = signoutMessageJson
exports.filterDody = filterDody
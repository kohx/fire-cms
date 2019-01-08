const debug = require('../../../modules/debug').debug

/**
 * Error Message Json
 * 
 * @param {Object} res 
 * @param {Object} [err = null] 
 * @param {String|null} [message = null] 
 * @param {String|null} [filename = null] 
 * @param {String|null} [line = null] 
 */
function errorMessageJson(res, err = null, message = null, filename = null, line = null) {
    if (err) {
        message = err.message
        debug(err.message, filename, line)
    }

    message = message != null ? message : 'error !'

    res.json({
        code: 'error',
        messages: [{
            key: null,
            content: res.__(message),
        }]
    })
}

/**
 * Invalid Message Json
 * 
 * @param {Object} res 
 * @param {Object} validationResult 
 */
function invalidMessageJson(res, validationResult) {
    // translate validation message and rebuild messages
    let messages = []
    Object.keys(validationResult.errors).forEach(key => {
        validationResult.errors[key].forEach(error => {
            // {path: xxx.xxx, message: 'asdf asdf asdf.'}
            // change to 
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
}

/**
 * Success Message Json
 * 
 * @example
 *  successMessageJson(res, 'Successfully created new thing.', body, {mode: 'create', id: id})
 *  successMessageJson(res, '{{key}} is updated.', body)
 * 
 * @param {object} res 
 * @param {string} message 
 * @param {object|null} [body = null] 
 * @param {object|null} [effect = null]
 */
function successMessageJson(res, message, body = null, effect = null) {

    let messages = []
    let values = {}
debug(body, __filename, __line)
    if (body != null) {
        Object.keys(body).forEach(key => {
            // {path: xxx.xxx, message: 'asdf asdf asdf.'}
            // change to 
            // {key: xxx.xxx, content: 'asdf asdf asdf.'}
            if (key !== 'id') {
                messages.push({
                    key,
                    content: res.__(`{{key}} ${message}`, {
                        key
                    })
                })
                values[key] = body[key]
            }
        })
    } else {
        messages.push({
            key: null,
            content: res.__(message),
        })
    }

    res.json({
        code: 'success',
        messages,
        values,
        effect,
    })
}

/**
 * Filter Dody
 * 
 * @param {Object} body 
 * @param {Array} allowaKeys 
 * @param {Array} [intKeys = []] 
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
exports.filterDody = filterDody

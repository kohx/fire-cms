const debug = require('../../../../modules/debug').debug

/**
 * Error Message Json
 * 
 * @param {Object} res 
 * @param {Object} [err = null] 
 * @param {String} [message = null] 
 * @param {String} [filename = null] 
 * @param {String} [line = null] 
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
                key: error.path,
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
 *  successMessageJson(res, 'Successfully created new thing.', 'create', {}, { id })
 *  successMessageJson(res, '{{key}} is updated.', 'update', body)
 * 
 * @param {Object} res 
 * @param {String} message 
 * @param {String} mode 
 * @param {Object} [body = {}]
 * @param {String} [effected = null]
 */
function successMessageJson(res, message, mode, body = {}, effected = null) {

    let messages = []
    let values = {}

    if (Object.keys(body) !== 0) {
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
        messages.pash({
            key: null,
            content: res.__(`Successfully created new thing.`),
        })
    }

    res.json({
        code: 'success',
        mode: mode,
        messages,
        values,
        effected,
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

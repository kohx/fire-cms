const debug = require('../../../../modules/debug').debug

exports.errorMessageJson = (res, err = null, content = null, filename = null, line = null) => {
    if (err) {
        content = err.message
        debug(err.message, filename, line)
    }

    content = content != null ? content : 'error !'

    res.json({
        code: 'error',
        messages: [{
            key: null,
            content,
        }]
    })
}

exports.invalidMessageJson = (res, req, validationResult) => {
    // translate validation message and rebuild messages
    let messages = []
    Object.keys(validationResult.errors).forEach(key => {
        validationResult.errors[key].forEach(error => {
            // {path: xxx.xxx, message: 'asdf asdf asdf.'}
            // change to 
            // {key: xxx.xxx, content: 'asdf asdf asdf.'}
            messages.push({
                key: error.path,
                content: req.__(error.message, error.params)
            })
        })
    })

    // send json
    res.json({
        code: validationResult.status,
        messages,
    })
}
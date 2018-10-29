const parent = require('../../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const url = require('url')

const validation = require('../../../../../modules/validation')
const debug = require('../../../../../modules/debug').debug

module.exports.index = (req, res, next) => {

    admin.firestore().collection('settings').get()
        .then(docs => {
            const targets = {}
            docs.forEach(doc => {
                targets[doc.id] = doc.data()
            })

            targets.lang.locales = targets.lang.locales.join(',')

            req.vessel.thing.targets = targets
            next()
        })
        .catch(err => {
            debug(err, __filename, __line)
            next(err)
        })
}

module.exports.update = (req, res, next) => {

    const settings = req.body
    const validate = validation.list(req.body)
    
    /* assets */
    if (settings.asset != null) {
        const asset = settings.asset

        if(asset.landscapePrefix != null){
            validate.test('asset.landscapePrefix', 'isRequired')
            validate.sanitize('asset.landscapePrefix', 'trim')
        }
        if(asset.landscapeSize != null){
            validate.test('asset.landscapeSize', 'isRequired')
            validate.sanitize('asset.landscapeSize', 'trim')
        }
        if(asset.portraitPrefix != null){
            validate.test('asset.portraitPrefix', 'isRequired')
            validate.sanitize('asset.portraitPrefix', 'trim')
        }
        if(asset.portraitSize != null){
            validate.test('asset.portraitSize', 'isRequired')
            validate.sanitize('asset.portraitSize', 'trim')
        }
        if(asset.squarePrefix != null){
            validate.test('asset.squarePrefix', 'isRequired')
            validate.sanitize('asset.squarePrefix', 'trim')
        }
        if(asset.squareSize != null){
            validate.test('asset.squareSize', 'isRequired')
            validate.sanitize('asset.squareSize', 'trim')
        }
        if(asset.thumbPrefix != null){
            validate.test('asset.thumbPrefix', 'isRequired')
            validate.sanitize('asset.thumbPrefix', 'trim')
        }
        if(asset.thumbSize != null){
            validate.test('asset.thumbSize', 'isRequired')
            validate.sanitize('asset.thumbSize', 'trim')
        }
    }
    /* frontend */
    if (settings.frontend != null) {
        const frontend = settings.frontend

        if(frontend.lang != null){
            validate.test('frontend.lang', 'isRequired')
            validate.sanitize('frontend.lang', 'trim')
        }
    }
    /* backend */
    if (settings.backend != null) {
        const backend = settings.backend
        
        if(backend.lang != null){
            validate.test('backend.lang', 'isRequired')
            validate.sanitize('backend.lang', 'trim')
        }
    }
    /* lang */


    valid = validate.check()
    debug(valid, __filename, __line)

    // landscapePrefix
    // "l_"
    // landscapeSize
    // "800x640"
    // portraitPrefix
    // "p_"
    // portraitSize
    // "640x800"
    // squarePrefix
    // "s_"
    // squareSize
    // "640x640"
    // thumbPrefix
    // "t_"
    // thumbSize
    // "100x100"

    // set validations

    // const settings = req.body
    // Object.keys(settings).forEach(docKey => {
    //     doc = settings[docKey]

    //     Object.keys(doc).forEach(valueKey => {
    //         value = doc[valueKey]
    //         debug(value, __filename, __line)
    //     })
    // })

    res.json({
        status: true,
        message: 'ok',
        value: req.body
    })
}
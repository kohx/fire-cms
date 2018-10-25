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
        .test('asset.landscapePrefix', 'isRequired')

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
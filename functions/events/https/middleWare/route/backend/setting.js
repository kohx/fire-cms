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

        if (asset.landscapePrefix != null) {
            validate.test('asset.landscapePrefix', 'isRequired')
            validate.test('asset.landscapePrefix', 'isAlnumunder')
            validate.sanitize('asset.landscapePrefix', 'trim')
        }
        if (asset.landscapeSize != null) {
            validate.test('asset.landscapeSize', 'isRequired')
            validate.test('asset.landscapeSize', 'isAlphanumeric')
            validate.sanitize('asset.landscapeSize', 'trim')
        }
        if (asset.portraitPrefix != null) {
            validate.test('asset.portraitPrefix', 'isRequired')
            validate.test('asset.portraitPrefix', 'isAlnumunder')
            validate.sanitize('asset.portraitPrefix', 'trim')
        }
        if (asset.portraitSize != null) {
            validate.test('asset.portraitSize', 'isRequired')
            validate.test('asset.portraitSize', 'isAlphanumeric')
            validate.sanitize('asset.portraitSize', 'trim')
        }
        if (asset.squarePrefix != null) {
            validate.test('asset.squarePrefix', 'isRequired')
            validate.test('asset.squarePrefix', 'isAlnumunder')
            validate.sanitize('asset.squarePrefix', 'trim')
        }
        if (asset.squareSize != null) {
            validate.test('asset.squareSize', 'isRequired')
            validate.test('asset.squareSize', 'isAlphanumeric')
            validate.sanitize('asset.squareSize', 'trim')
        }
        if (asset.thumbPrefix != null) {
            validate.test('asset.thumbPrefix', 'isRequired')
            validate.test('asset.thumbPrefix', 'isAlnumunder')
            validate.sanitize('asset.thumbPrefix', 'trim')
        }
        if (asset.thumbSize != null) {
            validate.test('asset.thumbSize', 'isRequired')
            validate.test('asset.thumbSize', 'isAlphanumeric')
            validate.sanitize('asset.thumbSize', 'trim')
        }
    }
    /* frontend */
    if (settings.frontend != null) {
        const frontend = settings.frontend

        if (frontend.lang != null) {
            validate.test('frontend.lang', 'isRequired')
            validate.sanitize('frontend.lang', 'trim')
        }
        if (frontend.signinUnique != null) {
            validate.test('frontend.signinUnique', 'isRequired')
            validate.sanitize('frontend.signinUnique', 'trim')
        }
        if (frontend.topUnique != null) {
            validate.test('frontend.topUnique', 'isRequired')
            validate.sanitize('frontend.topUnique', 'trim')
        }
    }
    /* backend */
    if (settings.backend != null) {
        const backend = settings.backend

        if (backend.lang != null) {
            validate.test('backend.lang', 'isRequired')
            validate.sanitize('backend.lang', 'trim')
        }
        if (backend.signinUnique != null) {
            validate.test('backend.signinUnique', 'isRequired')
            validate.sanitize('backend.signinUnique', 'trim')
        }
        if (backend.topUnique != null) {
            validate.test('backend.topUnique', 'isRequired')
            validate.sanitize('backend.topUnique', 'trim')
        }
        if (backend.firstPath != null) {
            validate.test('backend.firstPath', 'isRequired')
            validate.sanitize('backend.firstPath', 'trim')
        }
        if (backend.expiresIn != null) {
            validate.test('backend.expiresIn', 'isRequired')
            validate.sanitize('backend.expiresIn', 'trim')
        }
        if (backend.signinLImit != null) {
            validate.test('backend.signinLImit', 'isRequired')
            validate.sanitize('backend.signinLImit', 'trim')
        }
    }
    /* lang */
    if (settings.lang != null) {
        const lang = settings.lang

        if (lang.default != null) {
            validate.test('lang.default', 'isRequired')
            validate.sanitize('lang.default', 'trim')
        }
        if (lang.dirname != null) {
            validate.test('lang.dirname', 'isRequired')
            validate.sanitize('lang.dirname', 'trim')
        }
        if (lang.locales != null) {
        }
    }

    valid = validate.check()
    let messages = []
    // validation not passed
    if (!valid.status) {

        // translate validation message
        Object.keys(valid.errors).forEach(key => {
            valid.errors[key].forEach(error => {
                messages.push({ key: error.path, message: req.__(error.message, error.params) })
            })
        })
        res.json({
            status: valid.status,
            title: req.__('chack this!'),
            messages: messages,
            value: valid.values
        })
    } else {

        const settingsRef = admin.firestore().collection('settings')
        const values = valid.values
        let updates = []

        Object.keys(values).forEach(docKey => {
            docValues = values[docKey]
            const updateDoc = settingsRef.doc(docKey).update(docValues)
            updates.push(updateDoc)

            Object.keys(docValues).forEach(valueKey => {
                messages.push(req.__('{{docKey}} {{valueKey}} is updated.', { docKey, valueKey }))
            })
        })

        Promise.all(updates)
            .then(results => {
                debug(results, __filename, __line)
                res.json({
                    status: true,
                    title: req.__('update success!'),
                    messages: messages,
                    value: valid.values
                })
            })
            .catch(err => {
                debug(err, __filename, __line)
                res.json({
                    status: false,
                    title: req.__('update failed!'),
                    messages: [err.message],
                    value: valid.values
                })
            })
    }

}
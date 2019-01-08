const parent = require('../../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const debug = require('../../../../../modules/debug').debug
const validation = require('../../../../../modules/validation')
const util = require('../../util')

/* promise catch error message json */
const errorMessageJson = util.errorMessageJson

/* build json messages from validation invalid messages */
const invalidMessageJson = util.invalidMessageJson

/* build success json messages */
const successMessageJson = util.successMessageJson

/* filter body */
const filterDody = util.filterDody

module.exports.index = (req, res, next) => {

    admin.firestore().collection('settings')
        .orderBy('order', 'asc').get()
        .then(docs => {
            const targets = {}
            docs.forEach(doc => {
                targets[doc.id] = {}
                docData = doc.data()
                Object.keys(docData).sort().forEach(key => {
                    targets[doc.id][key] = docData[key]
                })
                //seconds of UTC time since Unix epoch
                // debug(doc.createTime.seconds, __filename, __line)
                // debug(doc.updateTime.seconds, __filename, __line)

                //fractions of a second at nanosecond resolution, 0 to 999,999,999
                // debug(doc.createTime.nanoseconds, __filename, __line)
                // debug(doc.updateTime.nanoseconds, __filename, __line)

                // targets[doc.id] = doc.data()
            })

            // array to string
            // targets.lang.locales = targets.lang.locales.join(', ')
            // targets.general.roles = targets.general.roles.join(', ')


            req.vessel.thing.targets = targets
            next()
        })
        .catch(err => {
            debug(err, __filename, __line)
            next(err)
        })
}

/**
 * setting update
 * 
 */
module.exports.update = (req, res, next) => {

    // body
    const body = req.body

    // set orderbalidation
    const validate = validation.list(body)

    // get set locales
    const locales = body['lang.locales'] != null ? body['lang.locales'] : req.vessel.get('settings.lang.locales', [])
    const frontendLnag = body['frontend.lang'] != null ? body['frontend.lang'] : req.vessel.get('settings.frontend.lang', [])
    const backendLnag = body['backend.lang'] != null ? body['backend.lang'] : req.vessel.get('settings.backend.lang', [])
    const defaultLnag = body['lang.default'] != null ? body['lang.default'] : req.vessel.get('settings.lang.default', [])

    // assets
    if (body.hasOwnProperty('asset.landscapePrefix')) {
        validate
            .valid('asset.landscapePrefix', 'isRequired')
            .valid('asset.landscapePrefix', 'isAlnumunder')
    }
    if (body.hasOwnProperty('asset.landscapeSize')) {
        validate
            .valid('asset.landscapeSize', 'isRequired')
            .valid('asset.landscapeSize', 'isAlnumunder')
    }
    if (body.hasOwnProperty('asset.portraitPrefix')) {
        validate
            .valid('asset.portraitPrefix', 'isRequired')
            .valid('asset.portraitPrefix', 'isAlnumunder')
    }
    if (body.hasOwnProperty('asset.portraitSize')) {
        validate
            .valid('asset.portraitSize', 'isRequired')
            .valid('asset.portraitSize', 'isAlphanumeric')
    }
    if (body.hasOwnProperty('asset.squarePrefix')) {
        validate
            .valid('asset.squarePrefix', 'isRequired')
            .valid('asset.squarePrefix', 'isAlnumunder')
    }
    if (body.hasOwnProperty('asset.squareSize')) {
        validate
            .valid('asset.squareSize', 'isRequired')
            .valid('asset.squareSize', 'isAlphanumeric')
    }
    if (body.hasOwnProperty('asset.thumbPrefix')) {
        validate
            .valid('asset.thumbPrefix', 'isRequired')
            .valid('asset.thumbPrefix', 'isAlnumunder')
    }
    if (body.hasOwnProperty('asset.thumbSize')) {
        validate
            .valid('asset.thumbSize', 'isRequired')
            .valid('asset.thumbSize', 'isAlphanumeric')
    }

    /* frontend */
    if (body.hasOwnProperty('frontend.lang')) {
        validate
            .valid('frontend.lang', 'isRequired')
            .valid('frontend.lang', 'isIn', locales)
    }
    if (body.hasOwnProperty('frontend.signinUnique')) {
        validate.valid('frontend.signinUnique', 'isRequired')
    }
    if (body.hasOwnProperty('frontend.topUnique')) {
        validate.valid('frontend.topUnique', 'isRequired')
    }

    /* backend */
    if (body.hasOwnProperty('backend.lang')) {
        validate
            .valid('backend.lang', 'isRequired')
            .valid('backend.lang', 'isIn', locales)
    }
    if (body.hasOwnProperty('backend.signinUnique')) {
        validate.valid('backend.signinUnique', 'isRequired')
    }
    if (body.hasOwnProperty('backend.topUnique')) {
        validate.valid('backend.topUnique', 'isRequired')
    }
    if (body.hasOwnProperty('backend.firstPath')) {
        validate.valid('backend.firstPath', 'isRequired')
    }
    if (body.hasOwnProperty('backend.expiresIn')) {
        validate.valid('backend.expiresIn', 'isRequired')
    }
    if (body.hasOwnProperty('backend.signinLImit')) {
        validate.valid('backend.signinLImit', 'isRequired')
    }

    /* lang */
    if (body.hasOwnProperty('lang.default')) {
        validate
            .valid('lang.default', 'isRequired')
            .valid('lang.default', 'isIn', locales)
    }
    if (body.hasOwnProperty('lang.dirname')) {
        validate.valid('lang.dirname', 'isRequired')
    }
    if (body.hasOwnProperty('lang.locales')) {
        validate
            .valid('lang.locales', 'isNotBlankObject')
            .valid('lang.locales', 'isArray')
            .valid('lang.locales', 'isAllInUse', backendLnag, req.__('backend lang'))
            .valid('lang.locales', 'isAllInUse', frontendLnag, req.__('frontend lang'))
            .valid('lang.locales', 'isAllInUse', defaultLnag, req.__('default lang'))
    }

    valid = validate.get()
    let messages = []

    // validation invalid
    if (!valid.check) {
        // send invalid messages json
        invalidMessageJson(res, valid)
    } else {
        const settingsRef = admin.firestore().collection('settings')

        // build settings from body
        let settings = {}
        Object.keys(body).forEach(key => {
            const value = body[key]
            const [doc, field] = key.split('.')
            if (!settings.hasOwnProperty(doc)) {
                settings[doc] = {}
            }
            settings[doc][field] = value
        })

        // set promise to updates
        let updates = []
        Object.keys(settings).forEach(key => {
            const updateDoc = settingsRef.doc(key).update(settings[key])
            updates.push(updateDoc)
        })

        Promise.all(updates)
            .then(_ => {
                // send seccess message
                successMessageJson(res, 'is updated.', body)
            })
            .catch(err => errorMessageJson(res, err, null, __filename, __line))
    }

}
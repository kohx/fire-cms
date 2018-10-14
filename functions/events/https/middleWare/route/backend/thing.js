const parent = require('../../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const url = require('url')

const debug = require('../../../../../modules/debug').debug

module.exports.index = (req, res, next) => {

    const segments = req.vessel.get('paths.segments')
    const target = segments.shift()
    const thing = req.vessel.get('thing')
    
    if (!target) {
        next()
    } else {

        admin.firestore().collection('things').doc(target).get()
            .then(doc => {
                const target = doc.data()

                target.content = target.content.replace(/\\n/g, '&#13;')

                thing.target = target
                next()
            })
            .catch(err => {
                debug(err, __filename, __line)
                next(err)
            })
    }
}
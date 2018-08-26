// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const validation = require('../../../modules/validation')
const uploadBase64 = require('../../../modules/uploadBase64')

module.exports = (req, res, next) => {
    console.log('<<<<<<<<<< start backend updateAsset >>>>>>>>>>\n\n')
    //     // console.log('@@@', res.__('Hello'))
    //     // console.log('@@@', res.__('yes'))
    //     // console.log('@@@', req.__('Hello {{name}}', { name: 'kohei' }))
    //     // console.log('@@@', res.__({ phrase: 'Hello {{name}}', locale: 'ja' }, { name: 'こうへい' }))
    //     // console.log('@@@', res.__l('Hello'))
    //     // console.log('@@@', res.__h('Hello'))
    //     // console.log('@@@', res.__('greeting.formal'))
    //     // console.log('@@@', res.__('greeting.informal'))     

    // catch error end becose endpoint
    const assetsStoreRef = admin.firestore().collection('assets')

    try {
        const messages = []
        let status = false

        const validate = validation.list(req.body)
            .test('unique', 'isRequired')
            .test('unique', 'isLength', 1, 256)
            .test('unique', 'isAlnumunder')
            .test('name', 'isLength', 1, 256)
            .test('content', 'isBase64')
            .check()

        // validation not passed
        if (!validate.status) {
            Object.keys(validate.errors).forEach(key => {
                validate.errors[key].forEach(error => {
                    messages.push(req.__(error.message, error.params))
                })
            })
            res.json({
                status,
                messages,
            })
        } else {
            assetsStoreRef.doc(validate.values.unique).get()
                .then(doc => {
                    // already use unique
                    if (doc.exists) {
                        messages.push(req.__('{{param1}} is already used.', {
                            param1: 'unique'
                        }))
                        res.json({
                            status,
                            messages,
                        })
                    } else {
                        const assetPath = `assets/${validate.values.unique}`
                        uploadBase64.fact(validate.values.content)
                            .setMeta({})
                            .upload(assetPath)
                            .then(result => {
                                // set firestore
                                doc.ref.set({
                                        path: assetPath,
                                        unique: validate.values.unique,
                                        name: validate.values.name,
                                        description: validate.values.description,
                                        type: validate.values.type,
                                    })
                                    .then(result => {
                                        console.log()
                                        res.json({
                                            status: true,
                                            messages: [req.__('update success!')]
                                        })
                                    })
                                    .catch(err => {
                                        throw new Error('updateAsset: insert stora error!')
                                    })
                            })
                            .catch(err => {
                                throw new Error('updateAsset: upload error!')
                            })
                    }
                })
                .catch(err => {
                    throw new Error('updateAsset: get unique error!')
                })
        }

    } catch (err) {
        console.log('<<<<<<<<<< error backend updateAsset >>>>>>>>>>\n\n')
        console.log(err)
        res.json({
            status: false,
            message: [err.message],
        })
    }
}
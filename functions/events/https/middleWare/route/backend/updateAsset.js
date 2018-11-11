// firebase
const parent = require('../../../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const validation = require('../../../../../modules/validation')
const uploadBase64 = require('../../../../../modules/uploadBase64')

module.exports = (req, res, next) => { 

    // catch error end becose endpoint
    const assetsStoreRef = admin.firestore().collection('assets')

    try {
        const assetPath = `assets`
        let status = true
        let messages = []
        let valid = {}
        Promise.resolve()
            .then(_ => {
                // document get from asset store
                if (req.body.unique) {
                    return assetsStoreRef.doc(req.body.unique).get()
                }
            })
            .then(doc => {
                // set validations
                const validate = validation.list(req.body)
                    .test('unique', 'isRequired')
                    .test('unique', 'isLength', 1, 256)
                    .test('name', 'isLength', 1, 256)
                    .test('content', 'isBase64')

                // if get document then set this for validation message
                if (doc && doc.exists) {
                    validate.test('unique', 'notUse', doc.id)
                }

                // check validate
                valid = validate.check()

                // validation not passed
                if (!valid.status) {
                    Object.keys(valid.errors).forEach(key => {
                        valid.errors[key].forEach(error => {
                            status = valid.status
                            messages.push(req.__(error.message, error.params))
                        })
                    })
                }
            })
            .then(_ => {
                if (status) {
                    assetsStoreRef.doc(valid.values.unique).set({
                        path: assetPath,
                        unique: valid.values.unique,
                        name: valid.values.name,
                        description: valid.values.description,
                        type: valid.values.type,
                        createdAt: new Date(),
                        updatedAT: new Date(),
                        deletedAt: null,
                        otherSize: {
                            thumb: false,
                            square: false,
                            landscape: false,
                            portrait: false,
                        }
                    })
                }
            })
            .then(_ => {
                if (status) {
                    return uploadBase64.fact(valid.values.content)
                        .setMeta({ name: 'kohei' })
                        .upload(assetPath, valid.values.unique)
                }
            })
            .then(valid => {
                console.log('----->', messages)
                res.json({
                    status,
                    messages,
                })
            })
            .catch(err => {
                throw err
            })



        //         assetsStoreRef.doc(validate.values.unique).get()
        //             .then(doc => {
        //                 // already use unique
        //                 if (doc.exists) {
        //                     messages.push(req.__('{{param1}} is already used.', {
        //                         param1: 'unique'
        //                     }))
        //                     res.json({
        //                         status,
        //                         messages,
        //                     })
        //                 } else {
        //                     const assetPath = `assets`
        //                     uploadBase64.fact(validate.values.content)
        //                         .setMeta({ name: 'kohei' })
        //                         .upload(assetPath, validate.values.unique)
        //                         .then(() => {
        //                             // set firestore
        //                             doc.ref.set({
        //                                 path: assetPath,
        //                                 unique: validate.values.unique,
        //                                 name: validate.values.name,
        //                                 description: validate.values.description,
        //                                 type: validate.values.type,
        //                                 createdAt: new Date(),
        //                                 updatedAT: new Date(),
        //                                 deletedAt: null,
        //                                 otherSize: {
        //                                     thumb: false,
        //                                     square: false,
        //                                     landscape: false,
        //                                     portrait: false,
        //                                 }
        //                             })
        //                                 .then(result => {
        //                                     res.json({
        //                                         status: true,
        //                                         messages: [req.__('update success!')]
        //                                     })
        //                                 })
        //                                 .catch(err => {
        //                                     throw new Error('updateAsset error: insert stora error!')
        //                                 })
        //                         })
        //                         .catch(err => {
        //                             console.log(err)
        //                             throw new Error('updateAsset error: upload error!')
        //                         })
        //                 }
        //             })
        //             .catch(err => {
        //                 console.log(err)
        //                 throw new Error('updateAsset error: get unique error!')
        //             })

    } catch (err) {
        console.log(err)
        res.json({
            status: false,
            message: [err.message],
        })
    }
}
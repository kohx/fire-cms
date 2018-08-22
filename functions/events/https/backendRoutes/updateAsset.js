// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const stream = require('stream');
const validation = require('../../../modules/validation')

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
    try {
        const messages = []
        let status = false

        const validate = validation.list(req.body)
            .test('unique', 'isRequired')
            .test('unique', 'isLength', 1, 256)
            .test('unique', 'isAlnumunder')
            .test('name', 'isLength', 1, 256)
            // .test('content', 'isBase64')
            .check()

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
            admin.firestore().collection('assets').doc(validate.values.unique).get()
                .then(doc => {
                    if (doc.exists) {
                        messages.push(req.__('{{param1}} is already used.', { param1: 'unique' }))
                        res.json({
                            status,
                            messages,
                        })
                    } else {

                        doc.ref.set({
                            unique: validate.values.unique,
                            name: validate.values.name,
                            description: validate.values.description,
                            type: validate.values.type,
                        })
                            .then(result => {
                                console.log(result)
                                res.json({
                                    status: true,
                                    messages: [req.__('update success!')]
                                })
                            })
                            .catch(err => {
                                throw err
                            })


                        const buf = new Buffer(validate.values.content, 'base64')
                        const bufferStream = new stream.PassThrough()
                        bufferStream.end(buf)

                        const bucket = admin.storage().bucket();
                        const bucketFile = bucket.file(validate.values.unique)

                        bufferStream.pipe(bucketFile.createWriteStream({
                            metadata: {
                                contentType: validate.values.type,
                                metadata: {
                                    custom: 'metadata'
                                }
                            },
                            public: true,
                        }))
                            .on('error', function (err) {
                                console.log('!!!!!!!!!!!!!!')
                            })
                            .on('finish', function () {
                                console.log('fin')
                            });
                    }
                })
                .catch(err => {
                    throw err
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
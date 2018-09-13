// firebase
const parent = require('../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const spawn = require('child-process-promise').spawn
const gcs = require('@google-cloud/storage')()
const path = require('path')
const os = require('os')
const fs = require('fs')

exports.updateAsset = functions.storage.object()
    .onFinalize(object => {
        console.log('<1> storage onFinalize')

        const types = {
            thumb: { prefix: 't_', size: '100x100', temp: null, storage: null },
            square: { prefix: 's_', size: '640x640', temp: null, storage: null },
            landscape: { prefix: 'l_', size: '800x640', temp: null, storage: null },
            portrait: { prefix: 'p_', size: '640x800', temp: null, storage: null },
        }

        // The Storage bucket that contains the file.
        const fileBucket = object.bucket
        // File path in the bucket.
        const filePath = object.name
        // File content type.
        const contentType = object.contentType
        // Number of times metadata has been generated. New objects have a value of 1.
        const metageneration = object.metageneration

        // Exit if this is triggered on a file that is not an image.
        if (!contentType.startsWith('image/')) {
            console.log('<start> This is not an image.')
            return 0
        }

        // Get the file name.
        const fileName = path.basename(filePath)
        // Get tmpdir
        const tmpdir = os.tmpdir()
        // Get temp file path
        const tempPath = path.join(tmpdir, fileName)
        // バケット名
        const bucket = gcs.bucket(fileBucket)

        // サムネイルの場合は終了
        if (
            fileName.startsWith(types.thumb.prefix)
            || fileName.startsWith(types.square.prefix)
            || fileName.startsWith(types.landscape.prefix)
            || fileName.startsWith(types.portrait.prefix)
        ) {
            console.log('<skip> Already a created.')
            return 0
        }

        const createImage = (type) => {
            return new Promise((resolve, reject) => {
                target = types[type]
                const args = [
                    tempPath,
                    '-thumbnail',
                    `${target.size}^`,
                    '-gravity',
                    'center',
                    '-extent',
                    target.size,
                    target.temp,
                ]

                spawn('convert', args, { capture: ['stdout', 'stderr'] })
                    .then(result => {
                        console.log(`<4> ${type} image ${target.size} created`)
                        resolve(true)
                    })
                    .catch(err => reject(err))
            })
        }

        const updateImage = (type) => {
            return new Promise((resolve, reject) => {
                target = types[type]
                bucket.upload(target.temp, {
                    destination: target.storage,
                    metadata: {
                        contentType: contentType
                    },
                })
                    .then(result => {
                        return admin.firestore().collection('assets').doc(fileName).get()
                    })
                    .then(snap => {
                        const data = snap.data()
                        const otherSize = data.otherSize
                        otherSize[type] = true
                        return snap.ref.update({otherSize: otherSize})
                    })
                    .then(result => {
                        console.log(`<5> ${type} image created at ${target.storage}`)
                        fs.unlinkSync(target.temp)
                        console.log(`<6> ${type} image local file ${target.temp} deleted`)
                        resolve(true)
                    })
                    .catch(err => reject(err))
            })
        }

        admin.firestore().collection('configs').doc('asset').get()
            .then(doc => {
                console.log('<2> Get config')
                const config = doc.data()

                if (config.thumbPrefix) { types.thumb.prefix = config.thumbPrefix }
                if (config.thumbSize) { types.thumb.size = config.thumbSize }
                if (config.squarePrefix) { types.square.prefix = config.squarePrefix }
                if (config.squareSize) { types.square.size = config.squareSize }
                if (config.landscapePrefix) { types.landscape.prefix = config.landscapePrefix }
                if (config.landscapeSize) { types.landscape.size = config.landscapeSize }
                if (config.portraitPrefix) { types.portrait.prefix = config.portraitPrefix }
                if (config.portraitSize) { types.portrait.size = config.portraitSize }

                // thumb
                types.thumb.temp = path.join(tmpdir, `${types.thumb.prefix}${fileName}`)
                types.thumb.storage = path.join(path.dirname(filePath), `${types.thumb.prefix}${fileName}`)
                // square
                types.square.temp = path.join(tmpdir, `${types.square.prefix}${fileName}`)
                types.square.storage = path.join(path.dirname(filePath), `${types.square.prefix}${fileName}`)
                // landscape
                types.landscape.temp = path.join(tmpdir, `${types.landscape.prefix}${fileName}`)
                types.landscape.storage = path.join(path.dirname(filePath), `${types.landscape.prefix}${fileName}`)
                // portrait
                types.portrait.temp = path.join(tmpdir, `${types.portrait.prefix}${fileName}`)
                types.portrait.storage = path.join(path.dirname(filePath), `${types.portrait.prefix}${fileName}`)

                return true
            })
            .then(() => {
                console.log('<3> Image download locally to', tempPath)
                return bucket.file(filePath)
                    .download({
                        destination: tempPath,
                    })
            })
            // ImageMagickを使用して各イメージを生成
            .then(() => {
                return createImage('thumb')
            })
            // 各イメージをストレージにアップロード
            .then(() => {
                return updateImage('thumb')
            })
            .then(() => {
                return createImage('square')
            })
            .then(() => {
                return updateImage('square')
            })
            .then(() => {
                return createImage('landscape')
            })
            .then(() => {
                return updateImage('landscape')
            })
            .then(() => {
                return createImage('portrait')
            })
            .then(() => {
                return updateImage('portrait')
            })
            .then(() => {
                fs.unlinkSync(tempPath)
                console.log('<end> origin image local file deleted')

                // fs.readdir(tmpdir, function (err, files) {
                //     if (err) throw err
                //     console.log('files: ', files)
                // })
            })
            .catch(err => {
                console.log('<err>')
                console.log(err)
            })
        return 0
    })
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

const types = {
    thumb: { prefix: 't_', size: '100x100', temp: null, storage: null },
    square: { prefix: 's_', size: '640x640', temp: null, storage: null },
    landscape: { prefix: 'l_', size: '800x640', temp: null, storage: null },
    portrait: { prefix: 'p_', size: '640x800', temp: null, storage: null },
}

let bucket = null
let fileName = null
let contentType = null
let tempPath = null

exports.updateAsset = functions.storage.object()
    .onFinalize(object => {
        console.log('<1> storage onFinalize')

        // The Storage bucket that contains the file.
        const fileBucket = object.bucket
        // File path in the bucket.
        const filePath = object.name
        // File content type.
        contentType = object.contentType
        // Number of times metadata has been generated. New objects have a value of 1.
        const metageneration = object.metageneration

        // Get the file name.
        fileName = path.basename(filePath)
        // Get tmpdir
        const tmpdir = os.tmpdir()

        // Exit if this is triggered on a file that is not an image.
        if (!contentType.startsWith('image/')) {
            console.log('<0> This is not an image.')
            return 0
        }

        // サムネイルの場合は終了
        if (
            fileName.startsWith(types.thumb.prefix)
            || fileName.startsWith(types.square.prefix)
            || fileName.startsWith(types.landscape.prefix)
            || fileName.startsWith(types.portrait.prefix)
        ) {
            console.log('<0> Already a created.')
            return 0
        }

        // バケット名
        bucket = gcs.bucket(fileBucket)
        // これでもバケット名が取れる
        // bucket = admin.storage().bucket()
        // console.log('bucket2@', bucket)

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

                // Get temp file path
                tempPath = path.join(tmpdir, fileName)
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

                console.log(types)
            })
            // ImageMagickを使用して各イメージを生成
            .then(() => {
                return createImage(types.thumb.size, types.thumb.temp)
            })
            .then(() => {
                return createImage(types.square.size, types.square.temp)
            })
            .then(() => {
                return createImage(types.landscape.size, types.landscape.temp)
            })
            .then(() => {
                return createImage(types.portrait.size, types.portrait.temp)
            })
            // 各イメージをストレージにアップロード
            .then(() => {
                return updateImage(types.thumb.temp, types.thumb.storage)
            })
            .then(() => {
                return updateImage(types.square.temp, types.square.storage)
            })
            .then(() => {
                return updateImage(types.landscape.temp, types.landscape.storage)
            })
            .then(() => {
                return updateImage(types.portrait.temp, types.portrait.storage)
            })
            .then(() => {
                // Once the thumbnail has been uploaded delete the local file to free up disk space.
                fs.unlinkSync(tempPath)
                fs.unlinkSync(types.thumb.temp)
                fs.unlinkSync(types.square.temp)
                fs.unlinkSync(types.landscape.temp)
                fs.unlinkSync(types.portrait.temp)
                console.log('<6> deleted the local file')

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

function createImage(size, newPath) {
    return new Promise((resolve, reject) => {
        console.log('in spawn')
        const args = [
            tempPath,
            '-thumbnail',
            `${size}^`,
            '-gravity',
            'center',
            '-extent',
            size,
            newPath,
        ]

        spawn('convert', args, { capture: ['stdout', 'stderr'] })
            .then(result => {
                console.log(`<4> image ${size} create`)
                resolve(true)
            })
            .catch(err => {
                console.error(`Error: Functions UpdatreAsset createImage ${err}`)
                reject(new Error(`Error: Functions UpdatreAsset createImage ${err}`))
            })
    })
}

function updateImage(temp, strage) {
    console.log('<5> image created at', strage)
    // We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
    // Uploading the thumbnail.
    return new Promise((resolve, reject) => {

        bucket.upload(temp, {
            destination: strage,
            metadata: {
                contentType: contentType
            },
        })
            .then(result => {
                console.log('update!', result)
                console.log('update!!', fileName)
                admin.firestore().collection('assets').doc(fileName).update({
                    tumb: true
                })
                    .then(result => resolve(result))
                    .catch(err => reject(err))
            })
    })
    // return bucket.upload(temp, {
    //     destination: strage,
    //     metadata: {
    //         contentType: contentType
    //     },
    // })
}
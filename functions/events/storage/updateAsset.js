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

let thumbPrefix = 'thumb_'
let thumbSize = '100'
let squareSize = '640'
let landscapeSize = '800x640'
let portraitSize = '640x800'

exports.updateAsset = functions.storage.object()
    .onFinalize(object => {
        console.log('-----> storage onFinalize')

        // The Storage bucket that contains the file.
        const fileBucket = object.bucket
        // File path in the bucket.
        const filePath = object.name
        // File content type.
        const contentType = object.contentType
        // Number of times metadata has been generated. New objects have a value of 1.
        const metageneration = object.metageneration

        // Get the file name.
        const fileName = path.basename(filePath)
        // Get tmpdir
        const tmpdir = os.tmpdir()

        // Exit if this is triggered on a file that is not an image.
        if (!contentType.startsWith('image/')) {
            console.log('<----- This is not an image.')
            return 0
        }

        // サムネイルの場合は終了
        if (fileName.startsWith(thumbPrefix)) {
            console.log('<----- Already a Thumbnail.')
            return 0
        }

        // これでもバケット名
        const bucket = gcs.bucket(fileBucket)
        // これでもバケット名が取れる
        // bucket = admin.storage().bucket()
        // console.log('bucket2@', bucket)

        admin.firestore().collection('configs').doc('asset').get()
            .then(doc => {
                console.log('-----> Get config')
                const config = doc.data()
                thumbPrefix = config.thumbPrefix != null ? config.thumbPrefix : thumbPrefix
                squarePrefix = config.thumbPrefix != null ? config.thumbPrefix : thumbPrefix
                portraitPrefix = config.thumbPrefix != null ? config.thumbPrefix : thumbPrefix
                landscapePrefix = config.thumbPrefix != null ? config.thumbPrefix : thumbPrefix

                thumbSize = config.thumbSize != null ? config.thumbSize : thumbSize
                squareSize = config.squareSize != null ? config.squareSize : squareSize
                landscapeSize = config.landscapeSize != null ? config.landscapeSize : landscapeSize
                portraitSize = config.portraitSize != null ? config.portraitSize : portraitSize

                // Get temp file path
                const tempFilePath = path.join(tmpdir, thumbFileName)

                const thumbFileName = `${thumbPrefix}${fileName}`
                const tempThumbFilePath = path.join(tmpdir, fileName)
                const tempFilePath = path.join(tmpdir, fileName)
                const tempFilePath = path.join(tmpdir, fileName)
                const tempFilePath = path.join(tmpdir, fileName)

                return true
            })
            .then(() => {
                console.log('@@@@-> get!', thumbPrefix)
                console.log('@@@@-> get!', thumbSize)
                console.log('-----> Image download locally to', tempFilePath)
                return bucket.file(filePath)
                    .download({
                        destination: tempFilePath,
                    })
            })
            .then(() => {
                const thumbFileName = `${thumbPrefix}${fileName}`
                const tempThumbFilePath = path.join(tmpdir, thumbFileName)

                // ImageMagickを使用してサムネイルを生成
                const args = [
                    tempFilePath,
                    '-thumbnail',
                    `${thumbSize}x${thumbSize}^`,
                    '-gravity',
                    'center',
                    '-extent',
                    `${thumbSize}x${thumbSize}`,
                    tempThumbFilePath,
                ]
                console.log('-----> thumb create start')
                return spawn('convert', args)
            })
            // .then(() => {
            //     // ImageMagickを使用してスクエアを生成
            //     const args = [
            //         tempFilePath,
            //         '-thumbnail',
            //         `${squareSize}x${squareSize}^`,
            //         '-gravity',
            //         'center',
            //         '-extent',
            //         `${squareSize}x${squareSize}`,
            //         tempFilePath,
            //     ]
            //     return spawn('convert', args)
            // })
            .then(() => {
                console.log('-----> Thumbnail created at', tempFilePath)
                // We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
                const thumbFileName = `${thumbPrefix}${fileName}`
                const thumbFilePath = path.join(path.dirname(filePath), thumbFileName)

                // Uploading the thumbnail.
                return bucket.upload(tempFilePath, {
                    destination: thumbFilePath,
                    metadata: {
                        contentType: contentType,
                    }
                })
            })
            .then(() => {
                // Once the thumbnail has been uploaded delete the local file to free up disk space.
                fs.unlinkSync(thumbFilePath)
                fs.unlinkSync(tempFilePath)
                console.log('-----> deleted the local file')
            })
        return 0;
    })
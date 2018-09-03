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

let thumbPrefix = 't_'
let thumbSize = '100x100'
let squarePrefix = 's_'
let squareSize = '640x640'
let landscapePrefix = 'l_'
let landscapeSize = '800x640'
let portraitPrefix = 'p_'
let portraitSize = '640x800'

let tempPath = null

let tempThumbPath = null
let storageThumbPath = null

exports.updateAsset = functions.storage.object()
    .onFinalize(object => {
        console.log('<1> storage onFinalize')

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
            console.log('<0> This is not an image.')
            return 0
        }

        // サムネイルの場合は終了
        if (
            fileName.startsWith(thumbPrefix)
            || fileName.startsWith(squarePrefix)
            || fileName.startsWith(landscapePrefix)
            || fileName.startsWith(portraitPrefix)
        ) {
            console.log('<0> Already a created.')
            return 0
        }

        // これでもバケット名
        const bucket = gcs.bucket(fileBucket)
        // これでもバケット名が取れる
        // bucket = admin.storage().bucket()
        // console.log('bucket2@', bucket)

        admin.firestore().collection('configs').doc('asset').get()
            .then(doc => {
                console.log('<2> Get config')
                const config = doc.data()

                thumbPrefix = config.thumbPrefix != null ? config.thumbPrefix : thumbPrefix
                thumbSize = config.thumbSize != null ? config.thumbSize : thumbSize

                squarePrefix = config.squarePrefix != null ? config.squarePrefix : squarePrefix
                squareSize = config.squareSize != null ? config.squareSize : squareSize

                landscapePrefix = config.landscapePrefix != null ? config.landscapePrefix : landscapePrefix
                landscapeSize = config.landscapeSize != null ? config.landscapeSize : landscapeSize

                portraitPrefix = config.portraitPrefix != null ? config.portraitPrefix : portraitPrefix
                portraitSize = config.portraitSize != null ? config.portraitSize : portraitSize

                // Get temp file path
                tempPath = path.join(tmpdir, fileName)
                // thumb
                tempThumbPath = path.join(tmpdir, `${thumbPrefix}${fileName}`)
                storageThumbPath = path.join(path.dirname(filePath), `${thumbPrefix}${fileName}`)
                // square
                tempSquarePath = path.join(tmpdir, `${squarePrefix}${fileName}`)
                storageSquarePath = path.join(path.dirname(filePath), `${squarePrefix}${fileName}`)
                // landscape
                tempLandscapePath = path.join(tmpdir, `${landscapePrefix}${fileName}`)
                storageLandscapePath = path.join(path.dirname(filePath), `${landscapePrefix}${fileName}`)
                // portrait
                tempPortraitPrefixPath = path.join(tmpdir, `${portraitPrefix}${fileName}`)
                storagePortraitPrefixPath = path.join(path.dirname(filePath), `${portraitPrefix}${fileName}`)

                return true
            })
            .then(() => {
                console.log('<3> Image download locally to', tempPath)
                return bucket.file(filePath)
                    .download({
                        destination: tempPath,
                    })
            })
            .then(() => {
                // ImageMagickを使用してサムネイルを生成
                return creageImage('thumbnail', thumbSize, tempPath, tempThumbPath)
            })
            .then(() => {
                // Uploading the thumbnail.
                return updateImage(bucket, tempThumbPath, storageThumbPath, contentType)
            })
            .then(() => {
                // Once the thumbnail has been uploaded delete the local file to free up disk space.
                fs.unlinkSync(tempPath)
                fs.unlinkSync(tempThumbPath)
                console.log('<6> deleted the local file')

                // fs.readdir(tmpdir, function (err, files) {
                //     if (err) throw err;
                //     console.log(files);
                // });
            })
            .catch(err => {
                console.log('<err>')
                console.log(err)
            })
        return 0;
    })

function creageImage(type, size, path, newPath) {
    let args = []
    if (type == 'thumbnail') {
        args = [
            path,
            '-thumbnail',
            size,
            '-gravity',
            'center',
            '-extent',
            size,
            newPath,
        ]
    } else {
        args = [
            path,
            '-resize',
            size,
            newPath,
        ]
    }
    console.log(`<4> thumb create`)
    return spawn('convert', args)
}

function updateImage(bucket, tempPath, storagePath, contentType) {
    console.log('<5> Thumbnail created at', storagePath)
    // We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
    // Uploading the thumbnail.
    return bucket.upload(tempPath, {
        destination: storagePath,
        metadata: {
            contentType: contentType
        },
    })
}
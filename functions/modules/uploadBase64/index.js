const parent = require('../../events/parent')
const functions = parent.functions
const admin = parent.admin
const stream = require('stream')
const path = require('path')
const spawn = require('child-process-promise').spawn
const os = require('os')
const fs = require('fs')
module.exports = class assets {

    // data:image/jpeg;base64,/9j/4AAQSkZJR
    // data:text/html;charset=utf-8;base64,/9j/4AAQSkZJR
    // data:audio/mp3;base64,SUQzAwAAAAAAA
    // data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb

    constructor(base64string) {
        const [head, body] = base64string.split(',');
        this.contentType = head.slice(head.indexOf(':') + 1, head.indexOf(';'))
        this.body = body
        this.buffuer = new Buffer(body, 'base64')
        const sutream = new stream.PassThrough()
        sutream.end(this.buffuer)
        this.sutream = sutream
        this.name = ''
        this.path = ''
        this.metas = {}
    }

    static fact(base64string) {
        return new assets(base64string)
    }

    setMeta(metas) {
        this.metas = metas
        return this
    }

    upload(stragePath, name) {
        // get storage backet and set path
        this.path = stragePath
        this.name = name
        const storageBucket = admin.storage().bucket();
        const bucketFile = storageBucket.file(`${this.path}/${this.name}`)

        // TODO:: まずテンポディレクトリに入れてから
        // ストレージにアップロード
        // ストレージにサムネイルをアップロード
        // テンポディレクトリをクリア
        // に変更

        // upload to assets storage
        const uploadFile = new Promise((resolve, reject) => {
            this.sutream.pipe(bucketFile.createWriteStream({
                    metadata: {
                        contentType: this.contentType,
                        metadata: this.metas
                    },
                    public: true,
                }))
                .on('error', err => {
                    reject(err)
                })
                .on('finish', () => {
                    resolve(true)
                })
        })

        const uploadThumb = new Promise((resolve, reject) => {

            if (!this.contentType.startsWith('image/')) {
                resolve()
            }

            const tempFilePath = path.join(os.tmpdir(), this.name)
            const thumbPrefix = 'thumb_'
            const thumbSize = '200x200'

            bucketFile.download({
                    destination: tempFilePath,
                })
                .then(() => {
                    console.log('-----> Image downloaded locally to', tempFilePath)
                    // ImageMagickを使用してサムネイルを生成
                    spawn('convert', [tempFilePath, '-thumbnail', `${thumbSize}>`, tempFilePath])
                })
                .then(() => {
                    console.log('-----> Thumbnail created at', tempFilePath)
                    // We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
                    const thumbFileName = `${thumbPrefix}${this.name}`
                    const thumbFilePath = path.join(path.dirname(this.path), thumbFileName)

                    // Uploading the thumbnail.
                    storageBucket.upload(tempFilePath, {
                        destination: thumbFilePath,
                        metadata: {
                            contentType: this.contentType,
                            metadata: this.metas
                        }
                    })
                })
                .then(() => {
                    // Once the thumbnail has been uploaded delete the local file to free up disk space.
                    fs.unlinkSync(tempFilePath)
                    resolve(true)
                })
                .catch(err => {
                    console.log(err)
                    reject(err)
                })
        })

        return Promise.all([uploadFile])
    }
}
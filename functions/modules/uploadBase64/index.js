const parent = require('../../events/parent')
const functions = parent.functions
const admin = parent.admin
const stream = require('stream')
const path = require('path')
const spawn = require('child-process-promise').spawn
const os = require('os')
const fs = require('fs')
const b64toBlob = require('b64-to-blob');
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
        this.bucketFile = null

        // const blob = b64toBlob(body, this.contentType)
        // const bucket = admin.storage().bucket()
        // bucket.upload(blob, {
        //         // Support for HTTP requests made with `Accept-Encoding: gzip`
        //         gzip: true,
        //         metadata: {
        //             // Enable long-lived HTTP caching headers
        //             // Use only if the contents of the file will never change
        //             // (If the contents will change, use cacheControl: 'no-cache')
        //             cacheControl: 'public, max-age=31536000',
        //         },
        //     })
        //     .then(() => {
        //         console.log(`${filename} uploaded to ${bucketName}.`);
        //     })
        //     .catch(err => {
        //         console.error('ERROR:', err);
        //     });
    }

    static fact(base64string) {
        return new assets(base64string)
    }

    setMeta(metas) {
        this.metas = metas
        return this
    }

    // upload1(name) {
    //     var blob = b64toBlob(b64Data, this.contentType)
    // }

    upload(stragePath, name) {
        // get storage backet and set path
        this.path = stragePath
        this.name = name
        const storageBucket = admin.storage().bucket();
        const bucketFile = storageBucket.file(`${this.path}/${this.name}`)

        return new Promise((resolve, reject) => {
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
    }
}
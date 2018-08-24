const stream = require('stream');

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
    }

    static fact(base64string) {
        return new assets(base64string)
    }

    upload(bucketFile) {
        return new Promise((resolve, reject) => {
            return this.sutream.pipe(bucketFile.createWriteStream({
                metadata: {
                    contentType: this.contentType,
                    metadata: {
                        name: 'kohei',
                    }
                },
                public: true,
            }))
                .on('error', function (err) {
                    reject(err)
                })
                .on('finish', function () {
                   resolve('ok!')
                });
        })
    }
}
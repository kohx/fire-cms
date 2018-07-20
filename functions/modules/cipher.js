const crypto = require('crypto')

const alg = 'aes-256-cbc'
const key = 'QJy387ireTxnIUcD503wRp58djZxqo5q' // Must be 256 bytes (32 characters)
const ivLength = 16

exports.encrypt = (value) => {
    try {
        let iv = crypto.randomBytes(ivLength)
        let cipher = crypto.createCipheriv(alg, key, iv)
        let encrypted = cipher.update(value)
        encrypted = Buffer.concat([encrypted, cipher.final()])
        return iv.toString('hex') + ':' + encrypted.toString('hex')

        // var cipher = crypto.createCipher(alg, key)
        // cipher.update(value, 'utf-8', 'hex')
        // return cipher.final('hex')
    } catch (error) {
        return error
    }
}

exports.decrypt = (encrypted) => {
    try {
        let textParts = encrypted.split(':')
        let iv = new Buffer(textParts.shift(), 'hex')
        let encryptedText = new Buffer(textParts.join(':'), 'hex')
        let decipher = crypto.createDecipheriv(alg, new Buffer(key), iv)
        let decrypted = decipher.update(encryptedText)
        decrypted = Buffer.concat([decrypted, decipher.final()])
        return decrypted.toString();

        // var decipher = crypto.createDecipher(alg, key)
        // decipher.update(encrypted, 'hex', 'utf8')
        // return decipher.final('utf8')
    } catch (error) {
        return false
    }
}
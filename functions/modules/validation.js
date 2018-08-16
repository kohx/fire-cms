// https://www.npmjs.com/package/validator
const validator = require('validator')

module.exports = class validation {

    constructor(list) {

        if (typeof list !== 'object') {
            throw new Error('error at validation module: list is not object')
        }

        this.list = list

        this.valid = true
        this.errors = {}
        this.results = {}
        Object.keys(list).forEach(key => {
            this.results[key] = list[key]
        })
        this.sanitaizeTypes = [
            'blacklist',
            'escape',
            'unescape',
            'trim',
            'ltrim',
            'rtrim',
            'normalizeEmail',
            'stripLow',
            'toBoolean',
            'toDate',
            'toFloat',
            'toInt',
            'whitelist',
        ]
        this.validationTypes = {
            isRequired: `:key is required.`,
            isAlpha: `:key is not alpha.`,
            isNumeric: `:key is not numric.`,
            isAlphanumeric: `:key is not alphanumeric.`,
            isEmail: `:key is not email.`,
            contains: `:key is not contains :param.`,
            equals: `:key is not equals :param.`,
            matches: `:key is not matches :param.`,
            isIn: `:key must be included in :param`,
            isLength: `:key length is min:param1, max:param2.`,
            isByteLength: `:key byte is min:param1, max:param2.`,
        }
    }

    static list(list) {
        const instance = new validation(list)
        return instance
    }

    check(key, type, ...args) {

        if (!Object.keys(this.list).includes(key)) {
            throw new Error(`error at validation module: list has not key.`)
        }

        if (!Object.keys(this.validationTypes).includes(type)) {
            throw new Error(`error at validation module: validation type is not ture.`)
        }

        const value = this.list[key]
        let flag = true

        try {

            switch (type) {
                case 'isRequired':

                    flag = !validator.isEmpty(value)
                    break

                default:
                    // There is no error even if there is args!
                    flag = validator[type](value, ...args)
                    break
            }

        } catch (err) {

            throw new Error(`error at validation module: ${err.message}`)
        }


        if (!flag) {
            this.valid = false
            if (!this.errors[key]) {
                this.errors[key] = []
            }

            const params = {}
            args.forEach((arg, key) => {
                params[`param${key + 1}`] = arg
            })

            this.errors[key].push({
                type: type,
                params: params,
                message: this.validationTypes[type],
            })
        }
        return this
    }

    sanitize(key, type, ...arg) {
        
        if (!Object.keys(this.list).includes(key)) {
            throw new Error(`error at validation module: list has not key.`)
        }

        if (!Object.keys(this.sanitaizeTypes).includes(type)) {
            throw new Error(`error at validation module: sanitaize type is not ture.`)
        }

        const value = this.list[key]
        const snitized = validator[type](value, ...args)
        this.results[key] = snitized
        return this
    }
}

// console.log(validator.isEmpty(''))
// console.log(validator.isNumeric('1234'))
// console.log(validator.isAlpha('asdf'))
// console.log(validator.isAlphanumeric('foo.jpg'))
// console.log(validator.isEmail('asdf@asdfsd.com'))
// console.log(validator.isURL('http://google.com'))
// console.log(validator.isFQDN('http://google.com'))

// console.log(validator.contains('asdfas!!!dfasdf', '!!!'))
// console.log(validator.equals('1234', '1234'))
// console.log(validator.matches('12abc34', /abc/))
// console.log(validator.isIn('aaa', ['aaa', 'bbb', 'ccc']))

// console.log(validator.isLength('asdf', 1, 5))
// console.log(validator.isByteLength('11111', 1000, 100000))

// console.log(validator.escape(`<div>'asdf',"asdf",&</div>`))
// console.log(validator.ltrim(`/sss/`, '/'))
// console.log(validator.rtrim(`/sss/`, '/'))
// console.log(validator.trim(`/sss/`, '/'))
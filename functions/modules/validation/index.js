// https://www.npmjs.com/package/validator
const validator = require('validator')

module.exports = class validation {

    constructor(list) {

        if (typeof list !== 'object') {
            throw new Error('error at validation module: list is not object')
        }

        this.list = list

        this.validity = true
        this.errors = {}
        this.values = {}
        Object.keys(list).forEach(key => {
            this.values[key] = list[key]
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
            isRequired: `{{param1}} is required.`,
            isAlpha: `{{param1}} is not alpha.`,
            isNumeric: `{{param1}} is not numric.`,
            isAlphanumeric: `{{param1}} is not alphanumeric.`,
            isEmail: `{{param1}} is not email.`,
            contains: `{{param1}} is not contains {{param2}}.`,
            equals: `{{param1}} is not equals {{param2}}.`,
            notEquals: `{{param1}} is equals {{param2}}.`,
            matches: `{{param1}} is not matches {{param2}}.`,
            isIn: `{{param1}} must be included in {{param2}}`,
            isLength: `{{param1}} length is min {{param2}}, max {{param3}}.`,
            isByteLength: `{{param1}} byte is min {{param2}}, max {{param3}}.`,
            isAlnumunder: `{{param1}} is not alphanumeric and underscore.`,
            isBase64: `{{param1}} is not base64 encoded.`,
        }
    }

    static list(list) {
        const instance = new validation(list)
        return instance
    }

    test(key, type, ...args) {

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

                case 'notEquals':
                    flag = !validator.equals(value)
                    break

                case 'isAlnumunder':
                    const regexp = /^[a-zA-Z0-9-_]+$/;
                    flag = validator.matches(value, regexp)
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
            this.validity = false
            if (!this.errors[key]) {
                this.errors[key] = []
            }

            const params = { param1: key }
            let num = 2
            args.forEach((arg, key) => {
                params[`param${num}`] = arg
                num++
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
        this.values[key] = snitized
        return this
    }

    check() {
        return {
            status: this.validity,
            errors: this.errors,
            values: this.values,
        }
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
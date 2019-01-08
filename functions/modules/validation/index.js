// https://www.npmjs.com/package/validator

// TODO:: change to v8n https://www.npmjs.com/package/v8n#architecture
// https://co.bsnws.net/article/182
// const v8n = require('v8n')

const validator = require('validator')
const debug = require('../debug').debug

// TODO:: sanitaize後の値をテストするように変更？
// テストを通った値がsanitaizeで代わってしまう？

module.exports = class validation {

    constructor(list) {
        if (typeof list !== 'object') {
            throw new Error('error at validation module: list is not object')
        }
        this.list = list
        this.values = Object.assign({}, list)

        this.passed = true
        this.errors = {}

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
            isAlnumunder: `{{param1}} is not alphanumeric and underscore.`,
            isAlnumunspace: `{{param1}} is not alphanumeric and space.`,
            isUrlcharacter: `{{param1}} is not alphanumeric and dot, dash, underscore`,
            isNumunder: `{{param1}} is not numeric and underscore.`,
            isEmail: `{{param1}} is not email.`,
            contains: `{{param1}} is not contains {{param2}}.`,
            equals: `{{param1}} is not equals {{param2}}.`,
            notEquals: `{{param1}} is equals {{param2}}.`,
            matches: `{{param1}} is not matches {{param2}}.`,
            isIn: `{{param1}} must be included in {{param2}}`,
            isLength: `{{param1}} length is min {{param2}}, max {{param3}}.`,
            isByteLength: `{{param1}} byte is min {{param2}}, max {{param3}}.`,
            isBase64: `{{param1}} is not base64 encoded.`,
            isMap: `{{param1}} is not map.`,
            isArray: `{{param1}} is not array.`,
            isNotBlankObject: `{{param1}} is blank.`,
            containsSymbol: `{{param1}} is not contains symbol.`,
            containsUppercase: `{{param1}} is not contains uppercase.`,
            containsNumric: `{{param1}} is not contains numric.`,
            isConfirm: `{{param1}} is not same with {{param2}}.`,
            canNotUsedBlank: `{{param1}} can not used blank.`,
            isUnique: `{{param1}} is already used.`,
            isDate: `{{param1}} is not date.`,
            isAllString: `{{param1}} array elements are not string.`,
            isAllBool: `{{param1}} array elements are not boolean.`,
            isAllInUse: `{{param2}} is in use {{param3}}.`,
        }
    }

    static list(list) {
        const instance = new validation(list)
        return instance
    }

    valid(key, type, ...args) {

        // there is not value at list
        if (!this.list.hasOwnProperty(key)) {
            throw new Error(`error at validation module: list has not key ${key}.`)
        }

        // there is not type
        if (!Object.keys(this.validationTypes).includes(type)) {
            throw new Error(`error at validation module: validation type ${type} is not ture.`)
        }

        // get value
        const value = this.list[key]

        // check flag
        let flag = true
        let isRequired = false

        // non value chack
        const isEmpty = value === null || value === '' ? true : false

        // if type is required
        if (type === 'isRequired') {
            isRequired = true
            flag = !isEmpty
        }
        // other than required
        else {

            // if not required and value is null
            // then all through
            if (!isRequired && isEmpty) {
                flag = true
            } else {

                try {
                    switch (type) {
                        case 'notEquals':
                            flag = !validator.equals(value, ...args)
                            break

                        case 'isUnique':
                            flag = args[0]
                            break

                        case 'isAlnumunder':
                            // \w
                            flag = validator.matches(value, /^[a-zA-Z0-9_]+$/)
                            break

                        case 'isAlnumunspace':
                            // \w
                            flag = validator.matches(value, /^[a-zA-Z0-9 ]+$/)
                            break

                        case 'isNumunder':
                            flag = validator.matches(value, /^[0-9_]+$/)
                            break

                        case 'isUrlcharacter':
                            flag = validator.matches(value, /^[a-zA-Z0-9_\.\-]+$/)
                            break

                        case 'isBase64':
                            const [head, body] = value.split(',')
                            flag = validator.isBase64(body)
                            break

                        case 'isMap':
                            flag = typeof value === 'object' && !Array.isArray(value)
                            break

                        case 'isArray':
                            flag = typeof value === 'object' && Array.isArray(value)
                            break

                        case 'isNotBlankObject':
                            if (typeof value === 'object') {
                                let objectValues = []
                                Object.keys(value).forEach(key => {
                                    objectValues.push(value[key])
                                })
                                objectValues = objectValues.filter(objectValue => objectValue.length > 0)
                                flag = objectValues.length > 0
                            } else {
                                flag = false
                            }
                            break

                        case 'containsSymbol':
                            // ! " # $ % & ' ( ) * + - . , / : ; < = > ? @ [ \ ] ^ _ ` { | } ~
                            const regSymbol = new RegExp(/[!"#$%&'()\*\+\-\.,\/:;<=>?@\[\\\]^_`{|}~]/g)
                            flag = regSymbol.test(value)
                            break

                        case 'containsUppercase':
                            const regUppercase = new RegExp(/[A-Z]/g)
                            flag = regUppercase.test(value)
                            break

                        case 'containsNumric':
                            const regNumric = new RegExp(/[0-9]/g)
                            flag = regNumric.test(value)
                            break

                        case 'isConfirm':
                            const targetKey = args[0]
                            const targetValue = this.list[targetKey]
                            flag = value === targetValue
                            break

                        case 'canNotUsedBlank':
                            const regBlank = new RegExp(/\s/g)
                            flag = !regBlank.test(value)
                            break

                        case 'isAllString':
                            Object.keys(value).forEach(index => {
                                flag = typeof value[index] === 'string'
                            })
                            break

                        case 'isAllBool':
                            Object.keys(value).forEach(index => {
                                flag = typeof value[index] === 'boolean'
                            })
                            break

                        case 'isAllInUse':
                            flag = false
                            const usedLnag = args[0]
                            Object.keys(value).forEach(index => {
                                if(value[index] === usedLnag){
                                    flag = true
                                }
                            })
                            break

                        case 'isDate':
                            const iosO8601 = new RegExp(/^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/)
                            flag = iosO8601.test(value.toISOString())
                            // flag = validator.isISO8601(value.toISOString())
                            break

                        default:
                            // There is no error even if there is args!
                            flag = validator[type](value, ...args)
                            break
                    }

                } catch (err) {

                    throw new Error(`error at validation module: ${err.message}`)
                }
            }
        }

        if (!flag) {
            // change passed
            this.passed = false

            // there is not key then add key
            if (!this.errors.hasOwnProperty(key)) {
                this.errors[key] = []
            }

            // build params
            const params = {
                param1: key
            }
            let num = 2
            args.forEach((arg, key) => {
                params[`param${num}`] = arg
                num++
            })

            // add error
            this.errors[key].push({
                key: key,
                type: type,
                params: params,
                message: this.validationTypes[type],
            })
        }
        return this
    }

    sanitize(key, type, ...args) {

        // get value
        const value = this.list[key]

        if (!this.list.hasOwnProperty(key)) {
            throw new Error(`error at validation module: list has not key ${key}.`)
        }

        if (!this.sanitaizeTypes.includes(type)) {
            throw new Error(`error at validation module: sanitaize type ${type} is not ture.`)
        }

        try {
            const snitized = validator[type](value, ...args)
            this.list[key] = snitized
        } catch (err) {

            throw new Error(`error at validation module: ${err.message}`)
        }

        return this
    }

    get() {
        return {
            check: this.passed,
            status: this.passed ? 'success' : 'warning',
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
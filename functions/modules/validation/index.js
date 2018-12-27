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

        this.validity = true
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
        }
    }

    static list(list) {
        const instance = new validation(list)
        return instance
    }

    valid(path, type, ...args) {

        // there is not value at list
        if (!this.existValue(path)) {
            throw new Error(`error at validation module: list has not key ${path}.`)
        }

        // there is not type
        if (!Object.keys(this.validationTypes).includes(type)) {
            throw new Error(`error at validation module: validation type ${type} is not ture.`)
        }

        // get value
        const value = this.getValue(path)

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
                            const targetValue = this.getValue(targetKey)
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
            // change validity
            this.validity = false

            // there is not path then add path
            if (!this.errors[path]) {
                this.errors[path] = []
            }

            // build params
            const params = { param1: path }
            let num = 2
            args.forEach((arg, path) => {
                params[`param${num}`] = arg
                num++
            })

            // add error
            this.errors[path].push({
                path: path,
                type: type,
                params: params,
                message: this.validationTypes[type],
            })
        }
        return this
    }

    sanitize(path, type, ...args) {

        if (!this.existValue(path)) {
            throw new Error(`error at validation module: list has not key ${path}.`)
        }

        if (!this.sanitaizeTypes.includes(type)) {
            throw new Error(`error at validation module: sanitaize type ${type} is not ture.`)
        }

        try {
            const value = this.getValue(path)
            const snitized = validator[type](value, ...args)
            this.setValue(this.values, path, snitized)
        } catch (err) {

            throw new Error(`error at validation module: ${err.message}`)
        }

        return this
    }

    get() {
        return {
            check: this.validity,
            status: this.validity ? 'success' : 'warning',
            errors: this.errors,
            values: this.values,
        }
    }

    existValue(str) {
        let exist = this.list
        const paths = str.split('.')

        for (let index in paths) {
            const path = paths[index]
            if (exist.hasOwnProperty(path)) {
                exist = exist[path]
            } else {
                return false
            }
        }
        return true
    }

    getValue(str) {
        let value = this.list
        const paths = str.split('.')

        for (let index in paths) {
            const path = paths[index]
            value = value[path] != null ? value[path] : null
        }
        return value
    }

    setValue(obj, str, value) {

        if (typeof str == 'string') {
            return this.setValue(obj, str.split('.'), value)
        } else if (str.length == 1 && value !== undefined) {
            return obj[str[0]] = value
        } else if (str.length == 0) {
            return obj
        } else {
            return this.setValue(obj[str[0]], str.slice(1), value)
        }
    }

    setValue2(obj, path, value) {
        // protect against being something unexpected
        obj = typeof obj === 'object' ? obj : {}
        // split the path into and array if its not one already
        var keys = Array.isArray(path) ? path : path.split('.')
        // keep up with our current place in the object
        // starting at the root object and drilling down
        var curStep = obj
        // loop over the path parts one at a time
        // but, dont iterate the last part,
        for (var i = 0; i < keys.length - 1; i++) {
            // get the current path part
            var key = keys[i]

            // if nothing exists for this key, make it an empty object or array
            if (!curStep[key] && !Object.prototype.hasOwnProperty.call(curStep, key)) {
                // get the next key in the path, if its numeric, make this property an empty array
                // otherwise, make it an empty object
                var nextKey = keys[i + 1];
                var useArray = /^\+?(0|[1-9]\d*)$/.test(nextKey)
                curStep[key] = useArray ? [] : {}
            }
            // update curStep to point to the new level
            curStep = curStep[key];
        }
        // set the final key to our value
        var finalStep = keys[keys.length - 1]
        curStep[finalStep] = value;
    };

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
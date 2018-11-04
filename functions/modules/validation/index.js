// https://www.npmjs.com/package/validator
const validator = require('validator')
const debug = require('../debug').debug

module.exports = class validation {

    constructor(list) {

        if (typeof list !== 'object') {
            throw new Error('error at validation module: list is not object')
        }
        this.list = list
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
            isEmail: `{{param1}} is not email.`,
            contains: `{{param1}} is not contains {{param2}}.`,
            equals: `{{param1}} is not equals {{param2}}.`,
            notEquals: `{{param1}} is equals {{param2}}.`,
            notUse: `{{param1}} is already used.`,
            matches: `{{param1}} is not matches {{param2}}.`,
            isIn: `{{param1}} must be included in {{param2}}`,
            isLength: `{{param1}} length is min {{param2}}, max {{param3}}.`,
            isByteLength: `{{param1}} byte is min {{param2}}, max {{param3}}.`,
            isAlnumunder: `{{param1}} is not alphanumeric and underscore.`,
            isNumunder: `{{param1}} is not numeric and underscore.`,
            isBase64: `{{param1}} is not base64 encoded.`,
            isArray: `{{param1}} is not array.`,
        }
    }

    static list(list) {
        const instance = new validation(list)
        return instance
    }

    test(path, type, ...args) {

        if (!this.existValue(path)) {
            throw new Error(`error at validation module: list has not key ${path}.`)
        }

        if (!Object.keys(this.validationTypes).includes(type)) {
            throw new Error(`error at validation module: validation type ${type} is not ture.`)
        }

        const value = this.getValue(path)
        let flag = true

        try {

            switch (type) {
                case 'isRequired':
                    flag = !validator.isEmpty(value)
                    break

                case 'notEquals':
                    flag = !validator.equals(value, ...args)
                    break

                case 'notUse':
                    flag = !validator.equals(value, ...args)
                    console.log('->>', value, ...args)
                    break

                case 'isAlnumunder':
                    flag = validator.matches(value, /^[a-zA-Z0-9_]+$/)
                    break

                case 'isNumunder':
                    flag = validator.matches(value, /^[0-9_]+$/)
                    break

                case 'isBase64':
                    const [head, body] = value.split(',')
                    flag = validator.isBase64(body)
                    break

                case 'isArray':
                    flag = value.isArray()
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
            if (!this.errors[path]) {
                this.errors[path] = []
            }

            const params = { param1: path }
            let num = 2
            args.forEach((arg, path) => {
                params[`param${num}`] = arg
                num++
            })

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

    check() {
        return {
            status: this.validity,
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
            value = value[path]
        }
        return value
    }

    setValue(obj, str, value) {

        if (typeof str == 'string') {
            return this.setValue(obj, str.split('.'), value)
        }
        else if (str.length == 1 && value !== undefined) {
            return obj[str[0]] = value
        }
        else if (str.length == 0) {
            return obj
        }
        else {
            return this.setValue(obj[str[0]], str.slice(1), value)
        }
    }

    setValue2(obj, path, value) {
        // protect against being something unexpected
        obj = typeof obj === 'object' ? obj : {};
        // split the path into and array if its not one already
        var keys = Array.isArray(path) ? path : path.split('.');
        // keep up with our current place in the object
        // starting at the root object and drilling down
        var curStep = obj;
        // loop over the path parts one at a time
        // but, dont iterate the last part,
        for (var i = 0; i < keys.length - 1; i++) {
            // get the current path part
            var key = keys[i];

            // if nothing exists for this key, make it an empty object or array
            if (!curStep[key] && !Object.prototype.hasOwnProperty.call(curStep, key)) {
                // get the next key in the path, if its numeric, make this property an empty array
                // otherwise, make it an empty object
                var nextKey = keys[i + 1];
                var useArray = /^\+?(0|[1-9]\d*)$/.test(nextKey);
                curStep[key] = useArray ? [] : {};
            }
            // update curStep to point to the new level
            curStep = curStep[key];
        }
        // set the final key to our value
        var finalStep = keys[keys.length - 1];
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
const debug = require('../../modules/debug').debug


module.exports = class wbFunctions {

    constructor(unique) {
        this.unique = unique
        
    }

    static init(unique) {
        const instance = new wbFunctions(unique)
        return instance
    }

    de(value) {
        const type = typeof (value)
        const result = '';
        switch (type) {
            case 'object':
                result = `${type} -> ${JSON.stringify(value, null, '<br>')}`
                break;

            default:
                result = `${type} -> ${value} `
                break
        }
        return result
    }

    is(value){

    }
}
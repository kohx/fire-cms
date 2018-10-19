const debug = require('../../modules/debug').debug


module.exports.funcs = {

    de: (value) => {
        const type = typeof (value)
        let result = '';
        switch (type) {
            case 'object':
                result = `${type} -> ${JSON.stringify(value, null, '<br>')}`
                break;

            default:
                result = `${type} -> ${value} `
                break
        }
        return result
    },

    test: () => {
        return 'test'
    }
}
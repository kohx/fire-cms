module.exports.funcs = {
    de: value => {
        const type = typeof (value)
        const result = '';
        switch (type) {
            case 'object':
                result = `${type} -> ${JSON.stringify(value, null, '<br>')}`
                break;

            default:
                result = `${ type } -> ${ value } `
                break
        }
        return result
    },
    is: value => {
        console.log('is function')
    }
}
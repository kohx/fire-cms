module.exports.funcs = {
    de: value => {
        const type = typeof (value)
        switch (type) {
            case 'object':
                return `${type} -> ${JSON.stringify(value, null, '<br>')}`
                break;

            default:
                return `${type} -> ${value}`
                break
        }
    },
    is: value => {
        console.log('aaa')
    }
}
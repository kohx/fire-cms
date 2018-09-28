module.exports = class debug {

    static debug(value, file, line) {
        
        if ('===>', typeof value === 'object') {
            value = JSON.stringify(value)
        }
        file = file.split('\\').pop()
        let str = `
┌─  ${file} - ${line}  ─┐

${value}

└─  ${file} - ${line}  ─┘
`
        console.info(str)
    }
}
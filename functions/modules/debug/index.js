module.exports = class debug {

    static debug(value, file, line, err = false) {

        if ('===>', typeof value === 'object') {
            value = JSON.stringify(value)
        }
        file = file.split('\\').pop()
        let str = `
┌─  ${file} - ${line}  ─┐

${value}

└─  ${file} - ${line}  ─┘
`
        if (err) {
            console.error(str)
        } else {
            console.info(str)
        }
    }
}


const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const vm = require('vm')

const templateTagReg = /\{\|.*?\|\}/g
const replaceMarke = '<|||>'

// TODO::
// error checker
// change collection
// template functions
// parts {|> header|}
// wrapper {|@ html|} 

module.exports.render = (thing, params = {}) => {
    // try {
    params.name = thing.name || ''
    params.items = [{
        name: '<h1>kohei</h1>',
        age: 40,
        gender: 'male'
    },
    {
        name: 'kohei',
        age: 40,
        gender: 'male'
    },
    {
        name: 'kohei',
        age: 40,
        gender: 'male'
    }]
    params.user = {
        uid: 'uil', // claims.uid,
        email: 'email', // claims.email,
    }

    const separated = separateString(thing.content)
    // console.log('separated--->', separated)
    const builded = build(separated, params)
    // console.log('builded--->', builded)
    const compiled = compile(builded, params)
    // console.log('compiled--->', compiled)
    return compiled

    // } catch (error) {
    //     throw error
    // }
}

// get match
function separateString(string) {
    let line = lining(string)
    const matches = line.match(templateTagReg)

    let replaces = []
    for (let key in matches) {
        replaces[matches[key]] = `${replaceMarke}${matches[key]}${replaceMarke}`
    }

    for (let key in replaces) {
        const value = replaces[key]
        line = line.replace(new RegExp(regEscape(key), 'g'), value)
    }

    return line.split(replaceMarke)
}

// build
function build(matches, params) {
    const clearCond = /\{\||\|\}|\s/g
    const keys = '[' + Object.keys(params).join(',') + ']'
    let builded = `const ${keys} = values\n`
    builded += `compiled = ''\n`

    matches.forEach((matche, key) => {
        if (matche.startsWith('{|')) {
            const cleared = matche.replace(clearCond, '')
            let type = cleared.substr(0, 1)
            switch (type) {
                case '*':
                    body = cleared.substr(1)
                    var [array, variable] = body.split(':')
                    builded += `for(let key in ${array}) {\n`
                    builded += `${variable} = ${array}[key]\n`
                    break

                case '#':
                    body = cleared.substr(1)
                    var [variable, alias] = body.split(':')
                    builded += `if(${variable}){\n`
                    if (alias) {
                        builded += `const ${alias} = ${variable};\n`
                    }
                    break

                case '^':
                    body = cleared.substr(1)
                    var [variable, alias] = body.split(':')
                    builded += `if(!${variable}){\n`
                    if (alias) {
                        builded += `const ${alias} = ${variable};\n`
                    }
                    break

                case '/':
                    body = cleared.substr(1)
                    builded += `}\n`
                    break

                case '&':
                    body = cleared.substr(1)
                    builded += `compiled += ${body};\n`
                    break

                default:
                    body = cleared
                    builded += `compiled += entityify(${body});\n`
            }

        } else {
            builded += `compiled += '${matche}';\n`
        }
    })

    return builded
}

// compile
function compile(builded, params) {
    const values = Object.keys(params).map(prop => params[prop])
    const context = {
        compiled: '',
        values: values,
        entityify: entityify
    };
    vm.runInNewContext(builded, context)
    return context.compiled
}

// entityify
function entityify(string) {
    var chars = {
        '<': '&lt',
        '>': '&gt',
        '&': '&amp',
        '"': '&quot',
        '\'': '&#39'
    }

    return String(string).replace(/[<>'&"]/g, char => {
        return chars[char]
    })
}

function regEscape(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

function lining(string) {
    return string.replace(/[\n\r]/g, '')
}
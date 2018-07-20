const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const vm = require('vm')

// TODO::
// error checker
// change collection
// template functions
// parts {|> header|}
// wrapper {|@ html|} 

module.exports.render = (thing, add = null) => {

    // try {
    let params = {
        name: thing.name || '',
        items: [
            { name: '<h1>kohei</h1>', age: 40, gender: 'male' },
            { name: 'kohei', age: 40, gender: 'male' },
            { name: 'kohei', age: 40, gender: 'male' }
        ],
        user: {
            uid: 'uil', // claims.uid,
            email: 'email', // claims.email,
        }
    }

    if (add) {
        params = Object.assign(params, add)
    }

    const matches = getMatch(thing.content)
    // console.log('matches--->', matches)
    const builded = build(matches, params)
    // console.log('builded--->', builded)
    const compiled = compile(builded, params)
    // console.log('compiled--->', compiled)
    return compiled

    // } catch (error) {
    //     throw error
    // }
}

// get match
function getMatch(string) {
    const cond = /\{\|.*?\|\}/g
    let line = string.replace(/[\n\r]/g, '')
    const matches = line.match(cond)

    let pairs = []
    for (let prop in matches) {
        const match = matches[prop]
        const pair = { key: match, valeu: `|||||${match}|||||` }
        pairs.push(pair)
    }

    let tests = []
    for (let key in matches) {
        tests[matches[key]] = `<|||>${matches[key]}<|||>`
    }

    for (let key in tests) {
        const value = tests[key]
        console.log('key', key)
        console.log('value', value)
        line = line.replace(new RegExp(key), value)
    }

    // for (let prop in pairs) {
    //     const pair = pairs[prop]
    //     line = line.replace(pair.key, pair.valeu)
    // }

    return line.split('<|||>')
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
    const context = { compiled: '', values: values, entityify: entityify };
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
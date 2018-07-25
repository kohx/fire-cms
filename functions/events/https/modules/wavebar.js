const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const vm = require('vm')

const templateTagReg = /\{\|.*?\|\}/g
const clearTagReg = /\{\||\|\}|\s/g
const replaceMarke = '<|||>'


// TODO::
// error checker
// change collection
// template functions
// parts {|> header|}
// wrapper {|@ html|} 



module.exports.init = (req, res, next) => {
    res.wbRender = (params = null) => {
        return render(req, res, next, params)
    }
    next()
}

function render(req, res, next, addParams) {
    // try {
    let thing = req.vessel.thing
    const content = thing.content

    const params = getParams(thing, addParams)
    // console.log('params--->', params)
    const separated = separateString(content)
    // console.log('separated--->', separated)

    // } catch (error) {
    //     throw error
    // }

    admin.firestore().collection('parts').get()
        .then(docs => {
            let parts = {}
            docs.forEach(doc => {
                console.log(doc.id)
                const data = doc.data()
                parts[doc.id] = data.content
            })
            console.log(parts)
            return parts
        })
        .then((parts) => {
            const builded = build(separated, params, parts)
            // console.log('builded--->', builded)
            const compiled = compile(builded, params)
            // console.log('compiled--->', compiled)
            // return compiled        
            res.send(compiled)
        })
        .catch(err => {
            console.log(err)
            res.send(err)
        })
}

/* get params */
function getParams(thing, addParams) {
    delete thing.content
    let params = thing

    if (Object.keys(addParams).length) {
        for (const key in addParams) {
            params[key] = addParams[key]
        }
    }
    return params
}

// get match
function separateString(string) {
    let line = lining(string)
    const matches = line.match(templateTagReg)

    let parts = []
    matches.forEach(matche => {
        const cleared = matche.replace(clearTagReg, '')
        if (cleared.startsWith('>')) {
            let part = cleared.substr(1)
            parts.push(part)
        }
    })

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
function build(matches, params, parts) {
    const keys = '[' + Object.keys(params).join(',') + ']'
    let builded = `const ${keys} = values\n`
    builded += `compiled = ''\n`

    matches.forEach((matche, key) => {
        if (matche.startsWith('{|')) {
            const cleared = matche.replace(clearTagReg, '')
            let type = cleared.substr(0, 1)
            switch (type) {
                case '>':
                    body = cleared.substr(1)
                    builded += `compiled += '${parts[body]}';\n`
                    break

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
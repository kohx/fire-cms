const vm = require('vm')
const wbFunctions = require('./wbFunctions')

const isDebug = true

const templateTagReg = /\{\|.*?\|\}/g
const bareReg = /\{\||\|\}|\s/g
const wrapReg = /\{\|\@.*?\|\}/g
const partReg = /\{\|\>.*?\|\}/g
const bodyReg = /^[>&#^*@~]*/
const replaceMarke = '<|||>'
const nlMarke = '<|/|>'

// TODO::
// error checker

module.exports.init = (req, res, next) => {
    res.wbRender = (data) => {
        return render(res, data)
    }
    next()
}

function render(res, data) {
    let content = (data.content != null) ? data.content : ''
    const wraps = (data.wraps != null) ? data.wraps : {}
    const parts = (data.parts != null) ? data.parts : {}
    const params = (data.params != null) ? data.params : {}

    const merged = merge(content, wraps, parts)
    const segments = segment(merged)
    // console.log('separated--->', segments)
    const builded = build(segments, params)
    // console.log('builded--->', builded)
    const compiled = compile(builded, params)
    // console.log('compiled--->', compiled)
    res.send(enLining(compiled))
}

// get merge
function merge(content, wraps, parts) {
    // change new line to mark
    content = lining(content)
    // insert wrap content
    const wrapTags = content.match(wrapReg)
    if (wrapTags) {
        wrapTags.reverse()
        wrapTags.forEach(wrapTag => {
            // get wrap content
            const bodiedTag = cleanTag(wrapTag)
            if (wraps[bodiedTag] == null) {
                throw new WavebarError(`wrapTag "${bodiedTag}" is not defined!`)
            }
            const wrapContent = lining(wraps[bodiedTag])
            // ラッパーのコンテントの中に有るタグを検索
            const contentSideTags = wrapContent.match(wrapReg)

            contentSideTags.forEach(contentSideTag => {
                const contentSideBodiedTag = cleanTag(contentSideTag)
                // クリーンしたラッパーのコンテントの中に有るタグが一致する場合
                if (contentSideBodiedTag == bodiedTag) {
                    // コンテンツのタグを削除
                    content = content.replace(wrapTag, '')
                    // ラッパーコンテンツのタグをリプレイス
                    content = wrapContent.replace(contentSideTag, content)
                }
            })
        })
    }

    // insert part content
    const partTags = content.match(partReg)
    if (partTags) {
        partTags.forEach(partTag => {
            bodiedTag = cleanTag(partTag)
            if (parts[bodiedTag] == null) {
                throw new WavebarError(`partTag "${bodiedTag}" is not defined!`)
            }
            const partContent = lining(parts[bodiedTag])
            content = content.replace(partTag, partContent)
        })
    }

    return content
}

// get segment
function segment(string) {
    let line = lining(string)

    const matches = line.match(templateTagReg)

    let replaces = []
    for (let key in matches) {
        replaces[matches[key]] = `${replaceMarke}${matches[key]}${replaceMarke}`
    }

    for (let key in replaces) {
        const value = replaces[key]
        line = line.replace(regEscape(key, 'g'), value)
    }

    return line.split(replaceMarke)
}

// build
function build(segments, params) {
    console.log('params', params)
    const keys = '[' + Object.keys(params).join(',') + ']'
    let builded = `const ${keys} = values\n`
    builded += `compiled = ''\n`
    const counter = {
        for: { open: 0, close: 0 },
        if: { open: 0, close: 0 },
        not: { open: 0, close: 0 },
    }
    segments.forEach((segment, key) => {
        // const matchLine = match.replace(/\r/g, '')
        if (segment.startsWith('{|')) {
            const baredTag = bareTag(segment)
            let type = baredTag.charAt(0)
            switch (type) {
                case '*':
                    counter.for.open++
                    body = bodyTag(baredTag)
                    var [array, variable] = body.split(':')
                    builded += `for(let key in ${array}) {\n`
                    if (variable) {
                        builded += `${variable} = ${array}[key]\n`
                    } else {
                        builded += `value = ${array}[key]\n`
                    }
                    break

                case '#':
                    counter.if.open++
                    body = bodyTag(baredTag)
                    var [variable, alias] = body.split(':')
                    builded += `if(typeof ${variable} !== 'undefined' && checValue(${variable})){\n`
                    if (alias) {
                        builded += `const ${alias} = ${variable}\n`
                    }
                    break

                case '^':
                    counter.not.open++
                    body = bodyTag(baredTag)
                    var [variable, alias] = body.split(':')
                    builded += `if(typeof ${variable} === 'undefined' || !checValue(${variable})){\n`
                    if (alias) {
                        builded += `const ${alias} = ${variable}\n`
                    }
                    break

                case '/':
                    body = bodyTag(baredTag)
                    const second = baredTag.charAt(1)
                    if (second === '*') counter.for.close++
                    if (second === '#') counter.if.close++
                    if (second === '^') counter.not.close++
                    builded += `}\n`
                    break

                case '~':
                    body = bodyTag(baredTag)
                    builded += `compiled += ${body}\n`
                    break

                case '&':
                    body = cleared.substr(1)
                    builded += `compiled += ${body};\n`
                    break

                default:
                    body = baredTag
                    builded += `compiled += entityify(${body});\n`
            }
        } else {
            builded += `compiled += '${segment}'\n`
        }
    })

    // check the number of template tag
    checkTag(counter, segments)

    // console.log(builded)
    return builded
}

// tag not match error
function checkTag(counter, segments) {
    let targetType = null
    let name = null
    if (counter.for.open !== counter.for.close) {
        name = 'for'
        targetType = '*'
    }
    if (counter.if.open !== counter.if.close) {
        name = 'if'
        targetType = '#'
    }
    if (counter.not.open !== counter.not.close) {
        name = 'not'
        targetType = '^'
    }
    if (targetType) {
        segments.forEach((segment, key) => {
            if (segment.startsWith('{|')) {
                const baredTag = bareTag(segment)
                const type = baredTag.charAt(0)
                const second = baredTag.substr(0, 2)
                if (type === targetType) {
                    segments[key] = `<span style="color:red;">${segment}</span>`
                }
                if (second === `/${targetType}`) {
                    segments[key] = `<span style="color:red;">${segment}</span>`
                }
            } else {
                segments[key] = entityify(segment)
            }
        })
        throw new WavebarError(`"${name}" tag not match!`, segments)
    }
}

// compile
function compile(builded, params) {
    const values = Object.keys(params).map(prop => params[prop])
    const context = {
        compiled: '',
        values: values,
        entityify: entityify,
        checValue: checValue,
    }
    // assign functions 
    for (const key in wbFunctions.funcs) {
        context[`${key}`] = wbFunctions.funcs[key]
    }
    vm.runInNewContext(builded, context)
    return context.compiled
}







/* funcitons */
function textBuild(value, name) {
    const sub = isDebug ? `[ "${name}" is not found ]` : ''
    return value ? entityify(value) : sub
}

function rowBuild(value, name) {
    const sub = isDebug ? `[ "${name}" not found ]` : ''
    return value ? value : sub
}

function searchParam(body, params, doEntityify = true) {
    param = body.split('.').reduce((o,i)=>o[i], params)
    result = ''
    if (param == null) {
        result = isDebug ? `compiled += [ "${body}" is not found ]\n` : `\n`
    } else {
        body = entityify(param)
        result = doEntityify ? `compiled += '${body}'\n` : `compiled += '${entityify(param)}'\n`
    }

    return result
}













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

function checValue(value) {
    if (value === null || value === false) {
        return false
    }
    if (typeof value === 'undefined') {
        return false
    }
    if (typeof value === 'string' && value === '') {
        return false
    }
    if (typeof value === 'object' && Object.keys(value).length === 0) {
        return false
    }
    return true
}

function bareTag(str) {
    return str.replace(bareReg, '')
}

function bodyTag(str) {
    return str.replace(bodyReg, '')
}

function cleanTag(str) {
    return bodyTag(bareTag(str))
}

function regEscape(str, option = null) {
    const escaped = str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    if (option != null) {
        return new RegExp(escaped, option)
    }
    return new RegExp(escaped)
}

function lining(string) {
    string = string.replace(/\r/g, '')
    return string.replace(/\n/g, nlMarke)
}

function enLining(string) {
    return string.replace(regEscape(nlMarke, 'g'), '\n')
}

function WavebarError(message, segments = null) {
    this.name = 'wavebar tamplate error'
    this.message = message;
    if (segments) {
        const template = segments.join('').replace(regEscape('&lt|/|&gt', 'g'), '\n')
        this.stack = `${this.name} at \n <pre> ${enLining(template)} </pre>`;
    } else {
        this.stack = new Error().stack
    }
}
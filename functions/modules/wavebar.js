const vm = require('vm')
const wbFunctions = require('./wbFunctions')

const isDebug = 0

const templateTagReg = /\{\|.*?\|\}/g
const bareReg = /\{\||\|\}|\s/g
const wrapReg = /\{\|\@.*?\|\}/g
const partReg = /\{\|\>.*?\|\}/g
const bodyReg = /^[>&#^*@~]*/
const replaceMarke = '<|||>'

module.exports.init = (req, res, next) => {
    res.wbRender = (data) => {
        return render(res, data)
    }
    next()
}

/* render */
function render(res, data) {
    let content = (data.content != null) ? data.content : ''
    const wraps = (data.wraps != null) ? data.wraps : {}
    const parts = (data.parts != null) ? data.parts : {}
    const params = (data.params != null) ? data.params : {}

    const merged = merge(content, wraps, parts)
    const segmented = segmentate(merged)
    // console.log('separated--->', segmented)
    const builded = build(segmented, params)
    // console.log('builded--->', builded)
    let compiled = ''
    if (!isDebug) {
        compiled = compile(builded, params)
    }
    // console.log('compiled--->', compiled)

    let soce = compiled
    if (isDebug === 1) {
        soce = builded
    }
    if (isDebug === 2) {
        soce = compiled
    }
    res.send(soce)
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
function segmentate(string) {
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
function build(segmented, params) {
    let builded = `builded = ''\n`
    const counter = {
        for: {
            open: 0,
            close: 0
        },
        if: {
            open: 0,
            close: 0
        },
        not: {
            open: 0,
            close: 0
        },
    }
    segmented.forEach((segment, key) => {
        if (segment.startsWith('{|')) {
            const baredTag = bareTag(segment)
            let type = baredTag.charAt(0)
            switch (type) {
                case '*':
                    counter.for.open++
                        body = bodyTag(baredTag)
                    builded += BuildFor(body)
                    break

                case '#':
                    counter.if.open++
                        body = bodyTag(baredTag)
                    builded += BuildIf(body)
                    break

                case '^':
                    counter.not.open++
                        body = bodyTag(baredTag)
                    builded += BuildElse(body)
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
                    builded += `builded += ${body}\n`
                    break

                case '&':
                    body = buildText(body, false)
                    break

                default:
                    body = baredTag
                    builded += buildText(body)
            }
        } else {
            builded += `builded += '${segment}'\n`
        }
    })

    // check the number of template tag
    checkTag(counter, segmented)

    // console.log(builded)
    return builded
}

// tag not match error
function checkTag(counter, segmented) {
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
        segmented.forEach((segment, key) => {
            if (segment.startsWith('{|')) {
                const baredTag = bareTag(segment)
                const type = baredTag.charAt(0)
                const second = baredTag.substr(0, 2)
                if (type === targetType) {
                    segmented[key] = `<span style="color:red;">${segment}</span>`
                }
                if (second === `/${targetType}`) {
                    segmented[key] = `<span style="color:red;">${segment}</span>`
                }
            } else {
                segmented[key] = entityify(segment)
            }
        })
        throw new WavebarError(`"${name}" tag not match!`, segmented)
    }
}

// compile
function compile(builded, params) {
    // saves the script tags
    let scripts = {}
    let count = 1
    builded = builded.replace(/<script(?: .+?)?>.*?<\/script>/g, match => {
        const key = `{| script${count++}|}`
        scripts[key] = match.replace(/\\n/g, '\n')
        return key
    })

    // create context for vm then set values and functions
    const context = {
        compiled: '',
        entityify: entityify,
        buildText: buildText,
        checkValue: checkValue,
    }
    // expand params then assign to context
    for (const key in params) {
        context[key] = params[key];
    }
    // assign function of wbfunctions file
    for (const key in wbFunctions.funcs) {
        context[key] = wbFunctions.funcs[key]
    }
    // compile builded code
    try {
        let compiled = vm.runInNewContext(builded, context)
        // return the script tag
        for (const key in scripts) {
            compiled = compiled.replace(key, scripts[key])
        }
        // vm contextの中身
        // console.log('vm context', context)
        return compiled
    } catch (err) {
        // TODO:: スタック変更できるかな？
        console.log('vm error!')
        throw err
    }
}

/* build funcitons */
// for
function BuildFor(body) {
    var [array, variable] = body.split(':')
    let text = `if(typeof ${variable} !== 'undefined' && checkValue(${variable}, true)){\n`
    text += `for(let key in ${array}) {\n`
    if (variable) {
        text += `${variable} = ${array}[key]\n`
    } else {
        text += `value = ${array}[key]\n`
    }
    text += `}\n`
    return text
}
// if
function BuildIf(body) {
    var [variable, alias] = body.split(':')
    let text = `if(typeof ${variable} !== 'undefined' && checkValue(${variable})){\n`
    if (alias) {
        text += `const ${alias} = ${variable}\n`
    }
    return text
}
// else
function BuildElse(body) {
    var [variable, alias] = body.split(':')
    let text = `if(typeof ${variable} === 'undefined' || !checkValue(${variable})){\n`
    if (alias) {
        text += `const ${alias} = ${variable}\n`
    }
    return text
}
// text
function buildText(body, doEntityify = true) {
    let text = `if(typeof ${body} !== 'undefined' && checkValue(${body})){\n`
    if (doEntityify) {
        text += `builded += entityify(${body});\n`
    } else {
        text += `builded += ${body}\n`
    }
    text += `} else {\n`
    if (isDebug) {
        text += `builded += '[ "${body}" is not defined! ]'\n`
    } else {
        text += `builded += ''\n`
    }
    text += `}\n`
    return text
}

/* in vm functions */
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

function checkValue(value, isObject = false) {
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
    if (isObject) {
        if (typeof value !== 'object'){
            return false
        }
    }
    return true
}

/* tag control functions */
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

/* Wavebar Error */
function WavebarError(message, segmented = null) {
    this.name = 'wavebar tamplate error'
    this.message = message;
    if (segmented) {
        const template = segmented.join('').replace(regEscape('&lt|/|&gt', 'g'), '\n')
        this.stack = `${this.name} at \n <pre> ${enLining(template)} </pre>`;
    } else {
        this.stack = new Error().stack
    }
}

function lining(string) {
    string = string.replace(/\r/g, '')
    string = string.replace(/\n/g, '\\n')
    return string
}
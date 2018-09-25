const vm = require('vm')
const wbFunctions = require('./wbFunctions')

module.exports = class wavebar {

    constructor() {
        this.isDebug = 2

        this.templateTagReg = /\{\|.*?\|\}/g
        this.bareReg = /\{\||\|\}|\s/g
        this.wrapReg = /\{\|\@.*?\|\}/g
        this.partReg = /\{\|\>.*?\|\}/g
        this.bodyReg = /^[>&#^*@~]*/
        this.replaceMarke = '<|||>'

        this.content = ''
        this.templates = ''
        this.params = ''
        // console.log('===>', 'in constructore!')
    }

    static init(req, res, next) {
        // console.log('===>', 'in init!')
        const instance = new wavebar()

        res.wbRender = (data, contentType = null) => {
            return instance.render(res, data, contentType)
        }

        next()
    }

    /* render */
    render(res, data, contentType) {
        // console.log('===>', 'in render!')
        console.time('wavebar render time')

        this.content = (data.content != null) ? data.content : ''
        this.templates = (data.templates != null) ? data.templates : {}
        this.params = (data.params != null) ? data.params : {}
        const merged = this.merge()
        const segmented = this.segmentate(merged)
        const builded = this.build(segmented)

        let compiled = this.compile(builded)
        let source = compiled
        // isDebug === 1は「is not defined!」を出す
        if (this.isDebug === 2) {
            source = merged
        }
        if (this.isDebug === 3) {
            source = segmented
        }
        if (this.isDebug === 4) {
            source = builded
        }

        // http://expressjs.com/ja/api.html#res.type
        res.type(contentType != null ? contentType : 'html')
        // TODO:: どこで設定させる？
        // https://firebase.google.com/docs/hosting/functions
        res.set('Cache-Control', 'public, max-age=300, s-maxage=600')
        console.timeEnd('wavebar render time')
        res.send(source)
    }

    /* tag control functions */
    bareTag(str) {
        return str.replace(this.bareReg, '')
    }

    bodyTag(str) {
        return str.replace(this.bodyReg, '')
    }

    cleanTag(str) {
        return this.bodyTag(this.bareTag(str))
    }

    lining(string) {

        string = string.replace(/\r/g, '')
        string = string.replace(/\n/g, '\\n')
        return string

        // TODO:: これを使うとscriptもうまくいくかも？
        // encodeURIComponent
        // decodeURIComponent

    }

    /* build funcitons */
    // for
    BuildFor(body) {
        var [array, variable] = body.split(':')
        let text = `if(isExist("${variable}", params,  true)){\n`
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
    BuildIf(body) {
        var [variable, alias] = body.split(':')

        let text = `if(isExist("${variable}", params)){\n`
        if (alias) {
            text += `const ${alias} = ${variable}\n`
        }
        return text
    }
    // else
    BuildElse(body) {
        var [variable, alias] = body.split(':')
        let text = `if(!isExist("${variable}", params)){\n`
        if (alias) {
            text += `const ${alias} = ${variable}\n`
        }
        return text
    }
    // text
    buildText(body, doEntityify = true) {

        let text = `if(isExist("${body}", params)){\n`
        if (doEntityify) {
            text += `builded += entityify(${body});\n`
        } else {
            text += `builded += ${body}\n`
        }
        text += `} else {\n`
        if (this.isDebug) {
            text += `builded += '[ "${body}" is not defined! ]'\n`
        } else {
            text += `builded += ''\n`
        }
        text += `}\n`
        return text
    }

    // reg Escape
    regEscape(str, option = null) {
        const escaped = str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
        if (option != null) {
            return new RegExp(escaped, option)
        }
        return new RegExp(escaped)
    }

    // tag not match error
    checkTag(counter, segmented) {
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

    /* in vm functions */
    entityify(string) {
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

    // TODO:: check "Catch Cannot read property"
    isExist(value, params, isObject = false) {
        let result = null
        value.split('.').forEach(path => {
            result = params[path]
        })

        try {
            if (result === null || result === false) {
                return false
            }
            if (typeof result === 'undefined') {
                return false
            }
            if (typeof result === 'string' && result === '') {
                return false
            }
            if (typeof result === 'object' && Object.keys(result).length === 0) {
                return false
            }
            if (isObject) {
                if (typeof result !== 'object') {
                    return false
                }
            }
            return true
        } catch (e) {

            return false
        }
    }

    /* merge */
    merge() {
        // console.log('===>', 'in merge!')
        // change new line to mark
        let content = this.lining(this.content)
        // insert wrap content
        const wrapTags = content.match(this.wrapReg)
        if (wrapTags) {
            wrapTags.reverse()
            wrapTags.forEach(wrapTag => {

                // get wrap content
                const bodiedTag = this.cleanTag(wrapTag)
                if (this.templates[bodiedTag] == null) {
                    throw new WavebarError(`wrapTag "${bodiedTag}" is not defined!`)
                }

                const wrapContent = this.lining(this.templates[bodiedTag])

                // ラッパーのコンテントの中に有るタグを検索
                const contentSideTags = wrapContent.match(this.wrapReg)

                contentSideTags.forEach(contentSideTag => {
                    const contentSideBodiedTag = this.cleanTag(contentSideTag)
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
        const partTags = content.match(this.partReg)
        if (partTags) {

            partTags.forEach(partTag => {

                const bodiedTag = this.cleanTag(partTag)

                if (this.templates[bodiedTag] == null) {
                    throw new WavebarError(`partTag "${bodiedTag}" is not defined!`)
                }
                const partContent = this.lining(this.templates[bodiedTag])
                content = content.replace(partTag, partContent)
            })
        }

        return content
    }

    /* segmentate */
    segmentate(string) {
        // console.log('===>', 'in segmentate!')
        let line = this.lining(string)
        const matches = line.match(this.templateTagReg)
        const replaceMarke = this.replaceMarke

        let replaces = []
        for (let key in matches) {
            replaces[matches[key]] = `${replaceMarke}${matches[key]}${replaceMarke}`
        }

        for (let key in replaces) {
            const value = replaces[key]
            line = line.replace(this.regEscape(key, 'g'), value)
        }
        return line.split(replaceMarke)
    }

    /* build */
    build(segmented) {
        // console.log('===>', 'in build!')
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
                const baredTag = this.bareTag(segment)
                let type = baredTag.charAt(0)
                let body = ''
                switch (type) {
                    case '*':
                        counter.for.open++
                        body = this.bodyTag(baredTag)
                        builded += this.BuildFor(body)
                        break

                    case '#':
                        counter.if.open++
                        body = this.bodyTag(baredTag)
                        builded += this.BuildIf(body)
                        break

                    case '^':
                        counter.not.open++
                        body = this.bodyTag(baredTag)
                        builded += this.BuildElse(body)
                        break

                    case '/':
                        body = this.bodyTag(baredTag)
                        const second = baredTag.charAt(1)
                        if (second === '*') counter.for.close++
                        if (second === '#') counter.if.close++
                        if (second === '^') counter.not.close++
                        builded += `}\n`
                        break

                    case '~':
                        body = this.bodyTag(baredTag)
                        builded += `builded += ${body}\n`
                        break

                    case '&':
                        body = this.buildText(body, false)
                        break

                    default:
                        body = baredTag
                        builded += this.buildText(body)
                }
            } else {
                builded += `builded += '${segment}'\n`
            }
        })

        // check the number of template tag
        this.checkTag(counter, segmented)

        // console.log(builded)
        return builded
    }

    /* compile */
    compile(builded) {
        // console.log('===>', 'in compile!')

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
            entityify: this.entityify,
            buildText: this.buildText,
            isExist: this.isExist,
        }

        // expand params then assign to context
        // TODO:: ここでparamsごと投げる？
        context.params = this.params
        for (const key in this.params) {
            context[key] = this.params[key]
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
}

/* Wavebar Error */
class WavebarError extends Error {
    constructor(message, segmented = null) {
        super(message)
        this.name = 'wavebar tamplate error'
        this.message = message
        if (segmented) {
            const template = segmented.join('').replace(regEscape('&lt|/|&gt', 'g'), '\n')
            this.stack = `${this.name} at \n <pre> ${enLining(template)} </pre>` /*  */
        } else {
            this.stack = new Error().stack
        }
    }
}
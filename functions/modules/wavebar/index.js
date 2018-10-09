const vm = require(`vm`)
const wbFunctions = require(`./wbFunctions`)
const debug = require('../../modules/debug').debug

module.exports = class wavebar {

    constructor() {
        this.isDebug = 0

        this.templateTagReg = /\{\|.*?\|\}/g
        this.bareReg = /\{\||\|\}|\s/g
        this.wrapReg = /\{\|\@.*?\|\}/g
        this.partReg = /\{\|\>.*?\|\}/g
        this.bodyReg = /^[>&#^*@~]*/
        this.replaceMarke = `<|||>`

        this.content = ``
        this.templates = ``
        this.params = ``

        this.merged = null
        this.segmented = null
        this.builded = null
        this.countTags = null

        // console.log(`===>`, `in constructore!`)
    }

    static init(req, res, next) {
        // console.log(`===>`, `in init!`)
        const instance = new wavebar()

        res.wbRender = (data) => {
            return instance.render(res, data)
        }

        next()
    }

    /* render */
    render(res, data) {
        // console.log(`===>`, `in render!`)
        console.time(`[time] wavebar render`)

        this.content = (data.content != null) ? data.content : ``
        this.templates = (data.templates != null) ? data.templates : {}
        this.params = (data.params != null) ? data.params : {}
        this.contentType = data.contentType != null ? data.contentType : `html`
        // debug(this.params.divisions, __filename, __line)

        // isDebug === 1は「is not defined!」を出す
        this.merge()
        if (this.isDebug === 2) {
            res.send(this.merged)
        }
        this.segmentate()
        if (this.isDebug === 3) {
            res.send(this.segmented)
        }
        this.build()
        if (this.isDebug === 4) {
            res.send(builded)
        }

        // check the number of template tag
        this.checkTag(this.countTags, this.segmented)
        
        const compiled = this.compile(this.builded)

        // http://expressjs.com/ja/api.html#res.type
        res.type(this.contentType)

        console.timeEnd(`[time] wavebar render`)
        console.log(`\n\n\n>>>>>>>>>> app end ${data.params.unique} <<<<<<<<<<\n\n`)
        return res.send(compiled)
    }

    /* merge */
    merge() {
        // console.log(`===>`, `in merge!`)
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
                        content = content.replace(wrapTag, ``)
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

        // backquote escape
        content = content.replace(/'/g, '\\\'')

        this.merged = content
    }

    /* segmentate */
    segmentate() {
        // console.log(`===>`, `in segmentate!`)
        const replaceMarke = this.replaceMarke

        const matches = this.merged.match(this.templateTagReg)

        let replaces = {}
        matches.forEach(match => {
            replaces[match] = `${replaceMarke}${match}${replaceMarke}`
        })

        let segmented = this.merged
        for (let key in replaces) {
            const value = replaces[key]
            segmented = segmented.replace(this.regEscape(key, `g`), value)
        }

        this.segmented = segmented.split(replaceMarke)
    }

    /* build */
    build() {
        // console.log(`===>`, `in build!`)
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

        this.segmented.forEach((segment, key) => {

            if (segment.startsWith(`{|`)) {
                const baredTag = this.bareTag(segment)
                let type = baredTag.charAt(0)
                let body = ``
                switch (type) {

                    case `*`:
                        counter.for.open++
                        body = this.bodyTag(baredTag)
                        builded += this.BuildFor(body)
                        break

                    case `#`:
                        counter.if.open++
                        body = this.bodyTag(baredTag)
                        builded += this.BuildIf(body)
                        break

                    case `^`:
                        counter.not.open++
                        body = this.bodyTag(baredTag)
                        builded += this.BuildElse(body)
                        break

                    case `/`:
                        body = this.bodyTag(baredTag)
                        const second = baredTag.charAt(1)
                        if (second === `*`) {
                            builded += `}\n`
                            builded += `}\n`
                            counter.for.close++
                        }
                        if (second === `#`) {
                            builded += `}\n`
                            counter.if.close++
                        }
                        if (second === `^`) {
                            builded += `}\n`
                            counter.not.close++
                        }
                        break

                    case `~`:
                        body = this.bodyTag(baredTag)
                        builded += `builded += ${body}\n`
                        break

                    case `&`:
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

        // console.log(builded)
        this.countTags = counter
        this.builded = builded
    }

    // check exist function
    // isExist(typeof value)
    isExist(value) {
        return value !== 'undefined';
    }

    isCorrect(value) {
        if (value === null || value === false) {
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

    isObject(value) {
        return typeof value === 'object' && Object.keys(value).length !== 0
    }

    /* build funcitons */
    // for
    BuildFor(body) {
        var [array, variable] = body.split(`:`)
        let text = `if(isExist(typeof ${array}) && isCorrect(${array}) && isObject(${array})){\n`
        text += `for(let key in ${array}) {\n`
        if (variable) {
            text += `${variable} = ${array}[key]\n`
        } else {
            text += `value = ${array}[key]\n`
        }
        return text
    }
    // if
    BuildIf(body) {
        var [variable, alias] = body.split(`:`)

        let text = `if(isExist(typeof ${variable}) && isCorrect(${variable})){\n`
        if (alias) {
            text += `const ${alias} = ${variable}\n`
        }
        return text
    }
    // else
    BuildElse(body) {
        var [variable, alias] = body.split(`:`)
        let text = `if(!isExist(typeof ${variable}) || !isCorrect(${variable})){\n`
        if (alias) {
            text += `const ${alias} = ${variable}\n`
        }
        return text
    }
    // text
    buildText(body, doEntityify = true) {
        var variable = body
        let text = `if(isExist(typeof ${variable}) && isCorrect(${variable}) && !isObject(${variable})){\n`
        if (doEntityify) {
            text += `builded += entityify(${variable});\n`
        } else {
            text += `builded += ${variable}\n`
        }
        text += `} else {\n`
        if (this.isDebug) {
            text += `builded += '[ "${variable}" is not defined! ]'\n`
        } else {
            text += `builded += ''\n`
        }
        text += `}\n`
        return text
    }

    /* compile */
    compile(builded) {
        // console.log(`===>`, `in compile!`)

        // create context for vm then set values and functions
        const context = {
            entityify: this.entityify,
            buildText: this.buildText,
            isExist: this.isExist,
            isCorrect: this.isCorrect,
            isObject: this.isObject,
        }

        // expand params then assign to context
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

            // vm contextの中身
            // console.log(`vm context`, context)
            return compiled
        } catch (err) {
            // TODO:: スタック変更できるかな？
            console.log(context)
            console.log(`vm error! ${err.message}`)
            // throw new Error()
            throw err
        }
    }

    /* lining */
    // encode
    lining(string) {

        string = string.replace(/\r/g, ``)
        string = string.replace(/\n/g, `\\n`)
        return string
    }
    // decode
    enLining() {
        return
    }

    /* tag control functions */
    bareTag(str) {
        return str.replace(this.bareReg, ``)
    }

    bodyTag(str) {
        return str.replace(this.bodyReg, ``)
    }

    cleanTag(str) {
        return this.bodyTag(this.bareTag(str))
    }

    // reg Escape
    regEscape(str, option = null) {
        const escaped = str.replace(/[-\/\\^$*+?.()|[\]{}]/g, `\\$&`)
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
            name = `for`
            targetType = `*`
        }
        if (counter.if.open !== counter.if.close) {
            name = `if`
            targetType = `#`
        }
        if (counter.not.open !== counter.not.close) {
            name = `not`
            targetType = `^`
        }
        if (targetType) {
            segmented.forEach((segment, key) => {
                if (segment.startsWith(`{|`)) {
                    const baredTag = this.bareTag(segment)
                    const type = baredTag.charAt(0)
                    const second = baredTag.substr(0, 2)
                    if (type === targetType) {
                        segmented[key] = `<span style="color:red;">${segment}</span>`
                    }
                    if (second === `/${targetType}`) {
                        segmented[key] = `<span style="color:red;">${segment}</span>`
                    }
                } else {
                    segmented[key] = this.entityify(segment)
                }
            })
            throw new WavebarError(`"${name}" tag not match!`, segmented)
        }
    }

    /* in vm functions */
    entityify(string) {
        var chars = {}
        chars[`<`] = `&lt`
        chars[`>`] = `&gt`,
            chars[`&`] = `&amp`,
            chars[`"`] = `&quot`,
            chars[`'`] = `&#39`

        return String(string).replace(/[<>'&"]/g, char => {
            return chars[char]
        })
    }
}

/* Wavebar Error */
class WavebarError extends Error {
    constructor(message, segmented = null) {
        super(message)
        this.name = `wavebar tamplate error`
        this.message = message
        if (segmented) {

            const template = segmented.join(``).replace(/\\n/g, `\n`)
            this.stack = `${this.name} at \n <pre> ${template} </pre>`
        } else {
            this.stack = new Error().stack
        }
    }
}
const vm = require(`vm`)
const wbFunctions = require(`./wbFunctions`)
const debug = require('../../modules/debug').debug

module.exports = class wavebar {

    constructor() {
        this.isDebug = 0

        this.templateTagReg = /\{\|.*?\|\}/g
        this.bareReg = /\{\||\|\}/g

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
            return instance.render(req, res, data)
        }

        next()
    }

    /* render */
    render(req, res, data) {

        // console.log(`===>`, `in render!`)
        console.time(`[time] wavebar render`)

        // console.log('@@@', req.__('Hello {{name}}', { name: 'kohei' }))

        this.__ = req.__

        this.content = (data.content != null) ? data.content : ``
        this.templates = (data.templates != null) ? data.templates : {}
        this.params = (data.params != null) ? data.params : {}
        this.contentType = data.contentType != null ? data.contentType : `html`
        // debug(this.params.divisions, __filename, __line)

        // isDebug === 1は「is not defined!」を出す
        const merged = this.merge()
        if (this.isDebug === 2) {
            res.send(merged)
        }

        this.segmentate()
        if (this.isDebug === 3) {
            res.send(this.segmented)
        }
        this.build()
        if (this.isDebug === 4) {
            res.send(this.builded)
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
        return content
    }

    /* segmentate */
    segmentate() {
        // console.log(`===>`, `in segmentate!`)
        const replaceMarke = this.replaceMarke
        const matches = this.merged.match(this.templateTagReg)

        if (matches === null) {

            this.segmented = [this.merged]
        } else {

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
    }

    /* build */
    build() {
        // console.log(`===>`, `in build!`)
        let builded = `builded = '';\n`
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

                    case `!`:
                        builded += ''
                        break

                    case `*`:
                        counter.for.open++
                        body = this.bodyTag(baredTag)
                        builded += this.buildFor(body)
                        break

                    case `#`:
                        counter.if.open++
                        body = this.bodyTag(baredTag)
                        builded += this.buildIf(body)
                        break

                    case `^`:
                        counter.not.open++
                        body = this.bodyTag(baredTag)
                        builded += this.buildElse(body)
                        break

                    case `/`:
                        body = this.bodyTag(baredTag)
                        const second = baredTag.charAt(1)
                        if (second === `*`) {
                            builded += `}\n}\n}\n`
                            counter.for.close++
                        }
                        if (second === `#`) {
                            builded += `}\n}\n`
                            counter.if.close++
                        }
                        if (second === `^`) {
                            builded += `}\n}\n`
                            counter.not.close++
                        }
                        break

                    case `~`:
                        body = this.bodyTag(baredTag)
                        // builded += `builded += ${body}\n`
                        builded += this.buildFunc(body)
                        break

                    case `&`:
                        body = this.bodyTag(baredTag)
                        builded += this.buildText(body, false)
                        break

                    default:
                        body = baredTag
                        builded += this.buildText(body)
                }
            } else {
                builded += `builded += '${segment}';\n`
            }
        })

        // console.log(builded)
        this.countTags = counter
        this.builded = builded
    }

    /* in build funcitons */
    isCorrect(value) {
        if (typeof value === 'undefined') {
            return false
        }
        if (value === null || value === false) {
            return false
        }
        if (typeof value === 'string' && value === '') {
            return false
        }
        if (typeof value === 'object' && Object.keys(value).length === 0) {
            return false
        }
        return value
    }

    isText(value) {
        if (typeof value === 'string' || typeof value === 'number') {
            return value
        }
        return false
    }

    isObject(value) {
        if (typeof value === 'object') {
            return value
        }
        return false
    }

    /* build funcitons */
    // func
    buildFunc(body) {
        const valiableFunc = body.split(`=`)
        const valiable = valiableFunc.shift().trim()
        let func = valiableFunc.shift()
        valiable = valiable != null ? func.trim() : valiable

        debug(valiable, __filename, __line)
        debug(func, __filename, __line)

        let text = `\n`
        if(valiable){
            text += `const ${valiable} = ${func};\n`
        } else {
            text += `builded += ${func};\n`
        }
        // text += `}\n`
        return text
    }
    // for
    buildFor(body) {
        const objectVariable = body.split(`:`)
        const object = objectVariable.shift().trim()
        let variable = objectVariable.shift()
        variable = variable != null ? variable.trim() : 'value'

        let text = `{\n`
        text += `let object = false;\n`
        text += `try{\n`
        text += `object = isCorrect(${object});\n`
        text += `object = isObject(object);\n`
        text += `}catch(e){}\n`

        text += `if(object !== false){\n`
        text += `for(let key in object) {\n`
        text += `const ${variable} = object[key];\n`
        return text
    }
    // if
    buildIf(body) {
        const variableAlias = body.split(`:`)
        const variable = variableAlias.shift().trim()
        let alias = variableAlias.shift()
        alias = alias != null ? alias.trim() : false

        let text = `{\n`
        text += `let variable = false;\n`
        text += `try{\n`
        text += `variable = isCorrect(${variable});\n`
        text += `}catch(e){}\n`

        text += `if(variable !== false){\n`
        if (alias) {
            text += `const ${alias} = variable\n`
        }
        return text
    }
    // else
    buildElse(body) {
        let variable = body
        let text = `{\n`
        text += `let variable = false;\n`
        text += `try{\n`
        text += `variable = isCorrect(${variable});\n`
        text += `}catch(e){}\n`

        text += `if(variable === false){\n`

        return text
    }
    // text
    buildText(body, doEntityify = true) {
        let variable = body
        let text = `{\n`
        text += `let variable = false;\n`
        text += `try{\n`
        text += `variable = isCorrect(${variable});\n`
        text += `variable = isText(variable);\n`
        text += `}catch(e){}\n`

        text += `if(variable !== false){\n`
        if (doEntityify) {
            text += `builded += entityify(variable);\n`
        } else {
            text += `builded += variable\n`
        }
        text += `}\n}\n`
        return text
    }

    /* tag not match error */
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

    /* compile */
    compile(builded) {
        // console.log(`===>`, `in compile!`)

        // create context for vm then set values and functions
        const context = {
            entityify: this.entityify,
            buildText: this.buildText,
            isExist: this.isExist,
            isCorrect: this.isCorrect,
            isText: this.isText,
            isObject: this.isObject,
            __: this.__,
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
            // console.log(context)
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
        return str.replace(this.bareReg, ``).trim()
    }

    bodyTag(str) {
        return str.replace(this.bodyReg, ``).trim()
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
            this.stack = `${this.name} at \n <pre style="border:1px #ccc solid; padding:0.5rem;"> ${template} </pre>`
        } else {
            this.stack = new Error().stack
        }
    }
}
/**
 * @author      Created by kohx <kohei.0728@gmail.com> on 2018-11-20.
 * @link        https://github.com
 * @license     http://opensource.org/licenses/MIT
 *
 * @version     0.0.1
 */

module.exports = class translator {

    constructor(locales, lang = null) {
        this.version = '0.0.1';

        this.inst = null
        this.reg = /(\{\{).*?(\}\})/g
        this.lang = lang != null ? lang : 'en'

        this.locales = locales
        this.locales = {
            en: {
                'asdf {{param1}} - {{param2}} asf!': 'asdf {{param1}} - {{param2}} asf!'
            }
        }
    }

    init(locales, lang = null) {
        if (this.inst != null) {
            this.inst = new translator(locales, lang)
        }
        return this.inst
    }

    __(str, params, lang = null) {

        lang = lang != null ? lang : this.lang
        const locale = this.locales[lang]
        const sentence = locale[str] != null ? locale[str] : str

        var result = sentence.replace(this.reg, match => {
            let replacement = params[match.slice(2, -2)]
            replacement = replacement != null ? replacement : ''
            return replacement
        })

        return result
    }

    setLang(lang) {
        this.lang = lang
    }

    getLang() {
        return this.lang
    }
}

const debug = require('../../modules/debug').debug


module.exports.funcs = {

    /* 引数にストリングを使うときは「”」のみ使用可能 */

    /**
     * is
     * {|# is("divisions") |}
     */

    /**
     * inParents
     * {|# inParents("divisions") |}
     */

    /**
     * __
     * {|~ __("check {{thing}}.", {thing: target.unique}) |}
     */

    /**
     * de
     * {|~  de(thing) |}
     */
    de: (value) => {
        const type = typeof (value)
        let result = '';
        switch (type) {
            case 'object':
                result = `${type} -> ${JSON.stringify(value, null, '<br>')}`
                break;

            default:
                result = `${type} -> ${value} `
                break
        }
        return result
    },

    /**
     * equal
     * {|# equal(targetName, "lang")|} this is equal {|/#|}
     */
    equal: (value1, value2) => {
        return value1 == value2
    },

    /**
     * toString
     * {|~ toString(itemValue) |}
     */
    toString: (value) => {
        let type = typeof value
        if (type === 'object') {
            type = Array.isArray(type) ? 'array' : type
        }
        result = ''
        switch (type) {
            case 'object':
                result = JSON.stringify(value)
                break;

            case 'array':
                result = value.toString()
                break;
            default:
                break;
        }
        return result
    },

    test: () => {
        return 'test'
    }
}
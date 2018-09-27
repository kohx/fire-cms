// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const debug = require('../../../modules/debug').debug

// サインインしてからのリミット
const limit = 60 * 60 * 24

/* csrf function */
module.exports.csrf = (req, res, next) => {

    // Get unique
    const unique = req.vessel.get('paths.unique')

    // allow unique
    // TODO:: ここは各thingから取得
    const unauthorityUniques = req.vessel.get('settings.backend.unauthorityUniques', [])






    // サインインページの場合
    if (unauthorityUniques.includes(unique)) {

        // セッションクッキーを取得
        const session = (req.cookies.__session != null) ? JSON.parse(req.cookies.__session) : {}
        // csrfToken
        const csrfToken = Math.random().toString(36).slice(-8)
        const options = {
            httpOnly: true, // HTTPリクエストを行う際以外に使用できないものであるかを真偽値として指定
            secure: true, // 安全に送信されなければならないものであるかを真偽値として指定
        }

        // セッションクッキーにcsrfTokenをセット
        session.csrfToken = csrfToken
        res.cookie('__session', JSON.stringify(session), options)

        req.vessel.csrfToken = csrfToken
    }

    next()
}

/* check middle ware */
module.exports.check = (req, res, next) => {
    debug(req.vessel.thing, __filename, __line)
    
    // sign object
    const sign = {
        status: false,
        message: '',
        user: {},
    }

    // セッション Cookie を確認して権限をチェック
    const session = (req.cookies.__session != null) ? JSON.parse(req.cookies.__session) : []
    const sessionCookie = (session['sessionCookie'] != null) ? session['sessionCookie'] : false

    // sessionCookieがない場合
    if (!sessionCookie) {

        sign.status = false
        sign.message = `sign in failed. there is not sessionCookie.`
        req.vessel.sign = sign
        next()
    } else {

        // セッションCookieを確認、 この場合、追加のチェックが追加され
        // この場合、追加のチェックが追加され、ユーザのFirebaseセッションが取り消されたか、ユーザの削除/無効化されたかなどを検出
        admin.auth().verifySessionCookie(sessionCookie, true)
            .then(decodedClaims => {

                // ユーザーが過去limit秒間以上サインインしていない場合はリサインイン
                const now = new Date().getTime() / 1000 - decodedClaims.auth_time
                if (now >= limit) {

                    sign.status = false
                    sign.message = `sign in failed. recent sign in required. limit: ${limit}`
                    req.vessel.sign = sign
                    next()
                } else {

                    sign.status = true
                    sign.message = `sign in success.`
                    sign.user = decodedClaims
                    req.vessel.sign = sign
                    next()
                }
            })
            .catch(err => {
                sign.status = false
                sign.message = `sign in failed. ${err.message}`
                req.vessel.sign = sign
                next()
            })
    }
}

/* in function */
module.exports.in = (req, res, next) => {

    // postされたIDトークンとCSRFトークンを取得
    const idToken = (req.body.idToken != null) ? req.body.idToken : false
    if (!idToken) {
        res.json({
            status: false,
            message: `there is not idToken in post data.`
        })
        return
    }

    const bodyCsrfToken = (req.body.csrfToken != null) ? req.body.csrfToken : false
    if (!bodyCsrfToken) {
        res.json({
            status: false,
            message: `there is not csrfToken in post data.`
        })
        return
    }

    // __sessionからcsrfTOkenを取得
    const session = (req.cookies.__session != null) ? JSON.parse(req.cookies.__session) : []
    const cookieCsrfToken = (session['csrfToken'] != null) ? session['csrfToken'] : false
    if (!cookieCsrfToken) {
        res.json({
            status: false,
            message: `there is not cookieCsrfToken.`
        })
        return
    }

    // Guard against CSRF attacks
    if (bodyCsrfToken !== cookieCsrfToken) {
        res.json({
            status: false,
            message: `csrfToken is not match.`
        })
        return
    }

    // headerのbrarerに入れたidToken
    const bearer = req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split('Bearer ')[1] : false

    // bearerのチェック
    if (!bearer || !idToken || bearer !== idToken) {
        res.json({
            status: false,
            message: `bearer is not true.`
        })
        return
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    // セッションCookieを作成、これにより、プロセス内のIDトークンも検証
    // セッションクッキーは、IDトークンと同じ要求を持つ

    admin.auth().createSessionCookie(idToken, {
        expiresIn
    })
        .then(sessionCookie => {
            // セッションCookieのCookieポリシーを設定
            const options = {
                // 有効期限を5日に設定
                maxAge: 60 * 60 * 24 * 5 * 1000,
                httpOnly: true,
                secure: true
            };

            // サインイン成功
            session.sessionCookie = sessionCookie
            res.cookie('__session', JSON.stringify(session), options);
            res.json({
                status: true,
                message: `sign in success.`
            })
        })
        .catch(err => {
            res.json({
                status: false,
                message: err.message
            })
        })
}

/* out function */
module.exports.out = (req, res, next) => {

    // セッション Cookie を取得
    const session = (req.cookies.__session != null) ? JSON.parse(req.cookies.__session) : []
    const sessionCookie = (session['sessionCookie'] != null) ? session['sessionCookie'] : false

    if (!sessionCookie) {
        res.json({
            status: false,
            message: `there is not sessionCookie.`
        })
        return
    }

    // セッションをクリア
    res.clearCookie('__session')

    admin.auth().verifySessionCookie(sessionCookie)
        .then(decodedClaims => {

            return admin.auth().revokeRefreshTokens(decodedClaims.sub)
                .then(() => {
                    res.json({
                        status: false,
                        message: `sign out.`
                    })
                })
                .catch(err => {
                    res.json({
                        status: true,
                        message: `sign out failed.`
                    })
                })
        })
        .catch(err => {
            res.json({
                status: true,
                message: `there is not claims.`
            })
        })
}
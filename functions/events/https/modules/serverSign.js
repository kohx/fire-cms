// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin

/* in */
module.exports.in = (res, req) => {
  console.log('-> sign in')
  return new Promise((resolve, reject) => {
    // poatされたIDトークンとCSRFトークンを取得
    const idToken = req.body.idToken
    const bodyCsrfToken = req.body.csrfToken

    // __sessionからcsrfTOkenを取得
    const sessionCookieJsonString = req.cookies.__session || '{}'
    const cookieCsrfToken = JSON.parse(sessionCookieJsonString)['csrfToken'] || null

    // Guard against CSRF attacks.
    if (bodyCsrfToken !== cookieCsrfToken) {
      reject({ signin: false, redirect: true, message: `there is not csrfToken.` })
    }

    // headerのbrarerに入れたidToken
    const bearer = req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split('Bearer ')[1] : false

    // bearerのチェック
    if (bearer !== idToken) {
      reject({ signin: false, redirect: false, message: `bearer is not true.` })
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    // セッションCookieを作成、これにより、プロセス内のIDトークンも検証
    // セッションクッキーは、IDトークンと同じ要求を持つ

    admin.auth().createSessionCookie(idToken, { expiresIn })
      .then(sessionCookie => {
        // セッションCookieのCookieポリシーを設定
        const options = {
          // 有効期限を5日に設定
          maxAge: 60 * 60 * 24 * 5 * 1000,
          httpOnly: true,
          secure: true
        };

        // サインイン成功
        const data = { sessionCookie }
        res.cookie('__session', JSON.stringify(data), options);
        resolve({ signin: true, redirect: false, message: `sign in success.` })
      })
      .catch(err => {
        reject({ signin: false, redirect: false, message: err.message })
      })
  })
}

/* out */
module.exports.out = (req, res) => {
  console.log('-> sign check')
  return new Promise((resolve, reject) => {

    // セッション Cookie を取得
    const sessionCookieJsonString = req.cookies.__session || '{}'
    const sessionCookie = JSON.parse(sessionCookieJsonString)['sessionCookie'] || null

    if (!sessionCookie) {
      reject({ signin: false, message: `there is not sessionCookie.` })
    }

    // セッションをクリア
    res.clearCookie('__session')

    admin.auth().verifySessionCookie(sessionCookie)
      .then(decodedClaims => {
        return admin.auth().revokeRefreshTokens(decodedClaims.sub)
          .then(() => {
            resolve({ signin: false, message: `sign out.` })
          })
          .catch(err => {
            reject({ signin: true, message: `sign out failed.` })
          })
      })
      .catch(err => {
        reject({ signin: false, message: `there is not claims.` })
      })
  })
}
// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin

/* csrf */
module.exports.csrf = (res) => {

  // csrfToken
  const csrfToken = Math.random().toString(36).slice(-8)

  const options = {
    httpOnly: true, // HTTPリクエストを行う際以外に使用できないものであるかを真偽値として指定
    secure: true, // 安全に送信されなければならないものであるかを真偽値として指定
  }

  const data = { csrfToken }
  res.cookie('__session', JSON.stringify(data), options)

  return csrfToken
}

/* in */
module.exports.in = (res, req) => {
  console.log('-> sign in')
  return new Promise((resolve, reject) => {
    // poatされたIDトークンとCSRFトークンを取得
    const idToken = req.body.idToken
    const bodyCsrfToken = req.body.csrfToken

    // headerのbrarerに入れたidToken
    const bearer = req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split('Bearer ')[1] : false

    // bearerのチェック
    if (bearer !== idToken) {
      reject({ signin: false, message: `bearer is not true.` })
    }

    // __sessionからcsrfTOkenを取得
    const sessionCookieJsonString = req.cookies.__session || '{}'
    const cookieCsrfToken = JSON.parse(sessionCookieJsonString)['csrfToken'] || null

    // Guard against CSRF attacks.
    if (bodyCsrfToken !== cookieCsrfToken) {
      reject({ signin: false, message: `there is not csrfToken.` })
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

        // 
        const data = { sessionCookie }
        res.cookie('__session', JSON.stringify(data), options);
        resolve({ signin: true, message: `sign in success.` })
      })
      .catch(err => {
        reject({ signin: false, message: err.message })
      })
  })
}

/* out */
module.exports.out = (req, res) => {
  console.log('-> sign check')
  return new Promise((resolve, reject) => {

    // セッション Cookie を取得
    console.log(req.cookies)
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

/* check */
module.exports.check = (req) => {
  console.log('-> sign check')
  return new Promise((resolve, reject) => {
    // セッション Cookie を確認して権限をチェック
    const sessionCookieJsonString = req.cookies.__session || '{}'
    const sessionCookie = JSON.parse(sessionCookieJsonString)['sessionCookie'] || null

    if (!sessionCookie) {
      reject({ signin: false, message: `there is not sessionCookie.` })
    }

    // セッションCookieを確認、 この場合、追加のチェックが追加され
    // この場合、追加のチェックが追加され、ユーザのFirebaseセッションが取り消されたか、ユーザの削除/無効化されたかなどを検出
    admin.auth().verifySessionCookie(sessionCookie, true)
      .then(decodedClaims => {

        // ユーザーが過去5分間にサインインした場合はリサインイン
        console.log('decodedClaims', decodedClaims)
        const limit = 5 * 60
        const now = new Date().getTime() / 1000 - decodedClaims.auth_time
        console.log(now)
        if (new Date().getTime() / 1000 - decodedClaims.auth_time >= limit) {
          reject({ signin: false, message: `recent sign in required.` })
        }

        resolve({ signin: false, message: err.message, claims: decodedClaims })
      })
      .catch(err => {
        reject({ signin: false, code: err.code, message: err.message, file: __line, file: __line })
      })
  })
}
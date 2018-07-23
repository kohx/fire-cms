// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin

const url = require('url')
const path = require('path')

// サインインしてからのリミット
const limit = 5 * 60

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

/* check middle ware */
module.exports.check = (req, res, next) => {

  console.log('-> sign check')

  // vesselがない場合
  if (req.vessel == null) {
    req.vessel = {}
  }

  // sign object
  const sign = {
    status: false,
    messae: '',
    claims: {},
  }

  // セッション Cookie を確認して権限をチェック
  let sessionCookie = false
  if (req.cookies.__session != null) {

    const session = JSON.parse(req.cookies.__session)
    if (session['sessionCookie'] != null) {

      sessionCookie = session['sessionCookie']
    }
  }

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

        // ユーザーが過去5分間にサインインしていない場合はリサインイン
        const now = new Date().getTime() / 1000 - decodedClaims.auth_time
        console.log('now->', now)
        console.log('limit->', limit)
        console.log('>', now >= limit)
        if (now >= limit) {

          sign.status = false
          sign.message = `sign in failed. recent sign in required. limit: ${limit}`
          req.vessel.sign = sign
          next()
        } else {

          sign.status = true
          sign.message = `sign in success.`
          sign.claims = decodedClaims
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
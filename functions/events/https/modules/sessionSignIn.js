/* firebase */const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin

/* express */
const url = require('url')
const path = require('path')

// Authorization HTTPヘッダーで渡されたFirebase IDトークンを検証するExpressミドルウェア
// Firebase IDトークンは、次のようにAuthorization HTTPヘッダーにBearerトークンとして渡す
// `Authorization: Bearer <Firebase ID Token>`.
// IDトークンの内容を`req.user`として追加する
module.exports.validateFirebaseIdToken = (req, res, next) => {

  const allows = ['/signin', '/favicon.ico'];

  const parse = {
    'headers.hosts': [
      req.headers['host'],              // us-central1-newfunctions-a8a25.cloudfunctions.net
      req.headers['x-forwarded-host'],  // newfunctions-a8a25.firebaseapp.com
      req.headers['x-forwarded-proto'], // https
      req.headers['x-original-url'],    // /profile/5
    ],
    url: req.url,
    params: req.params.id,
    path: req.path,
    url_basename: path.basename(req.url),
    path_basename: path.basename(req.path),
    protocol: req.protocol,
    host: req.get('host'),
    originalUrl: req.originalUrl,
    fullUrl: url.format({ protocol: req.protocol, host: req.get('host'), pathname: req.originalUrl })
  }
  console.log('@', parse)

  if (allows.includes(req.path)) {
    console.log('-> in allow !!')
    return next()
  }

  // console.log('csrf: ', req.cookies.csrfToken)

  // console.log('Check if request is authorized with Firebase ID token')
  const hasBearer = (req.headers.authorization && req.headers.authorization.startsWith('Bearer '))
  const hasSession = (req.cookies && req.cookies.__session)
  if (!hasBearer && !hasSession) {
    console.log('<-- Unauthorized [no bearer, no cookie]')
    res.redirect(`./signin?referrer=${req.path}`);
    return
  }

  let idToken
  if (hasBearer) {
    console.log('--> Found "Authorization" header')
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1]
  } else if (hasSession) {
    // console.log('--> Found "__session" cookie')
    // Read the ID Token from cookie.
    idToken = req.cookies.__session
  } else {
    // No cookie
    console.log('<-- Unauthorized [no cookie]')
    res.redirect(`./signin?referrer=${req.path}`);
    return
  }

  // トークンのデコード
  admin.auth().verifyIdToken(idToken)
    .then((decodedIdToken) => {
      // console.log('ID Token correctly decoded', decodedIdToken)
      // console.log('auth_time: ', decodedIdToken.auth_time)

      req.user = decodedIdToken
      return next()
    }).catch((error) => {
      console.log('<-- Unauthorized [verifying fail]')
      console.log('   | Error while verifying Firebase ID token:', error)
      res.redirect(`./signin?referrer=${req.path}`);
      return
    })
}
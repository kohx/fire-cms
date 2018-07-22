// httpOnly Cookieを使用するため、クライアントの状態を保持しない
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);

/* サインイン */
const signin = event => {
    firebase.auth()
        .signInWithEmailAndPassword('kohei0728@gmail.com', '1072551')
        .then(result => {
            const user = result.user
            // セッションCookieを交換するために必要なユーザーのIDトークンを取得
            return user.getIdToken()
                .then(idToken => {
                    // セッションログインエンドポイントが照会され、セッションクッキーが設定
                    // CSRFプロテクトのためのトークン
                    const csrfToken = document.querySelector('#csrfToken').textContent
                    return fetchServerSignin(idToken, csrfToken)
                })
        })
        .then(result => {
            // 永続性がNONEに設定されているため、ページのリダイレクトで十分
            firebase.auth().signOut()
            return result
        })
        .then(result => {

            if (result.signin) {
                // ui
                document.querySelector('#signin').disabled = true
                document.querySelector('#signout').disabled = false
                alert(result.message)
                alert(result.referrer)
                console.log(document.location.origin)
                // window.location.assign(result.referrer)
            } else {
                alert(result.message)
            }
        })
        .catch(err => {
           alert(err.message)
        })
}

// 非同期通信でサーバ側をログイン
function fetchServerSignin(idToken, csrfToken) {

    const url = `${window.location.origin}/serverSignIn`
    const referrer = document.referrer == '' ? '/' : document.referrer

    const headers = {
        'Authorization': 'Bearer ' + idToken,
        // 'Access-Control-Allow-Credentials': 'true',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }

    const body = {
        idToken: idToken,
        csrfToken: csrfToken
    }

    return new Promise((resolve, reject) => {
        fetch(url, {
                method: 'post',
                mode: 'cors',
                credentials: 'include',
                cache: 'no-cache',
                headers: headers,
                body: JSON.stringify(body)
            })
            .then(data => {
                return data.json()
            })
            .then(json => {
                json.referrer = referrer
                resolve(json)
            })
            .catch(err => {
                console.log(err)
                reject({
                    signin: false,
                    message: "network err.",
                    referrer
                })
            })
    })
}

/* サインアウト */
const signout = event => {
    firebase.auth().signOut()

    return fetchServerSignout()
        .then(result => {
            console.log(result)
            document.querySelector('#signin').disabled = false
            document.querySelector('#signout').disabled = true
        })
        .catch(err => {
            console.log(err)
        })
}

/* 非同期通信でサーバ側をサインアウト */
function fetchServerSignout() {
    const url = `${window.location.origin}/serverSignOut`

    const headers = {
        // 'Access-Control-Allow-Credentials': 'true',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }

    const body = {}

    return new Promise((resolve, reject) => {
        fetch(url, {
                method: 'post',
                mode: 'cors',
                credentials: 'include',
                cache: 'no-cache',
                headers: headers,
                body: JSON.stringify(body)
            })
            .then(data => {
                return data.json()
            })
            .then(json => {
                resolve(json)
            })
            .catch(err => {
                reject({
                    signin: true,
                    message: "network err."
                })
            })
    })
}

/* チェンジユーザ */
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        // document.querySelector('#signin').disabled = true
        // document.querySelector('#signout').disabled = false
    } else {
        // document.querySelector('#signin').disabled = false
        // document.querySelector('#signout').disabled = true
    }
})

/* イベント */
document.querySelector('#signin').addEventListener('click', signin)
document.querySelector('#signout').addEventListener('click', signout)
// httpOnly Cookieを使用するため、クライアントの状態を保持しない
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);

/* イベント */
const signinBtn = document.querySelector('#signin')
const signoutBtn = document.querySelector('#signout')

/* サインイン */
const signin = event => {

    const email = document.querySelector('#email').value
    const passwoard = document.querySelector('#password').value
    const signInUrl = `${window.location.origin}/{|backendFirstPath|}/sign-in`

    firebase.auth()
        .signInWithEmailAndPassword(email, passwoard)
        .then(result => {
            const user = result.user
            // セッションCookieを交換するために必要なユーザーのIDトークンを取得
            return user.getIdToken()
                .then(idToken => {
                    // セッションログインエンドポイントが照会され、セッションクッキーが設定
                    // CSRFプロテクトのためのトークン
                    const csrfToken = document.querySelector('#csrfToken').textContent

                    // create body
                    const body = {
                        idToken: idToken,
                        csrfToken: csrfToken
                    }

                    const addHeader = { 'Authorization': 'Bearer ' + idToken }

                    return fetchServerSignin(url, body, addHeader)
                })
        })
        .then(result => {
            // 永続性がNONEに設定されているため、ページのリダイレクトで十分
            firebase.auth().signOut()
            return result
        })
        .then(result => {
            if (result.status) {
                window.location.assign('/{|backendFirstPath|}')
                // ui
                // console.log(result)
                // document.querySelector('#signin').disabled = true
                // document.querySelector('#signout').disabled = false
                // document.querySelector('#signin_message').textContent = result.message
            } else {
                // サインインメッセージ
                console.log(result)
                document.querySelector('#signin_message').textContent = result.message
            }
        })
        .catch(err => {
            // エラーメッセージ
            document.querySelector('#signin_message').textContent = err.message
        })
}

// 非同期通信でサーバ側をログイン
function fetchServerSignin(url, body, addHeader) {

    fetchServer(url, body, addHeader)
        .then(data => {
            return data.json()
        })
        .then(json => {
            resolve(json)
        })
        .catch(err => {
            reject({
                status: true,
                message: "network err."
            })
        })

}

/* サインアウト */
const signout = event => {
    firebase.auth().signOut()

    return fetchServerSignout()
        .then(result => {
            if (result.status == false) {
                window.location.reload()
            }
            // document.querySelector('#signin').disabled = false
            // document.querySelector('#signout').disabled = true
        })
        .catch(err => {
            console.log(err)
        })
}

/* 非同期通信でサーバ側をサインアウト */
function fetchServerSignout() {

    const url = `${window.location.origin}/{|backendFirstPath|}/sign-out`

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
                    status: true,
                    message: "network err."
                })
            })
    })
}

if (signinBtn) {
    signinBtn.addEventListener('click', signin)
}

if (signoutBtn) {
    signoutBtn.addEventListener('click', signout)
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


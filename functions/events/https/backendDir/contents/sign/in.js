// httpOnly Cookieを使用するため、クライアントの状態を保持しない
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);

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


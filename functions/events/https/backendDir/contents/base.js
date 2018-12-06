export class Base {

    /**
     * constructor
     * 
     */
    constructor() {

        // httpOnly Cookieを使用するため、クライアントの状態を保持しない
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE)

        /* processing flag */
        this.processing = false;

        /* sign in */
        this.signInButton = document.querySelector('#sign_in_button')
        if (this.signInButton) {
            this.signInButton.addEventListener('click', event => {
                this.signIn(event)
            })
        }

        /* sign out */
        this.signOutButton = document.querySelector('#sign_out_button')
        if (this.signOutButton) {
            this.signOutButton.addEventListener('click', event => {
                this.signOut(event)
            })
        }

        /* target next */
        this.targetItemSelector = '.target_item'
        this.targetNext()

        /* notice */
        this.notice = document.querySelector('.notice')
        this.noticeTitle = document.querySelector('.notice-title')
        this.noticeMessages = document.querySelector('.notice-messages')
        this.noticeClose = document.querySelector('.notice-close')
        this.noticeClose.addEventListener('click', event => {
            this.closeNotice()
        })

        this.noticeTimer;
    }

    /**
     * init
     * 
     */
    static init() {
        return new Base()
    }

    /**
     * terget next
     * 
     * @param {string|null} selector 
     */
    targetNext(selector = null) {

        selector = selector != null ? selector : this.targetItemSelector
        const targetItems = document.querySelectorAll(selector)

        Object.keys(targetItems).forEach(key => {
            const element = targetItems[key]

            element.addEventListener('click', event => {

                const target = event.currentTarget
                const type = target.type
                const defaultValuet = target.dataset.default

                if (type === 'radio') {

                    /* if change valeu add _modified class */
                    if (defaultValuet != null && defaultValuet != target.value) {
                        this.setModifierClass(target.parentElement)
                        target.parentElement.classList.add('_modified')
                        console.log('change')
                    } else {
                        target.parentElement.classList.remove('_modified')
                        console.log('no change')
                    }
                }
            })

            element.addEventListener('keyup', event => {

                const target = event.currentTarget
                const type = target.type
                const defaultValuet = target.dataset.default

                if (type === 'text' || type === 'password' || type === 'email' || type === 'textarea') {

                    /* if change valeu add _modified class */
                    if (defaultValuet != null && defaultValuet != target.value) {
                        this.setModifierClass(target)
                        target.classList.add('_modified')
                    } else {
                        target.classList.remove('_modified')
                    }
                }


                /* if enter key up then next one focused */
                if (event.keyCode === 13) {

                    let nextItem = targetItems[0]

                    if ((targetItems.length - 1) > key) {
                        nextItem = targetItems[Number(key) + 1]
                    }

                    nextItem.focus()

                    if (nextItem.type === 'text' || nextItem.type === 'textarea') {
                        nextItem.setSelectionRange(-1, -1)
                    }
                }
            })
        })
    }

    /**
     * set modifier class
     * 
     * @param {object} element 
     * @param {string|null} code 
     * @param {number|null} cleareTime 
     */
    setModifierClass(element, code = null, cleareTime = null) {

        element.classList.remove('__info', '__success', '__warning', '__error')

        if (code != null) {
            element.classList.add(`__${code}`)

            if (cleareTime != null) {

                setTimeout(_ => {

                    element.classList.remove(`__${code}`)
                }, cleareTime)
            }
        }
    }

    /* notice */
    setNotice(code, messages, title = null, timeout = 6000) {
        this.clearNotice()

        clearTimeout(this.noticeTimer);

        title = title != null ? title : code.toUpperCase()
        this.noticeTitle.textContent = title

        messages.forEach(message => {
            const list = document.createElement('li');
            list.textContent = message
            this.noticeMessages.insertAdjacentElement('beforeend', list)
        });

        this.notice.classList.add(`__${code}`, '_active')

        this.noticeTimer = setTimeout(_ => {
            this.closeNotice()

            setTimeout(_ => {
                this.clearNotice()
            }, 100);

        }, timeout);
    }

    clearNotice() {
        this.notice.classList.remove('__info', '__success', '__warning', '__error')
        this.noticeTitle.textContent = null
        this.noticeMessages.textContent = null
    }

    closeNotice() {
        this.notice.classList.remove('_active')
    }

    /* get form object */
    getForm(formSelector) {
        let formObjects = {}
        const formElement = document.querySelector(formSelector)
        const formData = new FormData(formElement)
        for (var key of formData.keys()) {
            // TODO:: こっから！
            console.log(key.match(/.+\[\]/))
        }
        return formObjects
    }

    /* fetche */
    fetchServer(url, body = {}, addHeader = {}) {

        // default headers
        const defaultHeaders = {
            // 'Access-Control-Allow-Credentials': 'true',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }

        // merge defaultHeaders and addHeader
        const headers = Object.assign(defaultHeaders, addHeader)

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
                        code: 'error',
                        // message: "network err."
                        message: err.message,
                    })
                })
        })
    }

    /**
     * sign in
     */
    signIn(event) {

        // get target
        const target = event.currentTarget

        // processing then can't send request
        if (this.processing) {
            return
        }

        // start processing
        this.processing = true
        target.disabled = true;

        // get datas
        const email = document.querySelector('#email').value
        const passwoard = document.querySelector('#password').value
        const csrfToken = target.dataset.csrf_token
        const requestUrl = `${window.location.origin}/${target.dataset.request_url}`
        const backendUrl = `${window.location.origin}/${target.dataset.backend_url}`

        this.signInFunction(email, passwoard, csrfToken, requestUrl)
            .then(result => {
                if (result.code === 'success') {
                    // result status is true then send to backend top index
                    window.location.assign(backendUrl)
                } else {
                    // show
                    this.setNotice('error', [result.message], 'Signin failed')
                    this.processing = false
                    target.disabled = false
                }
            })
            .catch(err => {
                this.setNotice('error', [err.message], 'Signin error')
                this.processing = false
                target.disabled = false
            })
    }

    signInFunction(email, passwoard, csrfToken, requestUrl) {

        // auth sign in
        return firebase.auth().signInWithEmailAndPassword(email, passwoard)
            .then(result => {

                // get user from result
                const user = result.user

                // セッションCookieを交換するために必要なユーザーのIDトークンを取得
                return user.getIdToken()
                    .then(idToken => {

                        // set body
                        // idTokenとCSRFプロテクトのためのトークン
                        const body = {
                            idToken: idToken,
                            csrfToken: csrfToken
                        }

                        // set header
                        const addHeader = {
                            'Authorization': 'Bearer ' + idToken
                        }

                        // サーバに問い合わせ
                        // server sign in
                        return this.fetchServer(requestUrl, body, addHeader)
                    })
            })
            .then(result => {
                // 永続性がNONEに設定されているため、ページのリダイレクトで十分
                firebase.auth().signOut()
                return result
            })
            .then(result => {
                // result from signWare.in
                return result
            })
            .catch(err => {
                return ({
                    code: 'error',
                    message: err.message
                })
            })
    }

    /**
     * sign out
     * 
     * @param {object} event 
     */
    signOut(event) {

        // get target
        const target = event.currentTarget

        // processing then can't send request
        if (this.processing) {
            return
        }

        // start processing
        this.processing = true
        target.disabled = true

        // request url
        const requestUrl = target.dataset.request_url

        // auth sign out
        firebase.auth().signOut()
            .then(resutl => {
                // サーバに問い合わせ
                // server sign out
                this.fetchServer(requestUrl)
                    .then(result => {
                        // result from signWare.out
                        // success signout then reload
                        if (result.code === 'success') {
                            window.location.reload()
                        } else {
                            this.setNotice(result.code, [result.message], 'Signout failed')
                            this.processing = false
                            target.disabled = false
                        }
                    })
                    .catch(err => {
                        this.setNotice('error', [err.message], 'Signout failed')
                        this.processing = false
                        target.disabled = false
                    })
            })
            .catch(err => {
                this.setNotice('error', [err.message])
                this.processing = false
                target.disabled = false
            })
    }
}
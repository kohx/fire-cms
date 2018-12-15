export class Base {

    /**
     * constructor
     * 
     */
    constructor() {
        // httpOnly Cookieを使用するため、クライアントの状態を保持しない
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE)

        /* property */

        // prosessing flag
        this.processing = false

        // defaults
        this.defaults = this.getFormObject()

        // targets is emement tagname is input, select and textarea
        this.targets = document.querySelectorAll('input, select, textarea')

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

        /* add events */
        this.addEvents()

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

    /* get form object */
    getFormObject(key = null) {
        let formObjects = {}

        // get data from form
        const formElement = document.querySelector('form')
        const formData = new FormData(formElement)
        // itelator to array and unique
        let keys = Array.from(formData.keys()).filter(function (val, idx, arr) {
            return arr.indexOf(val) === idx;
        })

        keys.forEach(key => {
            let value = formData.get(key)
            const finded = key.match(/.+(\[\])/)
            if (finded != null) {
                // get first
                value = formData.getAll(key)
                // remove brakets
                key = key.replace('[]', '')
            }
            formObjects[key] = value
        })

        let reslt = formObjects
        if (key) {
            reslt = formObjects[key] != null ? formObjects[key] : null
        }

        return reslt
    }

    equalValue(one, two) {
        let result = null
        if (Array.isArray(one) && Array.isArray(two)) {
            result = JSON.stringify(one.sort()) === JSON.stringify(two.sort())
        } else {
            result = one == two
        }

        return result
    }

    /**
     * request server
     * 
     * @param {element} buttonElement 
     * @param {object} addObjectg 
     */
    requestServer(buttonElement, addObjectg = {}) {

        // processing then can't send request
        if (this.processing) {
            return
        }

        // get button data
        const requestUrl = `${window.location.origin}/${buttonElement.dataset.request_url}`

        // prosess start
        this.processing = true

        // disable button element
        buttonElement.disabled = true

        // get modified form data
        const modifieds = this.getFormObject()

        // check modified value and get it
        let updateValues = {}
        Object.keys(this.defaults).forEach(key => {
            const defaultValue = this.defaults[key]
            const modifiedValue = modifieds[key]

            // if value modified set to result
            if (!this.equalValue(defaultValue, modifiedValue)) {
                updateValues[key] = modifiedValue
            }
        })

        // if all value not modify then show notice and reset button 
        if (Object.keys(updateValues).length === 0) {
            this.setNotice('warning', ['Nothing has changed.'])
            this.processing = false
            buttonElement.disabled = false
            return
        }

        // additional data merge
        updateValues = Object.assign(updateValues, addObjectg)

        // request to server
        this.fetchServer(requestUrl, updateValues)
            .then(result => {
                
                // get code
                const code = result.code

                // get body
                const body = result.body

                // get message
                let messages = []
                result.messages.forEach(message => {

                    // rebuild message
                    messages.push(message.content)

                    // get message key
                    let key = message.key

                    // get selector from message key
                    let selector = (key = !null) ? `#${message.key}` : false

                    // has selector
                    if (selector) {

                        // get target element
                        const element = document.querySelector(selector)

                        // code is success
                        if (code === 'success') {

                            // set new value to default
                            this.defaults[key] = body[key]
                            element.classList.remove('_modified')

                            // set modifier class success whith clear time
                            this.setModifierClass(element, code, 4000)

                        } else {
                            if (element) {
                                // set modifier class error or warning
                                this.setModifierClass(element, code)
                            }
                        }
                    }
                })

                console.log(this.defaults)

                // set notice
                this.setNotice(result.code, messages)

                // end process
                this.processing = false
                buttonElement.disabled = false;
            })
            .catch(err => {

                this.setNotice('error', [err.message])
                console.log(err)

                // end process
                this.processing = false
                buttonElement.disabled = false;
            })

        return updateValues
    }

    modifyValue(event) {
        const target = event.currentTarget
        const key = target.name.replace('[]', '')

        const defaultValue = this.defaults[key]
        const modifiedValue = this.getFormObject(key)

        const modified = !this.equalValue(defaultValue, modifiedValue)

        const elements = document.querySelectorAll(`[name="${target.name}"]`)

        elements.forEach(element => {
            if (modified) {
                this.setModifierClass(element)
                element.classList.add('_modified')
            } else {
                element.classList.remove('_modified')
            }
        })
    }

    toNext(event, key) {
        /* if enter key up then next one focused */
        if (event.keyCode === 13) {

            let next = this.targets[0]

            if ((this.targets.length - 1) > key) {
                next = this.targets[Number(key) + 1]
            }

            if (event.currentTarget.type !== 'textarea') {
                next.focus()
            }

            if (next.type === 'text' || next.type === 'textarea') {
                next.setSelectionRange(-1, -1)
            }
        }
    }

    /**
     * add events
     * 
     * @param {string|null} selector 
     */
    addEvents() {
        Object.keys(this.targets).forEach(key => {
            const element = this.targets[key]

            // add event click
            element.addEventListener('keyup', event => {
                this.modifyValue(event)
                this.toNext(event, key)
            })

            // add event keyup
            element.addEventListener('click', event => {
                this.modifyValue(event)
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
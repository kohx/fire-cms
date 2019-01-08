export class Base {

    /**
     * constructor
     * 
     */
    constructor() {
        // httpOnly Cookieを使用するため、クライアントの状態を保持しない
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE)

        /* property */

        this.showTime = 6000

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
        this.addTargetEvents()

        /* add plus minus ibent */
        const minusElements = document.querySelectorAll('.minus')
        minusElements.forEach(minusElement => {
            minusElement.addEventListener('click', minusEvent => {
                minusEvent.currentTarget.parentElement.remove()
            })
        })

        const plusElements = document.querySelectorAll('.plus')
        plusElements.forEach(plusElement => {
            plusElement.addEventListener('click', event => {
                const element = event.currentTarget.nextElementSibling
                const copy = element.cloneNode(true)
                const minusElement = document.createElement('i')
                minusElement.classList.add('fas', 'fa-minus-circle')
                minusElement.addEventListener('click', minusEvent => {
                    minusEvent.currentTarget.parentElement.remove()
                })
                copy.querySelector('input').value = ''
                copy.insertAdjacentElement('afterbegin', minusElement)
                element.parentElement.insertAdjacentElement('beforeend', copy)
            })
        })

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
     * get form object
     * 
     * @param {string} key 
     * @returns {*}
     */
    getFormObject(key = null) {
        // get elements
        const elements = document.querySelectorAll('input, select, textarea')

        let formObjects = {}
        elements.forEach(element => {
            // key is element name
            let key = element.name
            const type = element.type
            let value = ''

            // if radio or chackbox then get checked
            if (['radio', 'checkbox'].includes(type)) {
                if (element.checked) {
                    value = element.value
                }
            }
            // if select-multiple then get option selected
            else if (type === 'select-multiple') {
                value = []
                element.querySelectorAll('option').forEach(option => {
                    if (option.selected) {
                        value.push(option.value)
                    }
                })
            }
            // othe then value
            else {
                value = element.value
            }

            // if 
            if (formObjects.hasOwnProperty(key)) {
                if (Array.isArray(formObjects[key])) {
                    formObjects[key].push(value)
                } else {
                    if (type === 'radio') {
                        if (value !== '') {
                            formObjects[key] = value
                        }
                    } else {
                        formObjects[key] = [formObjects[key], value]
                    }
                }
            } else {
                formObjects[key] = value
            }
        })

        Object.keys(formObjects).forEach(key => {
            if (Array.isArray(formObjects[key])) {
                formObjects[key] = formObjects[key].filter(value => {
                    return value !== "";
                })
            }
        })

        return key ? formObjects[key] : formObjects
    }

    /**
     * check value one is equal value two
     * 
     * @param {mix} one 
     * @param {mix} two 
     * @returns {boolean}
     */
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
     * add class _modified to element
     * 
     * @param {object} event 
     */
    modifyValue(event) {
        const target = event.currentTarget
        const key = target.name
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

    /**
     * to next element
     * 
     * @param {object} event 
     * @param {number} key 
     */
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
    addTargetEvents() {
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

    /**
     * notice
     * 
     * @param {String} code 
     * @param {String|Array} messages 
     * @param {String} title 
     * @param {Number} timeout 
     */
    setNotice(code, messages, title = null, timeout = this.showTime) {
        this.clearNotice()

        clearTimeout(this.noticeTimer);

        title = title != null ? title : code.toUpperCase()
        this.noticeTitle.textContent = title

        if(typeof messages === 'string') {
            messages = [messages]
        }

        messages.forEach(message => {
            const list = document.createElement('li')
            console.log(message)
            list.textContent = message.content
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

    /**
     * fetche
     * 
     * @param {String} url 
     * @param {Object} body 
     * @param {Object} addHeader 
     */
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
     * request server
     * 
     * @param {Object} buttonElement 
     * @param {Boolean} [sendAll = true] 
     */
    requestServer(buttonElement, sendAll = true) {

        // processing then can't send request
        if (this.processing) {
            return
        }

        // get button data
        const data = buttonElement.dataset
        const requestUrl = data.request_url != null ? `${window.location.origin}/${data.request_url}` : null
        const redirectUrl = data.redirect_url != null ? `${window.location.origin}/${data.redirect_url}` : null
        const id = data.id != null ? data.id : null

        // prosess start
        this.processing = true

        // disable button element
        buttonElement.disabled = true

        // get present value form data
        const presents = this.getFormObject()

        console.log(presents)

        // modified value
        let modifiedValues = {}

        // if sendAll is true then send all value
        if (sendAll) {
            modifiedValues = presents
        } else {
            // check modified value and get it
            Object.keys(this.defaults).forEach(key => {
                const defaultValue = this.defaults[key]
                const modifiedValue = presents[key]

                // if value modified set to result
                if (!this.equalValue(defaultValue, modifiedValue)) {
                    modifiedValues[key] = modifiedValue
                }
            })

            // if all value not modify then show notice and reset button 
            if (Object.keys(modifiedValues).length === 0) {
                this.setNotice('warning', 'Nothing has changed.')
                this.processing = false
                buttonElement.disabled = false
                return
            }
        }

        // add id
        if(id){
            modifiedValues.id = id
        }

        // request to server
        this.fetchServer(requestUrl, modifiedValues)
            .then(result => {

                console.log(result)

                // get code
                const code = result.code
                // get values
                const values = result.values
                // get effect
                const effect = result.effect

                if (code === 'success' && effect != null) {
                    if (effect.mode === 'create' && effect.id != null && redirectUrl) {
                        // redirect to
                        window.location.assign(`${redirectUrl}/${effect.id}`)
                        return
                    }
                     
                    if (effect.mode === 'delete' && effect.id != null) {
                        const target = document.querySelector(`#id_${effect.id}`)
                        if (target) {
                            target.classList.add('__success');
                            setTimeout(() => {
                                target.remove()
                            }, 1000);
                        }
                    }
                    
                    if (effect.mode === 'signout') {
                        window.location.reload()
                    }
                }

                // set notice
                this.setNotice(result.code, result.messages)

                // get message
                result.messages.forEach(message => {
                    
                    // get message key
                    let key = message.key

                    // get selector from message key
                    let selector = key != null ? `[name="${message.key}"]` : false

                    // has selector
                    if (selector) {

                        // get target element
                        const elements = document.querySelectorAll(selector)

                        elements.forEach(element => {
                            // code is success
                            if (code === 'success') {

                                // set new value to default
                                this.defaults[key] = values[key]

                                // remove class
                                element.classList.remove('_modified')

                                // set modifier class success whith clear time
                                this.setModifierClass(element, code, this.showTime)
                            } else {
                                if (element) {
                                    // set modifier class error or warning
                                    this.setModifierClass(element, code)
                                }
                            }
                        })
                    }
                })

                // end process
                this.processing = false
                buttonElement.disabled = false;
            })
            .catch(err => {

                this.setNotice('error', err.message)
                console.log(err)

                // end process
                this.processing = false
                buttonElement.disabled = false;
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

                console.log(result)


                if (result.code === 'success') {
                    // result status is true then send to backend top index
                    window.location.assign(backendUrl)
                } else {
                    // show
                    this.setNotice(result.code, result.messages, 'Signout failed')
                    this.processing = false
                    target.disabled = false
                }
            })
            .catch(err => {
                console.log('in error !')

                this.setNotice('error', err.message, 'Signin error')
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
                console.log('ininin')
                this.setNotice('error', err.message, 'Signin error')
                return
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
                            console.log(result)
                            this.setNotice(result.code, result.messages, 'Signout failed')
                            this.processing = false
                            target.disabled = false
                        }

                    })
                    .catch(err => {
                        this.setNotice('error', err.message, 'Signout failed')
                        this.processing = false
                        target.disabled = false
                    })
            })
            .catch(err => {
                this.setNotice('error', err.message, 'Signout failed')
                this.processing = false
                target.disabled = false
            })
    }
}
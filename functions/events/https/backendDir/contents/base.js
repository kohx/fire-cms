export class Base {

    /**
     * constructor
     * 
     */
    constructor() {
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

            element.addEventListener('keyup', event => {
                event.target.classList.remove('_modified', '__warning', '__success')

                /* if change valeu add _modified class */
                console.log(event.target.dataset.default)
                if (event.target.dataset.default != event.target.value) {
                    event.target.classList.remove('__warning', '__success')
                    event.target.classList.add('_modified')
                } else {
                    event.target.classList.remove('_modified')
                }

                /* if enter key up then next one focused */
                if (event.keyCode === 13) {

                    let nextItem = targetItems[0]
                    if ((targetItems.length - 1) > key) {
                        nextItem = targetItems[Number(key) + 1]
                    }

                    nextItem.focus()

                    if (nextItem.tagName !== 'BUTTON') {
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
     * @param {string|null} type 
     * @param {number|null} cleareTime 
     */
    setModifierClass(element, type = null, cleareTime = null) {

        element.classList.remove('__info', '__success', '__warning', '__error')

        if (type != null) {
            element.classList.add(`__${type}`)

            if (cleareTime != null) {

                setTimeout(_ => {

                    element.classList.remove(`__${type}`)
                }, cleareTime)
            }
        }
    }

    /* notice */
    setNotice(type, messages, title = null, timeout = 6000) {
        this.clearNotice()

        clearTimeout(this.noticeTimer);

        title = title != null ? title : type.toUpperCase()
        this.noticeTitle.textContent = title

        messages.forEach(message => {
            const list = document.createElement('li');
            list.textContent = message
            this.noticeMessages.insertAdjacentElement('beforeend', list)
        });

        this.notice.classList.add(`__${type}`, '_active')

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
                        status: true,
                        message: "network err."
                    })
                })
        })
    }

    /**
     * sign in
     */
    signIn() {

        // processing then can't send request
        if (this.processing) {
            return
        }

        // start processing
        this.processing = true
        event.currentTarget.disabled = true;

        // get datas
        const email = document.querySelector('#email').value
        const passwoard = document.querySelector('#password').value
        const target = event.currentTarget
        const csrfToken = target.dataset.csrf_token
        const requestUrl = target.dataset.request_url
        const backendUrl = target.dataset.backend_url

        
    }

    /**
     * sign out
     * 
     * @param {object} event 
     */
    signOut(event) {

        // processing then can't send request
        if (this.processing) {
            return
        }

        // start processing
        this.processing = true
        event.currentTarget.disabled = true;

        // request url
        const requestUrl = event.currentTarget.dataset.request_url

        // auth sign out
        firebase.auth().signOut()

        // サーバに問い合わせ
        // server sign out
        this.fetchServer(requestUrl)
            .then(result => {

                // success signout then reload
                if (result.status == false) {
                    window.location.reload()
                }
            })
            .catch(err => {

                this.setNotice('error', [err.message])
            })
    }
}